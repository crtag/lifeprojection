/**
 * Scene Manager
 * Manages Three.js scene, camera, renderer, controls, and lighting
 */

class SceneManager {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.currentTheme = 'dark';

        this.initScene();
        this.initCamera();
        this.initRenderer();
        this.initLights();
        this.initControls();

        this.applyTheme(this.currentTheme);
    }

    initScene() {
        this.scene = new THREE.Scene();
    }

    initCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 1, 10000);
        this.camera.position.set(300, 200, 300);
        this.camera.lookAt(0, 0, 0);
    }

    initRenderer() {
        const container = document.getElementById('canvas-container');
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);
    }

    initLights() {
        this.lights = {};

        // Ambient light
        this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(this.lights.ambient);

        // Directional light
        this.lights.directional = new THREE.DirectionalLight(0xffffff, 0.8);
        this.lights.directional.position.set(100, 100, 50);
        this.scene.add(this.lights.directional);
    }

    initControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 120;
        this.controls.maxDistance = 1000;
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 0.5;
    }

    update(deltaTime) {
        this.controls.update();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    switchTheme(themeName) {
        this.currentTheme = themeName;
        this.applyTheme(themeName);
    }

    applyTheme(themeName) {
        const theme = this.themeManager.getTheme(themeName);

        // Update background
        this.scene.background = new THREE.Color(theme.background);

        // Update lights
        this.lights.ambient.intensity = theme.lights.ambientIntensity;
        this.lights.directional.intensity = theme.lights.directionalIntensity;
        this.lights.directional.color = new THREE.Color(theme.lights.directionalColor);
    }

    getScene() {
        return this.scene;
    }

    getCamera() {
        return this.camera;
    }

    dispose() {
        this.controls.dispose();
        this.renderer.dispose();
    }
}
