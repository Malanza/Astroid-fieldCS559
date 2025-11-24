// @ts-nocheck

//TODO: Refactor input handling (MELVIN)
// Input state
let keys = {};

// Event listeners
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Export the input handling function
export function handleInput(player, gameRunning) {
    if (!gameRunning) return;
    
    const moveSpeed = 0.3;
    
    // Left/Right movement
    if (keys['d'] || keys['D'] || keys['ArrowRight']) {
        player.position.x = Math.max(player.position.x - moveSpeed, -10);
    }
    if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
        player.position.x = Math.min(player.position.x + moveSpeed, 10);
    }
    
    // Up/Down movement
    if (keys['w'] || keys['W'] || keys['ArrowUp']) {
        player.position.y = Math.min(player.position.y + moveSpeed, 5);
    }
    if (keys['s'] || keys['S'] || keys['ArrowDown']) {
        player.position.y = Math.max(player.position.y - moveSpeed, -5);
    }
}

// Export keys state for other uses
export { keys };