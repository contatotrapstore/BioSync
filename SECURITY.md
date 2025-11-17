# = Security Policy - NeuroOne

## Versões Suportadas

Apenas a versão mais recente do NeuroOne recebe atualizações de segurança.

| Versão | Suportada          |
| ------ | ------------------ |
| 2.4.x  |  Sim             |
| 2.3.x  | L Não             |
| < 2.3  | L Não             |

---

## = Reportar uma Vulnerabilidade

**Por favor, NÃO reporte vulnerabilidades de segurança através de issues públicas do GitHub.**

### Como Reportar

1. **Email**: Envie detalhes para `security@neuroone.edu.br`
2. **Assunto**: `[SECURITY] Descrição breve da vulnerabilidade`
3. **Inclua**:
   - Descrição detalhada da vulnerabilidade
   - Passos para reproduzir
   - Impacto potencial
   - Sugestões de correção (se houver)

### O que Esperar

- **Confirmação**: Responderemos em até 48 horas
- **Avaliação**: Avaliaremos a vulnerabilidade em até 7 dias
- **Correção**: Prioridade alta para correções críticas
- **Divulgação**: Coordenação com você para disclosure responsável
- **Créditos**: Reconhecimento público (se desejar) após correção

---

## =á Práticas de Segurança

### Autenticação e Autorização

- **JWT Tokens**: Autenticação baseada em tokens JWT com expiração
- **Refresh Tokens**: Tokens de longa duração armazenados com segurança
- **Row Level Security**: Políticas RLS no Supabase para isolamento de dados
- **Role-Based Access**: 3 níveis (direção, professor, aluno)

### Proteção de Dados

- **Criptografia em Trânsito**: TLS 1.3 em produção
- **Criptografia em Repouso**: Database encryption no Supabase
- **Sanitização**: Proteção contra XSS, SQL Injection
- **Validação**: Joi schemas em todas as entradas
- **CORS**: Whitelist de origens permitidas

### Dados Sensíveis

- **Senhas**: Hashing com bcrypt (salt rounds: 10)
- **Tokens**: Gerados com crypto.randomBytes
- **EEG Data**: Armazenamento seguro, acesso controlado por RLS
- **LGPD**: Compliance com Lei Geral de Proteção de Dados

---

## = Configurações de Segurança

### Variáveis de Ambiente

**NUNCA** commite arquivos `.env` no repositório.

```bash
# Backend (.env.example fornecido)
DATABASE_URL=postgresql://...
JWT_SECRET=<gerado com crypto.randomBytes(64).toString('hex')>
SUPABASE_SERVICE_KEY=<super admin key - mantenha secreto>

# Frontend (.env.example fornecido)
VITE_SUPABASE_URL=<URL pública OK>
VITE_SUPABASE_ANON_KEY=<public anon key - OK para frontend>
```

### Segredos

- **JWT_SECRET**: Mínimo 256 bits (64 caracteres hex)
- **Database passwords**: Mínimo 32 caracteres, caracteres especiais
- **Service keys**: Rotação a cada 90 dias recomendada

---

## =¨ Vulnerabilidades Conhecidas

### Histórico

Nenhuma vulnerabilidade reportada até o momento.

---

## =Ë Checklist de Segurança para Deploy

### Backend

- [ ] Variáveis de ambiente configuradas
- [ ] JWT_SECRET gerado aleatoriamente (64+ chars)
- [ ] CORS configurado com whitelist
- [ ] Rate limiting habilitado
- [ ] HTTPS/TLS 1.3 em produção
- [ ] Database com SSL habilitado
- [ ] Supabase RLS policies ativadas
- [ ] Logs de auditoria configurados

### Frontend

- [ ] Variáveis VITE_ configuradas
- [ ] Apenas anon key no frontend (nunca service_role)
- [ ] CSP headers configurados
- [ ] XSS protection habilitado
- [ ] Secure cookies (httpOnly, secure, sameSite)
- [ ] Input sanitization em formulários

### Infraestrutura

- [ ] Firewall configurado
- [ ] SSH apenas com chave pública
- [ ] Portas desnecessárias fechadas
- [ ] Backups automáticos habilitados
- [ ] Monitoramento de logs ativo
- [ ] Alertas de segurança configurados

---

## = Auditorias de Segurança

### Últimas Auditorias

- **Data**: 2025-11-17
- **Escopo**: Codebase completo, dependencies
- **Ferramentas**: npm audit, Snyk
- **Resultado**: 0 vulnerabilidades críticas/altas

### Dependências

```bash
# Verificar vulnerabilidades
npm audit

# Auto-fix quando possível
npm audit fix
```

---

## =Ú Recursos de Segurança

### Documentação

- [17-SEGURANCA-LGPD.md](docs/17-SEGURANCA-LGPD.md) - Segurança e compliance LGPD
- [04-DATABASE-SCHEMA.md](docs/04-DATABASE-SCHEMA.md) - RLS policies
- [neuroone-backend/.env.example](neuroone-backend/.env.example) - Configuração segura

### Ferramentas Recomendadas

- **OWASP ZAP**: Security testing
- **Snyk**: Dependency scanning
- **SonarQube**: Code quality e security
- **Trivy**: Container scanning

---

## > Coordenação de Divulgação

Seguimos o modelo de **Responsible Disclosure**:

1. **Reporte privado** para security@neuroone.edu.br
2. **Confirmação e avaliação** pela equipe de segurança
3. **Correção desenvolvida** e testada
4. **Patch released** para versões suportadas
5. **Advisory público** após 30 dias ou quando 90% dos usuários atualizarem
6. **Créditos** ao researcher (se solicitado)

---

## =Þ Contato

- **Email de Segurança**: security@neuroone.edu.br
- **PGP Key**: [Disponível mediante solicitação]

---

## <Æ Hall of Fame - Security Researchers

Agradecemos aos pesquisadores que reportaram vulnerabilidades de forma responsável:

- (Nenhum até o momento)

---

**Última atualização**: 17/11/2025
