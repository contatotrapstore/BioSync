
let audiosDinamicos = [];
let volumeControlContainer;
let volumeSlider;
let volumeButton;
let controleAtivo = false;
let feedbackPositivo, feedbackNegativo, tipoJogo;
let velocidade, velocidadeMaxima, pontuacaoHabilitada;
let tipoFeedback = 1; 
let valorAtual = 0;
let valorMaximo = 51;
let valorMinimo = 45;
let dados;
let ws = null;

let monitoringStartTime, monitoringInterval, lastUpdateTime, timeDiff, totalMonitoringDuration, tempoAtencao, tempoMeditacao;

// Intervalo de atualização (em milissegundos)
const intervalo = 200; // 1 segundo


let device = null;
let server = null;
let characteristics = [];
let att = 0;
let med = 0;
const statusDiv = document.getElementById('status');
const uuidListDiv = document.getElementById('uuidList');
const dataOutputDiv = document.getElementById('dataOutput');
const charSelect = document.getElementById('charSelect');
const modal = document.getElementById('bluetoothModal');
const disconnectBtn = document.getElementById('disconnectBtn');
let selectedChar = null;

function swipeDetect(el, callback) {
    let touchstartX = 0;
    let touchstartY = 0;
    let touchendX = 0;
    let touchendY = 0;
    const minDistance = 50; // pixels mínimos para considerar swipe

    const handleGesture = () => {
        const diffX = touchendX - touchstartX;
        const diffY = touchendY - touchstartY;
        const absDiffX = Math.abs(diffX);
        const absDiffY = Math.abs(diffY);

        // Ignora se não atingiu a distância mínima
        if (absDiffX < minDistance && absDiffY < minDistance) return;

        let direction = '';
        let keyCode = null;
        let code = '';

        // Prioriza horizontal se o movimento for mais horizontal
        if (absDiffX > absDiffY) {
            if (diffX > 0) {
                direction = 'right';
                keyCode = 39;
                code = 'ArrowRight';
            } else {
                direction = 'left';
                keyCode = 37;
                code = 'ArrowLeft';
            }
        } else {
            if (diffY > 0) {
                direction = 'down';
                keyCode = 40;
                code = 'ArrowDown';
            } else {
                direction = 'up';
                keyCode = 38;
                code = 'ArrowUp';
            }
        }

        // Chama o callback com os dados
        if (typeof callback === 'function') {
            callback(keyCode, code, direction, { diffX, diffY });
        }
    };

    el.addEventListener('touchstart', e => {
        touchstartX = e.changedTouches[0].screenX;
        touchstartY = e.changedTouches[0].screenY;
    }, { passive: true });

    el.addEventListener('touchend', e => {
        touchendX = e.changedTouches[0].screenX;
        touchendY = e.changedTouches[0].screenY;
        handleGesture();
    }, { passive: true });

    // Suporte a mouse (útil em desktop para testar)
    el.addEventListener('mousedown', e => {
        touchstartX = e.screenX;
        touchstartY = e.screenY;
    });

    el.addEventListener('mouseup', e => {
        touchendX = e.screenX;
        touchendY = e.screenY;
        handleGesture();
    });
}


function toggleModal() {
	modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

function updateStatus(message) {
	statusDiv.textContent = `Status: ${message}`;
	console.log(message);
}

function appendData(data) {
	const timestamp = new Date().toLocaleTimeString();
	const dataLine = `[${timestamp}] ${data}\n`;
	dataOutputDiv.textContent += dataLine;
	dataOutputDiv.scrollTop = dataOutputDiv.scrollHeight;
}

function displayUuids(services) {
	let html = '<h3>Serviços Encontrados:</h3>';
	charSelect.innerHTML = '<option value="">-- Selecione --</option>';
	characteristics = [];
	services.forEach(async (service) => {
		html += `<p><strong>Serviço: ${service.uuid}</strong></p><ul>`;
		try {
			const chars = await service.getCharacteristics();
			console.log(`Chars no serviço ${service.uuid}:`, chars);
			if (chars.length === 0) {
				html += `<li>Sem chars. Tente outro serviço.</li>`;
			}
			chars.forEach((char) => {
				const props = getProperties(char.properties);
				html += `<li>Char: ${char.uuid} (Props: ${props})</li>`;				
				const charInfo = { char, service };
				characteristics.push(charInfo);
				if(service.uuid == '0000ffe0-0000-1000-8000-00805f9b34fb' && !selectedChar){
					selectedChar = characteristics[characteristics.length - 1];
					updateStatus(`Char selecionada: ${selectedChar.char.uuid}. Provável stream ThinkGear.`);
					sendStartCommand();
					setTimeout(() => {
						startStream();
					}, 1000);
				}
				const option = document.createElement('option');
				option.value = characteristics.length - 1;
				option.textContent = `${service.uuid.substring(0,8)}... > ${char.uuid.substring(0,8)}... (${props})`;
				charSelect.appendChild(option);
			});
		} catch (error) {
			html += `<li>Erro: ${error.message}</li>`;
		}
		html += '</ul>';
	});
	uuidListDiv.innerHTML = html;
	updateStatus(`Achados ${services.length} serviços. Escolha char com NOTIFY pra stream EEG (MindWave serial).`);
}

function getProperties(props) {
	const propMap = { 0x02: 'READ', 0x04: 'WRITE_NO_RESPONSE', 0x08: 'WRITE', 0x10: 'NOTIFY', 0x20: 'INDICATE', 0x01: 'BROADCAST' };
	return Object.keys(propMap).filter(key => (props & parseInt(key)) !== 0).map(key => propMap[key]).join(', ') || 'NENHUMA';
}

async function selectCharacteristic() {
	const index = parseInt(charSelect.value);
	if (index >= 0 && characteristics[index]) {
		selectedChar = characteristics[index];
		updateStatus(`Char selecionada: ${selectedChar.char.uuid}. Provável stream ThinkGear.`);
	}
}

async function readCharacteristic() {
	if (!selectedChar) return updateStatus('Selecione uma char!');
	try {
		if (selectedChar.char.properties.read) {
			const value = await selectedChar.char.readValue();
			const parsed = parseThinkGearPacket(value.buffer);
			appendData(parsed);
		} else {
			updateStatus('Char sem READ. Use stream ou WRITE pra trigger.');
		}
	} catch (error) {
		updateStatus(`Erro leitura: ${error.message}`);
	}
}

async function startStream() {	
	if (!selectedChar) return updateStatus('Selecione uma char!');
	try {
		if (selectedChar.char.properties.notify || selectedChar.char.properties.indicate) {
			await selectedChar.char.startNotifications();
			selectedChar.char.addEventListener('characteristicvaluechanged', handleThinkGearStream);
			updateStatus('Stream ThinkGear ativo! Foco pra attention, relax pra alpha waves.');
			//toggleModal();
			controleAtivo = true;
			iniciarFase();
		} else {
			updateStatus('Char sem NOTIFY. Tente serial port service (0x1101).');
		}
	} catch (error) {
		updateStatus(`Erro stream: ${error.message}. Pareie como serial antes.`);
	}
}

async function sendStartCommand() {
	if (!selectedChar) return updateStatus('Selecione uma char!');
	try {
		if (selectedChar.char.properties.write || selectedChar.char.properties.write_no_response) {
			const command = new Uint8Array([0x03]);
			await selectedChar.char.writeValue(command);
			updateStatus('Comando 0x03 enviado. Tente stream agora.');
		} else {
			updateStatus('Char sem WRITE. Escolha outra com WRITE.');
		}
	} catch (error) {
		updateStatus(`Erro ao enviar comando: ${error.message}`);
	}
}

function parseThinkGearPacket(buffer) {
	const view = new Uint8Array(buffer);
	console.log('Raw bytes:', Array.from(view).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', '));
	let output = '';
	let i = 0;
	while (i < view.length - 2) {
		if (view[i] !== 0xAA || view[i+1] !== 0xAA) {
			console.log(`Sync falhou no índice ${i}: ${view[i]}, ${view[i+1]}`);
			i++;
			continue;
		}
		const len = view[i+2];
		if (i + len + 4 > view.length) {
			console.log(`Pacote incompleto no índice ${i}, len: ${len}, buffer: ${view.length}`);
			output += 'Pacote incompleto | ';
			break;
		}
		const payloadStart = i + 3;
		const payloadEnd = i + 3 + len;
		const payload = view.slice(payloadStart, payloadEnd);
		const checksum = view[payloadEnd];
		let sum = 0;
		for (let j = 0; j < len; j++) sum += view[payloadStart + j];
		const calcChecksum = (~sum) & 0xFF;
		console.log(`Pacote: Sync=0xAA,0xAA, Len=${len}, Payload=[${Array.from(payload).map(b => '0x' + b.toString(16).padStart(2, '0')).join(',')}], Checksum=0x${checksum.toString(16)}, Calc=0x${calcChecksum.toString(16)}`);
		if (checksum === calcChecksum) {
			let j = 0;
			while (j < len) {
				const type = payload[j];
				j++;
				if (j >= len) break;
				switch (type) {
					case 0x02:
						output += `Poor Signal: ${payload[j]} | `;
						j++;
						break;
					case 0x04:
						output += `Attention: ${payload[j]} | `;
						att = payload[j];
						j++;
						break;
					case 0x05:
						output += `Meditation: ${payload[j]} | `;
						med = payload[j];
						j++;
						break;
					case 0x83:
						const bandLen = payload[j];
						j++;
						if (j + bandLen > len) {
							output += 'Bandas incompletas | ';
							break;
						}
						const bands = ['Delta', 'Theta', 'LowAlpha', 'HighAlpha', 'LowBeta', 'HighBeta', 'LowGamma', 'MidGamma'];
						let bandStr = 'Bandas: ';
						for (let k = 0; k < 8 && j + 2 < len; k++) {
							const value = (payload[j] | (payload[j+1] << 8) | (payload[j+2] << 16)) >>> 0;
							bandStr += `${bands[k]}: ${value} | `;
							j += 3;
						}
						output += bandStr;
						break;
					default:
						output += `Tipo 0x${type.toString(16)}: ${Array.from(payload.slice(j)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(',')} | `;
						j = len;
				}
			}
		} else {
			output += `Checksum inválido (esperado: ${calcChecksum}, recebido: ${checksum}) | `;
		}
		i += 3 + len + 1;
	}
	return output || 'Nenhum pacote válido encontrado';
}

function handleThinkGearStream(event) {
	const buffer = event.target.value.buffer;
	const parsed = parseThinkGearPacket(buffer);
	appendData(parsed);
}

async function connectAndDiscover() {
	if (!navigator.bluetooth) return updateStatus('Web Bluetooth não rola. Chrome/Edge HTTPS only.');
	try {
		updateStatus('Buscando dispositivos... Ative pairing no MindWave (LED piscando).');
		device = await navigator.bluetooth.requestDevice({
			filters: [                
                { services: ['0000ffe0-0000-1000-8000-00805f9b34fb'] } // Filtra por serviço
            ],
			optionalServices: [
				'00001101-0000-1000-8000-00805f9b34fb',
				'0000ffe0-0000-1000-8000-00805f9b34fb',
				'0000ffe1-0000-1000-8000-00805f9b34fb',
				'generic_access',
				'battery_service'
			]
		});
		updateStatus('Conectando...');
		server = await device.gatt.connect();
		updateStatus('Descobrindo serviços...');
		disconnectBtn.style.display = 'inline-block';
		const services = await server.getPrimaryServices();
		displayUuids(services);
		device.addEventListener('gattserverdisconnected', () => {
			updateStatus('Desconectado. Reconecte o MindWave.');
			disconnectBtn.style.display = 'none';
			resetVars();
		});
	} catch (error) {
		updateStatus(`Erro: ${error.message}. Pareie como serial no sistema primeiro.`);
		console.error(error);
	}
}

function resetVars() {
	device = null;
	server = null;
	selectedChar = null;
	characteristics = [];
}

async function disconnectBluetooth() {
	if (server) {
		await server.disconnect();
		resetVars();
		disconnectBtn.style.display = 'none';
		updateStatus('Desconectado');
	}
}



function novoAudio(audioElement) {
    if (audioElement instanceof HTMLAudioElement) {
        audiosDinamicos.push(audioElement);
        // Set initial volume for the new audio element
        if (volumeSlider) {
            audioElement.volume = volumeSlider.value / 100;
        } else {
            audioElement.volume = 1; // Default to full volume if slider not yet created
        }
    } else {
        console.warn("O elemento fornecido não é um elemento de áudio HTML válido.");
    }
}

function getPublicIPv4(callback) {
    fetch('https://api.ipify.org?format=json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na requisição: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            const ipv4 = data.ip;
            if (/^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ipv4)) {
                callback(ipv4, null);
            } else {
                callback(null, 'IPv4 inválido retornado');
            }
        })
        .catch(error => {
            callback(null, 'Erro ao obter IP público: ' + error.message);
        });
}


function initWebSocket(callback, ip) {    
  //ws = new WebSocket('ws://'+iplocal+':8080');
  var novoIP = 'ws://'+ip+':8080'
  ws = new WebSocket(novoIP);
	
  let conectado = false;
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const attentionValue = document.getElementById('attentionValue');
  const meditationValue = document.getElementById('meditationValue');

  ws.onopen = () => {
    statusIndicator.style.background = 'rgba(0,255,0,1)';
    statusText.innerText = 'Conectado';
    conectado = true;
    callback(true);
  };

  ws.onmessage = (event) => {
      dados = JSON.parse(event.data);	  
      attentionValue.innerText = att;
      meditationValue.innerText = med;
      if (tipoFeedback == 1) valorAtual = att;
      else valorAtual = med;
  };
 

  ws.onerror = () => {	
    /*statusIndicator.style.background = 'rgba(255,0,0,1)';
    statusText.innerText = 'Erro de Conexão';*/
    event.preventDefault();
  };

  ws.onclose = () => {
    /*statusIndicator.style.background = 'rgba(255,0,0,1)';
    statusText.innerText = 'Desconectado';*/
    conectado = false;
  };
}

function habilitarControles(){	
	//Controle HUD
	const mindchartHUD = document.getElementById('mindchartHUD');	
	mindchartHUD.style.display = 'block';
	
	//Controle Volume
	const volumeControl = document.getElementById('volumeControl');	
	volumeControl.style.display = 'block';
	
	if(tipoJogo == 2)verificarOpcao();
	
	tempoAtencao = 0;
	tempoMeditacao = 0;
	totalMonitoringDuration = 0;

	monitoringStartTime = Date.now();		

	monitoringInterval = setInterval(() => {
		const elapsedSeconds = Math.floor((Date.now() - monitoringStartTime) / 1000);
		// Certificar-se de que o tempo total de monitoramento é calculado antes de parar
		totalMonitoringDuration = elapsedSeconds;		
		lastUpdateTime = Date.now();
		registrarTempo();		
	}, 1000);
	
	habilitarPontuacao(false);
	
	console.log('Controles Habilitados');
}

function verificarOpcao() {  
  if (document.querySelector('input[name="opcao"]:checked').value === 'Foco') {
    tipoFeedback = 1;
  } else {
    tipoFeedback = 2;
  }

  valorMaximo = document.getElementById('maiorQue').value;  
  valorMinimo = document.getElementById('menorQue').value;
}

function carregarConfiguracoes(tipo,val)
{	
	tipoJogo = tipo;	
	createVolumeControl();
	createHUDControl();
	velocidadeMaxima = val;
	setVelocidade(0);	
}

function setVelocidade(val){
	velocidade = val;
}

function getVelocidade(){
	return velocidade;
}

function getVelocidadeMaxima(){
	return velocidadeMaxima;
}

function calcularPorcentagem(parte, total) {
    return (parte / total) * 100;
}

function habilitarPontuacao(valor){
	pontuacaoHabilitada = valor;	
}

function validarPontuacao(tipo){
	if(tipo == 1)
		return pontuacaoHabilitada;
	else(tipo == 2)
		if(totalMonitoringDuration >= 20) return true;
	return false;
}

function registrarPontuacao(jogo, tempo, tipo){
    clearInterval(monitoringInterval);
	
	const pontuacao = (tempoAtencao / totalMonitoringDuration) * 1000;
	const feedbackAtual = (tipoFeedback == 1) ? 'Atencao' : 'Meditacao'
    console.log('Jogo atual: '+jogo);
	console.log('Tipo Feedback: '+feedbackAtual);
    console.log('Tempo Total: '+formatTime(totalMonitoringDuration));
    console.log('Tempo Feedback Positivo: '+formatTime(tempoAtencao));
    console.log('Tempo Feedback Negativo: '+formatTime(tempoMeditacao));
	
	// Calcula porcentagens
	const porcentagemAtencao = calcularPorcentagem(tempoAtencao, totalMonitoringDuration);
	const porcentagemDesatencao = calcularPorcentagem(tempoMeditacao, totalMonitoringDuration);

	// Exibe resultados
	console.log(`% Feedback Positivo: ${Math.round(porcentagemAtencao)}%`);
	console.log(`% Feedback Negativo: ${Math.round(porcentagemDesatencao)}%`);	
    if(!validarPontuacao(tipo)) console.log('Pontuação não registrada');
	else console.log('Pontuação: '+Math.floor(pontuacao));
    
    // Salvar individualmente no localStorage
    localStorage.setItem('jogo', jogo);
	localStorage.setItem('referencia', feedbackAtual);   
	if(validarPontuacao(tipo)) localStorage.setItem('pontuacao', Math.floor(pontuacao)); 
	else localStorage.setItem('pontuacao', 0); 
    localStorage.setItem('tempoFeedbackPositivo', formatTime(tempoAtencao));
    localStorage.setItem('tempoFeedbackNegativo', formatTime(tempoMeditacao));
	localStorage.setItem('porcentagemFeedbackPositivo', Math.round(porcentagemAtencao));
    localStorage.setItem('porcentagemFeedbackNegativo', Math.round(porcentagemDesatencao));
	localStorage.setItem('tempoTotal', formatTime(totalMonitoringDuration));	    	

	
	
	//Exibe Pontuação
	
    
    console.log('Dados salvos no localStorage');
}
 
function update() {  
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const attentionValue = document.getElementById('attentionValue');
  const meditationValue = document.getElementById('meditationValue');
  
  if(controleAtivo){
	  attentionValue.innerText = att;
      meditationValue.innerText = med;
	  const statusText = document.getElementById('statusText');
	  statusText.textContent = 'Conectado';
	  // Exemplo: atualizar o statusIndicator
	  const statusIndicator = document.getElementById('statusIndicator');
	  statusIndicator.style.background = 'rgba(0,255,0,1)';
	  if (tipoFeedback == 1) valorAtual = att;
	  else valorAtual = med;
  }
  
 
}


// Função para iniciar a atualização periódica
function iniciarAtualizacao() {
  // Iniciar a atualização periódica
  setInterval(update, intervalo);
}

function createHUDControl(){
	if (document.getElementById('mindchartHUD')) return; 
	
	// Crie o elemento mindchartHUD
	const mindchartHUD = document.createElement('div');
	mindchartHUD.id = 'mindchartHUD';
	mindchartHUD.style.display = 'none';
	mindchartHUD.style.position = 'absolute';
	mindchartHUD.style.top = '20px';
	mindchartHUD.style.right = '20px';
	mindchartHUD.style.color = 'white';
	mindchartHUD.style.fontSize = '16px';
	mindchartHUD.style.zIndex = '100';
	mindchartHUD.style.background = 'rgba(0,0,0,0.7)';
	mindchartHUD.style.padding = '15px';
	mindchartHUD.style.borderRadius = '10px';
	mindchartHUD.style.minWidth = '200px';

	const mindchartValues = document.createElement('div');
	mindchartValues.id = 'mindchartValues';
	mindchartValues.className = 'mindchart-values';
	mindchartValues.style.fontFamily = 'monospace';
	mindchartValues.style.fontSize = '14px';
	
	// Crie o elemento mindchart-status
	const mindchartStatus = document.createElement('div');
	mindchartStatus.className = 'mindchart-status';
	mindchartStatus.style.display = 'flex';
	mindchartStatus.style.alignItems = 'center';
	mindchartStatus.style.marginBottom = '10px';

	// Crie o elemento status-indicator
	const statusIndicator = document.createElement('div');
	statusIndicator.className = 'status-indicator status-disconnected';
	statusIndicator.id = 'statusIndicator';
	statusIndicator.style.width = '12px';
	statusIndicator.style.height = '12px';
	statusIndicator.style.background = 'rgba(255,0,0,1)';
	statusIndicator.style.borderRadius = '50%';
	statusIndicator.style.marginRight = '8px';
	statusIndicator.style.animation = 'pulse 2s infinite';
	
	// Crie o elemento statusText
	const statusText = document.createElement('span');
	statusText.id = 'statusText';
	statusText.textContent = 'Desconectado';
	
	if(tipoJogo == 1){		

		// Adicione os elementos ao mindchartHUD
		mindchartStatus.appendChild(statusIndicator);
		mindchartStatus.appendChild(statusText);
		mindchartHUD.appendChild(mindchartStatus);	
		mindchartHUD.appendChild(mindchartValues);

		// Adicione o mindchartHUD ao body
		document.body.appendChild(mindchartHUD);
	}else if(tipoJogo == 2){
	
		// Crie os elementos
		/*const idPlayer = document.createElement('div');
		idPlayer.textContent = 'ID Player: ';
		const idValue = document.createElement('span');
		idValue.id = 'idValue';
		idValue.textContent = '0';
		idPlayer.appendChild(idValue);*/

		const atencao = document.createElement('div');
		atencao.textContent = 'Atenção: ';
		const attentionValue = document.createElement('span');
		attentionValue.id = 'attentionValue';
		attentionValue.textContent = '0%';
		atencao.appendChild(attentionValue);

		const meditacao = document.createElement('div');
		meditacao.textContent = 'Meditação: ';
		const meditationValue = document.createElement('span');
		meditationValue.id = 'meditationValue';
		meditationValue.textContent = '0%';
		
		meditacao.appendChild(meditationValue);
	
		//mindchartValues.appendChild(idPlayer);
		mindchartValues.appendChild(atencao);
		mindchartValues.appendChild(meditacao);
		
		mindchartStatus.appendChild(statusIndicator);
		mindchartStatus.appendChild(statusText);		
		
		mindchartHUD.appendChild(mindchartStatus);	
		mindchartHUD.appendChild(mindchartValues);
		
		
		document.body.appendChild(mindchartHUD);
	}
	
	//Adiciona controle de botões
	document.addEventListener('keydown', function(event) {		
		if (event.keyCode === 126){
			controleAtivo = true;
			feedbackPositivo = true;
			feedbackNegativo = false;
			const mindchartValues = document.getElementById('mindchartValues');
			mindchartValues.textContent = 'Feedback Positivo';					
		}
		if (event.keyCode === 127){
			controleAtivo = true;
			feedbackPositivo = false;
			feedbackNegativo = true;
			const mindchartValues = document.getElementById('mindchartValues');
			mindchartValues.textContent = 'Feedback Negativo';		
		}
	});
	
	iniciarAtualizacao();
}

function formatTime(seconds) {
	const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
	const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
	const s = String(seconds % 60).padStart(2, '0');
	return `${h}:${m}:${s}`;
}

function exibirTempos(){
	console.log('Tempo Total: '+formatTime(totalMonitoringDuration));
	console.log('Tempo Atenção: '+formatTime(tempoAtencao));
	console.log('Tempo Meditação: '+formatTime(tempoMeditacao));	
}

function getPositivo(){
	if(valorAtual > valorMaximo){
		feedbackPositivo = true;
		feedbackNegativo = false;
		return true;
	}
	else return false;
}

function getNegativo(){
	if(valorAtual < valorMinimo){
		feedbackPositivo = false;
		feedbackNegativo = true;
		return true;
	}
	else return false;
}

function registrarTempo(){		
	if (feedbackPositivo) {		
		tempoAtencao += 1;
	} else if (feedbackNegativo) {		
		tempoMeditacao += 1;
	}
}


function createVolumeControl() {		
	if (document.getElementById('volumeControl')) return;    
  
    // Create container for the button and slider
	volumeControlContainer = document.createElement('div');
	volumeControlContainer.id = 'volumeControl';
	volumeControlContainer.style.display = 'none';
	volumeControlContainer.style.position = 'fixed';
	volumeControlContainer.style.top = '140px';
	volumeControlContainer.style.left = '0px';
	volumeControlContainer.style.zIndex = '9999';
	volumeControlContainer.style.fontFamily = 'sans-serif';

	// Create volume button
	volumeButton = document.createElement('button');
	volumeButton.style.width = '100px';
	volumeButton.style.height = '100px';	
	volumeButton.style.padding = '8px 12px 8px 25px'; // adicionado padding-left para o ícone
	volumeButton.style.fontSize = '14px';
	volumeButton.style.backgroundImage = 'url(../assets/volume.svg)';
	volumeButton.style.backgroundRepeat = 'no-repeat';
	volumeButton.style.backgroundPosition = '25px 25px';
	volumeButton.style.backgroundSize = '56px 56px';
	volumeButton.style.backgroundColor = 'transparent';
	volumeButton.style.border = 'none';
	volumeButton.style.cursor = 'pointer';
	volumeButton.style.outline = 'none';	


    volumeButton.addEventListener('click', () => {
        if (volumeSlider) {
            volumeSlider.style.display = volumeSlider.style.display === 'none' ? 'block' : 'none';
        }
    });

    volumeSlider = document.createElement('input');
	volumeSlider.type = 'range';
	volumeSlider.min = '0';
	volumeSlider.max = '100';
	volumeSlider.value = '100'; // Default to full volume
	volumeSlider.style.width = '100px'; // Altura do slider
	volumeSlider.style.height = '20px'; // Largura do slider
	volumeSlider.style.display = 'none'; // Hidden by default
	volumeSlider.style.transform = 'rotate(-90deg)'; // Rotaciona o slider para vertical
	volumeSlider.style.transformOrigin = 'left top'; // Define o ponto de origem da rotação
	volumeSlider.style.position = 'absolute';
	volumeSlider.style.top = (volumeButton.offsetTop + volumeButton.offsetHeight + 190) + 'px';
	volumeSlider.style.left = (volumeButton.offsetLeft + 42) + 'px';

    volumeSlider.addEventListener('input', (event) => {
        const volume = event.target.value / 100;
        audiosDinamicos.forEach(audio => {
            audio.volume = volume;
        });
    });

    volumeControlContainer.appendChild(volumeButton);
    volumeControlContainer.appendChild(volumeSlider);
    document.body.appendChild(volumeControlContainer);
}

// Expose the function globally if needed for external use
window.novoAudio = novoAudio;


