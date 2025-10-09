// Variáveis globais do jogo
let scene, camera, renderer, loader;
let playerBalloon, chegada, pedra, musica, opponentBalloons = [];
let gameMap;
let mixer, mixer2, mixers = [];
let clock = new THREE.Clock();
let gameState = 'loading'; // loading, menu, playing, fase
let alturaInicial = 2;
let isColliding = false;
let subindo, direita, esquerda = null;
let collisionTimeout = null;
let camPos = [10,10,10];
let velocidadeOponente = [0.001,0.0001,0.00001,0.00007,0.000004,0.000001];
let moveSpeed = 0.0010;
let rotationCamera = 0.01;
let gameEnded = false; // Controle para evitar múltiplas verificações de fim de jogo
let pedras =  new THREE.Group();
let runAction, jumpAction, idleAction, preparingAction;
let colidiu, pulando = false;
let alto, baixo = false;


const ALTURA_BASE = 10;
const FORÇA_PULO = 0.17;


//Variaveis Comando
let ultimoIndiceComando = null;
let objetivoAtual = null;
let comandoAtual = null;

const audiosDinamicos = [];

// Controles
let keys = {
    up: false,
    down: false
};

// Assets para carregar
const assetsToLoad = [
    { name: 'map', url: 'assets/mapa2.gltf' },
    { name: 'player', url: 'assets/personagem2.gltf?3' }
	/*{ name: 'chegada', url: 'assets/tesouro.gltf' },
	{ name: 'pedra', url: 'assets/pedra.gltf' }
    /*{ name: 'opponent1', url: 'assets/balao2.gltf' },
    { name: 'opponent2', url: 'assets/balao3.gltf' },
	{ name: 'opponent3', url: 'assets/balao4.gltf' },
    { name: 'opponent4', url: 'assets/balao5.gltf' },
	{ name: 'opponent5', url: 'assets/balao6.gltf' }*/
];

let loadedAssets = {};
let loadProgress = 0;

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

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initThreeJS();
    loadAssets();
    setupEventListeners();
});

function initThreeJS() {
    // Criar cena
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87CEEB, 20, 120);
	scene.background = new THREE.Color('#064bed');

    // Criar câmera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Criar renderer
    renderer = new THREE.WebGLRenderer({ 
        canvas: gameCanvas,
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x87CEEB);

    // Criar loader GLTF
    loader = new THREE.GLTFLoader();

    // Adicionar luzes
    setupLighting();
}

function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 2.0);
	scene.add(ambientLight);
	
	// Luz direcional principal - simula o sol
	const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
	directionalLight.position.set(10, 10, 5);
	directionalLight.castShadow = true;
	
	// Configurar sombras
	directionalLight.shadow.mapSize.width = 2048;
	directionalLight.shadow.mapSize.height = 2048;
	directionalLight.shadow.camera.near = 0.5;
	directionalLight.shadow.camera.far = 50;
	directionalLight.shadow.camera.left = -100;
	directionalLight.shadow.camera.right = 100;
	directionalLight.shadow.camera.top = 100;
	directionalLight.shadow.camera.bottom = -100;
	
	scene.add(directionalLight);
	
	// Luz de preenchimento - simula reflexos do ambiente
	const fillLight = new THREE.DirectionalLight(0x87CEEB, 1.3);
	fillLight.position.set(-5, 5, -5);
	scene.add(fillLight);
}

function loadAssets() {
    let loadedCount = 0;
    const totalAssets = assetsToLoad.length;

    assetsToLoad.forEach((asset, index) => {
        loader.load(
            asset.url,
            function(gltf) {
                loadedAssets[asset.name] = gltf;
                loadedCount++;
                
                updateLoadingProgress(loadedCount, totalAssets);
                
                if (loadedCount === totalAssets) {
                    setTimeout(() => {
                        finishLoading();						
                    }, 500);
                }
            },
            function(progress) {
                // Progresso individual do asset
                const assetProgress = (progress.loaded / progress.total) * 100;
                const totalProgress = ((loadedCount + (assetProgress / 100)) / totalAssets) * 100;
                updateLoadingProgress(totalProgress / 100 * totalAssets, totalAssets);
            },
            function(error) {
                console.error('Erro ao carregar asset:', asset.name, error);
                loadingText.textContent = `Erro ao carregar ${asset.name}`;
            }
        );
    });
}

function updateLoadingProgress(loaded, total) {
    const percentage = (loaded / total) * 100;
    progressBar.style.width = percentage + '%';
    loadingText.textContent = `Carregando...`;
}

function finishLoading() {
    loadingText.textContent = 'Carregamento concluído!';	
    
    setTimeout(() => {
        loadingScreen.style.display = 'none';
		startGame();
        menuScreen.style.display = 'flex';
		/*gameCanvas.style.display = 'block';		    
		setupGameScene();
		animate();*/
        gameState = 'menu';
    }, 1000);
}

function setupEventListeners() {
    // Botão iniciar
    startButton.addEventListener('click', iniciarFase);
    
    // Botões de jogar novamente
    playAgainWinButton.addEventListener('click', restartGame);
    playAgainLoseButton.addEventListener('click', restartGame);
    
    // Controles do teclado
	document.addEventListener('keydown', function(event) {
		if (gameState !== 'fase') return;
		if (event.keyCode === 126 || event.keyCode === 38) {
			runAction.play();
			subir();
		} else if (event.keyCode === 127 || event.keyCode === 40) {
			if(pulando) return ;
			runAction.stop();
			idleAction.play();
			descer();			
		} else if (event.keyCode === 32) {			
			if(pulando || (playerBalloon.position.y < ALTURA_BASE-4)) return;
			const audioPulo = new Audio('assets/pular.mp3');
			audioPulo.volume = 0.3;
			audioPulo.play();
			runAction.stop();
			jumpAction.stop();
			jumpAction.time = 0;		
			jumpAction.play();
			pulando = true;
			setTimeout(() => {
				pulando = false;
				if(subindo)runAction.play();
			}, 1800);
			alto = true;
			baixo = false;			
		} else if (event.keyCode === 39) {
			if(!esquerda && playerBalloon.rotation.y < 0)return;
			esquerda = true;			
		}
	});	
	
	
	document.addEventListener('keyup', function(event) {
		if (gameState !== 'fase') return;
		if (event.keyCode === 37) {
			direita = false;
		} else if (event.keyCode === 39) {
			esquerda = false;
		}
	});
    //document.addEventListener('keydown', onKeyDown);
    //document.addEventListener('keyup', onKeyUp);
    
    // Redimensionamento da janela
    window.addEventListener('resize', onWindowResize);
}

function pular(){
	//console.log(playerBalloon.position.y);
	if(alto && playerBalloon.position.y < 20 && !baixo) playerBalloon.position.y += FORÇA_PULO;
	else if(alto && playerBalloon.position.y >= 20 && !baixo)baixo = true;
	else if(baixo && playerBalloon.position.y > ALTURA_BASE) playerBalloon.position.y -= FORÇA_PULO;
	else if(baixo && playerBalloon.position.y <= ALTURA_BASE){baixo = false;}
	
}

function pararAudios() {  
  for (const audio of audiosDinamicos) {
    audio.pause();
    audio.currentTime = 0;
  }
}

function iniciarFase(){
	
	preparingAction.stop();
	runAction.stop();
	idleAction.play();
	//console.log(pedras);	
	pararAudios();
	pulando = false;
    startTime = Date.now();
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        updateTimerDisplay();
    }, 1000);
	musica = new Audio('assets/musicapredios.mp3');
	musica.loop = true; // Ativa o loop
	musica.volume = 0.4;
	musica.play(); // Inicia a reprodução da música	
	audiosDinamicos.push(musica);
	gameState = 'fase';	
	gameEnded = false; // Reset do controle de fim de jogo
	gameMap.position.y = -16;
	gameMap.position.z = 40;
	gameMap.position.x = -20;
	playerBalloon.position.set(12, ALTURA_BASE, 0);
	//oponentes
	const fasePositions = [
        { x: 12, y: 3, z: 1},
        { x: 12, y: 7, z: 2},
		{ x: 12, y: 10, z: -1},
        { x: 12, y: 13, z: -2},
		{ x: 12, y: 16, z: 2}
    ];
	opponentBalloons.forEach((modelo, index) => {		
		modelo.position.set(
			fasePositions[index].x,
			fasePositions[index].y,
			fasePositions[index].z	
		);
	});
	menuScreen.style.display = 'none';    
    gameHUD.style.display = 'block';
    instructions.style.display = 'block';
	
}

function restartGame() {
    // Esconder telas de fim de jogo
    winScreen.style.display = 'none';
    loseScreen.style.display = 'none';
    
    // Resetar variáveis do jogo
	isColliding=false;    
    gameEnded = false;
    moveSpeed = 0.0010;
    clearInterval(timerInterval);
    elapsedTime = 0;
    updateTimerDisplay();
	
	iniciarFase();
}

/*function onKeyDown(event) {
    if (gameState !== 'fase') return;
    
    switch(event.code) {        
        case 'ArrowDown':
            descer();
            break;
		case 'ArrowUp':
            subir();
            break;
    }
}*/

/*function onKeyUp(event) {
    if (gameState !== 'fase') return;
    
    switch(event.code) {        
        case 'ArrowUp':
            subir();
            break;
    }
}*/

function subir(){	
    subindo = true;	
	//console.log('Subindo');
}

function descer(){	
	subindo  = false;	
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function startGame() {
    menuScreen.style.display = 'none';
    gameCanvas.style.display = 'block';
    /*gameHUD.style.display = 'block';
    instructions.style.display = 'block';*/
    
    gameState = 'playing';
    
    setupGameScene();
    animate();
}

function verificarFetch(response) {
  if (response.ok) {
    return response.json();
  } else {
    throw new Error(`Erro ${response.status}`);
  }
}

function setupGameScene() {
	console.log('Versão 1.0');
	/*fetch('config.json')
  .then(response => response.json())
  .then(config => {
    const intervaloRequisicao = config.intervaloRequisicao;

    let objetivoAtual;
    let ultimoIndiceComando;
    let comandoAtual;

    fetch('http://localhost:5001/comando_jogo', {
      method: 'GET',
      headers: {
        'RequesterID': 'Steve-482f7d85e'
      }
    })
      .then(response => response.json())
      .then(data => {        
        objetivoAtual = data.objetivo;
        //iniciarJogo(objetivoAtual);
      })
      .catch(error => console.error('Erro:', error));

    setInterval(() => {
      fetch('http://localhost:5001/comando_jogo', {
        method: 'GET',
        headers: {
          'RequesterID': 'Steve-482f7d85e'
        }
      })
        .then(response => {
          if (response.ok) {
            console.log('Fetch bem-sucedido');
            return response.json();
          } else {
            console.log('Erro no fetch:', response.status);
            throw new Error(`Erro ${response.status}`);
          }
        })
        .then(data => {          
          if (data.indiceComando !== ultimoIndiceComando) {
            ultimoIndiceComando = data.indiceComando;
            objetivoAtual = data.objetivo;
            comandoAtual = data.comando;
            executarAcao(objetivoAtual, comandoAtual);
          }
        })
        .catch(error => console.error('Erro:', error));
    }, intervaloRequisicao);
  })
  .catch(error => console.error('Erro ao carregar config.json:', error));*/
	  
    if (loadedAssets.map) {
        gameMap = loadedAssets.map.scene.clone();
        gameMap.scale.set(0.3, 0.3, 0.3);
        gameMap.position.set(-10, -15, 40);
		gameMap.rotation.set(0, 0, 0);
        
        // Configurar sombras para o mapa
        gameMap.traverse(function(child) {
            if (child.isMesh) {
                child.receiveShadow = true;
                child.castShadow = true;
            }
        });
        
        
		
		// Configurar animações do Mapa
        if (loadedAssets.map.animations.length > 0) {
		  mixer = new THREE.AnimationMixer(gameMap);
		  loadedAssets.map.animations.forEach((animation) => {
			const action = mixer.clipAction(animation);
			action.play();
		  });
		}
		
		scene.add(gameMap);
		
		// Configurar animação do jogador
        /*const mixer = new THREE.AnimationMixer(gameMap);

		// Iterar sobre todas as animações do modelo
		gameMap.animations.forEach((animation) => {
		  const action = mixer.clipAction(animation);
		  action.play();
		});*/
    }
    
	//Carregar chegada
	/*if (loadedAssets.chegada) {
        chegada = loadedAssets.chegada.scene.clone();
		chegada.scale.set(2, 2, 2);
        chegada.position.set(-200, 1, 0);
		chegada.rotation.y = 20;
		// Configurar sombras
        chegada.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
		gameMap.add(chegada);	
		
		
	}*/
	
	//Carregar chegada
	/*if (loadedAssets.chegada) {
		const distancia=20;
		for(var i=1; i<9; i++){
			pedra = loadedAssets.pedra.scene.clone();
			pedra.scale.set(2, 2, 2);
			pedra.position.set((distancia*i), -10, (Math.floor(Math.random() * 11) - 5)+3);
			pedra.rotation.y = 20;
			// Configurar sombras
			pedra.traverse(function(child) {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});					
		    			
			pedras.add(pedra);
			
		}		
		
		for(var i=1; i<10; i++){
			pedra = loadedAssets.pedra.scene.clone();
			pedra.scale.set(2, 2, 2);
			pedra.position.set((-distancia*i), -10, (Math.random() * 12 - 5));
			pedra.rotation.y = 20;
			// Configurar sombras
			pedra.traverse(function(child) {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});	
						
			pedras.add(pedra);
			
		}
		
		gameMap.add(pedras);				
			
		scene.add(gameMap);
	}*/
	
	//Carregar chegada
	if (loadedAssets.player) {
        playerBalloon = loadedAssets.player.scene;			
		playerBalloon.scale.setScalar(2);
		playerBalloon.position.y = 1;		
		
		
		mixer = new THREE.AnimationMixer(playerBalloon);
		const clips = loadedAssets.player.animations;
		// Criar uma ação para a animação 'run'
		runAction = mixer.clipAction(clips.find(clip => clip.name === 'correr'));
		jumpAction = mixer.clipAction(clips.find(clip => clip.name === 'pular'));
		idleAction = mixer.clipAction(clips.find(clip => clip.name === 'parado'));
		preparingAction = mixer.clipAction(clips.find(clip => clip.name === 'aquecendo'));
		
		jumpAction.setLoop(THREE.LoopOnce);
		jumpAction.timeScale = 0.55;
		runAction.timeScale = 1.4;
		
		preparingAction.play();
		
		scene.add(playerBalloon);
	}
	
	
    
    // Carregar oponentes
    setupOpponents();
    
    // Configurar câmera para seguir o jogador
    setupCamera();
	
	gameMap.position.y = -16;
	gameMap.position.z = 40;
	gameMap.position.x = -20;
	playerBalloon.position.set(12, ALTURA_BASE, 0);
}

function executarAcao(objetivo, comando) {     
    if (comando === 'reforca') subir(); 
    else if (comando === 'penaliza') descer();  
}

function setupOpponents() {
    const opponentAssets = ['opponent1', 'opponent2','opponent3', 'opponent4', 'opponent5'];
    const startPositions = [
        { x: -2, y: alturaInicial - 1, z: 2 },
        { x: 0, y: alturaInicial - 1, z: -2 },
		{ x: -2, y: alturaInicial +1, z: 0 },
        { x: 3, y: alturaInicial +1, z: -2 },
		{ x: -1, y: alturaInicial, z: 4 }
        
    ];
    
    opponentAssets.forEach((assetName, index) => {
        if (loadedAssets[assetName]) {
            const opponent = loadedAssets[assetName].scene.clone();
            opponent.scale.set(2, 2, 2);
            opponent.position.set(
                startPositions[index].x,
                startPositions[index].y,
                startPositions[index].z
            );
            
            // Configurar sombras
            opponent.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            scene.add(opponent);
            opponentBalloons.push(opponent);
            
            // Configurar animação do oponente
            /*if (loadedAssets[assetName].animations.length > 0) {
                const opponentMixer = new THREE.AnimationMixer(opponent);
                const flyAnimation = loadedAssets[assetName].animations.find(anim => 
                    anim.name.toLowerCase().includes('voar') || anim.name.toLowerCase().includes('fly')
                );
                
                if (flyAnimation) {
                    const action = opponentMixer.clipAction(flyAnimation);
                    action.timeScale = 0.7; // Velocidade mais lenta
                    action.play();
                } else if (loadedAssets[assetName].animations[0]) {
                    const action = opponentMixer.clipAction(loadedAssets[assetName].animations[0]);
                    action.timeScale = 0.7;
                    action.play();
                }
                
                mixers.push(opponentMixer);
            }*/
        }
    });
}

function setupCamera() {
    if (playerBalloon) {
        camera.position.set(0, 0, 10);
		var objectRotation = playerBalloon.rotation;
        camera.lookAt(playerBalloon.position);
		//camera.rotation.x = objectRotation.x;
		//camera.rotation.y = objectRotation.y;
		//camera.rotation.z ++;
        camera.lookAt(playerBalloon.position);
    }
}

function updatePlayerMovement() {
    if (!playerBalloon || isColliding) return;
	
	let moved = false;
    const newPosition = playerBalloon.position.clone();
	
	direction = new THREE.Vector3(0, -0.5, 0);
	
    newPosition.add(direction);
	
    // Verificar colisão antes de mover
    if (!checkCollisions(newPosition) && !pulando) {
      playerBalloon.position.copy(newPosition);
      moved = true;	  
    }
	
	if(gameState === 'fase' && playerBalloon.position.y < (ALTURA_BASE-9) && !gameEnded){
		subindo = false;
		const audioFinal = new Audio('assets/final.mp3');
		audioFinal.volume = 0.3;
		audioFinal.play();	
		checkGameEnd();		
	}
	
	if(pulando){
		//console.log(playerBalloon.position.y);
		if(alto && playerBalloon.position.y < 18.5 && !baixo) playerBalloon.position.y += FORÇA_PULO;
		else if(alto && playerBalloon.position.y >= 18.5 && !baixo)baixo = true;
		else if(baixo && playerBalloon.position.y > ALTURA_BASE) playerBalloon.position.y -= FORÇA_PULO;
		else if(baixo && playerBalloon.position.y <= ALTURA_BASE){baixo = false;}
	}
    
	//playerBalloon.rotation.y += 0.002;	
	if(subindo !== null){
		gameMap.position.x+= (subindo) ? 0.18 : 0;	
		//console.log(gameMap.position.x);
		if(gameMap.position.x >= 114) gameMap.position.x = -20;
	}
	
    
	
	
    
    /*if (gameState === 'fase' && !gameEnded && gameMap.position.x >= 200) {
		subindo = false;
        checkGameEnd();
    }*/
	
    /*if (keys.up) {
        moveSpeed+=0.001;
    }
    if (keys.down) {
        moveSpeed-=0.001;
    }*/
    
    // Limitar altura mínima
    /*if (playerBalloon.position.y < 2) {
        playerBalloon.position.y = 2;
    }*/
    
    // Atualizar HUD
    updateHUD();
}

function checkGameEnd() {
    gameEnded = true;
    
    // Verificar se algum oponente já passou da altura 300
    let opponentWon = false;
    for (let opponent of opponentBalloons) {
        if (opponent.position.y >= 35) {
            opponentWon = true;
            break;
        }
    }
    
    // Esconder HUD e instruções
    gameHUD.style.display = 'none';
    instructions.style.display = 'none';
    
    if (isColliding) {
        // Jogador perdeu
        clearInterval(timerInterval);
        document.getElementById('finalTimeLose').textContent = document.getElementById('time').textContent;
        loseScreen.style.display = 'flex';
    } else {
        // Jogador ganhou
        clearInterval(timerInterval);
        document.getElementById('finalTimeWin').textContent = document.getElementById('time').textContent;
        winScreen.style.display = 'flex';
    }
}

function updateOpponents() {
    opponentBalloons.forEach((opponent, index) => {
        // Movimento vertical aleatório sutil
        opponent.position.y += velocidadeOponente[index];
        // Limitar altura
        /*if (opponent.position.y < 2) {
            opponent.position.y = 2;
        }*/
    });
}

function updateCamera() {
	if(gameState === "fase"){
    
		// Configurações da câmera de terceira pessoa
		const cameraDistance = 22;  // Distância da câmera ao player
		const cameraHeight = 10;    // Altura da câmera acima do player
		const cameraSmoothing = 0.1; // Suavidade do movimento da câmera (0.1 = suave, 1.0 = instantâneo)
		
		// Calcular posição ideal da câmera atrás do player
		const idealOffset = new THREE.Vector3(0, cameraHeight, -cameraDistance);
		
		// Aplicar a rotação do player ao offset da câmera
		idealOffset.applyQuaternion(playerBalloon.quaternion);
		
		// Posição final da câmera
		const idealPosition = new THREE.Vector3().addVectors(playerBalloon.position, idealOffset);
		
		// Ponto para onde a câmera deve olhar (ligeiramente acima do player)
		const lookAtTarget = new THREE.Vector3(
			playerBalloon.position.x,
			playerBalloon.position.y + 1,
			playerBalloon.position.z + 1
		);
		
		// Suavizar o movimento da câmera
		camera.position.lerp(idealPosition, cameraSmoothing);
		
		// Fazer a câmera olhar para o player
		camera.lookAt(lookAtTarget);
	}else{	  	  
	  const offset = new THREE.Vector3(5, 10, 5);
	  rotationCamera+= 0.02;;
	  const target = new THREE.Vector3((playerBalloon.position.x+15)+rotationCamera, 7+rotationCamera, (playerBalloon.position.z-5)+rotationCamera);
	  //Alturaideal : 40
		// Posição da câmera baseada na posição do balão + offset rotacionado
	  const targetPosition = new THREE.Vector3().addVectors(target, offset)
	  // Suavizar o movimento da câmera
	  camera.position.lerp(targetPosition, 0.1);

		// Fazer a câmera olhar para o player
	  camera.lookAt(playerBalloon.position);
    }
	
	
   
}

function checkCollisions(newPosition) {
  if (!gameMap || !newPosition) return false;
  // Criar raycaster para detectar colisões
  const raycaster = new THREE.Raycaster();
  const direction = new THREE.Vector3();
  // Verificar colisão em múltiplas direções ao redor do jogador
  const directions = [    
    new THREE.Vector3(0, -0.5, 0), // trás
  ];
  for (let dir of directions) {
    raycaster.set(newPosition, dir);
    const intersects = raycaster.intersectObjects(gameMap.children, true);
    // Se há interseção muito próxima, há colisão
    if (intersects.length > 0 && intersects[0].distance < 1) {
      return true;
    }
  }
  
  
  /*const box = new THREE.Box3().setFromObject(objetivo);		
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
      
  }*/
 

  return false;
}

function handleCollision() {
    if (isColliding) return;
    
    isColliding = true;
    
    // Pausar animação do jogador
    if (mixer) {
        mixer.timeScale = 0;
    }
    
    // Resetar apenas a altura para altura inicial, mantendo posição X e Z atual
    if (playerBalloon) {
        //playerBalloon.position.y = alturaInicial;
		//playerBalloon.rotation.y -= 5;
        
        // Atualizar câmera para a nova posição do balão
        updateCamera();
    }
    
    // Retomar animação após 3 segundos
    collisionTimeout = setTimeout(() => {
        if (mixer) {
            mixer.timeScale = 1;
        }
        isColliding = false;
    }, 2000);
}

function updateHUD() {
    if (playerBalloon) {
        document.getElementById('speed').textContent = (moveSpeed*100).toFixed(3);
        document.getElementById('altitude').textContent = Math.round(playerBalloon.position.y * 100);
    }
}

function animate() {
   /*if (gameState !== 'playing' && gameState !== 'menu' ) return;*/
    
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    // Atualizar animações    	
	if(mixer)mixer.update(delta);
	
	if (mixer2) mixer2.update(delta);
    mixers.forEach(m => m.update(delta));
    
    // Atualizar movimento do jogador
    updatePlayerMovement();
    
    // Atualizar oponentes
    updateOpponents();
    
    // Atualizar câmera
    updateCamera();
    
    // Verificar colisões
    checkCollisions();
    
    // Renderizar
    renderer.render(scene, camera);
}

// Limpar timeouts ao sair
window.addEventListener('beforeunload', function() {
    if (collisionTimeout) {
        clearTimeout(collisionTimeout);
    }
});


let startTime; // Tempo de início do cronômetro
let elapsedTime = 0; // Tempo decorrido
let timerInterval; // Variável para armazenar o intervalo do cronômetro




function updateTimerDisplay() {
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    document.getElementById('time').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}


