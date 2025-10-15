/**
 * Particle Flow Manager
 * Manages particle flows between paired organisms
 */

class ParticleFlowManager {
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
        console.log(`Creating particle connection for pair ${pair.id}`);

        // Create path
        const path = this.createPath(
            pair.organismA.centerPosition,
            pair.organismB.centerPosition
        );

        // Create particle geometry
        const particleCount = this.particlesPerConnection;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const progress = new Float32Array(particleCount);

        // Initialize particles along the path
        for (let i = 0; i < particleCount; i++) {
            const t = i / particleCount;
            const point = path.getPoint(t);

            positions[i * 3] = point.x;
            positions[i * 3 + 1] = point.y;
            positions[i * 3 + 2] = point.z;

            progress[i] = t;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('progress', new THREE.BufferAttribute(progress, 1));

        // Create material
        const material = new THREE.PointsMaterial({
            size: this.particleSize,
            color: pair.color,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        // Create particle system
        const particleSystem = new THREE.Points(geometry, material);
        this.scene.add(particleSystem);

        // Store connection data
        this.connections.set(pair.id, {
            pair: pair,
            particleSystem: particleSystem,
            path: path,
            particleCount: particleCount,
            time: 0
        });
    }

    updateConnection(pair, deltaTime) {
        const connection = this.connections.get(pair.id);
        if (!connection) return;

        // Update path if organisms moved (recalculate center positions)
        const newPath = this.createPath(
            pair.organismA.centerPosition,
            pair.organismB.centerPosition
        );
        connection.path = newPath;

        // Update particle positions
        const positions = connection.particleSystem.geometry.attributes.position;
        const progressAttr = connection.particleSystem.geometry.attributes.progress;

        if (this.vibrationMode) {
            // Vibration: particles stay in place but oscillate
            for (let i = 0; i < connection.particleCount; i++) {
                const baseProgress = i / connection.particleCount;
                const vibration = Math.sin(connection.time * 5 + i * 0.5) * 0.02;
                const t = baseProgress + vibration;

                const point = connection.path.getPoint(Math.max(0, Math.min(1, t)));

                positions.array[i * 3] = point.x;
                positions.array[i * 3 + 1] = point.y;
                positions.array[i * 3 + 2] = point.z;
            }
        } else {
            // Flow: particles move along the path
            for (let i = 0; i < connection.particleCount; i++) {
                let t = progressAttr.array[i];
                t += this.flowSpeed * deltaTime * 0.2;

                if (t > 1.0) {
                    t = 0.0; // Loop back
                }

                progressAttr.array[i] = t;

                const point = connection.path.getPoint(t);

                positions.array[i * 3] = point.x;
                positions.array[i * 3 + 1] = point.y;
                positions.array[i * 3 + 2] = point.z;
            }

            progressAttr.needsUpdate = true;
        }

        positions.needsUpdate = true;
        connection.time += deltaTime;
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
            this.scene.remove(connection.particleSystem);
            connection.particleSystem.geometry.dispose();
            connection.particleSystem.material.dispose();
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
            connection.particleSystem.material.size = size;
        });
    }
}
