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
let distanciaPercorrida = 0;
let verificar = false;

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
    { name: 'player', url: 'assets/personagem3.gltf?3' },
	{ name: 'chegada', url: 'assets/tesouro.gltf' },
	{ name: 'pedra', url: 'assets/vagao.gltf' }
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
    scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
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
    const ambientLight = new THREE.AmbientLight(0x404040, 6.0);
	scene.add(ambientLight);

	// Luz direcional principal - simula o sol
	const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
	directionalLight.position.set(5, 5, 5);	
	//directionalLight.castShadow = true;

	/*directionalLight.shadow.mapSize.width = 4096;
	directionalLight.shadow.mapSize.height = 4096;
	directionalLight.shadow.camera.near = 0.5;
	directionalLight.shadow.camera.far = 200;
	directionalLight.shadow.camera.left = -100;
	directionalLight.shadow.camera.right = 100;
	directionalLight.shadow.camera.top = 100;
	directionalLight.shadow.camera.bottom = -100;*/

	//scene.add(directionalLight);

	// Luz de preenchimento - simula reflexos do ambiente
	const fillLight = new THREE.DirectionalLight(0x87CEEB, 5.3);
	fillLight.position.set(5, 5, 5);
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
			runAction.stop();
			idleAction.play();
			descer();			
		} else if (event.keyCode === 37) {
			if(!direita && playerBalloon.rotation.y > 0 )return;
			direita = true;			
			playerBalloon.rotation.y += 0.01;
		} else if (event.keyCode === 39) {
			if(!esquerda && playerBalloon.rotation.y < 0)return;
			esquerda = true;			
			playerBalloon.rotation.y -= 0.01;
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

function pararAudios() {  
  for (const audio of audiosDinamicos) {
    audio.pause();
    audio.currentTime = 0;
  }
}

function iniciarFase(){	
	
	verificar = false;
	distanciaPercorrida = 0;
	pedras.visible = true;
	pedras.position.set(0,0,0);
	subindo = false;	
	runAction.stop();
	idleAction.play();	
	gameMap.traverse((object) => {	  
		object.position.y = 0;	  
	});
	pararAudios();
    startTime = Date.now();
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        updateTimerDisplay();
    }, 1000);
	setTimeout(() => {
        verificar = true;
    }, 1000);
	musica = new Audio('assets/musicatrem3.mp3');
	musica.loop = true; // Ativa o loop
	musica.volume = 0.3;
	musica.play(); // Inicia a reprodução da música	
	audiosDinamicos.push(musica);
	gameState = 'fase';	
	gameEnded = false; // Reset do controle de fim de jogo
	gameMap.position.x = -100;
	gameMap.position.z = -2.6;
	playerBalloon.position.set(12, 0.5, 0);
	playerBalloon.rotation.y +=0.05;
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
        gameMap.scale.set(1, 1, 1);
        gameMap.position.set(-100, 0, -2.6);
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
		
		// Configurar animação do jogador
        /*const mixer = new THREE.AnimationMixer(gameMap);

		// Iterar sobre todas as animações do modelo
		gameMap.animations.forEach((animation) => {
		  const action = mixer.clipAction(animation);
		  action.play();
		});*/
    }
    
	
	
	//Carregar chegada
	if (loadedAssets.chegada) {
		const distancia=30;
		for(var i=1; i<150; i++){
			pedra = loadedAssets.pedra.scene.clone();
			pedra.scale.set(1, 1, 1);
			const rand = Math.abs(Math.floor(Math.random() * 6 - 3));
			switch(rand){	
				case 0:
					pedra.position.set(30-(distancia*(i+1)), 0, -0.5-5);
					break;	
				case 1:
					pedra.position.set(30-(distancia*(i+1)), 0, -0.5-(-5.0));
					break;
				case 2:
					pedra.position.set(30-(distancia*(i+1)), 0, -0.5-0);
					break;
				case 3:
					pedra.position.set(30-(distancia*(i+1)), 0, -0.5-5);
					break;			
			}
			//console.log(rand+' -X : '+pedra.position.x+' -Y: '+pedra.position.y+' -Z: '+pedra.position.z);
			//pedra.rotation.y = 20;
			// Configurar sombras
			pedra.traverse(function(child) {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});					    			
						
			pedras.add(pedra);			
			pedras.visible = false;
			
		}	
		
		/*for(var i=1; i<10; i++){
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
			
		}*/
		
		//gameMap.add(pedras);				
		
		
	}
	
	//Carregar chegada
	if (loadedAssets.chegada) {
        chegada = loadedAssets.chegada.scene.clone();
		chegada.scale.set(1, 1, 1);
        chegada.position.set(pedras.children[pedras.children.length - 1].position.x-30, 0, 0);
		chegada.rotation.y = 0;
		// Configurar sombras
        chegada.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
		pedras.add(chegada);	
		scene.add(gameMap);		
		scene.add(pedras);
		
	}
	
	//Carregar chegada
	/*if (loadedAssets.pedra) {
        const pedra = loadedAssets.pedra.scene.clone();
		pedra.scale.set(2, 2, 2);
        pedra.position.set(-50, 1, 0);
		pedra.rotation.y = 20;
		// Configurar sombras
        pedra.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
		
		pedras.push(pedra);
		pedras.push(pedra.clone());
		
		pedras[1].position.set(-60, 1, 10);
		
		
		for(var i=0;i<pedras.lenght; i++) gameMap.add(pedras[i]);	
		scene.add(gameMap);
	}*/
	
	/*if (loadedAssets.pedra) {
		for(var i=1; i<=2; i++){
			const pedra = loadedAssets.pedra.scene.clone();
			pedra.scale.set(1, 1, 1);
			pedra.position.set(-30+i, 1, 0);
			pedra.rotation.y = 20;
			// Configurar sombras
			pedra.traverse(function(child) {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});
			pedras.push(pedra);
			gameMap.add(pedras[i]);	
			console.log('Criou pedra '+i);
		}
		scene.add(gameMap);
	}*/
	
    // Carregar balão do jogador
    if (loadedAssets.player) {
        playerBalloon = loadedAssets.player.scene;			
		playerBalloon.scale.setScalar(2);				
		playerBalloon.position.set(12, 0.5, 0);
		playerBalloon.rotation.y +=0.05;
		
		
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
		
		runAction.play();
		
		scene.add(playerBalloon);
	}
    
    // Carregar oponentes
    setupOpponents();
    
    // Configurar câmera para seguir o jogador
    setupCamera();
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
	
	if(direita && subindo){ playerBalloon.position.z += 0.1; playerBalloon.rotation.y += (playerBalloon.rotation.y < 0.5 && playerBalloon.position.z < 5) ? 0.05 : 0; }
	else if(esquerda && subindo){ playerBalloon.position.z -= 0.1; playerBalloon.rotation.y -= (playerBalloon.rotation.y > -0.5 & playerBalloon.position.z > -6) ? 0.05 : 0; }
	else if(playerBalloon.rotation.y > 0.1)playerBalloon.rotation.y -= 0.1;
	else if(playerBalloon.rotation.y < -0.1)playerBalloon.rotation.y += 0.1;
	else playerBalloon.rotation.y = 0; 
	
	if(playerBalloon.position.z > 5){ direita = false; playerBalloon.position.z -= 0.08;}
	if(playerBalloon.position.z < -6){ esquerda = false; playerBalloon.position.z += 0.08;}	
	
	if(gameState !== 'fase'){
		gameMap.position.x+=0.4;
		pedras.position.x+=0.4;
	}
	else if(subindo !== null){
		gameMap.position.x+= (subindo) ? 0.4 : 0;	
		pedras.position.x+= (subindo) ? 0.4 : 0;	
	}
	
    
	if(subindo){
		distanciaPercorrida += 0.05;
		//console.log(distanciaPercorrida);
	}
	
    
    if (gameState === 'fase' && !gameEnded && gameMap.position.x >= 261) {
		gameMap.position.x = -100;
    }
	
	if(distanciaPercorrida > 548){
		gameMap.position.x = -100;
		gameMap.position.z = -2.6;
		playerBalloon.position.set(12, 0.5, 0);
		playerBalloon.rotation.y +=0.05;
		pedras.position.set(0,0,0);
		subindo = false;
		gameEnded = true;
        checkGameEnd();		
	}
	
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
	let offset;
	/*if (playerBalloon) {
	  // Posição da câmera relativa ao veículo
	  if (gameState !== 'fase') offset = new THREE.Vector3(10+camPos[0], 17+camPos[1], 12+camPos[2]);
	  else offset = new THREE.Vector3(0, 0, 0);
	  console.log(offset);
	  // Não aplicar a quaternião do veículo para manter a orientação da câmera fixa
	  camera.position.set(1,1,1);
	  //camera.position.copy(playerBalloon.position).add(offset);
	  //camera.position.set(camPos[0],camPos[1],camPos[2]);
	  camera.lookAt(playerBalloon.position);
	}*/
    if (playerBalloon && gameState !== 'fase') {
        // Câmera segue o balão incluindo rotação
        //offset = new THREE.Vector3(0, 5, 15);
		/*if (gameState !== 'fase') offset = new THREE.Vector3(0, 5, 15);
		else offset = new THREE.Vector3(0, 0, 0);
        
        // Aplicar a rotação do balão ao offset da câmera
        offset.applyQuaternion(playerBalloon.quaternion);
        
		if (gameState !== 'fase')camera.position.set(playerBalloon.position.x+2, playerBalloon.position.y+1, playerBalloon.position.z+2);
		else camera.position.set(playerBalloon.position.x+5, playerBalloon.position.y+1, playerBalloon.position.z);*/
		
		if (gameState == 'fase') camera.rotation.y = 20;
		else{
			//console.log(camera.rotation);
			camera.rotation.y+=0.1;
			//console.log(camera.rotation);
		}		
		
		offset = new THREE.Vector3(0, 10, 5);
		
		rotationCamera += 0.01;
		const target = new THREE.Vector3(playerBalloon.position.x+5, 0+rotationCamera, playerBalloon.position.z);
		
        // Posição da câmera baseada na posição do balão + offset rotacionado
        const targetPosition = new THREE.Vector3().addVectors(target, offset);
        
        camera.position.lerp(targetPosition, 0.1);
        camera.lookAt(playerBalloon.position);
    }else{
		//console.log("Teste");
		offset = new THREE.Vector3(0, 10, 5);
		
		rotationCamera += 0.01;
		const target = new THREE.Vector3(playerBalloon.position.x+8, 2, playerBalloon.position.z-5);
		
        // Posição da câmera baseada na posição do balão + offset rotacionado
        const targetPosition = new THREE.Vector3().addVectors(target, offset);
        
        camera.position.lerp(targetPosition, 0.1);
        camera.lookAt(playerBalloon.position);
	}
	
	
   
}

function checkCollisions() {
    if (!playerBalloon || !gameMap || isColliding || gameState !== 'fase' || !verificar) return;    
    
	playerBalloon.updateMatrixWorld(true); // Atualize a matriz de transformação do modelo1
	
	const box1 = new THREE.Box3().setFromObject(playerBalloon);	
	
	for (let i = 0; i < pedras.children.length; i++) {
	  const child = pedras.children[i];
	  const childBox = new THREE.Box3().setFromObject(child);
	  if (box1.intersectsBox(childBox)) {
		isColliding = true;
		if(!gameEnded)checkGameEnd();
		gameMap.position.x = -100;
		gameMap.position.z = -2.6;
		playerBalloon.position.set(12, 0.5, 0);
		playerBalloon.rotation.y +=0.05;
		pedras.position.set(0,0,0);
	  }
	}
	
}


function checkCollision(group, box) {
  for (let i = 0; i < group.children.length; i++) {
	const child = group.children[i];
	if (child.geometry && child.geometry.boundingBox) {
	  const childBox = child.geometry.boundingBox.clone();
	  childBox.applyMatrix4(child.matrixWorld);
	  if (box.intersectsBox(childBox)) {
		return true;
	  }
	}
  }
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
    }, 3000);
}

function updateHUD() {
    if (playerBalloon) {
        document.getElementById('speed').textContent = Math.round(distanciaPercorrida/2);
        document.getElementById('altitude').textContent = Math.round(playerBalloon.position.y * 100);
    }
}

function animate() {
   /*if (gameState !== 'playing' && gameState !== 'menu' ) return;*/
    
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    // Atualizar animações
    if (mixer) mixer.update(delta);
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


