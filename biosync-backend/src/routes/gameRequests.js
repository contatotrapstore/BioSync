const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Criar nova requisição de jogo (usuário)
router.post('/', authenticate, async (req, res) => {
  try {
    const { game_id, request_message } = req.body;
    const user_id = req.user.id;

    // Verificar se já existe uma requisição pendente para este jogo
    const { data: existingRequest } = await supabase
      .from('game_requests')
      .select('*')
      .eq('user_id', user_id)
      .eq('game_id', game_id)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return res.status(400).json({
        message: 'Você já possui uma requisição pendente para este jogo'
      });
    }

    // Criar nova requisição
    const { data, error } = await supabase
      .from('game_requests')
      .insert([{
        user_id,
        game_id,
        request_message: request_message || '',
        status: 'pending'
      }])
      .select(`
        *,
        user:users!game_requests_user_id_fkey(id, email, full_name),
        game:games(id, name, slug, cover_image)
      `)
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao criar requisição:', error);
    res.status(500).json({ message: 'Erro ao criar requisição de jogo' });
  }
});

// Listar requisições (admin vê todas, usuário vê apenas as suas)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const isAdminUser = req.user.isAdmin;

    let query = supabase
      .from('game_requests')
      .select(`
        *,
        user:users!game_requests_user_id_fkey(id, email, full_name),
        game:games(id, name, slug, cover_image),
        reviewer:users!game_requests_reviewed_by_fkey(id, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Se não for admin, mostrar apenas as requisições do usuário
    if (!isAdminUser) {
      query = query.eq('user_id', req.user.id);
    }

    // Filtrar por status se fornecido
    if (status) {
      query = query.eq('status', status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      requests: data,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Erro ao listar requisições:', error);
    res.status(500).json({ message: 'Erro ao listar requisições' });
  }
});

// Contar requisições pendentes (apenas admin)
router.get('/pending/count', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('game_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) throw error;

    res.json({ count });
  } catch (error) {
    console.error('Erro ao contar requisições:', error);
    res.status(500).json({ message: 'Erro ao contar requisições pendentes' });
  }
});

// Aprovar ou rejeitar requisição (apenas admin)
router.patch('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_response } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: 'Status inválido. Use "approved" ou "rejected"'
      });
    }

    // Buscar a requisição
    const { data: request, error: fetchError } = await supabase
      .from('game_requests')
      .select('*, user:users!game_requests_user_id_fkey(id), game:games(id)')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({ message: 'Requisição não encontrada' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        message: 'Esta requisição já foi processada'
      });
    }

    // Atualizar requisição
    const { data: updatedRequest, error: updateError } = await supabase
      .from('game_requests')
      .update({
        status,
        admin_response: admin_response || null,
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        user:users!game_requests_user_id_fkey(id, email, full_name),
        game:games(id, name, slug, cover_image),
        reviewer:users!game_requests_reviewed_by_fkey(id, email)
      `)
      .single();

    if (updateError) throw updateError;

    // Se aprovado, liberar TODOS os jogos para o usuário
    if (status === 'approved') {
      // Buscar todos os jogos ativos
      const { data: allGames, error: gamesError } = await supabase
        .from('games')
        .select('id')
        .eq('is_active', true);

      if (gamesError) {
        console.error('Erro ao buscar jogos:', gamesError);
      } else if (allGames && allGames.length > 0) {
        // Criar acesso para todos os jogos
        const gameAccesses = allGames.map(game => ({
          user_id: request.user.id,
          game_id: game.id,
          granted_by: req.user.id,
          granted_at: new Date().toISOString()
        }));

        const { error: accessError } = await supabase
          .from('user_game_access')
          .upsert(gameAccesses, {
            onConflict: 'user_id,game_id',
            ignoreDuplicates: false
          });

        if (accessError) {
          console.error('Erro ao criar acesso aos jogos:', accessError);
        } else {
          console.log(`✅ Liberados ${allGames.length} jogos para o usuário ${request.user.id}`);
        }
      }
    }

    // Adicionar informação sobre jogos liberados na resposta
    const response = {
      ...updatedRequest,
      message: status === 'approved'
        ? 'Requisição aprovada! Todos os jogos foram liberados para este usuário.'
        : 'Requisição rejeitada.'
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao atualizar requisição:', error);
    res.status(500).json({ message: 'Erro ao processar requisição' });
  }
});

// Cancelar requisição (usuário pode cancelar sua própria requisição pendente)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Buscar requisição
    const { data: request, error: fetchError } = await supabase
      .from('game_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({ message: 'Requisição não encontrada' });
    }

    // Verificar se o usuário pode deletar (apenas suas próprias ou se for admin)
    if (request.user_id !== user_id && !req.user.isAdmin) {
      return res.status(403).json({
        message: 'Você não tem permissão para cancelar esta requisição'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        message: 'Apenas requisições pendentes podem ser canceladas'
      });
    }

    const { error: deleteError } = await supabase
      .from('game_requests')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.json({ message: 'Requisição cancelada com sucesso' });
  } catch (error) {
    console.error('Erro ao cancelar requisição:', error);
    res.status(500).json({ message: 'Erro ao cancelar requisição' });
  }
});

module.exports = router;
