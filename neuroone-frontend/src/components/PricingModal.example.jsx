/**
 * EXEMPLO DE USO DO PRICINGMODAL
 *
 * Este arquivo mostra como integrar o PricingModal em qualquer página do sistema.
 */

import React, { useState } from 'react';
import { Box, Button, Container } from '@mui/material';
import PricingModal from './PricingModal';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const ExampleUsage = () => {
  const [pricingOpen, setPricingOpen] = useState(false);

  return (
    <Container>
      <Box sx={{ py: 4 }}>
        {/* Botão para abrir o modal */}
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<ShoppingCartIcon />}
          onClick={() => setPricingOpen(true)}
        >
          Ver Pacotes de Assistentes
        </Button>

        {/* Modal de Pricing */}
        <PricingModal
          open={pricingOpen}
          onClose={() => setPricingOpen(false)}
        />
      </Box>
    </Container>
  );
};

export default ExampleUsage;

/**
 * COMO USAR EM QUALQUER COMPONENTE:
 *
 * 1. Importe o PricingModal:
 *    import PricingModal from '@/components/PricingModal';
 *
 * 2. Adicione o estado para controlar o modal:
 *    const [pricingOpen, setPricingOpen] = useState(false);
 *
 * 3. Adicione o componente PricingModal no seu JSX:
 *    <PricingModal
 *      open={pricingOpen}
 *      onClose={() => setPricingOpen(false)}
 *    />
 *
 * 4. Adicione um botão ou link para abrir o modal:
 *    <Button onClick={() => setPricingOpen(true)}>
 *      Ver Pacotes
 *    </Button>
 *
 * FUNCIONALIDADES:
 *
 * ✅ 3 pacotes lado a lado em grid responsivo
 * ✅ Cabeçalho clicável que redireciona para /loja#pacotes
 * ✅ Cada card tem hover effect
 * ✅ Botões redirecionam para /loja?package={id}
 * ✅ Modal responsivo (em mobile os cards ficam empilhados)
 * ✅ Pacote de 12 assistentes destacado em verde (mais popular)
 *
 * PERSONALIZAÇÃO:
 *
 * Você pode modificar os pacotes editando o array 'packages' em PricingModal.jsx
 *
 * Para adicionar mais pacotes, basta adicionar objetos ao array:
 * {
 *   id: 4,
 *   title: '20 Assistentes',
 *   description: 'Plano empresarial',
 *   monthlyPrice: 499.90,
 *   semesterPrice: 2499,
 *   discount: '40% economia',
 *   bgColor: 'background.paper',
 *   iconBg: '#3f5368',
 * }
 */
