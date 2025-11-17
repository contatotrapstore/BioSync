import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Checkbox,
  FormControlLabel,
  Box,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Button } from '../atoms/Button';

/**
 * Componente de Termo de Consentimento LGPD
 * Deve ser exibido no primeiro acesso e após mudanças nos termos
 */
export function PrivacyConsent({ open, onAccept, onReject }) {
  const [dataProcessingConsent, setDataProcessingConsent] = useState(false);
  const [eegDataConsent, setEegDataConsent] = useState(false);
  const [researchConsent, setResearchConsent] = useState(false);

  const handleAccept = () => {
    if (dataProcessingConsent && eegDataConsent) {
      onAccept({
        dataProcessingConsent: true,
        eegDataConsent: true,
        researchConsent,
        acceptedAt: new Date().toISOString(),
        version: '1.0.0',
      });
    }
  };

  const allRequiredAccepted = dataProcessingConsent && eegDataConsent;

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
      onClose={(event, reason) => {
        if (reason !== 'backdropClick') {
          onReject();
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h2" component="div">
          Termo de Consentimento e Privacidade
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018)
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 3 }}>
          Por favor, leia atentamente e aceite os termos abaixo para continuar usando o NeuroOne.
        </Alert>

        {/* Seção 1: Dados Pessoais */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h3" sx={{ mb: 1 }}>
            1. Coleta e Processamento de Dados Pessoais
          </Typography>
          <Typography variant="body2" paragraph>
            O NeuroOne coleta e processa os seguintes dados pessoais:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="• Nome completo, e-mail e informações de cadastro"
                secondary="Finalidade: Identificação e autenticação"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="• Dados de navegação e uso da plataforma"
                secondary="Finalidade: Melhoria da experiência e segurança"
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Seção 2: Dados de EEG */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h3" sx={{ mb: 1 }}>
            2. Dados de Eletroencefalografia (EEG)
          </Typography>
          <Typography variant="body2" paragraph>
            Durante sessões de neurofeedback, coletamos:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="• Métricas de atenção e relaxamento"
                secondary="Dados não identificáveis de ondas cerebrais (delta, theta, alpha, beta, gamma)"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="• Qualidade do sinal do dispositivo EEG"
                secondary="Informações técnicas do headset"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="• Histórico de sessões e performance"
                secondary="Para acompanhamento pedagógico e evolução"
              />
            </ListItem>
          </List>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Importante:</strong> Dados de EEG são considerados dados sensíveis de saúde pela LGPD.
              Eles são armazenados de forma anonimizada e com criptografia.
            </Typography>
          </Alert>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Seção 3: Direitos do Titular */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h3" sx={{ mb: 1 }}>
            3. Seus Direitos (Art. 18 da LGPD)
          </Typography>
          <Typography variant="body2" paragraph>
            Você tem os seguintes direitos sobre seus dados:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="• Confirmação da existência de tratamento de dados" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Acesso aos seus dados pessoais" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Correção de dados incompletos, inexatos ou desatualizados" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Anonimização, bloqueio ou eliminação de dados desnecessários" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Portabilidade dos dados a outro fornecedor" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Revogação do consentimento a qualquer momento" />
            </ListItem>
          </List>
          <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
            Para exercer seus direitos, acesse <strong>Configurações → Privacidade e Dados</strong> ou entre em
            contato através do e-mail: <strong>privacidade@neuroone.com.br</strong>
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Seção 4: Compartilhamento */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h3" sx={{ mb: 1 }}>
            4. Compartilhamento de Dados
          </Typography>
          <Typography variant="body2" paragraph>
            Seus dados <strong>NÃO</strong> são vendidos ou compartilhados com terceiros para fins comerciais.
          </Typography>
          <Typography variant="body2">
            Compartilhamento limitado ocorre apenas com:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="• Professor responsável pela turma (dados de sessão e performance)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Direção escolar (relatórios agregados e anônimos)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Autoridades legais (mediante ordem judicial)" />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Seção 5: Armazenamento */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h3" sx={{ mb: 1 }}>
            5. Armazenamento e Segurança
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="• Dados armazenados em servidores seguros com criptografia"
                secondary="Infraestrutura: Supabase (PostgreSQL) com backups diários"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="• Dados de EEG mantidos por até 5 anos ou até solicitação de exclusão"
                secondary="Para fins educacionais e acompanhamento longitudinal"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="• Acesso restrito através de autenticação JWT e controle de permissões"
                secondary="Apenas usuários autorizados acessam dados específicos"
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Checkboxes de Consentimento */}
        <Box>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Declaração de Consentimento
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={dataProcessingConsent}
                onChange={(e) => setDataProcessingConsent(e.target.checked)}
              />
            }
            label={
              <Typography variant="body2">
                <strong>*</strong> Autorizo a coleta e processamento dos meus dados pessoais conforme descrito
                acima.
              </Typography>
            }
          />

          <FormControlLabel
            control={
              <Checkbox checked={eegDataConsent} onChange={(e) => setEegDataConsent(e.target.checked)} />
            }
            label={
              <Typography variant="body2">
                <strong>*</strong> Autorizo a coleta de dados de EEG durante sessões de neurofeedback, sabendo que
                são dados sensíveis de saúde.
              </Typography>
            }
          />

          <FormControlLabel
            control={
              <Checkbox checked={researchConsent} onChange={(e) => setResearchConsent(e.target.checked)} />
            }
            label={
              <Typography variant="body2">
                (Opcional) Autorizo o uso <strong>anônimo</strong> dos meus dados de EEG para pesquisas científicas
                em neuroeducação.
              </Typography>
            }
          />

          <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
            * Campos obrigatórios para uso da plataforma
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" onClick={onReject}>
          Recusar e Sair
        </Button>
        <Button variant="contained" onClick={handleAccept} disabled={!allRequiredAccepted}>
          Aceitar e Continuar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
