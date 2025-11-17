# 11 - FASE 5: RELATÓRIOS E ANALYTICS

## Visão Geral

O módulo de Relatórios fornece análises detalhadas e visualizações de dados para professores e direção, permitindo acompanhamento individual, comparação entre alunos/turmas, e identificação de padrões de atenção ao longo do tempo.

**Duração estimada**: 2 semanas
**Prioridade**: Média (Fase 5 do cronograma)
**Dependências**: Fases 1-4 completas; dados de sessões disponíveis

---

## Tipos de Relatórios

### 1. Relatórios do Professor

#### 1.1 Relatório Individual de Aluno
- Histórico completo de sessões
- Gráfico de evolução de atenção/relaxamento
- Comparação com média da turma
- Sessões com melhor/pior desempenho
- Recomendações personalizadas

#### 1.2 Relatório de Turma
- Ranking de alunos por atenção média
- Distribuição de níveis de atenção
- Comparação entre sessões
- Identificação de alunos que precisam atenção

#### 1.3 Relatório de Sessão
- Métricas agregadas da sessão
- Timeline de atenção coletiva
- Momentos críticos (quedas de atenção)
- Desempenho individual por aluno

### 2. Relatórios da Direção

#### 2.1 Dashboard Executivo
- Métricas globais (todos os professores/turmas)
- KPIs principais: taxa de engajamento, atenção média, total de sessões
- Comparação entre professores
- Comparação entre turmas

#### 2.2 Relatório de Professor
- Desempenho geral do professor
- Evolução ao longo do tempo
- Comparação com outros professores
- Turmas sob responsabilidade

#### 2.3 Análise Temporal
- Tendências mensais/semanais
- Períodos com maior/menor atenção
- Sazonalidade (ex: início/fim de semestre)

---

## Estrutura de Arquivos

```
frontend/
├── src/
│   ├── pages/
│   │   ├── teacher/
│   │   │   ├── ReportsTeacher.jsx           # Hub de relatórios
│   │   │   ├── StudentReport.jsx            # Relatório individual
│   │   │   └── ClassReport.jsx              # Relatório de turma
│   │   └── direction/
│   │       ├── ReportsDirection.jsx         # Dashboard executivo
│   │       ├── TeacherReport.jsx            # Relatório de professor
│   │       └── AnalyticsDirection.jsx       # Analytics avançado
│   ├── components/
│   │   └── reports/
│   │       ├── EvolutionChart.jsx           # Gráfico de evolução
│   │       ├── AttentionDistribution.jsx    # Distribuição de atenção
│   │       ├── SessionTimeline.jsx          # Timeline da sessão
│   │       ├── RankingTable.jsx             # Tabela de ranking
│   │       ├── ExportButton.jsx             # Exportação
│   │       └── ReportFilters.jsx            # Filtros de período
│   └── lib/
│       ├── report-generator.js              # Geração de relatórios
│       └── pdf-exporter.js                  # Exportação PDF
```

---

## Implementação Semana a Semana

### **Semana 1: Relatórios do Professor**

#### Dia 1-3: Relatório Individual de Aluno

**Arquivo**: `src/pages/teacher/StudentReport.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import EvolutionChart from '../../components/reports/EvolutionChart';
import AttentionDistribution from '../../components/reports/AttentionDistribution';
import ExportButton from '../../components/reports/ExportButton';
import { generatePDF } from '../../lib/pdf-exporter';

export default function StudentReport() {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [metrics, setMetrics] = useState({
    totalSessions: 0,
    avgAttention: 0,
    avgRelaxation: 0,
    totalHours: 0,
    bestSession: null,
    worstSession: null
  });
  const [evolutionData, setEvolutionData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  const fetchStudentData = async () => {
    try {
      // Dados do aluno
      const { data: studentData } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', studentId)
        .single();

      setStudent(studentData);

      // Sessões do aluno
      const { data: participations } = await supabase
        .from('session_participants')
        .select(`
          session:sessions(
            id,
            start_time,
            end_time,
            class:classes(name)
          )
        `)
        .eq('student_id', studentId)
        .order('joined_at', { ascending: false });

      const sessionsList = participations?.map(p => p.session) || [];
      setSessions(sessionsList);

      // Métricas do aluno
      const { data: studentMetrics } = await supabase
        .from('student_metrics')
        .select('*')
        .eq('student_id', studentId);

      if (studentMetrics && studentMetrics.length > 0) {
        // Calcular métricas agregadas
        const totalSessions = studentMetrics.length;
        const avgAttention = studentMetrics.reduce((sum, m) => sum + m.avg_attention, 0) / totalSessions;
        const avgRelaxation = studentMetrics.reduce((sum, m) => sum + m.avg_relaxation, 0) / totalSessions;
        const totalMinutes = studentMetrics.reduce((sum, m) => sum + m.duration_minutes, 0);

        // Melhor e pior sessão
        const sorted = [...studentMetrics].sort((a, b) => b.avg_attention - a.avg_attention);
        const bestSession = sorted[0];
        const worstSession = sorted[sorted.length - 1];

        setMetrics({
          totalSessions,
          avgAttention: avgAttention.toFixed(1),
          avgRelaxation: avgRelaxation.toFixed(1),
          totalHours: (totalMinutes / 60).toFixed(1),
          bestSession,
          worstSession
        });

        // Dados de evolução
        const evolution = studentMetrics.map(m => ({
          date: m.created_at,
          attention: m.avg_attention,
          relaxation: m.avg_relaxation
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        setEvolutionData(evolution);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do aluno:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    generatePDF({
      title: `Relatório Individual - ${student.name}`,
      student,
      metrics,
      evolutionData,
      sessions
    });
  };

  if (loading) {
    return <div className="loading">Carregando relatório...</div>;
  }

  return (
    <div className="student-report">
      <div className="report-header">
        <div>
          <h1>Relatório Individual</h1>
          <p className="student-name">{student.name}</p>
          <p className="student-email">{student.email}</p>
        </div>
        <ExportButton onExportPDF={handleExportPDF} />
      </div>

      {/* Métricas Resumidas */}
      <div className="metrics-summary">
        <div className="metric-box">
          <h3>Total de Sessões</h3>
          <p className="metric-value">{metrics.totalSessions}</p>
        </div>
        <div className="metric-box">
          <h3>Atenção Média</h3>
          <p className="metric-value">{metrics.avgAttention}%</p>
        </div>
        <div className="metric-box">
          <h3>Relaxamento Médio</h3>
          <p className="metric-value">{metrics.avgRelaxation}%</p>
        </div>
        <div className="metric-box">
          <h3>Horas Totais</h3>
          <p className="metric-value">{metrics.totalHours}h</p>
        </div>
      </div>

      {/* Gráfico de Evolução */}
      <div className="report-section">
        <h2>Evolução ao Longo do Tempo</h2>
        <EvolutionChart data={evolutionData} />
      </div>

      {/* Distribuição de Atenção */}
      <div className="report-section">
        <h2>Distribuição de Níveis de Atenção</h2>
        <AttentionDistribution sessions={sessions} studentId={studentId} />
      </div>

      {/* Melhor e Pior Sessão */}
      <div className="report-section">
        <h2>Desempenho Destacado</h2>
        <div className="comparison-boxes">
          {metrics.bestSession && (
            <div className="highlight-box highlight-best">
              <h3>✅ Melhor Sessão</h3>
              <p>Atenção: {metrics.bestSession.avg_attention.toFixed(1)}%</p>
              <p>Data: {new Date(metrics.bestSession.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          )}
          {metrics.worstSession && (
            <div className="highlight-box highlight-worst">
              <h3>⚠️ Sessão com Mais Dificuldade</h3>
              <p>Atenção: {metrics.worstSession.avg_attention.toFixed(1)}%</p>
              <p>Data: {new Date(metrics.worstSession.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Histórico de Sessões */}
      <div className="report-section">
        <h2>Histórico Completo</h2>
        <table className="sessions-history-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Turma</th>
              <th>Duração</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(session => (
              <tr key={session.id}>
                <td>{new Date(session.start_time).toLocaleDateString('pt-BR')}</td>
                <td>{session.class.name}</td>
                <td>
                  {session.end_time
                    ? calculateDuration(session.start_time, session.end_time)
                    : 'Em andamento'
                  }
                </td>
                <td>
                  <span className={session.end_time ? 'badge-finished' : 'badge-active'}>
                    {session.end_time ? 'Finalizada' : 'Ativa'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function calculateDuration(start, end) {
  const diff = new Date(end) - new Date(start);
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
```

---

**Arquivo**: `src/components/reports/EvolutionChart.jsx`

```jsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function EvolutionChart({ data }) {
  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString('pt-BR')),
    datasets: [
      {
        label: 'Atenção',
        data: data.map(d => d.attention),
        borderColor: '#CDA434',
        backgroundColor: 'rgba(205, 164, 52, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Relaxamento',
        data: data.map(d => d.relaxation),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: (value) => value + '%'
        }
      }
    }
  };

  return (
    <div className="evolution-chart" style={{ height: '400px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
```

**Arquivo**: `src/components/reports/AttentionDistribution.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AttentionDistribution({ studentId }) {
  const [distribution, setDistribution] = useState({ low: 0, medium: 0, high: 0 });

  useEffect(() => {
    fetchDistribution();
  }, [studentId]);

  const fetchDistribution = async () => {
    const { data: metrics } = await supabase
      .from('student_metrics')
      .select('avg_attention')
      .eq('student_id', studentId);

    if (metrics) {
      const dist = { low: 0, medium: 0, high: 0 };

      metrics.forEach(m => {
        if (m.avg_attention < 40) dist.low++;
        else if (m.avg_attention < 70) dist.medium++;
        else dist.high++;
      });

      setDistribution(dist);
    }
  };

  const chartData = {
    labels: ['Baixa (<40%)', 'Média (40-70%)', 'Alta (≥70%)'],
    datasets: [{
      data: [distribution.low, distribution.medium, distribution.high],
      backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
      borderWidth: 2,
      borderColor: '#0B0B0B'
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  return (
    <div className="attention-distribution" style={{ height: '300px' }}>
      <Pie data={chartData} options={options} />
    </div>
  );
}
```

---

#### Dia 4-5: Relatório de Turma

**Arquivo**: `src/pages/teacher/ClassReport.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import RankingTable from '../../components/reports/RankingTable';
import ExportButton from '../../components/reports/ExportButton';

export default function ClassReport() {
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassData();
  }, [classId]);

  const fetchClassData = async () => {
    try {
      // Dados da turma
      const { data: cls } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          description,
          teacher:users!teacher_id(name)
        `)
        .eq('id', classId)
        .single();

      setClassData(cls);

      // Alunos da turma
      const { data: classStudents } = await supabase
        .from('class_students')
        .select(`
          student:users!student_id(id, name, email)
        `)
        .eq('class_id', classId);

      const studentIds = classStudents?.map(cs => cs.student.id) || [];

      // Métricas dos alunos
      const { data: metrics } = await supabase
        .from('student_metrics')
        .select('student_id, avg_attention, avg_relaxation, duration_minutes')
        .in('student_id', studentIds);

      // Agregar métricas por aluno
      const studentsWithMetrics = classStudents.map(cs => {
        const studentMetrics = metrics?.filter(m => m.student_id === cs.student.id) || [];
        const totalSessions = studentMetrics.length;

        if (totalSessions === 0) {
          return {
            ...cs.student,
            totalSessions: 0,
            avgAttention: 0,
            avgRelaxation: 0,
            totalMinutes: 0
          };
        }

        const avgAttention = studentMetrics.reduce((sum, m) => sum + m.avg_attention, 0) / totalSessions;
        const avgRelaxation = studentMetrics.reduce((sum, m) => sum + m.avg_relaxation, 0) / totalSessions;
        const totalMinutes = studentMetrics.reduce((sum, m) => sum + m.duration_minutes, 0);

        return {
          ...cs.student,
          totalSessions,
          avgAttention,
          avgRelaxation,
          totalMinutes
        };
      });

      // Ordenar por atenção média (maior primeiro)
      studentsWithMetrics.sort((a, b) => b.avgAttention - a.avgAttention);

      setStudents(studentsWithMetrics);

      // Sessões da turma
      const { data: classSessions } = await supabase
        .from('sessions')
        .select('id, start_time, end_time')
        .eq('class_id', classId)
        .order('start_time', { ascending: false });

      setSessions(classSessions || []);
    } catch (error) {
      console.error('Erro ao carregar relatório de turma:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['Ranking', 'Aluno', 'Email', 'Sessões', 'Atenção Média', 'Relaxamento Médio', 'Tempo Total'],
      ...students.map((s, i) => [
        i + 1,
        s.name,
        s.email,
        s.totalSessions,
        s.avgAttention.toFixed(1) + '%',
        s.avgRelaxation.toFixed(1) + '%',
        (s.totalMinutes / 60).toFixed(1) + 'h'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_turma_${classData.name}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return <div className="loading">Carregando relatório...</div>;
  }

  return (
    <div className="class-report">
      <div className="report-header">
        <div>
          <h1>Relatório de Turma</h1>
          <p className="class-name">{classData.name}</p>
          <p className="teacher-name">Professor: {classData.teacher.name}</p>
        </div>
        <ExportButton onExportCSV={handleExportCSV} />
      </div>

      {/* Estatísticas Gerais */}
      <div className="class-stats">
        <div className="stat-box">
          <h3>Total de Alunos</h3>
          <p className="stat-value">{students.length}</p>
        </div>
        <div className="stat-box">
          <h3>Sessões Realizadas</h3>
          <p className="stat-value">{sessions.length}</p>
        </div>
        <div className="stat-box">
          <h3>Atenção Média da Turma</h3>
          <p className="stat-value">
            {students.length > 0
              ? (students.reduce((sum, s) => sum + s.avgAttention, 0) / students.length).toFixed(1)
              : 0
            }%
          </p>
        </div>
      </div>

      {/* Ranking de Alunos */}
      <div className="report-section">
        <h2>Ranking de Alunos</h2>
        <RankingTable students={students} />
      </div>

      {/* Alunos que Precisam de Atenção */}
      <div className="report-section">
        <h2>⚠️ Alunos que Precisam de Atenção</h2>
        {students.filter(s => s.avgAttention < 40).length === 0 ? (
          <p className="empty-state">Nenhum aluno com atenção abaixo de 40%</p>
        ) : (
          <div className="alert-students-list">
            {students.filter(s => s.avgAttention < 40).map(student => (
              <div key={student.id} className="alert-student-card">
                <h4>{student.name}</h4>
                <p>Atenção média: {student.avgAttention.toFixed(1)}%</p>
                <p>Sessões: {student.totalSessions}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Arquivo**: `src/components/reports/RankingTable.jsx`

```jsx
import React from 'react';

export default function RankingTable({ students }) {
  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}º`;
  };

  return (
    <table className="ranking-table">
      <thead>
        <tr>
          <th>Ranking</th>
          <th>Aluno</th>
          <th>Sessões</th>
          <th>Atenção Média</th>
          <th>Relaxamento Médio</th>
          <th>Tempo Total</th>
        </tr>
      </thead>
      <tbody>
        {students.map((student, index) => (
          <tr key={student.id} className={index < 3 ? 'top-three' : ''}>
            <td className="rank-cell">{getMedalEmoji(index + 1)}</td>
            <td>{student.name}</td>
            <td>{student.totalSessions}</td>
            <td>
              <span className={`attention-badge attention-${getAttentionLevel(student.avgAttention)}`}>
                {student.avgAttention.toFixed(1)}%
              </span>
            </td>
            <td>{student.avgRelaxation.toFixed(1)}%</td>
            <td>{(student.totalMinutes / 60).toFixed(1)}h</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function getAttentionLevel(attention) {
  if (attention < 40) return 'low';
  if (attention < 70) return 'medium';
  return 'high';
}
```

---

### **Semana 2: Relatórios da Direção e Exportação**

#### Dashboard Executivo

**Arquivo**: `src/pages/direction/ReportsDirection.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Line, Bar } from 'react-chartjs-2';
import ReportFilters from '../../components/reports/ReportFilters';

export default function ReportsDirection() {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [globalMetrics, setGlobalMetrics] = useState({
    totalSessions: 0,
    totalStudents: 0,
    avgAttention: 0,
    totalHours: 0
  });
  const [teacherStats, setTeacherStats] = useState([]);
  const [classStats, setClassStats] = useState([]);
  const [trendsData, setTrendsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGlobalData();
  }, [dateRange]);

  const fetchGlobalData = async () => {
    try {
      // Sessões no período
      const { data: sessions, count: totalSessions } = await supabase
        .from('sessions')
        .select('*', { count: 'exact' })
        .gte('start_time', dateRange.start)
        .lte('start_time', dateRange.end);

      // Total de alunos únicos
      const { data: participants } = await supabase
        .from('session_participants')
        .select('student_id')
        .in('session_id', sessions?.map(s => s.id) || []);

      const uniqueStudents = new Set(participants?.map(p => p.student_id) || []).size;

      // Métricas agregadas
      const { data: sessionMetrics } = await supabase
        .from('session_metrics')
        .select('avg_attention, avg_relaxation')
        .in('session_id', sessions?.map(s => s.id) || []);

      const avgAttention = sessionMetrics?.length
        ? sessionMetrics.reduce((sum, m) => sum + m.avg_attention, 0) / sessionMetrics.length
        : 0;

      // Total de horas
      const totalMinutes = sessions?.reduce((sum, s) => {
        if (!s.end_time) return sum;
        const diff = new Date(s.end_time) - new Date(s.start_time);
        return sum + diff / 60000;
      }, 0) || 0;

      setGlobalMetrics({
        totalSessions: totalSessions || 0,
        totalStudents: uniqueStudents,
        avgAttention: avgAttention.toFixed(1),
        totalHours: (totalMinutes / 60).toFixed(1)
      });

      // Estatísticas por professor
      await fetchTeacherStats(sessions);

      // Estatísticas por turma
      await fetchClassStats(sessions);

      // Tendências temporais
      await fetchTrends(dateRange);
    } catch (error) {
      console.error('Erro ao carregar dados globais:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherStats = async (sessions) => {
    const teacherMap = {};

    sessions?.forEach(s => {
      if (!teacherMap[s.teacher_id]) {
        teacherMap[s.teacher_id] = {
          teacherId: s.teacher_id,
          sessionsCount: 0
        };
      }
      teacherMap[s.teacher_id].sessionsCount++;
    });

    // Buscar nomes dos professores
    const teacherIds = Object.keys(teacherMap);
    const { data: teachers } = await supabase
      .from('users')
      .select('id, name')
      .in('id', teacherIds);

    const stats = teachers?.map(t => ({
      id: t.id,
      name: t.name,
      sessionsCount: teacherMap[t.id].sessionsCount
    })) || [];

    stats.sort((a, b) => b.sessionsCount - a.sessionsCount);
    setTeacherStats(stats);
  };

  const fetchClassStats = async (sessions) => {
    const classMap = {};

    sessions?.forEach(s => {
      if (!classMap[s.class_id]) {
        classMap[s.class_id] = {
          classId: s.class_id,
          sessionsCount: 0
        };
      }
      classMap[s.class_id].sessionsCount++;
    });

    const classIds = Object.keys(classMap);
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name')
      .in('id', classIds);

    const stats = classes?.map(c => ({
      id: c.id,
      name: c.name,
      sessionsCount: classMap[c.id].sessionsCount
    })) || [];

    stats.sort((a, b) => b.sessionsCount - a.sessionsCount);
    setClassStats(stats);
  };

  const fetchTrends = async (range) => {
    // Buscar métricas agregadas por dia
    const { data: metrics } = await supabase
      .from('session_metrics')
      .select('created_at, avg_attention')
      .gte('created_at', range.start)
      .lte('created_at', range.end)
      .order('created_at');

    // Agrupar por dia
    const dayMap = {};
    metrics?.forEach(m => {
      const day = m.created_at.split('T')[0];
      if (!dayMap[day]) {
        dayMap[day] = { sum: 0, count: 0 };
      }
      dayMap[day].sum += m.avg_attention;
      dayMap[day].count++;
    });

    const trends = Object.keys(dayMap).map(day => ({
      date: day,
      avgAttention: dayMap[day].sum / dayMap[day].count
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    setTrendsData(trends);
  };

  if (loading) {
    return <div className="loading">Carregando dashboard executivo...</div>;
  }

  const trendsChartData = {
    labels: trendsData.map(t => new Date(t.date).toLocaleDateString('pt-BR')),
    datasets: [{
      label: 'Atenção Média Diária',
      data: trendsData.map(t => t.avgAttention),
      borderColor: '#CDA434',
      backgroundColor: 'rgba(205, 164, 52, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  return (
    <div className="reports-direction">
      <div className="page-header">
        <h1>Dashboard Executivo</h1>
        <ReportFilters dateRange={dateRange} setDateRange={setDateRange} />
      </div>

      {/* KPIs Globais */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <h3>Total de Sessões</h3>
          <p className="kpi-value">{globalMetrics.totalSessions}</p>
        </div>
        <div className="kpi-card">
          <h3>Alunos Ativos</h3>
          <p className="kpi-value">{globalMetrics.totalStudents}</p>
        </div>
        <div className="kpi-card">
          <h3>Atenção Média Global</h3>
          <p className="kpi-value">{globalMetrics.avgAttention}%</p>
        </div>
        <div className="kpi-card">
          <h3>Horas Totais</h3>
          <p className="kpi-value">{globalMetrics.totalHours}h</p>
        </div>
      </div>

      {/* Tendências Temporais */}
      <div className="report-section">
        <h2>Tendências de Atenção</h2>
        <div style={{ height: '300px' }}>
          <Line data={trendsChartData} options={{ maintainAspectRatio: false }} />
        </div>
      </div>

      {/* Rankings */}
      <div className="rankings-grid">
        <div className="ranking-section">
          <h2>Top Professores (Sessões)</h2>
          <ul className="ranking-list">
            {teacherStats.slice(0, 5).map((teacher, i) => (
              <li key={teacher.id}>
                <span className="rank">{i + 1}º</span>
                <span className="name">{teacher.name}</span>
                <span className="count">{teacher.sessionsCount} sessões</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="ranking-section">
          <h2>Top Turmas (Sessões)</h2>
          <ul className="ranking-list">
            {classStats.slice(0, 5).map((cls, i) => (
              <li key={cls.id}>
                <span className="rank">{i + 1}º</span>
                <span className="name">{cls.name}</span>
                <span className="count">{cls.sessionsCount} sessões</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
```

**Arquivo**: `src/components/reports/ReportFilters.jsx`

```jsx
import React from 'react';

export default function ReportFilters({ dateRange, setDateRange }) {
  const presets = {
    '7days': { label: 'Últimos 7 dias', days: 7 },
    '30days': { label: 'Últimos 30 dias', days: 30 },
    '90days': { label: 'Últimos 90 dias', days: 90 },
    'thisMonth': { label: 'Este mês' },
    'lastMonth': { label: 'Mês passado' }
  };

  const applyPreset = (preset) => {
    const today = new Date();
    let start, end = today.toISOString().split('T')[0];

    if (preset === 'thisMonth') {
      start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    } else if (preset === 'lastMonth') {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      start = lastMonth.toISOString().split('T')[0];
      end = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
    } else {
      start = new Date(Date.now() - presets[preset].days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    setDateRange({ start, end });
  };

  return (
    <div className="report-filters">
      <div className="preset-buttons">
        {Object.keys(presets).map(key => (
          <button
            key={key}
            onClick={() => applyPreset(key)}
            className="btn-preset"
          >
            {presets[key].label}
          </button>
        ))}
      </div>

      <div className="custom-range">
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
        />
        <span>até</span>
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
        />
      </div>
    </div>
  );
}
```

---

#### Exportação PDF

**Arquivo**: `src/lib/pdf-exporter.js`

```javascript
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function generatePDF(reportData) {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.text(reportData.title, 14, 22);

  // Data de geração
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);

  let yPos = 40;

  // Informações do estudante (se aplicável)
  if (reportData.student) {
    doc.setFontSize(12);
    doc.text(`Aluno: ${reportData.student.name}`, 14, yPos);
    yPos += 7;
    doc.text(`Email: ${reportData.student.email}`, 14, yPos);
    yPos += 10;
  }

  // Métricas resumidas
  if (reportData.metrics) {
    doc.setFontSize(14);
    doc.text('Métricas Resumidas', 14, yPos);
    yPos += 10;

    const metricsData = [
      ['Total de Sessões', reportData.metrics.totalSessions],
      ['Atenção Média', `${reportData.metrics.avgAttention}%`],
      ['Relaxamento Médio', `${reportData.metrics.avgRelaxation}%`],
      ['Horas Totais', `${reportData.metrics.totalHours}h`]
    ];

    doc.autoTable({
      startY: yPos,
      head: [['Métrica', 'Valor']],
      body: metricsData,
      theme: 'grid',
      headStyles: { fillColor: [205, 164, 52] }
    });

    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Histórico de sessões
  if (reportData.sessions && reportData.sessions.length > 0) {
    doc.setFontSize(14);
    doc.text('Histórico de Sessões', 14, yPos);
    yPos += 10;

    const sessionsData = reportData.sessions.map(s => [
      new Date(s.start_time).toLocaleDateString('pt-BR'),
      s.class?.name || '-',
      s.end_time ? 'Finalizada' : 'Ativa'
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Data', 'Turma', 'Status']],
      body: sessionsData,
      theme: 'striped'
    });
  }

  // Salvar PDF
  doc.save(`relatorio_${new Date().toISOString().split('T')[0]}.pdf`);
}
```

**Arquivo**: `src/components/reports/ExportButton.jsx`

```jsx
import React, { useState } from 'react';

export default function ExportButton({ onExportPDF, onExportCSV }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="export-button-container">
      <button onClick={() => setShowMenu(!showMenu)} className="btn-secondary">
        📥 Exportar
      </button>

      {showMenu && (
        <div className="export-menu">
          {onExportPDF && (
            <button onClick={() => { onExportPDF(); setShowMenu(false); }}>
              📄 PDF
            </button>
          )}
          {onExportCSV && (
            <button onClick={() => { onExportCSV(); setShowMenu(false); }}>
              📊 CSV
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## CSS dos Relatórios

**Arquivo**: `src/styles/reports.css`

```css
/* Student Report */
.student-report {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.metrics-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.metric-box {
  background: var(--surface-dark);
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
}

.metric-box h3 {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.metric-value {
  color: var(--gold);
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

.comparison-boxes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.highlight-box {
  padding: 1.5rem;
  border-radius: 12px;
  border-left: 4px solid;
}

.highlight-best {
  background: rgba(16, 185, 129, 0.1);
  border-left-color: #10B981;
}

.highlight-worst {
  background: rgba(239, 68, 68, 0.1);
  border-left-color: #EF4444;
}

/* Ranking Table */
.ranking-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.ranking-table th,
.ranking-table td {
  text-align: left;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.ranking-table .top-three {
  background: rgba(205, 164, 52, 0.1);
}

.rank-cell {
  font-size: 1.25rem;
  font-weight: 700;
}

.attention-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
}

.attention-low { background: #EF4444; color: white; }
.attention-medium { background: #F59E0B; color: white; }
.attention-high { background: #10B981; color: white; }

/* Direction Reports */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.kpi-card {
  background: linear-gradient(135deg, var(--surface-dark), var(--bg-dark));
  padding: 2rem;
  border-radius: 12px;
  border: 2px solid var(--border-color);
}

.kpi-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--gold);
  margin: 0.5rem 0 0 0;
}

.rankings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.ranking-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0 0 0;
}

.ranking-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--surface-dark);
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.ranking-list .rank {
  font-weight: 700;
  color: var(--gold);
  min-width: 40px;
}

.ranking-list .name {
  flex: 1;
}

.ranking-list .count {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* Report Filters */
.report-filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.preset-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-preset {
  padding: 0.5rem 1rem;
  background: var(--surface-dark);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-primary);
  transition: all 0.2s;
}

.btn-preset:hover {
  background: var(--gold);
  color: var(--bg-dark);
}

.custom-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.custom-range input[type="date"] {
  padding: 0.5rem;
  background: var(--surface-dark);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
}

/* Export Button */
.export-button-container {
  position: relative;
}

.export-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: var(--surface-dark);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  z-index: 10;
}

.export-menu button {
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.export-menu button:hover {
  background: var(--bg-dark);
}
```

---

## Checklist de Conclusão

- [ ] Relatório individual de aluno
- [ ] Gráfico de evolução temporal
- [ ] Distribuição de níveis de atenção
- [ ] Relatório de turma com ranking
- [ ] Identificação de alunos com dificuldade
- [ ] Dashboard executivo da direção
- [ ] Filtros de período (presets e customizado)
- [ ] Tendências temporais
- [ ] Rankings de professores e turmas
- [ ] Exportação PDF
- [ ] Exportação CSV
- [ ] Testes de todos os relatórios

---

## Próximos Passos

Após completar a Fase 5 (Relatórios), seguir para:

**Documentação Técnica Complementar**:
- 16-METRICAS-CALCULOS.md: Fórmulas e cálculos detalhados
- 17-SEGURANCA-LGPD.md: Segurança e compliance
- 18-DEPLOY-INFRAESTRUTURA.md: Deploy e infraestrutura
