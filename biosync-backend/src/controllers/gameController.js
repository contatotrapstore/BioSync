const { supabase } = require('../config/supabase');
const path = require('path');
const fs = require('fs').promises;

// Get all games
exports.getAllGames = async (req, res, next) => {
  try {
    const { category, isActive, search } = req.query;

    let query = supabase
      .from('games')
      .select('*');

    if (category) query = query.eq('category', category);
    if (isActive !== undefined) query = query.eq('is_active', isActive === 'true');
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: games, error } = await query.order('order', { ascending: true }).order('name', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: { games, count: games.length }
    });
  } catch (error) {
    next(error);
  }
};

// Get games accessible by current user
exports.getUserGames = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all active games
    const { data: allGames, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true })
      .order('name', { ascending: true });

    if (gamesError) throw gamesError;

    // Get games from active subscription
    const { data: activeSubscription } = await supabase
      .from('user_subscriptions')
      .select('*, plan_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString())
      .single();

    let subscriptionGameIds = [];
    if (activeSubscription) {
      const { data: planGames } = await supabase
        .from('plan_games')
        .select('game_id')
        .eq('plan_id', activeSubscription.plan_id);

      subscriptionGameIds = planGames ? planGames.map(pg => pg.game_id) : [];
    }

    // Get individual game access
    const { data: individualAccess } = await supabase
      .from('user_game_access')
      .select('game_id')
      .eq('user_id', userId)
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`);

    const individualGameIds = individualAccess ? individualAccess.map(ug => ug.game_id) : [];

    // Combine and mark accessible games
    const gamesWithAccess = allGames.map(game => ({
      ...game,
      hasAccess: subscriptionGameIds.includes(game.id) || individualGameIds.includes(game.id),
      accessType: subscriptionGameIds.includes(game.id) ? 'subscription' :
                   individualGameIds.includes(game.id) ? 'individual' : null
    }));

    res.json({
      success: true,
      data: {
        games: gamesWithAccess,
        subscription: activeSubscription ? {
          planId: activeSubscription.plan_id,
          endDate: activeSubscription.end_date
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single game by ID
exports.getGameById = async (req, res, next) => {
  try {
    const { data: game, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    const userId = req.user?.id;
    let hasAccess = false;
    let accessType = null;
    let accessExpiresAt = null;

    if (req.user?.isAdmin) {
      hasAccess = true;
      accessType = 'admin';
    } else if (userId) {
      const nowIso = new Date().toISOString();

      const { data: activeSubscription, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('plan_id, end_date')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gte('end_date', nowIso)
        .maybeSingle();

      if (subscriptionError) {
        throw subscriptionError;
      }

      if (activeSubscription) {
        const { data: planGame, error: planError } = await supabase
          .from('plan_games')
          .select('game_id')
          .eq('plan_id', activeSubscription.plan_id)
          .eq('game_id', game.id)
          .maybeSingle();

        if (planError) {
          throw planError;
        }

        if (planGame) {
          hasAccess = true;
          accessType = 'subscription';
          accessExpiresAt = activeSubscription.end_date;
        }
      }

      if (!hasAccess) {
        const { data: individualAccess, error: accessError } = await supabase
          .from('user_game_access')
          .select('expires_at')
          .eq('user_id', userId)
          .eq('game_id', game.id)
          .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
          .maybeSingle();

        if (accessError) {
          throw accessError;
        }

        if (individualAccess) {
          hasAccess = true;
          accessType = 'individual';
          accessExpiresAt = individualAccess.expires_at;
        }
      }
    }

    const gameWithAccess = {
      ...game,
      hasAccess,
      accessType,
      accessExpiresAt
    };

    res.json({
      success: true,
      data: { game: gameWithAccess }
    });
  } catch (error) {
    next(error);
  }
};

// Validate game access for user
exports.validateAccess = async (req, res, next) => {
  try {
    const { id: gameId } = req.params;
    const userId = req.user.id;

    // Check if game exists and is active
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .eq('is_active', true)
      .single();

    if (gameError || !game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found or inactive',
        hasAccess: false
      });
    }

    // Check subscription access
    const { data: activeSubscription } = await supabase
      .from('user_subscriptions')
      .select('plan_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString())
      .single();

    let hasAccess = false;

    if (activeSubscription) {
      const { data: planGame } = await supabase
        .from('plan_games')
        .select('*')
        .eq('plan_id', activeSubscription.plan_id)
        .eq('game_id', gameId)
        .single();

      if (planGame) hasAccess = true;
    }

    // Check individual access
    if (!hasAccess) {
      const { data: individualAccess } = await supabase
        .from('user_game_access')
        .select('*')
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
        .single();

      if (individualAccess) hasAccess = true;
    }

    // Log access attempt
    if (hasAccess) {
      await supabase
        .from('access_history')
        .insert({
          user_id: userId,
          game_id: gameId,
          ip_address: req.ip || req.connection.remoteAddress
        });
    }

    res.json({
      success: true,
      data: {
        hasAccess,
        game: hasAccess ? game : null,
        message: hasAccess ? 'Access granted' : 'Access denied'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new game (Admin only)
exports.createGame = async (req, res, next) => {
  try {
    const {
      name, slug, description, folderPath, category, coverImage, order,
      version, downloadUrl, fileSize, checksum, installerType, minimumDiskSpace, coverImageLocal
    } = req.body;

    const { data: game, error } = await supabase
      .from('games')
      .insert({
        name,
        slug,
        description,
        folder_path: folderPath,
        category,
        cover_image: coverImage,
        cover_image_local: coverImageLocal,
        order: order || 0,
        version: version || '1.0.0',
        download_url: downloadUrl,
        file_size: fileSize,
        checksum,
        installer_type: installerType || 'exe',
        minimum_disk_space: minimumDiskSpace
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Game created successfully',
      data: { game }
    });
  } catch (error) {
    next(error);
  }
};

// Update game (Admin only)
exports.updateGame = async (req, res, next) => {
  try {
    const { data: game, error: findError } = await supabase
      .from('games')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (findError || !game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    const {
      name, slug, description, folderPath, category, coverImage, coverImageLocal,
      version, downloadUrl, fileSize, checksum, installerType, minimumDiskSpace,
      isActive, order
    } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (slug) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (folderPath) updateData.folder_path = folderPath;
    if (category) updateData.category = category;
    if (coverImage !== undefined) updateData.cover_image = coverImage;
    if (coverImageLocal !== undefined) updateData.cover_image_local = coverImageLocal;
    if (version) updateData.version = version;
    if (downloadUrl !== undefined) updateData.download_url = downloadUrl;
    if (fileSize !== undefined) updateData.file_size = fileSize;
    if (checksum !== undefined) updateData.checksum = checksum;
    if (installerType) updateData.installer_type = installerType;
    if (minimumDiskSpace !== undefined) updateData.minimum_disk_space = minimumDiskSpace;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (order !== undefined) updateData.order = order;

    const { data: updatedGame, error } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Game updated successfully',
      data: { game: updatedGame }
    });
  } catch (error) {
    next(error);
  }
};

// Delete game (Admin only)
exports.deleteGame = async (req, res, next) => {
  try {
    const { data: game, error: findError } = await supabase
      .from('games')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (findError || !game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Game deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get game categories
exports.getCategories = async (req, res, next) => {
  try {
    const { data: games, error } = await supabase
      .from('games')
      .select('category')
      .not('category', 'is', null);

    if (error) throw error;

    const categories = [...new Set(games.map(g => g.category))].filter(Boolean);

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
};

