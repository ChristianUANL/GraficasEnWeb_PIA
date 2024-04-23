import * as THREE from 'three';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
// import {Character} from '../character.js';
// import {PowerUp} from '../powerup.js';
// import { Sound } from '../sound.js';
// import { Cheese } from '../cheese.js';


// // // // // -- MUSIC -- //:TODO:descomentar 5 veces
// // // // //const sound = new Sound();
// // // // //sound.playMusic2D('/PROYECTO_GW/assets/sounds/gameplay.mp3');

// // // // // // --- PAUSE --- 
// // // // // let gamePaused = false;
// // // // // const pauseModal = new bootstrap.Modal(document.getElementById('pause-modal'));

// // // // // const pauseButton = document.getElementById('pause-button');
// // // // // pauseButton.addEventListener('click', function () { 
// // // // //     gamePaused = true;
// // // // //     pauseModal.show();

// // // // // });

// // // // // document.getElementById('play-button').addEventListener('click', function () { 
// // // // //     gamePaused = false;
// // // // //     pauseModal.hide();
// // // // // });

// // // // // // --- END PAUSE --

// // // // // // -- MATCH --
// // // // // const scoreMultiplier = localStorage.getItem('difficulty') == 'fácil' ? 100 : 150;
// // // // // const winnerModal = new bootstrap.Modal(document.getElementById('winner-modal'));
// // // // // const winnerText = document.getElementById('winner-text');
// // // // // const winnerName = document.getElementById('winner-name');
// // // // // let gameFinished = false;

var model1Position = new THREE.Vector3(50, 0, 110); // Posición inicial del primer modelo
var model2Position = new THREE.Vector3(-40, 0, -80); // Posición inicial del segundo modelo
var model1;
var model2;

// -- SCENE --
const scene = new THREE.Scene();
new THREE.TextureLoader().load("/PROYECTO_GW/assets/img/backgrounds/fondo.png", function(texture) {

    scene.background = texture;
});


// -- CAMERA --
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight);
camera.position.set(-20, 225, 200);
camera.rotateX(THREE.MathUtils.degToRad(-50.0));//-90.0



// -- RENDERER --
const renderer = new THREE.WebGLRenderer({canvas: document.getElementById('game-canvas')});
renderer.setSize(window.innerWidth, window.innerHeight - 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Opcional: especifica el tipo de sombra que deseas (opciones: BasicShadowMap, PCFShadowMap, PCFSoftShadowMap)
document.body.appendChild(renderer.domElement);

// Resize game
window.addEventListener("resize", function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight - 1);
    renderer.render(scene, camera);
});

let loadedAssets = 0;
const totalAssets = 31;


// -- COLLISIONS --
let boundingBoxes = [];
let floorBoundingBox = null;

function isCollidingWithScenario(character) {
  
    for (const boundingBox of boundingBoxes) {

        if (boundingBox.intersectsBox(character.boundingBox)) {

            return true;
        }
    }

    return false;
}

function isOutOfScenario(character) {
    
    const position = character.model.position;

    return (position.x < -130 || position.x > 130 ||
    position.z < -130 || position.z > 130);
}


function isCollidingWithEnemy(character) { 

    if(character.name == 'police-man' && character.boundingBox.intersectsBox(mouse.boundingBox) && !mouse.isInvulnerable) {
        
        character.objectivesCount++;

        const objectivesCount = document.getElementById('objectives-count');
        objectivesCount.textContent = character.objectivesCount;

        character.score += 1 * scoreMultiplier;

        const scoreText = document.getElementById('score');
        scoreText.textContent = character.score;

        if(character.objectivesCount >= 3) {

            let currentPlayerName = localStorage.getItem('currentPlayerName');

            gameFinished = true;
            winnerText.textContent = '¡Has capturado al ratón!';
            winnerName.textContent = currentPlayerName + ' ha ganado la partida.';

            particles.visible = true;

            insertRecord(currentPlayerName, character.score);
            winnerModal.show();
        }

        mouse.model.position.x = 120.0;
        mouse.model.position.z = 120.0;
        
        policeMan.model.position.x = -120.0;
        policeMan.model.position.z = -120.0;

        // -- SOUND --
        sound.playSound2D('/PROYECTO_GW/assets/sounds/perder-vida.mp3');

        return;
    }

    if(character.name == 'mouse' && character.boundingBox.intersectsBox(policeMan.boundingBox) && !mouse.isInvulnerable) {
        
        policeMan.objectivesCount++;

        if(policeMan.objectivesCount >= 3) {

            policeMan.updateActionAnimation('celebrate');

            let currentPlayerName = localStorage.getItem('currentPlayerName');

            gameFinished = true;
            winnerText.textContent = '¡Oh no, el policía finalmente te capturó!';
            winnerName.textContent = 'El policía ha ganado la partida.';

            insertRecord(currentPlayerName, character.score);
            
            winnerModal.show();
        }

        mouse.model.position.x = 120.0;
        mouse.model.position.z = 120.0;
        
        policeMan.model.position.x = -120.0;
        policeMan.model.position.z = -120.0;

        // -- SOUND --
        sound.playSound2D('/PROYECTO_GW/assets/sounds/perder-vida.mp3');
        
        return;
    }

}

// -- POWER UPS --

const powerUps = [];

function isCollidingWithPowerUp(character) { 

    powerUps.forEach((powerUp, index) => {

        if (powerUp.boundingBox.intersectsBox(character.boundingBox)) {

            if(powerUp.name != 'mouse-trap' && powerUp.targetName == currentPlayerCharacter.name) {
                
                character.score += 1 * scoreMultiplier;
                
                const scoreText = document.getElementById('score');
                scoreText.textContent = character.score;
            }

            if(powerUp.executePowerUp(character, scene)) {
                
                powerUps.splice(index, 1);
                scene.remove(powerUp.model);
            }

            return;
        }

    });

}

// -- CHEESES --

const cheeses = [];

function isCollidingWithCheeses() {

    cheeses.forEach((cheese, index) => {

        if(cheese.boundingBox.intersectsBox(mouse.boundingBox)) {

            mouse.objectivesCount++;

            const objectivesCount = document.getElementById('objectives-count');
            objectivesCount.textContent = mouse.objectivesCount;

            mouse.score += 1 * scoreMultiplier;

            const scoreText = document.getElementById('score');
            scoreText.textContent = mouse.score;
                
            sound.playSound2D('/PROYECTO_GW/assets/sounds/cheese-powerup.mp3');
    
            if(mouse.objectivesCount >= 3) {
    
                gameFinished = true;
                winnerText.textContent = '¡Has recolectado todos los quesos!';
                winnerName.textContent = 'Has ganado la partida.';

                particles.visible = true;

                let currentPlayerName = localStorage.getItem('currentPlayerName');

                insertRecord(currentPlayerName, mouse.score);
    
                winnerModal.show();
            }
            
            cheeses.splice(index, 1);
            scene.remove(cheese.model);
        }

        return;
    });

}


function isMouseAICollidingWithCheeses() {

    cheeses.forEach((cheese, index) => {

        if(cheese.boundingBox.intersectsBox(mouse.boundingBox)) {

            mouse.objectivesCount++;
                
            sound.playSound2D('/PROYECTO_GW/assets/sounds/cheese-powerup.mp3');
    
            if(mouse.objectivesCount >= 3) {
    
                gameFinished = true;
                winnerText.textContent = '¡Oh no, el ratón logró recolectar todos los quesos!';
                winnerName.textContent = 'El ratón ha ganado la partida.';

                mouse.updateActionAnimation("celebrate");
    
                const currentPlayerName = localStorage.getItem('currentPlayerName');
                insertRecord(currentPlayerName, policeMan.score);

                winnerModal.show();
            }
            
            cheeses.splice(index, 1);
            scene.remove(cheese.model);
        }

        return;
    });

}

// -- PARTICLES --
let particles = null;

// -- RAYCAST -- 
var rayCaster = new THREE.Raycaster();

// -- STATS --
const SPEED = 8;
const POLICE_RANGE = 10;

// -- CLOCK --
const clock = new THREE.Clock();

// -- CHARACTERS --
let currentPlayerCharacter = null;
// const mouse = new Character("mouse");
// const policeMan = new Character("police-man");

// -- DIFFICULTY LIGHTS --

const difficultyLights = [];

// -- OBJETOS CON COLISIÓN --
let objectsWithBoundingBox = [];

// -- SELECTED CHARACTER --
let singlePlayerSelectedCharacter = 'mouse';


// -- ASSETS LOADING FUNCTIONS --

function loadOBJWithMTL(path, objFile, mtlFile, onModelLoaded) {

    const mtlLoader = new MTLLoader();
    mtlLoader.setPath(path);

    // Load materials from MTL file
    mtlLoader.load(mtlFile, (materials) => {
    
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials)
        objLoader.setPath(path);
        objLoader.load(objFile, (model) => {

            onModelLoaded(model);
        });
    
    });

}

function loadMouseCharacter(initCurrentPlayerCharacter) {

    const fbxLoader = new FBXLoader();
    fbxLoader.setPath("/PROYECTO_GW/assets/models/characters/mouse/");

    fbxLoader.load('mouse_TposeSkeleton.fbx', (model) => {

        // Add spotlight if is selected character 
        const selectedCharacter = localStorage.getItem("singleplayerCharacter");

        // Load animations
        mouse.model = model;
        mouse.mixer = new THREE.AnimationMixer(mouse.model)
    
        fbxLoader.load('mouse_idle.fbx', (asset) => {
            const idleAnimation = asset.animations[0];
            mouse.action.idle = mouse.mixer.clipAction(idleAnimation);

            if(selectedCharacter == "mouse") {
                
                mouse.action.idle.play();
            }

            loadedAssets++;
        });

        fbxLoader.load('mouse_run.fbx',(asset) => {
            const runAnimation = asset.animations[0];
            mouse.action.run = mouse.mixer.clipAction(runAnimation);

            if(selectedCharacter != "mouse") {
                
                mouse.action.run.play();
            }
            
            loadedAssets++;
        });
        
        fbxLoader.load('mouse_dance.fbx',(asset)=>{
            const celebreateAnimation = asset.animations[0];
            mouse.action.celebrate = mouse.mixer.clipAction(celebreateAnimation);
            loadedAssets++;
        });

        // Set properties
        model.name="mouse";
        model.position.x = 120.0;
        model.position.z = 120.0;
        model.scale.set(0.15, 0.15, 0.15);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
            }
          });
        
        scene.add(model);
       
        if(selectedCharacter == "mouse") {
            
            const spotLight = new THREE.SpotLight(0xffffff);
            spotLight.position.set(120, 15, 120);
            spotLight.intensity = 0.3;
            
            spotLight.target = model;
    
            mouse.light = spotLight;

            initCurrentPlayerCharacter(mouse);
        }
        else {
            
           model.children[0].material.opacity = 0.35;
           model.children[0].material.transparent = true;
        }


        // Add bounding box
        const boundingBox = new THREE.Box3();
        boundingBox.setFromObject(model);
        mouse.boundingBox = boundingBox;


        loadedAssets++;
    });
}

function loadPoliceManCharacter(initCurrentPlayerCharacter) {

    const fbxLoader = new FBXLoader();
    fbxLoader.setPath("/PROYECTO_GW/assets/models/characters/police-man/");

    fbxLoader.load('police_TposeSkeleton.fbx', (model) => {

        // Add spotlight if is selected character
        const selectedCharacter = localStorage.getItem("singleplayerCharacter");

        // Load animations
        policeMan.model = model;
        policeMan.mixer = new THREE.AnimationMixer(policeMan.model)
    
        fbxLoader.load('police_idle.fbx', (asset) => {
            const idleAnimation = asset.animations[0];
            policeMan.action.idle = policeMan.mixer.clipAction(idleAnimation);

            if(selectedCharacter == 'police_man') {

                policeMan.action.idle.play();
            }

            loadedAssets++;
        });

        fbxLoader.load('police_running.fbx',(asset) => {
            const runAnimation = asset.animations[0];
            policeMan.action.run = policeMan.mixer.clipAction(runAnimation);

            if(selectedCharacter != 'police_man') {

                policeMan.action.run.play();
            }

            loadedAssets++;
        });

        fbxLoader.load('police_dance.fbx',(asset)=>{
            const celebreateAnimation = asset.animations[0];
            policeMan.action.celebrate = policeMan.mixer.clipAction(celebreateAnimation);
            loadedAssets++;
        });

        // Set properties
        model.name="police-man";
        model.position.x = -120.0;
        model.position.z = -120.0;
        model.scale.set(0.08, 0.08, 0.08);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
            }
          });

        // Raycast
        //model.vector = new THREE.Vector3(0, 0, 1);
        model.vector = [
            new THREE.Vector3(0,0,1),//front
            new THREE.Vector3(0,0,-1),//back
            new THREE.Vector3(1,0,0),//right
            new THREE.Vector3(-1,0,0),//left
            new THREE.Vector3(0,1,0) //Up
        ];

        //Creamos un material transparente para el cubo que estara cachando las intersecciones del raycaster
        const geometry = new THREE.BoxGeometry( 150, 150, 150);
        const material = new THREE.MeshBasicMaterial({
             color: new THREE.Color(1.0,0.0,0.0),
        });
    
        material.transparent = true;
        material.opacity = 0.0;
    
        const cube = new THREE.Mesh( geometry, material );
    
        model.add( cube );
        
        scene.add(model);
        
        policeMan.loaded = true;
        

        if(selectedCharacter == "police_man") {
            
            const spotLight = new THREE.SpotLight(0xffffff);
            spotLight.position.set(120, 15, 120);
            spotLight.intensity = 0.3;
            
            spotLight.target = model;
    
            policeMan.light = spotLight;

            
            initCurrentPlayerCharacter(policeMan);
        }

        // Add bounding box
        const boundingBox = new THREE.Box3();
        boundingBox.setFromObject(model);
        policeMan.boundingBox = boundingBox;

        policeMan.loaded = true;

        loadedAssets++;
    });
}


// -- GAME INITIALIZE --

function initGame() {
    
    //initLights();

    //initCharacters();
    //initPowerUps();
    //initCheeses();
    //initParticles(); // chemcar las particulas y descomentarlas 
}


function initParticles() {

    const material = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true
      });

      const geometry = new THREE.BufferGeometry();
      const positions = [];
      const colors = [];
      const numParticles = 500;

      for (let i = 0; i < numParticles; i++) {

        const position = new THREE.Vector3(
          Math.random() * 2 - 1,
          124.5,
          Math.random() * 2 - 1
        ).multiplyScalar(2);

        positions.push(position.x, position.y, position.z);

        const color = new THREE.Color();
        color.setRGB(Math.random(), Math.random(), Math.random());
        colors.push(color.r, color.g, color.b);
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      particles = new THREE.Points(geometry, material);

      particles.visible = false;

      //scene.add(particles);
}


function initLights() {
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
    scene.add(ambientLight);

    difficultyLights[0] = [];
    difficultyLights[1] = [];
    difficultyLights[2] = [];

    const pointLight1 = new THREE.PointLight(0xffffff, 1, 250);
    pointLight1.position.set(-120, 150, -120);
    pointLight1.name = '1';
    pointLight1.castShadow = true;
    scene.add(pointLight1);
    difficultyLights[0].push(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 1, 250);
    pointLight2.position.set(-120, 150, 120);
    pointLight2.name = '2';
    pointLight2.castShadow = true;
    scene.add(pointLight2);
    difficultyLights[0].push(pointLight2);

    const pointLight3 = new THREE.PointLight(0xffffff, 0, 250);
    pointLight3.position.set(0, 150, -120);
    pointLight3.name = '3';
    pointLight3.castShadow = true;
    scene.add(pointLight3);
    difficultyLights[1].push(pointLight3);

    const pointLight4 = new THREE.PointLight(0xffffff, 0, 250);
    pointLight4.position.set(0, 150, 120);
    pointLight4.name = '4';
    pointLight4.castShadow = true;
    scene.add(pointLight4);
    difficultyLights[1].push(pointLight4);

    const pointLight5 = new THREE.PointLight(0xffffff, 0, 250);
    pointLight5.position.set(120, 150, -120);
    pointLight5.name = '5';
    pointLight5.castShadow = true;
    scene.add(pointLight5);
    difficultyLights[2].push(pointLight5);

    const pointLight6 = new THREE.PointLight(0xffffff, 0, 250);
    pointLight6.position.set(120, 150, 120);
    pointLight6.name = '6';
    pointLight6.castShadow = true;
    scene.add(pointLight6);
    difficultyLights[2].push(pointLight6);

    const lightsIntervalTime = localStorage.getItem('difficulty') == 'fácil' ? 5000 : 15000;

    let lightIndex = 0;

    setInterval(() => {

        const prevIndex = lightIndex == 0 ? 2 : lightIndex - 1;

        for (const light of difficultyLights[prevIndex]) {

            
            light.intensity = 0;
        }

        for (const light of difficultyLights[lightIndex]) {

            
            light.intensity = 1;
        }

        lightIndex = (lightIndex + 1) == 3 ? 0 : lightIndex + 1;

    }, lightsIntervalTime);

}

function initModels() {

    // Piso del escenario

    // Se indica la carpeta donde se encuentra el OBJ y el MTL,
    // el archivo OBJ y el MTL. 
    // Al final se pasa una función que se ejecuta al cargar el modelo,
    // aquí se pueden modificar las propiedades del modelo y agregarlo a la escena
    loadOBJWithMTL("/PROYECTO_GW/assets/models/floor/", "floor.obj", "floor.mtl", (model) => {
     
        model.scale.set(0.15, 0.15, 0.15);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.receiveShadow = true; // Permitir que el modelo genere sombras
              
            }
          });

        floorBoundingBox = new THREE.Box3();
        floorBoundingBox.setFromObject(model);

        scene.add(model);
        loadedAssets++;
    });

    loadOBJWithMTL("/PROYECTO_GW/assets/models/cocina/fridge/Refridgerator/", "refridgerator.obj", "refridgerator.mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = -90.0;
        model.position.z = 50.0;
        model.scale.set(20.16, 20.16, 20.16);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
            }
          });

        // Crear la caja de colisión
        const boundingBox = new THREE.Box3();
        boundingBox.uuid = model.uuid;
        boundingBox.setFromObject(model);
        boundingBoxes.push(boundingBox);
        objectsWithBoundingBox.push(model);
        model.boundBox = boundingBox;

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;
    });

    loadOBJWithMTL("/PROYECTO_GW/assets/models/cocina/maceta/Flower Pot (DR2)/", "Flower Pot (DR2).obj", "Flower Pot (DR2).mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = -100.0;
        model.position.z = 100.0;
        //model.rotation.y = 40.0;
        model.scale.set(50.16, 50.16, 50.16);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
            }
          });

        // Crear la caja de colisión
        const boundingBox = new THREE.Box3();
        boundingBox.uuid = model.uuid;
        boundingBox.setFromObject(model);
        boundingBoxes.push(boundingBox);
        objectsWithBoundingBox.push(model);
        model.boundBox = boundingBox;

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;
    });

    loadOBJWithMTL("/PROYECTO_GW/assets/models/cocina/mesa/RAIG Table/", "RageTable.obj", "RageTable.mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = -90.0;
        model.position.z = -80.0;
        model.rotation.y = Math.PI/2;

        //model.rotation.y = 0;
        model.scale.set(20.16, 20.16, 35.16);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
            }
          });

        // Crear la caja de colisión
        const boundingBox = new THREE.Box3();
        boundingBox.uuid = model.uuid;
        boundingBox.setFromObject(model);
        boundingBoxes.push(boundingBox);
        objectsWithBoundingBox.push(model);
        model.boundBox = boundingBox;

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;
    });

    loadOBJWithMTL("/PROYECTO_GW/assets/models/cocina/mesa/RAIG Table/", "RageTable.obj", "RageTable.mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = 100.0;
        model.position.z = 0.0;
        model.rotation.y = Math.PI/2;

        model.scale.set(20.16, 20.16, 35.16);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
            }
          });

        // Crear la caja de colisión 
        const boundingBox = new THREE.Box3();
        boundingBox.uuid = model.uuid;
        boundingBox.setFromObject(model);
        boundingBoxes.push(boundingBox);
        objectsWithBoundingBox.push(model);
        model.boundBox = boundingBox;

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;
    });

    loadOBJWithMTL("/PROYECTO_GW/assets/models/cocina/oven/Oven Gun Cube/", "Oven_Gun_Cube.obj", "Oven_Gun_Cube.mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = -100.0;
        model.position.z = -20.0;
        //model.rotation.y = Math.PI/2;

        model.scale.set(0.0040, 0.0040, 0.0040);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
            }
          });

        // Crear la caja de colisión 
        const boundingBox = new THREE.Box3();
        boundingBox.uuid = model.uuid;
        boundingBox.setFromObject(model);
        boundingBoxes.push(boundingBox);
        objectsWithBoundingBox.push(model);
        model.boundBox = boundingBox;

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;
    });

    loadOBJWithMTL("/PROYECTO_GW/assets/models/cocina/mesaSilla/Table 03/", "table03.obj", "table03.mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = 0.0;
        model.position.z =30.0;
        //model.rotation.y = -Math.PI/2;
        // // // model.position.x = -50.0;
        // // // model.position.z = -20.0;


        model.scale.set(0.20, 0.20, 0.20);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
            }
          });

        // Crear la caja de colisión
        const boundingBox = new THREE.Box3();
        boundingBox.uuid = model.uuid;
        boundingBox.setFromObject(model);
        boundingBoxes.push(boundingBox);
        objectsWithBoundingBox.push(model);
        model.boundBox = boundingBox;

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;
    });

    loadOBJWithMTL("/PROYECTO_GW/assets/models/cocina/lavabo/Cabinet/cabinet1/", "cabinet 1.obj", "cabinet 1.mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = 15.0;
        model.position.z = -40.0;

        model.scale.set(0.16, 0.16, 0.16);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
            }
          });

        // Crear la caja de colisión
        const boundingBox = new THREE.Box3();
        boundingBox.uuid = model.uuid;
        boundingBox.setFromObject(model);
        boundingBoxes.push(boundingBox);
        objectsWithBoundingBox.push(model);
        model.boundBox = boundingBox;

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;
    });

    loadOBJWithMTL("/PROYECTO_GW/assets/models/cocina/armario/Cupboard/", "cupboard_heal.obj", "cupboard_heal.mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = 10.0;
        model.position.z = -95.0;
        model.rotation.y = Math.PI;
        

        model.scale.set(0.16, 0.16, 0.16);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
            }
          });

        // Crear la caja de colisión
        const boundingBox = new THREE.Box3();
        boundingBox.uuid = model.uuid;
        boundingBox.setFromObject(model);
        boundingBoxes.push(boundingBox);
        objectsWithBoundingBox.push(model);
        model.boundBox = boundingBox;

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;
    });

    loadOBJWithMTL("/PROYECTO_GW/assets/models/cocina/armario2/Cupboard/", "cupboard01a.obj", "cupboard01a.mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = 100;
        model.position.z = -40;
        //model.position.y = -20;
        model.rotation.y = Math.PI * 2;

        model.scale.set(0.16, 0.16, 0.16);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
            }
          });

        // Crear la caja de colisión
        const boundingBox = new THREE.Box3();
        boundingBox.uuid = model.uuid;
        boundingBox.setFromObject(model);
        boundingBoxes.push(boundingBox);
        objectsWithBoundingBox.push(model);
        model.boundBox = boundingBox;

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;
    });

    loadOBJWithMTL("/PROYECTO_GW/assets/models/cocina/planta/Tall House Plant/", "TALL_HOUSEPLANT.obj", "TALL_HOUSEPLANT.mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = 80;
        model.position.z = 0;
        model.rotation.y = 0;

        model.scale.set(1.16, 1.16, 1.16);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
            }
          });

        // Crear la caja de colisión
        const boundingBox = new THREE.Box3();
        boundingBox.uuid = model.uuid;
        boundingBox.setFromObject(model);
        boundingBoxes.push(boundingBox);
        objectsWithBoundingBox.push(model);
        model.boundBox = boundingBox;

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;
    });

    loadOBJWithMTL("/PROYECTO_GW/assets/models/cocina/planta/Tall House Plant/", "TALL_HOUSEPLANT.obj", "TALL_HOUSEPLANT.mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = 30;
        model.position.z = -40;
        model.rotation.y = 0;

        model.scale.set(1.16, 1.16, 1.16);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
            }
          });

        // Crear la caja de colisión
        const boundingBox = new THREE.Box3();
        boundingBox.uuid = model.uuid;
        boundingBox.setFromObject(model);
        boundingBoxes.push(boundingBox);
        objectsWithBoundingBox.push(model);
        model.boundBox = boundingBox;

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;
    });

    loadOBJWithMTL("/PROYECTO_GW/assets/models/cocina/planta/Tall House Plant/", "TALL_HOUSEPLANT.obj", "TALL_HOUSEPLANT.mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = -60;
        model.position.z = 50;
        model.rotation.y = Math.PI/2;

        model.scale.set(1.16, 1.16, 1.16);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
            }
          });

        // Crear la caja de colisión
        const boundingBox = new THREE.Box3();
        boundingBox.uuid = model.uuid;
        boundingBox.setFromObject(model);
        boundingBoxes.push(boundingBox);
        objectsWithBoundingBox.push(model);
        model.boundBox = boundingBox;

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;
    });

    loadOBJWithMTL("/PROYECTO_GW/assets/models/cocina/planta/Tall House Plant/", "TALL_HOUSEPLANT.obj", "TALL_HOUSEPLANT.mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = 70;
        model.position.z = 80;
        model.rotation.y = Math.PI/2;

        model.scale.set(1.16, 1.16, 1.16);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
            }
          });

        // Crear la caja de colisión
        const boundingBox = new THREE.Box3();
        boundingBox.uuid = model.uuid;
        boundingBox.setFromObject(model);
        boundingBoxes.push(boundingBox);
        objectsWithBoundingBox.push(model);
        model.boundBox = boundingBox;

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;
    });

    loadOBJWithMTL("/PROYECTO_GW/assets/models/cocina/boteBasura/Trash Can/", "garbage_can.obj", "garbage_can.mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = 85;
        model.position.z = -94;
        model.rotation.y = -Math.PI/4; 

        model.scale.set(10.16, 10.16, 10.16);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
            }
          });

        // Crear la caja de colisión
        const boundingBox = new THREE.Box3();
        boundingBox.uuid = model.uuid;
        boundingBox.setFromObject(model);
        boundingBoxes.push(boundingBox);
        objectsWithBoundingBox.push(model);
        model.boundBox = boundingBox;

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;
    });

    loadOBJWithMTL("/PROYECTO_GW/assets/models/cocina/boteBasura/Trash Can/", "garbage_can.obj", "garbage_can.mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = 30;
        model.position.z = 10;
        model.rotation.y = -Math.PI/2; 

        model.scale.set(10.16, 10.16, 10.16);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
            }
          });

        // Crear la caja de colisión
        const boundingBox = new THREE.Box3();
        boundingBox.uuid = model.uuid;
        boundingBox.setFromObject(model);
        boundingBoxes.push(boundingBox);
        objectsWithBoundingBox.push(model);
        model.boundBox = boundingBox;

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;
    });

    loadOBJWithMTL("/PROYECTO_GW/assets/models/cocina/maceta/Flower Pot (DR2)/", "Flower Pot (DR2).obj", "Flower Pot (DR2).mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = -20;
        model.position.z = 100;
        model.rotation.y = Math.PI; 

        model.scale.set(50.16, 50.16, 50.16);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
            }
          });

        // Crear la caja de colisión
        const boundingBox = new THREE.Box3();
        boundingBox.uuid = model.uuid;
        boundingBox.setFromObject(model);
        boundingBoxes.push(boundingBox);
        objectsWithBoundingBox.push(model);
        model.boundBox = boundingBox;

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;
    });

    loadOBJWithMTL("/PROYECTO_GW/assets/models/cocina/maceta/Flower Pot (DR2)/", "Flower Pot (DR2).obj", "Flower Pot (DR2).mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = -30;
        model.position.z = -100;
        model.rotation.y = 0;

        model.scale.set(50.16, 50.16, 50.16);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
            }
          });

        // Crear la caja de colisión
        const boundingBox = new THREE.Box3();
        boundingBox.uuid = model.uuid;
        boundingBox.setFromObject(model);
        boundingBoxes.push(boundingBox);
        objectsWithBoundingBox.push(model);
        model.boundBox = boundingBox;

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;
    });

    loadOBJWithMTL("/PROYECTO_GW/assets/models/cocina/armario2/Cupboard/", "cupboard01a.obj", "cupboard01a.mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = 120;
        model.position.z = 60;

        model.scale.set(0.16, 0.16, 0.16);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
            }
          });

        // Crear la caja de colisión
        const boundingBox = new THREE.Box3();
        boundingBox.uuid = model.uuid;
        boundingBox.setFromObject(model);
        boundingBoxes.push(boundingBox);
        objectsWithBoundingBox.push(model);
        model.boundBox = boundingBox;

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;
    });

    // ... MODELOS PERSONAJES 
// Define la variable model1 fuera del evento keydown


// Carga el modelo y asigna el modelo cargado a model1
loadOBJWithMTL("/PROYECTO_GW/assets/models/personajes/monstruo/GhostBear/", "GhostBear.obj", "GhostBear.mtl", (model) => {
    // Asigna el modelo cargado a la variable model1
    model1 = model;

    // Asignar un ID al modelo
    model.userData.id = "blue-kitchen3"; 

    // Transformación del modelo
    model.position.copy(model1Position); // Copiar la posición inicial del modelo

    model.scale.set(0.22, 0.22, 0.22);
    model.traverse(function(child) {
        if (child.isMesh) {
            child.castShadow = true; // Permitir que el modelo genere sombras
        }
    });

    // Crear la caja de colisión
    const boundingBox = new THREE.Box3();
    boundingBox.uuid = model.uuid;
    boundingBox.setFromObject(model);
    boundingBoxes.push(boundingBox);
    objectsWithBoundingBox.push(model);
    model.boundBox = boundingBox;

    // Agregarlo al escenario
    scene.add(model);
    loadedAssets++;
});

loadOBJWithMTL("/PROYECTO_GW/assets/models/personajes/niño/Benny/", "benny.obj", "benny.mtl", (model) => {
     
    // Asigna el modelo cargado a la variable model1
    model2= model;

    // Asignar un ID al modelo
    model.userData.id = "blue-kitchen5"; 

    // Transformación del modelo
    model.position.copy(model2Position); // Copiar la posición inicial del modelo

    model.scale.set(1.22, 1.22, 1.22);
    model.traverse(function(child) {
        if (child.isMesh) {
          child.castShadow = true; // Permitir que el modelo genere sombras
        }
      });

    // Crear la caja de colisión
    const boundingBox = new THREE.Box3();
    boundingBox.uuid = model.uuid;
    boundingBox.setFromObject(model);
    boundingBoxes.push(boundingBox);
    objectsWithBoundingBox.push(model);
    model.boundBox = boundingBox;

    // Agregarlo al escenario
    scene.add(model);
    loadedAssets++;
});




}

// para mover modelos :TODO





function initPowerUps() { 
        
    loadOBJWithMTL("/PROYECTO_GW/assets/models/power-ups/hojaLapiz/", "obj_Supply.obj", "obj_Supply.mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = -120.0;
        model.position.z = -120.0;
        model.scale.set(20.20, 20.20, 20.20);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
              child.shouldRotate = true;// Por ejemplo, este modelo rotará
            }
          });

        // Crear la caja de colisión
        const boundingBox = new THREE.Box3();
        boundingBox.setFromObject(model);

        //const powerUp = new PowerUp('donut', model, 'police-man', boundingBox, 'speed');

        //powerUps.push(powerUp);

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;

        model.shouldRotate = true; // Por ejemplo, este modelo rotará
    });

    loadOBJWithMTL("/PROYECTO_GW/assets/models/power-ups/hojaLapiz/", "obj_Supply.obj", "obj_Supply.mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = 120;
        model.position.z = 120.0;
        model.scale.set(20.20, 20.20, 20.20);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
              child.shouldRotate = true;// Por ejemplo, este modelo rotará
            }
          });

        // Crear la caja de colisión
        const boundingBox = new THREE.Box3();
        boundingBox.setFromObject(model);

        // const powerUp = new PowerUp('cheese-flamin-hot', model, 'mouse', boundingBox, 'speed');

        // powerUps.push(powerUp);

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;
        model.shouldRotate = true; // Por ejemplo, este modelo rotará
    });//niño

    loadOBJWithMTL("/PROYECTO_GW/assets/models/power-ups/hojaLapiz/", "obj_Supply.obj", "obj_Supply.mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = -120.0;
        model.position.z = 120.0;
        model.scale.set(20.20, 20.20, 20.20);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
              child.shouldRotate = true;// Por ejemplo, este modelo rotará
            }
          });

        // Crear la caja de colisión
        const boundingBox = new THREE.Box3();
        boundingBox.setFromObject(model);

        // const powerUp = new PowerUp('cheese-radiaoactive', model, 'mouse', boundingBox, 'invulnerable');

        // powerUps.push(powerUp);

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;
        model.shouldRotate = true; // Por ejemplo, este modelo rotará
    });//niño

    loadOBJWithMTL("/PROYECTO_GW/assets/models/power-ups/hojaLapiz/", "obj_Supply.obj", "obj_Supply.mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = 120.0;
        model.position.z = -120.0;
        model.scale.set(20.20, 20.20, 20.20);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
              child.shouldRotate = true;// Por ejemplo, este modelo rotará
            }
          });

        // Crear la caja de colisión
        const boundingBox = new THREE.Box3();
        boundingBox.setFromObject(model);

        // const powerUp = new PowerUp('trap', model, 'police-man', boundingBox, 'trap');

        // powerUps.push(powerUp);

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;
        model.shouldRotate = true; // Por ejemplo, este modelo rotará
    });



    
}

function initCheeses() {

    loadOBJWithMTL("/PROYECTO_GW/assets/models/power-ups/cheese/", "cheese.obj", "cheese.mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = 30.0;
        model.position.z = -70.0;
        model.scale.set(0.08, 0.08, 0.08);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
            }
          });

        // Crear la caja de colisión
        const boundingBox = new THREE.Box3();
        boundingBox.setFromObject(model);

        const cheese = new Cheese('cheese1', model, boundingBox);
        cheeses.push(cheese);

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;
    });

    loadOBJWithMTL("/PROYECTO_GW/assets/models/power-ups/cheese/", "cheese.obj", "cheese.mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = -80.0;
        model.position.z = -60.0;
        model.scale.set(0.08, 0.08, 0.08);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
            }
          });

        // Crear la caja de colisión
        const boundingBox = new THREE.Box3();
        boundingBox.setFromObject(model);

        const cheese = new Cheese('cheese2', model, boundingBox);
        cheeses.push(cheese);

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;
    });

    loadOBJWithMTL("/PROYECTO_GW/assets/models/power-ups/cheese/", "cheese.obj", "cheese.mtl", (model) => {
     
        // Transformación del modelo
        model.position.x = -100.0;
        model.position.z = 80.0;
        model.scale.set(0.08, 0.08, 0.08);
        model.traverse(function(child) {
            if (child.isMesh) {
              child.castShadow = true; // Permitir que el modelo genere sombras
            }
          });

        // Crear la caja de colisión
        const boundingBox = new THREE.Box3();
        boundingBox.setFromObject(model);

        const cheese = new Cheese('cheese3', model, boundingBox);
        cheeses.push(cheese);

        // Agregarlo al escenario
        scene.add(model);
        loadedAssets++;
    });

}

function initCharacters() {

    // Get selected character
    singlePlayerSelectedCharacter = localStorage.getItem("singleplayerCharacter");

    loadMouseCharacter(function(character) {

        currentPlayerCharacter = character;
        scene.add(currentPlayerCharacter.light);         
    });

    loadPoliceManCharacter(function(character) {

        currentPlayerCharacter = character;
        scene.add(currentPlayerCharacter.light);
    });

    const currentCharacterIcon = document.getElementById('current-character-icon');
    const itemsIcon = document.getElementById('items-icon');
    
    const selectedCharacter = localStorage.getItem("singleplayerCharacter");
    if(selectedCharacter == "mouse") {

        currentCharacterIcon.src = "../assets/img/icons/mouse-icon.png";
        itemsIcon.src = "../assets/img/icons/cheese.png";
    }
    else {

        currentCharacterIcon.src = "../assets/img/icons/policia-icon.png";
        itemsIcon.src = "../assets/img/icons/mouse-icon.png";
    }

    currentCharacterIcon.classList.remove('d-none');
    currentCharacterIcon.classList.add('d-block');

    itemsIcon.classList.remove('d-none');
    itemsIcon.classList.add('d-block');
}



// -- CHARACTER MOVEMENT --

const inputActions = {
    up: "w",
    bottom: "s",
    left: "a",
    right: "d",
    interact: "e",

    arrowUp: "ArrowUp",
    arrowDown: "ArrowDown",
    arrowLeft: "ArrowLeft",
    arrowRight: "ArrowRight",
}


document.addEventListener('keydown', function(event) {
    switch(event.key) {
        case 'ArrowUp':
            model1Position.z -= 1; // Mover el primer modelo hacia adelante
            break;
        case 'ArrowDown':
            model1Position.z += 1; // Mover el primer modelo hacia atrás
            break;
        case 'ArrowLeft':
            model1Position.x -= 1; // Mover el primer modelo hacia la izquierda
            break;
        case 'ArrowRight':
            model1Position.x += 1; // Mover el primer modelo hacia la derecha
            break;
        // Puedes agregar más casos para mover en otras direcciones o para otros modelos si es necesario
    }

    // Actualizar la posición del primer modelo
    model1.position.copy(model1Position);


switch(event.key) {
    case 'w':
    case 'W':
        model2Position.z -= 1; // Mover el primer modelo hacia adelante
        break;
    case 's':
    case 'S':
        model2Position.z += 1; // Mover el primer modelo hacia atrás
        break;
    case 'a':
    case 'A':
        model2Position.x -= 1; // Mover el primer modelo hacia la izquierda
        break;
    case 'd':
    case 'D':
        model2Position.x += 1; // Mover el primer modelo hacia la derecha
        break;
    // Puedes agregar más casos para mover en otras direcciones o para otros modelos si es necesario
}


    // Actualizar la posición del primer modelo
    model2.position.copy(model2Position);
});



// // // // // document.addEventListener("keydown", function (event) { //TODO:descomentar 5 veces 



// // // // //     if(currentPlayerCharacter.canMove && !gamePaused && !gameFinished) {

// // // // //         const pressedKey = event.key.toLowerCase();

// // // // //         if(pressedKey == inputActions["up"]) {
    
// // // // //             if(!isCollidingWithScenario(currentPlayerCharacter) && !isOutOfScenario(currentPlayerCharacter)) {
    
// // // // //                 currentPlayerCharacter.model.position.z -= 1 * currentPlayerCharacter.speedMultiplier;
// // // // //                 currentPlayerCharacter.model.rotation.y = THREE.MathUtils.degToRad(180.0);
// // // // //                 currentPlayerCharacter.updateActionAnimation("run");
// // // // //                 currentPlayerCharacter.updateLightPosition();
// // // // //             }
// // // // //             else {
// // // // //                 currentPlayerCharacter.model.position.z += 5;
// // // // //             }
// // // // //         }
    
// // // // //         if(pressedKey == inputActions["bottom"]) {
    
// // // // //             if(!isCollidingWithScenario(currentPlayerCharacter) && !isOutOfScenario(currentPlayerCharacter)) {
    
// // // // //                 currentPlayerCharacter.model.position.z += 1 * currentPlayerCharacter.speedMultiplier;
// // // // //                 currentPlayerCharacter.model.rotation.y = THREE.MathUtils.degToRad(0.0);
// // // // //                 currentPlayerCharacter.updateActionAnimation("run");
// // // // //                 currentPlayerCharacter.updateLightPosition();
// // // // //             }
// // // // //             else {
// // // // //                 currentPlayerCharacter.model.position.z -= 5;
// // // // //             }
// // // // //         }
    
// // // // //         if(pressedKey == inputActions["right"]) {
    
// // // // //             if(!isCollidingWithScenario(currentPlayerCharacter) && !isOutOfScenario(currentPlayerCharacter)) {
    
// // // // //                 currentPlayerCharacter.model.position.x += 1 * currentPlayerCharacter.speedMultiplier;
// // // // //                 currentPlayerCharacter.model.rotation.y = THREE.MathUtils.degToRad(90.0);
// // // // //                 currentPlayerCharacter.updateActionAnimation("run");
// // // // //                 currentPlayerCharacter.updateLightPosition();
// // // // //             }
// // // // //             else {
// // // // //                 currentPlayerCharacter.model.position.x -= 5;
// // // // //             }
// // // // //         }
    
// // // // //         if(pressedKey == inputActions["left"]) {
    
// // // // //             if(!isCollidingWithScenario(currentPlayerCharacter) && !isOutOfScenario(currentPlayerCharacter)) {
    
// // // // //                 currentPlayerCharacter.model.position.x -= 1 * currentPlayerCharacter.speedMultiplier;
// // // // //                 currentPlayerCharacter.model.rotation.y = THREE.MathUtils.degToRad(270.0);
// // // // //                 currentPlayerCharacter.updateActionAnimation("run");
// // // // //                 currentPlayerCharacter.updateLightPosition();
// // // // //             }
// // // // //             else {
// // // // //                 currentPlayerCharacter.model.position.x += 5;
// // // // //             }
// // // // //         }
    
// // // // //         if(pressedKey == inputActions["interact"] && currentPlayerCharacter.name == 'police-man') {
            
// // // // //             const trap = currentPlayerCharacter.setTrap();
            
// // // // //             if(trap != null) {
    
// // // // //                 trap.boundingBox.setFromObject(trap.model);
    
// // // // //                 powerUps.push(trap);
// // // // //                 scene.add(trap.model);
// // // // //             }
// // // // //         }
    
// // // // //         if(Object.values(inputActions).includes(pressedKey)) {
            
// // // // //             isCollidingWithPowerUp(currentPlayerCharacter);
    
// // // // //             isCollidingWithEnemy(currentPlayerCharacter);
    
// // // // //             if(currentPlayerCharacter.name == 'mouse') {
    
// // // // //                 isCollidingWithCheeses();
// // // // //             }
// // // // //         }

// // // // //     }

// // // // // });


// // // // // document.addEventListener("keyup", function (event) { 

// // // // //     const unpressedKey = event.key.toLowerCase();

// // // // //     const inputActionsValues = Object.values(inputActions);
    
// // // // //     if (inputActionsValues.includes(unpressedKey)) { 
// // // // //         currentPlayerCharacter.updateActionAnimation("idle");
// // // // //     }

// // // // // });




// -- GAME START --

//initGame();

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);


initModels();
initPowerUps();


animate();


function animate() {

   
    // Rotación de los modelos
    scene.traverse(function(child) {
        if (child.isMesh && child.shouldRotate) {
            // Modifica los ángulos de rotación según tus necesidades
            //child.rotation.x += 0.01; // Rotación en el eje X
            child.rotation.y += 0.01; // Rotación en el eje Y
           // child.rotation.z += 0.01; // Rotación en el eje Z
        }
    });
    renderer.render(scene, camera);
    requestAnimationFrame(animate);

    // // // // // if(loadedAssets >= totalAssets) { // :TODO:descomentar 5 veces

    // // // // //     const delta = clock.getDelta();
    // // // // //     updateGame(delta);
    // // // // //     renderer.render(scene, camera);
    // // // // // }

    
}


function updateGame(delta) {

    // // // // if(mouse.model != null) {
    // // // //     mouse.mixer.update(delta);
    // // // //     mouse.updateBoundingBox();
    // // // // }

    // // // // if(policeMan.model != null) {
    // // // //     policeMan.mixer.update(delta);
    // // // //     policeMan.updateBoundingBox();
    // // // // }

    for (const powerUp of powerUps) {
        powerUp.updateAnimation();
    }

    // // // // // particles.rotation.y += 0.005;

    // // // // // if(singlePlayerSelectedCharacter == "mouse" && !gamePaused && !gameFinished) {    
    // // // // //     updateAI(delta);
    // // // // // }

    // // // // // if(singlePlayerSelectedCharacter == "police_man" && !gamePaused && !gameFinished) {    
    // // // // //     updateMouseAI(delta);
    // // // // // }

}

function updateAI(delta){
    
    // IA
    policeMan.model.lookAt(mouse.model.position);
    
    // if(policeMan.model.position.distanceTo(mouse.model.position) > POLICE_RANGE){
    //     policeMan.model.translateZ(SPEED * delta);
    // } else{
    //     console.log('Te atraparon');
    //     policeMan.action.run.pause();
    // }

    if(policeMan.model.position.distanceTo(mouse.model.position) > POLICE_RANGE){
        policeMan.model.translateZ(SPEED * delta);
    } else{
        console.log('Te atraparon');
        //policeMan.action.run.pause();
    }

    for(var i = 0; i < policeMan.model.vector.length; i++) {
        var vector = policeMan.model.vector[i];
        // 1er parámetro: Desde qué punto es lanzado el rayo o vector 
        // 2do parámetro: rayo o vector
        rayCaster.set(policeMan.model.position, vector)
        // True nos sirve cuando también queremos saber si se colisionó con los hijos de estos objetos
        var collide = rayCaster.intersectObjects(objectsWithBoundingBox, true);
        if(collide.length > 0 && collide[0].distance < 2.5) {
            var collidedUUID = collide[0].object.parent.uuid;
            // Filter the array and remove the objects with matching uuid
            objectsWithBoundingBox = objectsWithBoundingBox.filter(function(obj) {
                return !obj.uuid.includes(collidedUUID);
            });
            // Filter the array and remove the objects with matching uuid
            boundingBoxes = boundingBoxes.filter(function(obj) {
                return !obj.uuid.includes(collidedUUID);
            });
            scene.remove(collide[0].object.parent);
        }
    }
}


function updateMouseAI(delta) {

    const nearestCheese = cheeses[0];

    if(nearestCheese != undefined && mouse.canMove) {
        mouse.model.lookAt(nearestCheese.model.position);

        if(mouse.model.position.distanceTo(nearestCheese.model.position) > POLICE_RANGE){
            
            mouse.model.translateZ(SPEED * delta);

            powerUps.forEach((powerUp, index) => {

                if (powerUp.boundingBox.intersectsBox(mouse.boundingBox)) {

                    if(powerUp.executePowerUp(mouse, scene)) {
                        
                        powerUps.splice(index, 1);
                        scene.remove(powerUp.model);
                    }

                }

            });

            isMouseAICollidingWithCheeses();
        }
    
    }

}

function insertRecord(playerName, score) {

    $.ajax({
        type: "POST",
        url: "/services/InsertRecord.php",
        data: {
            player_name: playerName,
            score: score
        }
    }).done(function(data) {

    }).fail(function(e) {
        
    });
}