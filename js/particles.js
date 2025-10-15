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
        console.log(`Creating energy beam connection for pair ${pair.id}`);

        // Create path
        const path = this.createPath(
            pair.organismA.centerPosition,
            pair.organismB.centerPosition
        );

        // Create beam as a tube with segments
        const segments = 100;
        const points = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            points.push(path.getPoint(t));
        }

        // Create tube geometry
        const tubeGeometry = new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(points),
            segments,
            0.5, // Initial radius
            8, // Radial segments
            false
        );

        // Create shader material for energy beam effect
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(pair.color) },
                pulseSpeed: { value: 2.0 },
                glowIntensity: { value: 1.5 }
            },
            vertexShader: `
                uniform float time;
                varying vec2 vUv;
                varying float vDistance;

                void main() {
                    vUv = uv;
                    vDistance = length(position);

                    // Add slight undulation to the beam
                    vec3 pos = position;
                    float wave = sin(time * 3.0 + vDistance * 0.1) * 0.3;
                    pos += normal * wave;

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                uniform float pulseSpeed;
                uniform float glowIntensity;
                varying vec2 vUv;
                varying float vDistance;

                void main() {
                    // Create pulsing effect along the beam
                    float pulse = sin(vUv.x * 10.0 - time * pulseSpeed) * 0.5 + 0.5;

                    // Create core and glow
                    float core = 1.0 - abs(vUv.y - 0.5) * 2.0;
                    core = pow(core, 3.0);

                    // Add electrical arc flicker
                    float flicker = sin(time * 20.0 + vDistance) * 0.2 + 0.8;

                    // Combine effects
                    float intensity = core * (0.7 + pulse * 0.3) * flicker * glowIntensity;

                    vec3 finalColor = color * intensity;
                    float alpha = intensity * 0.9;

                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        // Create beam mesh
        const beamMesh = new THREE.Mesh(tubeGeometry, material);
        this.scene.add(beamMesh);

        // Store connection data
        this.connections.set(pair.id, {
            pair: pair,
            beamMesh: beamMesh,
            particleSystem: beamMesh, // Keep for compatibility
            path: path,
            time: 0
        });
    }

    updateConnection(pair, deltaTime) {
        const connection = this.connections.get(pair.id);
        if (!connection) return;

        // Update time for animation
        connection.time += deltaTime;

        // Update shader uniforms for beam animation
        if (connection.beamMesh && connection.beamMesh.material.uniforms) {
            connection.beamMesh.material.uniforms.time.value = connection.time;

            // Optionally adjust pulse speed based on flowSpeed
            connection.beamMesh.material.uniforms.pulseSpeed.value = this.flowSpeed * 2.0;
        }

        // TODO: Update beam geometry if organisms move
        // For now, beams stay in their original positions
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
            if (connection.beamMesh) {
                this.scene.remove(connection.beamMesh);
                connection.beamMesh.geometry.dispose();
                connection.beamMesh.material.dispose();
            }
            this.connections.delete(pairId);
            console.log(`Removed connection ${pairId}`);
        }
    }

    detectIntersections() {
        // For beam effect, intersections happen at the center of the sphere
        // TODO: Implement intersection detection and spawning logic
        // Could check beam intensity or time to trigger events
    }

    setFlowSpeed(speed) {
        this.flowSpeed = speed;
    }

    setVibrationMode(enabled) {
        this.vibrationMode = enabled;
    }

    setParticleSize(size) {
        this.particleSize = size;
        // For beam effect, size affects glow intensity
        this.connections.forEach(connection => {
            if (connection.beamMesh && connection.beamMesh.material.uniforms) {
                connection.beamMesh.material.uniforms.glowIntensity.value = size * 0.75;
            }
        });
    }
}
