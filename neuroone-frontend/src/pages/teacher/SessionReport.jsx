import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Alert,
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Tabs,
  Tab,
  LinearProgress,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Badge,
  Collapse,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import LoadingOverlay from '../../components/atoms/LoadingOverlay';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { AttentionTimelineChart } from '../../components/teacher/AttentionTimelineChart';
import { AttentionDistributionChart } from '../../components/teacher/AttentionDistributionChart';
import { StudentPerformanceTable } from '../../components/teacher/StudentPerformanceTable';
// MUI Icons
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssessmentIcon from '@mui/icons-material/Assessment';
import Home from '@mui/icons-material/Home';
import School from '@mui/icons-material/School';
import ArrowBack from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WarningIcon from '@mui/icons-material/Warning';
import StarIcon from '@mui/icons-material/Star';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TimelineIcon from '@mui/icons-material/Timeline';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function SessionReport() {
  const { sessionId } = useParams();
  const { user, role: userRole } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [recalculating, setRecalculating] = useState(false);

  // Filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all'); // all, high, medium, low
  const [showFilters, setShowFilters] = useState(false);

  // Notas do professor
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    console.log('[SessionReport] useEffect triggered:', {
      user: !!user,
      userRole,
      sessionId,
      shouldFetch: !!(user && userRole && sessionId)
    });

    if (user && userRole && sessionId) {
      console.log('[SessionReport] Calling fetchSessionReport...');
      fetchSessionReport();
    } else {
      console.log('[SessionReport] NOT fetching - missing dependencies');
    }
  }, [user, userRole, sessionId]);

  async function fetchSessionReport() {
    console.log('[SessionReport] fetchSessionReport STARTED for sessionId:', sessionId);
    setLoading(true);
    try {
      // Buscar sessão
      console.log('[SessionReport] Fetching session from:', `${API_URL}/api/sessions/${sessionId}`);
      const sessionResponse = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!sessionResponse.ok) {
        throw new Error(`HTTP ${sessionResponse.status}: ${sessionResponse.statusText}`);
      }

      const sessionResult = await sessionResponse.json();

      if (!sessionResult.success) {
        throw new Error(sessionResult.error || 'Erro ao buscar sessão');
      }

      const sessionData = sessionResult.data;

      // Verificar permissão: permitir professor dono da sessão OU direção
      console.log('[SessionReport] Verificação de permissão:', {
        teacher_id: sessionData.teacher_id,
        user_id: user.id,
        userRole: userRole,
        isTeacher: sessionData.teacher_id === user.id,
        isDirection: userRole === 'direcao'
      });

      if (sessionData.teacher_id !== user.id && userRole !== 'direcao') {
        setError('Você não tem permissão para acessar este relatório.');
        return;
      }

      // Verificar se sessão foi finalizada
      if (sessionData.status !== 'completed') {
        setError('Esta sessão ainda não foi finalizada.');
        return;
      }

      // Buscar dados da turma
      const classResponse = await fetch(`${API_URL}/api/classes/${sessionData.class_id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (classResponse.ok) {
        const classResult = await classResponse.json();
        if (classResult.success) {
          sessionData.class = classResult.data;
        }
      }

      setSession(sessionData);

      // Carregar notas existentes se houver
      if (sessionData.notes) {
        setNotes(sessionData.notes);
      }

      // Buscar métricas do backend
      const metricsResponse = await fetch(`${API_URL}/api/metrics/sessions/${sessionId}`);

      if (!metricsResponse.ok) {
        throw new Error('Não foi possível carregar as métricas da sessão');
      }

      const metricsResult = await metricsResponse.json();

      if (metricsResult.success && metricsResult.data) {
        console.log('[SessionReport] Metrics loaded:', {
          hasDistribution: !!metricsResult.data.distribution,
          distribution: metricsResult.data.distribution,
          totalDataPoints: metricsResult.data.distribution
            ? (metricsResult.data.distribution.low?.count || 0) +
              (metricsResult.data.distribution.medium?.count || 0) +
              (metricsResult.data.distribution.high?.count || 0)
            : 0
        });
        setMetrics(metricsResult.data);
      } else {
        throw new Error('Resposta de métricas inválida');
      }
    } catch (error) {
      console.error('[SessionReport] Error loading report:', error);
      setError(error.message || 'Erro ao carregar relatório.');
    } finally {
      console.log('[SessionReport] fetchSessionReport COMPLETED, setLoading(false)');
      setLoading(false);
    }
  }

  async function handleRecalculateMetrics() {
    setRecalculating(true);
    try {
      const response = await fetch(`${API_URL}/api/metrics/sessions/${sessionId}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Erro ao recalcular métricas');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setMetrics(result.data);
        alert('Métricas recalculadas com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao recalcular métricas:', error);
      alert('Erro ao recalcular métricas: ' + error.message);
    } finally {
      setRecalculating(false);
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    try {
      const response = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar notas');
      }

      const result = await response.json();
      if (result.success) {
        alert('Notas salvas com sucesso!');
        // Atualizar session local
        setSession(prev => ({ ...prev, notes }));
      } else {
        throw new Error(result.error || 'Erro ao salvar notas');
      }
    } catch (error) {
      console.error('Erro ao salvar notas:', error);
      alert('Erro ao salvar notas: ' + error.message);
    } finally {
      setSavingNotes(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleExportPDF() {
    // Trigger print dialog which allows "Save as PDF" option
    window.print();
  }

  // Gerar recomendações inteligentes baseadas nas métricas
  function generateRecommendations() {
    const recommendations = [];
    const avgAttention = overall.avgAttention || 0;
    const lowAttentionStudents = students.filter(s => s.avgAttention < 40);
    const highVariance = attentionStdDev > 20;

    // Recomendação 1: Atenção geral baixa
    if (avgAttention < 50) {
      recommendations.push({
        type: 'warning',
        icon: <WarningIcon />,
        title: 'Atenção Geral Baixa',
        description: 'A turma apresentou baixa atenção média (' + avgAttention.toFixed(1) + '%). Considere:',
        actions: [
          'Revisar o conteúdo para torná-lo mais engajador',
          'Incluir mais atividades práticas e interativas',
          'Verificar se o horário da aula é adequado',
          'Reduzir o tempo de exposição teórica'
        ]
      });
    }

    // Recomendação 2: Muitos alunos com dificuldade
    if (lowAttentionStudents.length > students.length * 0.3) {
      recommendations.push({
        type: 'error',
        icon: <PeopleIcon />,
        title: 'Vários Alunos com Dificuldade',
        description: lowAttentionStudents.length + ' aluno(s) apresentaram baixa atenção. Ações sugeridas:',
        actions: [
          'Agendar acompanhamento individual com esses alunos',
          'Investigar possíveis fatores externos (sono, alimentação)',
          'Considerar estratégias de ensino diferenciadas',
          'Criar grupos de estudo para reforço'
        ]
      });
    }

    // Recomendação 3: Alta variabilidade
    if (highVariance) {
      recommendations.push({
        type: 'info',
        icon: <TimelineIcon />,
        title: 'Alta Variabilidade de Atenção',
        description: 'Desvio padrão de ' + attentionStdDev.toFixed(1) + '% indica grande diferença entre alunos:',
        actions: [
          'Implementar estratégias de diferenciação pedagógica',
          'Oferecer atividades de níveis variados',
          'Criar momentos para atendimento personalizado',
          'Utilizar metodologias ativas e colaborativas'
        ]
      });
    }

    // Recomendação 4: Ótimo desempenho
    if (avgAttention >= 70 && lowAttentionStudents.length === 0) {
      recommendations.push({
        type: 'success',
        icon: <EmojiEventsIcon />,
        title: 'Excelente Desempenho da Turma',
        description: 'Parabéns! A turma manteve alta atenção durante toda a sessão:',
        actions: [
          'Continue com as estratégias pedagógicas atuais',
          'Documente as práticas de sucesso',
          'Compartilhe com outros professores',
          'Gradualmente aumente a complexidade do conteúdo'
        ]
      });
    }

    // Recomendação 5: Qualidade de sinal
    if (avgSignalQuality < 60) {
      recommendations.push({
        type: 'warning',
        icon: <SignalCellularAltIcon />,
        title: 'Problemas de Qualidade de Sinal',
        description: 'Qualidade média de ' + avgSignalQuality.toFixed(1) + '% pode comprometer a análise:',
        actions: [
          'Verificar o ajuste correto dos headsets EEG',
          'Instruir os alunos sobre a importância de minimizar movimentos',
          'Considerar ambiente mais tranquilo para próximas sessões',
          'Reaplicar gel condutor se necessário'
        ]
      });
    }

    return recommendations;
  }

  function formatDuration(startTime, endTime) {
    if (!startTime || !endTime) return 'N/A';
    const diffMs = new Date(endTime) - new Date(startTime);
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  }

  function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getAttentionLevel(value) {
    if (value < 40) return { label: 'Baixa', color: 'error' };
    if (value < 70) return { label: 'Média', color: 'warning' };
    return { label: 'Alta', color: 'success' };
  }

  function getSignalQualityLevel(value) {
    if (value < 50) return { label: 'Ruim', color: 'error' };
    if (value < 75) return { label: 'Boa', color: 'warning' };
    return { label: 'Excelente', color: 'success' };
  }

  // Real metrics data
  const students = metrics?.students || [];
  const timeline = metrics?.timeline || [];
  const distribution = metrics?.distribution || { low: {count: 0}, medium: {count: 0}, high: {count: 0} };
  const overall = metrics?.overall || {};
  const avgAttention = overall.avgAttention || 0;
  const avgRelaxation = overall.avgRelaxation || 0;
  const avgSignalQuality = overall.avgSignalQuality || 0;
  const minAttention = overall.minAttention || 0;
  const maxAttention = overall.maxAttention || 0;

  // Análise de insights
  const bestStudent = students.length > 0 ? students[0] : null;
  const worstStudent = students.length > 0 ? students[students.length - 1] : null;
  const lowAttentionStudents = students.filter(s => s.avgAttention < 40);
  const highAttentionStudents = students.filter(s => s.avgAttention >= 70);
  const attentionVariance = students.length > 0
    ? students.reduce((sum, s) => sum + Math.pow(s.avgAttention - avgAttention, 2), 0) / students.length
    : 0;
  const attentionStdDev = Math.sqrt(attentionVariance);

  const totalDataPoints = distribution.low.count + distribution.medium.count + distribution.high.count;
  const lowPercentage = totalDataPoints > 0 ? ((distribution.low.count / totalDataPoints) * 100).toFixed(1) : 0;
  const mediumPercentage = totalDataPoints > 0 ? ((distribution.medium.count / totalDataPoints) * 100).toFixed(1) : 0;
  const highPercentage = totalDataPoints > 0 ? ((distribution.high.count / totalDataPoints) * 100).toFixed(1) : 0;

  // Filtrar estudantes por busca e nível
  const filteredStudents = students.filter(student => {
    // Filtro de busca por nome
    const matchesSearch = student.studentName?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por nível de atenção
    let matchesLevel = true;
    if (filterLevel === 'high') {
      matchesLevel = student.avgAttention >= 70;
    } else if (filterLevel === 'medium') {
      matchesLevel = student.avgAttention >= 40 && student.avgAttention < 70;
    } else if (filterLevel === 'low') {
      matchesLevel = student.avgAttention < 40;
    }

    return matchesSearch && matchesLevel;
  });

  // Gerar recomendações
  const recommendations = generateRecommendations();

  return (
    <DashboardLayout
      title="Relatório da Sessão"
      subtitle={session ? `${session.title} • ${session.class?.name}` : 'Carregando...'}
      breadcrumbs={[
        {
          label: userRole === 'direcao' ? 'Dashboard' : 'Professor',
          icon: <School fontSize="small" />,
          href: userRole === 'direcao' ? '/admin' : '/teacher'
        },
        { label: 'Relatório' },
      ]}
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {session?.status === 'completed' && (
            <Chip label="Concluída" color="success" size="small" />
          )}
          <Tooltip title="Adicionar notas sobre a sessão">
            <IconButton
              size="small"
              color={showNotes ? 'primary' : 'default'}
              onClick={() => setShowNotes(!showNotes)}
            >
              <NoteAddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Imprimir relatório">
            <IconButton size="small" onClick={handlePrint}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Exportar como PDF">
            <IconButton size="small" onClick={handleExportPDF}>
              <PictureAsPdfIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={handleRecalculateMetrics}
            disabled={loading || recalculating}
          >
            {recalculating ? 'Recalculando...' : 'Recalcular'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArrowBack />}
            onClick={() => navigate(userRole === 'direcao' ? '/admin/sessions' : '/teacher')}
            disabled={loading}
          >
            Voltar
          </Button>
        </Stack>
      }
      maxWidth="xl"
    >
      {/* Loading Overlay */}
      {loading && <LoadingOverlay variant="section" message="Carregando relatório..." />}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Notas do Professor */}
      {!loading && !error && session && (
        <Collapse in={showNotes}>
          <Card sx={{ mb: 3, p: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <NoteAddIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Notas da Sessão
              </Typography>
            </Stack>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Adicione suas observações sobre a sessão (estratégias utilizadas, comportamentos observados, dificuldades encontradas, etc.)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleSaveNotes}
              disabled={savingNotes || !notes.trim()}
            >
              {savingNotes ? 'Salvando...' : 'Salvar Notas'}
            </Button>
          </Card>
        </Collapse>
      )}

      {/* Content - Only show if not loading and no error */}
      {!loading && !error && session && metrics && (
        <>
          {/* Informações da Sessão */}
          <Card sx={{ mb: 3, p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Informações da Sessão
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CalendarTodayIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Data de Início"
                      secondary={formatDateTime(session.start_time)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CalendarTodayIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Data de Término"
                      secondary={formatDateTime(session.end_time)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AccessTimeIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Duração Total"
                      secondary={formatDuration(session.start_time, session.end_time)}
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <School color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Turma"
                      secondary={session.class?.name || 'N/A'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <PeopleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Total de Participantes"
                      secondary={`${students.length} aluno(s)`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AssessmentIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Pontos de Dados Coletados"
                      secondary={`${totalDataPoints} registros EEG`}
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </Card>

          {/* Success message */}
          <Box sx={{ mb: 3 }}>
            <Alert severity="success" icon={<CheckCircleIcon />}>
              <strong>Métricas Processadas</strong>: Dados de {students.length} aluno(s) com {totalDataPoints} pontos de dados EEG analisados.
            </Alert>
          </Box>

          {/* KPIs Principais */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ textAlign: 'center', py: 2 }}>
                <TrendingUpIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                <Typography variant="h3" sx={{ fontSize: '1.5rem', mb: 0.5 }}>
                  {avgAttention.toFixed(1)}%
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Atenção Média
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={getAttentionLevel(avgAttention).label}
                    color={getAttentionLevel(avgAttention).color}
                    size="small"
                  />
                </Box>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ textAlign: 'center', py: 2 }}>
                <AssessmentIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                <Typography variant="h3" sx={{ fontSize: '1.5rem', mb: 0.5 }}>
                  {avgRelaxation.toFixed(1)}%
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Relaxamento Médio
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={getAttentionLevel(avgRelaxation).label}
                    color={getAttentionLevel(avgRelaxation).color}
                    size="small"
                  />
                </Box>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ textAlign: 'center', py: 2 }}>
                <SignalCellularAltIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                <Typography variant="h3" sx={{ fontSize: '1.5rem', mb: 0.5 }}>
                  {avgSignalQuality.toFixed(1)}%
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Qualidade do Sinal
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={getSignalQualityLevel(avgSignalQuality).label}
                    color={getSignalQualityLevel(avgSignalQuality).color}
                    size="small"
                  />
                </Box>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ textAlign: 'center', py: 2 }}>
                <PeopleIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                <Typography variant="h3" sx={{ fontSize: '1.5rem', mb: 0.5 }}>
                  {students.length}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Alunos Participantes
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {minAttention.toFixed(0)}% - {maxAttention.toFixed(0)}%
                  </Typography>
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* Insights e Alertas */}
          {students.length > 0 && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Melhor Desempenho */}
              {bestStudent && (
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{ p: 2, bgcolor: 'success.lighter', borderLeft: 4, borderColor: 'success.main' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <EmojiEventsIcon color="success" sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Melhor Desempenho
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {bestStudent.studentName}
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          {bestStudent.avgAttention.toFixed(1)}% de atenção
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>
              )}

              {/* Necessita Atenção */}
              {worstStudent && worstStudent.avgAttention < 40 && (
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{ p: 2, bgcolor: 'error.lighter', borderLeft: 4, borderColor: 'error.main' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <WarningIcon color="error" sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Necessita Atenção
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {worstStudent.studentName}
                        </Typography>
                        <Typography variant="body2" color="error.main">
                          {worstStudent.avgAttention.toFixed(1)}% de atenção
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>
              )}

            </Grid>
          )}

          {/* Tabs para diferentes visualizações */}
          <Card sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              variant="fullWidth"
            >
              <Tab label="Visão Geral" icon={<AssessmentIcon />} iconPosition="start" />
              <Tab
                label="Análise por Aluno"
                icon={
                  <Badge badgeContent={filteredStudents.length} color="primary">
                    <PeopleIcon />
                  </Badge>
                }
                iconPosition="start"
              />
              <Tab label="Distribuição" icon={<TimelineIcon />} iconPosition="start" />
              <Tab
                label="Recomendações"
                icon={
                  <Badge badgeContent={recommendations.length} color="error">
                    <LightbulbIcon />
                  </Badge>
                }
                iconPosition="start"
              />
            </Tabs>
          </Card>

          {/* Tab 0: Visão Geral */}
          {tabValue === 0 && (
            <>
              {/* Timeline */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                  Evolução da Atenção ao Longo do Tempo
                </Typography>
                <Card sx={{ p: 3 }}>
                  <AttentionTimelineChart timelineData={timeline} height={350} />
                </Card>
              </Box>

              {/* Resumo de Métricas */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                      Métricas de Atenção
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ mb: 2 }}>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2">Atenção Mínima</Typography>
                        <Typography variant="body2" fontWeight={600}>{minAttention.toFixed(1)}%</Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={minAttention}
                        color={getAttentionLevel(minAttention).color}
                      />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2">Atenção Média</Typography>
                        <Typography variant="body2" fontWeight={600}>{avgAttention.toFixed(1)}%</Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={avgAttention}
                        color={getAttentionLevel(avgAttention).color}
                      />
                    </Box>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2">Atenção Máxima</Typography>
                        <Typography variant="body2" fontWeight={600}>{maxAttention.toFixed(1)}%</Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={maxAttention}
                        color={getAttentionLevel(maxAttention).color}
                      />
                    </Box>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                      Distribuição de Atenção
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ mb: 2 }}>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" color="error.main">
                          Baixa (&lt; 40%)
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {distribution.low.count} ({lowPercentage}%)
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={parseFloat(lowPercentage)}
                        color="error"
                      />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" color="warning.main">
                          Média (40-70%)
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {distribution.medium.count} ({mediumPercentage}%)
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={parseFloat(mediumPercentage)}
                        color="warning"
                      />
                    </Box>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" color="success.main">
                          Alta (&gt; 70%)
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {distribution.high.count} ({highPercentage}%)
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={parseFloat(highPercentage)}
                        color="success"
                      />
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </>
          )}

          {/* Tab 1: Análise por Aluno */}
          {tabValue === 1 && (
            <Box sx={{ mb: 4 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" fontWeight={600}>
                  Performance Individual dos Alunos
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
                </Button>
              </Stack>

              {/* Barra de Filtros */}
              <Collapse in={showFilters}>
                <Card sx={{ p: 2, mb: 3 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Buscar aluno por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Nível de Atenção</InputLabel>
                        <Select
                          value={filterLevel}
                          label="Nível de Atenção"
                          onChange={(e) => setFilterLevel(e.target.value)}
                          startAdornment={
                            <InputAdornment position="start">
                              <FilterListIcon />
                            </InputAdornment>
                          }
                        >
                          <MenuItem value="all">Todos os Níveis</MenuItem>
                          <MenuItem value="high">Alta Atenção (≥70%)</MenuItem>
                          <MenuItem value="medium">Média Atenção (40-70%)</MenuItem>
                          <MenuItem value="low">Baixa Atenção (&lt;40%)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  {(searchTerm || filterLevel !== 'all') && (
                    <Box sx={{ mt: 2 }}>
                      <Chip
                        label={`${filteredStudents.length} de ${students.length} aluno(s) encontrado(s)`}
                        color="primary"
                        size="small"
                      />
                    </Box>
                  )}
                </Card>
              </Collapse>

              <StudentPerformanceTable
                students={filteredStudents.map(s => ({
                  id: s.studentId || s.id,
                  name: s.studentName || s.name,
                  avg_attention: s.avgAttention,
                  avg_relaxation: s.avgRelaxation,
                  duration_minutes: s.durationMinutes,
                  avg_signal_quality: s.avgSignalQuality,
                  data_points: s.dataPoints,
                }))}
                onStudentClick={(studentId) => navigate(`/teacher/student/${studentId}`)}
              />

              {filteredStudents.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Nenhum aluno encontrado com os filtros aplicados.
                </Alert>
              )}
            </Box>
          )}

          {/* Tab 2: Distribuição */}
          {tabValue === 2 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                Distribuição de Níveis de Atenção
              </Typography>
              <Card sx={{ p: 3 }}>
                {totalDataPoints > 0 ? (
                  <>
                    <AttentionDistributionChart
                      distribution={{
                        low: distribution.low.count,
                        medium: distribution.medium.count,
                        high: distribution.high.count
                      }}
                      height={400}
                    />
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="body2" color="text.secondary" align="center">
                        Total de {totalDataPoints} pontos de dados EEG analisados
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Alert severity="info">
                    Nenhum dado de distribuição disponível para esta sessão.
                    Isso pode ocorrer se não houve coleta de dados EEG durante a sessão.
                  </Alert>
                )}
              </Card>
            </Box>
          )}

          {/* Tab 3: Recomendações */}
          {tabValue === 3 && (
            <Box sx={{ mb: 4 }}>
              <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                <LightbulbIcon sx={{ fontSize: 32, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    Recomendações Pedagógicas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Insights e sugestões baseadas nas métricas da sessão
                  </Typography>
                </Box>
              </Stack>

              {recommendations.length === 0 && (
                <Alert severity="success" icon={<CheckCircleIcon />}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Nenhuma recomendação especial
                  </Typography>
                  <Typography variant="body2">
                    A sessão teve um desempenho dentro do esperado. Continue monitorando as próximas sessões.
                  </Typography>
                </Alert>
              )}

              <Grid container spacing={3}>
                {recommendations.map((rec, index) => (
                  <Grid key={index} size={{ xs: 12 }}>
                    <Card
                      sx={{
                        p: 3,
                        borderLeft: 4,
                        borderColor: `${rec.type}.main`,
                        bgcolor: `${rec.type}.lighter`,
                      }}
                    >
                      <Stack direction="row" spacing={2}>
                        <Box sx={{ color: `${rec.type}.main`, pt: 0.5 }}>
                          {rec.icon}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={600} gutterBottom>
                            {rec.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {rec.description}
                          </Typography>

                          <Divider sx={{ my: 2 }} />

                          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                            Ações Sugeridas:
                          </Typography>
                          <List dense>
                            {rec.actions.map((action, actionIndex) => (
                              <ListItem key={actionIndex}>
                                <ListItemIcon>
                                  <CheckCircleIcon color={rec.type} fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary={action} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      </Stack>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Resumo Estatístico Adicional */}
              {recommendations.length > 0 && (
                <Card sx={{ mt: 3, p: 3, bgcolor: 'background.default' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Contexto Adicional
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Taxa de Sucesso
                        </Typography>
                        <Typography variant="h4" color="success.main">
                          {((highAttentionStudents.length / students.length) * 100).toFixed(0)}%
                        </Typography>
                        <Typography variant="caption">
                          dos alunos com alta atenção
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Variação
                        </Typography>
                        <Typography variant="h4" color="info.main">
                          {attentionStdDev.toFixed(1)}%
                        </Typography>
                        <Typography variant="caption">
                          desvio padrão de atenção
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Amplitude
                        </Typography>
                        <Typography variant="h4" color="warning.main">
                          {(maxAttention - minAttention).toFixed(0)}%
                        </Typography>
                        <Typography variant="caption">
                          diferença entre máx e mín
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Card>
              )}
            </Box>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
