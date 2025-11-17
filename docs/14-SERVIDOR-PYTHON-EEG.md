# 14 - SERVIDOR PYTHON EEG

## Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Monitor Gráfico Desktop](#monitor-gráfico-desktop)
4. [Servidor Headless](#servidor-headless)
5. [Deploy em Servidor SSH](#deploy-em-servidor-ssh)
6. [Protocolo de Comunicação](#protocolo-de-comunicação)
7. [Formato dos Dados](#formato-dos-dados)
8. [Troubleshooting](#troubleshooting)

---

## Visão Geral

O sistema Python EEG é composto por dois componentes principais:

1. **Monitor Gráfico Desktop** (`biosync-atualizado/main.py`)
   - Interface Qt/PySide6 para visualização local
   - Conecta ao dispositivo EEG via porta serial
   - Exibe gráficos em tempo real
   - Servidor WebSocket integrado

2. **Servidor Headless** (`server_headless-V4.py`)
   - Servidor WebSocket puro (sem interface gráfica)
   - Roda em servidor Linux via SSH
   - Recebe dados EEG de múltiplos clientes
   - Salva CSV automático
   - Redistribui para dashboards

### Quando Usar Cada Um

**Monitor Gráfico:**
- Desenvolvimento local
- Testes de hardware
- Calibração do dispositivo EEG
- Visualização técnica em tempo real

**Servidor Headless:**
- Produção (servidor remoto)
- Múltiplos alunos simultâneos
- Alta disponibilidade (24/7)
- Sem necessidade de interface gráfica

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    CENÁRIO 1: DESENVOLVIMENTO                │
└─────────────────────────────────────────────────────────────┘

[Headset EEG] ──(Bluetooth/USB)──> [Porta Serial COM]
                                           │
                                           v
                    [biosync-atualizado/main.py]
                      │                  │
                      │ (Qt Interface)   │ (WebSocket Server)
                      │                  │ ws://localhost:8080
                      v                  v
                 [Gráficos]          [Dashboard/Jogo]


┌─────────────────────────────────────────────────────────────┐
│                     CENÁRIO 2: PRODUÇÃO                      │
└─────────────────────────────────────────────────────────────┘

[Headset EEG] ──(Bluetooth)──> [PWA Mobile]
                                     │
                                     │ WebSocket Client
                                     v
                      [Servidor SSH Linux]
                    [server_headless-V4.py]
                      ws://<IP>:8080
                            │
                            ├──> [CSV Files]
                            │
                            └──> [Dashboard Professor]
```

---

## Monitor Gráfico Desktop

### Estrutura de Arquivos

```
biosync-atualizado/
├── main.py              # Aplicação principal
├── parser.py            # Parser do protocolo EEG
├── graphs.py            # Gráficos Matplotlib
├── connect_page.py      # Tela de conexão
├── utils.py             # Utilitários (PyInstaller)
├── biosync.svg          # Logo vetorial
├── biosync.ico          # Ícone da aplicação
├── main.spec            # Spec PyInstaller
├── build/               # Build temporário
└── dist/                # Executável final
```

### Dependências

**requirements.txt:**
```txt
PySide6==6.6.0
matplotlib==3.8.2
pyserial==3.5
websockets==12.0
```

**Instalar:**
```bash
cd biosync-atualizado
pip install -r requirements.txt
```

### Execução

**Modo desenvolvimento:**
```bash
python main.py
```

**Gerar executável:**
```bash
pyinstaller main.spec
# Executável em: dist/main.exe
```

### Funcionamento Interno

#### 1. Tela de Conexão (`connect_page.py`)

```python
# Busca automática da porta COM
ports = list_ports.comports()
for port in ports:
    if 'CH340' in port.description:
        # Dispositivo EEG encontrado
        return port.device
```

**Porta COM:**
- Windows: `COM3`, `COM4`, etc.
- Linux: `/dev/ttyUSB0`, `/dev/ttyACM0`
- Driver CH340 precisa estar instalado

#### 2. Parser do Protocolo (`parser.py`)

**Classe `Mind`:**
```python
class Mind:
    def __init__(self):
        self.signal = 200       # Qualidade do sinal (0-200)
        self.delta = 0          # Onda Delta
        self.theta = 0          # Onda Theta
        self.low_alpha = 0      # Alpha baixo
        self.high_alpha = 0     # Alpha alto
        self.low_beta = 0       # Beta baixo
        self.high_beta = 0      # Beta alto
        self.low_gamma = 0      # Gamma baixo
        self.middle_gamma = 0   # Gamma médio
        self.att = 0            # Atenção (0-100)
        self.med = 0            # Meditação (0-100)
```

**Protocolo de Bytes:**
```
[170][170][length][payload...][checksum]

Sync:     170, 170
Length:   Tamanho do payload
Payload:  Dados EEG codificados
Checksum: Validação de integridade
```

**Códigos do Payload:**
```python
CODE_SIGNAL_QUALITY = 2     # 1 byte
CODE_ATTENTION      = 4     # 1 byte
CODE_MEDITATION     = 5     # 1 byte
CODE_EEG_POWER      = 131   # 24 bytes (8 valores de 3 bytes)
```

#### 3. Leitura Serial (`main.py`)

```python
def read_serial():
    """Thread que lê continuamente da porta serial"""
    while True:
        byte = ser.read(1)
        if byte:
            mind.parseByte(byte[0])
            # Dados disponíveis em: mind.att, mind.med, mind.delta, etc.
```

#### 4. Servidor WebSocket Integrado

```python
async def websocket_handler(websocket):
    """Envia dados para clientes conectados"""
    while True:
        data = {
            "Att": mind.att,
            "Med": mind.med,
            "Delta": mind.delta,
            "Theta": mind.theta,
            "LowAlpha": mind.low_alpha,
            "HighAlpha": mind.high_alpha,
            "LowBeta": mind.low_beta,
            "HighBeta": mind.high_beta,
            "LowGamma": mind.low_gamma,
            "MiddleGamma": mind.middle_gamma
        }
        await websocket.send(json.dumps(data))
        await asyncio.sleep(1)  # 1 envio por segundo
```

**WebSocket URL:** `ws://localhost:8080`

#### 5. Gráficos em Tempo Real (`graphs.py`)

**Estrutura:**
```python
# Deques com máximo de 50 pontos
x_chart = deque(maxlen=50)
delta = deque(maxlen=50)
theta = deque(maxlen=50)
low_alpha = deque(maxlen=50)
high_alpha = deque(maxlen=50)
low_beta = deque(maxlen=50)
high_beta = deque(maxlen=50)
low_gamma = deque(maxlen=50)
middle_gamma = deque(maxlen=50)
att = deque(maxlen=50)
med = deque(maxlen=50)
```

**Atualização:**
```python
def update_plot():
    """Chamado a cada 1 segundo por QTimer"""
    # Adiciona novos dados
    x_chart.append(counter)
    delta.append(mind.delta)
    theta.append(mind.theta)
    # ... todas as outras métricas

    # Redesenha gráficos
    ax1.plot(x_chart, delta, label='Delta')
    ax1.plot(x_chart, theta, label='Theta')
    # ...
    canvas.draw()
```

**Dois Gráficos:**
1. **Superior:** Ondas cerebrais (Delta, Theta, Alpha, Beta, Gamma)
2. **Inferior:** Atenção e Meditação

**Controles:**
- Checkboxes para ativar/desativar ondas específicas
- Estilo "Solarize_Light2"
- Auto-scroll (últimos 50 segundos)

---

## Servidor Headless

### Arquivo: `server_headless-V4.py`

**Localização:** `c:\Users\GouveiaRx\Downloads\BioSync Game FN\server_headless-V4.py`

### Funcionalidades

1. **Servidor WebSocket** na porta 8080
2. **Aceita múltiplas conexões** simultâneas
3. **Identifica dois tipos de clientes:**
   - **Dashboard:** envia mensagem `"dash"`
   - **Fonte de dados:** envia JSON com dados EEG
4. **Salva CSV automático** para cada aluno
5. **Redistribui dados** para dashboards em tempo real
6. **Detecta IP local** automaticamente

### Código Completo Comentado

```python
import asyncio
import websockets
import json
import socket
import os

# Dicionário de conexões ativas
conexoes = {}
dash_client = None
id_counter = 0

def get_local_ip():
    """Retorna o IP local da máquina na rede"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0)
        s.connect(('10.254.254.254', 1))  # IP fictício
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

class ServidorWebSocketHeadless:
    def __init__(self):
        self.ip_local = get_local_ip()
        print(f"=== Servidor WebSocket Headless ===")
        print(f"IP Local: {self.ip_local}")
        print(f"Porta: 8080")
        print(f"URL WebSocket: ws://{self.ip_local}:8080")
        print(f"URL WebSocket (público): ws://0.0.0.0:8080")
        print("=" * 40)

    async def echo(self, websocket):
        """Handler de conexão WebSocket"""
        global dash_client, id_counter

        try:
            while True:
                message = await websocket.recv()

                # Cliente se identifica como dashboard
                if message == 'dash':
                    dash_client = websocket
                    print(f"Dashboard conectado: {websocket.remote_address}")

                # Cliente envia dados EEG
                else:
                    # Registra novo cliente
                    if websocket not in conexoes:
                        id_counter += 1
                        conexoes[websocket] = id_counter
                        print(f"Novo cliente ID {id_counter}: {websocket.remote_address}")

                    # Parse JSON
                    data = json.loads(message)
                    codigo = data.get("Codigo")
                    nome = data.get("Nome")

                    # Salva em CSV
                    if nome:
                        filename = f"{nome}.csv"
                        header = "Att,Med,Delta,Theta,LowAlpha,HighAlpha,LowBeta,HighBeta,LowGamma,MiddleGamma"

                        values = [
                            data.get('Att', 0),
                            data.get('Med', 0),
                            data.get('Delta', 0),
                            data.get('Theta', 0),
                            data.get('LowAlpha', 0),
                            data.get('HighAlpha', 0),
                            data.get('LowBeta', 0),
                            data.get('HighBeta', 0),
                            data.get('LowGamma', 0),
                            data.get('MiddleGamma', 0)
                        ]

                        data_line = ','.join(map(str, values))

                        # Cria ou adiciona ao CSV
                        if not os.path.exists(filename):
                            with open(filename, 'w', encoding='utf-8') as f:
                                f.write(header + '\n')
                                f.write(data_line + '\n')
                        else:
                            with open(filename, 'a', encoding='utf-8') as f:
                                f.write(data_line + '\n')

                    # Envia para dashboard
                    if dash_client:
                        await dash_client.send(json.dumps({
                            "ID": conexoes[websocket],
                            "Nome": nome,
                            "Codigo": codigo,
                            "Att": data["Att"],
                            "Med": data["Med"]
                        }))

        except websockets.exceptions.ConnectionClosedOK:
            print(f"Conexão fechada: ID {conexoes.get(websocket, 'Desconhecido')}")
            if websocket in conexoes:
                del conexoes[websocket]
        except Exception as e:
            print(f"Erro: {e}")

    async def main(self):
        """Inicia servidor"""
        async with websockets.serve(self.echo, "0.0.0.0", 8080):
            print("Servidor WebSocket iniciado em ws://0.0.0.0:8080")
            print("Pressione Ctrl+C para parar")
            await asyncio.Future()  # Run forever

    def run(self):
        """Entry point"""
        try:
            asyncio.run(self.main())
        except KeyboardInterrupt:
            print("\nServidor parado pelo usuário")

if __name__ == "__main__":
    servidor = ServidorWebSocketHeadless()
    servidor.run()
```

### Exemplo de Uso

**Terminal 1 - Iniciar servidor:**
```bash
python server_headless-V4.py
```

**Output:**
```
=== Servidor WebSocket Headless ===
IP Local: 192.168.1.100
Porta: 8080
URL WebSocket: ws://192.168.1.100:8080
URL WebSocket (público): ws://0.0.0.0:8080
========================================
Servidor WebSocket iniciado em ws://0.0.0.0:8080
Pressione Ctrl+C para parar
```

**Terminal 2 - Cliente dashboard (Python):**
```python
import asyncio
import websockets

async def dashboard():
    async with websockets.connect('ws://192.168.1.100:8080') as ws:
        # Identifica como dashboard
        await ws.send('dash')

        # Recebe dados em tempo real
        while True:
            data = await ws.recv()
            print(f"Dados recebidos: {data}")

asyncio.run(dashboard())
```

**Terminal 3 - Cliente aluno (JavaScript PWA):**
```javascript
const ws = new WebSocket('ws://192.168.1.100:8080');

ws.onopen = () => {
    // Envia dados EEG
    const data = {
        Codigo: 'ABC123',
        Nome: 'Joao_Silva',
        Att: 85,
        Med: 72,
        Delta: 123456,
        Theta: 234567,
        LowAlpha: 345678,
        HighAlpha: 456789,
        LowBeta: 567890,
        HighBeta: 678901,
        LowGamma: 789012,
        MiddleGamma: 890123
    };

    ws.send(JSON.stringify(data));
};
```

**Resultado:**
- **CSV criado:** `Joao_Silva.csv`
- **Dashboard recebe:** `{"ID": 1, "Nome": "Joao_Silva", "Codigo": "ABC123", "Att": 85, "Med": 72}`

---

## Deploy em Servidor SSH

### Requisitos

**Sistema Operacional:**
- Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- Python 3.8+
- pip
- supervisor ou systemd

**Acesso:**
- SSH (porta 22)
- Porta 8080 aberta no firewall
- IP público ou domínio

### Passo a Passo

#### 1. Conectar ao Servidor

```bash
ssh usuario@<IP_SERVIDOR>
```

#### 2. Instalar Dependências

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Python 3 e pip
sudo apt install python3 python3-pip -y

# Instalar supervisor
sudo apt install supervisor -y

# Verificar versões
python3 --version  # Python 3.8+
pip3 --version
```

#### 3. Criar Diretório do Projeto

```bash
# Criar diretório
mkdir -p /opt/neuroone
cd /opt/neuroone

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install websockets
```

#### 4. Upload do Servidor

**Opção A: SCP (do PC local):**
```bash
scp server_headless-V4.py usuario@<IP>:/opt/neuroone/
```

**Opção B: Git:**
```bash
git clone <repositorio>
cp <repositorio>/server_headless-V4.py .
```

**Opção C: Copiar manualmente:**
```bash
nano server_headless-V4.py
# Colar código
# Ctrl+O para salvar, Ctrl+X para sair
```

#### 5. Testar Manualmente

```bash
cd /opt/neuroone
source venv/bin/activate
python3 server_headless-V4.py
```

**Output esperado:**
```
=== Servidor WebSocket Headless ===
IP Local: 192.168.1.100
Porta: 8080
...
Servidor WebSocket iniciado em ws://0.0.0.0:8080
```

**Testar de outra máquina:**
```bash
# Linux/Mac
wscat -c ws://<IP_SERVIDOR>:8080

# Windows PowerShell
Test-NetConnection -ComputerName <IP_SERVIDOR> -Port 8080
```

#### 6. Configurar Firewall

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 8080/tcp
sudo ufw reload

# CentOS/RHEL (firewalld)
sudo firewall-cmd --add-port=8080/tcp --permanent
sudo firewall-cmd --reload
```

#### 7. Configurar Supervisor (Auto-Start)

```bash
sudo nano /etc/supervisor/conf.d/neuroone-ws.conf
```

**Conteúdo:**
```ini
[program:neuroone-ws]
command=/opt/neuroone/venv/bin/python3 /opt/neuroone/server_headless-V4.py
directory=/opt/neuroone
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/neuroone-ws.log
stdout_logfile_maxbytes=10MB
stdout_logfile_backups=3
environment=PYTHONUNBUFFERED=1
```

**Ativar:**
```bash
# Recarregar configurações
sudo supervisorctl reread
sudo supervisorctl update

# Iniciar serviço
sudo supervisorctl start neuroone-ws

# Verificar status
sudo supervisorctl status neuroone-ws
# Deve mostrar: neuroone-ws    RUNNING   pid 12345, uptime 0:00:05
```

**Comandos úteis:**
```bash
# Parar
sudo supervisorctl stop neuroone-ws

# Reiniciar
sudo supervisorctl restart neuroone-ws

# Ver logs
sudo tail -f /var/log/neuroone-ws.log

# Logs do supervisor
sudo tail -f /var/log/supervisor/supervisord.log
```

#### 8. Configurar Systemd (Alternativa ao Supervisor)

```bash
sudo nano /etc/systemd/system/neuroone-ws.service
```

**Conteúdo:**
```ini
[Unit]
Description=NeuroOne WebSocket Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/neuroone
Environment="PYTHONUNBUFFERED=1"
ExecStart=/opt/neuroone/venv/bin/python3 /opt/neuroone/server_headless-V4.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Ativar:**
```bash
# Recarregar daemon
sudo systemctl daemon-reload

# Iniciar serviço
sudo systemctl start neuroone-ws

# Verificar status
sudo systemctl status neuroone-ws

# Habilitar auto-start no boot
sudo systemctl enable neuroone-ws

# Ver logs
sudo journalctl -u neuroone-ws -f
```

#### 9. Monitoramento

**Ver conexões ativas:**
```bash
sudo netstat -tulpn | grep 8080
```

**Ver CSVs gerados:**
```bash
ls -lh /opt/neuroone/*.csv
```

**Monitorar logs em tempo real:**
```bash
# Supervisor
sudo tail -f /var/log/neuroone-ws.log

# Systemd
sudo journalctl -u neuroone-ws -f
```

#### 10. Configurar Nginx Reverse Proxy (Opcional)

Se quiser usar WSS (WebSocket Secure) com SSL:

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

```nginx
# /etc/nginx/sites-available/neuroone-ws
server {
    listen 80;
    server_name ws.neuroone.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/neuroone-ws /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Gerar SSL (Let's Encrypt)
sudo certbot --nginx -d ws.neuroone.com
```

**Resultado:** `wss://ws.neuroone.com` (seguro!)

---

## Protocolo de Comunicação

### Fluxo de Dados

```
1. CONEXÃO
   Cliente WebSocket conecta em ws://IP:8080

2. IDENTIFICAÇÃO
   a) Dashboard: envia string "dash"
   b) Aluno: envia JSON com dados EEG

3. TRANSMISSÃO (Aluno)
   A cada ~1 segundo, envia:
   {
     "Codigo": "ABC123",
     "Nome": "Joao_Silva",
     "Att": 85,
     "Med": 72,
     "Delta": 123456,
     ...
   }

4. PROCESSAMENTO (Servidor)
   - Salva linha em CSV
   - Envia para dashboard: {"ID": 1, "Nome": "...", "Att": 85, "Med": 72}

5. RECEPÇÃO (Dashboard)
   Recebe update em tempo real para cada aluno conectado

6. DESCONEXÃO
   Cliente fecha conexão, servidor remove do registro
```

### Formato dos Dados

#### Dados Completos (Aluno → Servidor)

```json
{
  "Codigo": "ABC123",
  "Nome": "Joao_Silva",
  "Att": 85,
  "Med": 72,
  "Delta": 123456,
  "Theta": 234567,
  "LowAlpha": 345678,
  "HighAlpha": 456789,
  "LowBeta": 567890,
  "HighBeta": 678901,
  "LowGamma": 789012,
  "MiddleGamma": 890123
}
```

#### Dados Resumidos (Servidor → Dashboard)

```json
{
  "ID": 1,
  "Nome": "Joao_Silva",
  "Codigo": "ABC123",
  "Att": 85,
  "Med": 72
}
```

#### CSV Salvo

```csv
Att,Med,Delta,Theta,LowAlpha,HighAlpha,LowBeta,HighBeta,LowGamma,MiddleGamma
85,72,123456,234567,345678,456789,567890,678901,789012,890123
84,73,123450,234560,345670,456780,567890,678900,789010,890120
...
```

**Nome do arquivo:** `{Nome}.csv` (ex: `Joao_Silva.csv`)

---

## Troubleshooting

### Problema: Porta COM não encontrada

**Sintomas:** "No device found with CH340"

**Solução:**
```bash
# Windows
1. Abrir Gerenciador de Dispositivos
2. Procurar "Portas (COM & LPT)"
3. Se mostrar "Dispositivo desconhecido":
   - Baixar driver CH340: https://www.wch-ic.com/downloads/CH341SER_ZIP.html
   - Instalar driver
   - Reiniciar PC

# Linux
sudo apt install ch341-uart dkms
```

---

### Problema: WebSocket não conecta

**Sintomas:** "Connection refused" ou timeout

**Solução:**
```bash
# 1. Verificar se servidor está rodando
ps aux | grep python

# 2. Verificar porta aberta
sudo netstat -tulpn | grep 8080

# 3. Testar localmente
wscat -c ws://localhost:8080

# 4. Verificar firewall
sudo ufw status
sudo ufw allow 8080/tcp
```

---

### Problema: CSV não está sendo criado

**Sintomas:** Nenhum arquivo `.csv` na pasta

**Solução:**
```python
# Verificar permissões do diretório
ls -ld /opt/neuroone
# Deve mostrar: drwxr-xr-x

# Dar permissão de escrita
sudo chown www-data:www-data /opt/neuroone
sudo chmod 755 /opt/neuroone

# Verificar logs
sudo tail -f /var/log/neuroone-ws.log
```

---

### Problema: Servidor cai após algumas horas

**Sintomas:** Serviço para de responder

**Solução:**
```bash
# 1. Verificar logs
sudo journalctl -u neuroone-ws -n 100

# 2. Aumentar timeout
# Editar /etc/systemd/system/neuroone-ws.service
Restart=always
RestartSec=10

# 3. Adicionar health check
# Usar supervisor com monitoring
```

---

### Problema: Dados EEG com valores zerados

**Sintomas:** `Att: 0, Med: 0, Delta: 0`

**Solução:**
```python
# 1. Verificar qualidade do sinal
# Signal quality deve ser < 50 (bom)

# 2. Posicionar headset corretamente
# - Eletrodo seco no centro da testa
# - Clip de orelha bem preso

# 3. Aguardar calibração (30 segundos)

# 4. Verificar bateria do dispositivo
```

---

## Referências

- **websockets (Python):** https://websockets.readthedocs.io/
- **PySide6:** https://doc.qt.io/qtforpython-6/
- **Supervisor:** http://supervisord.org/
- **Driver CH340:** https://www.wch-ic.com/downloads/CH341SER_ZIP.html
- **Protocolo NeuroSky:** https://github.com/neurosky/

---

**Documento:** 14-SERVIDOR-PYTHON-EEG.md
**Versão:** 1.0
**Data:** 07/11/2025
**Autor:** Claude Code (NeuroOne Team)
