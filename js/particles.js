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
        console.log(`Creating orbital spiral connection for pair ${pair.id}`);

        // Create path
        const path = this.createPath(
            pair.organismA.centerPosition,
            pair.organismB.centerPosition
        );

        // Create multiple spiral strands (DNA-like)
        const numStrands = 3;
        const particlesPerStrand = Math.floor(this.particlesPerConnection / numStrands);
        const strands = [];

        for (let strand = 0; strand < numStrands; strand++) {
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(particlesPerStrand * 3);
            const progress = new Float32Array(particlesPerStrand);
            const sizes = new Float32Array(particlesPerStrand);
            const alphas = new Float32Array(particlesPerStrand);

            // Offset each strand's spiral phase
            const phaseOffset = (strand / numStrands) * Math.PI * 2;

            // Initialize particles with spiral offset
            for (let i = 0; i < particlesPerStrand; i++) {
                const t = i / particlesPerStrand;
                const centerPoint = path.getPoint(t);

                // Calculate orbital offset perpendicular to path
                const tangent = path.getTangent(t);
                const radius = 2.0;
                const angle = t * Math.PI * 8 + phaseOffset; // 4 full rotations along path

                // Create perpendicular vectors for spiral motion
                const up = new THREE.Vector3(0, 1, 0);
                const perpendicular1 = new THREE.Vector3().crossVectors(tangent, up).normalize();
                const perpendicular2 = new THREE.Vector3().crossVectors(tangent, perpendicular1).normalize();

                // Calculate spiral position
                const offset = new THREE.Vector3()
                    .addScaledVector(perpendicular1, Math.cos(angle) * radius)
                    .addScaledVector(perpendicular2, Math.sin(angle) * radius);

                const spiralPoint = centerPoint.clone().add(offset);

                positions[i * 3] = spiralPoint.x;
                positions[i * 3 + 1] = spiralPoint.y;
                positions[i * 3 + 2] = spiralPoint.z;

                progress[i] = t;
                sizes[i] = 0.8 + Math.sin(t * Math.PI) * 0.4;
                alphas[i] = 0.5 + Math.sin(t * Math.PI) * 0.5;
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('progress', new THREE.BufferAttribute(progress, 1));
            geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
            geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

            // Create material with custom shader for per-particle properties
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    color: { value: new THREE.Color(pair.color) },
                    baseSize: { value: this.particleSize }
                },
                vertexShader: `
                    attribute float size;
                    attribute float alpha;
                    varying float vAlpha;
                    uniform float baseSize;

                    void main() {
                        vAlpha = alpha;
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        gl_PointSize = size * baseSize * (300.0 / -mvPosition.z);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    uniform vec3 color;
                    varying float vAlpha;

                    void main() {
                        vec2 center = gl_PointCoord - vec2(0.5);
                        float dist = length(center);
                        if (dist > 0.5) discard;

                        float alpha = vAlpha * (1.0 - dist * 2.0);
                        gl_FragColor = vec4(color, alpha);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            const particleSystem = new THREE.Points(geometry, material);
            this.scene.add(particleSystem);

            strands.push({
                particleSystem: particleSystem,
                particleCount: particlesPerStrand,
                phaseOffset: phaseOffset
            });
        }

        // Store connection data
        this.connections.set(pair.id, {
            pair: pair,
            strands: strands,
            particleSystem: strands[0].particleSystem, // Keep for compatibility
            path: path,
            time: 0
        });
    }

    updateConnection(pair, deltaTime) {
        const connection = this.connections.get(pair.id);
        if (!connection) return;

        // Update time
        connection.time += deltaTime;

        // Update each spiral strand
        connection.strands.forEach(strand => {
            const positions = strand.particleSystem.geometry.attributes.position;
            const progressAttr = strand.particleSystem.geometry.attributes.progress;
            const sizes = strand.particleSystem.geometry.attributes.size;
            const alphas = strand.particleSystem.geometry.attributes.alpha;

            for (let i = 0; i < strand.particleCount; i++) {
                let t = progressAttr.array[i];
                t += this.flowSpeed * deltaTime * 0.2;

                if (t > 1.0) {
                    t = 0.0; // Loop back
                }

                progressAttr.array[i] = t;

                // Get center point along path
                const centerPoint = connection.path.getPoint(t);

                // Calculate spiral offset
                const tangent = connection.path.getTangent(t);
                const radius = 2.0;
                const angle = t * Math.PI * 8 + strand.phaseOffset + connection.time * 2.0;

                // Create perpendicular vectors
                const up = new THREE.Vector3(0, 1, 0);
                const perpendicular1 = new THREE.Vector3().crossVectors(tangent, up).normalize();
                const perpendicular2 = new THREE.Vector3().crossVectors(tangent, perpendicular1).normalize();

                // Calculate spiral position
                const offset = new THREE.Vector3()
                    .addScaledVector(perpendicular1, Math.cos(angle) * radius)
                    .addScaledVector(perpendicular2, Math.sin(angle) * radius);

                const spiralPoint = centerPoint.clone().add(offset);

                positions.array[i * 3] = spiralPoint.x;
                positions.array[i * 3 + 1] = spiralPoint.y;
                positions.array[i * 3 + 2] = spiralPoint.z;

                // Update size and alpha for pulsing effect
                sizes.array[i] = 0.8 + Math.sin(t * Math.PI + connection.time) * 0.4;
                alphas.array[i] = 0.5 + Math.sin(t * Math.PI) * 0.5;
            }

            positions.needsUpdate = true;
            progressAttr.needsUpdate = true;
            sizes.needsUpdate = true;
            alphas.needsUpdate = true;
        });
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
            connection.strands.forEach(strand => {
                this.scene.remove(strand.particleSystem);
                strand.particleSystem.geometry.dispose();
                strand.particleSystem.material.dispose();
            });
            this.connections.delete(pairId);
            console.log(`Removed connection ${pairId}`);
        }
    }

    detectIntersections() {
        // Check if particles are near sphere center
        this.connections.forEach(connection => {
            const positions = connection.particleSystem.geometry.attributes.position;
            let particlesNearCenter = 0;

            for (let i = 0; i < connection.particleCount; i++) {
                const x = positions.array[i * 3];
                const y = positions.array[i * 3 + 1];
                const z = positions.array[i * 3 + 2];

                const distance = Math.sqrt(x * x + y * y + z * z);

                if (distance < this.intersectionRadius) {
                    particlesNearCenter++;
                }
            }

            // Trigger intersection event if many particles are near center
            if (particlesNearCenter > connection.particleCount * 0.3) {
                // TODO: Spawn new organism at intersection
                // This will be implemented when we have the spawning logic
            }
        });
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
            connection.strands.forEach(strand => {
                if (strand.particleSystem.material.uniforms) {
                    strand.particleSystem.material.uniforms.baseSize.value = size;
                }
            });
        });
    }
}
