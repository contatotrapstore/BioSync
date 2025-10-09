import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Alert,
  Snackbar,
  CircularProgress,
  TextField,
  InputAdornment
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { gamesAPI } from '../services/api';
import GameCard from '../components/GameCard';
import GameForm from '../components/GameForm';

const Games = () => {
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredGames(games);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = games.filter((game) => {
      return (
        game.name.toLowerCase().includes(query) ||
        game.description.toLowerCase().includes(query) ||
        game.category.toLowerCase().includes(query)
      );
    });
    setFilteredGames(filtered);
  }, [searchQuery, games]);

  const fetchGames = async () => {
    setLoading(true);
    setError('');

    try {
      const { games: fetchedGames } = await gamesAPI.getAll();
      setGames(fetchedGames);
      setFilteredGames(fetchedGames);
    } catch (err) {
      console.error('Error fetching games:', err);
      setError(err.response?.data?.message || err.message || 'Falha ao carregar jogos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (game = null) => {
    setEditingGame(game);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setEditingGame(null);
    setOpenForm(false);
  };

  const handleSaveGame = async (gameData) => {
    try {
      if (editingGame) {
        const updatedGame = await gamesAPI.update(editingGame.id, gameData);
        setGames((prev) => prev.map((game) => (game.id === updatedGame.id ? updatedGame : game)));
        showSnackbar('Jogo atualizado com sucesso', 'success');
      } else {
        const newGame = await gamesAPI.create(gameData);
        setGames((prev) => [...prev, newGame]);
        showSnackbar('Jogo criado com sucesso', 'success');
      }
      handleCloseForm();
    } catch (err) {
      console.error('Error saving game:', err);
      showSnackbar(err.response?.data?.message || err.message || 'Falha ao salvar jogo', 'error');
    }
  };

  const handleDeleteGame = async (gameId) => {
    if (!window.confirm('Tem certeza que deseja excluir este jogo?')) {
      return;
    }

    try {
      await gamesAPI.delete(gameId);
      setGames((prev) => prev.filter((game) => game.id !== gameId));
      showSnackbar('Jogo excluído com sucesso', 'success');
    } catch (err) {
      console.error('Error deleting game:', err);
      showSnackbar(err.response?.data?.message || err.message || 'Falha ao excluir jogo', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Gerenciamento de Jogos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie todos os jogos do sistema
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
          size="large"
        >
          Adicionar Jogo
        </Button>
      </Box>

      <TextField
        fullWidth
        placeholder="Buscar jogos por nome, descrição ou categoria..."
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          )
        }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 0 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredGames.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 0 }}>
          {searchQuery ? 'Nenhum jogo encontrado para sua busca' : 'Nenhum jogo disponível. Crie seu primeiro jogo!'}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredGames.map((game) => (
            <Grid item xs={12} sm={6} md={4} key={game.id}>
              <GameCard
                game={game}
                onEdit={() => handleOpenForm(game)}
                onDelete={() => handleDeleteGame(game.id)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <GameForm
        open={openForm}
        onClose={handleCloseForm}
        onSave={handleSaveGame}
        game={editingGame}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 0 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Games;
