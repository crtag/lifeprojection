/**
 * UI Controller
 * Manages dat.GUI controls and parameter binding
 */

export class UIController {
    constructor(sceneManager, gridManager, gameEngine, organismTracker, particleManager, themeManager) {
        this.scene = sceneManager;
        this.grid = gridManager;
        this.game = gameEngine;
        this.organisms = organismTracker;
        this.particles = particleManager;
        this.themes = themeManager;

        // Parameters object for dat.GUI
        this.params = {
            simulation: {
                tickSpeed: 1.0,
                paused: false
            },
            sphere: {
                radius: 100,
                gridOpacity: 0.3,
                subdivisions: 4
            },
            organisms: {
                minAge: 50,
                minSize: 10,
                angularTolerance: 15
            },
            particles: {
                flowSpeed: 1.0,
                vibrationMode: false,
                particleSize: 2.0
            },
            visual: {
                theme: 'dark',
                cellOpacity: 0.7
            },
            seed: {
                pattern: 'random',
                density: 0.2,
                regenerate: () => this.regenerateSeed()
            }
        };

        this.initGUI();
    }

    initGUI() {
        this.gui = new dat.GUI();

        // Simulation Folder
        const simFolder = this.gui.addFolder('Simulation');
        simFolder.add(this.params.simulation, 'tickSpeed', 0.1, 5.0).step(0.1)
            .name('Tick Speed (s)')
            .onChange(value => this.game.setTickSpeed(value));
        simFolder.add(this.params.simulation, 'paused')
            .name('Paused')
            .onChange(value => this.game.setPaused(value));
        simFolder.open();

        // Sphere Folder
        const sphereFolder = this.gui.addFolder('Sphere');
        sphereFolder.add(this.params.sphere, 'radius', 50, 500).step(10)
            .name('Radius')
            .onChange(value => {
                this.grid.updateRadius(value);
                this.regenerateSeed();
            });
        sphereFolder.add(this.params.sphere, 'gridOpacity', 0.1, 1.0).step(0.1)
            .name('Grid Opacity')
            .onChange(value => this.grid.setGridOpacity(value));
        sphereFolder.add(this.params.sphere, 'subdivisions', 2, 6).step(1)
            .name('Subdivisions')
            .onChange(value => {
                this.grid.updateSubdivisions(value);
                this.regenerateSeed();
            });
        sphereFolder.open();

        // Organisms Folder
        const orgFolder = this.gui.addFolder('Organism Pairing');
        orgFolder.add(this.params.organisms, 'minAge', 10, 200).step(5)
            .name('Min Age (ticks)')
            .onChange(value => this.organisms.setMinAge(value));
        orgFolder.add(this.params.organisms, 'minSize', 5, 100).step(5)
            .name('Min Size (cells)')
            .onChange(value => this.organisms.setMinSize(value));
        orgFolder.add(this.params.organisms, 'angularTolerance', 5, 45).step(5)
            .name('Angular Tolerance (°)')
            .onChange(value => this.organisms.setAngularTolerance(value));
        orgFolder.open();

        // Particles Folder
        const particlesFolder = this.gui.addFolder('Particles');
        particlesFolder.add(this.params.particles, 'flowSpeed', 0, 5.0).step(0.1)
            .name('Flow Speed')
            .onChange(value => this.particles.setFlowSpeed(value));
        particlesFolder.add(this.params.particles, 'vibrationMode')
            .name('Vibration Mode')
            .onChange(value => this.particles.setVibrationMode(value));
        particlesFolder.add(this.params.particles, 'particleSize', 0.5, 5.0).step(0.5)
            .name('Particle Size')
            .onChange(value => this.particles.setParticleSize(value));
        particlesFolder.open();

        // Visual Folder
        const visualFolder = this.gui.addFolder('Visual');
        visualFolder.add(this.params.visual, 'theme', ['light', 'dark'])
            .name('Theme')
            .onChange(value => this.switchTheme(value));
        visualFolder.add(this.params.visual, 'cellOpacity', 0.3, 1.0).step(0.1)
            .name('Cell Opacity')
            .onChange(value => this.game.setCellOpacity(value));
        visualFolder.open();

        // Seed Folder
        const seedFolder = this.gui.addFolder('Initial Seed');
        seedFolder.add(this.params.seed, 'pattern', ['random', 'cluster', 'ring'])
            .name('Pattern');
        seedFolder.add(this.params.seed, 'density', 0.1, 0.5).step(0.05)
            .name('Density');
        seedFolder.add(this.params.seed, 'regenerate')
            .name('Regenerate');
        seedFolder.open();
    }

    switchTheme(themeName) {
        this.scene.switchTheme(themeName);
        const theme = this.themes.getTheme(themeName);
        this.grid.setGridColor(theme.gridColor);
    }

    regenerateSeed() {
        this.game.initialize(this.params.seed.pattern, this.params.seed.density);
    }

    destroy() {
        this.gui.destroy();
    }
}
