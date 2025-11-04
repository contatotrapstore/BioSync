const { supabase } = require('../config/supabase');
const path = require('path');
const fs = require('fs').promises;

const VALID_PLATFORMS = ['pc', 'mobile', 'web'];

const normalizeSupportedPlatforms = (input, { defaultOnEmpty = true, returnNullOnUndefined = false } = {}) => {
  if (input === undefined) {
    return returnNullOnUndefined ? null : (defaultOnEmpty ? ['pc', 'mobile'] : null);
  }

  if (input === null || input === '') {
    return defaultOnEmpty ? ['pc', 'mobile'] : null;
  }

  let platforms = input;

  if (typeof platforms === 'string') {
    const trimmed = platforms.trim();
    if (!trimmed) {
      return defaultOnEmpty ? ['pc', 'mobile'] : null;
    }

    try {
      platforms = JSON.parse(trimmed);
    } catch (error) {
      platforms = trimmed
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    }
  }

  if (!Array.isArray(platforms)) {
    platforms = [platforms];
  }

  const sanitized = [...new Set(
    platforms
      .map((value) => (typeof value === 'string' ? value.trim().toLowerCase() : ''))
      .filter(Boolean)
  )].filter((platform) => VALID_PLATFORMS.includes(platform));

  if (sanitized.length === 0) {
    return defaultOnEmpty ? ['pc', 'mobile'] : null;
  }

  return sanitized;
};

// Get all games
exports.getAllGames = async (req, res, next) => {
  try {
    const { category, isActive, search, platform } = req.query;

    const platformFilter = platform ? platform.toLowerCase() : null;

    let query = supabase
      .from('games')
      .select('*');

    if (category) query = query.eq('category', category);
    if (isActive !== undefined) query = query.eq('is_active', isActive === 'true');
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    // Filter by platform if specified
    if (platformFilter && VALID_PLATFORMS.includes(platformFilter)) {
      query = query.contains('supported_platforms', [platformFilter]);
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
    const { platform } = req.query;

    const platformFilter = platform ? platform.toLowerCase() : null;

    // Get all active games
    let query = supabase
      .from('games')
      .select('*')
      .eq('is_active', true);

    // Filter by platform if specified
    if (platformFilter && VALID_PLATFORMS.includes(platformFilter)) {
      query = query.contains('supported_platforms', [platformFilter]);
    }

    const { data: allGames, error: gamesError } = await query
      .order('order', { ascending: true })
      .order('name', { ascending: true });

    if (gamesError) throw gamesError;

    // Check Asaas subscription (primary method)
    const { data: asaasSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    let hasActiveSubscription = !!asaasSubscription;

    // Get individual game access (fallback or additional grants)
    const { data: individualAccess } = await supabase
      .from('user_game_access')
      .select('game_id, expires_at')
      .eq('user_id', userId)
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`);

    const individualAccessMap = new Map();
    if (individualAccess) {
      individualAccess.forEach((item) => {
        individualAccessMap.set(item.game_id, item.expires_at || null);
      });
    }

    const subscriptionExpiresAt = asaasSubscription
      ? asaasSubscription.next_due_date || asaasSubscription.nextDueDate || null
      : null;

    // Mark accessible games
    const gamesWithAccess = allGames.map(game => ({
      ...game,
      hasAccess: hasActiveSubscription || individualAccessMap.has(game.id),
      accessType: hasActiveSubscription ? 'subscription' :
                   individualAccessMap.has(game.id) ? 'individual' : null,
      accessExpiresAt: hasActiveSubscription
        ? subscriptionExpiresAt
        : (individualAccessMap.get(game.id) || null)
    }));

    res.json({
      success: true,
      data: {
        games: gamesWithAccess,
        subscription: asaasSubscription ? {
          status: asaasSubscription.status,
          planValue: asaasSubscription.plan_value,
          nextDueDate: asaasSubscription.next_due_date
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
        .from('subscriptions')
        .select('id, status, next_due_date')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        throw subscriptionError;
      }

      if (activeSubscription) {
        hasAccess = true;
        accessType = 'subscription';
        accessExpiresAt = activeSubscription.next_due_date || null;
      } else {
        const { data: individualAccess, error: accessError } = await supabase
          .from('user_game_access')
          .select('expires_at')
          .eq('user_id', userId)
          .eq('game_id', game.id)
          .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
          .maybeSingle();

        if (accessError && accessError.code !== 'PGRST116') {
          throw accessError;
        }

        if (individualAccess) {
          hasAccess = true;
          accessType = 'individual';
          accessExpiresAt = individualAccess.expires_at || null;
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

    const nowIso = new Date().toISOString();

    const { data: activeSubscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('id, status, next_due_date')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      throw subscriptionError;
    }

    let hasAccess = false;
    let accessType = null;

    if (activeSubscription) {
      hasAccess = true;
      accessType = 'subscription';
    } else {
      const { data: individualAccess, error: accessError } = await supabase
        .from('user_game_access')
        .select('expires_at')
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
        .maybeSingle();

      if (accessError && accessError.code !== 'PGRST116') {
        throw accessError;
      }

      if (individualAccess) {
        hasAccess = true;
        accessType = 'individual';
      }
    }

    if (hasAccess) {
      await supabase
        .from('access_history')
        .insert({
          user_id: userId,
          game_id: gameId,
          ip_address: req.ip || null
        });
    }

    res.json({
      success: true,
      data: {
        hasAccess,
        accessType,
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
      version, downloadUrl, fileSize, checksum, installerType, minimumDiskSpace, coverImageLocal,
      supportedPlatforms
    } = req.body;

    const platformList = normalizeSupportedPlatforms(supportedPlatforms);

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
        minimum_disk_space: minimumDiskSpace,
        supported_platforms: platformList
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
      isActive, order, supportedPlatforms
    } = req.body;

    const platformList = normalizeSupportedPlatforms(supportedPlatforms, {
      defaultOnEmpty: false,
      returnNullOnUndefined: true
    });

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
    if (platformList) updateData.supported_platforms = platformList;

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
