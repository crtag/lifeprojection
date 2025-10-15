/**
 * Game of Life Engine
 * Implements hex-adapted Conway's Game of Life rules
 */

class GameOfLifeEngine {
    constructor(gridManager, sceneManager) {
        this.grid = gridManager;
        this.scene = sceneManager.getScene();

        // Cell states
        this.cells = [];

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

        this.initialize('random');
    }

    initialize(seedPattern = 'random', density = 0.2) {
        console.log(`Initializing with pattern: ${seedPattern}`);

        // Clear existing cells
        this.clearCells();

        // Initialize cell states
        const tiles = this.grid.getTiles();
        this.cells = tiles.map((tile, index) => ({
            tileId: index,
            alive: false,
            age: 0,
            previousState: false,
            stabilityCounter: 0
        }));

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

        // Calculate next state for each cell
        this.cells.forEach((cell, index) => {
            const neighborCount = this.countLivingNeighbors(index);
            let nextAlive = cell.alive;

            // Hex-adapted GOL rules (conservative)
            if (cell.alive) {
                // Survival: 2-3 neighbors
                nextAlive = neighborCount === 2 || neighborCount === 3;
            } else {
                // Birth: exactly 2 neighbors
                nextAlive = neighborCount === 2;
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

        this.tickCount++;
        this.updateVisuals();
    }

    countLivingNeighbors(tileId) {
        const neighbors = this.grid.getNeighbors(tileId);
        const tiles = this.grid.getTiles();

        let count = 0;
        neighbors.forEach(neighbor => {
            const neighborId = tiles.indexOf(neighbor);
            if (neighborId >= 0 && this.cells[neighborId].alive) {
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
        const center = tile.centerPoint;

        // Create simple circle geometry
        const geometry = new THREE.CircleGeometry(this.cellSize, 6);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: this.cellOpacity,
            emissive: 0x00ff88,
            emissiveIntensity: 0.3,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);

        // Position and orient to sphere surface
        mesh.position.set(center.x, center.y, center.z);
        mesh.lookAt(0, 0, 0);

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
}
