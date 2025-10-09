// Variáveis globais do jogo
let scene, camera, renderer, clock;
let maze, player, passageiro, musica, objetivo;
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
let itens =  new THREE.Group();
let item;
let isColliding = false;
let totalItens = 0;

// Variável para a seta
let arrow;

const posChecks = [
{ x: 43, y: 8, z: 45 },
{ x: 134.51, y: 8, z: -80.10 },
{ x: 52.51, y: 8, z: -171 },
{ x: 172, y: 8, z: -79.49 },
{ x: 58.91, y: 8, z: -26.40 },
{ x: 222.11, y: 8, z: 45.00 },
{ x: -48.18, y: 8, z: -80.40 },
{ x: -163.69, y: 8, z: -38.40 },
{ x: -191.29, y: 8, z: -178.50 },
{ x: 174.11, y: 8, z: -79.79 },
//
{ x: -92.29, y: 8, z: -26.10 },
{ x: 126.71, y: 8, z: -178.49 },
{ x: 131.6, y: 8, z: 64.50 },
{ x: -101.29, y: 8, z: -177.89 },
{ x: 235.31, y: 8, z: -29.70 },
{ x: -229.69, y: 8, z: -177.90 },
{ x: 43, y: 8, z: 45 },
{ x: 134.51, y: 8, z: -80.10 },
{ x: 52.51, y: 8, z: -171 },
{ x: 172, y: 8, z: -79.49 }
];

const audiosDinamicos = [];
//camera
const cameraDistance = 52;  // Distância da câmera ao player
const cameraHeight = 50;    // Altura da câmera acima do player
const cameraSmoothing = 0.1; // Suavidade do movimento da câmera (0.1 = suave, 1.0 = instantâneo)
const velocidade = 0.6; // Velocidade do Trator

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

// Função para criar a seta
function createArrow() {
  // Criar geometria da seta usando ConeGeometry e CylinderGeometry
  const arrowGroup = new THREE.Group();
  
  // Corpo da seta (cilindro)
  const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
  const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xff4444 });
  const arrowBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
  arrowBody.position.y = 0;
  
  // Ponta da seta (cone)
  const headGeometry = new THREE.ConeGeometry(0.8, 2, 8);
  const headMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
  const arrowHead = new THREE.Mesh(headGeometry, headMaterial);
  arrowHead.position.y = 3;  
  
  // Adicionar sombras
  arrowBody.castShadow = true;
  arrowBody.receiveShadow = true;
  arrowHead.castShadow = true;
  arrowHead.receiveShadow = true;
  
  arrowGroup.add(arrowBody);
  arrowGroup.add(arrowHead);
  
  // Posicionar a seta acima do player
  arrowGroup.position.set(0, 15, 0);
  arrowGroup.rotation.x = Math.PI / 2;
  
  return arrowGroup;
}

// Função para atualizar a posição e rotação da seta
function updateArrow() {
  if (!arrow || !player || !objetivo || gameState !== 'playing' || !posChecks[checkAtual]) return;

  // Posicionar a seta acima do player
  arrow.position.copy(player.position);
  arrow.position.y += 5; // Altura da seta acima do player

  // Fazer a seta apontar para o objetivo
  //console.log(posChecks[checkAtual].x);
  const target = new THREE.Vector3(posChecks[checkAtual].x, 0, posChecks[checkAtual].z);
  arrow.lookAt(target);
  
  arrow.rotation.x = 95.4;
  arrow.rotation.y = 95.4;

  // Adicionar uma pequena animação de flutuação
  const time = Date.now() * 0.003;
  arrow.position.y = player.position.y + 15 + Math.sin(time); // Adicionar flutuação
}

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
  loader.load('assets/mapa2.gltf?2', function(gltf) {    
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
	maze.scale.set(0.4,0.4,0.4);
    scene.add(maze);    
  });

  // Carregar personagem
  loader.load('assets/taxi.gltf', function(gltf) {    
    player = gltf.scene;
    // Posicionar jogador
    player.position.set(-44.89, 8.2, -6.30);
    player.scale.set(1.6, 1.6, 1.6);
	player.rotation.y = 91.16;	
    // Configurar sombras para o personagem
    player.traverse(function(child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    // Configurar animações se existirem
    /*if (gltf.animations && gltf.animations.length > 0) {
      playerMixer = new THREE.AnimationMixer(player);
      gltf.animations.forEach(clip => {
        const action = player = playerMixer.clipAction(clip);
        action.play();
      });
    }*/
    scene.add(player);    
    
    // Criar e adicionar a seta após carregar o player
    arrow = createArrow();
    scene.add(arrow);
    
    // Posicionar câmera atrás do jogador
    updateCamera();
    // Iniciar jogo após carregar labirinto e personagem
    /*if (maze) {
      startGame();
    }*/
  });
  
  // Carregar personagem
  loader.load('assets/passageiro.gltf', function(gltf) {
	  passageiro = gltf.scene;
	  // Posicionar jogador
	  passageiro.position.set(player.position.x, player.position.y, player.position.z);
	  passageiro.scale.set(1.2, 1.2, 1.2);
	  passageiro.visible = false;
	  // Configurar sombras para o personagem
	  passageiro.traverse(function(child) {
		if (child.isMesh) {
		  child.castShadow = true;
		  child.receiveShadow = true;
		}
	  });
	  // Configurar animações se existirem
	  if (gltf.animations && gltf.animations.length > 0) {
		playerMixer = new THREE.AnimationMixer(passageiro);
		gltf.animations.forEach(clip => {
		  const action = playerMixer.clipAction(clip); // <--- Corrigido aqui
		  action.play();
		});
	  }
	  scene.add(passageiro);
	  updateCamera();
	});
  
  /*loader.load('assets/milho.gltf', function(gltf) {    
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
  });*/
  
  loader.load('assets/objetivo.gltf', function(gltf) {    
    objetivo = gltf.scene;
    // Posicionar jogador
    objetivo.position.set(0, 0, 0);
	//objetivo.position.set(10, 0, 0);
    objetivo.scale.set(2, 2, 2);
	//objetivo.visible = false;
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
    new THREE.Vector3(3, 0, 0), // direita
    new THREE.Vector3(-3, 0, 0), // esquerda
    new THREE.Vector3(0, 0, 3), // frente
    new THREE.Vector3(0, 0, -3), // trás
  ];
  
  const origin = newPosition.clone();  
  raycaster.set(origin, direction);
  
    var dir;
	switch(direcao){        
        case 0:
			dir = new THREE.Vector3(-1, 0, 0);       
			origin.x -= 3;
            break;
		case 1:
			dir = new THREE.Vector3(1, 0, 0);
            origin.x += 3;
            break;
		case 2:
			dir = new THREE.Vector3(0, 0, 1);
            origin.z += 3;
            break;
		case 3:
			dir = new THREE.Vector3(0, 0,-1);
            origin.z -= 3;
            break;
    }
	
  
  raycaster.set(origin, dir);
  const intersects = raycaster.intersectObjects(maze.children, true);
    // Se há interseção muito próxima, há colisão
  if (intersects.length > 0 && intersects[0].distance < 1) {
    //console.log('Colidiu');
    return true;
  }
  
  /*for (let dir of directions) {
	dir.applyQuaternion(player.quaternion);
    raycaster.set(origin, dir);
    const intersects = raycaster.intersectObjects(maze.children, true);
    // Se há interseção muito próxima, há colisão
    if (intersects.length > 0 && intersects[0].distance < 1) {
      console.log('Colidiu');
      return true;
    }/
  }*/
  
  
  /*itens.traverse((object) => {
	  if (object.isMesh&& object.visible) {
		const box = new THREE.Box3().setFromObject(object);		
		const box1 = new THREE.Box3().setFromObject(player);				
		box1.expandByScalar(-1);		
		
		if (box.intersectsBox(box1)) {		  
		  if(!isColliding && !gameEnded){
			  isColliding = true;
			  totalItens++;			  
			  object.visible = false;
			  const audioCheck = new Audio('assets/check.mp3');
			  audioCheck.play();
			  if(totalItens == itens.children.length)objetivo.visible = true;
			  setTimeout(() => {				 
				 isColliding = false;
				//updateTimerDisplay();
			  }, 200);
		  }
		  /*gameMap.position.x = -170;
		  gameMap.position.z = -3;
		  playerBalloon.position.set(12, 2, 0);
		}
	  }
	});*/
	
	
    const box = new THREE.Box3().setFromObject(objetivo);		
    const box1 = new THREE.Box3().setFromObject(player);	
	
	if (box.intersectsBox(box1)) {
		if(colidiu || gameEnded) return;
		colidiu = true;
		checkAtual++;
		if(checkAtual == posChecks.length && !gameEnded) return checkGameEnd();				
		else if(posChecks[checkAtual]){			
			objetivo.position.x = posChecks[checkAtual].x;
			objetivo.position.y = posChecks[checkAtual].y;
			objetivo.position.z = posChecks[checkAtual].z;		
			const audioCheck = new Audio('assets/check.mp3');
			audioCheck.play();
			passageiro.visible = false;
		}
		if(checkAtual % 2 === 0){		
			passageiro.visible = true;			
			passageiro.position.set(objetivo.position.x,passageiro.position.y,objetivo.position.z);
		}
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
  
  if(passageiro) passageiro.lookAt(player.position);
  
  
  // Movimento para frente
  if (acelerando) { 
	trator.play();
	let direction = new THREE.Vector3(0, 0, 0);
    switch(direcao){        
        case 0:
			direction = new THREE.Vector3(-velocidade, 0, 0);
            player.position.x -= 0.00002;
            break;
		case 1:
			direction = new THREE.Vector3(velocidade, 0, 0);
            player.position.x += 0.00002;
            break;
		case 2:
			direction = new THREE.Vector3(0, 0, velocidade);
            player.position.z += 0.00002;
            break;
		case 3:
			direction = new THREE.Vector3(0, 0,-velocidade);
            player.position.z -= 0.00002;
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
  else trator.pause();
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
  // Atualizar seta
  updateArrow();
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
  if(event.keyCode == 127){
	  acelerando = false;
	  trator.pause();
	  trator.currentTime = 0;
	  const audio = new Audio('assets/carrodesligando.mp3');	
	  audio.volume = 0.3;			
	  audio.play();
  }
  else keys[event.keyCode] = true;
}

function updateHUD() {
    if (player && checkAtual % 2 === 0) {
        document.getElementById('speed').textContent = (checkAtual/2)+'/'+posChecks.length/2;
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
    
	clearInterval(timerInterval);
	document.getElementById('finalTimeWin').textContent = document.getElementById('time').textContent;
	winScreen.style.display = 'flex';
    
}

function onKeyUp(event) {
  if(event.keyCode == 126 || event.keyCode == 127) return;
  if(event.keyCode == 32){ 
     acelerando = false; 
	 trator.pause();
	 trator.currentTime = 0;
	 const audio = new Audio('assets/carrodesligando.mp3');	
	 audio.volume = 0.3;			
	 audio.play();
  }
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

  checkAtual= 0;
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
  
  objetivo.position.x = posChecks[checkAtual].x;
  objetivo.position.y = 8;
  objetivo.position.z = posChecks[checkAtual].z;
  objetivo.visible = true;  
  
  passageiro.position.set(objetivo.position.x, 8.2, objetivo.position.z);
  passageiro.lookAt(player.position);
  passageiro.visible = true;
  
  
  // Mostrar a seta quando o jogo começar
  if (arrow) {
    arrow.visible = true;
  }
  
  pararAudios();    	
  musica = new Audio('assets/musicataxi.mp3');
  musica.loop = true; // Ativa o loop
  musica.volume = 0.2;
  musica.play(); // Inicia a reprodução da música	
  
  trator = new Audio('assets/carro.mp3');
  trator.loop = true; // Ativa o loop
  trator.volume = 0.6;
  trator.pause();
  
  audiosDinamicos.push(musica);
  
  menuScreen.style.display = 'none';
  gameHUD.style.display = 'block';
  instructions.style.display = 'block';
  gameState = 'playing';
  acelerando = false;
  gameEnded = false;
  player.position.set(-44.89, 8.2, -6.30);
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

	/*directionalLight.shadow.mapSize.width = 2048;
	directionalLight.shadow.mapSize.height = 2048;
	directionalLight.shadow.camera.near = 0.5;
	directionalLight.shadow.camera.far = 700;
	directionalLight.shadow.camera.left = -700;
	directionalLight.shadow.camera.right = 700;
	directionalLight.shadow.camera.top = 700;
	directionalLight.shadow.camera.bottom = -700;*/

	scene.add(directionalLight);

	// Luz de preenchimento - simula reflexos do ambiente
	const fillLight = new THREE.DirectionalLight(0x87CEEB, 1.3);
	fillLight.position.set(-15, 5, -15);
	scene.add(fillLight);
}

