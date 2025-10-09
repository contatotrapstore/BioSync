// Variáveis globais do jogo
let scene, camera, renderer, loader;
let playerBalloon, chegada, pedra, musica, tanque, opponentBalloons = [];
let gameMap;
let mixer, mixer2,explosionMixer,mixers = [];
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
let gameEnded, pausado, acelerando = false; // Controle para evitar múltiplas verificações de fim de jogo
let pedras =  new THREE.Group();
let acaoTanque, acaoRodas, rodas, rodas2;
let isShooting = false;
let totalCount = 0;

// Sistema de tiro
let projectiles = []; // Array para armazenar os projéteis
let lastShotTime = 0; // Controle de tempo do último tiro
const SHOT_INTERVAL = 700; // Intervalo entre tiros em milissegundos
const PROJECTILE_SPEED = 0.5; // Velocidade dos projéteis
const startPositions = [
	{ x: -40, y: 0, z: Math.random() * 36 - 16 },
	{ x: -30, y: 0, z: Math.random() * 36 - 16 },
	{ x: -20, y: 0, z: Math.random() * 36 - 16 },
	{ x: -10, y: 0, z: Math.random() * 36 - 16 },
	{ x: 0, y: 0, z: Math.random() * 36 - 16 }
	
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
    { name: 'map', url: 'assets/mapa2.gltf?123' },
    { name: 'player', url: 'assets/tanque.gltf?123' },
	{ name: 'inimigo', url: 'assets/tanque2.gltf?123' },
	{ name: 'inimigo2', url: 'assets/tanque2.gltf?123' },
	{ name: 'inimigo3', url: 'assets/tanque2.gltf?123' },
	{ name: 'inimigo4', url: 'assets/tanque2.gltf?123' },
	{ name: 'inimigo5', url: 'assets/tanque2.gltf?123' },
	/*{ name: 'chegada', url: 'assets/rodas2.gltf' },
	{ name: 'rodas', url: 'assets/rodas2.gltf' },*/
	{ name: 'pedra', url: 'assets/pedra.gltf?123' },
	{ name: 'explosao', url: 'assets/explosao.gltf?1234' }
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
	
	// Configurar sombras
	/*directionalLight.shadow.mapSize.width = 2048;
	directionalLight.shadow.mapSize.height = 2048;*/
	directionalLight.shadow.camera.near = 0.5;
	directionalLight.shadow.camera.far = 50;
	directionalLight.shadow.camera.left = -200;
	directionalLight.shadow.camera.right = 200;
	directionalLight.shadow.camera.top = 200;
	directionalLight.shadow.camera.bottom = -2500;
	
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
		if (event.keyCode === 38) {
			/*if (loadedAssets.rodas.animations.length > 0) {
			  mixer = new THREE.AnimationMixer(rodas);
			  loadedAssets.rodas.animations.forEach((animation) => {
				acaoTanque = mixer.clipAction(animation);
				acaoTanque.time = 20; // corta a animação no ponto 0.5 segundos
				acaoTanque.play();	
			  });
			}*/
			acelerando = true;
			pausado = false;
			subir();
		}
		if (event.keyCode === 40) {
			acelerando = false;			
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
		if (event.keyCode === 126 || event.keyCode === 32) { // Barra de espaço						
			isShooting = true;			
		}
		if (event.keyCode === 127) { // Barra de espaço		
			
			isShooting = false;			
		}
	});
	
	document.addEventListener('keyup', function(event) {
		if (gameState !== 'fase') return;
		if (event.keyCode === 38) {
			//acelerando = false;
			pausado = true;
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
	
	acelerando = false;
	pausado = true;
	isShooting = false;
	totalCount = 0;
	
	//console.log(pedras);
	gameMap.traverse((object) => {	  
		object.position.y = 0;	  
	});
	
	pararAudios();
    startTime = Date.now();
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        updateTimerDisplay();
    }, 1000);
	
	// Iniciar tiro automático
	const autoShootInterval = setInterval(() => {
		if (gameState === 'fase') {
			shoot();
		} else {
			clearInterval(autoShootInterval);
		}
	}, SHOT_INTERVAL);
	
	musica = new Audio('assets/musicaguerra.mp3');
	musica.loop = true; // Ativa o loop
	musica.volume = 0.5;
	musica.play(); // Inicia a reprodução da música	
	
	tanque = new Audio('assets/tanque.mp3');
	tanque.loop = true; // Ativa o loop
	tanque.volume = 0.5;
	
	audiosDinamicos.push(musica);
	gameState = 'fase';	
	gameEnded = false; // Reset do controle de fim de jogo
	gameMap.position.x = -20;
	//gameMap.position.z = -3;
	playerBalloon.position.set(34.55, 0, -12.19);
	playerBalloon.rotation.y = -189.4;
	playerBalloon.visible = true;
	//oponentes	
	opponentBalloons.forEach((modelo, index) => {		
		modelo.position.set(
			startPositions[index].x,
			0,
			startPositions[index].z	
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
	
	// Limpar projéteis
	projectiles.forEach(projectile => {
		scene.remove(projectile);
	});
	projectiles = [];
	lastShotTime = 0;
	
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

// Função para atirar projéteis
function shoot() {	
    if (!playerBalloon || gameState !== 'fase' || gameEnded || !isShooting) return;
    
    const currentTime = Date.now();
    if (currentTime - lastShotTime < SHOT_INTERVAL) return; // Controle de intervalo
    
    lastShotTime = currentTime;
    
    // Criar esfera como projétil
    const projectileGeometry = new THREE.SphereGeometry(0.1, 1, 6);
    const projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
    
	const tiro = new Audio('assets/tiro.mp3');
	tiro.play();
    // Posicionar projétil na frente do tanque
    projectile.position.copy(playerBalloon.position);	
    projectile.position.y = 2; // Altura do canhão
    
    // Calcular direção baseada na rotação do tanque
    const direction = new THREE.Vector3(0, -0.02, 1);
    direction.applyQuaternion(playerBalloon.quaternion);
    
    // Adicionar propriedades ao projétil
    projectile.userData = {
        direction: direction,
        speed: PROJECTILE_SPEED,
        life: 100 // Vida útil do projétil (frames)
    };
    
    scene.add(projectile);
    projectiles.push(projectile);
}

// Função para atualizar projéteis
function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        
        // Mover projétil
        const movement = projectile.userData.direction.clone().multiplyScalar(projectile.userData.speed);
        projectile.position.add(movement);
        
        // Verificar colisão com inimigos
        let hitEnemy = false;
        for (let j = opponentBalloons.length - 1; j >= 0; j--) {
            const enemy = opponentBalloons[j];
            const distance = projectile.position.distanceTo(enemy.position);
            
            if (distance < 2) { // Distância de colisão
                hitEnemy = true;
                
                // Criar explosão na posição do inimigo
                createExplosion(enemy.position.clone());
				totalCount++;
                
                // Remover inimigo
				enemy.visible = false;				
                //scene.remove(enemy);
                //opponentBalloons.splice(j, 1);
				
				setTimeout(() => {					
					opponentBalloons[j].position.x = startPositions[j].x,
					opponentBalloons[j].position.y = startPositions[j].y,
					opponentBalloons[j].position.z = startPositions[j].z
					enemy.visible = true;		
				}, 4000); 
                
                break;
            }
        }
        
        // Reduzir vida útil
        projectile.userData.life--;
        
        // Remover projétil se colidiu ou vida útil acabou
        if (hitEnemy || projectile.userData.life <= 0) {
            scene.remove(projectile);
            projectiles.splice(i, 1);
        }
    }
}

// Função para criar explosão
function createExplosion(position) {
    if (!loadedAssets.explosao) return;
    
    const explosion = loadedAssets.explosao.scene.clone();
    explosion.position.copy(position);
    explosion.scale.set(5, 5, 5);
    
    scene.add(explosion);
	const explosao = new Audio('assets/explosao.mp3');
	explosao.play();
    
    // Configurar animação da explosão
    if (loadedAssets.explosao.animations.length > 0) {
        explosionMixer = new THREE.AnimationMixer(explosion);
        let maxDuration = 0;

        loadedAssets.explosao.animations.forEach((animation) => {
            const explosionAction = explosionMixer.clipAction(animation);
            explosionAction.setLoop(THREE.LoopOnce);
            explosionAction.clampWhenFinished = true;
			//explosionAction.timeScale = 1.2;
			explosionAction.time = 0.5;
            explosionAction.play();
            if (animation.duration > maxDuration) {
                maxDuration = animation.duration;
            }
        });
        
        // Adicionar mixer temporário para a explosão
        const explosionData = {
            mixer: explosionMixer,
            model: explosion,
            duration: maxDuration
        };
        
        // Remover explosão e mixer após a animação
        setTimeout(() => {
            scene.remove(explosion);
            /*const index = mixers.indexOf(explosionMixer);
            if (index > -1) {
                mixers.splice(index, 1);
            }*/
        }, explosionData.duration * 1000); // Ajuste o multiplicador conforme necessário para a duração da animação
        
        //mixers.push(explosionMixer);
    } else {
        // Se não há animação, remover explosão após 2 segundos
        setTimeout(() => {
            scene.remove(explosion);
        }, 2000);
    }
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
        gameMap.position.set(0, 0, 0);
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
		scene.add(gameMap);
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
		const distancia=15;
		for(var i=1; i<8; i++){
			pedra = loadedAssets.inimigo.scene.clone();
			
			pedra.position.set(((-distancia*i)+55), 0, (Math.random() * 50) - 20);
			// Configurar sombras
			pedra.traverse(function(child) {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});					
		    			
			pedras.add(pedra);
			//opponentBalloons.push(pewdra);
			
		}		
		
	}*/
	
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
        playerBalloon = loadedAssets.player.scene.clone();
        playerBalloon.scale.set(1, 1, 1);
        playerBalloon.position.set(20.47, 0, 5);
		playerBalloon.rotation.y = -188.51;
        
        // Configurar sombras
        playerBalloon.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
		
		/*rodas = loadedAssets.rodas.scene.clone();		
		
		rodas.position.clone(playerBalloon.position);
		rodas.rotation.clone(playerBalloon.rotation);
		
		rodas.scale.y = -1;
		rodas.position.y = 1;
		//rodas.rotation.y = 180;
		
		mixer = new THREE.AnimationMixer(rodas);
		  loadedAssets.rodas.animations.forEach((animation) => {
			acaoTanque = mixer.clipAction(animation);
			acaoTanque.time = 20; // corta a animação no ponto 0.5 segundos
			acaoTanque.play();	
		  });		  
		
		playerBalloon.add(rodas);*/
		
        scene.add(playerBalloon);
		
		// Configurar animação do jogador
        if (loadedAssets.player.animations.length > 0) {
		  mixer2 = new THREE.AnimationMixer(playerBalloon);
		  loadedAssets.player.animations.forEach((animation) => {
			acaoRodas = mixer2.clipAction(animation);
			acaoRodas.play();			
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
        }*/
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
    const opponentAssets = ['inimigo', 'inimigo2','inimigo3', 'inimigo4', 'inimigo5'];    
    
    opponentAssets.forEach((assetName, index) => {
        if (loadedAssets[assetName]) {
            const opponent = loadedAssets[assetName].scene.clone();
            opponent.scale.set(1, 1, 1);
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
            opponent.rotation.y = Math.random() * Math.PI * 2; // Rotação inicial aleatória
            opponent.userData.moveSpeed = 0.05 + Math.random() * 0.05; // Velocidade de movimento aleatória
            opponent.userData.rotationSpeed = (Math.random() - 0.5) * 0.02; // Velocidade de rotação aleatória
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
	
	//console.log('Posicao : ('+playerBalloon.position.x+' -'+playerBalloon.position.z+' - Rotação : '+playerBalloon.rotation.y); 
	
	if(gameState !== 'fase'){		
		let direcao = new THREE.Vector3(0, 0, 1);
		direcao.applyQuaternion(playerBalloon.quaternion);
		playerBalloon.position.add(direcao.multiplyScalar(0.08));
		playerBalloon.rotation.y -= 0.003;
	}
	
	//console.log(subindo);
	//console.log(acelerando);	
	if(acelerando){
		let direcao = new THREE.Vector3(0, 0, 1);
		direcao.applyQuaternion(playerBalloon.quaternion);
		const futurePosition = playerBalloon.position.clone().add(direcao.multiplyScalar(0.35));
		//console.log(futurePosition.x);
		if ((futurePosition.x > -78 && futurePosition.x < 36) &&
            (futurePosition.z > -21 && futurePosition.z < 36)) {
							
				playerBalloon.position.add(direcao.multiplyScalar(0.35));
				tanque.play();
			}
		else tanque.pause();
	}
	else if(gameState === 'fase')tanque.pause();
	
	if(direita) playerBalloon.rotation.y += 0.02;
	if(esquerda) playerBalloon.rotation.y -= 0.02;
	
	//gameMap.position.x+=0.02;
	//if(gameMap.position.x > 40)gameMap.position.x=0;		
    
	//playerBalloon.rotation.y += 0.002;	
	/*if(gameState !== 'fase')
		gameMap.position.x+=0.08;
	else if(subindo !== null)
		gameMap.position.x+= (subindo) ? 0.08 : 0;	*/
	
    
	
	
    
    if (gameState === 'fase' && !gameEnded && gameMap.position.x >= 200) {
		subindo = false;
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
	tanque.pause();
    
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
		document.getElementById('finalTanques').textContent = totalCount;
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
        // Movimento para frente baseado na rotação atual
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(opponent.quaternion);
        opponent.position.add(forward.multiplyScalar(opponent.userData.moveSpeed));

        // Verificar limites e inverter rotação
        const limitX = 30;
        const limitZ = 30;

        if (opponent.position.x < -78 || opponent.position.x > 33 ||
            opponent.position.z < -18 || opponent.position.z > 38) {
            opponent.rotation.y += Math.PI; // Inverte a rotação em 180 graus
            // Opcional: reposicionar ligeiramente para dentro do limite para evitar que fique preso
           /* if (opponent.position.x < -limitX) opponent.position.x = -limitX + -0.2;
            if (opponent.position.x > limitX) opponent.position.x = limitX -0.2;
            if (opponent.position.z < -limitZ) opponent.position.z = -limitZ +0.2;
            if (opponent.position.z > limitZ) opponent.position.z = limitZ -0.2;*/
        }

        // Rotação aleatória gradual
        opponent.rotation.y += opponent.userData.rotationSpeed;

        // Ajustar a velocidade de rotação aleatoriamente para um movimento mais orgânico
        if (Math.random() < 0.02) { // Pequena chance de mudar a rotação
            opponent.userData.rotationSpeed = (Math.random() - 0.5) * 0.05; // Nova velocidade de rotação
        }

        // Manter a altura do inimigo constante (ou ajustar conforme necessário)
        opponent.position.y = 0; // Ou outra altura desejada

    });
}

function updateCamera() {
    if (!playerBalloon) return;
    
    // Configurações da câmera de terceira pessoa
    const cameraDistance = 8;  // Distância da câmera ao player
    const cameraHeight = 9;    // Altura da câmera acima do player
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
}

function checkCollisions() {
    if (!playerBalloon || isColliding || gameState !== 'fase') return;

    // Criar bounding box para o jogador
    const playerBox = new THREE.Box3().setFromObject(playerBalloon);
	playerBox.expandByScalar(-1.5);	
    // Verificar colisão com os oponentes
    opponentBalloons.forEach(opponent => {
        const opponentBox = new THREE.Box3().setFromObject(opponent);
        if (playerBox.intersectsBox(opponentBox)) {
            handleCollision();
        }
    });

    // Verificar colisão com as pedras (se ainda existirem)
    pedras.traverse((object) => {
        if (object.isMesh) {
            const box = new THREE.Box3().setFromObject(object);
            if (playerBox.intersectsBox(box)) {
                handleCollision();
            }
        }
    });
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
    /*collisionTimeout = setTimeout(() => {
        if (mixer) {
            mixer.timeScale = 1;
        }
        isColliding = false;
    }, 3000);*/
	
	// Criar explosão na posição do inimigo
	createExplosion(playerBalloon.position.clone());
	
	// Remover inimigo
	playerBalloon.visible = false;
	
	collisionTimeout = setTimeout(() => {
        checkGameEnd();
    }, 1000);
}

function updateHUD() {
    if (playerBalloon) {
        document.getElementById('speed').textContent = totalCount;
        document.getElementById('altitude').textContent = totalCount;
    }
}

function animate() {
   /*if (gameState !== 'playing' && gameState !== 'menu' ) return;*/
    
    requestAnimationFrame(animate);
    
	if(explosionMixer)explosionMixer.update(clock.getDelta());
	if (!pausado) {
		//mixer.update(clock.getDelta());
		mixer2.update(clock.getDelta());		
		//mixers.forEach(m => m.update(delta))
	// adicione mais mixers aqui
	}
	
	
	
    const delta = clock.getDelta();
    
    // Atualizar animações
    /*if (mixer) mixer.update(delta);
	if (mixer2) mixer2.update(delta);
    mixers.forEach(m => m.update(delta));*/
    
    // Atualizar movimento do jogador
    updatePlayerMovement();
    
    // Atualizar projéteis
    updateProjectiles();
    
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




