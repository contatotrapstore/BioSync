// Variáveis globais do jogo
let scene, camera, renderer, loader;
let foguete, fogo, chegada, planeta, musica, efeitoNave, opponentBalloons = [];
let gameMap;
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
let asteroids = [];
let lastAsteroidSpawnTime = 0;
const actions = [];
let currentAction;
let acelerando = null;
let direcaoDireita = null;
let direcaoEsquerda = null;
let distanciaPercorrida = 0;
let alturaAsteroide = 12;
let asteroides = [];

const raycaster = new THREE.Raycaster();
const direction = new THREE.Vector3(1, 0, 0);

// Variável para armazenar o modelo do asteroide pré-carregado
let asteroidModel = null;

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
    { name: 'map', url: 'assets/espaco2.gltf' },		
    { name: 'foguete', url: 'assets/foguete4.gltf?3' },	
	{ name: 'fogo', url: 'assets/fogo.gltf' },
	{ name: 'asteroide', url: 'assets/asteroide2.gltf' },
	{ name: 'planeta', url: 'assets/planeta.gltf' }
	/*{ name: 'chegada', url: 'assets/chegada.gltf' }
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
    scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
	scene.background = new THREE.Color('#000');

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
    // Luz ambiente
    /*const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    // Luz direcional (sol)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    // Luz hemisférica para iluminação suave
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x98FB98, 0.4);
    scene.add(hemisphereLight);*/
	// Luz ambiente - simula a luz difusa do céu
	const ambientLight = new THREE.AmbientLight(0x404040, 2.0);
	scene.add(ambientLight);
	
	// Luz direcional principal - simula o sol
	const directionalLight = new THREE.DirectionalLight(0xffffff, 5.0);
	directionalLight.position.set(10, 10, 5);
	directionalLight.castShadow = true;
	
	// Configurar sombras
	directionalLight.shadow.mapSize.width = 2048;
	directionalLight.shadow.mapSize.height = 2048;
	directionalLight.shadow.camera.near = 0.5;
	directionalLight.shadow.camera.far = 50;
	directionalLight.shadow.camera.left = -10;
	directionalLight.shadow.camera.right = 10;
	directionalLight.shadow.camera.top = 10;
	directionalLight.shadow.camera.bottom = -10;
	
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
                
                // Pré-processar o modelo do asteroide durante o carregamento
                if (asset.name === 'asteroide') {
                    prepareAsteroidModel(gltf);
                }
                
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

// Nova função para preparar o modelo do asteroide durante o carregamento
function prepareAsteroidModel(gltf) {
    // Criar uma instância do modelo do asteroide e configurá-la
    /*asteroidModel = gltf.scene.clone();
    asteroidModel.scale.set(0.2, 0.2, 0.2);
    
    // Configurar sombras para o modelo base
    asteroidModel.traverse(function(child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    
    console.log('Modelo do asteroide pré-carregado e configurado');*/
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
	
	efeitoNave = new Audio('assets/efeitonave.mp3');
    
    // Botões de jogar novamente
    playAgainWinButton.addEventListener('click', restartGame);
    playAgainLoseButton.addEventListener('click', restartGame);
    
    // Controles do teclado
	document.addEventListener('keydown', function(event) {
		if (gameState !== 'fase') return;
		if (event.keyCode === 126 || event.keyCode === 32) {
			acelerar();
		} else if (event.keyCode === 127) {
			parar();
		}
		if (event.keyCode === 37) {
			esquerda();
		} else if (event.keyCode === 39) {
			direita();
		}
	});
	
	document.addEventListener('keyup', function(event) {
		if (gameState !== 'fase') return;
		if (event.keyCode === 32) {
			parar();
		}else if (event.keyCode === 37) {
			direcaoEsquerda = false;
		} else if (event.keyCode === 39) {
			direcaoDireita = false;
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
	
	pararAudios();
    startTime = Date.now();
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        updateTimerDisplay();
    }, 1000);
	musica = new Audio('assets/musicaespaco2.mp3');
	musica.loop = true; // Ativa o loop
	musica.volume=0.5;
	musica.play(); // Inicia a reprodução da música	
	audiosDinamicos.push(musica);
	gameState = 'fase';	
	gameEnded = false; // Reset do controle de fim de jogo
	foguete.position.set(0, 0, 0);
	foguete.rotation.x = 5.61;
	foguete.rotation.y = 1;
	foguete.rotation.z = 7;
	//toggleVisibilidade();
	fogo.visible=false;
	efeitoNave.pause();
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
	gameMap.position.y=20;
	menuScreen.style.display = 'none';    
    gameHUD.style.display = 'block';
    instructions.style.display = 'block';
	camera.position.set(foguete.position.x+5, foguete.position.y+1, foguete.position.z);
	
}

function resetarAsteroide(){
	asteroide.rotation.y = 0;
	asteroide.position.z = foguete.position.z;
	asteroide.position.y = alturaAsteroide;
	asteroide.scale.set(0.1,0.1,0.1);	
}

function restartGame() {
    // Esconder telas de fim de jogo
    winScreen.style.display = 'none';
    loseScreen.style.display = 'none';
    distanciaPercorrida = 0;
	resetarAsteroide();
	acelerando = false;
	fogo.visible = false;	
	
    // Resetar variáveis do jogo
	isColliding=false;
    gameEnded = false;
    moveSpeed = 0.0010;
    clearInterval(timerInterval);
    elapsedTime = 0;
    updateTimerDisplay();
	
	for (let i = 0; i < asteroides.length; i++) {
			
		const asteroid = asteroides[i];
		asteroid.position.y = 7*(i+1);		
		
	}
	
	iniciarFase();
	//window.location.reload();
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
function carregarModelo(path) {
  if (foguete) {
    scene.remove(foguete);
  }
  loader.load(path, (gltf) => {
    foguete = gltf.scene;
    scene.add(foguete);
  });
}


function acelerar(){	
	//if(acelerando == false) carregarModelo('assets/foguete3.gltf');
	if(acelerando == true) return;
	acelerando = true;    
	fogo.visible = true;
	efeitoNave.loop = true; // Ativa o loop
	efeitoNave.volume=0.5;
	efeitoNave.play(); // Inicia a reprodução da música		
}

function parar(){	
	if(acelerando == false) return;
	acelerando = false;
	fogo.visible = false;
	efeitoNave.pause();		
}

function esquerda(){	
	direcaoDireita = false;
	direcaoEsquerda = true;
	//foguete.position.z += 0.4;	
    //console.log("Esquerda");	
}

function direita(){	
	direcaoEsquerda = false;
	direcaoDireita = true;	
	//console.log("Direita");
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
	console.log('Versão 1.2');
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
        gameMap.position.set(0, 0, 5);
        
        // Configurar sombras para o mapa
        gameMap.traverse(function(child) {
            if (child.isMesh) {
                child.receiveShadow = true;
                child.castShadow = true;
            }
        });
        
        scene.add(gameMap);
    }
	
	
    
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
	
	/*if (loadedAssets.fogo) {
        fogo = loadedAssets.fogo.scene.clone();
        fogo.scale.set(0.4, 0.4, 0.4);
        fogo.position.set(0, 0, -4);
		fogo.rotation.x = 4;
        
        // Configurar sombras
        fogo.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        //scene.add(fogo);
		
		// Configurar animação do jogador
        if (loadedAssets.fogo.animations.length > 0) {
            mixer = new THREE.AnimationMixer(fogo);
            const flyAnimation = loadedAssets.fogo.animations.find(anim => 
                anim.name.toLowerCase().includes('fogo') || anim.name.toLowerCase().includes('fly')
            );
            
            if (flyAnimation) {
                const action = mixer.clipAction(flyAnimation);
                action.play();
            } else if (loadedAssets.fogo.animations[0]) {
                // Se não encontrar animação 'voar', usar a primeira disponível
                const action = mixer.clipAction(loadedAssets.fogo.animations[0]);
                action.play();
            }
        }
    }*/
    
	
	
    // Carregar balão do jogador
    if (loadedAssets.foguete) {
        foguete = loadedAssets.foguete.scene.clone();
        foguete.scale.set(0.8, 0.8, 0.8);
        foguete.position.set(-20, -20, -20);
		//foguete.rotation.x = -8;		
		foguete.rotation.x = 5.55;
		foguete.rotation.y = 24;
		foguete.rotation.z = 7;
        
        // Configurar sombras
        foguete.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
		//foguete.add(fogo);
		
        scene.add(foguete); 

		/*if (loadedAssets.foguete.animations.length > 0) {
			mixer = new THREE.AnimationMixer(foguete);
			const parar = loadedAssets.foguete.animations.find(anim => 
				anim.name.toLowerCase().includes('parar') || anim.name.toLowerCase().includes('fly')
			);
			
			if (parar) {
				const action = mixer.clipAction(parar);
				actions.push(action);
				console.log('Parar');
			}/* else if (loadedAssets.foguete.animations[0]) {
				// Se não encontrar animação 'voar', usar a primeira disponível
				const action = mixer.clipAction(loadedAssets.foguete.animations[0]);
				actions.push(action);
			}
		}*/

		/*if (loadedAssets.foguete.animations.length > 0) {
			mixer = new THREE.AnimationMixer(foguete);
			const voar = loadedAssets.foguete.animations.find(anim => 
				anim.name.toLowerCase().includes('fogo') || anim.name.toLowerCase().includes('fly')
			);
			
			if (voar) {
				const action = mixer.clipAction(voar);
				actions.push(action);
				console.log('Voar');
			} else if (loadedAssets.foguete.animations[0]) {
				// Se não encontrar animação 'voar', usar a primeira disponível
				const action = mixer.clipAction(loadedAssets.foguete.animations[0]);
				actions.push(action);
				console.log('Voar');
			}
		}	
		
			
		
		currentAction = actions[0];
		currentAction.play();*/	
		
        
    }
	
	if (loadedAssets.fogo) {
        fogo = loadedAssets.fogo.scene.clone();
        fogo.scale.set(0.8, 0.8, 0.8);
        fogo.position.set(-20, -20, -20);
		//foguete.rotation.x = -8;		
		fogo.rotation.x = 5.55;
		fogo.rotation.y = 24;
		fogo.rotation.z = 7;
        
        // Configurar sombras
        fogo.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

		       
		
		
        scene.add(fogo); 

		/*if (loadedAssets.foguete.animations.length > 0) {
			mixer = new THREE.AnimationMixer(foguete);
			const parar = loadedAssets.foguete.animations.find(anim => 
				anim.name.toLowerCase().includes('parar') || anim.name.toLowerCase().includes('fly')
			);
			
			if (parar) {
				const action = mixer.clipAction(parar);
				actions.push(action);
				console.log('Parar');
			}/* else if (loadedAssets.foguete.animations[0]) {
				// Se não encontrar animação 'voar', usar a primeira disponível
				const action = mixer.clipAction(loadedAssets.foguete.animations[0]);
				actions.push(action);
			}
		}*/

		if (loadedAssets.fogo.animations.length > 0) {
			mixer = new THREE.AnimationMixer(fogo);
			const voar = loadedAssets.fogo.animations.find(anim => 
				anim.name.toLowerCase().includes('fogo') || anim.name.toLowerCase().includes('fly')
			);
			
			if (voar) {
				const action = mixer.clipAction(voar);
				actions.push(action);
				//console.log('Voar');
			} else if (loadedAssets.fogo.animations[0]) {
				// Se não encontrar animação 'voar', usar a primeira disponível
				const action = mixer.clipAction(loadedAssets.fogo.animations[0]);
				actions.push(action);
				//console.log('Voar');
			}
		}		
		
			
		
		currentAction = actions[0];
		currentAction.play();
		
        
    }
	
	if (loadedAssets.asteroide) {
		for(var i=1; i<5; i++){
		  //console.log('Criando asteroide ' + i);
		  asteroide = loadedAssets.asteroide.scene.clone();
		  asteroide.scale.set(0.1,0.1,0.1);
		  asteroide.position.set(0, 7*i, Math.random() * 10-5);
		  // Configurar sombras
		  asteroide.traverse(function(child) {
			if (child.isMesh) {
			  child.castShadow = true;
			  child.receiveShadow = true;
			}
		  });
		  scene.add(asteroide);
		  asteroides.push(asteroide);
		  //console.log('Asteroide adicionado ao array');
		}

		//console.log('Comprimento do array asteroides: ' + asteroides.length);
	}
	
	if (loadedAssets.planeta) {		
	  //console.log('Criando asteroide ' + i);
	  planeta = loadedAssets.planeta.scene.clone();
	  planeta.scale.set(10,10,10);
	  planeta.position.set(-26, 320, 0);
	  // Configurar sombras
	  asteroide.traverse(function(child) {
		if (child.isMesh) {
		  child.castShadow = true;
		  child.receiveShadow = true;
		}
	  });
	  scene.add(planeta);	  
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

// Função otimizada para criar asteroides usando o modelo pré-carregado
/*function createAsteroid() {
    if (asteroidModel) {
        // Clonar o modelo pré-carregado ao invés de carregar novamente
        const asteroid = asteroidModel.clone();
        asteroid.position.set(foguete.position.x+0.5, 12, Math.random() * 10);
        
        // Adicionar à cena
        scene.add(asteroid);
        asteroids.push(asteroid);

        // Configurar animações do asteroide se existirem
        if (loadedAssets.asteroide && loadedAssets.asteroide.animations.length > 0) {
            const asteroidMixer = new THREE.AnimationMixer(asteroid);
            loadedAssets.asteroide.animations.forEach(clip => {
                asteroidMixer.clipAction(clip).play();
            });
            mixers.push(asteroidMixer);
        }
        
        console.log('Asteroide criado usando modelo pré-carregado');
    } else {
        console.warn('Modelo do asteroide não foi pré-carregado corretamente');
    }
}*/

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
    if (foguete) {
        camera.position.set(0, 0, 30);
		var objectRotation = foguete.rotation;
        camera.lookAt(foguete.position);
		//camera.rotation.x = objectRotation.x;
		//camera.rotation.y = objectRotation.y;
		//camera.rotation.z ++;
        camera.lookAt(foguete.position);
    }
}

function updatePlayerMovement() {
    if (!foguete || isColliding) return;
    
    
	if (gameState !== 'fase')foguete.rotation.y += 0.002;
	foguete.position.y += (gameState !== 'fase') ? moveSpeed*2 : moveSpeed/2;
	if(gameState==='fase')
	{
		planeta.rotation.y += 0.0002;
		//console.log(planeta.position.y);
		planeta.position.y -= (acelerando) ? 0.02 : 0;
		camera.position.z+=0.2;
		camera.position.y+=0.2;		
		gameMap.position.y -= (acelerando) ? 0.5 : 0.015;
		distanciaPercorrida += (acelerando) ? 5 : 0.005;
		if(gameMap.position.y < -164){
			gameMap.position.y = 30;
			//console.log("VoltouMapa");
		}
		if(direcaoEsquerda) foguete.position.z += 0.01;
		if(direcaoDireita) foguete.position.z -= 0.01;

		/*asteroide.position.y -= (acelerando) ? 0.03 :0.007;
		asteroide.rotation.y += 0.02;
		//console.log(asteroide.position);
		if (asteroide.position.y < -10) {	
			resetarAsteroide();
		}*/

        // Movimento e destruição dos asteroides
		/*asteroides.forEach((modelo, index) => {		
			modelo.position.y -= (acelerando) ? 0.03 :0.007;
			modelo.rotation.y += 0.02;
			if (modelo.position.y < -10) {	
				modelo.rotation.y = 0;
				modelo.position.z = foguete.position.z;
				modelo.position.y = alturaAsteroide/index;
				modelo.scale.set(0.1,0.1,0.1);
            }
		});*/		
        for (let i = 0; i < asteroides.length; i++) {
			
            const asteroid = asteroides[i];
            asteroid.position.y -= (acelerando) ? 0.03 :0.007;
			asteroid.rotation.y += 0.02;
			//console.log(asteroid.position);
            if (asteroid.position.y < -10) {	
				asteroid.rotation.y = 0;
				asteroid.position.z = foguete.position.z+(Math.random() * 10-5);
				asteroid.position.y = alturaAsteroide+7;
				asteroid.scale.set(0.1,0.1,0.1);
            }
        }
	}else{
		gameMap.position.y -= 1;					
		if(gameMap.position.y < -163)gameMap.position.y = 30;
	}
	
    if (gameState === 'fase' && !gameEnded && distanciaPercorrida >= 70000) {
        if(!gameEnded)checkGameEnd();
    }
	
    /*if (keys.up) {
        moveSpeed+=0.001;
    }
    if (keys.down) {f
        moveSpeed-=0.001;
    }*/
    
    // Limitar altura mínima
    /*if (foguete.position.y < 2) {
        foguete.position.y = 2;
    }*/
    
    // Atualizar HUD
    updateHUD();
}

function checkGameEnd() {
    gameEnded = true;
	//gameState = "end";
	//toggleVisibilidade();	
    
    // Verificar se algum oponente já passou da altura 300
    /*let opponentWon = false;
    for (let opponent of opponentBalloons) {
        if (opponent.position.y >= 35) {
            opponentWon = true;
            break;
        }
    }*/
    //console.log(isColliding);
	
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
	/*if (foguete) {
	  // Posição da câmera relativa ao veículo
	  if (gameState !== 'fase') offset = new THREE.Vector3(10+camPos[0], 17+camPos[1], 12+camPos[2]);
	  else offset = new THREE.Vector3(0, 0, 0);
	  console.log(offset);
	  // Não aplicar a quaternião do veículo para manter a orientação da câmera fixa
	  camera.position.set(1,1,1);
	  //camera.position.copy(foguete.position).add(offset);
	  //camera.position.set(camPos[0],camPos[1],camPos[2]);
	  camera.lookAt(foguete.position);
	}*/
    if (foguete) {
		//if(gameState == 'fase')moveSpeed+=(moveSpeed < 0.05) ? 0.002 : 0;
        // Câmera segue o balão incluindo rotação
        //offset = new THREE.Vector3(0, 5, 15);
		if (gameState !== 'fase') offset = new THREE.Vector3(0, 5, 15);
		else offset = new THREE.Vector3(1, 0, 0);
        
        // Aplicar a rotação do balão ao offset da câmera
        offset.applyQuaternion(foguete.quaternion);
        
		if (gameState !== 'fase')camera.position.set(foguete.position.x+3, foguete.position.y-3.5, foguete.position.z+1);
		else camera.position.set(foguete.position.x+10, foguete.position.y-(3+moveSpeed), foguete.position.z);
		
		if (gameState == 'fase'){
			camera.rotation.y = 10;
			//camera.rotation.x = 20;
		}
		
		const target = new THREE.Vector3(0, 10, 10);
		
        // Posição da câmera baseada na posição do balão + offset rotacionado
        const targetPosition = new THREE.Vector3().addVectors(target, offset);
        
        camera.position.lerp(targetPosition, 0.1);
        camera.lookAt(foguete.position);		
		
    }
}

function checkCollisions() {
    if (!foguete || !gameMap || isColliding) return;
    
    // Criar bounding box para o jogador
    const playerBox = new THREE.Box3().setFromObject(foguete);
    playerBox.expandByScalar(-1);
    // Verificar colisão com o terreno/obstáculos
	
	// Verificar colisão com as pedras (se ainda existirem)
	asteroides.forEach(opponent => {
        const opponentBox = new THREE.Box3().setFromObject(opponent);
        if (playerBox.intersectsBox(opponentBox)) {
            isColliding = true;
				if(!gameEnded)checkGameEnd();
                return;
        }
    });
	
	
    /*asteroides.traverse((object) => {
        if (object.isMesh) {
            const box = new THREE.Box3().setFromObject(object);
            if (playerBox.intersectsBox(box)) {
                handleCollision();
            }
        }
    });*/
	
    /*asteroide.traverse(function(child) {
        if (child.isMesh && child.geometry) {
            const obstacleBox = new THREE.Box3().setFromObject(child);
            
            if (playerBox.intersectsBox(obstacleBox)) {
                //handleCollision();
				//console.log("Colidiu");
				isColliding = true;
				if(!gameEnded)checkGameEnd();
                return;
            }
        }
    });*/
}

function handleCollision() {
    if (isColliding) return;
    
    isColliding = true;
    
    // Pausar animação do jogador
    if (mixer) {
        mixer.timeScale = 0;
    }
    
    // Resetar apenas a altura para altura inicial, mantendo posição X e Z atual
    if (foguete) {
        //foguete.position.y = alturaInicial;
		//foguete.rotation.y -= 5;
        
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
    if (foguete) {
		const formato = Math.round(distanciaPercorrida).toLocaleString('pt-BR'); // pt-BR é o código de localidade para português do Brasil	
        document.getElementById('speed').textContent = (moveSpeed*100).toFixed(3);
        document.getElementById('altitude').textContent = formato;
    }
}

function toggleVisibilidade() {
	fogo.visible = !fogo.visible;	
	if(fogo.visible){		
		efeitoNave.loop = true; // Ativa o loop
		efeitoNave.volume=0.5;
		efeitoNave.play(); // Inicia a reprodução da música	
		return;
	}
	efeitoNave.pause();
}

function animate() {
    /*if (gameState !== 'playing' && gameState !== 'menu' ) return;*/

	fogo.position.copy(foguete.position);
	fogo.rotation.copy(foguete.rotation);

    if (gameState === 'fase' && (clock.elapsedTime - lastAsteroidSpawnTime > 10)) {
        //createAsteroid();
        lastAsteroidSpawnTime = clock.elapsedTime;
    }
    
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    // Atualizar animações
    if (mixer) mixer.update(delta);
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

