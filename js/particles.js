/**
 * Particle Flow Manager
 * Manages particle flows between paired organisms
 */

import * as THREE from 'three';

export class ParticleFlowManager {
    constructor(sceneManager, organismTracker) {
        this.scene = sceneManager.getScene();
        this.organisms = organismTracker;

        // Settings
        this.flowSpeed = 1.0;
        this.vibrationMode = false;
        this.particlesPerConnection = 100;
        this.particleSize = 2.0;
        this.intersectionRadius = 10;

        // State
        this.connections = new Map(); // pairId -> connection data
        this.currentPairs = new Set();
    }

    update(deltaTime) {
        const pairs = this.organisms.getPairs();

        // Track current pairs
        const newPairIds = new Set(pairs.map(p => p.id));

        // Remove connections for pairs that no longer exist
        this.currentPairs.forEach(pairId => {
            if (!newPairIds.has(pairId)) {
                this.removeConnection(pairId);
            }
        });

        // Create/update connections for current pairs
        pairs.forEach(pair => {
            if (!this.connections.has(pair.id)) {
                this.createConnection(pair);
            }
            this.updateConnection(pair, deltaTime);
        });

        this.currentPairs = newPairIds;

        // Check for intersections
        this.detectIntersections();
    }

    createConnection(pair) {
        console.log(`Creating organic tendril connection for pair ${pair.id}`);

        // Create path
        const path = this.createPath(
            pair.organismA.centerPosition,
            pair.organismB.centerPosition
        );

        // Create main tendril with branches
        const tendrils = [];
        const numBranches = 3;

        // Main tendril
        const mainTendril = this.createTendril(path, pair.color, 0, 1.2);
        tendrils.push(mainTendril);

        // Side branches
        for (let i = 0; i < numBranches; i++) {
            const branchOffset = 0.3 + (i * 0.2);
            const branchTendril = this.createTendril(path, pair.color, branchOffset, 0.6);
            tendrils.push(branchTendril);
        }

        // Store connection data
        this.connections.set(pair.id, {
            pair: pair,
            tendrils: tendrils,
            particleSystem: tendrils[0].mesh, // Keep for compatibility
            path: path,
            time: 0
        });
    }

    createTendril(path, baseColor, offset, thickness) {
        const segments = 80;
        const points = [];
        const radii = [];

        // Create undulating path
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const centerPoint = path.getPoint(t);
            const tangent = path.getTangent(t);

            // Add organic wave offset
            const waveFreq = 3 + offset * 2;
            const waveAmp = 0.8 + offset;
            const wave = Math.sin(t * Math.PI * waveFreq) * waveAmp;

            const up = new THREE.Vector3(0, 1, 0);
            const perpendicular = new THREE.Vector3().crossVectors(tangent, up).normalize();
            const offsetPoint = centerPoint.clone().add(perpendicular.multiplyScalar(wave + offset * 3));

            points.push(offsetPoint);

            // Varying thickness along tendril
            const thicknessVariation = Math.sin(t * Math.PI) * 0.5 + 0.5;
            radii.push(thickness * thicknessVariation);
        }

        // Create custom tube geometry with varying radius
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeometry = new THREE.TubeGeometry(curve, segments, thickness * 0.5, 8, false);

        // Shader material for organic pulsing
        const color = new THREE.Color(baseColor);
        color.offsetHSL(offset * 0.1, 0.1, -0.1);

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: color },
                pulseFreq: { value: 2.0 + offset },
                offset: { value: offset }
            },
            vertexShader: `
                uniform float time;
                uniform float offset;
                varying vec2 vUv;
                varying vec3 vNormal;

                void main() {
                    vUv = uv;
                    vNormal = normalize(normalMatrix * normal);

                    // Undulating motion
                    vec3 pos = position;
                    float wave = sin(uv.x * 10.0 + time * 2.0 + offset) * 0.5;
                    pos += normal * wave;

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                uniform float pulseFreq;
                varying vec2 vUv;
                varying vec3 vNormal;

                void main() {
                    // Pulsing along length
                    float pulse = sin(vUv.x * 5.0 - time * pulseFreq) * 0.3 + 0.7;

                    // Edge highlight (Fresnel-like)
                    vec3 viewDirection = normalize(cameraPosition - vec3(0.0));
                    float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 2.0);

                    // Combine effects
                    float intensity = pulse * (0.6 + fresnel * 0.4);
                    vec3 finalColor = color * intensity;
                    float alpha = intensity * 0.7;

                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        const mesh = new THREE.Mesh(tubeGeometry, material);
        this.scene.add(mesh);

        return {
            mesh: mesh,
            offset: offset
        };
    }

    updateConnection(pair, deltaTime) {
        const connection = this.connections.get(pair.id);
        if (!connection) return;

        // Update time
        connection.time += deltaTime;

        // Update shader uniforms for each tendril
        connection.tendrils.forEach(tendril => {
            if (tendril.mesh.material.uniforms) {
                tendril.mesh.material.uniforms.time.value = connection.time * this.flowSpeed;
            }
        });

        // TODO: Update tendril geometry if organisms move
    }

    createPath(posA, posB) {
        // Create curved path through sphere center
        const center = new THREE.Vector3(0, 0, 0);

        // Use quadratic bezier curve for smooth flow
        const curve = new THREE.QuadraticBezierCurve3(
            posA.clone(),
            center,
            posB.clone()
        );

        return curve;
    }

    removeConnection(pairId) {
        const connection = this.connections.get(pairId);
        if (connection) {
            connection.tendrils.forEach(tendril => {
                this.scene.remove(tendril.mesh);
                tendril.mesh.geometry.dispose();
                tendril.mesh.material.dispose();
            });
            this.connections.delete(pairId);
            console.log(`Removed connection ${pairId}`);
        }
    }

    detectIntersections() {
        // For tendril effect, intersections could be at sphere center
        // TODO: Implement intersection detection for organic tendrils
    }

    setFlowSpeed(speed) {
        this.flowSpeed = speed;
    }

    setVibrationMode(enabled) {
        this.vibrationMode = enabled;
    }

    setParticleSize(size) {
        this.particleSize = size;
        this.connections.forEach(connection => {
            connection.particleSystem.material.size = size;
        });
    }
}
