/**
 * Life Projection - Main Entry Point
 * Initializes all modules and starts the animation loop
 */

// Global state
let scene, grid, gameOfLife, organisms, particles, ui, themes;
let clock;
let animationId;

/**
 * Initialize the application
 */
async function init() {
    console.log('Initializing Life Projection...');

    try {
        // Initialize clock for delta time
        clock = new THREE.Clock();

        // Initialize modules in order
        themes = new ThemeManager();
        scene = new SceneManager(themes);
        grid = new GridManager(scene);
        gameOfLife = new GameOfLifeEngine(grid, scene);
        organisms = new OrganismTracker(grid, gameOfLife, scene);
        particles = new ParticleFlowManager(scene, organisms);
        ui = new UIController(scene, grid, gameOfLife, organisms, particles, themes);

        // Hide loading screen
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.classList.add('hidden');
        }

        console.log('Initialization complete!');

        // Start animation loop
        animate();

    } catch (error) {
        console.error('Initialization failed:', error);
        alert('Failed to initialize application. Check console for details.');
    }
}

/**
 * Main animation loop
 */
function animate() {
    animationId = requestAnimationFrame(animate);

    // Get delta time
    const deltaTime = clock.getDelta();

    // Update scene controls
    scene.update(deltaTime);

    // Update game logic (handles its own tick timing)
    gameOfLife.update(deltaTime);

    // Update organisms (runs after game ticks)
    organisms.update(deltaTime);

    // Update particles (runs every frame)
    particles.update(deltaTime);

    // Render
    scene.render();
}

/**
 * Handle window resize
 */
function onWindowResize() {
    if (scene) {
        scene.handleResize();
    }
}

/**
 * Cleanup on page unload
 */
function cleanup() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    if (scene) {
        scene.dispose();
    }
    console.log('Cleanup complete');
}

// Event listeners
window.addEventListener('resize', onWindowResize);
window.addEventListener('beforeunload', cleanup);

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
