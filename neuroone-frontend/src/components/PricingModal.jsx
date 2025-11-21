import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Grid,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import { useNavigate } from 'react-router-dom';

const PricingModal = ({ open, onClose }) => {
  const navigate = useNavigate();

  const packages = [
    {
      id: 1,
      title: '3 Assistentes',
      description: 'Escolha 3 assistentes especializados',
      monthlyPrice: 99.90,
      semesterPrice: 499,
      discount: '17% economia',
      bgColor: 'background.paper',
      iconBg: '#3f5368',
    },
    {
      id: 2,
      title: '6 Assistentes',
      description: 'Escolha 6 assistentes especializados',
      monthlyPrice: 179.90,
      semesterPrice: 899,
      discount: '25% economia',
      bgColor: 'background.paper',
      iconBg: '#3f5368',
    },
    {
      id: 3,
      title: '12 Assistentes',
      description: 'Escolha 12 assistentes especializados',
      monthlyPrice: 299.90,
      semesterPrice: 1499,
      discount: '35% economia',
      bgColor: '#e8f5e9',
      iconBg: '#2e7d32',
    },
  ];

  const handleHeaderClick = () => {
    navigate('/loja#pacotes');
    onClose();
  };

  const handleSelectPackage = (packageId) => {
    navigate(`/loja?package=${packageId}`);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxWidth: '1200px',
        }
      }}
    >
      {/* Header Clicável */}
      <Box
        onClick={handleHeaderClick}
        sx={{
          p: 3,
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
              Escolha seu Pacote
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Economize assinando múltiplos assistentes
            </Typography>
          </Box>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <DialogContent sx={{ p: 3, pt: 0 }}>
        {/* Grid com 3 cards lado a lado */}
        <Grid container spacing={3}>
          {packages.map((pkg) => (
            <Grid item xs={12} md={4} key={pkg.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: pkg.bgColor,
                  border: pkg.id === 3 ? '2px solid' : '1px solid',
                  borderColor: pkg.id === 3 ? 'success.main' : 'divider',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent sx={{
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 3,
                }}>
                  {/* Ícone */}
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 2,
                      bgcolor: pkg.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                    }}
                  >
                    <CardGiftcardIcon sx={{ fontSize: 32, color: 'white' }} />
                  </Box>

                  {/* Título */}
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, textAlign: 'center' }}>
                    {pkg.title}
                  </Typography>

                  {/* Descrição */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3, textAlign: 'center' }}
                  >
                    {pkg.description}
                  </Typography>

                  {/* Preço */}
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color: pkg.id === 3 ? 'success.main' : 'text.primary',
                      mb: 0.5,
                    }}
                  >
                    R$ {pkg.monthlyPrice.toFixed(2).replace('.', ',')}
                    <Typography component="span" variant="body1" color="text.secondary">
                      {' '}/mês
                    </Typography>
                  </Typography>

                  {/* Preço semestral */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    ou R$ {pkg.semesterPrice}/semestre
                  </Typography>

                  {/* Badge de economia */}
                  <Chip
                    label={pkg.discount}
                    size="small"
                    sx={{
                      bgcolor: pkg.id === 3 ? 'success.light' : 'action.selected',
                      color: pkg.id === 3 ? 'success.dark' : 'text.primary',
                      fontWeight: 600,
                      mb: 3,
                    }}
                  />

                  {/* Botão de ação */}
                  <Button
                    variant={pkg.id === 3 ? 'contained' : 'outlined'}
                    color={pkg.id === 3 ? 'success' : 'primary'}
                    fullWidth
                    size="large"
                    onClick={() => handleSelectPackage(pkg.id)}
                    startIcon={<CardGiftcardIcon />}
                    sx={{
                      mt: 'auto',
                      py: 1.5,
                      fontWeight: 600,
                    }}
                  >
                    Escolher {pkg.title.split(' ')[0]} Assistentes
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Nota sobre personalização */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            💡 Dica: Clique no cabeçalho acima para ver mais opções na loja
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PricingModal;
