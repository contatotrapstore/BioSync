import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  Stack,
  Alert,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import LoadingOverlay from '../../components/atoms/LoadingOverlay';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
// MUI Icons
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import Home from '@mui/icons-material/Home';
import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings';
import SettingsIcon from '@mui/icons-material/Settings';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import NotificationsIcon from '@mui/icons-material/Notifications';
import StorageIcon from '@mui/icons-material/Storage';
import BackupIcon from '@mui/icons-material/Backup';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export function SystemSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [settings, setSettings] = useState(null);
  const [originalSettings, setOriginalSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings && originalSettings) {
      const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
      setHasChanges(changed);
    }
  }, [settings, originalSettings]);

  async function fetchSettings() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar configurações:', error);
        // Se não existir, criar configurações padrão
        const defaultSettings = {
          attention_threshold_low: 40,
          attention_threshold_high: 70,
          session_min_duration: 5,
          session_max_duration: 60,
          auto_end_session: true,
          enable_notifications: true,
          data_retention_days: 90,
          auto_backup: false,
          max_students_per_session: 30,
        };
        setSettings(defaultSettings);
        setOriginalSettings(JSON.parse(JSON.stringify(defaultSettings)));
      } else if (data) {
        setSettings(data);
        setOriginalSettings(JSON.parse(JSON.stringify(data)));
      }
    } catch (error) {
      console.error('Erro crítico ao buscar configurações:', error);
      alert('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field) {
    return (event) => {
      const value = event.target.type === 'checkbox' ? event.target.checked : parseInt(event.target.value);
      setSettings((prev) => ({ ...prev, [field]: value }));

      // Limpar erro ao alterar
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    };
  }

  function validateSettings() {
    const newErrors = {};

    // Validar thresholds de atenção
    if (settings.attention_threshold_low >= settings.attention_threshold_high) {
      newErrors.attention_threshold_low = 'Deve ser menor que o threshold alto';
      newErrors.attention_threshold_high = 'Deve ser maior que o threshold baixo';
    }

    // Validar thresholds de relaxamento
    if (settings.relaxation_threshold_low >= settings.relaxation_threshold_high) {
      newErrors.relaxation_threshold_low = 'Deve ser menor que o threshold alto';
      newErrors.relaxation_threshold_high = 'Deve ser maior que o threshold baixo';
    }

    // Validar duração de sessão
    if (settings.min_session_duration >= settings.max_session_duration) {
      newErrors.min_session_duration = 'Deve ser menor que a duração máxima';
      newErrors.max_session_duration = 'Deve ser maior que a duração mínima';
    }

    // Validar intervalos
    if (settings.auto_save_interval < 10) {
      newErrors.auto_save_interval = 'Mínimo de 10 segundos';
    }

    if (settings.eeg_data_sync_interval < 1) {
      newErrors.eeg_data_sync_interval = 'Mínimo de 1 segundo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validateSettings()) {
      alert('Corrija os erros antes de salvar');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({
          ...settings,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);

      if (error) throw error;

      alert('Configurações salvas com sucesso!');
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      setHasChanges(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configurações: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (window.confirm('Deseja descartar todas as alterações?')) {
      setSettings(JSON.parse(JSON.stringify(originalSettings)));
      setErrors({});
    }
  }

  function handleRestoreDefaults() {
    if (!window.confirm('Deseja restaurar as configurações padrão? Isso sobrescreverá todas as configurações atuais.')) {
      return;
    }

    const defaultSettings = {
      ...settings,
      attention_threshold_low: 40,
      attention_threshold_high: 70,
      relaxation_threshold_low: 40,
      relaxation_threshold_high: 70,
      min_session_duration: 10,
      max_session_duration: 240,
      auto_save_interval: 60,
      eeg_data_sync_interval: 5,
      signal_quality_threshold: 50,
      enable_notifications: true,
      enable_email_reports: false,
      data_retention_days: 180,
      enable_auto_backup: true,
      backup_interval_hours: 24,
      enable_games: true,
      game_reward_threshold: 70,
    };

    setSettings(defaultSettings);
  }

  return (
    <DashboardLayout
      title="Configurações do Sistema"
      subtitle="Configure parâmetros globais do NeuroOne"
      breadcrumbs={[
        { label: 'Início', icon: <Home fontSize="small" />, href: '/' },
        { label: 'Admin', icon: <AdminPanelSettings fontSize="small" /> },
        { label: 'Configurações', icon: <SettingsIcon fontSize="small" /> },
      ]}
      actions={
        <Button
          variant="outlined"
          onClick={handleRestoreDefaults}
          startIcon={<RestoreIcon />}
        >
          Restaurar Padrões
        </Button>
      }
      maxWidth="lg"
    >
      {/* Loading Overlay */}
      {loading && <LoadingOverlay variant="section" message="Carregando configurações..." />}

      {/* Erro se settings não carregou */}
      {!loading && !settings && (
        <Alert severity="error">
          Erro ao carregar configurações do sistema. Por favor, recarregue a página.
        </Alert>
      )}

      {/* Conteúdo principal - só renderiza quando settings estiver carregado */}
      {!loading && settings ? (
        <>
          {/* Alerta de mudanças pendentes */}
          {hasChanges && (
            <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 3 }}>
              <strong>Você tem alterações não salvas.</strong> Clique em "Salvar Configurações" para aplicar as mudanças.
            </Alert>
          )}

        {/* Botões de Ação */}
        <Card sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleRestoreDefaults}
              startIcon={<RestoreIcon />}
            >
              Restaurar Padrões
            </Button>
            {hasChanges && (
              <>
                <Button variant="outlined" onClick={handleReset}>
                  Descartar Alterações
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                  startIcon={<SaveIcon />}
                >
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </>
            )}
          </Stack>
        </Card>

        {/* 1. Thresholds de Atenção */}
        <Card sx={{ mb: 3 }}>
          <Typography variant="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GpsFixedIcon />
            Thresholds de Atenção
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Defina os limites para classificação de níveis de atenção
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Atenção Baixa (%)"
                type="number"
                value={settings.attention_threshold_low}
                onChange={handleChange('attention_threshold_low')}
                fullWidth
                inputProps={{ min: 0, max: 100 }}
                error={!!errors.attention_threshold_low}
                helperText={errors.attention_threshold_low || 'Valores abaixo deste são exibidos em vermelho'}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Atenção Alta (%)"
                type="number"
                value={settings.attention_threshold_high}
                onChange={handleChange('attention_threshold_high')}
                fullWidth
                inputProps={{ min: 0, max: 100 }}
                error={!!errors.attention_threshold_high}
                helperText={errors.attention_threshold_high || 'Valores acima deste são exibidos em verde'}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip label={`0-${settings.attention_threshold_low}% (Baixa)`} color="error" size="small" />
                <Chip label={`${settings.attention_threshold_low}-${settings.attention_threshold_high}% (Média)`} color="warning" size="small" />
                <Chip label={`${settings.attention_threshold_high}-100% (Alta)`} color="success" size="small" />
              </Box>
            </Grid>
          </Grid>
        </Card>

        {/* 2. Thresholds de Relaxamento */}
        <Card sx={{ mb: 3 }}>
          <Typography variant="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SelfImprovementIcon />
            Thresholds de Relaxamento
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Configure os níveis de relaxamento/meditação
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Relaxamento Baixo (%)"
                type="number"
                value={settings.relaxation_threshold_low}
                onChange={handleChange('relaxation_threshold_low')}
                fullWidth
                inputProps={{ min: 0, max: 100 }}
                error={!!errors.relaxation_threshold_low}
                helperText={errors.relaxation_threshold_low || 'Indica estresse ou ansiedade'}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Relaxamento Alto (%)"
                type="number"
                value={settings.relaxation_threshold_high}
                onChange={handleChange('relaxation_threshold_high')}
                fullWidth
                inputProps={{ min: 0, max: 100 }}
                error={!!errors.relaxation_threshold_high}
                helperText={errors.relaxation_threshold_high || 'Indica estado calmo'}
              />
            </Grid>
          </Grid>
        </Card>

        {/* 3. Configurações de Sessão */}
        <Card sx={{ mb: 3 }}>
          <Typography variant="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon />
            Configurações de Sessão
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Parâmetros de duração e comportamento de sessões
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Duração Mínima (minutos)"
                type="number"
                value={settings.min_session_duration}
                onChange={handleChange('min_session_duration')}
                fullWidth
                inputProps={{ min: 1, max: 60 }}
                error={!!errors.min_session_duration}
                helperText={errors.min_session_duration || 'Sessões menores serão marcadas como incompletas'}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Duração Máxima (minutos)"
                type="number"
                value={settings.max_session_duration}
                onChange={handleChange('max_session_duration')}
                fullWidth
                inputProps={{ min: 60, max: 480 }}
                error={!!errors.max_session_duration}
                helperText={errors.max_session_duration || 'Limite de tempo para sessões'}
              />
            </Grid>
          </Grid>
        </Card>

        {/* 4. Auto-Save e Sincronização */}
        <Card sx={{ mb: 3 }}>
          <Typography variant="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudSyncIcon />
            Sincronização de Dados
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Configure intervalos de salvamento automático
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Intervalo de Auto-Save (segundos)"
                type="number"
                value={settings.auto_save_interval}
                onChange={handleChange('auto_save_interval')}
                fullWidth
                inputProps={{ min: 10, max: 300 }}
                error={!!errors.auto_save_interval}
                helperText={errors.auto_save_interval || 'Frequência de salvamento automático'}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Sincronização EEG (segundos)"
                type="number"
                value={settings.eeg_data_sync_interval}
                onChange={handleChange('eeg_data_sync_interval')}
                fullWidth
                inputProps={{ min: 1, max: 30 }}
                error={!!errors.eeg_data_sync_interval}
                helperText={errors.eeg_data_sync_interval || 'Intervalo de envio de dados EEG ao servidor'}
              />
            </Grid>
          </Grid>
        </Card>

        {/* 5. Qualidade de Sinal */}
        <Card sx={{ mb: 3 }}>
          <Typography variant="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SignalCellularAltIcon />
            Qualidade de Sinal EEG
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Configure o threshold de qualidade aceitável
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Threshold de Qualidade"
                type="number"
                value={settings.signal_quality_threshold}
                onChange={handleChange('signal_quality_threshold')}
                fullWidth
                inputProps={{ min: 0, max: 200 }}
                helperText="Máximo aceitável (0=perfeito, 200=péssimo)"
              />
            </Grid>
          </Grid>
        </Card>

        {/* 6. Notificações */}
        <Card sx={{ mb: 3 }}>
          <Typography variant="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsIcon />
            Notificações
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Configure alertas e notificações do sistema
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={settings.enable_notifications}
                    onChange={handleChange('enable_notifications')}
                  />
                }
                label="Habilitar Notificações"
              />
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                Ativar notificações do sistema
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={settings.enable_email_reports}
                    onChange={handleChange('enable_email_reports')}
                  />
                }
                label="Relatórios por Email"
              />
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                Enviar relatórios automáticos por email
              </Typography>
            </Grid>
          </Grid>
        </Card>

        {/* 7. Retenção de Dados */}
        <Card sx={{ mb: 3 }}>
          <Typography variant="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StorageIcon />
            Retenção de Dados
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Configure políticas de armazenamento
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Retenção de Dados (dias)"
                type="number"
                value={settings.data_retention_days}
                onChange={handleChange('data_retention_days')}
                fullWidth
                inputProps={{ min: 30, max: 730 }}
                helperText="Dados EEG brutos serão mantidos por este período"
              />
            </Grid>
          </Grid>
        </Card>

        {/* 8. Backup */}
        <Card sx={{ mb: 3 }}>
          <Typography variant="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BackupIcon />
            Backup Automático
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Configure rotinas de backup
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={settings.enable_auto_backup}
                    onChange={handleChange('enable_auto_backup')}
                  />
                }
                label="Habilitar Backup Automático"
              />
            </Grid>

            {settings.enable_auto_backup && (
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Intervalo de Backup (horas)"
                  type="number"
                  value={settings.backup_interval_hours}
                  onChange={handleChange('backup_interval_hours')}
                  fullWidth
                  inputProps={{ min: 1, max: 168 }}
                  helperText="Frequência de backup automático"
                />
              </Grid>
            )}
          </Grid>
        </Card>

        {/* 9. Jogos e Neurofeedback */}
        <Card sx={{ mb: 3 }}>
          <Typography variant="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SportsEsportsIcon />
            Jogos e Neurofeedback
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Configure módulo de jogos
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={settings.enable_games}
                    onChange={handleChange('enable_games')}
                  />
                }
                label="Habilitar Jogos"
              />
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                Ativar módulo de jogos de neurofeedback
              </Typography>
            </Grid>

            {settings.enable_games && (
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Threshold de Recompensa (%)"
                  type="number"
                  value={settings.game_reward_threshold}
                  onChange={handleChange('game_reward_threshold')}
                  fullWidth
                  inputProps={{ min: 50, max: 100 }}
                  helperText="Nível de atenção para ganhar recompensas"
                />
              </Grid>
            )}
          </Grid>
        </Card>

        {/* Botões de Ação Fixos no Rodapé */}
        {hasChanges && (
          <Card sx={{ position: 'sticky', bottom: 20, boxShadow: 4 }}>
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <WarningAmberIcon fontSize="small" />
                Alterações não salvas
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button variant="outlined" onClick={handleReset}>
                  Descartar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                  startIcon={<SaveIcon />}
                >
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </Stack>
            </Stack>
          </Card>
        )}
        </>
      ) : null}
    </DashboardLayout>
  );
}
