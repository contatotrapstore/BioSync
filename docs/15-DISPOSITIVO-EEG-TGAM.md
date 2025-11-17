# 15 - DISPOSITIVO EEG TGAM

## Índice
1. [Visão Geral](#visão-geral)
2. [Especificações Técnicas](#especificações-técnicas)
3. [Protocolo ThinkGear](#protocolo-thinkgear)
4. [Conexão Bluetooth](#conexão-bluetooth)
5. [Integração com PWA](#integração-com-pwa)
6. [Calibração e Uso](#calibração-e-uso)
7. [Interpretação dos Dados](#interpretação-dos-dados)
8. [Troubleshooting](#troubleshooting)

---

## Visão Geral

O NeuroOne utiliza headsets EEG baseados no chip **TGAM (ThinkGear ASIC Module)**, um módulo amplamente usado em dispositivos de neurofeedback consumer como NeuroSky MindWave, Tauro e similares.

### Características Principais

- **1 canal EEG** (FP1 - lobo frontal)
- **Protocolo:** ThinkGear Serial
- **Conexão:** Bluetooth 2.0/2.1 (SPP) ou USB Serial
- **Frequência de amostragem:** 512 Hz (dados brutos) / 1 Hz (métricas processadas)
- **Bateria:** ~8 horas de uso contínuo
- **Alcance Bluetooth:** ~10 metros

### Dispositivos Compatíveis

O sistema NeuroOne é compatível com qualquer dispositivo baseado em TGAM:

- ✅ NeuroSky MindWave
- ✅ NeuroSky MindWave Mobile
- ✅ Tauro EEG Headset
- ✅ Genéricos com chip TGAM
- ✅ Dispositivos com protocolo ThinkGear

### O que o Dispositivo Mede

```
┌───────────────────────────────────────────────────────────┐
│                  HEADSET EEG TGAM                          │
├───────────────────────────────────────────────────────────┤
│                                                            │
│  [🔗]  Eletrodo seco (FP1 - centro da testa)              │
│  [🔗]  Clip de referência (orelha esquerda)               │
│  [📡]  Bluetooth 2.0 (SPP)                                 │
│  [🔋]  Bateria AAA (8h duração)                           │
│  [💡]  LED status (azul = conectado)                      │
│                                                            │
└───────────────────────────────────────────────────────────┘
```

**Métricas Geradas:**

1. **Atenção** (0-100): Nível de foco/concentração
2. **Meditação/Relaxamento** (0-100): Nível de calma mental
3. **Ondas Cerebrais** (valores absolutos):
   - **Delta** (0.5-2.75 Hz): Sono profundo
   - **Theta** (3.5-6.75 Hz): Sonolência, criatividade
   - **Alpha** (7.5-12.75 Hz): Relaxamento, olhos fechados
   - **Beta** (13-29.75 Hz): Atenção, alerta
   - **Gamma** (30-50 Hz): Processamento cognitivo alto
4. **Qualidade do Sinal** (0-200): 0 = perfeito, 200 = sem contato

---

## Especificações Técnicas

### Hardware

| Especificação | Valor |
|---------------|-------|
| **Chip** | TGAM (ThinkGear ASIC Module) |
| **Canais EEG** | 1 (FP1) |
| **Referência** | Orelha esquerda (A1) |
| **Taxa de amostragem** | 512 Hz (raw) |
| **Resolução ADC** | 12-bit |
| **Ganho** | ~8000x |
| **Impedância de entrada** | >100 MΩ |
| **Faixa de frequência** | 0.5 - 50 Hz |
| **Protocolo** | ThinkGear Serial |
| **Baud rate** | 57600 bps |
| **Bluetooth** | 2.0/2.1 SPP |
| **Alimentação** | 1x AAA (1.5V) ou USB |
| **Duração bateria** | ~8 horas |
| **Peso** | ~90g |

### Eletrodos

**Eletrodo Frontal (FP1):**
- Posição: Centro da testa, acima das sobrancelhas
- Tipo: Eletrodo seco (não requer gel)
- Material: Ouro ou prata

**Referência (A1):**
- Posição: Lóbulo da orelha esquerda
- Tipo: Clip metálico

---

## Protocolo ThinkGear

### Estrutura do Pacote

Cada pacote de dados segue o formato:

```
[SYNC] [SYNC] [PLENGTH] [PAYLOAD...] [CHECKSUM]
```

**Bytes:**
```
[170] [170] [length] [payload...] [checksum]
  ↑     ↑       ↑          ↑            ↑
Sync  Sync   Tamanho   Dados      Validação
```

### Detalhamento

#### 1. SYNC (2 bytes)

```python
SYNC = [170, 170]  # 0xAA 0xAA
```

Indica o início de um novo pacote.

#### 2. PLENGTH (1 byte)

```python
PLENGTH = 4 a 169
```

Tamanho do payload (não inclui SYNC, PLENGTH e CHECKSUM).

#### 3. PAYLOAD (PLENGTH bytes)

Contém os dados EEG codificados em pares `[CODE] [VALUE]` ou `[CODE] [VLENGTH] [VALUE...]`.

**Códigos principais:**

| CODE | Nome | Tamanho | Descrição |
|------|------|---------|-----------|
| 2 | SIGNAL_QUALITY | 1 byte | Qualidade do sinal (0-200) |
| 4 | ATTENTION | 1 byte | Atenção (0-100) |
| 5 | MEDITATION | 1 byte | Meditação (0-100) |
| 131 (0x83) | EEG_POWER | 24 bytes | Ondas cerebrais (8 x 3 bytes) |
| 128 (0x80) | RAW_VALUE | 2 bytes | Valor bruto (não usado) |

#### 4. CHECKSUM (1 byte)

```python
checksum = (~sum(payload_bytes) & 0xFF)
```

Validação de integridade:
1. Soma todos os bytes do payload
2. Inverte bits (NOT)
3. Pega apenas último byte (AND 0xFF)

### Exemplo de Pacote Completo

```
Pacote hexadecimal:
AA AA 20 02 00 04 55 05 46 83 18 00 00 5C 00 00 50 64 00 03 18
00 06 67 00 05 89 00 0C 4C 00 04 D6 00 0A 86 B5

Decodificação:
[AA][AA]      → SYNC
[20]          → PLENGTH = 32 bytes
[02][00]      → CODE 2 (Signal Quality) = 0 (perfeito)
[04][55]      → CODE 4 (Attention) = 85
[05][46]      → CODE 5 (Meditation) = 70
[83][18]...   → CODE 131 (EEG Power) - 24 bytes:
                Delta:    000 05C = 92 (00 00 5C)
                Theta:    000 506 = 1286 (00 05 06)
                LowAlpha: 000 318 = 792 (00 03 18)
                HighAlpha: 000 667 = 1639 (00 06 67)
                LowBeta:  000 589 = 1417 (00 05 89)
                HighBeta: 000 C4C = 3148 (00 0C 4C)
                LowGamma: 000 4D6 = 1238 (00 04 D6)
                MidGamma: 000 A86 = 2694 (00 0A 86)
[B5]          → CHECKSUM
```

### Implementação do Parser

Já implementado em `biosync-atualizado/parser.py`:

```python
class Mind:
    def __init__(self):
        self.signal = 200
        self.delta = 0
        self.theta = 0
        self.low_alpha = 0
        self.high_alpha = 0
        self.low_beta = 0
        self.high_beta = 0
        self.low_gamma = 0
        self.middle_gamma = 0
        self.att = 0
        self.med = 0

    def parseByte(self, byte):
        """Parse cada byte recebido da porta serial"""
        # Implementação completa em biosync-atualizado/parser.py
        # Procura por SYNC bytes, valida checksum, extrai dados
```

---

## Conexão Bluetooth

### Windows

#### 1. Parear Dispositivo

```
1. Ligar headset EEG (LED azul piscando)
2. Windows > Configurações > Bluetooth
3. Adicionar dispositivo Bluetooth
4. Selecionar "MindWave" ou "TGAM"
5. Código PIN: 0000 (se solicitado)
6. Aguardar "Conectado"
```

#### 2. Identificar Porta COM

```
1. Painel de Controle > Gerenciador de Dispositivos
2. Expandir "Portas (COM e LPT)"
3. Procurar "CH340" ou "USB-SERIAL"
4. Anotar número (ex: COM3, COM4)
```

#### 3. Testar Conexão

```python
import serial

# Substituir COM3 pela porta correta
ser = serial.Serial('COM3', 57600, timeout=1)

while True:
    byte = ser.read(1)
    if byte:
        print(f"Byte recebido: {byte[0]}")
```

### Linux

#### 1. Instalar Dependências

```bash
sudo apt install bluez bluez-tools python3-serial
```

#### 2. Parear Dispositivo

```bash
# Iniciar bluetooth
sudo systemctl start bluetooth

# Scan de dispositivos
bluetoothctl

# No prompt do bluetoothctl:
[bluetooth]# power on
[bluetooth]# agent on
[bluetooth]# scan on
# Aguardar aparecer: [NEW] Device XX:XX:XX:XX:XX:XX TGAM
[bluetooth]# pair XX:XX:XX:XX:XX:XX
# PIN: 0000
[bluetooth]# trust XX:XX:XX:XX:XX:XX
[bluetooth]# connect XX:XX:XX:XX:XX:XX
[bluetooth]# exit
```

#### 3. Criar Link Serial

```bash
# Bind do dispositivo Bluetooth a porta serial
sudo rfcomm bind 0 XX:XX:XX:XX:XX:XX 1

# Verificar criação de /dev/rfcomm0
ls -l /dev/rfcomm0

# Dar permissão
sudo chmod 666 /dev/rfcomm0
```

#### 4. Testar Conexão

```python
import serial

ser = serial.Serial('/dev/rfcomm0', 57600, timeout=1)

while True:
    byte = ser.read(1)
    if byte:
        print(f"Byte: {byte[0]}")
```

### Android/Web Bluetooth

**Web Bluetooth API** (para PWA):

```javascript
// Solicitar dispositivo Bluetooth
const device = await navigator.bluetooth.requestDevice({
    filters: [
        { name: 'MindWave' },
        { name: 'TGAM' }
    ],
    optionalServices: ['battery_service']
});

// Conectar ao GATT Server
const server = await device.gatt.connect();

// Obter serviço SPP (Serial Port Profile)
const service = await server.getPrimaryService('serial_port_service_uuid');

// Obter característica de dados
const characteristic = await service.getCharacteristic('rx_characteristic_uuid');

// Escutar notificações
characteristic.addEventListener('characteristicvaluechanged', (event) => {
    const value = event.target.value; // DataView
    for (let i = 0; i < value.byteLength; i++) {
        const byte = value.getUint8(i);
        parser.parseByte(byte);
    }
});

// Iniciar notificações
await characteristic.startNotifications();
```

**Nota:** Web Bluetooth API requer HTTPS (exceto localhost).

---

## Integração com PWA

### Fluxo de Conexão no App Aluno

```javascript
// 1. Aluno clica em "Conectar EEG"
async function connectEEG() {
    try {
        // Solicitar dispositivo
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: 'TGAM' }],
            optionalServices: ['serial_port_service']
        });

        // Conectar
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('serial_port_service');
        const rx = await service.getCharacteristic('rx_char');

        // Parser local
        const parser = new ThinkGearParser();

        // Escutar dados
        rx.addEventListener('characteristicvaluechanged', (event) => {
            const data = event.target.value;
            for (let i = 0; i < data.byteLength; i++) {
                parser.parseByte(data.getUint8(i));
            }

            // Enviar para servidor via WebSocket
            if (parser.isDataReady()) {
                sendToServer({
                    Att: parser.attention,
                    Med: parser.meditation,
                    Delta: parser.delta,
                    Theta: parser.theta,
                    LowAlpha: parser.lowAlpha,
                    HighAlpha: parser.highAlpha,
                    LowBeta: parser.lowBeta,
                    HighBeta: parser.highBeta,
                    LowGamma: parser.lowGamma,
                    MiddleGamma: parser.middleGamma
                });
            }
        });

        await rx.startNotifications();

        // Sucesso
        showStatus('EEG Conectado ✅', 'green');

    } catch (error) {
        showStatus('Erro ao conectar EEG ❌', 'red');
        console.error(error);
    }
}
```

### Parser JavaScript

**Adaptar de `parser.py` para JavaScript:**

```javascript
class ThinkGearParser {
    constructor() {
        this.state = 'SYNC';
        this.payload = [];
        this.payloadLength = 0;
        this.checksum = 0;

        // Dados
        this.signal = 200;
        this.attention = 0;
        this.meditation = 0;
        this.delta = 0;
        this.theta = 0;
        this.lowAlpha = 0;
        this.highAlpha = 0;
        this.lowBeta = 0;
        this.highBeta = 0;
        this.lowGamma = 0;
        this.middleGamma = 0;
    }

    parseByte(byte) {
        if (this.state === 'SYNC') {
            if (byte === 170) {  // 0xAA
                this.state = 'SYNC2';
            }
        } else if (this.state === 'SYNC2') {
            if (byte === 170) {
                this.state = 'PLENGTH';
            } else {
                this.state = 'SYNC';
            }
        } else if (this.state === 'PLENGTH') {
            this.payloadLength = byte;
            this.payload = [];
            this.checksum = 0;
            this.state = 'PAYLOAD';
        } else if (this.state === 'PAYLOAD') {
            this.payload.push(byte);
            this.checksum += byte;

            if (this.payload.length === this.payloadLength) {
                this.state = 'CHECKSUM';
            }
        } else if (this.state === 'CHECKSUM') {
            const expectedChecksum = (~this.checksum) & 0xFF;

            if (byte === expectedChecksum) {
                this.parsePayload();
            }

            this.state = 'SYNC';
        }
    }

    parsePayload() {
        let i = 0;
        while (i < this.payload.length) {
            const code = this.payload[i++];

            if (code === 2) {  // Signal Quality
                this.signal = this.payload[i++];
            } else if (code === 4) {  // Attention
                this.attention = this.payload[i++];
            } else if (code === 5) {  // Meditation
                this.meditation = this.payload[i++];
            } else if (code === 131) {  // EEG Power
                i++;  // Skip VLENGTH
                this.delta = this.read3Bytes(i); i += 3;
                this.theta = this.read3Bytes(i); i += 3;
                this.lowAlpha = this.read3Bytes(i); i += 3;
                this.highAlpha = this.read3Bytes(i); i += 3;
                this.lowBeta = this.read3Bytes(i); i += 3;
                this.highBeta = this.read3Bytes(i); i += 3;
                this.lowGamma = this.read3Bytes(i); i += 3;
                this.middleGamma = this.read3Bytes(i); i += 3;
            }
        }
    }

    read3Bytes(offset) {
        return (this.payload[offset] << 16) |
               (this.payload[offset + 1] << 8) |
               this.payload[offset + 2];
    }

    isDataReady() {
        return this.attention > 0 || this.meditation > 0;
    }
}
```

---

## Calibração e Uso

### Preparação do Aluno

**Antes de colocar o headset:**
1. ✅ Limpar testa (remover oleosidade)
2. ✅ Secar bem (não molhado)
3. ✅ Afastar cabelo da testa

**Posicionamento correto:**
```
┌────────────────────────────────┐
│         VISTA FRONTAL          │
├────────────────────────────────┤
│                                │
│        🧑                      │
│       ╱│╲                      │
│      ╱ │ ╲                     │
│    [●]─┘  [📡]                 │
│     ↑       ↑                  │
│  Eletrodo  Clip                │
│   (testa) (orelha)             │
│                                │
└────────────────────────────────┘
```

**Checklist:**
- [ ] Eletrodo no **centro da testa** (acima das sobrancelhas)
- [ ] **Sem cabelo** entre eletrodo e pele
- [ ] Clip na **orelha esquerda** (lóbulo)
- [ ] Clip **bem preso** (não frouxo)
- [ ] Headset **confortável** (não apertado demais)

### Processo de Calibração

**Tempo:** ~30 segundos

```
1. Aluno coloca headset
2. Sistema verifica Signal Quality:
   - 0-50:   ✅ Ótimo (verde)
   - 51-100: ⚠️ Bom (amarelo)
   - 101-150: ⚠️ Regular (laranja)
   - 151-200: ❌ Ruim (vermelho)

3. Se ruim:
   - Reposicionar eletrodo
   - Limpar testa
   - Apertar clip

4. Aguardar 30s de estabilização:
   - Brain waves começam a aparecer
   - Atenção/Meditação > 0

5. Calibração completa ✅
```

### Interface de Calibração no PWA

```javascript
function showCalibrationStatus(signalQuality) {
    let status, color;

    if (signalQuality <= 50) {
        status = '✅ Sinal Ótimo';
        color = 'green';
    } else if (signalQuality <= 100) {
        status = '⚠️ Sinal Bom';
        color = 'yellow';
    } else if (signalQuality <= 150) {
        status = '⚠️ Sinal Regular - Ajuste o headset';
        color = 'orange';
    } else {
        status = '❌ Sem Sinal - Reposicione';
        color = 'red';
    }

    document.getElementById('signal-status').textContent = status;
    document.getElementById('signal-status').style.color = color;
}
```

---

## Interpretação dos Dados

### Atenção (0-100)

| Faixa | Nível | Significado |
|-------|-------|-------------|
| 0-20 | Muito baixo | Distração severa, sono |
| 21-40 | Baixo | Distraído, desatento |
| 41-60 | Médio | Atenção moderada |
| 61-80 | Alto | Focado, concentrado |
| 81-100 | Muito alto | Hiper-focado, flow state |

### Meditação/Relaxamento (0-100)

| Faixa | Nível | Significado |
|-------|-------|-------------|
| 0-20 | Muito baixo | Estresse alto, ansiedade |
| 21-40 | Baixo | Tensão, alerta |
| 41-60 | Médio | Calma moderada |
| 61-80 | Alto | Relaxado, tranquilo |
| 81-100 | Muito alto | Meditação profunda |

### Ondas Cerebrais

**Delta (0.5-2.75 Hz):**
- Valores altos: Sono profundo, inconsciência
- Valores baixos: Alerta

**Theta (3.5-6.75 Hz):**
- Valores altos: Sonolência, criatividade, imaginação
- Valores baixos: Alerta, foco

**Alpha (7.5-12.75 Hz):**
- Valores altos: Relaxamento, olhos fechados, meditação
- Valores baixos: Olhos abertos, atenção

**Beta (13-29.75 Hz):**
- Valores altos: Atenção ativa, raciocínio, alerta
- Valores baixos: Relaxamento

**Gamma (30-50 Hz):**
- Valores altos: Processamento cognitivo intenso, aprendizado
- Valores baixos: Processamento normal

---

## Troubleshooting

### ❌ "Signal Quality sempre 200"

**Causas:**
- Headset não está ligado
- Bateria fraca
- Eletrodo sem contato com a pele
- Cabelo entre eletrodo e testa

**Solução:**
1. Verificar se LED está piscando (azul = ligado)
2. Trocar bateria
3. Reposicionar eletrodo
4. Afastar cabelo

---

### ❌ "Atenção e Meditação sempre 0"

**Causas:**
- Calibração não completa (aguardar 30s)
- Signal Quality ruim (>100)
- Movimento excessivo

**Solução:**
1. Aguardar 30 segundos de estabilização
2. Melhorar qualidade do sinal
3. Pedir para aluno ficar quieto

---

### ❌ "Valores flutuam demais"

**Causas:**
- Movimento da cabeça
- Fala durante sessão
- Eletrodo frouxo

**Solução:**
1. Pedir para aluno ficar parado
2. Evitar falar durante sessão
3. Apertar headset (não demais)

---

### ❌ "Bluetooth não pareia"

**Causas:**
- Dispositivo já pareado com outro computador
- Bluetooth desligado
- Fora de alcance (>10m)

**Solução:**
1. Desligar/ligar headset
2. Remover pareamento antigo
3. Aproximar dispositivos

---

## Referências

- **ThinkGear Protocol:** https://developer.neurosky.com/docs/doku.php?id=thinkgear_communications_protocol
- **Web Bluetooth API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API
- **NeuroSky Store:** https://store.neurosky.com/
- **TGAM Datasheet:** https://developer.neurosky.com/docs/lib/exe/fetch.php?media=tgam_datasheet.pdf

---

**Documento:** 15-DISPOSITIVO-EEG-TGAM.md
**Versão:** 1.0
**Data:** 07/11/2025
**Autor:** Claude Code (NeuroOne Team)
