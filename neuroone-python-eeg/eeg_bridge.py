"""
EEG Bridge Server - NeuroOne
Ponte entre dispositivos EEG (Neurosky ThinkGear) e Node.js WebSocket Server

Fluxo:
1. Recebe dados brutos do dispositivo EEG via Serial/Bluetooth
2. Parseia o protocolo ThinkGear
3. Envia dados processados para o Node.js backend via WebSocket

Autor: NeuroOne Team
Data: 2025-11-17
"""

import asyncio
import websockets
import json
import serial
import struct
import logging
from datetime import datetime
from typing import Optional, Dict, Any

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('EEGBridge')


class ThinkGearParser:
    """
    Parser para o protocolo ThinkGear (Neurosky)
    Baseado na documentação: ThinkGear Communications Protocol
    """

    # Payload IDs
    POOR_SIGNAL_QUALITY = 0x02
    ATTENTION = 0x04
    MEDITATION = 0x05
    BLINK_STRENGTH = 0x16
    RAW_WAVE = 0x80
    EEG_POWER = 0x83

    def __init__(self):
        self.buffer = bytearray()
        self.last_data = {}

    def parse_packet(self, data: bytes) -> Optional[Dict[str, Any]]:
        """
        Parseia um pacote ThinkGear e retorna os dados EEG

        Formato do pacote:
        [SYNC][SYNC][PLENGTH][PAYLOAD...][CHECKSUM]

        SYNC = 0xAA (2 bytes)
        PLENGTH = tamanho do payload (1 byte)
        PAYLOAD = dados TLV (Type-Length-Value)
        CHECKSUM = 1 byte
        """
        self.buffer.extend(data)

        while len(self.buffer) >= 4:
            # Procurar por SYNC bytes (0xAA 0xAA)
            if self.buffer[0] != 0xAA or self.buffer[1] != 0xAA:
                # Remover byte inválido e continuar
                self.buffer.pop(0)
                continue

            # Ler tamanho do payload
            payload_length = self.buffer[2]

            # Verificar se temos o pacote completo
            packet_length = 4 + payload_length  # SYNC(2) + PLENGTH(1) + PAYLOAD + CHECKSUM(1)
            if len(self.buffer) < packet_length:
                # Aguardar mais dados
                return None

            # Extrair pacote completo
            packet = self.buffer[:packet_length]
            self.buffer = self.buffer[packet_length:]

            # Verificar checksum
            payload = packet[3:-1]  # Payload sem SYNC, PLENGTH e CHECKSUM
            checksum = packet[-1]

            calculated_checksum = (~sum(payload) & 0xFF)
            if calculated_checksum != checksum:
                logger.warning(f"Checksum inválido: esperado {calculated_checksum}, recebido {checksum}")
                continue

            # Parsear payload
            eeg_data = self._parse_payload(payload)
            if eeg_data:
                return eeg_data

        return None

    def _parse_payload(self, payload: bytes) -> Optional[Dict[str, Any]]:
        """Parseia o payload TLV (Type-Length-Value)"""
        data = {}
        i = 0

        while i < len(payload):
            code = payload[i]
            i += 1

            # Códigos de 1 byte (sem length)
            if code == self.POOR_SIGNAL_QUALITY:
                data['signalQuality'] = 200 - payload[i] if i < len(payload) else 0
                i += 1

            elif code == self.ATTENTION:
                data['attention'] = payload[i] if i < len(payload) else 0
                i += 1

            elif code == self.MEDITATION:
                data['relaxation'] = payload[i] if i < len(payload) else 0  # Meditation = Relaxation
                i += 1

            elif code == self.BLINK_STRENGTH:
                data['blinkStrength'] = payload[i] if i < len(payload) else 0
                i += 1

            # Códigos multi-byte (com length)
            elif code == self.EEG_POWER:
                length = payload[i] if i < len(payload) else 0
                i += 1
                if length == 24:  # 8 bandas x 3 bytes cada
                    eeg_powers = self._parse_eeg_power(payload[i:i+24])
                    data.update(eeg_powers)
                i += length

            elif code == self.RAW_WAVE:
                length = payload[i] if i < len(payload) else 0
                i += 1
                # Raw wave (não usado no neurofeedback básico)
                i += length

            else:
                # Código desconhecido, pular
                logger.debug(f"Código desconhecido: 0x{code:02X}")
                i += 1

        # Atualizar last_data e retornar apenas se temos novos dados
        if data:
            self.last_data.update(data)
            return self.last_data.copy()

        return None

    def _parse_eeg_power(self, data: bytes) -> Dict[str, int]:
        """
        Parseia os valores de potência das bandas EEG (8 bandas x 3 bytes)

        Bandas:
        - Delta (0.5-2.75Hz)
        - Theta (3.5-6.75Hz)
        - Low Alpha (7.5-9.25Hz)
        - High Alpha (10-11.75Hz)
        - Low Beta (13-16.75Hz)
        - High Beta (18-29.75Hz)
        - Low Gamma (31-39.75Hz)
        - Mid Gamma (41-49.75Hz)
        """
        if len(data) != 24:
            return {}

        def read_uint24(offset):
            """Lê um inteiro de 24 bits (big-endian)"""
            return (data[offset] << 16) | (data[offset+1] << 8) | data[offset+2]

        return {
            'delta': read_uint24(0),
            'theta': read_uint24(3),
            'lowAlpha': read_uint24(6),
            'highAlpha': read_uint24(9),
            'lowBeta': read_uint24(12),
            'highBeta': read_uint24(15),
            'lowGamma': read_uint24(18),
            'midGamma': read_uint24(21),
        }


class EEGBridge:
    """
    Ponte entre dispositivos EEG e Node.js backend
    """

    def __init__(
        self,
        serial_port: str = 'COM3',
        baud_rate: int = 57600,
        backend_url: str = 'ws://localhost:3001',
        student_id: Optional[str] = None,
        session_id: Optional[str] = None
    ):
        self.serial_port = serial_port
        self.baud_rate = baud_rate
        self.backend_url = backend_url
        self.student_id = student_id
        self.session_id = session_id

        self.parser = ThinkGearParser()
        self.serial_conn: Optional[serial.Serial] = None
        self.websocket: Optional[websockets.WebSocketClientProtocol] = None
        self.running = False

    async def connect_serial(self):
        """Conecta ao dispositivo EEG via Serial/Bluetooth"""
        try:
            logger.info(f"Conectando à porta serial {self.serial_port}...")
            # Serial connection é bloqueante, executar em thread
            loop = asyncio.get_event_loop()
            self.serial_conn = await loop.run_in_executor(
                None,
                lambda: serial.Serial(self.serial_port, self.baud_rate, timeout=1)
            )
            logger.info(f"✅ Conectado à porta {self.serial_port}")
        except Exception as e:
            logger.error(f"❌ Erro ao conectar à porta serial: {e}")
            raise

    async def connect_websocket(self):
        """Conecta ao Node.js WebSocket backend"""
        try:
            logger.info(f"Conectando ao backend {self.backend_url}...")
            # TODO: Adicionar autenticação JWT aqui
            self.websocket = await websockets.connect(self.backend_url)
            logger.info("✅ Conectado ao backend WebSocket")

            # Enviar mensagem de join como student
            await self.websocket.send(json.dumps({
                'event': 'student:join',
                'data': {
                    'sessionId': self.session_id,
                    'studentId': self.student_id,
                }
            }))
        except Exception as e:
            logger.error(f"❌ Erro ao conectar ao WebSocket: {e}")
            raise

    async def read_serial(self):
        """Lê dados da porta serial de forma assíncrona"""
        loop = asyncio.get_event_loop()
        try:
            data = await loop.run_in_executor(
                None,
                self.serial_conn.read,
                256  # Ler até 256 bytes por vez
            )
            return data
        except Exception as e:
            logger.error(f"Erro ao ler serial: {e}")
            return b''

    async def send_eeg_data(self, eeg_data: Dict[str, Any]):
        """Envia dados EEG para o backend Node.js"""
        if not self.websocket:
            return

        try:
            # Formatar dados no formato esperado pelo backend
            payload = {
                'event': 'eeg:data',
                'data': {
                    'studentId': self.student_id,
                    'sessionId': self.session_id,
                    'timestamp': datetime.utcnow().isoformat(),
                    'attention': eeg_data.get('attention', 0),
                    'relaxation': eeg_data.get('relaxation', 0),
                    'signalQuality': eeg_data.get('signalQuality', 0),
                    'delta': eeg_data.get('delta', 0),
                    'theta': eeg_data.get('theta', 0),
                    'alpha': (eeg_data.get('lowAlpha', 0) + eeg_data.get('highAlpha', 0)) // 2,
                    'beta': (eeg_data.get('lowBeta', 0) + eeg_data.get('highBeta', 0)) // 2,
                    'gamma': (eeg_data.get('lowGamma', 0) + eeg_data.get('midGamma', 0)) // 2,
                }
            }

            await self.websocket.send(json.dumps(payload))
            logger.debug(f"📊 Dados enviados: Att={payload['data']['attention']}, Rel={payload['data']['relaxation']}, Q={payload['data']['signalQuality']}")

        except Exception as e:
            logger.error(f"Erro ao enviar dados EEG: {e}")

    async def run(self):
        """Loop principal da ponte"""
        self.running = True

        try:
            # Conectar ao dispositivo e backend
            await self.connect_serial()
            await self.connect_websocket()

            logger.info("🚀 EEG Bridge iniciado!")
            logger.info(f"📡 Lendo dados de {self.serial_port} e enviando para {self.backend_url}")

            # Loop de leitura e envio
            while self.running:
                # Ler dados do dispositivo EEG
                raw_data = await self.read_serial()

                if raw_data:
                    # Parsear dados ThinkGear
                    eeg_data = self.parser.parse_packet(raw_data)

                    if eeg_data:
                        # Enviar para backend
                        await self.send_eeg_data(eeg_data)

                # Small delay to avoid busy waiting
                await asyncio.sleep(0.01)

        except KeyboardInterrupt:
            logger.info("⏹️  Bridge parado pelo usuário")
        except Exception as e:
            logger.error(f"❌ Erro no loop principal: {e}")
        finally:
            await self.cleanup()

    async def cleanup(self):
        """Limpa recursos e fecha conexões"""
        self.running = False

        if self.websocket:
            try:
                await self.websocket.send(json.dumps({
                    'event': 'student:leave',
                    'data': {
                        'sessionId': self.session_id
                    }
                }))
                await self.websocket.close()
                logger.info("WebSocket desconectado")
            except Exception as e:
                logger.warning(f"Erro ao fechar WebSocket: {e}")

        if self.serial_conn and self.serial_conn.is_open:
            self.serial_conn.close()
            logger.info("Porta serial fechada")


def main():
    """Ponto de entrada principal"""
    import argparse

    parser = argparse.ArgumentParser(description='EEG Bridge - NeuroOne')
    parser.add_argument('--port', default='COM3', help='Porta serial do dispositivo EEG')
    parser.add_argument('--baud', type=int, default=57600, help='Baud rate')
    parser.add_argument('--backend', default='ws://localhost:3001', help='URL do backend WebSocket')
    parser.add_argument('--student-id', required=True, help='ID do aluno (UUID)')
    parser.add_argument('--session-id', required=True, help='ID da sessão (UUID)')

    args = parser.parse_args()

    bridge = EEGBridge(
        serial_port=args.port,
        baud_rate=args.baud,
        backend_url=args.backend,
        student_id=args.student_id,
        session_id=args.session_id
    )

    asyncio.run(bridge.run())


if __name__ == '__main__':
    main()
