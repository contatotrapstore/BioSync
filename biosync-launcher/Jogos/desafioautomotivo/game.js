// Variáveis globais do jogo
let scene, camera, renderer, objetivo, loader;
let playerBalloon, chegada, colisao, musica, audioCarro, opponentBalloons = [];
let gameMap, objetivoMixer;
let mixer, mixers = [];
let clock = new THREE.Clock();
let gameState = 'loading'; // loading, menu, playing, fase
let alturaInicial = 2;
let isColliding = false;
let collisionTimeout = null;
let camPos = [10,10,10];
let velocidadeOponente = [0.001,0.0001,0.00001,0.00007,0.000004,0.000001];
let moveSpeed = 0.0010;
let gameEnded = false; // Controle para evitar múltiplas verificações de fim de jogo
let flyAnimation, acao;
let acelerando, direita, esquerda, novaVolta = false;
let aceleracao = 0.01;
let posicaoCamera = 0;
let checkAtual = 0;
let loopCount, rotationCamera = 0;
let duracao, colidiu = false;

const posChecks = [
{ x: -51.57, y: 0, z: 38.04 },
{ x: 18.21, y: 0, z: 98.56 },
{ x: 68.36, y: 0, z: 142.09 },
{ x: -4.95, y: 0, z: 128.03 },
{ x: -109.28, y: 0, z: 27.30 },
{ x: -139.56, y: 0, z: -55.89 },
{ x: -22.56, y: 0, z: -105.39 },
{ x: 65.91, y: 0, z: -38.77 },
{ x: -37.91, y: 0, z: -26.11 },
{ x: -108.52, y: 0, z: -24.39 }
];


const VELOCIDADE_MAXIMA = 0.85;

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
    { name: 'map', url: 'assets/mapanovo1.gltf?6' },
    { name: 'player', url: 'assets/carro3.gltf?6' },
	{ name: 'colisao', url: 'assets/colisao3.gltf?6' }
    
	/*{ name: 'chegada', url: 'assets/chegada.gltf' },
    { name: 'opponent1', url: 'assets/balao2.gltf' },
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
    //scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
	const textura = new THREE.TextureLoader();
	const skyboxTexture = textura.load('assets/skybox.jpg');
	skyboxTexture.mapping = THREE.EquirectangularReflectionMapping;

	scene.background = skyboxTexture;
	
	//scene.background = new THREE.Color('#ff0000');

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
    renderer.setClearColor(0xff0000);
    renderer.physicallyCorrectLights = true; // Habilita luzes fisicamente corretas
    //renderer.outputEncoding = THREE.sRGBEncoding; // Garante cores corretas

    // Carregar mapa de ambiente para reflexos
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    new THREE.TextureLoader().load( 'assets/skybox2.jpg', function( texture ) {
        const envMap = pmremGenerator.fromEquirectangular( texture ).texture;
        scene.environment = envMap;
        texture.dispose();
        pmremGenerator.dispose();
    } );

    // Criar loader GLTF
    loader = new THREE.GLTFLoader();

    // Adicionar luzes
    setupLighting();
}

function setupLighting() {
    
    const ambientLight = new THREE.AmbientLight(0x666666, 5.0);
	scene.add(ambientLight);
	
	// Luz direcional principal - simula o sol
	const directionalLight = new THREE.DirectionalLight(0x555555, 5.0);
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
		animate();*
        gameState = 'menu';*/
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
		if (event.keyCode === 38 || event.keyCode === 126) {
			/*if (loadedAssets.rodas.animations.length > 0) {
			  mixer = new THREE.AnimationMixer(rodas);
			  loadedAssets.rodas.animations.forEach((animation) => {
				acaoTanque = mixer.clipAction(animation);
				acaoTanque.time = 20; // corta a animação no ponto 0.5 segundos
				acaoTanque.play();	
			  });
			}*/
			audioCarro.play();
			acelerando = true;
			pausado = false;
			subir();
		}
		if (event.keyCode === 40 || event.keyCode === 127) {			
			acelerando = false;		
			audioCarro.pause();
			audioCarro.currentTime = 0;
			const audio = new Audio('assets/carrodesligando.mp3');	
			audio.volume = 1;			
			audio.play();
		}
		if (event.keyCode === 37) {
			direita = true;
			if(!direita && playerBalloon.rotation.y > 0 )return;
			direita = true;			
		}
		if (event.keyCode === 39) {
			esquerda = true;
			//console.log(playerBalloon.rotation.y);
			if(!esquerda && playerBalloon.rotation.y < 0)return;
			esquerda = true;			
		}
		/*if (event.keyCode === 126 || event.keyCode === 32) { // Barra de espaço						
			isShooting = true;			
		}
		if (event.keyCode === 127) { // Barra de espaço		
			
			isShooting = false;			
		}*/
	});
	
	document.addEventListener('keyup', function(event) {
		if (gameState !== 'fase') return;
		if (event.keyCode === 38) {
			acelerando = false;
			pausado = true;
			const audio = new Audio('assets/carrodesligando.mp3');	
			audio.volume = 1;			
			audio.play();
		}
		if (event.keyCode === 37) {
			direita = false;
		}
		if (event.keyCode === 39) {
			esquerda = false;
		}
		/*if (event.keyCode === 32) {
			isShooting = false;
		}*/
		
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
	
	//const mixer = new THREE.AnimationMixer(playerBalloon);	
	
	moveSpeed = 0.0010;
	checkAtual = 0;
	loopCount = 0;
	
	/*mixer.stopAllAction();
	acao.time = 0;	
	acao.play();
	acao.timeScale = 0.1;
	duracao = acao.getClip().duration;*/
	
	acelerando = false;

	objetivo.position.x = posChecks[checkAtual].x;
	objetivo.position.y = posChecks[checkAtual].y;
	objetivo.position.z = posChecks[checkAtual].z;	
	
	pararAudios();
    startTime = Date.now();
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        updateTimerDisplay();
    }, 1000);
	
	musica = new Audio('assets/musicacorrida.mp3');
	musica.volume = 0.3;
	musica.loop = true; // Ativa o loop
	musica.play(); // Inicia a reprodução da música	
	
	audioCarro = new Audio('assets/carro.mp3');
	audioCarro.loop = true; // Ativa o loop
	audioCarro.volume = 1;
	
	
	audiosDinamicos.push(musica);
	gameState = 'fase';	
	gameEnded = false; // Reset do controle de fim de jogo
	playerBalloon.scale.set(2, 2, 2);
	playerBalloon.position.set(-89, 1.2, 0.5);
	playerBalloon.rotation.y = -11.8;
	//playerBalloon.position.set(12, 0, 20);
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
	acelerando = true;
}

function descer(){	
	aceleracao = 0.01;
	acelerando = false;
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
        'RequesterID': 'Balao-482f7d85e'
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
          'RequesterID': 'Balao-482f7d85e'
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
        gameMap.position.set(0, 0, 0);
        
        // Configurar sombras para o mapa
        gameMap.traverse(function(child) {
            if (child.isMesh) {				
                child.receiveShadow = true;
                child.castShadow = true;	      // Ajuste o contraste do material
				//child.material.color.multiplyScalar(1.5); // Aumenta o contraste
		// ou
				child.material.emissive.multiplyScalar(2.5); // Aumenta o contraste da emissão   
            }
        });
        
        scene.add(gameMap);
    }
	
	/*if (loadedAssets.colisao) {
        colisao = loadedAssets.colisao.scene.clone();
        colisao.scale.set(1, 1, 1);
        colisao.position.set(0, 0, 0);
        
        // Configurar sombras para o mapa        
        
        scene.add(colisao);
    }*/
	
	loader.load('assets/colisaonova.gltf?9', function(gltf) {    
		colisao = gltf.scene;
		// Configurar sombras para o labirinto
		colisao.traverse(function(child) {
		  if (child.isMesh) {
			child.castShadow = true;
			child.receiveShadow = true;
			child.geometry.computeFaceNormals();
			child.geometry.computeVertexNormals();	
			child.material.transparent = true;
			child.material.opacity = 0.0;
		  }
		});
		colisao.scale.y = 4;		
		colisao.renderOrder = 2;
		scene.add(colisao);    
	});
	
	loader.load('assets/objetivo.gltf?6', function(gltf) {    
		objetivo = gltf.scene;
		// Posicionar jogador
		objetivo.position.set(38, 0, 175);
		//objetivo.position.set(10, 0, 0);
		objetivo.scale.set(3, 3, 3);
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
		objetivo.renderOrder = 1;
		scene.add(objetivo);    
		// Posicionar câmera atrás do jogador
		updateCamera();    
	  });
    
	//Carregar chegada
	if (loadedAssets.chegada) {
        chegada = loadedAssets.chegada.scene.clone();
		chegada.scale.set(0.6, 0.6, 0.6);
        chegada.position.set(12, 34, 0);
		// Configurar sombras
        chegada.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
		scene.add(chegada);
	}
    // Carregar balão do jogador
    if (loadedAssets.player) {
        playerBalloon = loadedAssets.player.scene.clone();
        playerBalloon.scale.set(2, 2, 2);
		playerBalloon.position.set(-50, 1.6, 0.5);
		playerBalloon.rotation.y = -11.8;

        // Configurar material do carro para reflexos
        playerBalloon.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material.envMap = scene.environment;
                    child.material.envMapIntensity = 1; // Ajuste a intensidade conforme necessário
                    child.material.needsUpdate = true;
                }
            }
        });
        
        // Configurar sombras
       /* playerBalloon.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });*/
        
        scene.add(playerBalloon);
        
        // Configurar animação do jogador
       /* if (loadedAssets.player.animations.length > 0) {
            mixer = new THREE.AnimationMixer(playerBalloon);
            flyAnimation = loadedAssets.player.animations.find(anim => 
                anim.name.toLowerCase().includes('acelerar')
            );
            
			// Se não encontrar animação 'voar', usar a primeira disponível
			const action = mixer.clipAction(loadedAssets.player.animations[0]);
			action.play();            
        }*/
    }
    
    // Carregar oponentes
    setupOpponents();
    
    // Configurar câmera para seguir o jogador
    setupCamera();
}

function executarAcao(objetivo, comando) {
  if (objetivo === 'subir'){     
	if (comando === 'reforça') subir(); 
	else if (comando === 'penaliza') descer();
  }
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
        camera.position.set(0, 5, 10);
		camera.rotation.y= 30;
		var objectRotation = playerBalloon.rotation;
        //camera.lookAt(playerBalloon.position);
		//camera.rotation.x = objectRotation.x;
		//camera.rotation.y = objectRotation.y;
		//camera.rotation.z ++;        
		camera.lookAt(new THREE.Vector3(0, 0, 0));
    }
}

function updatePlayerMovement() {
	
    if (!playerBalloon || isColliding || gameEnded) return;
	
	//console.log('Posicao : X: '+playerBalloon.position.x + 'Posicao : Z: '+playerBalloon.position.z +' - Rotacao: '+ playerBalloon.rotation.y);
		
	var newPosition = new THREE.Vector3(0, 0, 0);
	
	//console.log('Posicao : ('+playerBalloon.position.x+' -'+playerBalloon.position.z+' - Rotação : '+playerBalloon.rotation.y); 
	
	if(gameState !== 'fase'){		
		/*let direcao = new THREE.Vector3(0, 0, 1);
		direcao.applyQuaternion(playerBalloon.quaternion);
		playerBalloon.position.add(direcao.multiplyScalar(0.08));
		playerBalloon.rotation.y -= 0.003;*/
	}
	
	//console.log(subindo);
	//console.log(acelerando);	
	if(acelerando){
		moved = true;
		moveSpeed += (moveSpeed < VELOCIDADE_MAXIMA) ? 0.01 : 0;		
		audioCarro.play();
		//console.log(futurePosition.x);
		/*if ((futurePosition.x > -78 && futurePosition.x < 36) &&
            (futurePosition.z > -21 && futurePosition.z < 36)) {
							
				playerBalloon.position.add(direcao.multiplyScalar(0.35));
				audioCarro.play();
			}
		else audioCarro.pause();*/
	}
	else if(gameState === 'fase'){
		moveSpeed += (moveSpeed > 0) ? -0.01 : 0
		audioCarro.pause();
		audioCarro.currentTime = 0;
	}
	
	
	let direcao = new THREE.Vector3(0, 0, 0.5);
	
	direcao.applyQuaternion(playerBalloon.quaternion);
	const futurePosition = playerBalloon.position.clone().add(direcao.multiplyScalar(moveSpeed));	
	
    newPosition.add(futurePosition);
	
    // Verificar colisão antes de mover
    if (!checkCollision(newPosition)) {
      playerBalloon.position.add(direcao.multiplyScalar(moveSpeed));
    }else moveSpeed = 0;
	
	if(direita && (acelerando || moveSpeed > 0.35)) playerBalloon.rotation.y += 0.015;
	if(esquerda && (acelerando ||  moveSpeed > 0.35)) playerBalloon.rotation.y -= 0.015;
		
	
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
    
   
	// Jogador ganhou
	clearInterval(timerInterval);
	document.getElementById('finalTimeWin').textContent = document.getElementById('time').textContent;
	winScreen.style.display = 'flex';    
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
	if (!playerBalloon) return;
	
	if(gameState === "fase"){
    
		// Configurações da câmera de terceira pessoa
		const cameraDistance = 12;  // Distância da câmera ao player
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
			playerBalloon.position.z
		);
		
		// Suavizar o movimento da câmera
		camera.position.lerp(idealPosition, cameraSmoothing);
		
		// Fazer a câmera olhar para o player
		camera.lookAt(lookAtTarget);
	}else{	  	  
	  const offset = new THREE.Vector3(5, 5, 5);
	  rotationCamera+= 0.02;;
	  const target = new THREE.Vector3((playerBalloon.position.x-15)+rotationCamera, 2+rotationCamera, (playerBalloon.position.z-5)+rotationCamera);
	  //Alturaideal : 40
		// Posição da câmera baseada na posição do balão + offset rotacionado
	  const targetPosition = new THREE.Vector3().addVectors(target, offset)
	  // Suavizar o movimento da câmera
	  camera.position.lerp(targetPosition, 0.1);

		// Fazer a câmera olhar para o player
	  camera.lookAt(playerBalloon.position);
    }
}

/*function checkCollisions() {
    if (!playerBalloon || !gameMap || isColliding) return;
    
    // Criar bounding box para o jogador
    const playerBox = new THREE.Box3().setFromObject(playerBalloon);
    
    // Verificar colisão com o terreno/obstáculos
    gameMap.traverse(function(child) {
        if (child.isMesh && child.geometry) {
            const obstacleBox = new THREE.Box3().setFromObject(child);
            
            if (playerBox.intersectsBox(obstacleBox)) {
                //handleCollision();
				//console.log("Colidiu");
                return;
            }
        }
    });
}*/

function checkCollision(newPosition) {
  if (!colisao || !objetivo || !newPosition) return false; // Verifique se newPosition e colisao existem

  const raycaster = new THREE.Raycaster();
  const directions = [
    new THREE.Vector3(0, 0, 0), // direita
    new THREE.Vector3(0, 0, 0), // esquerda
    new THREE.Vector3(0, 0, 4), // frente
    new THREE.Vector3(0, 0, 0), // trás
  ];

  for (let dir of directions) {
    raycaster.set(newPosition, dir.clone().normalize()); // Normalize a direção
    const intersects = raycaster.intersectObjects(colisao.children, true);
    if (intersects.length > 0 && intersects[0].distance < 4) {	  
      return true;
    }
  }
  
  const box = new THREE.Box3().setFromObject(objetivo);		
  const box1 = new THREE.Box3().setFromObject(playerBalloon);				
  box1.expandByScalar(-1);		

  if (box.intersectsBox(box1)) {
	if(colidiu) return;
	colidiu = true;	
	checkAtual++;
	if(checkAtual == 10){ 
		loopCount++; checkAtual = 0;
		if(loopCount == 6) checkGameEnd();
	}
	const audioCheck = new Audio('assets/check.mp3');
	audioCheck.play();
	objetivo.position.x = posChecks[checkAtual].x;
	objetivo.position.y = posChecks[checkAtual].y;
	objetivo.position.z = posChecks[checkAtual].z;
    setTimeout(() => {
		colidiu = false;
	}, 1000);	
      
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
        if(gameState === 'fase')document.getElementById('speed').textContent = (Math.round((moveSpeed)*100) > 0) ? Math.round((moveSpeed)*150) : 0;
        document.getElementById('altitude').textContent = loopCount+'/6';
    }
}

function animate() {
   /*if (gameState !== 'playing' && gameState !== 'menu' ) return;*/
    
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    // Atualizar animações
    if (mixer) mixer.update(delta);
	if (objetivoMixer) {
		objetivoMixer.update(delta);
	}
    mixers.forEach(m => m.update(delta));
	
    // Atualizar movimento do jogador
    updatePlayerMovement();
    
    // Atualizar oponentes
    updateOpponents();
    
    // Atualizar câmera
    updateCamera();
    
    // Verificar colisões
    checkCollision();
    
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


