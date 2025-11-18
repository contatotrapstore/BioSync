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

// Validation functions
function validateName(value) {
  if (!value || !value.trim()) return 'Nome da turma é obrigatório';
  if (value.trim().length < 3) return 'Nome deve ter pelo menos 3 caracteres';
  if (value.length > 100) return 'Nome muito longo (máximo 100 caracteres)';
  return '';
}

function validateSchoolYear(value) {
  if (!value) return ''; // Optional field
  if (value.length > 20) return 'Ano letivo muito longo (máximo 20 caracteres)';
  return '';
}

function validateDescription(value) {
  if (!value) return ''; // Optional field
  if (value.length > 500) return 'Descrição muito longa (máximo 500 caracteres)';
  return '';
}

export function ClassForm({ classData, open, onClose, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    school_year: '',
    subject: '',
    description: '',
    active: true,
  });

  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    school_year: '',
    description: '',
  });

  const [touched, setTouched] = useState({
    name: false,
    school_year: false,
    description: false,
  });

  // Carregar alunos e professores disponíveis
  useEffect(() => {
    if (open) {
      fetchAvailableStudents();
      fetchAvailableTeachers();
    }
  }, [open]);

  // Preencher formulário ao editar
  useEffect(() => {
    if (classData && open) {
      setFormData({
        name: classData.name || '',
        school_year: classData.school_year || '',
        subject: classData.subject || '',
        description: classData.description || '',
        active: classData.active !== undefined ? classData.active : true,
      });

      // Carregar professor se houver
      if (classData.teacher_id && availableTeachers.length > 0) {
        const teacher = availableTeachers.find(t => t.id === classData.teacher_id);
        setSelectedTeacher(teacher || null);
      }

      // Carregar alunos já matriculados
      fetchClassStudents(classData.id);
    } else if (!classData && open) {
      // Resetar formulário para novo
      setFormData({
        name: '',
        school_year: '',
        subject: '',
        description: '',
        active: true,
      });
      setSelectedStudents([]);
      setSelectedTeacher(null);
      setError('');
      setFieldErrors({ name: '', school_year: '', description: '' });
      setTouched({ name: false, school_year: false, description: false });
    }
  }, [classData, open, availableTeachers]);

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

  async function fetchAvailableTeachers() {
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
        throw new Error(result.error || 'Erro ao buscar professores');
      }

      // Filtrar apenas professores ativos
      const teachers = (result.data || [])
        .filter(user => user.user_role === 'professor' && user.active)
        .sort((a, b) => a.name.localeCompare(b.name));

      setAvailableTeachers(teachers);
    } catch (err) {
      console.error('Erro ao buscar professores:', err);
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

  const validateField = (field, value) => {
    switch (field) {
      case 'name':
        return validateName(value);
      case 'school_year':
        return validateSchoolYear(value);
      case 'description':
        return validateDescription(value);
      default:
        return '';
    }
  };

  function handleChange(field) {
    return (event) => {
      const value = field === 'active' ? event.target.checked : event.target.value;
      setFormData(prev => ({ ...prev, [field]: value }));

      // Validate on change if field was already touched
      if (touched[field]) {
        const errorMsg = validateField(field, value);
        setFieldErrors({ ...fieldErrors, [field]: errorMsg });
      }
    };
  }

  const handleBlur = (field) => () => {
    // Mark field as touched
    setTouched({ ...touched, [field]: true });

    // Validate on blur
    const errorMsg = validateField(field, formData[field]);
    setFieldErrors({ ...fieldErrors, [field]: errorMsg });
  };

  const hasErrors = () => {
    return (
      validateName(formData.name) ||
      validateSchoolYear(formData.school_year) ||
      validateDescription(formData.description)
    );
  };

  async function handleSubmit(event) {
    event.preventDefault();

    // Mark all fields as touched
    setTouched({ name: true, school_year: true, description: true });

    // Validate all fields
    const nameError = validateName(formData.name);
    const schoolYearError = validateSchoolYear(formData.school_year);
    const descriptionError = validateDescription(formData.description);

    setFieldErrors({
      name: nameError,
      school_year: schoolYearError,
      description: descriptionError,
    });

    // Stop if there are validation errors
    if (nameError || schoolYearError || descriptionError) {
      setError('Por favor, corrija os erros no formulário antes de continuar.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (classData) {
        // ATUALIZAR turma existente
        const response = await fetch(`${API_URL}/api/classes/${classData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            school_year: formData.school_year.trim() || null,
            subject: formData.subject.trim() || null,
            description: formData.description.trim() || null,
            teacher_id: selectedTeacher?.id || null,
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
            subject: formData.subject.trim() || null,
            description: formData.description.trim() || null,
            teacher_id: selectedTeacher?.id || null,
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
      setError(err.message || 'Erro ao salvar turma. Tente novamente.');
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
              onBlur={handleBlur('name')}
              error={touched.name && !!fieldErrors.name}
              helperText={
                touched.name && fieldErrors.name
                  ? fieldErrors.name
                  : 'Nome identificador da turma (ex: Matemática 8ºA)'
              }
              required
              fullWidth
              placeholder="Ex: Matemática 8ºA"
              autoFocus
            />

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Professor Responsável
              </Typography>
              <Autocomplete
                options={availableTeachers}
                getOptionLabel={(option) => option.name}
                value={selectedTeacher}
                onChange={(event, newValue) => setSelectedTeacher(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Selecione o professor responsável"
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                {selectedTeacher ? `Professor: ${selectedTeacher.name}` : 'Nenhum professor selecionado'}
              </Typography>
            </Box>

            <TextField
              label="Matéria/Disciplina"
              value={formData.subject}
              onChange={handleChange('subject')}
              fullWidth
              placeholder="Ex: Matemática, Português, História"
              helperText="Matéria ou disciplina da turma (opcional)"
            />

            <TextField
              label="Ano Letivo"
              value={formData.school_year}
              onChange={handleChange('school_year')}
              onBlur={handleBlur('school_year')}
              error={touched.school_year && !!fieldErrors.school_year}
              helperText={
                touched.school_year && fieldErrors.school_year
                  ? fieldErrors.school_year
                  : 'Ano letivo ou série (ex: 2025, 8º Ano)'
              }
              fullWidth
              placeholder="Ex: 2025 ou 8º Ano"
            />

            <TextField
              label="Descrição"
              value={formData.description}
              onChange={handleChange('description')}
              onBlur={handleBlur('description')}
              error={touched.description && !!fieldErrors.description}
              helperText={
                touched.description && fieldErrors.description
                  ? fieldErrors.description
                  : `Descrição opcional da turma (${formData.description.length}/500 caracteres)`
              }
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
          <Button
            type="submit"
            variant="contained"
            loading={loading}
            disabled={loading || (touched.name && touched.school_year && touched.description && hasErrors())}
          >
            Salvar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
