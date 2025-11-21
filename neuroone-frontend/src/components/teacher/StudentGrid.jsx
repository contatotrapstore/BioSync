import React from 'react';
import { Grid } from '@mui/material';
import { StudentCard } from './StudentCard';

/**
 * Grid responsivo de cards de alunos
 * @param {Array} students - Array de alunos com dados EEG
 * @param {Object} thresholds - { low, high } para classificação de atenção
 */
export function StudentGrid({ students = [], thresholds = { low: 40, high: 70 } }) {
  return (
    <Grid container spacing={2}>
      {students.map((student) => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={student.id}>
          <StudentCard
            student={student}
            eegData={student.eegData || null}
            thresholds={thresholds}
            connected={student.connected || false}
            dataStale={student.dataStale || false}
          />
        </Grid>
      ))}
    </Grid>
  );
}
