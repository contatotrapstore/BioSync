# NeuroOne Python EEG Bridge

Ponte de comunicação entre dispositivos EEG Neurosky (ThinkGear) e o servidor Node.js do NeuroOne.

## Arquitetura

```
[Dispositivo EEG] → [Bluetooth/Serial] → [eeg_bridge.py] → [WebSocket] → [Node.js Backend] → [Frontend]
     (TGAM)            (COM3/ttyUSB0)      (Parser)         (ws://...)      (Socket.io)      (Professor)
```

## Recursos

- ✅ Parser completo do protocolo ThinkGear
- ✅ Suporte a comunicação serial (Bluetooth, USB)
- ✅ Conexão WebSocket assíncrona ao backend
- ✅ Parsing de todas as métricas EEG:
  - Atenção (Attention)
  - Relaxamento (Meditation)
  - Qualidade do sinal
  - Bandas cerebrais (Delta, Theta, Alpha, Beta, Gamma)
- ✅ Logging detalhado
- ✅ Tratamento de erros e reconexão

## Instalação

### 1. Instalar Python

Requer Python 3.8 ou superior.

**Windows:**
```bash
# Baixar de python.org
winget install Python.Python.3.12
```

**Linux/Mac:**
```bash
sudo apt install python3.12 python3-pip  # Ubuntu/Debian
brew install python@3.12                  # macOS
```

### 2. Instalar Dependências

```bash
cd neuroone-python-eeg
pip install -r requirements.txt
```

### 3. Configurar Dispositivo EEG

#### Neurosky MindWave (Bluetooth)

**Windows:**
1. Abra Configurações → Bluetooth
2. Ligue o headset MindWave
3. Emparelhe o dispositivo (PIN geralmente é `0000` ou `1234`)
4. Vá em Painel de Controle → Dispositivos → Portas COM
5. Anote a porta COM criada (ex: `COM3`)

**Linux:**
```bash
# Emparelhar via bluetoothctl
bluetoothctl
> scan on
> pair XX:XX:XX:XX:XX:XX
> connect XX:XX:XX:XX:XX:XX

# Criar porta serial virtual
sudo rfcomm bind /dev/rfcomm0 XX:XX:XX:XX:XX:XX
```

**macOS:**
```bash
# Usar Preferências do Sistema → Bluetooth
# A porta será algo como /dev/tty.MindWave-SerialPort
```

## Uso

### Modo Básico

```bash
python eeg_bridge.py \
  --student-id "uuid-do-aluno" \
  --session-id "uuid-da-sessao"
```

### Configuração Completa

```bash
python eeg_bridge.py \
  --port COM3 \
  --baud 57600 \
  --backend ws://localhost:3001 \
  --student-id "550e8400-e29b-41d4-a716-446655440000" \
  --session-id "661e8400-e29b-41d4-a716-446655440000"
```

### Parâmetros

| Parâmetro | Descrição | Padrão |
|-----------|-----------|--------|
| `--port` | Porta serial do dispositivo EEG | `COM3` (Windows) |
| `--baud` | Baud rate da conexão serial | `57600` |
| `--backend` | URL do WebSocket backend | `ws://localhost:3001` |
| `--student-id` | UUID do aluno (obrigatório) | - |
| `--session-id` | UUID da sessão ativa (obrigatório) | - |

## Protocolo ThinkGear

O parser implementa o protocolo ThinkGear da Neurosky:

### Estrutura do Pacote

```
[SYNC][SYNC][PLENGTH][PAYLOAD...][CHECKSUM]
 0xAA  0xAA   1 byte   N bytes     1 byte
```

### Códigos de Payload

| Código | Nome | Descrição |
|--------|------|-----------|
| `0x02` | Poor Signal Quality | 0-200 (0 = sinal perfeito) |
| `0x04` | Attention | 0-100 (nível de atenção) |
| `0x05` | Meditation | 0-100 (nível de relaxamento) |
| `0x16` | Blink Strength | Força da piscada |
| `0x83` | EEG Power | 8 bandas x 24 bytes |

### Bandas EEG

- **Delta** (0.5-2.75Hz): Sono profundo
- **Theta** (3.5-6.75Hz): Sonolência, criatividade
- **Low Alpha** (7.5-9.25Hz): Relaxamento
- **High Alpha** (10-11.75Hz): Calma
- **Low Beta** (13-16.75Hz): Atenção
- **High Beta** (18-29.75Hz): Concentração intensa
- **Low Gamma** (31-39.75Hz): Processamento cognitivo
- **Mid Gamma** (41-49.75Hz): Hiperatividade mental

## Formato de Dados Enviados

O bridge envia dados no seguinte formato JSON:

```json
{
  "event": "eeg:data",
  "data": {
    "studentId": "uuid-do-aluno",
    "sessionId": "uuid-da-sessao",
    "timestamp": "2025-11-17T12:00:00.000Z",
    "attention": 75,
    "relaxation": 60,
    "signalQuality": 95,
    "delta": 120000,
    "theta": 250000,
    "alpha": 300000,
    "beta": 180000,
    "gamma": 90000
  }
}
```

## Troubleshooting

### Erro: "Permission denied" (Linux/Mac)

```bash
sudo chmod 666 /dev/ttyUSB0
# ou
sudo usermod -a -G dialout $USER  # Adicionar usuário ao grupo dialout
```

### Erro: "Access is denied" (Windows)

1. Feche qualquer software que esteja usando a porta COM
2. Verifique se o driver Bluetooth está instalado
3. Tente desemparelhar e emparelhar novamente

### Erro: "Could not connect to WebSocket"

1. Verifique se o backend Node.js está rodando:
   ```bash
   cd neuroone-backend
   npm run dev
   ```
2. Confirme a URL do backend (padrão: `ws://localhost:3001`)

### Sem dados sendo recebidos

1. Verifique a qualidade do sinal (`signalQuality`)
2. Certifique-se de que o headset está bem posicionado
3. Aguarde 10-30 segundos para estabilização do sinal

## Desenvolvimento

### Estrutura do Código

```
eeg_bridge.py
├── ThinkGearParser      # Parser do protocolo ThinkGear
│   ├── parse_packet()   # Parseia pacotes brutos
│   └── _parse_payload() # Extrai dados do payload
└── EEGBridge            # Ponte principal
    ├── connect_serial() # Conecta ao dispositivo
    ├── connect_websocket() # Conecta ao backend
    ├── read_serial()    # Lê dados do dispositivo
    ├── send_eeg_data()  # Envia para backend
    └── run()            # Loop principal
```

### Logs

O bridge usa logging em níveis:

- **INFO**: Conexões, status
- **DEBUG**: Dados EEG detalhados
- **WARNING**: Problemas não-críticos (checksum inválido)
- **ERROR**: Falhas críticas

Para ver logs detalhados:

```bash
# Editar logging.basicConfig em eeg_bridge.py
logging.basicConfig(level=logging.DEBUG)
```

## Integração com NeuroOne

### Fluxo de Dados

1. Dispositivo EEG envia dados via Bluetooth/Serial
2. `eeg_bridge.py` parseia protocolo ThinkGear
3. Dados são enviados via WebSocket para backend
4. Backend valida JWT e autoriza aluno
5. Backend aplica rate limiting (300 req/min)
6. Backend armazena métricas no PostgreSQL
7. Backend faz broadcast para professores via Socket.io
8. Frontend exibe dados em tempo real

### Segurança

- WebSocket usa autenticação JWT (TODO: implementar no bridge)
- Rate limiting no backend previne spam
- Dados são validados antes de serem armazenados
- LGPD: consentimento obrigatório para coleta de EEG

## Referências

- [Neurosky ThinkGear Protocol](http://developer.neurosky.com/docs/doku.php?id=thinkgear_communications_protocol)
- [PySerial Documentation](https://pythonhosted.org/pyserial/)
- [WebSockets Library](https://websockets.readthedocs.io/)

## Licença

MIT License - NeuroOne Project
