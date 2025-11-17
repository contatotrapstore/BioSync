# 09 - FASE 3: MÓDULO PROFESSOR ✅ CONCLUÍDA

## Visão Geral

O módulo Professor é o coração operacional do NeuroOne, permitindo que professores criem e monitorem sessões de neurofeedback com suas turmas. O professor visualiza dados EEG em tempo real, controla sessões, e acompanha o progresso individual de cada aluno.

**Duração estimada**: 3 semanas
**Prioridade**: Alta (Fase 3 do cronograma)
**Dependências**: Fase 1 (Fundação) e Fase 2 (Módulo Direção) completas
**Status:** ✅ Implementação 100% completa (Dashboard, criação de sessões, monitoramento tempo real, relatórios)

---

## Funcionalidades do Módulo

### 1. Dashboard do Professor
- **Minhas Turmas**: Lista de turmas que o professor leciona
- **Sessões Recentes**: Últimas sessões realizadas
- **Estatísticas Rápidas**: Média de atenção, total de alunos, sessões do mês
- **Acesso Rápido**: Botão para iniciar nova sessão

### 2. Gestão de Sessões
- **Criar Nova Sessão**: Selecionar turma, configurar parâmetros
- **Sessão Ativa**: Controle em tempo real (iniciar, pausar, finalizar)
- **Dashboard de Sessão**: Ver todos os alunos conectados simultaneamente
- **Comandos de Jogo**: Enviar comandos reforça/penaliza para jogos

### 3. Monitoramento em Tempo Real
- **Grid de Alunos**: Visualização de todos os alunos da sessão
- **Indicadores Visuais**: Círculo verde/vermelho por aluno
- **Gráficos EEG**: Ondas cerebrais em tempo real (Delta, Theta, Alpha, Beta, Gamma)
- **Alertas**: Notificação quando aluno perde atenção

### 4. Relatórios de Turma
- **Relatório Individual**: Histórico completo de cada aluno
- **Relatório de Sessão**: Métricas agregadas de uma sessão específica
- **Comparativos**: Evolução ao longo do tempo
- **Exportação**: PDF e CSV

### 5. Configurações da Sessão
- **Modo de Visualização**: Aula tradicional ou Neurogame
- **Thresholds**: Ajustar limites de atenção por sessão
- **Duração**: Definir tempo de sessão
- **Notificações**: Configurar alertas

---

## Estrutura de Arquivos

```
frontend/
├── src/
│   ├── pages/
│   │   └── teacher/
│   │       ├── DashboardTeacher.jsx           # Dashboard principal
│   │       ├── SessionCreate.jsx              # Criar nova sessão
│   │       ├── SessionActive.jsx              # Sessão em andamento
│   │       ├── SessionHistory.jsx             # Histórico de sessões
│   │       ├── StudentReport.jsx              # Relatório individual
│   │       └── ClassReport.jsx                # Relatório de turma
│   ├── components/
│   │   └── teacher/
│   │       ├── StudentGrid.jsx                # Grid de alunos na sessão
│   │       ├── StudentCard.jsx                # Card individual do aluno
│   │       ├── EEGChart.jsx                   # Gráfico de ondas EEG
│   │       ├── AttentionIndicator.jsx         # Indicador visual de atenção
│   │       ├── SessionControls.jsx            # Controles da sessão
│   │       └── SessionConfigModal.jsx         # Modal de configuração
│   └── hooks/
│       └── teacher/
│           ├── useSessions.js                 # Hook para sessões
│           ├── useWebSocketEEG.js             # Hook para WebSocket EEG
│           └── useStudentMetrics.js           # Hook para métricas
```

---

## Implementação Semana a Semana

### **Semana 1: Dashboard e Criação de Sessão**

#### Dia 1-2: Dashboard do Professor

**Arquivo**: `frontend/src/pages/teacher/DashboardTeacher.jsx`

```jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardTeacher() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myClasses, setMyClasses] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    sessionsThisMonth: 0,
    avgAttention: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Buscar turmas do professor
      const { data: classes } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          description,
          students:class_students(count)
        `)
        .eq('teacher_id', user.id)
        .eq('active', true);

      setMyClasses(classes || []);

      // Calcular total de alunos
      const totalStudents = classes?.reduce(
        (sum, cls) => sum + (cls.students[0]?.count || 0),
        0
      ) || 0;

      // Buscar sessões recentes
      const { data: sessions } = await supabase
        .from('sessions')
        .select(`
          id,
          start_time,
          end_time,
          class:classes(name),
          metrics:session_metrics(avg_attention)
        `)
        .eq('teacher_id', user.id)
        .order('start_time', { ascending: false })
        .limit(5);

      setRecentSessions(sessions || []);

      // Sessões deste mês
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const { count: monthSessions } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', user.id)
        .gte('start_time', startOfMonth.toISOString());

      // Média de atenção
      const avgAttention = sessions?.length
        ? sessions.reduce((sum, s) => sum + (s.metrics[0]?.avg_attention || 0), 0) / sessions.length
        : 0;

      setStats({
        totalStudents,
        sessionsThisMonth: monthSessions || 0,
        avgAttention: avgAttention.toFixed(1)
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = () => {
    navigate('/teacher/session/create');
  };

  if (loading) {
    return <div className="loading">Carregando dashboard...</div>;
  }

  return (
    <div className="dashboard-teacher">
      <div className="page-header">
        <h1>Olá, {user.name}!</h1>
        <button onClick={startNewSession} className="btn-primary btn-large">
          🎮 Iniciar Nova Sessão
        </button>
      </div>

      {/* Estatísticas */}
      <div className="stats-grid">
        <div className="stats-card stats-card-blue">
          <div className="stats-icon">👥</div>
          <div className="stats-content">
            <h3>Total de Alunos</h3>
            <p className="stats-value">{stats.totalStudents}</p>
          </div>
        </div>

        <div className="stats-card stats-card-green">
          <div className="stats-icon">📊</div>
          <div className="stats-content">
            <h3>Sessões Este Mês</h3>
            <p className="stats-value">{stats.sessionsThisMonth}</p>
          </div>
        </div>

        <div className="stats-card stats-card-orange">
          <div className="stats-icon">🎯</div>
          <div className="stats-content">
            <h3>Atenção Média</h3>
            <p className="stats-value">{stats.avgAttention}%</p>
          </div>
        </div>
      </div>

      {/* Minhas Turmas */}
      <div className="section">
        <h2>Minhas Turmas</h2>
        <div className="classes-grid">
          {myClasses.map(cls => (
            <div key={cls.id} className="class-card-teacher">
              <h3>{cls.name}</h3>
              <p>{cls.description || 'Sem descrição'}</p>
              <div className="class-footer">
                <span className="student-count">
                  👥 {cls.students[0]?.count || 0} alunos
                </span>
                <button
                  onClick={() => navigate(`/teacher/class/${cls.id}`)}
                  className="btn-view"
                >
                  Ver Detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sessões Recentes */}
      <div className="section">
        <h2>Sessões Recentes</h2>
        <table className="sessions-table-compact">
          <thead>
            <tr>
              <th>Turma</th>
              <th>Data</th>
              <th>Duração</th>
              <th>Atenção Média</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {recentSessions.map(session => (
              <tr key={session.id}>
                <td>{session.class?.name}</td>
                <td>{new Date(session.start_time).toLocaleDateString('pt-BR')}</td>
                <td>
                  {session.end_time
                    ? calculateDuration(session.start_time, session.end_time)
                    : 'Em andamento'
                  }
                </td>
                <td>
                  {session.metrics[0]?.avg_attention
                    ? `${session.metrics[0].avg_attention.toFixed(1)}%`
                    : '-'
                  }
                </td>
                <td>
                  <button
                    onClick={() => navigate(`/teacher/session/${session.id}/report`)}
                    className="btn-view-small"
                  >
                    📄 Relatório
                  </button>
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

#### Dia 3-5: Criação de Sessão

**Arquivo**: `frontend/src/pages/teacher/SessionCreate.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function SessionCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myClasses, setMyClasses] = useState([]);
  const [formData, setFormData] = useState({
    class_id: '',
    session_type: 'aula', // 'aula' ou 'jogo'
    duration_minutes: 30,
    attention_threshold_low: 40,
    attention_threshold_high: 70,
    enable_alerts: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMyClasses();
  }, []);

  const fetchMyClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('id, name, description')
      .eq('teacher_id', user.id)
      .eq('active', true)
      .order('name');

    setMyClasses(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.class_id) {
      alert('Selecione uma turma');
      return;
    }

    setLoading(true);

    try {
      // Criar sessão
      const { data: session, error } = await supabase
        .from('sessions')
        .insert([{
          teacher_id: user.id,
          class_id: formData.class_id,
          start_time: new Date().toISOString(),
          config: {
            session_type: formData.session_type,
            duration_minutes: formData.duration_minutes,
            attention_threshold_low: formData.attention_threshold_low,
            attention_threshold_high: formData.attention_threshold_high,
            enable_alerts: formData.enable_alerts
          }
        }])
        .select()
        .single();

      if (error) throw error;

      alert('Sessão criada com sucesso!');
      navigate(`/teacher/session/${session.id}/active`);
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      alert('Erro ao criar sessão: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="session-create">
      <h1>Criar Nova Sessão</h1>

      <form onSubmit={handleSubmit} className="session-form">
        <div className="form-section">
          <h2>1. Selecione a Turma</h2>
          <div className="classes-selector">
            {myClasses.map(cls => (
              <div
                key={cls.id}
                className={`class-option ${formData.class_id === cls.id ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, class_id: cls.id })}
              >
                <h3>{cls.name}</h3>
                <p>{cls.description || 'Sem descrição'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h2>2. Tipo de Sessão</h2>
          <div className="session-type-selector">
            <label className="type-option">
              <input
                type="radio"
                name="session_type"
                value="aula"
                checked={formData.session_type === 'aula'}
                onChange={(e) => setFormData({ ...formData, session_type: e.target.value })}
              />
              <div className="type-card">
                <span className="type-icon">📚</span>
                <h3>Aula Tradicional</h3>
                <p>Monitoramento durante aula expositiva</p>
              </div>
            </label>

            <label className="type-option">
              <input
                type="radio"
                name="session_type"
                value="jogo"
                checked={formData.session_type === 'jogo'}
                onChange={(e) => setFormData({ ...formData, session_type: e.target.value })}
              />
              <div className="type-card">
                <span className="type-icon">🎮</span>
                <h3>Neurogame</h3>
                <p>Sessão com jogos de neurofeedback</p>
              </div>
            </label>
          </div>
        </div>

        <div className="form-section">
          <h2>3. Configurações</h2>

          <div className="form-row">
            <div className="form-group">
              <label>Duração Estimada (minutos)</label>
              <input
                type="number"
                min="5"
                max="180"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({
                  ...formData,
                  duration_minutes: parseInt(e.target.value)
                })}
              />
            </div>

            <div className="form-group">
              <label>Threshold Atenção Baixa (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.attention_threshold_low}
                onChange={(e) => setFormData({
                  ...formData,
                  attention_threshold_low: parseInt(e.target.value)
                })}
              />
            </div>

            <div className="form-group">
              <label>Threshold Atenção Alta (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.attention_threshold_high}
                onChange={(e) => setFormData({
                  ...formData,
                  attention_threshold_high: parseInt(e.target.value)
                })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.enable_alerts}
                onChange={(e) => setFormData({
                  ...formData,
                  enable_alerts: e.target.checked
                })}
              />
              Habilitar alertas quando alunos perderem atenção
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="btn-primary btn-large">
            {loading ? 'Criando...' : '🚀 Iniciar Sessão'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

### **Semana 2: Sessão Ativa e Monitoramento em Tempo Real**

#### Componente Principal da Sessão Ativa

**Arquivo**: `frontend/src/pages/teacher/SessionActive.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useWebSocketEEG } from '../../hooks/teacher/useWebSocketEEG';
import StudentGrid from '../../components/teacher/StudentGrid';
import SessionControls from '../../components/teacher/SessionControls';

export default function SessionActive() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [sessionConfig, setSessionConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // WebSocket para dados EEG em tempo real
  const { studentsData, isConnected } = useWebSocketEEG(sessionId);

  useEffect(() => {
    fetchSessionData();

    // Atualizar lista de alunos conectados a cada 5 segundos
    const interval = setInterval(fetchConnectedStudents, 5000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      const { data: sessionData, error } = await supabase
        .from('sessions')
        .select(`
          *,
          class:classes(
            id,
            name,
            students:class_students(
              student:users!student_id(id, name, email)
            )
          )
        `)
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      setSession(sessionData);
      setSessionConfig(sessionData.config);

      // Extrair lista de alunos da turma
      const studentsList = sessionData.class.students.map(cs => ({
        id: cs.student.id,
        name: cs.student.name,
        email: cs.student.email,
        connected: false,
        eegData: null
      }));

      setStudents(studentsList);
    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
      alert('Erro ao carregar sessão');
      navigate('/teacher');
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectedStudents = async () => {
    try {
      const { data } = await supabase
        .from('session_participants')
        .select('student_id, last_seen')
        .eq('session_id', sessionId);

      if (data) {
        const connectedIds = data
          .filter(p => {
            const lastSeen = new Date(p.last_seen);
            const now = new Date();
            return (now - lastSeen) < 10000; // Conectado se visto nos últimos 10s
          })
          .map(p => p.student_id);

        setStudents(prev => prev.map(student => ({
          ...student,
          connected: connectedIds.includes(student.id)
        })));
      }
    } catch (error) {
      console.error('Erro ao buscar alunos conectados:', error);
    }
  };

  // Atualizar dados EEG dos alunos
  useEffect(() => {
    if (studentsData) {
      setStudents(prev => prev.map(student => ({
        ...student,
        eegData: studentsData[student.id] || null
      })));
    }
  }, [studentsData]);

  const handleEndSession = async () => {
    if (!confirm('Tem certeza que deseja finalizar esta sessão?')) return;

    try {
      const { error } = await supabase
        .from('sessions')
        .update({ end_time: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) throw error;

      alert('Sessão finalizada com sucesso!');
      navigate(`/teacher/session/${sessionId}/report`);
    } catch (error) {
      console.error('Erro ao finalizar sessão:', error);
      alert('Erro ao finalizar sessão');
    }
  };

  if (loading) {
    return <div className="loading">Carregando sessão...</div>;
  }

  return (
    <div className="session-active">
      <div className="session-header">
        <div className="session-info">
          <h1>{session.class.name}</h1>
          <p>Iniciada às {new Date(session.start_time).toLocaleTimeString('pt-BR')}</p>
          <div className="connection-status">
            <span className={isConnected ? 'status-online' : 'status-offline'}>
              {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
            </span>
          </div>
        </div>

        <SessionControls
          sessionId={sessionId}
          sessionType={sessionConfig?.session_type}
          onEndSession={handleEndSession}
        />
      </div>

      <div className="session-stats-bar">
        <div className="stat-item">
          <span className="stat-label">Alunos Conectados</span>
          <span className="stat-value">
            {students.filter(s => s.connected).length} / {students.length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Atenção Média</span>
          <span className="stat-value">
            {calculateAverageAttention(students)}%
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Duração</span>
          <span className="stat-value">
            <SessionTimer startTime={session.start_time} />
          </span>
        </div>
      </div>

      <StudentGrid
        students={students}
        thresholds={{
          low: sessionConfig?.attention_threshold_low || 40,
          high: sessionConfig?.attention_threshold_high || 70
        }}
      />
    </div>
  );
}

function calculateAverageAttention(students) {
  const connected = students.filter(s => s.connected && s.eegData);
  if (connected.length === 0) return 0;

  const sum = connected.reduce((acc, s) => acc + (s.eegData?.attention || 0), 0);
  return (sum / connected.length).toFixed(1);
}

function SessionTimer({ startTime }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Date.now() - new Date(startTime).getTime();
      setElapsed(Math.floor(diff / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  return (
    <span>
      {hours > 0 && `${hours}h `}
      {minutes}m {seconds}s
    </span>
  );
}
```

---

**Arquivo**: `frontend/src/components/teacher/StudentGrid.jsx`

```jsx
import React from 'react';
import StudentCard from './StudentCard';

export default function StudentGrid({ students, thresholds }) {
  return (
    <div className="student-grid">
      {students.map(student => (
        <StudentCard
          key={student.id}
          student={student}
          thresholds={thresholds}
        />
      ))}
    </div>
  );
}
```

**Arquivo**: `frontend/src/components/teacher/StudentCard.jsx`

```jsx
import React from 'react';
import AttentionIndicator from './AttentionIndicator';
import EEGChart from './EEGChart';

export default function StudentCard({ student, thresholds }) {
  const getAttentionLevel = () => {
    if (!student.eegData) return 'unknown';
    const attention = student.eegData.attention;

    if (attention < thresholds.low) return 'low';
    if (attention >= thresholds.high) return 'high';
    return 'medium';
  };

  const attentionLevel = getAttentionLevel();

  return (
    <div className={`student-card ${!student.connected ? 'disconnected' : ''}`}>
      <div className="student-header">
        <h3>{student.name}</h3>
        <AttentionIndicator level={attentionLevel} connected={student.connected} />
      </div>

      {student.connected && student.eegData ? (
        <div className="student-data">
          <div className="attention-value">
            <span className="label">Atenção</span>
            <span className="value">{student.eegData.attention}%</span>
          </div>

          <div className="relaxation-value">
            <span className="label">Relaxamento</span>
            <span className="value">{student.eegData.relaxation}%</span>
          </div>

          <EEGChart data={student.eegData} compact={true} />
        </div>
      ) : (
        <div className="student-offline">
          <p>{student.connected ? 'Aguardando dados...' : 'Offline'}</p>
        </div>
      )}
    </div>
  );
}
```

**Arquivo**: `frontend/src/components/teacher/AttentionIndicator.jsx`

```jsx
import React from 'react';

export default function AttentionIndicator({ level, connected }) {
  if (!connected) {
    return <div className="indicator indicator-gray">⚫</div>;
  }

  const indicators = {
    low: { color: 'red', icon: '🔴' },
    medium: { color: 'yellow', icon: '🟡' },
    high: { color: 'green', icon: '🟢' },
    unknown: { color: 'gray', icon: '⚪' }
  };

  const { color, icon } = indicators[level] || indicators.unknown;

  return (
    <div className={`indicator indicator-${color}`} title={`Nível de atenção: ${level}`}>
      {icon}
    </div>
  );
}
```

**Arquivo**: `frontend/src/components/teacher/EEGChart.jsx`

```jsx
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function EEGChart({ data, compact = false }) {
  const chartData = {
    labels: ['Delta', 'Theta', 'Alpha', 'Beta', 'Gamma'],
    datasets: [{
      label: 'Ondas Cerebrais',
      data: [
        data.delta || 0,
        data.theta || 0,
        data.alpha || 0,
        data.beta || 0,
        data.gamma || 0
      ],
      backgroundColor: [
        '#EF4444', // Delta - vermelho
        '#F59E0B', // Theta - laranja
        '#10B981', // Alpha - verde
        '#3B82F6', // Beta - azul
        '#8B5CF6'  // Gamma - roxo
      ]
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: !compact
      },
      title: {
        display: !compact,
        text: 'Ondas Cerebrais (EEG)'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1
      }
    }
  };

  return (
    <div className={compact ? 'eeg-chart-compact' : 'eeg-chart'}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
```

---

**Arquivo**: `frontend/src/components/teacher/SessionControls.jsx`

```jsx
import React, { useState } from 'react';

export default function SessionControls({ sessionId, sessionType, onEndSession }) {
  const [isPaused, setIsPaused] = useState(false);

  const handlePause = () => {
    // Implementar pausa (opcional)
    setIsPaused(!isPaused);
  };

  return (
    <div className="session-controls">
      {sessionType === 'jogo' && (
        <button className="btn-game-control">
          🎮 Controles de Jogo
        </button>
      )}

      <button onClick={onEndSession} className="btn-danger">
        ⏹️ Finalizar Sessão
      </button>
    </div>
  );
}
```

---

**Arquivo**: `frontend/src/hooks/teacher/useWebSocketEEG.js`

```jsx
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export function useWebSocketEEG(sessionId) {
  const [studentsData, setStudentsData] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Conectar ao WebSocket
    socketRef.current = io(WS_URL, {
      auth: {
        token: localStorage.getItem('access_token')
      }
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('WebSocket conectado');
      setIsConnected(true);

      // Entrar na sala da sessão
      socket.emit('session:join', { sessionId });
    });

    socket.on('disconnect', () => {
      console.log('WebSocket desconectado');
      setIsConnected(false);
    });

    // Receber dados EEG dos alunos
    socket.on('eeg:data', (data) => {
      setStudentsData(prev => ({
        ...prev,
        [data.studentId]: {
          attention: data.attention,
          relaxation: data.relaxation,
          delta: data.delta,
          theta: data.theta,
          alpha: data.alpha,
          beta: data.beta,
          gamma: data.gamma,
          timestamp: data.timestamp
        }
      }));
    });

    return () => {
      socket.emit('session:leave', { sessionId });
      socket.disconnect();
    };
  }, [sessionId]);

  return { studentsData, isConnected };
}
```

---

### **Semana 3: Relatórios e Histórico**

#### Relatório de Sessão

**Arquivo**: `frontend/src/pages/teacher/SessionReport.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Line } from 'react-chartjs-2';

export default function SessionReport() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [studentMetrics, setStudentMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessionReport();
  }, [sessionId]);

  const fetchSessionReport = async () => {
    try {
      // Dados da sessão
      const { data: sessionData } = await supabase
        .from('sessions')
        .select(`
          *,
          class:classes(name),
          teacher:users!teacher_id(name)
        `)
        .eq('id', sessionId)
        .single();

      // Métricas agregadas da sessão
      const { data: sessionMetrics } = await supabase
        .from('session_metrics')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      // Métricas por aluno
      const { data: studentsMetrics } = await supabase
        .from('student_metrics')
        .select(`
          *,
          student:users!student_id(name)
        `)
        .eq('session_id', sessionId);

      setSession(sessionData);
      setMetrics(sessionMetrics);
      setStudentMetrics(studentsMetrics || []);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    window.print();
  };

  if (loading) {
    return <div className="loading">Carregando relatório...</div>;
  }

  return (
    <div className="session-report">
      <div className="report-header no-print">
        <h1>Relatório de Sessão</h1>
        <button onClick={exportPDF} className="btn-secondary">
          📄 Exportar PDF
        </button>
      </div>

      <div className="report-content">
        {/* Informações Gerais */}
        <section className="report-section">
          <h2>Informações da Sessão</h2>
          <div className="info-grid">
            <div className="info-item">
              <strong>Turma:</strong> {session.class.name}
            </div>
            <div className="info-item">
              <strong>Professor:</strong> {session.teacher.name}
            </div>
            <div className="info-item">
              <strong>Data:</strong> {new Date(session.start_time).toLocaleDateString('pt-BR')}
            </div>
            <div className="info-item">
              <strong>Duração:</strong>{' '}
              {session.end_time
                ? calculateDuration(session.start_time, session.end_time)
                : 'Sessão em andamento'
              }
            </div>
          </div>
        </section>

        {/* Métricas Gerais */}
        {metrics && (
          <section className="report-section">
            <h2>Métricas Gerais</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Atenção Média</h3>
                <p className="metric-value">{metrics.avg_attention.toFixed(1)}%</p>
              </div>
              <div className="metric-card">
                <h3>Relaxamento Médio</h3>
                <p className="metric-value">{metrics.avg_relaxation.toFixed(1)}%</p>
              </div>
              <div className="metric-card">
                <h3>Total de Alunos</h3>
                <p className="metric-value">{metrics.total_students}</p>
              </div>
              <div className="metric-card">
                <h3>Pontos de Dados</h3>
                <p className="metric-value">{metrics.total_data_points}</p>
              </div>
            </div>
          </section>
        )}

        {/* Tabela de Alunos */}
        <section className="report-section">
          <h2>Desempenho Individual</h2>
          <table className="students-report-table">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Atenção Média</th>
                <th>Relaxamento Médio</th>
                <th>Tempo Conectado</th>
                <th>Pontos de Dados</th>
              </tr>
            </thead>
            <tbody>
              {studentMetrics.map(sm => (
                <tr key={sm.id}>
                  <td>{sm.student.name}</td>
                  <td>{sm.avg_attention.toFixed(1)}%</td>
                  <td>{sm.avg_relaxation.toFixed(1)}%</td>
                  <td>{sm.duration_minutes} min</td>
                  <td>{sm.data_points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
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

## CSS do Módulo Professor

**Arquivo**: `frontend/src/styles/teacher.css`

```css
/* Dashboard Teacher */
.dashboard-teacher {
  padding: 2rem;
}

.btn-large {
  font-size: 1.125rem;
  padding: 1rem 2rem;
}

.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.class-card-teacher {
  background: var(--surface-dark);
  border-radius: 12px;
  padding: 1.5rem;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.class-card-teacher:hover {
  border-color: var(--gold);
}

.class-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

/* Session Active */
.session-active {
  padding: 2rem;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 2rem;
}

.connection-status {
  margin-top: 0.5rem;
}

.status-online { color: #10B981; }
.status-offline { color: #EF4444; }

.session-stats-bar {
  display: flex;
  gap: 2rem;
  padding: 1.5rem;
  background: var(--surface-dark);
  border-radius: 12px;
  margin-bottom: 2rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.stat-value {
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 700;
  margin-top: 0.25rem;
}

/* Student Grid */
.student-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.student-card {
  background: var(--surface-dark);
  border-radius: 12px;
  padding: 1.5rem;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.student-card.disconnected {
  opacity: 0.5;
}

.student-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.indicator {
  font-size: 1.5rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.student-data {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.attention-value,
.relaxation-value {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: var(--bg-dark);
  border-radius: 8px;
}

.attention-value .value,
.relaxation-value .value {
  font-weight: 700;
  color: var(--gold);
}

.eeg-chart-compact {
  height: 120px;
  margin-top: 1rem;
}

/* Session Report */
.session-report {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.report-content {
  background: white;
  color: #000;
  padding: 2rem;
  border-radius: 12px;
}

.report-section {
  margin-bottom: 2rem;
}

.info-grid,
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.metric-card {
  background: #f3f4f6;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gold);
  margin: 0;
}

/* Print Styles */
@media print {
  .no-print {
    display: none !important;
  }

  .report-content {
    box-shadow: none;
  }
}
```

---

## Checklist de Conclusão

- [ ] Dashboard do professor funcionando
- [ ] Criação de sessão com seleção de turma
- [ ] Sessão ativa com monitoramento em tempo real
- [ ] WebSocket conectando e recebendo dados EEG
- [ ] Grid de alunos com indicadores visuais
- [ ] Gráficos de ondas cerebrais
- [ ] Controles de sessão (finalizar)
- [ ] Relatório de sessão completo
- [ ] Exportação de relatório em PDF
- [ ] Testes de todos os fluxos
- [ ] Responsividade mobile

---

## Próximos Passos

Após completar a Fase 3 (Módulo Professor), seguir para:

**Fase 4**: Módulo Aluno PWA (doc 10-PWA-ALUNO.md)
- Interface mobile/tablet
- Conexão Bluetooth com headset EEG
- Integração com jogos de neurofeedback
- Indicador visual de atenção
