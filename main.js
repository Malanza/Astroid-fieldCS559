// @ts-nocheck
import * as T from "./libs/three.js";
import { handleInput, keys } from "./inputHandler.js";
import { soundManager } from "./soundManager.js";
import { GLTFLoader } from './libs/GLTFLoader.js';
import { renderStars } from "./libs/stars.js";

const loader = new GLTFLoader();
let asteroidMesh = null;
let asteroidMesh2 = null;
loader.load('/assets/asteroid3.glb', (gltf) => {
    gltf.scene.traverse(child => {
        if (child.isMesh) {
            asteroidMesh = child;     // this is your real mesh
        }
    });
}, undefined, (error) => {
  console.error('Error: could not load asteroid object', error);
});
loader.load('/assets/asteroid4.glb', (gltf) => {
    gltf.scene.traverse(child => {
        if (child.isMesh) {
            asteroidMesh2 = child;     // this is your real mesh
        }
    });
}, undefined, (error) => {
  console.error('Error: could not load asteroid object', error);
});

let renderer = new T.WebGLRenderer({preserveDrawingBuffer:true});
renderer.setSize(500, 500);
document.getElementById("div1").appendChild(renderer.domElement);
renderer.domElement.id = "canvas";

const scene = new T.Scene();
const camera = new T.PerspectiveCamera( 75, 500 / 500, 0.1, 1000 );

renderStars(scene)

// Game state
let isPrototypeMode = true;
let gameSpeed = 0.1;
let baseGameSpeed = 0.1;
let obstacles = [];
let player;
let gameRunning = false;
let gameStarted = false;
let gamePaused = false;
let lives = 3;
let invulnerable = false;
let invulnerabilityTimer = 0;
let gameTime = 0;
let survivalTime = 0;
let projectiles = [];
let score = 0;
let highScore = parseInt(localStorage.getItem('asteroidHighScore')) || 0;
let particles = [];
const PROJECTILE_SPEED = 0.8;
const FIRE_RATE = 400;
let lastShotTime = 0;

// Polished constants
const MAX_OBSTACLES = 25;
const COLLISION_DISTANCE = 2.2;
const INVULNERABILITY_TIME = 100;
const BOUNDARY_X = 12;
const BOUNDARY_Y = 6;
const POINTS_PER_DESTROY = 20;

// Button references
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const modeBtn = document.getElementById('modeBtn');
const soundBtn = document.getElementById('soundBtn');
const livesDisplay = document.getElementById('lives');
const modeDisplay = document.getElementById('modeDisplay');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');
const timerDisplay = document.getElementById('timer');

const gameOverScreen = document.getElementById('game-over-screen');
// Button event listeners
startBtn.addEventListener('click', startGame);
stopBtn.addEventListener('click', pauseGame);
resetBtn.addEventListener('click', resetGame);
modeBtn.addEventListener('click', toggleMode);
soundBtn.addEventListener('click', toggleSound);

// Sound system
function playSound(soundName) {
    soundManager.play(soundName);
}

function toggleSound() {
    const isEnabled = soundManager.toggle();
    soundBtn.textContent = isEnabled ? 'Sound: ON' : 'Sound: OFF';
}

function updateLivesDisplay() {
    livesDisplay.textContent = `Lives: ${lives}`;
}

function updateModeDisplay() {
    modeDisplay.textContent = `Mode: ${isPrototypeMode ? 'Prototype' : 'Full'}`;
    modeBtn.textContent = isPrototypeMode ? 'Switch to Full Mode' : 'Switch to Prototype Mode';
}

function updateScoreDisplay() {
    scoreDisplay.textContent = `Score: ${score}`;
}

function updateHighScoreDisplay() {
    highScoreDisplay.textContent = `High Score: ${highScore}`;
}

function updateTimerDisplay() {
    const seconds = Math.floor(survivalTime / 60);
    const minutes = Math.floor(seconds / 60);
    const displaySeconds = seconds % 60;
    timerDisplay.textContent = `Time: ${minutes}:${displaySeconds.toString().padStart(2, '0')}`;
}

function addScore(points) {
    score += points;
    updateScoreDisplay();
    console.log(`Score: ${score} (+${points})`);
}

function checkHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('asteroidHighScore', highScore.toString());
        updateHighScoreDisplay();
        console.log(`New High Score: ${highScore}!`);
        return true;
    }
    return false;
}

// Particle System
function createParticle(position, velocity, color, life) {
    const geometry = new T.SphereGeometry(0.15, 6, 6);
    const material = new T.MeshStandardMaterial({ 
        color: color,
        transparent: true,
        opacity: 1.0,
        emissive: color,
        emissiveIntensity: 0.3
    });
    
    const particle = new T.Mesh(geometry, material);
    particle.position.copy(position);
    
    particle.userData = {
        velocity: velocity.clone(),
        life: life,
        maxLife: life,
        fadeRate: 1.0 / life
    };
    
    scene.add(particle);
    particles.push(particle);
}

function createExplosion(position) {
    playSound('explosion');
    
    for (let i = 0; i < 12; i++) {
        const velocity = new T.Vector3(
            (Math.random() - 0.5) * 0.6,
            (Math.random() - 0.5) * 0.6,
            (Math.random() - 0.5) * 0.6
        );
        
        const colors = [0xff8800, 0xff4400, 0xffcc00, 0xff0000, 0xffaa00];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        createParticle(position, velocity, color, 40 + Math.random() * 30);
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        const userData = particle.userData;
        
        particle.position.add(userData.velocity);
        userData.velocity.y -= 0.008;
        userData.velocity.multiplyScalar(0.99);
        
        userData.life--;
        const fadeRatio = userData.life / userData.maxLife;
        particle.material.opacity = fadeRatio;
        particle.material.emissiveIntensity = fadeRatio * 0.5;
        
        if (userData.life <= 0) {
            scene.remove(particle);
            particle.geometry.dispose();
            particle.material.dispose();
            particles.splice(i, 1);
        }
    }
}

function startGame() {
    if (gamePaused) {
        // Resume from pause
        gameRunning = true;
        gamePaused = false;
        stopBtn.textContent = 'Pause Game';
        console.log("Game Resumed");
    } else {
        // Start new game
        gameRunning = true;
        gameStarted = true;
        gamePaused = false;
        gameTime = 0;
        survivalTime = 0;
        playSound('gameStart');
    }
    
    startBtn.disabled = true;
    stopBtn.disabled = false;
    modeBtn.disabled = true;
    if (gameOverScreen) gameOverScreen.style.display = 'none';
    console.log("Game Started!");
}

function pauseGame() {
    if (lives <= 0) return; // Can't pause if game over
    
    if (gameRunning) {
        // Pause the game
        gameRunning = false;
        gamePaused = true;
        startBtn.disabled = true; // Keep start disabled
        stopBtn.textContent = 'Resume Game';
        stopBtn.disabled = false;
        modeBtn.disabled = false;
        console.log("Game Paused - Click Resume to Continue");
        playSound('pause');
    } else if (gamePaused) {
        // Resume the game
        gameRunning = true;
        gamePaused = false;
        startBtn.disabled = true;
        stopBtn.textContent = 'Pause Game';
        stopBtn.disabled = false;
        modeBtn.disabled = true;
        console.log("Game Resumed");
    }
}

function resetGame() {
    gameRunning = false;
    gameStarted = false;
    gamePaused = false;
    gameSpeed = baseGameSpeed;
    gameTime = 0;
    survivalTime = 0;
    lives = 3;
    score = 0;
    invulnerable = false;
    invulnerabilityTimer = 0;
    updateLivesDisplay();
    updateScoreDisplay();
    updateTimerDisplay();
    
    // Clear all obstacles
    obstacles.forEach(obstacle => {
        scene.remove(obstacle);
        obstacle.geometry.dispose();
        obstacle.material.dispose();
    });
    obstacles = [];
    
    // Clear all particles
    particles.forEach(particle => {
        scene.remove(particle);
        particle.geometry.dispose();
        particle.material.dispose();
    });
    particles = [];
    
    // Reset player position and appearance
    if (player) {
        player.position.set(0, 0, -5);
        player.material.color.setHex(0x00ff00);
        player.material.opacity = 1.0;
        player.material.transparent = true;
    }
    
    // Reset buttons
    startBtn.disabled = false;
    stopBtn.disabled = true;
    stopBtn.textContent = 'Pause Game';
    modeBtn.disabled = false;

    // Clear all projectiles
    projectiles.forEach(p => {
        scene.remove(p);
        p.geometry.dispose();
        p.material.dispose();
    });
    projectiles = [];

    if (gameOverScreen) gameOverScreen.style.display = 'none';
    
    console.log("Game Reset!");
}

function loseLife() {
    lives--;
    updateLivesDisplay();
    playSound('hit');
    
    if (lives <= 0) {
        const newHighScore = checkHighScore();
        
        gameRunning = false;
        gamePaused = false;
        startBtn.disabled = true;
        stopBtn.disabled = true;
        modeBtn.disabled = false;
        
        playSound('gameOver');
        
        if (newHighScore) {
            console.log(`Game Over! NEW HIGH SCORE: ${highScore}! Survived: ${Math.floor(survivalTime / 60)}s`);
        } else {
            console.log(`Game Over! Final Score: ${score} | High Score: ${highScore} | Survived: ${Math.floor(survivalTime / 60)}s`);
        }
        // stopGame();
        if (gameOverScreen) gameOverScreen.style.display = 'flex';
        console.log("Game Over! No lives remaining!");
        return;
    }
    
    invulnerable = true;
    invulnerabilityTimer = INVULNERABILITY_TIME;
    
    player.material.color.setHex(0xff0000);
    setTimeout(() => {
        if (player) {
            player.material.color.setHex(0x00ff00);
            player.material.opacity = 0.6;
        }
    }, 150);
}

// Player (Cube in prototype mode)
function createPlayer() {
    const geometry = new T.BoxGeometry(2, 2, 2);
    const material = new T.MeshStandardMaterial({ 
        color: 0x00ff00,
        transparent: true,
        opacity: 1.0
    });
    player = new T.Mesh(geometry, material);
    player.position.set(0, 0, -5);
    scene.add(player);
}

function shootProjectile() {
    if (!gameRunning || gamePaused) return;

    const now = Date.now();
    if (now - lastShotTime < FIRE_RATE) return;
    lastShotTime = now;

    playSound('shoot');

    const geometry = new T.BoxGeometry(0.2, 0.2, 2);
    const material = new T.MeshStandardMaterial({ 
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 0.5
    });
    
    const projectile = new T.Mesh(geometry, material);
    projectile.position.copy(player.position);
    
    scene.add(projectile);
    projectiles.push(projectile);
}

function spawnProjectile() {
    const geometry = new T.BoxGeometry(0.2, 0.2, 1); 
    const material = new T.MeshStandardMaterial({ 
        color: 0xffff00, 
        emissive: 0xffff00,
        emissiveIntensity: 0.8
    });
    const projectile = new T.Mesh(geometry, material);

    projectile.position.copy(player.position);
    projectile.position.z += 1.0; 

    scene.add(projectile);
    projectiles.push(projectile);
}

function spawnObstacle() {
    if (!gameRunning || gamePaused || obstacles.length >= MAX_OBSTACLES) return;
    
    const obstacleType = Math.random() < 0.5 ? 'asteroid' : 'asteroid2';
    // const obstacleType = 'asteroid';
    let geometry, material, obstacle;
    let obstacleSize = 5;

    if (isPrototypeMode) {    
        const radius = 0.8 + Math.random() * 1.8; // More size variety
        geometry = new T.SphereGeometry(radius, 8, 6);
        material = new T.MeshStandardMaterial({ color: 0xff4444 }); 
        obstacle = new T.Mesh(geometry, material);
    } else {
        if (obstacleType === 'asteroid') {
            obstacle = asteroidMesh.clone(true)
            obstacleSize = 1;
            // console.log(obstacle);
        } else if (obstacleType === 'asteroid2') {
            obstacle = asteroidMesh2.clone(true)
            obstacleSize = 1.5;
        }
    }
    
    obstacle.position.set(
        (Math.random() - 0.5) * 24,
        (Math.random() - 0.5) * 12,
        25 + Math.random() * 10
    );
    
    const axis = new T.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
    ).normalize();
    const angularSpeed = 0.01 + Math.random() * 0.03;


    const scale = 1 + Math.random() * 1.5;  // size between 0.5x and 2.0x
    obstacle.scale.set(scale, scale, scale);

    // Add speed variety - each obstacle has its own speed multiplier
    const speedMultiplier = 0.7 + Math.random() * 0.6; // Between 0.7x and 1.3x base speed
    
    const box = new T.Box3().setFromObject(obstacle);
    const sizeVec = new T.Vector3();
    box.getSize(sizeVec);

    obstacle.userData = {
        rotationAxis: axis,
        angularSpeed: angularSpeed,
        size: obstacleSize * scale,
        speedMultiplier: speedMultiplier // Individual speed for this obstacle
    };
        
    scene.add(obstacle);
    obstacles.push(obstacle);
}

function updateProjectiles() {
    if (keys[" "] || keys["Spacebar"]) {
        const now = Date.now();
        if (now - lastShotTime > FIRE_RATE) {
            spawnProjectile();
            lastShotTime = now;
        }
    }

    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        
        p.position.z += PROJECTILE_SPEED;

        if (p.position.z > 50) {
            scene.remove(p);
            p.geometry.dispose();
            p.material.dispose();
            projectiles.splice(i, 1);
            continue;
        }

        for (let j = obstacles.length - 1; j >= 0; j--) {
            const obs = obstacles[j];
            const dist = p.position.distanceTo(obs.position);
            
            // Get obstacle size (from your existing userData)
            const hitDistance = obs.userData.size;

            if (dist < hitDistance) {
                createExplosion(obs.position);
                addScore(POINTS_PER_DESTROY);
                
                scene.remove(obs);
                obs.geometry.dispose();
                obs.material.dispose();
                obstacles.splice(j, 1);
                
                scene.remove(p);
                p.geometry.dispose();
                p.material.dispose();
                projectiles.splice(i, 1);
                
                break;
            }
        }
    }
}

function checkCollisions() {
    if (invulnerable) return;
    
    obstacles.forEach(obstacle => {
        const distance = player.position.distanceTo(obstacle.position);
        const collisionThreshold = Math.max(COLLISION_DISTANCE, obstacle.userData.size);
        
        if (distance < collisionThreshold) {
            loseLife();
            return;
        }
    });
}

function updateDifficulty() {
    gameTime++;
    gameSpeed = baseGameSpeed + (gameTime * 0.00005);
    gameSpeed = Math.min(gameSpeed, 0.25);
}

function updatePlayerBounds() {
    if (player) {
        player.position.x = Math.max(-BOUNDARY_X, Math.min(BOUNDARY_X, player.position.x));
        player.position.y = Math.max(-BOUNDARY_Y, Math.min(BOUNDARY_Y, player.position.y));
    }
}

function updateGame() {
    if (!gameRunning || gamePaused) return;
    
    // Update survival time
    survivalTime++;
    if (survivalTime % 60 === 0) { // Update every second
        updateTimerDisplay();
    }
    
    updateDifficulty();
    updateProjectiles();
    updateParticles();
    
    if (invulnerable) {
        invulnerabilityTimer--;
        if (invulnerabilityTimer <= 0) {
            invulnerable = false;
            player.material.opacity = 1.0;
        } else {
            player.material.opacity = 0.4 + 0.4 * Math.sin(invulnerabilityTimer * 0.3);
        }
    }
    
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        
        obstacle.position.z -= gameSpeed * obstacle.userData.speedMultiplier;

        // if (obstacle.userData.debugSphere) {
        //     obstacle.userData.debugSphere.position.copy(obstacle.position);
        // }

        // Rotate around random axis
        const axis = obstacle.userData.rotationAxis;
        const angle = obstacle.userData.angularSpeed;
        obstacle.rotateOnAxis(axis, angle);

        // Remove obstacles that have passed the player
        if (obstacle.position.z < -15) {
            scene.remove(obstacle);
            obstacle.geometry.dispose();
            obstacle.material.dispose();
            obstacles.splice(i, 1);
        }
    }
    
    let spawnChance = 0.018 + (gameTime * 0.000002);
    spawnChance = Math.min(spawnChance, 0.035);
    
    if (Math.random() < spawnChance) {
        spawnObstacle();
    }
    
    if (Math.random() < 0.003) {
        for (let j = 0; j < 2; j++) {
            setTimeout(() => spawnObstacle(), j * 300);
        }
    }
    
    checkCollisions();
}

function toggleMode() {
    if (gameRunning) return;
    
    isPrototypeMode = !isPrototypeMode;
    updateModeDisplay();
    resetGame();
}

// Keydown event for shooting only
window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        event.preventDefault();
        shootProjectile();
    }
});

// Handle browser autoplay policy
document.addEventListener('click', () => {
    if (soundManager.audioContext && soundManager.audioContext.state === 'suspended') {
        soundManager.audioContext.resume();
    }
}, { once: true });

// Camera setup
camera.position.set(0, 8, -15);
camera.lookAt(0, 0, 0);

// Enhanced lighting
scene.add(new T.AmbientLight("white", 0.3));
let directionalLight = new T.DirectionalLight(0xffffff, 2);
directionalLight.position.set(10, 10, 5);
directionalLight.castShadow = false;
scene.add(directionalLight);

let rimLight = new T.DirectionalLight(0x4488ff, 0.2);
rimLight.position.set(-10, 5, -10);
scene.add(rimLight);

renderer.setClearColor(0x000011);

// Initialize game
createPlayer();
updateLivesDisplay();
updateModeDisplay();
updateScoreDisplay();
updateHighScoreDisplay();
updateTimerDisplay();

// Initialize button states
stopBtn.disabled = true;

function animate() {
    handleInput(player, gameRunning && !gamePaused);
    updatePlayerBounds();
    updateGame();
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);