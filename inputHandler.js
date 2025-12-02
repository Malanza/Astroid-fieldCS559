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
    
    // Horizontal Movement (A/D)
    if (keys['d'] || keys['D']) {
        // Moving right (D) decreases x-position in your setup
        player.position.x = Math.max(player.position.x - moveSpeed, -10); 
    }
    if (keys['a'] || keys['A']) {
        // Moving left (A) increases x-position in your setup
        player.position.x = Math.min(player.position.x + moveSpeed, 10);
    }
    
    // Vertical Movement (W/S) - NEW
    // W for up (increases y-position)
    if (keys['w'] || keys['W']) {
        // Ensure the player doesn't go above the upper boundary (+10, as the main.js bounds are 12 and -12 for x)
        player.position.y = Math.min(player.position.y + moveSpeed, 10);
    }
    // S for down (decreases y-position)
    if (keys['s'] || keys['S']) {
        // Ensure the player doesn't go below the lower boundary (-10)
        player.position.y = Math.max(player.position.y - moveSpeed, -10);
    }
}

// Export keys state for other uses
export { keys };