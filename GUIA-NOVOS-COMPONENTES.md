# 📘 Guia de Uso - Novos Componentes v2.5.0

**Data**: 2025-01-18
**Versão**: 2.5.0
**Melhorias**: Skeleton Loading + Animações + Charts com Theme

---

## 🎯 Índice

1. [Skeleton Components](#skeleton-components)
2. [Charts com Theme](#charts-com-theme)
3. [Componentes Animados](#componentes-animados)
4. [Forms com Validação](#forms-com-validação)

---

## 🎨 Skeleton Components

### CardSkeleton

**Uso**: Loading state para cards em dashboards

```jsx
import { CardSkeleton } from '@/components/atoms';

// Exemplo básico
<CardSkeleton rows={3} />

// Com header e actions
<CardSkeleton
  rows={4}
  hasHeader={true}
  hasActions={true}
/>

// Uso condicional
{loading ? (
  <CardSkeleton rows={5} hasHeader />
) : (
  <Card>{/* conteúdo real */}</Card>
)}
```

**Props**:
- `rows` (number): Número de linhas de conteúdo (padrão: 3)
- `hasHeader` (boolean): Mostra header skeleton (padrão: false)
- `hasActions` (boolean): Mostra actions skeleton no rodapé (padrão: false)

---

### TableSkeleton

**Uso**: Loading state para tabelas (UserTable, ClassTable, etc)

```jsx
import { TableSkeleton } from '@/components/atoms';

// Exemplo básico
<TableSkeleton rows={5} columns={4} />

// Tabela completa
<TableSkeleton
  rows={10}
  columns={6}
  hasActions={true}
/>

// Uso condicional
{loading ? (
  <TableSkeleton rows={8} columns={5} hasActions />
) : (
  <DataTable data={users} />
)}
```

**Props**:
- `rows` (number): Número de linhas (padrão: 5)
- `columns` (number): Número de colunas (padrão: 4)
- `hasActions` (boolean): Coluna de ações (padrão: true)

**Características**:
- Primeira coluna tem avatar circular
- Actions tem 2 ícones circulares
- Header com skeleton de texto

---

### ChartSkeleton

**Uso**: Loading state para gráficos Chart.js

```jsx
import { ChartSkeleton } from '@/components/atoms';

// Bar chart skeleton
<ChartSkeleton height={300} variant="bar" />

// Line chart skeleton
<ChartSkeleton height={400} variant="line" />

// Pie chart skeleton
<ChartSkeleton height={350} variant="pie" />

// Uso condicional
{loading ? (
  <ChartSkeleton height={300} variant="line" />
) : (
  <AttentionTimelineChart data={timelineData} />
)}
```

**Props**:
- `height` (number): Altura do gráfico em px (padrão: 300)
- `variant` (string): Tipo de gráfico - 'bar', 'line', 'pie' (padrão: 'line')

**Características**:
- Título skeleton
- Área do gráfico adaptada ao variant
- Legenda com 3 itens skeleton

---

## 📊 Charts com Theme

Todos os charts agora suportam theme claro/escuro e responsividade.

### EEGChart (Bar Chart)

```jsx
import { EEGChart } from '@/components/teacher/EEGChart';

<EEGChart
  eegData={{ delta: 0.2, theta: 0.4, alpha: 0.6, beta: 0.8, gamma: 0.3 }}
  compact={false}
  height={120}
/>
```

**Melhorias**:
- ✅ Cores do theme MUI (adapta ao modo claro/escuro)
- ✅ Responsividade (mobile, tablet, desktop)
- ✅ Font family do theme
- ✅ Tooltip com cores do theme

---

### AttentionDistributionChart (Pie Chart)

```jsx
import { AttentionDistributionChart } from '@/components/teacher/AttentionDistributionChart';

<AttentionDistributionChart
  distribution={{ low: 5, medium: 12, high: 8 }}
  height={300}
/>
```

**Melhorias**:
- ✅ Cores error/warning/success do theme
- ✅ Legenda adaptativa (mobile bottom, desktop bottom)
- ✅ HoverOffset para interação

---

### AttentionTimelineChart (Line Chart)

```jsx
import { AttentionTimelineChart } from '@/components/teacher/AttentionTimelineChart';

<AttentionTimelineChart
  timelineData={[
    { timestamp: '2025-01-18T10:00:00', avgAttention: 65, minAttention: 45, maxAttention: 85 },
    { timestamp: '2025-01-18T10:05:00', avgAttention: 70, minAttention: 50, maxAttention: 90 },
  ]}
  thresholds={{ low: 40, high: 70 }}
  height={300}
/>
```

**Melhorias**:
- ✅ 3 datasets com cores do theme
- ✅ Empty state profissional
- ✅ Responsividade avançada (maxTicksLimit)
- ✅ Grid colors baseados no theme

---

## ✨ Componentes Animados

### Card com Fade-in

Todos os Cards agora têm animação fade-in automática.

```jsx
import { Card } from '@/components/atoms';

// Animação automática ao renderizar
<Card>
  <Typography>Conteúdo</Typography>
</Card>
```

**Animação**:
- Fade-in: opacity 0 → 1
- Slide-up: y 10px → 0
- Duração: 0.3s
- Easing: ease-out

---

### Button com Hover/Tap

Todos os Buttons têm micro-interações.

```jsx
import { Button } from '@/components/atoms';

// Animações automáticas
<Button variant="contained">
  Clique aqui
</Button>
```

**Animações**:
- **Hover**: scale 1.0 → 1.02
- **Tap**: scale 1.0 → 0.98
- **Duração**: 0.15s
- **Desabilitado quando**: loading ou disabled

---

## 📝 Forms com Validação

### UserForm com Validação Visual

```jsx
import { UserForm } from '@/components/direction/UserForm';

<UserForm
  user={null}  // null = criar, objeto = editar
  open={true}
  onClose={() => setOpen(false)}
  onSuccess={() => {
    refreshUsers();
    setOpen(false);
  }}
/>
```

**Validações**:
- **Nome**: 3-100 caracteres, obrigatório
- **Email**: formato válido, obrigatório
- **Senha**: 6-50 caracteres, obrigatório (apenas ao criar)
- **user_role**: aluno/professor/direcao

**Features**:
- ✅ Validação em tempo real (onChange + onBlur)
- ✅ Mensagens de erro por campo
- ✅ Helper text contextual
- ✅ Submit desabilitado quando há erros
- ✅ Loading state automático

---

### ClassForm com Validação Visual

```jsx
import { ClassForm } from '@/components/direction/ClassForm';

<ClassForm
  classData={null}  // null = criar, objeto = editar
  open={true}
  onClose={() => setOpen(false)}
  onSuccess={() => {
    refreshClasses();
    setOpen(false);
  }}
/>
```

**Validações**:
- **Nome**: 3-100 caracteres, obrigatório
- **Ano letivo**: máx 20 caracteres, opcional
- **Descrição**: máx 500 caracteres + contador, opcional
- **Alunos**: Autocomplete múltiplo

**Features**:
- ✅ Contador de caracteres na descrição (X/500)
- ✅ Seleção múltipla de alunos com chips
- ✅ Todas features do UserForm

---

## 💡 Exemplos de Uso Completo

### Dashboard com Loading

```jsx
import { CardSkeleton } from '@/components/atoms';
import { Card } from '@/components/atoms';

function DirectionDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <CardSkeleton rows={3} hasHeader />
        </Grid>
        <Grid item xs={12} md={6}>
          <CardSkeleton rows={3} hasHeader />
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <Typography variant="h3">Professores</Typography>
          <Typography variant="h2">{stats.teachers}</Typography>
        </Card>
      </Grid>
      {/* ... */}
    </Grid>
  );
}
```

---

### Tabela com Loading

```jsx
import { TableSkeleton } from '@/components/atoms';
import { DataTable } from '@/components/molecules/DataTable';

function UserTable() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadUsers().then((data) => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <TableSkeleton rows={10} columns={5} hasActions />;
  }

  return (
    <DataTable
      data={users}
      columns={[...]}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}
```

---

### Chart com Loading

```jsx
import { ChartSkeleton } from '@/components/atoms';
import { AttentionTimelineChart } from '@/components/teacher/AttentionTimelineChart';

function SessionReport() {
  const [loading, setLoading] = useState(true);
  const [timelineData, setTimelineData] = useState([]);

  useEffect(() => {
    loadSessionData().then((data) => {
      setTimelineData(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <ChartSkeleton height={400} variant="line" />;
  }

  return (
    <AttentionTimelineChart
      timelineData={timelineData}
      thresholds={{ low: 40, high: 70 }}
      height={400}
    />
  );
}
```

---

## 🎨 Theme Toggle

Todos os componentes respondem automaticamente ao theme.

```jsx
import { ThemeToggle } from '@/components/atoms';

// No AppHeader ou Navbar
<ThemeToggle />
```

**Teste**:
1. Clique no botão de theme
2. Veja os charts mudarem de cor
3. Veja os skeletons se adaptarem
4. Veja cards e buttons manterem contraste

---

## ✅ Checklist de Migração

Se você tem componentes antigos, siga este checklist:

### Migrar Loading States

- [ ] Substituir `<CircularProgress />` solto por `<LoadingOverlay />`
- [ ] Substituir loading manual em cards por `<CardSkeleton />`
- [ ] Substituir loading manual em tabelas por `<TableSkeleton />`
- [ ] Substituir loading manual em charts por `<ChartSkeleton />`

### Migrar Charts

- [ ] Verificar se cores estão hardcoded
- [ ] Adicionar `useTheme()` hook
- [ ] Substituir cores hex por `theme.palette.*`
- [ ] Adicionar `useMediaQuery` para responsividade
- [ ] Testar em modo claro e escuro

### Migrar Forms

- [ ] Adicionar estado `fieldErrors` e `touched`
- [ ] Criar funções de validação
- [ ] Adicionar `onBlur` handlers
- [ ] Adicionar props `error` e `helperText` nos TextFields
- [ ] Usar prop `loading` nos Buttons

---

## 📚 Recursos Adicionais

- **Framer Motion Docs**: https://www.framer.com/motion/
- **Chart.js Docs**: https://www.chartjs.org/docs/latest/
- **MUI Skeleton**: https://mui.com/material-ui/react-skeleton/
- **MUI Theme**: https://mui.com/material-ui/customization/theming/

---

## 🐛 Troubleshooting

### Animações não funcionam
- ✅ Verifique se `framer-motion` está instalado: `npm list framer-motion`
- ✅ Verifique imports: `import { motion } from 'framer-motion'`

### Charts sem cores do theme
- ✅ Verifique se está usando `useTheme()` hook
- ✅ Verifique se está dentro de `<ThemeProvider>`

### Skeletons não aparecem
- ✅ Verifique condicional: `{loading ? <Skeleton /> : <Content />}`
- ✅ Verifique se estado `loading` está sendo atualizado

---

**Última atualização**: 2025-01-18
**Versão**: 2.5.0
**Autor**: Claude Code (Anthropic)
