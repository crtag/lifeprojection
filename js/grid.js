/**
 * Grid Manager
 * Manages hexagonal sphere grid using Hexasphere.js
 */

import * as THREE from 'three';

export class GridManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.scene = sceneManager.getScene();

        // Default parameters
        this.radius = 100;
        this.subdivisions = 8;
        this.hexSize = 1.0;
        this.gridOpacity = 0.3;

        // Initialize
        this.hexasphere = null;
        this.tiles = [];
        this.gridMesh = null;

        this.generateGrid();
    }

    generateGrid() {
        // Remove existing grid
        if (this.gridMesh) {
            this.scene.remove(this.gridMesh);
            this.gridMesh.geometry.dispose();
            this.gridMesh.material.dispose();
        }

        // Create hexasphere
        this.hexasphere = new Hexasphere(this.radius, this.subdivisions, this.hexSize);
        this.tiles = this.hexasphere.tiles;

        console.log(`Grid generated: ${this.tiles.length} tiles`);

        // Create grid line geometry
        this.createGridLines();
    }

    createGridLines() {
        const geometry = new THREE.BufferGeometry();
        const positions = [];

        // Create line segments for each tile boundary
        this.tiles.forEach(tile => {
            const boundary = tile.boundary;
            for (let i = 0; i < boundary.length; i++) {
                const p1 = boundary[i];
                const p2 = boundary[(i + 1) % boundary.length];

                positions.push(p1.x, p1.y, p1.z);
                positions.push(p2.x, p2.y, p2.z);
            }
        });

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        // Create material
        const material = new THREE.LineBasicMaterial({
            color: 0x444444,
            transparent: true,
            opacity: this.gridOpacity
        });

        // Create mesh
        this.gridMesh = new THREE.LineSegments(geometry, material);
        this.scene.add(this.gridMesh);
    }

    updateRadius(radius) {
        this.radius = radius;
        this.generateGrid();
    }

    updateSubdivisions(subdivisions) {
        this.subdivisions = subdivisions;
        this.generateGrid();
    }

    setGridOpacity(opacity) {
        this.gridOpacity = opacity;
        if (this.gridMesh) {
            this.gridMesh.material.opacity = opacity;
        }
    }

    setGridColor(color) {
        if (this.gridMesh) {
            this.gridMesh.material.color = new THREE.Color(color);
        }
    }

    getTile(id) {
        return this.tiles[id];
    }

    getNeighbors(tileId) {
        const tile = this.tiles[tileId];
        if (!tile) return [];
        return tile.neighborIds.map(id => this.tiles[id]);
    }

    getTiles() {
        return this.tiles;
    }

    getRadius() {
        return this.radius;
    }
}
