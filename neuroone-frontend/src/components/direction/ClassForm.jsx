import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
  Box,
  Chip,
  Autocomplete,
  Typography,
} from '@mui/material';
import { Button } from '../atoms/Button';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function ClassForm({ classData, open, onClose, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    school_year: '',
    description: '',
    active: true,
  });

  // Carregar alunos disponíveis
  useEffect(() => {
    if (open) {
      fetchAvailableStudents();
    }
  }, [open]);

  // Preencher formulário ao editar
  useEffect(() => {
    if (classData && open) {
      setFormData({
        name: classData.name || '',
        school_year: classData.school_year || '',
        description: classData.description || '',
        active: classData.active !== undefined ? classData.active : true,
      });

      // Carregar alunos já matriculados
      fetchClassStudents(classData.id);
    } else if (!classData && open) {
      // Resetar formulário para novo
      setFormData({
        name: '',
        school_year: '',
        description: '',
        active: true,
      });
      setSelectedStudents([]);
      setError('');
    }
  }, [classData, open]);

  async function fetchAvailableStudents() {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar alunos');
      }

      // Filtrar apenas alunos ativos
      const students = (result.data || [])
        .filter(user => user.user_role === 'aluno' && user.active)
        .sort((a, b) => a.name.localeCompare(b.name));

      setAvailableStudents(students);
    } catch (err) {
      console.error('Erro ao buscar alunos:', err);
    }
  }

  async function fetchClassStudents(classId) {
    try {
      const response = await fetch(`${API_URL}/api/classes/${classId}/students`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar alunos da turma');
      }

      setSelectedStudents(result.data || []);
    } catch (err) {
      console.error('Erro ao buscar alunos da turma:', err);
    }
  }

  function handleChange(field) {
    return (event) => {
      const value = field === 'active' ? event.target.checked : event.target.value;
      setFormData(prev => ({ ...prev, [field]: value }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.name.trim()) {
        throw new Error('Nome da turma é obrigatório');
      }

      if (classData) {
        // ATUALIZAR turma existente
        const response = await fetch(`${API_URL}/api/classes/${classData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            school_year: formData.school_year.trim() || null,
            description: formData.description.trim() || null,
            active: formData.active
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Erro ao atualizar turma');
        }

        // Atualizar relação de alunos
        await updateClassStudents(classData.id);
      } else {
        // CRIAR nova turma
        const response = await fetch(`${API_URL}/api/classes/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            school_year: formData.school_year.trim() || null,
            description: formData.description.trim() || null,
            created_by: user?.id,
            active: formData.active,
            student_ids: selectedStudents.map(s => s.id)
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Erro ao criar turma');
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar turma:', err);
      setError(err.message || 'Erro ao salvar turma');
    } finally {
      setLoading(false);
    }
  }

  async function updateClassStudents(classId) {
    try {
      const response = await fetch(`${API_URL}/api/classes/${classId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_ids: selectedStudents.map(s => s.id)
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar alunos');
      }
    } catch (err) {
      console.error('Erro ao atualizar alunos da turma:', err);
      throw err;
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {classData ? 'Editar Turma' : 'Nova Turma'}
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nome da Turma"
              value={formData.name}
              onChange={handleChange('name')}
              required
              fullWidth
              placeholder="Ex: Matemática 8ºA"
              autoFocus
            />

            <TextField
              label="Ano Letivo"
              value={formData.school_year}
              onChange={handleChange('school_year')}
              fullWidth
              placeholder="Ex: 2025 ou 8º Ano"
            />

            <TextField
              label="Descrição"
              value={formData.description}
              onChange={handleChange('description')}
              fullWidth
              multiline
              rows={3}
              placeholder="Descrição opcional da turma"
            />

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Alunos da Turma
              </Typography>
              <Autocomplete
                multiple
                options={availableStudents}
                getOptionLabel={(option) => option.name}
                value={selectedStudents}
                onChange={(event, newValue) => setSelectedStudents(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Selecione os alunos"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.name}
                      {...getTagProps({ index })}
                      size="small"
                    />
                  ))
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                {selectedStudents.length} aluno(s) selecionado(s)
              </Typography>
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.active}
                  onChange={handleChange('active')}
                />
              }
              label="Turma ativa"
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
