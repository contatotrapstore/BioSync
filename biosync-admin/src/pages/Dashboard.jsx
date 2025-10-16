import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  Divider,
  Paper
} from '@mui/material';
import {
  People as PeopleIcon,
  SportsEsports as GamesIcon,
  CardMembership as SubscriptionIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  PersonAdd as PersonAddIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usersAPI, gamesAPI, subscriptionsAPI } from '../services/api';

const StatCard = ({ title, value, icon: Icon, color, loading, subtitle, action }) => (
  <Card elevation={2} sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 500 }}>
            {title}
          </Typography>
          {loading ? (
            <CircularProgress size={32} sx={{ mt: 1 }} />
          ) : (
            <>
              <Typography variant="h3" component="div" fontWeight="bold" sx={{ mb: 0.5 }}>
                {value}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}.lighter`,
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon sx={{ fontSize: 32, color: `${color}.main` }} />
        </Box>
      </Box>
      {action && (
        <Box sx={{ mt: 2 }}>
          {action}
        </Box>
      )}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalGames: 0,
    activeGames: 0,
    totalSubscriptions: 0,
    activePlans: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      // Buscar estatísticas
      const [usersRes, gamesRes, subscriptionsRes, plansRes] = await Promise.all([
        usersAPI.getAll({ limit: 5, sort: 'created_at', order: 'desc' }),
        gamesAPI.getAll({ limit: 5 }),
        subscriptionsAPI.getAll({ limit: 1 }),
        subscriptionsAPI.getAllPlans({ limit: 100 })
      ]);

      // Calcular estatísticas
      const activeUsers = usersRes.users.filter(u => u.isActive).length;
      const activeGames = gamesRes.games.filter(g => g.isActive).length;
      const activePlans = plansRes.plans.filter(p => p.isActive).length;

      setStats({
        totalUsers: usersRes.pagination.total,
        activeUsers: activeUsers,
        totalGames: gamesRes.count,
        activeGames: activeGames,
        totalSubscriptions: subscriptionsRes.pagination.total,
        activePlans: activePlans
      });

      setRecentUsers(usersRes.users.slice(0, 5));
      setRecentGames(gamesRes.games.slice(0, 5));

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || err.message || 'Falha ao carregar dados do painel');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Painel de Controle
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Visão geral da plataforma NeuroOne
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Estatísticas principais */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total de Usuários"
            value={stats.totalUsers}
            subtitle={`${stats.activeUsers} ativos`}
            icon={PeopleIcon}
            color="primary"
            loading={loading}
            action={
              <Button
                size="small"
                startIcon={<PersonAddIcon />}
                onClick={() => navigate('/users')}
                fullWidth
              >
                Gerenciar
              </Button>
            }
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total de Jogos"
            value={stats.totalGames}
            subtitle={`${stats.activeGames} ativos`}
            icon={GamesIcon}
            color="success"
            loading={loading}
            action={
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => navigate('/games')}
                fullWidth
              >
                Gerenciar
              </Button>
            }
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Assinaturas"
            value={stats.totalSubscriptions}
            subtitle="Total de assinaturas"
            icon={SubscriptionIcon}
            color="warning"
            loading={loading}
            action={
              <Button
                size="small"
                startIcon={<VisibilityIcon />}
                onClick={() => navigate('/subscriptions')}
                fullWidth
              >
                Ver Todas
              </Button>
            }
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Planos Ativos"
            value={stats.activePlans}
            subtitle="Planos disponíveis"
            icon={TrendingUpIcon}
            color="info"
            loading={loading}
            action={
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => navigate('/subscriptions')}
                fullWidth
              >
                Gerenciar
              </Button>
            }
          />
        </Grid>
      </Grid>

      {/* Conteúdo secundário */}
      <Grid container spacing={3}>
        {/* Usuários Recentes */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Usuários Recentes
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/users')}
                  endIcon={<VisibilityIcon />}
                >
                  Ver Todos
                </Button>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : recentUsers.length > 0 ? (
                <List>
                  {recentUsers.map((user, index) => (
                    <React.Fragment key={user.id}>
                      {index > 0 && <Divider />}
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {user.email.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight="medium">
                                {user.email}
                              </Typography>
                              {user.isActive ? (
                                <Chip icon={<ActiveIcon />} label="Ativo" size="small" color="success" />
                              ) : (
                                <Chip icon={<InactiveIcon />} label="Inativo" size="small" color="default" />
                              )}
                            </Box>
                          }
                          secondary={`Cadastrado em ${formatDate(user.createdAt)}`}
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  Nenhum usuário cadastrado ainda
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Jogos Recentes */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Jogos Cadastrados
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/games')}
                  endIcon={<VisibilityIcon />}
                >
                  Ver Todos
                </Button>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : recentGames.length > 0 ? (
                <List>
                  {recentGames.map((game, index) => (
                    <React.Fragment key={game.id}>
                      {index > 0 && <Divider />}
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar
                            sx={{ bgcolor: 'success.main', borderRadius: 1 }}
                            variant="rounded"
                          >
                            <GamesIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight="medium">
                                {game.name}
                              </Typography>
                              {game.isActive ? (
                                <Chip icon={<ActiveIcon />} label="Ativo" size="small" color="success" />
                              ) : (
                                <Chip icon={<InactiveIcon />} label="Inativo" size="small" color="default" />
                              )}
                            </Box>
                          }
                          secondary={game.category || 'Sem categoria'}
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  Nenhum jogo cadastrado ainda
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Ações Rápidas */}
        <Grid item xs={12}>
          <Paper
            elevation={2}
            sx={{ p: 3, background: 'linear-gradient(135deg, #1c1400 0%, #d4a100 55%, #ffd913 100%)' }}
          >
            <Typography variant="h6" fontWeight="bold" color="white" gutterBottom>
              Ações Rápidas
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<PersonAddIcon />}
                  onClick={() => navigate('/users')}
                  sx={{ bgcolor: 'rgba(255,255,255,0.9)', color: 'primary.main', '&:hover': { bgcolor: 'white' } }}
                >
                  Novo Usuário
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/games')}
                  sx={{ bgcolor: 'rgba(255,255,255,0.9)', color: 'success.main', '&:hover': { bgcolor: 'white' } }}
                >
                  Novo Jogo
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/subscriptions')}
                  sx={{ bgcolor: 'rgba(255,255,255,0.9)', color: 'warning.main', '&:hover': { bgcolor: 'white' } }}
                >
                  Novo Plano
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<VisibilityIcon />}
                  onClick={() => navigate('/requests')}
                  sx={{ bgcolor: 'rgba(255,255,255,0.9)', color: 'info.main', '&:hover': { bgcolor: 'white' } }}
                >
                  Ver Solicitações
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
