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
        console.log(`Creating wormhole tunnel connection for pair ${pair.id}`);

        // Create path
        const path = this.createPath(
            pair.organismA.centerPosition,
            pair.organismB.centerPosition
        );

        // Create tube as tunnel/wormhole
        const segments = 100;
        const points = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            points.push(path.getPoint(t));
        }

        // Create tube geometry with hollow interior
        const tubeGeometry = new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(points),
            segments,
            1.5, // Tube radius
            16, // Radial segments (more for smoother appearance)
            false
        );

        // Create shader material for flowing wormhole effect
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(pair.color) },
                flowSpeed: { value: 1.0 },
                opacity: { value: 0.6 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vNormal;

                void main() {
                    vUv = uv;
                    vPosition = position;
                    vNormal = normalize(normalMatrix * normal);

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                uniform float flowSpeed;
                uniform float opacity;
                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vNormal;

                void main() {
                    // Create flowing lines pattern
                    float flow = fract(vUv.x * 10.0 - time * flowSpeed);
                    float lines = smoothstep(0.5, 0.55, flow) - smoothstep(0.6, 0.65, flow);

                    // Create spiral pattern
                    float spiral = sin(vUv.x * 20.0 + vUv.y * 6.28 - time * flowSpeed * 2.0);
                    spiral = spiral * 0.5 + 0.5;

                    // Edge glow (Fresnel-like effect)
                    vec3 viewDirection = normalize(cameraPosition - vPosition);
                    float fresnel = 1.0 - abs(dot(viewDirection, vNormal));
                    fresnel = pow(fresnel, 2.0);

                    // Combine patterns
                    float pattern = lines * 0.7 + spiral * 0.3;

                    // Create inner glow and outer edge
                    float edgeGlow = fresnel * 1.5;
                    float innerGlow = (1.0 - abs(vUv.y - 0.5) * 2.0) * 0.3;

                    // Final color with glowing edges
                    vec3 finalColor = color * (pattern + innerGlow + edgeGlow);
                    float finalAlpha = (pattern * 0.3 + edgeGlow * 0.5 + innerGlow) * opacity;

                    gl_FragColor = vec4(finalColor, finalAlpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        // Create tunnel mesh
        const tunnelMesh = new THREE.Mesh(tubeGeometry, material);
        this.scene.add(tunnelMesh);

        // Store connection data
        this.connections.set(pair.id, {
            pair: pair,
            tunnelMesh: tunnelMesh,
            particleSystem: tunnelMesh, // Keep for compatibility
            path: path,
            time: 0
        });
    }

    updateConnection(pair, deltaTime) {
        const connection = this.connections.get(pair.id);
        if (!connection) return;

        // Update time for animation
        connection.time += deltaTime;

        // Update shader uniforms for tunnel animation
        if (connection.tunnelMesh && connection.tunnelMesh.material.uniforms) {
            connection.tunnelMesh.material.uniforms.time.value = connection.time;
            connection.tunnelMesh.material.uniforms.flowSpeed.value = this.flowSpeed;
        }

        // TODO: Update tunnel geometry if organisms move
        // For now, tunnels stay in their original positions
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
            if (connection.tunnelMesh) {
                this.scene.remove(connection.tunnelMesh);
                connection.tunnelMesh.geometry.dispose();
                connection.tunnelMesh.material.dispose();
            }
            this.connections.delete(pairId);
            console.log(`Removed connection ${pairId}`);
        }
    }

    detectIntersections() {
        // For tunnel/wormhole effect, intersections happen at sphere center
        // TODO: Implement intersection detection and spawning logic
        // Could check tunnel flow intensity or position to trigger events
    }

    setFlowSpeed(speed) {
        this.flowSpeed = speed;
    }

    setVibrationMode(enabled) {
        this.vibrationMode = enabled;
    }

    setParticleSize(size) {
        this.particleSize = size;
        // For tunnel effect, size affects opacity
        this.connections.forEach(connection => {
            if (connection.tunnelMesh && connection.tunnelMesh.material.uniforms) {
                connection.tunnelMesh.material.uniforms.opacity.value = size * 0.3;
            }
        });
    }
}
