import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Stack,
  TextField,
  CircularProgress,
  Grid,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { ClassTable } from '../../components/direction/ClassTable';
import { ClassForm } from '../../components/direction/ClassForm';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function ClassesManagement() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  // Stats
  const totalClasses = classes.length;
  const activeClasses = classes.filter(c => c.active).length;
  const inactiveClasses = totalClasses - activeClasses;
  const totalStudents = classes.reduce((sum, c) => sum + (c.student_count || 0), 0);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, classes]);

  async function fetchClasses() {
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

      setClasses(result.data || []);
    } catch (error) {
      console.error('Erro ao buscar turmas:', error);
      alert('Erro ao carregar turmas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...classes];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (classItem) =>
          classItem.name.toLowerCase().includes(searchLower) ||
          (classItem.school_year && classItem.school_year.toLowerCase().includes(searchLower)) ||
          (classItem.description && classItem.description.toLowerCase().includes(searchLower))
      );
    }

    setFilteredClasses(filtered);
  }

  function handleNewClass() {
    setEditingClass(null);
    setShowForm(true);
  }

  function handleEditClass(classData) {
    setEditingClass(classData);
    setShowForm(true);
  }

  async function handleDeleteClass(classId) {
    if (!window.confirm('Tem certeza que deseja desativar esta turma?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/classes/${classId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao desativar turma');
      }

      fetchClasses();
    } catch (error) {
      console.error('Erro ao desativar turma:', error);
      alert('Erro ao desativar turma. Tente novamente.');
    }
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingClass(null);
  }

  function handleFormSuccess() {
    fetchClasses();
  }

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            variant="text"
            onClick={() => navigate('/admin')}
            sx={{ mb: 2 }}
            startIcon={<ArrowBackIcon />}
          >
            Voltar ao Dashboard
          </Button>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h1">Gestão de Turmas</Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
                Gerenciar turmas e matrículas
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Stats Summary */}
        <Card sx={{ mb: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  Total de Turmas
                </Typography>
                <Typography variant="h2" sx={{ fontSize: '2rem', fontWeight: 700 }}>
                  {totalClasses}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  Turmas Ativas
                </Typography>
                <Typography variant="h2" sx={{ fontSize: '2rem', fontWeight: 700, color: 'success.main' }}>
                  {activeClasses}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  Turmas Inativas
                </Typography>
                <Typography variant="h2" sx={{ fontSize: '2rem', fontWeight: 700, color: 'text.secondary' }}>
                  {inactiveClasses}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  Total de Alunos
                </Typography>
                <Typography variant="h2" sx={{ fontSize: '2rem', fontWeight: 700, color: 'primary.main' }}>
                  {totalStudents}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Card>

        {/* Filters and Actions */}
        <Card sx={{ mb: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
            <TextField
              placeholder="Buscar por nome, ano letivo ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flex: 1 }}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            <Button variant="contained" onClick={handleNewClass}>
              + Nova Turma
            </Button>
          </Stack>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Exibindo <strong>{filteredClasses.length}</strong> de <strong>{totalClasses}</strong> turma(s)
            </Typography>
          </Box>
        </Card>

        {/* Table */}
        <ClassTable
          classes={filteredClasses}
          onEdit={handleEditClass}
          onDelete={handleDeleteClass}
        />

        {/* Form Modal */}
        <ClassForm
          classData={editingClass}
          open={showForm}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      </Box>
    </Container>
  );
}
