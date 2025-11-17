# 08 - FASE 2: MÓDULO DIREÇÃO ✅ CONCLUÍDA

## Visão Geral

O módulo Direção é o painel administrativo completo do NeuroOne, permitindo gestão total de usuários, turmas, sessões e configurações do sistema. Este módulo tem acesso irrestrito a todos os dados e funcionalidades.

**Duração estimada**: 3 semanas
**Prioridade**: Alta (Fase 2 do cronograma)
**Dependências**: Fase 1 (Fundação) completa
**Status:** ✅ Implementação 100% completa (CRUD usuários, turmas, sessões, configurações)

---

## Funcionalidades do Módulo

### 1. Dashboard Administrativo
- **Visão Geral do Sistema**: Métricas agregadas de toda a plataforma
- **Estatísticas em Tempo Real**: Sessões ativas, usuários online
- **Alertas e Notificações**: Problemas técnicos, sessões sem dados EEG
- **Gráficos Executivos**: Uso da plataforma, engajamento por turma

### 2. Gestão de Usuários
- **CRUD Completo**: Criar, visualizar, editar e desativar usuários
- **Tipos de Usuário**: Direção, Professor, Aluno
- **Importação em Massa**: Upload de CSV com múltiplos usuários
- **Redefinição de Senha**: Forçar reset de senha
- **Auditoria**: Log de ações de cada usuário

### 3. Gestão de Turmas
- **CRUD de Turmas**: Criar e gerenciar turmas
- **Vinculação Professor-Turma**: Associar professores às turmas
- **Lista de Alunos**: Adicionar/remover alunos de turmas
- **Transferência de Alunos**: Mover alunos entre turmas

### 4. Monitoramento de Sessões
- **Visualização Global**: Ver todas as sessões (ativas e históricas)
- **Filtros Avançados**: Por professor, turma, data, status
- **Relatórios Agregados**: Métricas consolidadas por período
- **Exportação de Dados**: CSV com dados de múltiplas sessões

### 5. Configurações do Sistema
- **Parâmetros Globais**: Thresholds de atenção, duração mínima de sessão
- **Dispositivos EEG**: Cadastro e configuração de headsets
- **Manutenção**: Limpeza de dados antigos, backup manual
- **Logs do Sistema**: Visualização de logs de erro e auditoria

---

## Estrutura de Arquivos

```
frontend/
├── src/
│   ├── pages/
│   │   └── direction/
│   │       ├── DashboardDirection.jsx       # Dashboard principal
│   │       ├── UsersManagement.jsx          # Gestão de usuários
│   │       ├── ClassesManagement.jsx        # Gestão de turmas
│   │       ├── SessionsOverview.jsx         # Visão de sessões
│   │       ├── SystemSettings.jsx           # Configurações
│   │       └── ReportsDirection.jsx         # Relatórios
│   ├── components/
│   │   └── direction/
│   │       ├── UserForm.jsx                 # Formulário de usuário
│   │       ├── UserTable.jsx                # Tabela de usuários
│   │       ├── ClassForm.jsx                # Formulário de turma
│   │       ├── StatsCard.jsx                # Card de estatística
│   │       ├── ImportUsersModal.jsx         # Modal de importação CSV
│   │       └── SessionFilterBar.jsx         # Barra de filtros
│   └── hooks/
│       └── direction/
│           ├── useUsers.js                  # Hook para usuários
│           ├── useClasses.js                # Hook para turmas
│           └── useSystemStats.js            # Hook para estatísticas
```

---

## Implementação Semana a Semana

### **Semana 1: Dashboard e Gestão de Usuários**

#### Dia 1-2: Dashboard Principal

**Arquivo**: `frontend/src/pages/direction/DashboardDirection.jsx`

```jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import StatsCard from '../../components/direction/StatsCard';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardDirection() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClasses: 0,
    activeSessions: 0,
    totalSessions: 0
  });
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Total de usuários
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      // Total de turmas
      const { count: classesCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      // Sessões ativas (últimas 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { count: activeCount } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .gte('start_time', yesterday.toISOString())
        .is('end_time', null);

      // Total de sessões
      const { count: totalCount } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true });

      // Sessões recentes
      const { data: sessions } = await supabase
        .from('sessions')
        .select(`
          id,
          start_time,
          end_time,
          class:classes(name),
          teacher:users!teacher_id(name)
        `)
        .order('start_time', { ascending: false })
        .limit(5);

      setStats({
        totalUsers: usersCount || 0,
        totalClasses: classesCount || 0,
        activeSessions: activeCount || 0,
        totalSessions: totalCount || 0
      });

      setRecentSessions(sessions || []);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Carregando dashboard...</div>;
  }

  return (
    <div className="dashboard-direction">
      <h1>Painel Administrativo</h1>

      {/* Cards de Estatísticas */}
      <div className="stats-grid">
        <StatsCard
          title="Total de Usuários"
          value={stats.totalUsers}
          icon="👥"
          color="blue"
        />
        <StatsCard
          title="Turmas Ativas"
          value={stats.totalClasses}
          icon="🎓"
          color="green"
        />
        <StatsCard
          title="Sessões Ativas"
          value={stats.activeSessions}
          icon="📡"
          color="orange"
        />
        <StatsCard
          title="Total de Sessões"
          value={stats.totalSessions}
          icon="📊"
          color="purple"
        />
      </div>

      {/* Sessões Recentes */}
      <div className="recent-sessions">
        <h2>Sessões Recentes</h2>
        <table>
          <thead>
            <tr>
              <th>Turma</th>
              <th>Professor</th>
              <th>Início</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentSessions.map(session => (
              <tr key={session.id}>
                <td>{session.class?.name}</td>
                <td>{session.teacher?.name}</td>
                <td>{new Date(session.start_time).toLocaleString('pt-BR')}</td>
                <td>
                  <span className={session.end_time ? 'status-finished' : 'status-active'}>
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
```

**Arquivo**: `frontend/src/components/direction/StatsCard.jsx`

```jsx
import React from 'react';

export default function StatsCard({ title, value, icon, color }) {
  return (
    <div className={`stats-card stats-card-${color}`}>
      <div className="stats-icon">{icon}</div>
      <div className="stats-content">
        <h3>{title}</h3>
        <p className="stats-value">{value}</p>
      </div>
    </div>
  );
}
```

**CSS**: `frontend/src/styles/direction.css`

```css
.dashboard-direction {
  padding: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stats-card {
  background: var(--surface-dark);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-left: 4px solid;
}

.stats-card-blue { border-left-color: #3B82F6; }
.stats-card-green { border-left-color: #10B981; }
.stats-card-orange { border-left-color: #F59E0B; }
.stats-card-purple { border-left-color: #8B5CF6; }

.stats-icon {
  font-size: 2.5rem;
}

.stats-content h3 {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.stats-value {
  color: var(--text-primary);
  font-size: 2rem;
  font-weight: 700;
}

.recent-sessions {
  background: var(--surface-dark);
  border-radius: 12px;
  padding: 1.5rem;
}

.recent-sessions table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.recent-sessions th,
.recent-sessions td {
  text-align: left;
  padding: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.status-active {
  color: #10B981;
  font-weight: 600;
}

.status-finished {
  color: var(--text-secondary);
}
```

---

#### Dia 3-5: Gestão de Usuários

**Arquivo**: `frontend/src/pages/direction/UsersManagement.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import UserTable from '../../components/direction/UserTable';
import UserForm from '../../components/direction/UserForm';
import ImportUsersModal from '../../components/direction/ImportUsersModal';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    role: 'all'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, users]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Filtro por busca (nome ou email)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por tipo de usuário
    if (filters.role !== 'all') {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Tem certeza que deseja desativar este usuário?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ active: false })
        .eq('id', userId);

      if (error) throw error;

      alert('Usuário desativado com sucesso!');
      fetchUsers();
    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
      alert('Erro ao desativar usuário');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingUser(null);
    fetchUsers();
  };

  if (loading) {
    return <div className="loading">Carregando usuários...</div>;
  }

  return (
    <div className="users-management">
      <div className="page-header">
        <h1>Gestão de Usuários</h1>
        <div className="header-actions">
          <button onClick={() => setShowImport(true)} className="btn-secondary">
            📥 Importar CSV
          </button>
          <button onClick={handleCreateUser} className="btn-primary">
            ➕ Novo Usuário
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="search-input"
        />
        <select
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          className="role-filter"
        >
          <option value="all">Todos os Tipos</option>
          <option value="direction">Direção</option>
          <option value="teacher">Professor</option>
          <option value="student">Aluno</option>
        </select>
      </div>

      {/* Tabela de Usuários */}
      <UserTable
        users={filteredUsers}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
      />

      {/* Modal de Formulário */}
      {showForm && (
        <UserForm
          user={editingUser}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Modal de Importação */}
      {showImport && (
        <ImportUsersModal
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            setShowImport(false);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}
```

**Arquivo**: `frontend/src/components/direction/UserTable.jsx`

```jsx
import React from 'react';

export default function UserTable({ users, onEdit, onDelete }) {
  const getRoleName = (role) => {
    const roles = {
      direction: 'Direção',
      teacher: 'Professor',
      student: 'Aluno'
    };
    return roles[role] || role;
  };

  return (
    <div className="table-container">
      <table className="users-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Tipo</th>
            <th>Status</th>
            <th>Criado em</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <span className={`role-badge role-${user.role}`}>
                  {getRoleName(user.role)}
                </span>
              </td>
              <td>
                <span className={user.active ? 'status-active' : 'status-inactive'}>
                  {user.active ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td>{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
              <td className="actions">
                <button onClick={() => onEdit(user)} className="btn-edit">
                  ✏️ Editar
                </button>
                <button onClick={() => onDelete(user.id)} className="btn-delete">
                  🗑️ Desativar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Arquivo**: `frontend/src/components/direction/UserForm.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function UserForm({ user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    password: '',
    active: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        password: '', // Não preencher senha ao editar
        active: user.active
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user) {
        // Atualizar usuário existente
        const updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          active: formData.active
        };

        // Só atualizar senha se foi fornecida
        if (formData.password) {
          updateData.password_hash = await hashPassword(formData.password);
        }

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', user.id);

        if (error) throw error;
        alert('Usuário atualizado com sucesso!');
      } else {
        // Criar novo usuário
        if (!formData.password) {
          alert('Senha é obrigatória para novos usuários');
          setLoading(false);
          return;
        }

        const { error } = await supabase
          .from('users')
          .insert([{
            ...formData,
            password_hash: await hashPassword(formData.password)
          }]);

        if (error) throw error;
        alert('Usuário criado com sucesso!');
      }

      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert('Erro ao salvar usuário: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const hashPassword = async (password) => {
    // Em produção, usar bcrypt no backend
    // Aqui é apenas exemplo
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{user ? 'Editar Usuário' : 'Novo Usuário'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome Completo</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Tipo de Usuário</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="student">Aluno</option>
              <option value="teacher">Professor</option>
              <option value="direction">Direção</option>
            </select>
          </div>

          <div className="form-group">
            <label>Senha {user && '(deixe em branco para não alterar)'}</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={user ? 'Nova senha (opcional)' : 'Senha obrigatória'}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              />
              Usuário ativo
            </label>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

### **Semana 2: Gestão de Turmas e Sessões**

#### Dia 1-3: Gestão de Turmas

**Arquivo**: `frontend/src/pages/direction/ClassesManagement.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ClassForm from '../../components/direction/ClassForm';

export default function ClassesManagement() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Buscar turmas
      const { data: classesData } = await supabase
        .from('classes')
        .select(`
          *,
          teacher:users!teacher_id(name),
          students:class_students(count)
        `)
        .order('name');

      // Buscar professores
      const { data: teachersData } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'teacher')
        .eq('active', true)
        .order('name');

      // Buscar alunos
      const { data: studentsData } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'student')
        .eq('active', true)
        .order('name');

      setClasses(classesData || []);
      setTeachers(teachersData || []);
      setStudents(studentsData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!confirm('Tem certeza que deseja desativar esta turma?')) return;

    try {
      const { error } = await supabase
        .from('classes')
        .update({ active: false })
        .eq('id', classId);

      if (error) throw error;

      alert('Turma desativada com sucesso!');
      fetchData();
    } catch (error) {
      console.error('Erro ao desativar turma:', error);
      alert('Erro ao desativar turma');
    }
  };

  if (loading) {
    return <div className="loading">Carregando turmas...</div>;
  }

  return (
    <div className="classes-management">
      <div className="page-header">
        <h1>Gestão de Turmas</h1>
        <button onClick={() => { setEditingClass(null); setShowForm(true); }} className="btn-primary">
          ➕ Nova Turma
        </button>
      </div>

      <div className="classes-grid">
        {classes.map(cls => (
          <div key={cls.id} className="class-card">
            <div className="class-header">
              <h3>{cls.name}</h3>
              <span className={cls.active ? 'status-active' : 'status-inactive'}>
                {cls.active ? 'Ativa' : 'Inativa'}
              </span>
            </div>

            <div className="class-info">
              <p><strong>Professor:</strong> {cls.teacher?.name || 'Não atribuído'}</p>
              <p><strong>Alunos:</strong> {cls.students?.[0]?.count || 0}</p>
              <p><strong>Descrição:</strong> {cls.description || 'Sem descrição'}</p>
            </div>

            <div className="class-actions">
              <button onClick={() => { setEditingClass(cls); setShowForm(true); }} className="btn-edit">
                ✏️ Editar
              </button>
              <button onClick={() => handleDeleteClass(cls.id)} className="btn-delete">
                🗑️ Desativar
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <ClassForm
          classData={editingClass}
          teachers={teachers}
          students={students}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
```

**Arquivo**: `frontend/src/components/direction/ClassForm.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function ClassForm({ classData, teachers, students, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teacher_id: '',
    active: true
  });
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name,
        description: classData.description || '',
        teacher_id: classData.teacher_id || '',
        active: classData.active
      });
      fetchClassStudents(classData.id);
    }
  }, [classData]);

  const fetchClassStudents = async (classId) => {
    const { data } = await supabase
      .from('class_students')
      .select('student_id')
      .eq('class_id', classId);

    if (data) {
      setSelectedStudents(data.map(cs => cs.student_id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let classId;

      if (classData) {
        // Atualizar turma existente
        const { error } = await supabase
          .from('classes')
          .update(formData)
          .eq('id', classData.id);

        if (error) throw error;
        classId = classData.id;
      } else {
        // Criar nova turma
        const { data: newClass, error } = await supabase
          .from('classes')
          .insert([formData])
          .select()
          .single();

        if (error) throw error;
        classId = newClass.id;
      }

      // Atualizar alunos da turma
      // Primeiro remover todos
      await supabase
        .from('class_students')
        .delete()
        .eq('class_id', classId);

      // Depois adicionar os selecionados
      if (selectedStudents.length > 0) {
        const classStudents = selectedStudents.map(studentId => ({
          class_id: classId,
          student_id: studentId
        }));

        await supabase
          .from('class_students')
          .insert(classStudents);
      }

      alert(classData ? 'Turma atualizada!' : 'Turma criada!');
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar turma:', error);
      alert('Erro ao salvar turma: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-large">
        <h2>{classData ? 'Editar Turma' : 'Nova Turma'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Nome da Turma</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: 3º Ano A"
              />
            </div>

            <div className="form-group">
              <label>Professor Responsável</label>
              <select
                value={formData.teacher_id}
                onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
              >
                <option value="">Selecione um professor</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              placeholder="Descrição opcional da turma"
            />
          </div>

          <div className="form-group">
            <label>Alunos da Turma</label>
            <div className="students-list">
              {students.map(student => (
                <label key={student.id} className="student-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => toggleStudent(student.id)}
                  />
                  <span>{student.name}</span>
                  <span className="student-email">{student.email}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              />
              Turma ativa
            </label>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

#### Dia 4-5: Visão Geral de Sessões

**Arquivo**: `frontend/src/pages/direction/SessionsOverview.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import SessionFilterBar from '../../components/direction/SessionFilterBar';

export default function SessionsOverview() {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    teacherId: 'all',
    classId: 'all',
    dateFrom: '',
    dateTo: '',
    status: 'all'
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, sessions]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          class:classes(name),
          teacher:users!teacher_id(name),
          metrics:session_metrics(
            avg_attention,
            avg_relaxation,
            total_students
          )
        `)
        .order('start_time', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...sessions];

    if (filters.teacherId !== 'all') {
      filtered = filtered.filter(s => s.teacher_id === filters.teacherId);
    }

    if (filters.classId !== 'all') {
      filtered = filtered.filter(s => s.class_id === filters.classId);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(s =>
        new Date(s.start_time) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(s =>
        new Date(s.start_time) <= new Date(filters.dateTo)
      );
    }

    if (filters.status === 'active') {
      filtered = filtered.filter(s => !s.end_time);
    } else if (filters.status === 'finished') {
      filtered = filtered.filter(s => s.end_time);
    }

    setFilteredSessions(filtered);
  };

  const exportToCSV = () => {
    const csv = [
      ['Turma', 'Professor', 'Início', 'Fim', 'Duração', 'Alunos', 'Atenção Média'],
      ...filteredSessions.map(s => [
        s.class?.name,
        s.teacher?.name,
        new Date(s.start_time).toLocaleString('pt-BR'),
        s.end_time ? new Date(s.end_time).toLocaleString('pt-BR') : 'Em andamento',
        s.end_time ? calculateDuration(s.start_time, s.end_time) : '-',
        s.metrics?.[0]?.total_students || 0,
        s.metrics?.[0]?.avg_attention?.toFixed(1) || '-'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sessoes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const calculateDuration = (start, end) => {
    const diff = new Date(end) - new Date(start);
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return <div className="loading">Carregando sessões...</div>;
  }

  return (
    <div className="sessions-overview">
      <div className="page-header">
        <h1>Visão Geral de Sessões</h1>
        <button onClick={exportToCSV} className="btn-secondary">
          📥 Exportar CSV
        </button>
      </div>

      <SessionFilterBar filters={filters} setFilters={setFilters} />

      <div className="sessions-stats">
        <div className="stat-box">
          <h3>Total de Sessões</h3>
          <p>{filteredSessions.length}</p>
        </div>
        <div className="stat-box">
          <h3>Sessões Ativas</h3>
          <p>{filteredSessions.filter(s => !s.end_time).length}</p>
        </div>
        <div className="stat-box">
          <h3>Atenção Média</h3>
          <p>
            {(filteredSessions
              .filter(s => s.metrics?.[0]?.avg_attention)
              .reduce((acc, s) => acc + s.metrics[0].avg_attention, 0) /
              filteredSessions.filter(s => s.metrics?.[0]?.avg_attention).length || 0
            ).toFixed(1)}%
          </p>
        </div>
      </div>

      <table className="sessions-table">
        <thead>
          <tr>
            <th>Turma</th>
            <th>Professor</th>
            <th>Início</th>
            <th>Status</th>
            <th>Alunos</th>
            <th>Atenção Média</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredSessions.map(session => (
            <tr key={session.id}>
              <td>{session.class?.name}</td>
              <td>{session.teacher?.name}</td>
              <td>{new Date(session.start_time).toLocaleString('pt-BR')}</td>
              <td>
                <span className={session.end_time ? 'status-finished' : 'status-active'}>
                  {session.end_time ? 'Finalizada' : 'Ativa'}
                </span>
              </td>
              <td>{session.metrics?.[0]?.total_students || 0}</td>
              <td>
                {session.metrics?.[0]?.avg_attention
                  ? `${session.metrics[0].avg_attention.toFixed(1)}%`
                  : '-'
                }
              </td>
              <td>
                <button className="btn-view">👁️ Ver Detalhes</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

### **Semana 3: Configurações e Relatórios**

#### Configurações do Sistema

**Arquivo**: `frontend/src/pages/direction/SystemSettings.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    attention_threshold_low: 40,
    attention_threshold_high: 70,
    min_session_duration: 10,
    auto_save_interval: 60,
    enable_notifications: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert(settings);

      if (error) throw error;
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="system-settings">
      <h1>Configurações do Sistema</h1>

      <div className="settings-section">
        <h2>Thresholds de Atenção</h2>

        <div className="form-group">
          <label>Atenção Baixa (%) - Vermelho</label>
          <input
            type="number"
            min="0"
            max="100"
            value={settings.attention_threshold_low}
            onChange={(e) => setSettings({
              ...settings,
              attention_threshold_low: parseInt(e.target.value)
            })}
          />
        </div>

        <div className="form-group">
          <label>Atenção Alta (%) - Verde</label>
          <input
            type="number"
            min="0"
            max="100"
            value={settings.attention_threshold_high}
            onChange={(e) => setSettings({
              ...settings,
              attention_threshold_high: parseInt(e.target.value)
            })}
          />
        </div>
      </div>

      <div className="settings-section">
        <h2>Sessões</h2>

        <div className="form-group">
          <label>Duração Mínima (minutos)</label>
          <input
            type="number"
            min="1"
            value={settings.min_session_duration}
            onChange={(e) => setSettings({
              ...settings,
              min_session_duration: parseInt(e.target.value)
            })}
          />
        </div>

        <div className="form-group">
          <label>Intervalo de Auto-Save (segundos)</label>
          <input
            type="number"
            min="10"
            value={settings.auto_save_interval}
            onChange={(e) => setSettings({
              ...settings,
              auto_save_interval: parseInt(e.target.value)
            })}
          />
        </div>
      </div>

      <button onClick={handleSave} disabled={loading} className="btn-primary">
        {loading ? 'Salvando...' : 'Salvar Configurações'}
      </button>
    </div>
  );
}
```

---

## Rotas do Frontend

**Arquivo**: `frontend/src/App.jsx` (atualizar)

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardDirection from './pages/direction/DashboardDirection';
import UsersManagement from './pages/direction/UsersManagement';
import ClassesManagement from './pages/direction/ClassesManagement';
import SessionsOverview from './pages/direction/SessionsOverview';
import SystemSettings from './pages/direction/SystemSettings';
import ReportsDirection from './pages/direction/ReportsDirection';

// ... outras rotas

<Route path="/direction/*" element={
  <ProtectedRoute allowedRoles={['direction']}>
    <Routes>
      <Route path="/" element={<DashboardDirection />} />
      <Route path="/users" element={<UsersManagement />} />
      <Route path="/classes" element={<ClassesManagement />} />
      <Route path="/sessions" element={<SessionsOverview />} />
      <Route path="/reports" element={<ReportsDirection />} />
      <Route path="/settings" element={<SystemSettings />} />
    </Routes>
  </ProtectedRoute>
} />
```

---

## Testes Recomendados

### Teste 1: Criação de Usuário
```javascript
// Criar 3 tipos de usuários via interface
// Verificar se aparecem na tabela
// Verificar se podem fazer login
```

### Teste 2: Gestão de Turmas
```javascript
// Criar turma com professor e alunos
// Editar turma (trocar professor, adicionar alunos)
// Desativar turma
```

### Teste 3: Dashboard em Tempo Real
```javascript
// Abrir dashboard
// Iniciar sessão como professor
// Verificar se contadores atualizam automaticamente
```

---

## Checklist de Conclusão

- [ ] Dashboard com estatísticas funcionando
- [ ] CRUD completo de usuários
- [ ] CRUD completo de turmas
- [ ] Visão geral de sessões com filtros
- [ ] Exportação de dados CSV
- [ ] Configurações do sistema
- [ ] Importação de usuários via CSV
- [ ] Testes de todos os fluxos
- [ ] Documentação de código
- [ ] Deploy em produção

---

## Próximos Passos

Após completar a Fase 2 (Módulo Direção), seguir para:

**Fase 3**: Módulo Professor (doc 09-FASE-3-PROFESSOR.md)
- Dashboard do professor
- Gestão de turmas próprias
- Criação e controle de sessões
- Visualização de dados EEG em tempo real
