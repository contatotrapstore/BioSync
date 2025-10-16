import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Avatar
} from '@mui/material';
import {
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PatientCard = ({ patient }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/psychologists/patients/${patient.id}`);
  };

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
          boxShadow: 6
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Patient Info */}
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 56, height: 56 }}>
            <PersonIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {patient.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {patient.email}
            </Typography>
            {patient.username && (
              <Typography variant="caption" color="text.secondary">
                @{patient.username}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Statistics */}
        <Box sx={{ mt: 2, mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Sessões:
            </Typography>
            <Chip
              label={patient.stats?.totalSessions || 0}
              size="small"
              color="default"
            />
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Média:
            </Typography>
            <Chip
              label={patient.stats?.avgScore || 0}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Melhor:
            </Typography>
            <Chip
              label={patient.stats?.bestScore || 0}
              size="small"
              color="success"
            />
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Jogos:
            </Typography>
            <Chip
              label={patient.stats?.totalGames || 0}
              size="small"
              color="info"
              variant="outlined"
            />
          </Box>
        </Box>

        {/* View Details Button */}
        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          startIcon={<VisibilityIcon />}
          onClick={handleViewDetails}
        >
          Ver Detalhes
        </Button>
      </CardContent>
    </Card>
  );
};

export default PatientCard;
