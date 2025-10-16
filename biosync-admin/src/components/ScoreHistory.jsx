import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
  TablePagination,
  TextField,
  MenuItem,
  Grid
} from '@mui/material';
import { SportsEsports as GameIcon } from '@mui/icons-material';

const ScoreHistory = ({ scores }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [gameFilter, setGameFilter] = useState('all');

  // Obter lista de jogos únicos para o filtro
  const uniqueGames = useMemo(() => {
    if (!scores) return [];
    const gamesMap = new Map();
    scores.forEach((score) => {
      if (score.games && !gamesMap.has(score.games.slug)) {
        gamesMap.set(score.games.slug, score.games.name);
      }
    });
    return Array.from(gamesMap.entries()).map(([slug, name]) => ({ slug, name }));
  }, [scores]);

  // Filtrar pontuações
  const filteredScores = useMemo(() => {
    if (!scores) return [];
    if (gameFilter === 'all') return scores;
    return scores.filter((score) => score.games?.slug === gameFilter);
  }, [scores, gameFilter]);

  // Paginar pontuações
  const paginatedScores = useMemo(() => {
    return filteredScores.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredScores, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 50) return 'warning';
    return 'error';
  };

  if (!scores || scores.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
        Nenhuma pontuação registrada
      </Typography>
    );
  }

  return (
    <Box>
      {/* Filters */}
      {uniqueGames.length > 1 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              label="Filtrar por Jogo"
              value={gameFilter}
              onChange={(e) => {
                setGameFilter(e.target.value);
                setPage(0);
              }}
              size="small"
            >
              <MenuItem value="all">Todos os Jogos</MenuItem>
              {uniqueGames.map((game) => (
                <MenuItem key={game.slug} value={game.slug}>
                  {game.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      )}

      {/* Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  <GameIcon fontSize="small" />
                  <Typography variant="body2" fontWeight="bold">
                    Jogo
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2" fontWeight="bold">
                  Pontuação
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight="bold">
                  Data/Hora
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight="bold">
                  Categoria
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedScores.map((score, index) => (
              <TableRow
                key={score.id || index}
                sx={{
                  '&:hover': { bgcolor: 'action.hover' },
                  '&:last-child td, &:last-child th': { border: 0 }
                }}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight="500">
                    {score.games?.name || 'Jogo sem nome'}
                  </Typography>
                  {score.games?.slug && (
                    <Typography variant="caption" color="text.secondary">
                      {score.games.slug}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={score.score}
                    color={getScoreColor(score.score)}
                    size="small"
                    sx={{ fontWeight: 'bold', minWidth: 60 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{formatDate(score.created_at)}</Typography>
                </TableCell>
                <TableCell>
                  {score.games?.category ? (
                    <Chip label={score.games.category} size="small" variant="outlined" />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {paginatedScores.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Nenhuma sessão encontrada com os filtros selecionados
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={filteredScores.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Linhas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />
    </Box>
  );
};

export default ScoreHistory;
