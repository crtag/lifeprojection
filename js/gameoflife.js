/**
 * Game of Life Engine
 * Implements hex-adapted Conway's Game of Life rules
 */

import * as THREE from 'three';

export class GameOfLifeEngine {
    constructor(gridManager, sceneManager) {
        this.grid = gridManager;
        this.scene = sceneManager.getScene();

        // Cell states
        this.cells = [];
        this.tileIdToIndex = new Map(); // Maps string neighborIds to array indices

        // Timing
        this.tickSpeed = 1.0; // seconds
        this.paused = false;
        this.timeSinceLastTick = 0;
        this.tickCount = 0;

        // Visual settings
        this.cellOpacity = 0.7;
        this.cellSize = 2.0;

        // Cell meshes
        this.cellMeshes = new Map(); // tileId -> mesh

        // Survival and birth rules (probability-based)
        this.survivalRules = {
            minNeighbors: 2,
            maxNeighbors: 3,
            probabilityEnabled: false,
            probability: 1.0 // Probability of survival when neighbor count is in range
        };

        this.birthRules = {
            minNeighbors: 2,
            maxNeighbors: 2,
            probabilityEnabled: false,
            probability: 1.0 // Probability of birth when neighbor count is in range
        };

        // Death rules
        this.deathRules = {
            ageDeathEnabled: false,
            ageDeathRate: 0.01, // Exponential rate parameter (lambda)
            ageDeathThreshold: 100, // Age at which exponential death starts
            suddenDeathEnabled: false,
            suddenDeathProbability: 0.001 // Per-tick probability of sudden death
        };

        this.initialize('random');
    }

    initialize(seedPattern = 'random', density = 0.2) {
        console.log(`Initializing with pattern: ${seedPattern}, density: ${density}`);

        // Clear existing cells
        this.clearCells();

        // Initialize cell states and create ID mapping
        const tiles = this.grid.getTiles();
        this.tileIdToIndex.clear();

        this.cells = tiles.map((tile, index) => {
            // Create coordinate string ID (same format as neighborIds)
            const tileId = `${tile.centerPoint.x},${tile.centerPoint.y},${tile.centerPoint.z}`;
            this.tileIdToIndex.set(tileId, index);

            return {
                tileId: index,
                alive: false,
                age: 0,
                previousState: false,
                stabilityCounter: 0
            };
        });

        // Apply seed pattern
        switch (seedPattern) {
            case 'random':
                this.seedRandom(density);
                break;
            case 'cluster':
                this.seedCluster();
                break;
            case 'ring':
                this.seedRing();
                break;
            default:
                this.seedRandom(density);
        }

        const initialAlive = this.cells.filter(c => c.alive).length;
        console.log(`Initialized: ${initialAlive} / ${this.cells.length} cells alive (${(initialAlive/this.cells.length*100).toFixed(1)}%)`);

        this.tickCount = 0;
        this.updateVisuals();
    }

    seedRandom(density) {
        this.cells.forEach(cell => {
            cell.alive = Math.random() < density;
        });
    }

    seedCluster() {
        // Create a few random clusters
        const clusterCount = 5;
        for (let i = 0; i < clusterCount; i++) {
            const centerIndex = Math.floor(Math.random() * this.cells.length);
            this.cells[centerIndex].alive = true;

            // Activate neighbors
            const neighbors = this.grid.getNeighbors(centerIndex);
            neighbors.forEach(neighbor => {
                const neighborId = this.grid.getTiles().indexOf(neighbor);
                if (neighborId >= 0) {
                    this.cells[neighborId].alive = true;
                }
            });
        }
    }

    seedRing() {
        // Create a ring around the equator
        const tiles = this.grid.getTiles();
        tiles.forEach((tile, index) => {
            const y = tile.centerPoint.y;
            const radius = this.grid.getRadius();
            // Ring at equator with some tolerance
            if (Math.abs(y) < radius * 0.1) {
                this.cells[index].alive = true;
            }
        });
    }

    update(deltaTime) {
        if (this.paused) return;

        this.timeSinceLastTick += deltaTime;

        if (this.timeSinceLastTick >= this.tickSpeed) {
            this.tick();
            this.timeSinceLastTick = 0;
        }
    }

    tick() {
        const nextStates = [];

        // Debug: count alive cells before
        const aliveBefore = this.cells.filter(c => c.alive).length;

        // Debug: sample neighbor counts for first few ticks
        const neighborStats = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

        // Calculate next state for each cell
        this.cells.forEach((cell, index) => {
            const neighborCount = this.countLivingNeighbors(index);
            let nextAlive = cell.alive;

            // Track neighbor distribution for alive cells
            if (cell.alive && this.tickCount < 3) {
                neighborStats[neighborCount]++;
            }

            // Hex-adapted GOL rules with configurable probabilities
            // Hexagonal grids have 6 neighbors (vs 8 in square grids)
            if (cell.alive) {
                // Check survival rules
                const inSurvivalRange = neighborCount >= this.survivalRules.minNeighbors &&
                                       neighborCount <= this.survivalRules.maxNeighbors;

                if (inSurvivalRange) {
                    // Apply survival probability if enabled
                    if (this.survivalRules.probabilityEnabled) {
                        nextAlive = Math.random() < this.survivalRules.probability;
                    } else {
                        nextAlive = true;
                    }
                } else {
                    nextAlive = false;
                }

                // Apply death rules if cell would survive
                if (nextAlive) {
                    // Check sudden death rule
                    if (this.deathRules.suddenDeathEnabled) {
                        if (Math.random() < this.deathRules.suddenDeathProbability) {
                            nextAlive = false;
                        }
                    }

                    // Check age-based death rule (exponential probability)
                    if (nextAlive && this.deathRules.ageDeathEnabled && cell.age >= this.deathRules.ageDeathThreshold) {
                        const ageOverThreshold = cell.age - this.deathRules.ageDeathThreshold;
                        // Exponential probability: P(death) = 1 - e^(-lambda * age)
                        const deathProbability = 1 - Math.exp(-this.deathRules.ageDeathRate * ageOverThreshold);
                        if (Math.random() < deathProbability) {
                            nextAlive = false;
                        }
                    }
                }
            } else {
                // Check birth rules
                const inBirthRange = neighborCount >= this.birthRules.minNeighbors &&
                                    neighborCount <= this.birthRules.maxNeighbors;

                if (inBirthRange) {
                    // Apply birth probability if enabled
                    if (this.birthRules.probabilityEnabled) {
                        nextAlive = Math.random() < this.birthRules.probability;
                    } else {
                        nextAlive = true;
                    }
                } else {
                    nextAlive = false;
                }
            }

            nextStates.push(nextAlive);
        });

        // Update states
        this.cells.forEach((cell, index) => {
            cell.previousState = cell.alive;
            cell.alive = nextStates[index];

            if (cell.alive) {
                cell.age++;
                if (cell.alive === cell.previousState) {
                    cell.stabilityCounter++;
                } else {
                    cell.stabilityCounter = 0;
                }
            } else {
                cell.age = 0;
                cell.stabilityCounter = 0;
            }
        });

        // Debug: count alive cells after
        const aliveAfter = this.cells.filter(c => c.alive).length;

        if (this.tickCount < 3) {
            console.log(`Tick ${this.tickCount}: ${aliveBefore} → ${aliveAfter} cells alive`);
            console.log(`  Neighbor distribution for alive cells:`, neighborStats);
        } else if (this.tickCount % 10 === 0) {
            console.log(`Tick ${this.tickCount}: ${aliveBefore} → ${aliveAfter} cells alive`);
        }

        this.tickCount++;
        this.updateVisuals();
    }

    countLivingNeighbors(tileIndex) {
        const tile = this.grid.getTile(tileIndex);
        if (!tile || !tile.neighborIds) {
            console.warn(`Tile ${tileIndex} has no neighborIds!`);
            return 0;
        }

        // Debug first few calls
        if (this.tickCount === 0 && tileIndex < 3) {
            console.log(`Tile ${tileIndex} has ${tile.neighborIds.length} neighbors:`, tile.neighborIds);
        }

        let count = 0;
        tile.neighborIds.forEach(neighborStringId => {
            // Convert string ID to array index using our mapping
            const neighborIndex = this.tileIdToIndex.get(neighborStringId);
            if (neighborIndex !== undefined && this.cells[neighborIndex] && this.cells[neighborIndex].alive) {
                count++;
            }
        });

        return count;
    }

    updateVisuals() {
        this.cells.forEach((cell, index) => {
            if (cell.alive) {
                if (!this.cellMeshes.has(index)) {
                    this.createCellMesh(index);
                }
                this.updateCellMesh(index, cell);
            } else {
                this.removeCellMesh(index);
            }
        });
    }

    createCellMesh(tileId) {
        const tile = this.grid.getTile(tileId);
        const boundary = tile.boundary;

        if (!boundary || boundary.length < 3) {
            console.warn(`Tile ${tileId} has invalid boundary`);
            return;
        }

        // Create geometry using exact tile boundary points
        const vertices = [];
        const indices = [];

        // Add center point (for triangle fan)
        const center = tile.centerPoint;
        vertices.push(center.x, center.y, center.z);

        // Add boundary vertices
        for (let i = 0; i < boundary.length; i++) {
            vertices.push(boundary[i].x, boundary[i].y, boundary[i].z);
        }

        // Create triangle fan from center to boundary points
        for (let i = 0; i < boundary.length; i++) {
            indices.push(0); // center
            indices.push(i + 1); // current boundary point
            indices.push(((i + 1) % boundary.length) + 1); // next boundary point
        }

        // Create BufferGeometry
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        // Create material
        const material = new THREE.MeshPhongMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: this.cellOpacity,
            emissive: 0x00ff88,
            emissiveIntensity: 0.3,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
        this.cellMeshes.set(tileId, mesh);
    }

    updateCellMesh(tileId, cell) {
        const mesh = this.cellMeshes.get(tileId);
        if (!mesh) return;

        // Update color based on age
        const color = this.getCellColor(cell.age);
        mesh.material.color = new THREE.Color(color);
        mesh.material.emissive = new THREE.Color(color);
    }

    removeCellMesh(tileId) {
        const mesh = this.cellMeshes.get(tileId);
        if (mesh) {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
            this.cellMeshes.delete(tileId);
        }
    }

    getCellColor(age) {
        // Age-based coloring
        if (age < 10) return 0x00ff88; // Green (young)
        if (age < 50) return 0xffaa00; // Orange (mature)
        return 0x8888ff; // Purple (old)
    }

    clearCells() {
        this.cellMeshes.forEach((mesh, tileId) => {
            this.removeCellMesh(tileId);
        });
        this.cellMeshes.clear();
        this.cells = [];
    }

    setTickSpeed(speed) {
        this.tickSpeed = speed;
    }

    setPaused(paused) {
        this.paused = paused;
    }

    setCellOpacity(opacity) {
        this.cellOpacity = opacity;
        this.cellMeshes.forEach(mesh => {
            mesh.material.opacity = opacity;
        });
    }

    getCells() {
        return this.cells;
    }

    getTickCount() {
        return this.tickCount;
    }

    // Survival rule setters
    setSurvivalMinNeighbors(min) {
        this.survivalRules.minNeighbors = min;
    }

    setSurvivalMaxNeighbors(max) {
        this.survivalRules.maxNeighbors = max;
    }

    setSurvivalProbabilityEnabled(enabled) {
        this.survivalRules.probabilityEnabled = enabled;
    }

    setSurvivalProbability(probability) {
        this.survivalRules.probability = probability;
    }

    // Birth rule setters
    setBirthMinNeighbors(min) {
        this.birthRules.minNeighbors = min;
    }

    setBirthMaxNeighbors(max) {
        this.birthRules.maxNeighbors = max;
    }

    setBirthProbabilityEnabled(enabled) {
        this.birthRules.probabilityEnabled = enabled;
    }

    setBirthProbability(probability) {
        this.birthRules.probability = probability;
    }

    // Death rule setters
    setAgeDeathEnabled(enabled) {
        this.deathRules.ageDeathEnabled = enabled;
    }

    setAgeDeathRate(rate) {
        this.deathRules.ageDeathRate = rate;
    }

    setAgeDeathThreshold(threshold) {
        this.deathRules.ageDeathThreshold = threshold;
    }

    setSuddenDeathEnabled(enabled) {
        this.deathRules.suddenDeathEnabled = enabled;
    }

    setSuddenDeathProbability(probability) {
        this.deathRules.suddenDeathProbability = probability;
    }

    // Rule getters
    getSurvivalRules() {
        return this.survivalRules;
    }

    getBirthRules() {
        return this.birthRules;
    }

    getDeathRules() {
        return this.deathRules;
    }
}
