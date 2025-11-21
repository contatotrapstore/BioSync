# PricingModal Component

Modal de seleção de pacotes de assistentes com layout horizontal (3 cards lado a lado).

## 📸 Preview

![PricingModal](./preview.png)

## ✨ Funcionalidades

### ✅ Layout Responsivo
- **Desktop**: 3 cards lado a lado em grid
- **Mobile**: Cards empilhados verticalmente

### ✅ Cabeçalho Clicável
- Clique no cabeçalho "Escolha seu Pacote" para navegar para `/loja#pacotes`
- Hover effect no cabeçalho indica que é clicável
- Botão X no canto para fechar o modal

### ✅ Cards de Pacotes
- **3 Assistentes**: R$ 99,90/mês (17% economia)
- **6 Assistentes**: R$ 179,90/mês (25% economia)
- **12 Assistentes**: R$ 299,90/mês (35% economia) - **DESTAQUE**

### ✅ Interações
- Hover effect nos cards (elevação e sombra)
- Botões redirecionam para `/loja?package={id}`
- Modal fecha automaticamente após seleção

## 🚀 Como Usar

### Importação Básica

```jsx
import React, { useState } from 'react';
import PricingModal from '@/components/PricingModal';
import { Button } from '@mui/material';

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Ver Pacotes
      </Button>

      <PricingModal
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
```

### Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `open` | boolean | Sim | Controla se o modal está aberto ou fechado |
| `onClose` | function | Sim | Callback executada quando o modal é fechado |

## 🎨 Customização

### Modificar Pacotes

Edite o array `packages` em `PricingModal.jsx`:

```jsx
const packages = [
  {
    id: 1,
    title: '3 Assistentes',
    description: 'Escolha 3 assistentes especializados',
    monthlyPrice: 99.90,
    semesterPrice: 499,
    discount: '17% economia',
    bgColor: 'background.paper',
    iconBg: '#3f5368',
  },
  // Adicione mais pacotes aqui...
];
```

### Destacar um Pacote

Para destacar um pacote (como o de 12 assistentes), use:
- `bgColor: '#e8f5e9'` (fundo verde claro)
- `iconBg: '#2e7d32'` (ícone verde)
- `border: '2px solid'` é aplicado automaticamente quando `id === 3`

### Alterar Rotas

Modifique as funções de navegação:

```jsx
const handleHeaderClick = () => {
  navigate('/sua-rota-customizada');
  onClose();
};

const handleSelectPackage = (packageId) => {
  navigate(`/checkout/${packageId}`); // Exemplo
  onClose();
};
```

## 📱 Responsividade

O componente usa Material-UI Grid:
- `xs={12}`: Mobile - cards ocupam largura total (empilhados)
- `md={4}`: Desktop - 3 cards lado a lado (33% cada)

## 🎯 Onde Usar

Sugestões de lugares para integrar o modal:

1. **Dashboard do Professor**: Botão "Assinar Mais Assistentes"
2. **Dashboard do Aluno**: Banner promocional
3. **Página de Configurações**: Seção de assinaturas
4. **Landing Page**: Call-to-action para novos usuários
5. **Onboarding**: Após criar conta, mostrar pacotes disponíveis

## 🔧 Integração com Backend

Quando o usuário clicar em um pacote, você pode:

1. **Redirecionar para checkout**:
```jsx
const handleSelectPackage = (packageId) => {
  navigate(`/checkout?package=${packageId}`);
};
```

2. **Abrir outro modal de confirmação**:
```jsx
const handleSelectPackage = (packageId) => {
  setSelectedPackage(packageId);
  setConfirmOpen(true);
  onClose();
};
```

3. **Enviar para API de pagamento**:
```jsx
const handleSelectPackage = async (packageId) => {
  const response = await createCheckoutSession(packageId);
  window.location.href = response.checkoutUrl;
};
```

## 💡 Dicas

### Adicionar Analytics

```jsx
const handleSelectPackage = (packageId) => {
  // Track event
  analytics.track('Package Selected', {
    packageId,
    price: packages.find(p => p.id === packageId).monthlyPrice,
  });

  navigate(`/loja?package=${packageId}`);
  onClose();
};
```

### Fechar com ESC

O componente já suporta fechar com ESC (funcionalidade padrão do Material-UI Dialog).

### Prevenir Fechamento ao Clicar Fora

```jsx
<PricingModal
  open={open}
  onClose={(event, reason) => {
    if (reason === 'backdropClick') return; // Previne fechar ao clicar fora
    onClose();
  }}
/>
```

## 🐛 Troubleshooting

### Cards não ficam lado a lado

Verifique se o container pai tem largura suficiente. O modal usa `maxWidth="lg"` (1200px).

### Rota não redireciona

Certifique-se de que está usando `react-router-dom` v6+ e que as rotas estão configuradas:

```jsx
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
```

### Estilos não aplicados

Verifique se o tema do Material-UI está configurado no `_app.jsx` ou `main.jsx`:

```jsx
import { ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <YourApp />
    </ThemeProvider>
  );
}
```

## 📦 Dependências

- `@mui/material` (^5.x)
- `react-router-dom` (^6.x)
- `@mui/icons-material` (^5.x)

## 🔄 Versão

Última atualização: Janeiro 2025
