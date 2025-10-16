import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Box,
  Button
} from '@mui/material';
import { Psychology as PsychologyIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PatientCard from '../components/PatientCard';

const PsychologistDashboard = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
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

      const response = await axios.get(`${apiUrl}/psychologists/patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPatients(response.data.data || []);
      } else {
        setError(response.data.error || 'Erro ao carregar pacientes');
      }
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err);

      if (err.response?.status === 401) {
        setError('Sessão expirada. Faça login novamente.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else if (err.response?.status === 403) {
        setError('Acesso negado. Você precisa ser um psicólogo autorizado.');
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Erro ao carregar pacientes. Verifique sua conexão.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchPatients();
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PsychologyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Dashboard de Psicólogos
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Acompanhe o progresso de seus pacientes
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

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Card */}
      <Card elevation={2} sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Estatísticas Gerais
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary.main" fontWeight="bold">
                  {patients.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pacientes Atribuídos
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="success.main" fontWeight="bold">
                  {patients.reduce((sum, p) => sum + (p.stats?.totalSessions || 0), 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de Sessões
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="info.main" fontWeight="bold">
                  {patients.length > 0
                    ? Math.round(
                        patients.reduce((sum, p) => sum + (p.stats?.avgScore || 0), 0) /
                          patients.length
                      )
                    : 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Média Geral
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Patients List */}
      {patients.length === 0 ? (
        <Alert severity="info">
          Nenhum paciente atribuído ainda. Entre em contato com o administrador para atribuir pacientes.
        </Alert>
      ) : (
        <>
          <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
            Meus Pacientes ({patients.length})
          </Typography>
          <Grid container spacing={3}>
            {patients.map((patient) => (
              <Grid item xs={12} md={6} lg={4} key={patient.id}>
                <PatientCard patient={patient} />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Container>
  );
};

export default PsychologistDashboard;
