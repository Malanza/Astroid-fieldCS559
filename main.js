// @ts-nocheck

import * as T from "./three.module.js";
import { handleInput } from "./inputHandler.js";

let renderer = new T.WebGLRenderer({preserveDrawingBuffer:true});
renderer.setSize(500, 500);
document.getElementById("div1").appendChild(renderer.domElement);
renderer.domElement.id = "canvas";

const scene = new T.Scene();
const camera = new T.PerspectiveCamera( 75, 500 / 500, 0.1, 1000 );

// Game state
let isPrototypeMode = true;
let gameSpeed = 0.1;
let baseGameSpeed = 0.1;
let obstacles = [];
let player;
let gameRunning = false;
let gameStarted = false;
let lives = 3;
let invulnerable = false;
let invulnerabilityTimer = 0;
let gameTime = 0;

// Polished constants
const MAX_OBSTACLES = 25; // Memory management
const COLLISION_DISTANCE = 2.2; // Slightly increased collision threshold
const INVULNERABILITY_TIME = 100; // 1.67 seconds at 60fps
const BOUNDARY_X = 12; // Play area boundaries
const BOUNDARY_Y = 6;

// Button references
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const modeBtn = document.getElementById('modeBtn');
const livesDisplay = document.getElementById('lives');
const modeDisplay = document.getElementById('modeDisplay');

// Button event listeners
startBtn.addEventListener('click', startGame);
stopBtn.addEventListener('click', stopGame);
resetBtn.addEventListener('click', resetGame);
modeBtn.addEventListener('click', toggleMode);

function updateLivesDisplay() {
    livesDisplay.textContent = `Lives: ${lives}`;
}

function updateModeDisplay() {
    modeDisplay.textContent = `Mode: ${isPrototypeMode ? 'Prototype' : 'Full'}`;
    modeBtn.textContent = isPrototypeMode ? 'Switch to Full Mode' : 'Switch to Prototype Mode';
}

function startGame() {
    gameRunning = true;
    gameStarted = true;
    gameTime = 0;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    modeBtn.disabled = true;
    console.log("Game Started!");
}

function stopGame() {
    gameRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    modeBtn.disabled = false;
    console.log("Game Stopped!");
}

function resetGame() {
    gameRunning = false;
    gameStarted = false;
    gameSpeed = baseGameSpeed;
    gameTime = 0;
    lives = 3;
    invulnerable = false;
    invulnerabilityTimer = 0;
    updateLivesDisplay();
    
    // Clear all obstacles
    obstacles.forEach(obstacle => {
        scene.remove(obstacle);
        // Dispose of geometry and materials to prevent memory leaks
        obstacle.geometry.dispose();
        obstacle.material.dispose();
    });
    obstacles = [];
    
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
    modeBtn.disabled = false;
    
    console.log("Game Reset!");
}

function loseLife() {
    lives--;
    updateLivesDisplay();
    
    if (lives <= 0) {
        stopGame();
        console.log("Game Over! No lives remaining!");
        return;
    }
    
    // Make player invulnerable for a short time
    invulnerable = true;
    invulnerabilityTimer = INVULNERABILITY_TIME;
    
    // Visual feedback - flash red briefly then make semi-transparent
    player.material.color.setHex(0xff0000);
    setTimeout(() => {
        if (player) {
            player.material.color.setHex(0x00ff00);
            player.material.opacity = 0.6;
        }
    }, 150);
    
    console.log(`Hit! Lives remaining: ${lives}`);
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

// Enhanced obstacle spawning with speed variety
function spawnObstacle() {
    if (!gameRunning || obstacles.length >= MAX_OBSTACLES) return;
    
    const obstacleType = Math.random() < 0.5 ? 'sphere' : 'pyramid';
    let geometry, material, obstacle;
    
    if (obstacleType === 'sphere') {
        const radius = 0.8 + Math.random() * 1.8; // More size variety
        geometry = new T.SphereGeometry(radius, 8, 6);
        material = new T.MeshStandardMaterial({ color: 0xff4444 });
    } else {
        const radius = 0.8 + Math.random() * 1.2;
        const height = 1.5 + Math.random() * 2.5;
        geometry = new T.ConeGeometry(radius, height, 6);
        material = new T.MeshStandardMaterial({ color: 0x4444ff });
    }
    
    obstacle = new T.Mesh(geometry, material);
    obstacle.position.set(
        (Math.random() - 0.5) * 24, // Wider spawn area
        (Math.random() - 0.5) * 12, // Taller spawn area
        25 + Math.random() * 10 // Variable spawn distance
    );
    
    // More varied rotation
    obstacle.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
    );
    
    // Add speed variety - each obstacle has its own speed multiplier
    const speedMultiplier = 0.7 + Math.random() * 0.6; // Between 0.7x and 1.3x base speed
    
    obstacle.userData = {
        rotationSpeed: {
            x: (Math.random() - 0.5) * 0.15,
            y: (Math.random() - 0.5) * 0.15,
            z: (Math.random() - 0.5) * 0.15
        },
        size: obstacleType === 'sphere' ? obstacle.geometry.parameters.radius : 
              Math.max(obstacle.geometry.parameters.radius, obstacle.geometry.parameters.height * 0.5),
        speedMultiplier: speedMultiplier // Individual speed for this obstacle
    };
    
    scene.add(obstacle);
    obstacles.push(obstacle);
}

// Enhanced collision detection with size-based collision
function checkCollisions() {
    if (invulnerable) return;
    
    obstacles.forEach(obstacle => {
        const distance = player.position.distanceTo(obstacle.position);
        const collisionThreshold = Math.max(COLLISION_DISTANCE, obstacle.userData.size);
        
        if (distance < collisionThreshold) {
            loseLife();
            return; // Exit after first collision
        }
    });
}

// Improved difficulty progression
function updateDifficulty() {
    gameTime++;
    
    // Gradually increase speed
    gameSpeed = baseGameSpeed + (gameTime * 0.00005);
    
    // Cap maximum speed for playability
    gameSpeed = Math.min(gameSpeed, 0.25);
}

// Keep player in boundaries
function updatePlayerBounds() {
    if (player) {
        player.position.x = Math.max(-BOUNDARY_X, Math.min(BOUNDARY_X, player.position.x));
        player.position.y = Math.max(-BOUNDARY_Y, Math.min(BOUNDARY_Y, player.position.y));
    }
}

function updateGame() {
    if (!gameRunning) return;
    
    // Update difficulty
    updateDifficulty();
    
    // Handle invulnerability timer
    if (invulnerable) {
        invulnerabilityTimer--;
        if (invulnerabilityTimer <= 0) {
            invulnerable = false;
            player.material.opacity = 1.0;
        } else {
            // Smoother flashing effect
            player.material.opacity = 0.4 + 0.4 * Math.sin(invulnerabilityTimer * 0.3);
        }
    }
    
    // Move obstacles toward player with individual speeds
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        
        // Each obstacle moves at its own speed
        obstacle.position.z -= gameSpeed * obstacle.userData.speedMultiplier;
        
        // Enhanced rotation
        obstacle.rotation.x += obstacle.userData.rotationSpeed.x;
        obstacle.rotation.y += obstacle.userData.rotationSpeed.y;
        obstacle.rotation.z += obstacle.userData.rotationSpeed.z;
        
        // Remove obstacles that have passed the player
        if (obstacle.position.z < -15) {
            scene.remove(obstacle);
            // Dispose of geometry and materials to prevent memory leaks
            obstacle.geometry.dispose();
            obstacle.material.dispose();
            obstacles.splice(i, 1);
        }
    }
    
    // Improved spawn rate with variety
    let spawnChance = 0.018 + (gameTime * 0.000002); // Gradually increase spawn rate
    spawnChance = Math.min(spawnChance, 0.035); // Cap spawn rate
    
    if (gameRunning && Math.random() < spawnChance) {
        spawnObstacle();
    }
    
    // Occasional burst spawning for variety
    if (gameRunning && Math.random() < 0.003) {
        for (let j = 0; j < 2; j++) {
            setTimeout(() => spawnObstacle(), j * 300);
        }
    }
    
    checkCollisions();
}

// Toggle between prototype and full mode
function toggleMode() {
    if (gameRunning) return;
    
    isPrototypeMode = !isPrototypeMode;
    updateModeDisplay();
    resetGame();
    
    console.log(`Switched to ${isPrototypeMode ? 'Prototype' : 'Full'} mode`);
}

// Camera setup
camera.position.set(0, 8, -15);
camera.lookAt(0, 0, 0);

// Enhanced lighting
scene.add(new T.AmbientLight("white", 0.3));
let directionalLight = new T.DirectionalLight(0xffffff, 0.7);
directionalLight.position.set(10, 10, 5);
directionalLight.castShadow = false; // Keep performance good
scene.add(directionalLight);

// Add subtle rim lighting
let rimLight = new T.DirectionalLight(0x4488ff, 0.2);
rimLight.position.set(-10, 5, -10);
scene.add(rimLight);

// Background color
renderer.setClearColor(0x000011); // Slightly blue-tinted black

// Initialize game
createPlayer();
updateLivesDisplay();
updateModeDisplay();

// Initialize button states
stopBtn.disabled = true;

function animate() {
    handleInput(player, gameRunning);
    updatePlayerBounds(); // Keep player in bounds
    updateGame();
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// CS559 2025 Workbook