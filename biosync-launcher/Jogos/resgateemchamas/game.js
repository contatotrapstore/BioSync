// Variáveis globais do jogo
let scene, camera, renderer, loader;
let playerBalloon, cidade, agua, caminhao, musica, audioCaminhao, audioAgua, opponentBalloons = [];
let gameMap;
let mixer, mixer2, mixer3, acaoAgua,animacaoCaminhao, mixers = [];
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
let caminhaos =  new THREE.Group();
let aproximar = false;
let afastar = false;
let movendoCaminhao = false;
let progresso = 0;
let predioAtual = 0;
let posCamera = [
	{x:10,y:2,z:40},
	{x:30,y:6,z:20},
	{x:35,y:6,z:15},
	{x:35,y:15,z:15}	
];

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
    { name: 'map', url: 'assets/fogo.gltf?2' },
	{ name: 'agua', url: 'assets/agua2.gltf?2' },   
	{ name: 'cidade', url: 'assets/cidade2.gltf?2' },
	{ name: 'caminhao', url: 'assets/caminhao3.gltf?2' }
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
    scene.fog = new THREE.Fog(0x87CEEB, 20, 60);
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
	const ambientLight = new THREE.AmbientLight(0x404040, 5.0);
	scene.add(ambientLight);
	
	// Luz direcional principal - simula o sol
	const directionalLight = new THREE.DirectionalLight(0xffffff, 5.0);
	directionalLight.position.set(10, 10, 5);
	directionalLight.castShadow = true;
	
	/*// Configurar sombras
	directionalLight.shadow.mapSize.width = 2048;
	directionalLight.shadow.mapSize.height = 2048;
	directionalLight.shadow.camera.near = 0.5;
	directionalLight.shadow.camera.far = 50;
	directionalLight.shadow.camera.left = -10;
	directionalLight.shadow.camera.right = 10;
	directionalLight.shadow.camera.top = 10;
	directionalLight.shadow.camera.bottom = -10;
	
	scene.add(directionalLight);*/
	
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
		if (event.keyCode === 38 || event.keyCode === 126) {
			subindo = true;
		}
		if (event.keyCode === 40 || event.keyCode === 127) {
			subindo = false;
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
	
	caminhao.position.set(-21.79, -5, -7);
	gameMap.children[0].position.set(0, 0, 0);
	predioAtual = 1;
	progresso = 0;
	gameMap.children[0].visible = true;
	subindo = false;
	movendoCaminhao = false;
	agua.visible = false;
	gameMap.visible = true;
	
	//console.log(caminhaos);
	/*gameMap.traverse((object) => {	  
		object.position.y = 0;	  
	});*/
	aproximar = true;
	afastar = false;
	
	pararAudios();
    startTime = Date.now();
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        updateTimerDisplay();
    }, 1000);	
	
	musica = new Audio('assets/musicabombeiro.mp3');
	musica.loop = true; // Ativa o loop
	musica.volume = 0.5;
	musica.play(); // Inicia a reprodução da música	
	
	audioCaminhao = new Audio('assets/caminhao.mp3');	
	audioCaminhao.volume = 0.3;
	audioCaminhao.loop = true; // Ativa o loop
	audioCaminhao.play();
	
	audioAgua = new Audio('assets/agua.mp3');	
    audioAgua.volume = 0.1;
	audioAgua.loop = true; // Ativa o loop	
	
	audiosDinamicos.push(musica);
	gameState = 'fase';	
	gameEnded = false; // Reset do controle de fim de jogo
	/*gameMap.position.x = 0;
	gameMap.position.z = -3;*;
	/*playerBalloon.position.set(12, 2, 0);
	
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
	});*/
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
	console.log('Versão 1.3');
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
        gameMap.position.set(-2, -15, 30);
		gameMap.rotation.set(0, 20, 0);
        
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
		
		scene.add(gameMap);
    }
    
	
	if (loadedAssets.cidade) {
        cidade = loadedAssets.cidade.scene.clone();
		cidade.scale.set(2, 2, 2);
        cidade.position.set(-3.2, -5.5, -6.7);
		cidade.rotation.y = 20;
		// Configurar sombras
        cidade.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
		gameMap.add(cidade);	
		
		
	}
	
	if (loadedAssets.caminhao) {
        caminhao = loadedAssets.caminhao.scene.clone();
		caminhao.scale.set(1, 1, 1);
        caminhao.position.set(-21.79, -5, -7);
		caminhao.rotation.y = 20;
		// Configurar sombras
        caminhao.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
		
		// Configurar animações do Mapa
        if (loadedAssets.caminhao.animations.length > 0) {
		  mixer2 = new THREE.AnimationMixer(caminhao);
		  var i =0;
		  loadedAssets.caminhao.animations.forEach((animation) => {			  
			animacaoCaminhao = mixer2.clipAction(animation);
			animacaoCaminhao.timeScale = 2.3;
			animacaoCaminhao.loop = THREE.LoopOnce;
			animacaoCaminhao.clampWhenFinished = true;
			animacaoCaminhao.play();			
		  });
		}
				
		
	}
	
	if (loadedAssets.agua) {
        agua = loadedAssets.agua.scene.clone();
		agua.scale.set(1, 1, 1);
        agua.position.set(1.3, 3.7, 18.2);
		agua.rotation.y = 4.7;
		agua.rotation.x = -0.5;
		// Configurar sombras
        agua.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
		
		agua.visible = false;
		
		// Configurar animações do Mapa
        if (loadedAssets.agua.animations.length > 0) {
		  mixer3 = new THREE.AnimationMixer(agua);
		  loadedAssets.agua.animations.forEach((animation) => {
			acaoAgua = mixer3.clipAction(animation);			
			//acaoAgua.play();
		  });
		}
		caminhao.add(agua);
		gameMap.add(caminhao);	
		
		
	}
	
	
	/*if (loadedAssets.cidade) {
		const distancia=20;
		for(var i=1; i<9; i++){
			caminhao = loadedAssets.caminhao.scene.clone();
			caminhao.scale.set(2, 2, 2);
			caminhao.position.set((distancia*i), -10, (Math.floor(Math.random() * 11) - 5)+3);
			caminhao.rotation.y = 20;
			// Configurar sombras
			caminhao.traverse(function(child) {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});					
		    			
			caminhaos.add(caminhao);
			
		}		
		
		for(var i=1; i<10; i++){
			caminhao = loadedAssets.caminhao.scene.clone();
			caminhao.scale.set(2, 2, 2);
			caminhao.position.set((-distancia*i), -10, (Math.random() * 12 - 5));
			caminhao.rotation.y = 20;
			// Configurar sombras
			caminhao.traverse(function(child) {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});	
						
			caminhaos.add(caminhao);
			
		}
		
		gameMap.add(caminhaos);				
			
		scene.add(gameMap);
	}
	
	//Carregar cidade
	/*if (loadedAssets.caminhao) {
        const caminhao = loadedAssets.caminhao.scene.clone();
		caminhao.scale.set(2, 2, 2);
        caminhao.position.set(-50, 1, 0);
		caminhao.rotation.y = 20;
		// Configurar sombras
        caminhao.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
		
		caminhaos.push(caminhao);
		caminhaos.push(caminhao.clone());
		
		caminhaos[1].position.set(-60, 1, 10);
		
		
		for(var i=0;i<caminhaos.lenght; i++) gameMap.add(caminhaos[i]);	
		scene.add(gameMap);
	}*/
	
	/*if (loadedAssets.caminhao) {
		for(var i=1; i<=2; i++){
			const caminhao = loadedAssets.caminhao.scene.clone();
			caminhao.scale.set(1, 1, 1);
			caminhao.position.set(-30+i, 1, 0);
			caminhao.rotation.y = 20;
			// Configurar sombras
			caminhao.traverse(function(child) {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});
			caminhaos.push(caminhao);
			gameMap.add(caminhaos[i]);	
			console.log('Criou caminhao '+i);
		}
		scene.add(gameMap);
	}*/
	
    // Carregar balão do jogador
    /*if (loadedAssets.player) {
        playerBalloon = loadedAssets.player.scene.clone();
        playerBalloon.scale.set(1, 1, 1);
        playerBalloon.position.set(10, 3, 0);
        
        // Configurar sombras
        playerBalloon.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        scene.add(playerBalloon);
		
		// Configurar animação do jogador
        if (loadedAssets.player.animations.length > 0) {
		  mixer2 = new THREE.AnimationMixer(playerBalloon);
		  loadedAssets.player.animations.forEach((animation) => {
			const action = mixer2.clipAction(animation);
			action.play();			
		  });
		}
        
        // Configurar animação do jogador
        /*if (loadedAssets.player.animations.length > 0) {
            mixer = new THREE.AnimationMixer(playerBalloon);
            const flyAnimation = loadedAssets.player.animations.find(anim => 
                anim.name.toLowerCase().includes('voar') || anim.name.toLowerCase().includes('fly')
            );
            
            if (flyAnimation) {
                const action = mixer.clipAction(flyAnimation);
                action.play();
            } else if (loadedAssets.player.animations[0]) {
                // Se não encontrar animação 'voar', usar a primeira disponível
                const action = mixer.clipAction(loadedAssets.player.animations[0]);
                action.play();
            }
        }
    }*/
    
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
    
	camera.position.set(0, 0, 10);
	//var objectRotation = playerBalloon.rotation;
	camera.lookAt(gameMap.position);
	//camera.rotation.x = objectRotation.x;
	//camera.rotation.y = objectRotation.y;
	//camera.rotation.z ++;
	camera.lookAt(gameMap.position);
    
}

function updatePlayerMovement() {   	

	switch(predioAtual){
		case 2:			
			if(caminhao.position.x < -8.5){
				movendoCaminhao = true;
				caminhao.position.x+=0.1;
				caminhao.position.z+=0.04;									
			}
			else movendoCaminhao = false;
			break;
		case 3:
			if(caminhao.position.x < 5){
				movendoCaminhao = true;
				caminhao.position.x+=0.1;
				caminhao.position.z+=0.05;									
			}
			else movendoCaminhao = false;
			break;
		case 4:
			console.log(predioAtual+' - '+caminhao.position.x);
			if(caminhao.position.x < 20){
				movendoCaminhao = true;
				caminhao.position.x+=0.1;
				caminhao.position.z+=0.05;									
			}
			else movendoCaminhao = false;			
			break;		
	}
	
	
			
	
   
	if(progresso > 10 && predioAtual == 1){
		predioAtual ++;		
		gameMap.children[0].visible = false;
		setTimeout(() => {			
			gameMap.children[0].position.x += 15;
			gameMap.children[0].position.z += 5;
			gameMap.children[0].visible = true;
		}, 1000);
	}
	
	if(progresso > 35 && predioAtual == 2){
		predioAtual ++;		
		gameMap.children[0].visible = false;
		setTimeout(() => {			
			gameMap.children[0].position.x += 14;
			gameMap.children[0].position.z += 6;
			gameMap.children[0].visible = true;
		}, 2000);
	}
	
	if(progresso > 70 && predioAtual == 3){
		predioAtual ++;		
		gameMap.children[0].visible = false;
		setTimeout(() => {			
			gameMap.children[0].position.x += 15;
			gameMap.children[0].position.z += 5;
			gameMap.children[0].visible = true;
		}, 1000);
	}
	
	/*if(progresso > 100 && predioAtual == 4){
		predioAtual ++;		
		gameMap.children[0].visible = false;
		setTimeout(() => {			
			gameMap.children[0].position.x += 15;
			gameMap.children[0].position.z += 5;
			gameMap.children[0].visible = true;
		}, 1000);
	}*/
   
    if(progresso > 100 && !gameEnded){
		agua.visible = false;
		gameMap.children[0].visible = false;
		cidade = false;
		gameEnded = true;
		if(audioAgua)audioAgua.pause();
		audioCaminhao.pause();		
		setTimeout(() => {
			checkGameEnd();
		}, 1000);		
	}
   
	if (animacaoCaminhao.time == animacaoCaminhao._clip.duration && !gameEnded) {		
		if(subindo && !movendoCaminhao){
			if(audioAgua)audioAgua.play();
			agua.visible = true;
			acaoAgua.play();
			progresso += (progresso < 100.5) ? 0.02 : 0;
		}
		else{
			if(audioAgua)audioAgua.pause();
			agua.visible = false;
			acaoAgua.stop();
			//progresso -= (progresso > 0.05) ? 0.02 : 0;
		}
	}
    
    // Atualizar HUD
    updateHUD();
}

function checkGameEnd() {    
    
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
	//console.log("Teste");
	if(gameState !== 'fase'){
		const offset = new THREE.Vector3(2, 1, 5);
		
		rotationCamera += 0.006;
		const target = new THREE.Vector3(7+rotationCamera, -2, gameMap.position.z);
		
		// Posição da câmera baseada na posição do balão + offset rotacionado
		const targetPosition = new THREE.Vector3().addVectors(target, offset);
		
		camera.position.lerp(targetPosition, 0.1);
		camera.lookAt(gameMap.position);
	}else{
		
		camera.rotation.y = -10;
		/*const offset = new THREE.Vector3(3, 1, 5);
		
		if(aproximar && rotationCamera < 3)rotationCamera += 0.002;
		else if(aproximar && rotationCamera > 3){afastar = true; aproximar = false;}
		else if(afastar && rotationCamera > -1)rotationCamera -= 0.002;
		else if(afastar && rotationCamera < -1){afastar = false; aproximar = true;}
		
		//console.log(rotationCamera);
			
		
		const target = new THREE.Vector3(caminhao.position.x+20, -10, (caminhao.position.z+50));
		
		// Posição da câmera baseada na posição do balão + offset rotacionado
		const targetPosition = new THREE.Vector3().addVectors(target, offset);
		
		camera.position.lerp(caminhao.position, 0.1);
		camera.lookAt(gameMap.position);*/
		// Configurações da câmera de terceira pessoa
		const cameraDistance = 2;  // Distância da câmera ao player
		const cameraHeight = 2;    // Altura da câmera acima do player
		const cameraSmoothing = 0.1; // Suavidade do movimento da câmera (0.1 = suave, 1.0 = instantâneo)
		
		const target = new THREE.Vector3(posCamera[predioAtual-1].x,posCamera[predioAtual-1].y,posCamera[predioAtual-1].z);
		
		// Calcular posição ideal da câmera atrás do player
		const idealOffset = new THREE.Vector3(-10, -12, 10);
		
		// Aplicar a rotação do player ao offset da câmera
		//idealOffset.applyQuaternion(caminhao.quaternion);
		
		// Posição final da câmera
		const idealPosition = new THREE.Vector3().addVectors(target, idealOffset);
		
		// Ponto para onde a câmera deve olhar (ligeiramente acima do player)
		/*const lookAtTarget = new THREE.Vector3(
			caminhao.position.x + (2*predioAtual),
			caminhao.position.y - (30-(5*predioAtual)),
			caminhao.position.z - (2*predioAtual)
		);*/
		
		let lookAtTarget;
		
		if(predioAtual < 4){
			lookAtTarget = new THREE.Vector3(
			caminhao.position.x ,
			caminhao.position.y - 30,
			caminhao.position.z
			);		
		}else{		
			lookAtTarget = new THREE.Vector3(
			caminhao.position.x + 15,
			caminhao.position.y - 30,
			caminhao.position.z - 15
			);
		}
		
		// Suavizar o movimento da câmera
		camera.position.lerp(idealPosition, cameraSmoothing);
		
		// Fazer a câmera olhar para o player
		camera.lookAt(lookAtTarget);
	}
	
   
}

function checkCollisions() {
    /*if (!playerBalloon || !gameMap || isColliding) return;
    
    // Criar bounding box para o jogador
    /*const playerBox = new THREE.Box3().setFromObject(playerBalloon);
    
    // Verificar colisão com o terreno/obstáculos
    gameMap.traverse(function(child) {
        /*if (child.isMesh && child.geometry) {
            const obstacleBox = new THREE.Box3().setFromObject(child);
            
            if (playerBox.intersectsBox(obstacleBox)) {
                //handleCollision();
				//console.log("Colidiu");
                return;
            }
        }
		const box = new THREE.Box3().setFromObject(child);
		
		if (playerBox.intersectsBox(box)) {
		  console.log('Colisão detectada!');
		  // Faça algo quando a colisão for detectada
		}
    });
	
	playerBalloon.updateMatrixWorld(); // Atualize a matriz de transformação do modelo1
	
	caminhaos.traverse((object) => {
	  if (object.isMesh) {
		const box = new THREE.Box3().setFromObject(object);		
		const box1 = new THREE.Box3().setFromObject(playerBalloon);				
		box1.expandByScalar(-1);		
		
		if (box.intersectsBox(box1)) {
		  isColliding = true;
		  if(!gameEnded)checkGameEnd();
		  gameMap.position.x = -170;
		  gameMap.position.z = -3;
		  playerBalloon.position.set(12, 2, 0);
		}
	  }
	});
	
	
	gameMap.traverse((object) => {
	  //if(object.userData.id === 'caminhao') console.log("Nome :"+object.name);
	  if (object.isMesh && object.parent === caminhaos){
		// Crie uma bounding box para o objeto
		const box = new THREE.Box3().setFromObject(object);
		// Crie uma bounding box para o modelo1
		const box1 = new THREE.Box3().setFromObject(playerBalloon);
		// Verifique se as bounding boxes se intersectam
		if (box.intersectsBox(box1)) {
		  console.log("Nome :"+object.userData.id+" - "+object.name);
		  isColliding = true;
		  if(!gameEnded)checkGameEnd();
		  gameMap.position.x = -180;
		  gameMap.position.z = -3;
		  playerBalloon.position.set(12, 2, 0);
		  // Faça algo quando a colisão for detectada
		}
	  }
	});*/
}

function handleCollision() {
    /*if (isColliding) return;
    
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
    }, 3000);*/
}

function updateHUD() {    
    document.getElementById('speed').textContent = progresso.toFixed(1);    
	document.getElementById('altitude').textContent = predioAtual-1;
}

function animate() {
   /*if (gameState !== 'playing' && gameState !== 'menu' ) return;*/
    
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    // Atualizar animações
    if (mixer) mixer.update(delta);
	if (mixer2) mixer2.update(delta);
	if (mixer3) mixer3.update(delta);
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


