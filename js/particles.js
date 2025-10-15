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
        console.log(`Creating fiber optic cable connection for pair ${pair.id}`);

        // Create path
        const path = this.createPath(
            pair.organismA.centerPosition,
            pair.organismB.centerPosition
        );

        // Create bundle of fiber optic cables (5 cables)
        const numCables = 5;
        const cables = [];
        const baseColor = new THREE.Color(pair.color);

        for (let i = 0; i < numCables; i++) {
            // Position each cable in a bundle around the center
            const angle = (i / numCables) * Math.PI * 2;
            const bundleRadius = 1.5;
            const offsetX = Math.cos(angle) * bundleRadius;
            const offsetY = Math.sin(angle) * bundleRadius;

            // Create path points with offset
            const segments = 150;
            const points = [];

            for (let j = 0; j <= segments; j++) {
                const t = j / segments;
                const centerPoint = path.getPoint(t);
                const tangent = path.getTangent(t);

                // Create perpendicular vectors for offset
                const up = new THREE.Vector3(0, 1, 0);
                const perp1 = new THREE.Vector3().crossVectors(tangent, up).normalize();
                const perp2 = new THREE.Vector3().crossVectors(tangent, perp1).normalize();

                // Apply offset
                const offset = new THREE.Vector3()
                    .addScaledVector(perp1, offsetX)
                    .addScaledVector(perp2, offsetY);

                points.push(centerPoint.clone().add(offset));
            }

            // Create tube geometry for cable
            const cableCurve = new THREE.CatmullRomCurve3(points);
            const tubeGeometry = new THREE.TubeGeometry(cableCurve, segments, 0.4, 8, false);

            // Create unique color for each cable
            const cableColor = baseColor.clone();
            cableColor.offsetHSL((i / numCables) * 0.3, 0, 0);

            // Shader for animated pulses
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    color: { value: cableColor },
                    pulseOffset: { value: i * 0.2 }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform vec3 color;
                    uniform float pulseOffset;
                    varying vec2 vUv;

                    void main() {
                        // Create bright light pulses traveling along cable
                        float pulse1Pos = fract(time * 0.3 + pulseOffset);
                        float pulse2Pos = fract(time * 0.5 + pulseOffset + 0.5);
                        float pulse3Pos = fract(time * 0.2 + pulseOffset + 0.7);

                        // Sharp bright pulses
                        float pulse1 = smoothstep(0.05, 0.0, abs(vUv.x - pulse1Pos)) * 3.0;
                        float pulse2 = smoothstep(0.04, 0.0, abs(vUv.x - pulse2Pos)) * 2.5;
                        float pulse3 = smoothstep(0.03, 0.0, abs(vUv.x - pulse3Pos)) * 2.0;

                        // Base cable glow
                        float baseGlow = 0.4;

                        // Radial falloff (brighter in center of tube)
                        float radial = 1.0 - abs(vUv.y - 0.5) * 2.0;
                        radial = pow(radial, 1.5);

                        // Combine all effects
                        float intensity = (baseGlow + pulse1 + pulse2 + pulse3) * radial;

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

            const cableMesh = new THREE.Mesh(tubeGeometry, material);
            this.scene.add(cableMesh);

            cables.push({
                mesh: cableMesh,
                pulseOffset: i * 0.2
            });
        }

        // Store connection data
        this.connections.set(pair.id, {
            pair: pair,
            cables: cables,
            particleSystem: cables[0].mesh, // Keep for compatibility
            path: path,
            time: 0
        });
    }

    updateConnection(pair, deltaTime) {
        const connection = this.connections.get(pair.id);
        if (!connection) return;

        // Update time
        connection.time += deltaTime * this.flowSpeed;

        // Update shader uniforms for each cable
        connection.cables.forEach(cable => {
            if (cable.mesh.material.uniforms) {
                cable.mesh.material.uniforms.time.value = connection.time;
            }
        });

        // TODO: Update cable geometry if organisms move
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
            connection.cables.forEach(cable => {
                this.scene.remove(cable.mesh);
                cable.mesh.geometry.dispose();
                cable.mesh.material.dispose();
            });
            this.connections.delete(pairId);
            console.log(`Removed connection ${pairId}`);
        }
    }

    detectIntersections() {
        // For fiber optic cables, intersections could be detected at sphere center
        // TODO: Implement intersection detection for cable bundle
    }

    setFlowSpeed(speed) {
        this.flowSpeed = speed;
    }

    setVibrationMode(enabled) {
        this.vibrationMode = enabled;
    }

    setParticleSize(size) {
        this.particleSize = size;
        // For fiber cables, size could affect cable thickness or glow
        // Currently fixed, could be enhanced to scale cable radius
    }
}
