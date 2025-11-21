import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Stack,
  Alert,
  Radio,
  RadioGroup,
  Chip
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import LoadingOverlay from '../../components/atoms/LoadingOverlay';
import EmptyState from '../../components/layout/EmptyState';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';
// MUI Icons
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import Home from '@mui/icons-material/Home';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowBack from '@mui/icons-material/ArrowBack';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function SessionCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    class_id: '',
    session_type: 'monitoramento',
    title: '',
    description: '',
    duration_minutes: 30,
    attention_threshold_low: 40,
    attention_threshold_high: 70,
  });

  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (user) {
      fetchMyClasses();
    }
  }, [user]);

  async function fetchMyClasses() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/classes`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar turmas');
      }

      // Filtrar apenas turmas onde o professor é responsável e estão ativas
      const myActiveClasses = (result.data || [])
        .filter(c => c.teacher_id === user.id && c.active)
        .sort((a, b) => a.name.localeCompare(b.name));

      setClasses(myActiveClasses);
    } catch (error) {
      console.error('Erro ao buscar turmas:', error);
      setError('Erro ao carregar turmas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function validateForm() {
    const errors = {};

    if (!formData.class_id) {
      errors.class_id = 'Selecione uma turma';
    }

    if (!formData.title.trim()) {
      errors.title = 'Digite um título para a sessão';
    }

    if (formData.duration_minutes < 5 || formData.duration_minutes > 180) {
      errors.duration_minutes = 'Duração deve estar entre 5 e 180 minutos';
    }

    if (formData.attention_threshold_low >= formData.attention_threshold_high) {
      errors.attention_threshold_low = 'Limite baixo deve ser menor que o limite alto';
    }

    if (formData.attention_threshold_low < 0 || formData.attention_threshold_low > 100) {
      errors.attention_threshold_low = 'Limite deve estar entre 0 e 100';
    }

    if (formData.attention_threshold_high < 0 || formData.attention_threshold_high > 100) {
      errors.attention_threshold_high = 'Limite deve estar entre 0 e 100';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      setError('Por favor, corrija os erros no formulário');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Criar sessão via API
      const response = await fetch(`${API_URL}/api/sessions/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: user.id,
          class_id: formData.class_id,
          title: formData.title,
          description: formData.description || null,
          session_type: formData.session_type,
          status: 'active',
          start_time: new Date().toISOString(),
          duration_minutes: formData.duration_minutes,
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar sessão');
      }

      // TODO: Salvar configurações de threshold em session_config ou system_settings
      // Por enquanto, vamos usar as configurações globais do sistema

      setSuccess(true);

      // Navegar para sessão ativa após breve delay
      setTimeout(() => {
        navigate(`/teacher/session/${result.data.id}/active`);
      }, 1500);
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      setError(error.message || 'Erro ao criar sessão. Tente novamente.');
      setSubmitting(false);
    }
  }

  function handleCancel() {
    navigate(-1);
  }

  return (
    <DashboardLayout
      title="Nova Sessão Neurofeedback"
      subtitle="Configure e inicie uma nova sessão de monitoramento com seus alunos"
      breadcrumbs={[
        { label: 'Professor', icon: <SchoolIcon fontSize="small" /> },
        { label: 'Nova Sessão' },
      ]}
      actions={
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={handleCancel}
          disabled={submitting}
        >
          Voltar
        </Button>
      }
      maxWidth="md"
    >
      {/* Loading Overlay */}
      {loading && <LoadingOverlay variant="section" message="Carregando turmas..." />}

        {/* Alertas */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Sessão criada com sucesso! Redirecionando...
          </Alert>
        )}

      <form onSubmit={handleSubmit}>
        {/* Seção 1: Selecionar Turma */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            1. Selecione a Turma
          </Typography>

          {classes.length === 0 ? (
            <EmptyState
              variant="noData"
              icon={<SchoolIcon sx={{ fontSize: 64 }} />}
              title="Nenhuma turma disponível"
              description="Você precisa ter turmas cadastradas para criar uma sessão. Solicite à direção."
            />
          ) : (
            <Grid container spacing={2}>
              {classes.map((classItem) => (
                <Grid size={{ xs: 12, sm: 6 }} key={classItem.id}>
                    <Card
                      onClick={() => setFormData({ ...formData, class_id: classItem.id })}
                      sx={{
                        cursor: 'pointer',
                        border: formData.class_id === classItem.id ? 2 : 1,
                        borderColor: formData.class_id === classItem.id ? 'primary.main' : 'divider',
                        bgcolor: formData.class_id === classItem.id ? 'action.selected' : 'background.paper',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: 'primary.main',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h4" sx={{ fontSize: '1.1rem' }}>
                            {classItem.name}
                          </Typography>
                          {formData.class_id === classItem.id && (
                            <Chip label="Selecionada" color="primary" size="small" />
                          )}
                        </Box>

                        {classItem.description && (
                          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                            {classItem.description}
                          </Typography>
                        )}

                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {classItem.student_count} {classItem.student_count === 1 ? 'aluno' : 'alunos'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <SchoolIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {classItem.school_year || 'Sem ano'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            {validationErrors.class_id && (
              <Typography variant="caption" sx={{ color: 'error.main', mt: 1, display: 'block' }}>
                {validationErrors.class_id}
              </Typography>
            )}
          </Box>

          {/* Seção 2: Tipo de Sessão */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h2" sx={{ mb: 2 }}>
              2. Tipo de Sessão
            </Typography>

            <RadioGroup
              value={formData.session_type}
              onChange={(e) => setFormData({ ...formData, session_type: e.target.value })}
            >
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card
                    onClick={() => setFormData({ ...formData, session_type: 'monitoramento' })}
                    sx={{
                      cursor: 'pointer',
                      border: formData.session_type === 'monitoramento' ? 2 : 1,
                      borderColor: formData.session_type === 'monitoramento' ? 'primary.main' : 'divider',
                      bgcolor: formData.session_type === 'monitoramento' ? 'action.selected' : 'background.paper',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Radio value="monitoramento" />
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <MenuBookIcon sx={{ color: 'primary.main' }} />
                          <Typography variant="h4" sx={{ fontSize: '1rem' }}>
                            Aula Tradicional
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Monitoramento durante aula expositiva
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card
                    onClick={() => setFormData({ ...formData, session_type: 'neurogame' })}
                    sx={{
                      cursor: 'pointer',
                      border: formData.session_type === 'neurogame' ? 2 : 1,
                      borderColor: formData.session_type === 'neurogame' ? 'primary.main' : 'divider',
                      bgcolor: formData.session_type === 'neurogame' ? 'action.selected' : 'background.paper',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Radio value="neurogame" />
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <SportsEsportsIcon sx={{ color: 'primary.main' }} />
                          <Typography variant="h4" sx={{ fontSize: '1rem' }}>
                            Neurogame
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Sessão com jogos de neurofeedback
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </RadioGroup>
          </Box>

          {/* Seção 3: Configurações */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h2" sx={{ mb: 2 }}>
              3. Configurações da Sessão
            </Typography>

            <Card>
              <Stack spacing={3}>
                <TextField
                  label="Título da Sessão"
                  placeholder="Ex: Matemática - Equações Lineares"
                  fullWidth
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  error={!!validationErrors.title}
                  helperText={validationErrors.title}
                />

                <TextField
                  label="Descrição (opcional)"
                  placeholder="Detalhes sobre o conteúdo da sessão..."
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />

                <TextField
                  label="Duração Estimada (minutos)"
                  type="number"
                  fullWidth
                  required
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                  error={!!validationErrors.duration_minutes}
                  helperText={validationErrors.duration_minutes || 'Mínimo: 5 minutos | Máximo: 180 minutos'}
                  inputProps={{ min: 5, max: 180 }}
                />

                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                    Limiares de Atenção
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Limite Baixo (%)"
                        type="number"
                        fullWidth
                        value={formData.attention_threshold_low}
                        onChange={(e) => setFormData({ ...formData, attention_threshold_low: parseInt(e.target.value) || 0 })}
                        error={!!validationErrors.attention_threshold_low}
                        helperText={validationErrors.attention_threshold_low || 'Abaixo deste valor: alerta'}
                        inputProps={{ min: 0, max: 100 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Limite Alto (%)"
                        type="number"
                        fullWidth
                        value={formData.attention_threshold_high}
                        onChange={(e) => setFormData({ ...formData, attention_threshold_high: parseInt(e.target.value) || 0 })}
                        error={!!validationErrors.attention_threshold_high}
                        helperText={validationErrors.attention_threshold_high || 'Acima deste valor: ótimo'}
                        inputProps={{ min: 0, max: 100 }}
                      />
                    </Grid>
                  </Grid>

                  {/* Visualização dos Thresholds */}
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                      Faixas de atenção:
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={`Baixa: 0-${formData.attention_threshold_low}%`}
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                      <Chip
                        label={`Média: ${formData.attention_threshold_low}-${formData.attention_threshold_high}%`}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                      <Chip
                        label={`Alta: ${formData.attention_threshold_high}-100%`}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    </Stack>
                  </Box>
                </Box>
              </Stack>
            </Card>
          </Box>

        {/* Botões de Ação */}
        <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            type="submit"
            disabled={submitting || classes.length === 0}
            loading={submitting}
            startIcon={<PlayArrowIcon />}
          >
            Iniciar Sessão
          </Button>
        </Stack>
      </form>
    </DashboardLayout>
  );
}
