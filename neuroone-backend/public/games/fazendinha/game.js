// ========== DEBUG LOGGER ==========
// Para ativar logs, execute no console: localStorage.setItem('DEBUG_MODE', 'true')
// Para desativar logs: localStorage.removeItem('DEBUG_MODE')
const DEBUG_MODE = localStorage.getItem('DEBUG_MODE') === 'true';
const debugLog = {
  log: (...args) => DEBUG_MODE && console.log(...args),
  info: (...args) => DEBUG_MODE && console.info(...args),
  warn: (...args) => console.warn(...args), // Warnings sempre aparecem
  error: (...args) => console.error(...args), // Errors sempre aparecem
  success: (...args) => DEBUG_MODE && console.log(...args),
};

// Variáveis globais do jogo
let scene, camera, renderer, clock;
let maze, player, musica, audioCheck, objetivo;
let playerMixer, objetivoMixer;
let keys = {};
let loadingManager;
let gameState = 'loading'; // loading, menu, playing, fase
let gameEnded = false;
let startTime; // Tempo de início do cronômetro
let elapsedTime = 0; // Tempo decorrido
let timerInterval; // Variável para armazenar o intervalo do cronômetro
let acelerando = false;
let colidiu = false;
let checkAtual = 0;
let direcao = 0;
let moveSpeed = 0.0010;
let itens =  new THREE.Group();
let item;
let isColliding = false;
let totalItens = 0;
let velocidadeTrator = 0;

// Socket.IO - Integração com backend
let socket = null;
let sessionId = null;
let studentId = null;
let studentName = null;
let lastEEGSendTime = 0;
const EEG_SEND_INTERVAL = 200; // Enviar dados EEG a cada 200ms (5 Hz - alinhado com server rate limit)

const posChecks = [
{ x: -29, y: 0, z: 12 },
{ x: -70, y: 0, z: 8 },
{ x: -71, y: 0, z: -92 },
{ x: 30, y: 0, z: -159 },
{ x: 162, y: 0, z: -92 },
{ x: 20, y: 0, z: -100 },
{ x: 88, y: 0, z: -57 },
{ x: 4, y: 0, z: 49 },
{ x: 4, y: 0, z: 125 },
{ x: 38, y: 0, z: 175 }
];

//camera
const cameraDistance = 32;  // Distância da câmera ao player
const cameraHeight = 30;    // Altura da câmera acima do player
const cameraSmoothing = 0.1; // Suavidade do movimento da câmera (0.1 = suave, 1.0 = instantâneo)

// Configurações do jogador
const PLAYER_SPEED = 6;
const ROTATION_SPEED = 2;
const CAMERA_HEIGHT = 140;
const CAMERA_DISTANCE = 6;
let rotationCamera = 0;
let idealOffset = 0;

// Elementos DOM
const loadingScreen = document.getElementById('loadingScreen');
const menuScreen = document.getElementById('menuScreen');
const gameCanvas = document.getElementById('gameCanvas');
const gameHUD = document.getElementById('gameHUD');
const instructions = document.getElementById('instructions');
const progressBar = document.getElementById('progressBar');
const loadingText = document.getElementById('loadingText');
const startButton = document.getElementById('startButton');
const winScreen = document.getElementById('winScreen');
const loseScreen = document.getElementById('loseScreen');
const playAgainWinButton = document.getElementById('playAgainWin');
const playAgainLoseButton = document.getElementById('playAgainLose');
const loadingBar = document.getElementById('loadingBar'); // Adicionei essa linha

// ========== SOCKET.IO - INTEGRAÇÃO COM BACKEND ==========

/**
 * Extrai parâmetros da URL
 */
function getURLParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    sessionId: params.get('sessionId'),
    studentId: params.get('studentId'),
    studentName: decodeURIComponent(params.get('studentName') || 'Aluno'),
    token: params.get('token'),
  };
}

/**
 * Inicializa conexão Socket.IO com o backend
 */
function initializeSocketIO() {
  debugLog.log('🎮 [GAME] Inicializando Socket.IO...');

  // Extrair parâmetros da URL
  const params = getURLParams();
  sessionId = params.sessionId;
  studentId = params.studentId;
  studentName = params.studentName;

  debugLog.log('📋 [GAME] Parâmetros da URL:', { sessionId, studentId, studentName });

  if (!sessionId || !studentId) {
    console.error('❌ [GAME] sessionId ou studentId não fornecidos na URL');
    console.error('   URL atual:', window.location.href);
    return;
  }

  // Obter token de autenticação: prioridade URL (cross-origin), fallback localStorage
  let authToken = params.token; // Tentar da URL primeiro
  let tokenSource = 'URL';

  if (!authToken) {
    // Fallback: tentar localStorage (mesma origem)
    authToken = localStorage.getItem('authToken');
    tokenSource = 'localStorage';
  }

  debugLog.log('🔑 [GAME] Token encontrado:', authToken ? `SIM (origem: ${tokenSource}, comprimento: ${authToken.length})` : 'NÃO');

  if (!authToken) {
    console.error('❌ [GAME] Token de autenticação não encontrado na URL nem no localStorage');
    console.error('   URL atual:', window.location.href);
    console.error('   localStorage.authToken:', localStorage.getItem('authToken'));
    return;
  }

  // Conectar ao backend
  const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : 'https://biosync-jlfh.onrender.com';

  debugLog.log('🔌 [GAME] Conectando ao backend:', API_URL);

  socket = io(API_URL, {
    auth: { token: authToken },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
  });

  // Eventos Socket.IO
  socket.on('connect', () => {
    debugLog.log('✅ [GAME] Socket.IO conectado!', socket.id);
    debugLog.log('📤 [GAME] Enviando student:join com:', { sessionId, studentId, studentName });

    // Entrar na sessão como estudante
    socket.emit('student:join', {
      sessionId: sessionId,
      studentId: studentId,
      studentName: studentName,
    });
  });

  socket.on('student:joined', (data) => {
    debugLog.log('✅ [GAME] Entrou na sessão:', data);
  });

  socket.on('disconnect', (reason) => {
    debugLog.log('🔌 [GAME] Socket.IO desconectado:', reason);
  });

  socket.on('error', (error) => {
    console.error('❌ [GAME] Erro Socket.IO:', error);
  });

  socket.on('eeg:received', (data) => {
    debugLog.log('📊 [GAME] Dados EEG recebidos pelo backend:', data.timestamp);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ [GAME] Erro de conexão Socket.IO:', error.message);
  });
}

/**
 * Envia dados EEG para o backend via Socket.IO
 * @param {number} attention - Nível de atenção (0-100)
 * @param {number} relaxation - Nível de relaxamento (0-100)
 */
function sendEEGData(attention, relaxation) {
  if (!socket || !socket.connected) {
    // Log apenas primeira vez para evitar spam
    if (!sendEEGData.loggedNotConnected) {
      console.warn('⚠️ [GAME] sendEEGData chamado mas socket não conectado');
      sendEEGData.loggedNotConnected = true;
    }
    return; // Socket não conectado
  }

  // Throttling: enviar apenas a cada 200ms (5 Hz - alinhado com server rate limit)
  const now = Date.now();
  if (now - lastEEGSendTime < EEG_SEND_INTERVAL) {
    return;
  }
  lastEEGSendTime = now;

  // Log periódico (a cada 5 segundos) para não sobrecarregar console
  if (!sendEEGData.lastLogTime || (now - sendEEGData.lastLogTime) > 5000) {
    debugLog.log('📊 [GAME] Enviando EEG:', { attention: Math.round(attention || 0), relaxation: Math.round(relaxation || 0) });
    sendEEGData.lastLogTime = now;
  }

  // Enviar dados
  socket.emit('eeg:data', {
    attention: Math.round(attention || 0),
    relaxation: Math.round(relaxation || 0),
    timestamp: new Date().toISOString(),
    signalQuality: 100, // Qualidade fixa por enquanto
  });
}

// ========== FIM SOCKET.IO ==========

// Inicialização do jogo
function init() {	
  
  musica = new Audio('assets/musicafazenda.mp3');
  musica.loop = true; // Ativa o loop
  musica.volume = 0.4;  
  
  novoAudio(musica);
  
  trator = new Audio('assets/trator2.mp3');
  trator.loop = true; // Ativa o loop
  trator.volume = 0.5;
  
  novoAudio(trator);  
  
  audioCheck = new Audio('assets/check.mp3');
  
  novoAudio(audioCheck);  
  
  // Detecta se o dispositivo é móvel
	var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

	// Atribui o valor dependendo do dispositivo
	var valor;
	if (isMobile) {
	  carregarConfiguracoes(2,0.4);
	  velocidadeTrator = 0.01;	  
	} else {
	  carregarConfiguracoes(2,0.05);
	  velocidadeTrator = 0.00004;	  
	}
  
  
  //console.log('Inicializando jogo...');
  // Configurar gerenciador de carregamento
  setupLoadingManager();
  // Configurar cena Three.JS
  setupScene();
  // Configurar controles
  setupControls();
  // Iniciar loop de renderização
  animate();
  
  
}

// Configurar gerenciador de carregamento
function setupLoadingManager() {
  loadingManager = new THREE.LoadingManager();
  loadingManager.onStart = function(url, itemsLoaded, itemsTotal) {    
    updateLoadingProgress(0);
  };
  loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
    const progress = (itemsLoaded / itemsTotal) * 100;    
    updateLoadingProgress(progress);
  };
  loadingManager.onLoad = function() {    
    setTimeout(() => {
      hideLoadingScreen();
      startGame();
    }, 1000);
  };
  loadingManager.onError = function(url) {    
    loadingText.textContent = 'Erro no carregamento!';
  };
}

// Atualizar barra de progresso
function updateLoadingProgress(progress) {
  loadingBar.style.width = progress + '%'; // Agora loadingBar está definido
  loadingText.textContent = `Carregando...`;
}
// ... (restante do código)



// Carregar modelos GLTF
function loadModels() {
  const loader = new THREE.GLTFLoader(loadingManager);
  // Carregar labirinto
  loader.load('assets/fazenda.gltf?2', function(gltf) {    
    maze = gltf.scene;
    // Configurar sombras para o labirinto
    maze.traverse(function(child) {
      if (child.isMesh) {
		  if (child.isMesh && child.name === 'Colisao') {
			child.castShadow = false;
			child.receiveShadow = true;
		  }else{
			child.castShadow = true;
			child.receiveShadow = true;
		  }
      }
    });
	maze.scale.set(1.2,1.2,1.2);
    scene.add(maze);    
  });

  // Carregar personagem
  loader.load('assets/trator.gltf', function(gltf) {    
    player = gltf.scene;
    // Posicionar jogador
    player.position.set(0, 0, 0);
    player.scale.set(3.2, 3.2, 3.2);
    // Configurar sombras para o personagem
    player.traverse(function(child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    // Configurar animações se existirem
    if (gltf.animations && gltf.animations.length > 0) {
      playerMixer = new THREE.AnimationMixer(player);
      gltf.animations.forEach(clip => {
        const action = player = playerMixer.clipAction(clip);
        action.play();
      });
    }
    scene.add(player);    
    // Posicionar câmera atrás do jogador
    updateCamera();
    // Iniciar jogo após carregar labirinto e personagem
    /*if (maze) {
      startGame();
    }*/
  });
  
  loader.load('assets/milho.gltf', function(gltf) {    
    const distanciaZ=2.42;
	const distanciaX=2.82;
	for(var j=0; j<8; j++)
		for(var i=0; i<6; i++){
			//console.log(i);
			item = gltf.scene.clone();
			item.scale.set(1, 1, 1);				
			item.position.set(-21.10-(distanciaX*i), 3, -41.8+(distanciaZ*j));			
			// Configurar sombras
			item.traverse(function(child) {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});	
			itens.add(item);			
		}			
  });
  
  loader.load('assets/cenoura.gltf', function(gltf) {    
    const distanciaZ=2.42;
	const distanciaX=2.82;
	for(var j=0; j<8; j++)
		for(var i=0; i<6; i++){
			//console.log(i);
			item = gltf.scene.clone();
			item.scale.set(1, 1, 1);				
			item.position.set(-21.10-(distanciaX*i), 2.7, 1.2+(distanciaZ*j));			
			// Configurar sombras
			item.traverse(function(child) {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});	
			itens.add(item);			
		}			
  });
  
  loader.load('assets/couve.gltf', function(gltf) {    
    const distanciaZ=2.42;
	const distanciaX=2.82;
	for(var j=0; j<8; j++)
		for(var i=0; i<6; i++){
			//console.log(i);
			item = gltf.scene.clone();
			item.scale.set(1, 1, 1);				
			item.position.set(-49.10-(distanciaX*i), 2.7, 1.2+(distanciaZ*j));			
			// Configurar sombras
			item.traverse(function(child) {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});	
			itens.add(item);			
		}		
			
	//console.log(itens.children.length);
    scene.add(itens);
  });
  
  loader.load('assets/objetivo.gltf', function(gltf) {    
    objetivo = gltf.scene;
    // Posicionar jogador
    objetivo.position.set(0, 0, 0);
	//objetivo.position.set(10, 0, 0);
    objetivo.scale.set(2, 2, 2);
	objetivo.visible = false;
    // Configurar sombras para o personagem
    objetivo.traverse(function(child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    // Configurar animações se existirem
    if (gltf.animations && gltf.animations.length > 0) {
      objetivoMixer = new THREE.AnimationMixer(objetivo);
      gltf.animations.forEach(clip => {
        const action = objetivoMixer.clipAction(clip);
        action.play();
      });
    }
    scene.add(objetivo);    
    // Posicionar câmera atrás do jogador
    updateCamera();    
  });
}

// Iniciar jogo
function startGame() {
  menuScreen.style.display = 'none';
  gameCanvas.style.display = 'block';
  /*gameHUD.style.display = 'block';
  instructions.style.display = 'block';*/
  gameState = 'menu';
}

// Atualizar posição da câmera
function updateCamera() {
  // Verificar se maze foi carregado antes de acessar position
  if (!maze) return;

  //if (!player) return;
  // Posicionar câmera atrás do jogador
  if(gameState === 'playing'){
  // Configurações da câmera de terceira pessoa	
	
	// Aplicar a rotação do player ao offset da câmera
	//idealOffset.applyQuaternion(player.quaternion);
	
	// Posição final da câmera
	const idealPosition = new THREE.Vector3().addVectors(player.position, idealOffset);
	
	// Ponto para onde a câmera deve olhar (ligeiramente acima do player)
	const lookAtTarget = new THREE.Vector3(
		player.position.x,
		player.position.y + 1,
		player.position.z
	);
	
	// Suavizar o movimento da câmera
	camera.position.lerp(idealPosition, cameraSmoothing);
	
	// Fazer a câmera olhar para o player
	camera.lookAt(lookAtTarget);
  }else if(gameState === 'menu'){	  
		
	  const offset = new THREE.Vector3(-40, 10, -30);
	  rotationCamera+= 0.02;;
	  const target = new THREE.Vector3((maze.position.x-60)+rotationCamera, 15+rotationCamera, (maze.position.z)+rotationCamera);
	  //Alturaideal : 40
		// Posição da câmera baseada na posição do balão + offset rotacionado
	  const targetPosition = new THREE.Vector3().addVectors(target, offset)
	  // Suavizar o movimento da câmera
	  camera.position.lerp(targetPosition, 0.1);

		// Fazer a câmera olhar para o player
	  camera.lookAt(maze.position);
  }
}

// Verificar colisão
function checkCollision(newPosition) {
  if (!maze) return false;
  // Criar raycaster para detectar colisões
  const raycaster = new THREE.Raycaster();
  const direction = new THREE.Vector3();
  // Verificar colisão em múltiplas direções ao redor do jogador
  const directions = [
    new THREE.Vector3(1, 0, 0), // direita
    new THREE.Vector3(-1, 0, 0), // esquerda
    new THREE.Vector3(0, 0, 1), // frente
    new THREE.Vector3(0, 0, -1), // trás
  ];
  for (let dir of directions) {
    raycaster.set(newPosition, dir);
    const intersects = raycaster.intersectObjects(maze.children, true);
    // Se há interseção muito próxima, há colisão
    if (intersects.length > 0 && intersects[0].distance < 0.5) {
      return true;
    }
  }
  
  
  itens.traverse((object) => {
	  if (object.isMesh&& object.visible) {
		const box = new THREE.Box3().setFromObject(object);		
		const box1 = new THREE.Box3().setFromObject(player);				
		box1.expandByScalar(-1);		
		
		
		if(totalItens >= 58) habilitarPontuacao(true);
		
		if (box.intersectsBox(box1)) {		  
		  if(!isColliding && !gameEnded){
			  isColliding = true;
			  totalItens++;			  
			  object.visible = false;			  
			  audioCheck.play();
			  if(totalItens == itens.children.length)objetivo.visible = true;
			  setTimeout(() => {				 
				 isColliding = false;
				//updateTimerDisplay();
			  }, 200);
		  }
		  /*gameMap.position.x = -170;
		  gameMap.position.z = -3;
		  playerBalloon.position.set(12, 2, 0);*/
		}
	  }
	});
	
	if(totalItens >= 42){	
		const box = new THREE.Box3().setFromObject(objetivo);		
		const box2 = new THREE.Box3().setFromObject(player);				
		  //box1.expandByScalar(-1);		

		if (box.intersectsBox(box2)) {
		  if(gameEnded) return;
		  trator.pause();
		  checkGameEnd();			  
		}
	}


 

  return false;
}

// Atualizar movimento do jogador
function updatePlayer(deltaTime) {
  if (!player || gameState !== 'playing' || gameEnded) return;
  
  if(gameState === 'playing'){
	if (getPositivo())acelerando = true;
	else if(getNegativo()) acelerando = false;
  }
  
  const newPosition = player.position.clone();
  
  let moved = false;  
  // Rotação
  if (keys[37]) {
	direcao = 3;
	//player.rotation.y += 0.01;	
	player.rotation.y = 91.16;	    
    moved = true;
  }
  if (keys[38]) {
	direcao = 1;
    //player.rotation.y += ROTATION_SPEED * deltaTime;
    moved = true;
	player.rotation.y = 95.82;
  }
  if (keys[39]) {
	player.rotation.y = 94.23;
	direcao = 2;
    //player.rotation.y -= ROTATION_SPEED * deltaTime;
    moved = true;
  }  
  if (keys[40]) {
	player.rotation.y = 92.68;  
	direcao = 0;
    //player.rotation.y += ROTATION_SPEED * deltaTime;
    moved = true;
  }

  
  // Movimento para frente
  if (acelerando) { 
	trator.play();
	moveSpeed += (moveSpeed < getVelocidadeMaxima()) ? 0.01 : 0;
	setVelocidade(moveSpeed);
	debugLog.log(moveSpeed);
	let direction = new THREE.Vector3(0, 0, 0);
    switch(direcao){        
        case 0:
			direction = new THREE.Vector3(-getVelocidade(), 0, 0);
            player.position.x -= velocidadeTrator;
            break;
		case 1:
			direction = new THREE.Vector3(getVelocidade(), 0, 0);
            player.position.x += velocidadeTrator;
            break;
		case 2:
			direction = new THREE.Vector3(0, 0, getVelocidade());
            player.position.z += velocidadeTrator;
            break;
		case 3:
			direction = new THREE.Vector3(0, 0,-getVelocidade());
            player.position.z -= velocidadeTrator;
            break;
    }
	//console.log(player.position.x+' - '+player.position.y+' - '+player.position.z);
	
    newPosition.add(direction);
	
    // Verificar colisão antes de mover
    if (!checkCollision(newPosition)) {
      player.position.copy(newPosition);
      moved = true;
    }
  }
  else if(gameState === 'fase'){
	  trator.pause();
	  moveSpeed += (moveSpeed > 0) ? -0.01 : 0;
	  setVelocidade(moveSpeed);
  }
  // Atualizar câmera se houve movimento
  if (moved) {
    updateCamera();
  }
  // Atualizar animações
  if (playerMixer) {
    playerMixer.update(deltaTime);
  }
  if (objetivoMixer) {
    objetivoMixer.update(deltaTime);
  }
  updateHUD();
}

function pararAudios() {  
  for (const audio of audiosDinamicos) {
    audio.pause();
    audio.currentTime = 0;
  }
}

// Redimensionar janela
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Loop principal de animação
function animate() {
  //if(gameState === 'playing')console.log(player.position);  
  const deltaTime = clock.getDelta();
  // Atualizar jogador
  updatePlayer(deltaTime);
   // Atualizar câmera
  updateCamera();
  // Renderizar cena
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  init();
  loadModels();

  // Inicializar Socket.IO para enviar dados EEG em tempo real
  initializeSocketIO();
});

// Eventos de teclado
function onKeyDown(event) {  
  if(event.keyCode == 126) acelerando = true;
  if(event.keyCode == 127) acelerando = false;
  else keys[event.keyCode] = true;
  
  let moved = false;  
  // Rotação
  if (keys[37]) {
	direcao = 3;
	//player.rotation.y += 0.01;	
	player.rotation.y = 91.16;	    
    moved = true;
  }
  if (keys[38]) {
	direcao = 1;
    //player.rotation.y += ROTATION_SPEED * deltaTime;
    moved = true;
	player.rotation.y = 95.82;
  }
  if (keys[39]) {
	player.rotation.y = 94.23;
	direcao = 2;
    //player.rotation.y -= ROTATION_SPEED * deltaTime;
    moved = true;
  }  
  if (keys[40]) {
	player.rotation.y = 92.68;  
	direcao = 0;
    //player.rotation.y += ROTATION_SPEED * deltaTime;
    moved = true;
  }
}

function updateHUD() {
    if (player) {
        document.getElementById('speed').textContent = totalItens+'/'+itens.children.length;
        //document.getElementById('altitude').textContent = Math.round(player.position.y * 100);
    }
}

function restartGame() {
    // Esconder telas de fim de jogo
    winScreen.style.display = 'none';
    loseScreen.style.display = 'none';
    
    // Resetar variáveis do jogo	   
    clearInterval(timerInterval);
    elapsedTime = 0;
    updateTimerDisplay();
	
	iniciarFase();
}

function checkGameEnd() {
    gameEnded = true;
    
	registrarPontuacao('fazendinha', Math.floor((elapsedTime % 60000) / 1000), 1);
	
	clearInterval(timerInterval);
	document.getElementById('finalTimeWin').textContent = document.getElementById('time').textContent;
	winScreen.style.display = 'flex';
    
}

function onKeyUp(event) {
  if(event.keyCode == 126 || event.keyCode == 127) return;  
  keys[event.keyCode] = false;
}

// Configurar controles
function setupControls() {
	   
  
  startButton.addEventListener('click', () => {	 
	  connectAndDiscover();  
	});
  playAgainWinButton.addEventListener('click', restartGame);
  playAgainLoseButton.addEventListener('click', restartGame);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', () => {
	  acelerando = false;
  });
}

function conectarServidor(loading, divText, spinner){	
	toggleModal();
}

function updateTimerDisplay() {
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);	
    document.getElementById('time').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function iniciarFase(){	

	swipeDetect(document.body, (keyCode, code, direction, data) => {
		console.log(`Swipe ${direction.toUpperCase()} detectado!`);
		console.log('keyCode:', keyCode);
		console.log('code:', code);
		console.log('diffX:', data.diffX, 'diffY:', data.diffY);

		// Simula o pressionamento da tecla (funciona em jogos, inputs, etc.)
		// Simula o pressionamento da tecla (keydown)
		const keydownEvent = new KeyboardEvent('keydown', {
			key: code.replace('Arrow', ''),
			code: code,
			keyCode: keyCode,
			which: keyCode,
			bubbles: true,
			cancelable: true			
		});
		document.dispatchEvent(keydownEvent);

		// Simula a soltura da tecla (keyup) imediatamente após
		const keyupEvent = new KeyboardEvent('keyup', {
			key: code.replace('Arrow', ''),
			code: code,
			keyCode: keyCode,
			which: keyCode,
			bubbles: true,
			cancelable: true
		});
		document.dispatchEvent(keyupEvent);	

	   
  });


  habilitarControles();
  setVelocidade(0.085);

  startTime = Date.now();
  timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        updateTimerDisplay();
  }, 1000);
  
  //Habilitar visualização dos itens
  itens.traverse((object) => {	  
	object.visible = true;
  });
  
  colidiu = false;  
  totalItens = 0;  
  
  objetivo.position.set(-10, 2.5, -10.4);  
  objetivo.visible = false;
  
  pararAudios();    	
 
  musica.play(); // Inicia a reprodução da música	
  
  menuScreen.style.display = 'none';
  gameHUD.style.display = 'block';
  instructions.style.display = 'block';
  gameState = 'playing';
  acelerando = false;
  gameEnded = false;
  player.position.set(-20, 2.5, -12);
  player.rotation.y = 89.55;    
  // Calcular posição ideal da câmera atrás do player
  // Aplicar a rotação do player ao offset da câmera
  // Calcular posição ideal da câmera atrás do player
  idealOffset = new THREE.Vector3(0, cameraHeight, -cameraDistance);
	
  // Aplicar a rotação do player ao offset da câmera
  idealOffset.applyQuaternion(player.quaternion);
  direcao = 3;
  //player.rotation.y += 0.01;
  //console.log(player.rotation.y);
  player.rotation.y = 91.16;	
}

// Ocultar tela de carregamento
function hideLoadingScreen() {
  loadingScreen.style.opacity = '0';
  loadingScreen.style.transition = 'opacity 0.5s ease';
  loadingText.textContent = 'Carregamento concluído!';
  setTimeout(() => {
    loadingScreen.style.display = 'none';
	menuScreen.style.display = 'flex';
  }, 300);
}

// Configurar cena Three.JS
function setupScene() {
  // Criar cena
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB); // Cor azul céu
  // Configurar câmera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  // Configurar renderizador
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('gameCanvas'),
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Configurar iluminação
  setupLighting();
  // Clock para animações
  clock = new THREE.Clock();
  // Redimensionamento da janela
  window.addEventListener('resize', onWindowResize);
}

// Configurar iluminação
function setupLighting() {
	const ambientLight = new THREE.AmbientLight(0x404040, 3.0);
	scene.add(ambientLight);

	// Luz direcional principal - simula o sol
	const directionalLight = new THREE.DirectionalLight(0xffffff, 3.0);
	directionalLight.position.set(10, 10, 5);	;
	directionalLight.castShadow = true;

	directionalLight.shadow.mapSize.width = 4096;
	directionalLight.shadow.mapSize.height = 4096;
	directionalLight.shadow.camera.near = 0.5;
	directionalLight.shadow.camera.far = 200;
	directionalLight.shadow.camera.left = -100;
	directionalLight.shadow.camera.right = 100;
	directionalLight.shadow.camera.top = 100;
	directionalLight.shadow.camera.bottom = -100;

	scene.add(directionalLight);

	// Luz de preenchimento - simula reflexos do ambiente
	const fillLight = new THREE.DirectionalLight(0x87CEEB, 1.3);
	fillLight.position.set(-15, 5, -15);
	scene.add(fillLight);
}