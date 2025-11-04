import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  alpha,
  useTheme,
  Paper,
  Button,
} from '@mui/material';
import { Search, CloudOff, Bolt, LibraryBooks } from '@mui/icons-material';
import GameCard from '../components/GameCard';
import api from '../services/api';

const normalizeGame = (rawGame) => {
  if (!rawGame) return null;

  return {
    id: rawGame.id,
    name: rawGame.name || rawGame.title || 'Untitled Game',
    description: rawGame.description || '',
    category: rawGame.category || null,
    coverImage: rawGame.cover_image || rawGame.thumbnail_url || '',
    folderPath: rawGame.folder_path || rawGame.folderPath || '',
    hasAccess: rawGame.hasAccess ?? rawGame.has_access ?? false,
    accessType: rawGame.accessType || rawGame.access_type || null,
    supportedPlatforms: rawGame.supported_platforms || rawGame.supportedPlatforms || ['pc', 'mobile']
  };
};

function GameLibrary() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchGames();

    if (window.electronAPI) {
      const refreshListener = () => fetchGames();
      window.electronAPI.on('refresh-library', refreshListener);
      return () => {
        window.electronAPI.removeListener('refresh-library', refreshListener);
      };
    }

    return undefined;
  }, []);

  useEffect(() => {
    filterGames();
  }, [games, searchQuery, selectedCategory]);

  const featuredGame = useMemo(() => filteredGames[0] ?? games[0] ?? null, [filteredGames, games]);

  const fetchGames = async () => {
    setLoading(true);
    setError('');

    try {
      // Filter games by PC platform
      const response = await api.get('/games/user/games', {
        params: { platform: 'pc' }
      });
      const payload = response.data?.data || {};
      const gamesData = payload.games || [];

      const normalized = gamesData
        .map(normalizeGame)
        .filter(Boolean);

      setGames(normalized);

      const uniqueCategories = [
        ...new Set(
          normalized
            .map((game) => game.category)
            .filter(Boolean)
        )
      ];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error fetching games:', err);
      if (err.offline) {
        setError('Unable to connect to server. Please check your connection.');
      } else {
        setError(err.message || 'Failed to load games');
      }
    } finally {
      setLoading(false);
    }
  };

  const filterGames = () => {
    let filtered = [...games];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((game) => {
        return (
          game.name.toLowerCase().includes(query) ||
          game.description.toLowerCase().includes(query) ||
          game.category?.toLowerCase().includes(query)
        );
      });
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((game) => game.category === selectedCategory);
    }

    setFilteredGames(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          mb: 4,
          px: { xs: 3, md: 5 },
          py: { xs: 4, md: 6 },
          backgroundImage: theme.palette?.gradient?.secondary,
          borderRadius: 4,
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 520 }}>
          <Typography
            variant="overline"
            sx={{
              color: alpha('#ffffff', 0.7),
              letterSpacing: '0.6em',
              fontWeight: 600,
              mb: 1.5
            }}
          >
            BIBLIOTECA
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Continue sua jornada NeuroOne
          </Typography>
          <Typography variant="body1" sx={{ color: alpha('#ffffff', 0.78), mb: 3 }}>
            Explore seus jogos terapÃªuticos e mantenha o foco nos treinamentos cognitivos.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <LibraryBooks fontSize="small" />
              <Typography variant="body2">
                {games.length} tÃ­tulo{games.length !== 1 ? 's' : ''}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Bolt fontSize="small" />
              <Typography variant="body2">
                {categories.length || 0} categoria{categories.length !== 1 ? 's' : ''}
              </Typography>
            </Stack>
          </Stack>
        </Box>

        {featuredGame && (
          <Box
            sx={{
              position: { xs: 'static', md: 'absolute' },
              right: { md: 40 },
              bottom: { md: 0 },
              top: { md: '50%' },
              transform: { md: 'translateY(-40%)' },
              width: { xs: '100%', md: 320 },
              mt: { xs: 4, md: 0 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: { xs: 'flex-start', md: 'flex-end' }
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: alpha('#ffffff', 0.65), mb: 1 }}
            >
              Destaque
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, mb: 1, textAlign: { xs: 'left', md: 'right' } }}
            >
              {featuredGame.name}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: alpha('#ffffff', 0.65),
                mb: 2,
                textAlign: { xs: 'left', md: 'right' }
              }}
            >
              {featuredGame.description?.slice(0, 120) || 'Pronto para jogar novamente?'}
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={() => navigate(`/game/${featuredGame.id}`)}
              sx={{ alignSelf: { xs: 'flex-start', md: 'flex-end' } }}
            >
              Retomar jogo
            </Button>
          </Box>
        )}

        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 85% 15%, rgba(82, 202, 126, 0.25), transparent 55%)',
            opacity: 0.6,
            pointerEvents: 'none'
          }}
        />
      </Paper>

      {error && (
        <Alert
          severity="error"
          icon={<CloudOff />}
          sx={{ mb: 3 }}
          action={
            <Typography
              variant="button"
              sx={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={fetchGames}
            >
              Retry
            </Typography>
          }
        >
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, md: 3 },
          mb: 4,
          alignItems: { xs: 'stretch', md: 'center' }
        }}
      >
        <TextField
          fullWidth
          placeholder="Buscar na biblioteca"
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
          sx={{
            maxWidth: { xs: '100%', md: 420 },
            backgroundColor: 'rgba(7,13,10,0.6)'
          }}
        />

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip
            label="Todos"
            onClick={() => handleCategoryChange('all')}
            color={selectedCategory === 'all' ? 'primary' : 'default'}
            variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
            sx={{
              borderRadius: 999,
              borderColor: 'rgba(82,202,126,0.4)',
              backgroundColor: selectedCategory === 'all' ? alpha('#c7a300', 0.25) : 'transparent',
              color: '#e6f3eb'
            }}
          />
          {categories.map((category) => (
            <Chip
              key={category}
              label={category}
              onClick={() => handleCategoryChange(category)}
              color={selectedCategory === category ? 'primary' : 'default'}
              variant={selectedCategory === category ? 'filled' : 'outlined'}
              sx={{
                borderRadius: 999,
                borderColor: 'rgba(82,202,126,0.4)',
                backgroundColor: selectedCategory === category ? alpha('#c7a300', 0.25) : 'transparent',
                color: '#e6f3eb'
              }}
            />
          ))}
        </Stack>
      </Box>

      {filteredGames.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8
          }}
        >
          <Typography variant="h6" color="text.secondary">
            {searchQuery || selectedCategory !== 'all'
              ? 'Nenhum jogo encontrado com esses filtros'
              : 'Nenhum jogo disponÃ­vel'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {searchQuery || selectedCategory !== 'all'
              ? 'Tente ajustar sua busca ou filtros'
              : 'Contate seu administrador para obter acesso aos jogos'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredGames.map((game) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={game.id}>
              <GameCard game={game} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

export default GameLibrary;




