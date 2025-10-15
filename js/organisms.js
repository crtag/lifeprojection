/**
 * Organism Tracker
 * Detects, tracks, and pairs living organisms
 */

class OrganismTracker {
    constructor(gridManager, gameEngine, sceneManager) {
        this.grid = gridManager;
        this.game = gameEngine;
        this.scene = sceneManager.getScene();

        // Settings
        this.minAge = 50;
        this.minSize = 10;
        this.angularTolerance = 15; // degrees
        this.updateFrequency = 5; // Update every N ticks

        // State
        this.organisms = [];
        this.pairs = [];
        this.lastUpdateTick = 0;
    }

    update(deltaTime) {
        // Only update every N ticks to save performance
        const currentTick = this.game.getTickCount();
        if (currentTick - this.lastUpdateTick >= this.updateFrequency) {
            this.detectOrganisms();
            this.findPairs();
            this.lastUpdateTick = currentTick;
        }
    }

    detectOrganisms() {
        const cells = this.game.getCells();
        const visited = new Set();
        this.organisms = [];

        cells.forEach((cell, index) => {
            if (cell.alive && !visited.has(index)) {
                const organism = this.floodFill(index, visited);
                if (organism.cells.length > 0) {
                    this.organisms.push(organism);
                }
            }
        });

        console.log(`Detected ${this.organisms.length} organisms`);
    }

    floodFill(startId, visited) {
        const cells = this.game.getCells();
        const stack = [startId];
        const organismCells = [];
        let minAge = Infinity;

        while (stack.length > 0) {
            const tileId = stack.pop();

            if (visited.has(tileId)) continue;
            visited.add(tileId);

            const cell = cells[tileId];
            if (!cell.alive) continue;

            organismCells.push(tileId);
            minAge = Math.min(minAge, cell.age);

            // Add neighbors to stack
            const neighbors = this.grid.getNeighbors(tileId);
            const tiles = this.grid.getTiles();
            neighbors.forEach(neighbor => {
                const neighborId = tiles.indexOf(neighbor);
                if (neighborId >= 0 && !visited.has(neighborId)) {
                    stack.push(neighborId);
                }
            });
        }

        // Calculate center position
        const center = this.calculateCenter(organismCells);

        // Generate unique color
        const color = this.generateColor(this.organisms.length);

        return {
            id: this.organisms.length,
            cells: organismCells,
            size: organismCells.length,
            age: minAge,
            centerPosition: center,
            isStable: minAge >= this.minAge,
            pairedWith: null,
            color: color
        };
    }

    calculateCenter(cellIds) {
        const tiles = this.grid.getTiles();
        const sum = new THREE.Vector3();

        cellIds.forEach(id => {
            const tile = tiles[id];
            const point = tile.centerPoint;
            sum.add(new THREE.Vector3(point.x, point.y, point.z));
        });

        sum.divideScalar(cellIds.length);
        return sum;
    }

    findPairs() {
        // Clear existing pairs
        this.pairs = [];

        // Get qualified organisms
        const qualified = this.organisms.filter(org =>
            org.age >= this.minAge && org.size >= this.minSize
        );

        console.log(`${qualified.length} qualified organisms for pairing`);

        // Find opposite pairs
        for (let i = 0; i < qualified.length; i++) {
            for (let j = i + 1; j < qualified.length; j++) {
                const orgA = qualified[i];
                const orgB = qualified[j];

                if (this.isOpposite(orgA.centerPosition, orgB.centerPosition)) {
                    this.pairs.push({
                        id: this.pairs.length,
                        organismA: orgA,
                        organismB: orgB,
                        color: this.generateConnectionColor(this.pairs.length)
                    });

                    orgA.pairedWith = orgB.id;
                    orgB.pairedWith = orgA.id;

                    console.log(`Paired organism ${orgA.id} with ${orgB.id}`);
                }
            }
        }
    }

    isOpposite(pos1, pos2) {
        // Normalize vectors
        const v1 = pos1.clone().normalize();
        const v2 = pos2.clone().normalize();

        // Calculate angle
        const dot = v1.dot(v2);
        const angle = Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);

        // Check if opposite (180 degrees ± tolerance)
        const isOpp = Math.abs(angle - 180) <= this.angularTolerance;

        return isOpp;
    }

    generateColor(index) {
        // HSL-based color generation
        const hue = (index * 137.5) % 360; // Golden angle distribution
        return new THREE.Color().setHSL(hue / 360, 0.8, 0.6);
    }

    generateConnectionColor(index) {
        // Different hue offset for connections
        const hue = (index * 137.5 + 60) % 360;
        return new THREE.Color().setHSL(hue / 360, 0.9, 0.5);
    }

    getOrganisms() {
        return this.organisms;
    }

    getPairs() {
        return this.pairs;
    }

    setMinAge(age) {
        this.minAge = age;
    }

    setMinSize(size) {
        this.minSize = size;
    }

    setAngularTolerance(tolerance) {
        this.angularTolerance = tolerance;
    }
}
