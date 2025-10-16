import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Box,
  Button,
  Grid,
  Chip,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  SportsEsports as GamesIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ScoreChart from '../components/ScoreChart';
import ScoreHistory from '../components/ScoreHistory';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientData, setPatientData] = useState(null);

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token de autenticação não encontrado');
        navigate('/login');
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'https://neurogame-7av9.onrender.com/api/v1';

      const response = await axios.get(`${apiUrl}/psychologists/patients/${id}/scores`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPatientData(response.data.data);
      } else {
        setError(response.data.error || 'Erro ao carregar dados do paciente');
      }
    } catch (err) {
      console.error('Erro ao buscar dados do paciente:', err);

      if (err.response?.status === 401) {
        setError('Sessão expirada. Faça login novamente.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else if (err.response?.status === 403) {
        setError('Acesso negado. Você não tem permissão para ver este paciente.');
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Erro ao carregar dados do paciente');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/psychologists');
  };

  const handleRefresh = () => {
    fetchPatientData();
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!patientData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">Paciente não encontrado</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
          Voltar ao Dashboard
        </Button>
      </Container>
    );
  }

  const { patient, stats, scores } = patientData;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Voltar ao Dashboard
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PersonIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                {patient.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {patient.email}
                {patient.username && <> • @{patient.username}</>}
              </Typography>
            </Box>
          </Box>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Atualizar
          </Button>
        </Box>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total de Sessões
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {stats.totalSessions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Pontuação Média
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {stats.avgScore}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Melhor Pontuação
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {stats.bestScore}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Jogos Únicos
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="info.main">
                {stats.totalGames}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Score Chart */}
      {scores && scores.length > 0 && (
        <Card elevation={2} sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <TrendingUpIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Evolução de Pontuações
              </Typography>
            </Box>
            <ScoreChart scores={scores} />
          </CardContent>
        </Card>
      )}

      {/* Score History */}
      <Card elevation={2}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <GamesIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Histórico de Sessões
            </Typography>
          </Box>

          {scores && scores.length > 0 ? (
            <ScoreHistory scores={scores} />
          ) : (
            <Alert severity="info">
              Nenhuma pontuação registrada ainda para este paciente.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default PatientDetail;
