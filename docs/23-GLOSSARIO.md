# 23 - GLOSSÁRIO

## A

**Access Token**
Token JWT de curta duração (15 minutos) usado para autenticar requisições à API. Deve ser enviado no header `Authorization: Bearer <token>`.

**Admin / Direção**
Tipo de usuário com acesso total ao sistema. Pode gerenciar usuários, turmas, visualizar relatórios globais e configurar o sistema.

**Alpha (α)**
Onda cerebral com frequência de 8-12 Hz. Associada a relaxamento consciente, estado de calma e criatividade. Presente quando olhos estão fechados ou em meditação leve.

**ANPD**
Autoridade Nacional de Proteção de Dados. Órgão brasileiro responsável por zelar pela proteção de dados pessoais conforme LGPD.

**API**
Application Programming Interface. Interface que permite comunicação entre frontend e backend através de endpoints HTTP.

**Atenção (Attention)**
Métrica principal fornecida pelo dispositivo TGAM, variando de 0-100. Indica o nível de concentração/foco mental do usuário. Valores acima de 70 indicam alta atenção.

---

## B

**Backend**
Servidor Node.js responsável por processar requisições, gerenciar autenticação, validar dados e comunicar com o banco de dados.

**Bcrypt**
Algoritmo de hashing criptográfico usado para armazenar senhas de forma segura. Utiliza salt aleatório e é computacionalmente custoso para dificultar ataques de força bruta.

**Beta (β)**
Onda cerebral com frequência de 13-30 Hz. Associada a estado de alerta, concentração ativa, pensamento lógico e resolução de problemas.

**Bluetooth LE (Low Energy)**
Protocolo de comunicação sem fio de baixo consumo usado para conectar o headset EEG ao dispositivo do aluno via Web Bluetooth API.

**biosync-atualizado**
Aplicação desktop em Qt/PySide6 que monitora dados EEG em tempo real, exibindo gráficos de ondas cerebrais e métricas de atenção.

---

## C

**Calibração**
Período inicial (30 segundos) após conectar o dispositivo EEG onde o sistema ajusta os thresholds e estabiliza as leituras. Requer que o usuário permaneça relaxado.

**CORS (Cross-Origin Resource Sharing)**
Mecanismo de segurança que controla quais domínios podem fazer requisições à API. Configurado para permitir apenas domínios autorizados do NeuroOne.

**CSV (Comma-Separated Values)**
Formato de arquivo usado pelo servidor Python para salvar automaticamente os dados EEG de cada sessão (`{nome_aluno}.csv`).

---

## D

**Dashboard**
Painel principal de cada tipo de usuário (aluno, professor, direção) que exibe informações relevantes e métricas consolidadas.

**Delta (δ)**
Onda cerebral com frequência de 0.5-4 Hz. Associada a sono profundo, inconsciência e processos de cura do corpo.

**Desvio Padrão**
Medida estatística de variabilidade. No contexto de atenção, um baixo desvio indica consistência (atenção estável), enquanto alto desvio indica oscilações frequentes.

**Dispositivo EEG / Headset**
Hardware que captura sinais elétricos do cérebro. No NeuroOne, utiliza-se dispositivo genérico com chipset TGAM (Tauro), conectando via Bluetooth.

**DPO (Data Protection Officer)**
Encarregado de Proteção de Dados. Pessoa responsável por garantir compliance com LGPD, atender requisições de titulares e comunicar-se com a ANPD.

---

## E

**EEG (Eletroencefalograma)**
Registro da atividade elétrica cerebral através de sensores colocados no couro cabeludo. Mede oscilações de voltagem resultantes de correntes iônicas em neurônios.

**eSense™**
Algoritmo proprietário da NeuroSky que calcula métricas de Atenção e Meditação a partir dos dados brutos de EEG.

**Engagement Index**
Índice calculado como `Beta / (Alpha + Theta)`. Valores maiores que 1 indicam alto engajamento cognitivo.

---

## F

**Frontend**
Aplicação React (Vite) que roda no navegador do usuário. Responsável pela interface, interação e visualização de dados.

---

## G

**Gamma (γ)**
Onda cerebral com frequência acima de 30 Hz. Associada a processamento de informação de alta ordem, memória e aprendizado.

**GDPR**
General Data Protection Regulation. Regulamento europeu de proteção de dados que influenciou a criação da LGPD brasileira.

---

## H

**Hash**
Resultado de função criptográfica unidirecional. Usado para armazenar senhas de forma que não possam ser revertidas ao valor original.

**Headset**
Dispositivo vestível que contém o sensor EEG e transmite dados via Bluetooth. Ver "Dispositivo EEG".

**Helmet**
Middleware de segurança para Node.js que configura headers HTTP para proteger contra vulnerabilidades comuns (XSS, clickjacking, etc.).

---

## I

**Índice de Relaxamento**
Calculado como `Alpha / Beta`. Valores maiores que 1 indicam estado relaxado.

**Índice de Sonolência**
Calculado como `(Theta + Alpha) / Beta`. Valores maiores que 2 podem indicar sonolência ou cansaço mental.

---

## J

**JWT (JSON Web Token)**
Formato de token usado para autenticação. Contém informações do usuário (payload) assinadas criptograficamente para garantir integridade.

---

## K

**KPI (Key Performance Indicator)**
Indicador chave de desempenho. No NeuroOne: atenção média, taxa de engajamento, total de sessões, etc.

---

## L

**LGPD (Lei Geral de Proteção de Dados)**
Lei brasileira 13.709/2018 que regula tratamento de dados pessoais. Estabelece direitos dos titulares e obrigações dos controladores.

**Launcher**
Aplicação desktop (Electron) para PC que facilita acesso ao NeuroOne sem navegador. Inclui atalhos para dashboards e jogos.

---

## M

**Manifest.json**
Arquivo de configuração PWA que define nome, ícones, cores e comportamento da aplicação quando instalada na tela inicial.

**Meditação / Relaxamento**
Métrica fornecida pelo TGAM (0-100) que indica nível de relaxamento mental. Valores altos indicam calma e baixo estresse.

**Migração (Migration)**
Script SQL que modifica estrutura do banco de dados de forma controlada e versionada. Permite evolução do schema sem perder dados.

**Middleware**
Função intermediária que processa requisições antes de chegarem ao handler final. Ex: autenticação, validação, logging.

---

## N

**Neurofeedback**
Técnica que fornece feedback em tempo real sobre atividade cerebral, permitindo que indivíduo aprenda a autorregular estados mentais.

**Neurogame**
Jogo controlado por sinais cerebrais. No NeuroOne, jogos HTML5 com Three.js que respondem a comandos baseados em níveis de atenção.

**NeuroSky**
Fabricante de tecnologia de EEG de consumo. Desenvolvedor do chipset TGAM e protocolo ThinkGear.

**Node.js**
Runtime JavaScript server-side usado no backend do NeuroOne. Permite executar JavaScript fora do navegador.

---

## O

**Onda Cerebral / Brain Wave**
Padrão oscilatório da atividade elétrica cerebral. Classificadas por frequência: Delta, Theta, Alpha, Beta, Gamma.

---

## P

**Parser**
Componente de software que interpreta dados brutos do protocolo ThinkGear byte a byte, extraindo métricas estruturadas.

**Payload**
Conteúdo principal de uma mensagem ou token. No contexto de JWT, contém informações do usuário (id, role, email).

**PWA (Progressive Web App)**
Aplicação web que pode ser instalada no dispositivo e funciona offline usando Service Workers. Combina vantagens de web e apps nativos.

**Python WebSocket Server**
Servidor (`server_headless-V4.py`) que recebe dados EEG dos alunos, redistribui para dashboards e salva em CSV automaticamente.

---

## R

**RBAC (Role-Based Access Control)**
Controle de acesso baseado em papéis/funções. No NeuroOne: `student`, `teacher`, `direction`.

**React**
Biblioteca JavaScript para construção de interfaces. Base do frontend do NeuroOne.

**Refresh Token**
Token de longa duração (7 dias) usado para obter novos access tokens sem exigir novo login.

**Relaxamento**
Ver "Meditação".

**Retenção de Dados**
Período durante o qual dados são armazenados antes de serem deletados ou anonimizados. Definido por política de privacidade e requisitos legais.

**RLS (Row Level Security)**
Sistema de segurança do PostgreSQL/Supabase que filtra linhas de tabelas baseado no usuário autenticado. Garante que alunos vejam apenas seus dados.

---

## S

**Salt**
Dados aleatórios adicionados a uma senha antes do hashing. Garante que senhas iguais gerem hashes diferentes.

**Service Worker**
Script que roda em background no navegador, permitindo funcionalidades offline, cache e notificações push em PWAs.

**Sessão**
Período de tempo durante o qual um professor monitora atenção de alunos. Tem hora de início, fim, turma associada e configurações específicas.

**Signal Quality**
Qualidade do sinal EEG fornecida pelo TGAM (0-200). Valores baixos (<50) indicam boa conexão entre sensor e pele.

**Socket.io**
Biblioteca para comunicação WebSocket bidirecional em tempo real entre cliente e servidor Node.js.

**SQL (Structured Query Language)**
Linguagem para gerenciar bancos de dados relacionais. Usado para queries, migrações e RLS policies no Supabase.

**SSL/TLS**
Protocolos de criptografia para comunicação segura na internet. Garante que dados trafeguem criptografados (HTTPS, WSS).

**Supabase**
Plataforma Backend-as-a-Service baseada em PostgreSQL. Fornece banco de dados, autenticação, storage e APIs REST/Realtime.

---

## T

**TGAM (ThinkGear ASIC Module)**
Chip da NeuroSky que processa sinais EEG brutos e fornece métricas calculadas (atenção, meditação, ondas cerebrais).

**Theta (θ)**
Onda cerebral com frequência de 4-8 Hz. Associada a sonolência, criatividade, intuição e estado entre vigília e sono.

**ThinkGear Protocol**
Protocolo serial proprietário da NeuroSky para transmissão de dados EEG. Estrutura: sync bytes (0xAA 0xAA), comprimento, payload, checksum.

**Threshold / Limiar**
Valor de corte usado para classificação. Ex: atenção < 40 = baixa, 40-69 = média, ≥70 = alta.

**Three.js**
Biblioteca JavaScript para renderização 3D via WebGL. Usada nos 13 jogos de neurofeedback do NeuroOne.

**Token**
Ver "JWT", "Access Token", "Refresh Token".

**Turma / Classe**
Agrupamento de alunos sob responsabilidade de um professor. Usada para organizar sessões e relatórios.

---

## U

**Uptime**
Percentual de tempo que sistema está operacional. Monitorado por ferramentas como UptimeRobot para detectar quedas.

---

## V

**Vite**
Build tool moderno para aplicações JavaScript. Utilizado no frontend para desenvolvimento rápido e builds otimizados.

**Vercel**
Plataforma de deploy para aplicações frontend. Suporta deploy automático via Git, SSL gratuito e edge network global.

---

## W

**Web Bluetooth API**
API do navegador (Chrome, Edge) que permite conexão com dispositivos Bluetooth LE diretamente do JavaScript, sem app nativo.

**WebSocket**
Protocolo de comunicação bidirecional sobre TCP. Permite conexão persistente para troca de dados em tempo real.

**WSS (WebSocket Secure)**
Versão criptografada do WebSocket (equivalente a HTTPS para HTTP). Obrigatório em produção para segurança.

---

## Siglas e Abreviações

| Sigla | Significado |
|-------|-------------|
| API | Application Programming Interface |
| ANPD | Autoridade Nacional de Proteção de Dados |
| CORS | Cross-Origin Resource Sharing |
| CSV | Comma-Separated Values |
| DPO | Data Protection Officer |
| EEG | Eletroencefalograma |
| GDPR | General Data Protection Regulation |
| HTTP | Hypertext Transfer Protocol |
| HTTPS | HTTP Secure |
| JWT | JSON Web Token |
| KPI | Key Performance Indicator |
| LGPD | Lei Geral de Proteção de Dados |
| PWA | Progressive Web App |
| RBAC | Role-Based Access Control |
| REST | Representational State Transfer |
| RLS | Row Level Security |
| SQL | Structured Query Language |
| SSL | Secure Sockets Layer |
| TGAM | ThinkGear ASIC Module |
| TLS | Transport Layer Security |
| UI | User Interface |
| UX | User Experience |
| WSS | WebSocket Secure |

---

## Faixas de Frequência EEG

| Onda | Frequência | Estado Mental Associado |
|------|------------|-------------------------|
| Delta (δ) | 0.5-4 Hz | Sono profundo, inconsciência |
| Theta (θ) | 4-8 Hz | Sonolência, criatividade, meditação profunda |
| Alpha (α) | 8-12 Hz | Relaxamento consciente, olhos fechados |
| Beta (β) | 13-30 Hz | Alerta, concentração ativa, pensamento lógico |
| Gamma (γ) | 30-100 Hz | Processamento cognitivo alto, aprendizado |

---

## Níveis de Classificação

### Atenção
- **Baixa**: 0-39%
- **Média**: 40-69%
- **Alta**: 70-100%

### Qualidade de Sinal
- **Excelente**: 0-10
- **Boa**: 11-50
- **Aceitável**: 51-100
- **Ruim**: 101-200

### Engagement Index
- **Baixo**: < 0.5
- **Moderado**: 0.5-1.5
- **Alto**: > 1.5

---

## Referências

- **NeuroSky ThinkGear Documentation**: Especificação oficial do protocolo
- **LGPD (Lei 13.709/2018)**: Legislação brasileira de proteção de dados
- **EEG Basics**: Niedermeyer's Electroencephalography
- **Web Bluetooth API**: MDN Web Docs
- **PWA Best Practices**: Google Web Fundamentals

---

**Última atualização**: 2025-01-16
**Versão do Documento**: 1.0
