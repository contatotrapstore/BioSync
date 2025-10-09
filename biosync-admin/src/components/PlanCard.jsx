import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  CardMembership as PlanIcon
} from '@mui/icons-material';

const PlanCard = ({ plan, onEdit, onDelete }) => {
  const includedGames = plan.games || [];

  return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              backgroundColor: 'primary.lighter',
              borderRadius: 2,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2
            }}
          >
            <PlanIcon sx={{ color: 'primary.main' }} />
          </Box>
          <Typography variant="h5" component="div" fontWeight="bold">
            {plan.name}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="h3" component="div" fontWeight="bold" color="primary">
            R$ {plan.price.toFixed(2)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            A cada {plan.durationDays} dia{plan.durationDays !== 1 ? 's' : ''}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {plan.description || 'Nenhuma descrição disponível'}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
          Recursos
        </Typography>

        {plan.features && plan.features.length > 0 ? (
          <List dense>
            {plan.features.map((feature, index) => (
              <ListItem key={feature + index} disableGutters>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckIcon sx={{ fontSize: 18, color: 'success.main' }} />
                </ListItemIcon>
                <ListItemText
                  primary={feature}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Nenhum recurso listado
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
          Jogos incluídos ({includedGames.length})
        </Typography>

        {includedGames.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhum jogo atribuído a este plano ainda
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {includedGames.map((game) => (
              <Chip key={game.id} label={game.name} size="small" />
            ))}
          </Box>
        )}

        <Box sx={{ mt: 2 }}>
          <Chip
            label={plan.isActive ? 'Ativo' : 'Inativo'}
            size="small"
            color={plan.isActive ? 'success' : 'default'}
          />
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          size="small"
          startIcon={<EditIcon />}
          onClick={() => onEdit(plan)}
          variant="outlined"
        >
          Editar
        </Button>
        <IconButton
          size="small"
          onClick={() => onDelete(plan.id)}
          color="error"
          sx={{ ml: 1 }}
        >
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};

export default PlanCard;
