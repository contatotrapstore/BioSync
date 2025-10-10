-- Migração: Adicionar campo asaas_payment_id para suportar pagamentos únicos PIX
-- Data: 2025-01-10
-- Descrição: Permite que subscriptions rastreiem tanto assinaturas recorrentes (cartão)
--            quanto pagamentos únicos mensais (PIX)

-- Adicionar coluna asaas_payment_id à tabela subscriptions
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS asaas_payment_id VARCHAR(255);

-- Criar índice para busca rápida por asaas_payment_id
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas_payment_id
ON subscriptions(asaas_payment_id);

-- Adicionar comentário explicando o uso
COMMENT ON COLUMN subscriptions.asaas_payment_id IS
'ID do pagamento único no Asaas (usado para PIX). Para assinaturas recorrentes (cartão), use asaas_subscription_id';

-- Verificar dados após migração
SELECT
  COUNT(*) as total_subscriptions,
  COUNT(asaas_subscription_id) as with_subscription_id,
  COUNT(asaas_payment_id) as with_payment_id
FROM subscriptions;
