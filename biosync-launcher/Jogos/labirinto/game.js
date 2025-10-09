// Variáveis globais do jogo
let scene, camera, renderer, clock;
let maze, player, musica, objetivo;
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

const audiosDinamicos = [];

// Configurações do jogador
const PLAYER_SPEED = 6;
const ROTATION_SPEED = 2;
const CAMERA_HEIGHT = 140;
const CAMERA_DISTANCE = 6;
let rotationCamera = 0;

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

// Inicialização do jogo
function init() {
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
  loader.load('assets/labirinto.gltf?2', function(gltf) {    
    maze = gltf.scene;
    // Configurar sombras para o labirinto
    maze.traverse(function(child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(maze);    
  });

  // Carregar personagem
  loader.load('assets/personagem.gltf', function(gltf) {    
    player = gltf.scene;
    // Posicionar jogador
    player.position.set(0, 0, 0);
    player.scale.set(2, 2, 2);
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
  
  loader.load('assets/objetivo.gltf', function(gltf) {    
    objetivo = gltf.scene;
    // Posicionar jogador
    objetivo.position.set(38, 0, 175);
	//objetivo.position.set(10, 0, 0);
    objetivo.scale.set(2, 2, 2);
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
  //if (!player) return;
  // Posicionar câmera atrás do jogador
  if(gameState === 'playing'){
	  const playerPosition = player.position.clone();
	  const playerRotation = player.rotation.y;
	  // Calcular posição da câmera
	  /*const cameraOffset = new THREE.Vector3(
		Math.sin(playerRotation) * CAMERA_DISTANCE,
		CAMERA_HEIGHT,
		Math.cos(playerRotation) * CAMERA_DISTANCE
	  );*/
	  //camera.rotation.y = 5;
	  const cameraOffset = new THREE.Vector3(10, CAMERA_HEIGHT, 2-(CAMERA_DISTANCE/3));
	  camera.position.copy(playerPosition.add(cameraOffset));
	  camera.lookAt(player.position);
  }else if(gameState === 'menu'){	  
		
	  const offset = new THREE.Vector3(0, 10, 5);
	  rotationCamera+= 0.02;;
	  const target = new THREE.Vector3((maze.position.x+8)+rotationCamera, 250+rotationCamera, (maze.position.z-5)+rotationCamera);
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
  
  
  const box = new THREE.Box3().setFromObject(objetivo);		
  const box1 = new THREE.Box3().setFromObject(player);				
  //box1.expandByScalar(-1);		

  if (box.intersectsBox(box1)) {
	if(colidiu) return;
	colidiu = true;
	if(checkAtual == 9 && !gameEnded)checkGameEnd();
	checkAtual++;
	objetivo.position.x = posChecks[checkAtual].x;
	objetivo.position.y = posChecks[checkAtual].y;
	objetivo.position.z = posChecks[checkAtual].z;
    setTimeout(() => {
		colidiu = false;
	}, 1000);	
      
  }
 

  return false;
}

// Atualizar movimento do jogador
function updatePlayer(deltaTime) {
  if (!player || gameState !== 'playing' || gameEnded) return;
  let moved = false;
  const newPosition = player.position.clone();
  // Rotação
  if (keys[37]) {
	direcao = 2;
    //player.rotation.y += ROTATION_SPEED * deltaTime;
    moved = true;
  }
  if (keys[38]) {
	direcao = 0;
    //player.rotation.y += ROTATION_SPEED * deltaTime;
    moved = true;
  }
  if (keys[39]) {
	direcao = 3;
    //player.rotation.y -= ROTATION_SPEED * deltaTime;
    moved = true;
  }  
  if (keys[40]) {
	direcao = 1;
    //player.rotation.y += ROTATION_SPEED * deltaTime;
    moved = true;
  }

  
  // Movimento para frente
  if (acelerando) { 
	let direction = new THREE.Vector3(0, 0, 0);
    switch(direcao){        
        case 0:
			direction = new THREE.Vector3(-0.25, 0, 0);
            player.position.x -= 0.00002;
            break;
		case 1:
			direction = new THREE.Vector3(0.25, 0, 0);
            player.position.x += 0.00002;
            break;
		case 2:
			direction = new THREE.Vector3(0, 0, 0.25);
            player.position.z += 0.00002;
            break;
		case 3:
			direction = new THREE.Vector3(0, 0,-0.25);
            player.position.z -= 0.00002;
            break;
    }
	
	//console.log(direcao);
	
    newPosition.add(direction);
	
    // Verificar colisão antes de mover
    if (!checkCollision(newPosition)) {
      player.position.copy(newPosition);
      moved = true;
    }
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
  requestAnimationFrame(animate);
  const deltaTime = clock.getDelta();
  // Atualizar jogador
  updatePlayer(deltaTime);
   // Atualizar câmera
  updateCamera();
  // Renderizar cena
  renderer.render(scene, camera);
  
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  init();
  loadModels();
});

// Eventos de teclado
function onKeyDown(event) {
  if(event.keyCode == 32 || event.keyCode == 126) acelerando = true;
  if(event.keyCode == 127) acelerando = false;
  else  keys[event.keyCode] = true;
}

function updateHUD() {
    /*if (player) {
        document.getElementById('speed').textContent = (moveSpeed*100).toFixed(3);
        document.getElementById('altitude').textContent = Math.round(playerBalloon.position.y * 100);
    }*/
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
    
	clearInterval(timerInterval);
	document.getElementById('finalTimeWin').textContent = document.getElementById('time').textContent;
	winScreen.style.display = 'flex';
    
}

function onKeyUp(event) {
  if(event.keyCode == 126 || event.keyCode == 127) return;
  if(event.keyCode == 32) acelerando = false; 
  keys[event.keyCode] = false;
}

// Configurar controles
function setupControls() {
  startButton.addEventListener('click', iniciarFase);
  playAgainWinButton.addEventListener('click', restartGame);
  playAgainLoseButton.addEventListener('click', restartGame);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', () => {
	  acelerando = false;
  });
}

function updateTimerDisplay() {
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);	
    document.getElementById('time').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function iniciarFase(){	
  startTime = Date.now();
  timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        updateTimerDisplay();
  }, 1000);
  
  colidiu = false;  
  checkAtual = 0;
  direcao = 0;
  
  objetivo.position.x = posChecks[checkAtual].x;
  objetivo.position.y = posChecks[checkAtual].y;
  objetivo.position.z = posChecks[checkAtual].z;
  
  pararAudios();    	
  musica = new Audio('assets/musicalabirinto.mp3');
  musica.loop = true; // Ativa o loop
  musica.volume = 0.5;
  musica.play(); // Inicia a reprodução da música	
  
  audiosDinamicos.push(musica);
  
  
  
  menuScreen.style.display = 'none';
  gameHUD.style.display = 'block';
  instructions.style.display = 'block';
  gameState = 'playing';
  acelerando = false;
  gameEnded = false;
  player.position.set(0, 0, 0);
  player.rotation.y = 89.55;
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
  // Luz ambiente
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambientLight);
  // Luz direcional (sol)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -20;
  directionalLight.shadow.camera.right = 20;
  directionalLight.shadow.camera.top = 20;
  directionalLight.shadow.camera.bottom = -20;
  scene.add(directionalLight);
}