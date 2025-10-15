# Life Projection - Technical Specification
## 3D Spherical Game of Life Visualization

**Version:** 1.0
**Date:** 2025-10-15
**Project Type:** Pure HTML/JavaScript - Local Deployment

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Core Components](#core-components)
5. [Game Logic](#game-logic)
6. [Visual Specifications](#visual-specifications)
7. [User Interface](#user-interface)
8. [File Structure](#file-structure)
9. [Implementation Phases](#implementation-phases)
10. [Technical Details](#technical-details)
11. [Performance Considerations](#performance-considerations)
12. [Future Enhancements](#future-enhancements)

---

## Project Overview

### Concept
A 3D visualization of Conway's Game of Life running on the surface of a sphere, with advanced features including:
- Hexagonal grid on spherical surface
- Organism tracking and pairing
- Particle flow connections between paired organisms
- New organism generation at particle intersections
- Full UI control over all parameters
- Light and dark theme support

### Key Features
- ✅ Game of Life on a sphere with hexagonal grid
- ✅ Adjustable tick speed
- ✅ Adjustable sphere radius
- ✅ Transparent grid and cell rendering
- ✅ Organism detection (stable, age-based, size-based)
- ✅ Automatic pairing of opposite organisms
- ✅ Particle flow visualization between pairs
- ✅ Visual distinction for each connection pair
- ✅ Intersection-based organism generation
- ✅ Adjustable particle flow speed / vibration mode
- ✅ Light/dark theme support
- ✅ All thresholds configurable via UI

---

## Technology Stack

### Core Libraries (CDN-based for local deployment)

#### 1. Three.js (r160+)
- **Purpose:** 3D rendering, WebGL management
- **CDN:** `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js`
- **Module:** `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js`
- **Addons Needed:**
  - OrbitControls: Camera manipulation
  - Stats (optional): Performance monitoring

#### 2. Hexasphere.js
- **Purpose:** Hexagonal geodesic sphere grid generation
- **Source:** Download from `https://github.com/arscan/hexasphere.js/`
- **File:** `hexasphere.min.js` (standalone, no dependencies)
- **Key Features:**
  - Generates geodesic polyhedron (12 pentagons + hexagons)
  - Provides tile data with neighbors
  - Configurable subdivision levels

#### 3. Three.quarks
- **Purpose:** GPU-accelerated particle system
- **CDN/Build:** May need to bundle from `https://github.com/Alchemist0823/three.quarks`
- **Alternative:** Use Three.js Points/PointsMaterial for simpler implementation
- **Fallback:** Custom particle system using THREE.Points

#### 4. dat.GUI (lil-gui alternative)
- **Purpose:** Real-time UI controls
- **CDN:** `https://cdn.jsdelivr.net/npm/dat.gui@0.7.9/build/dat.gui.min.js`
- **Alternative:** `https://cdn.jsdelivr.net/npm/lil-gui@0.19.1/dist/lil-gui.umd.min.js`

### Development Stack
- **Languages:** HTML5, JavaScript (ES6+), CSS3
- **Tools:** Any modern browser with WebGL support
- **Deployment:** Local file system (file:// protocol) or simple HTTP server

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      index.html                         │
│  (Bootstrap, Canvas, UI Container)                      │
└────────────────┬────────────────────────────────────────┘
                 │
    ┌────────────┴────────────┬──────────────┬────────────┐
    │                         │              │            │
┌───▼────┐  ┌────────────┐  ┌▼──────┐  ┌───▼────┐  ┌───▼─────┐
│ scene  │  │   grid     │  │ game  │  │organisms│  │particles│
│ .js    │  │   .js      │  │oflife │  │  .js   │  │  .js    │
│        │  │            │  │ .js   │  │        │  │         │
│Three.js│  │Hexasphere  │  │GOL    │  │Pairing │  │Flows    │
│Setup   │  │Management  │  │Engine │  │System  │  │System   │
└───┬────┘  └────┬───────┘  └──┬────┘  └───┬────┘  └───┬─────┘
    │            │             │            │           │
    │            └─────────────┴────────────┴───────────┘
    │                         │
┌───▼─────┐              ┌───▼────┐
│ themes  │              │   ui   │
│  .js    │              │  .js   │
│         │              │        │
│Light/   │              │dat.GUI │
│Dark     │              │Controls│
└─────────┘              └────────┘
```

### Data Flow

```
User Input (UI) → Parameters → Game Engine → State Update
                                    ↓
                            Organism Tracker
                                    ↓
                            Pairing System
                                    ↓
                            Particle Emitters
                                    ↓
                            Three.js Renderer → Canvas
```

---

## Core Components

### 1. Scene Manager (`scene.js`)

**Responsibilities:**
- Initialize Three.js scene, camera, renderer
- Set up lighting (ambient + directional)
- Configure OrbitControls
- Handle window resize
- Manage animation loop
- Theme switching logic

**Key Objects:**
```javascript
{
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  controls: OrbitControls,
  lights: {
    ambient: THREE.AmbientLight,
    directional: THREE.DirectionalLight
  },
  currentTheme: 'dark' | 'light'
}
```

**Methods:**
- `init()` - Setup scene
- `animate()` - Render loop
- `resize()` - Handle window resize
- `switchTheme(theme)` - Change theme

---

### 2. Grid Manager (`grid.js`)

**Responsibilities:**
- Generate hexagonal sphere using Hexasphere.js
- Render grid lines with transparency
- Provide tile lookup and neighbor access
- Handle radius changes
- Manage grid visibility

**Key Objects:**
```javascript
{
  hexasphere: Hexasphere,
  gridMesh: THREE.LineSegments,
  radius: number,
  subdivisions: number,
  tiles: Array<Tile>
}
```

**Tile Structure:**
```javascript
{
  id: number,
  centerPoint: Vector3,
  neighbors: Array<number>, // neighbor tile IDs
  boundary: Array<Vector3>,
  cell: CellState // GOL state
}
```

**Methods:**
- `generateGrid(radius, subdivisions)` - Create hexasphere
- `getTile(id)` - Get tile by ID
- `getNeighbors(id)` - Get neighbor tiles
- `updateRadius(radius)` - Regenerate with new radius
- `setGridOpacity(opacity)` - Update transparency

---

### 3. Game of Life Engine (`gameoflife.js`)

**Responsibilities:**
- Manage cell states (alive/dead, age)
- Implement hex-adapted GOL rules
- Execute tick updates
- Render living cells
- Track cell history for stability detection

**Cell State:**
```javascript
{
  alive: boolean,
  age: number, // ticks alive
  previousState: boolean,
  stabilityCounter: number, // ticks unchanged
  mesh: THREE.Mesh | null
}
```

**GOL Rules (Hex-adapted):**
- Birth: Dead cell with 2 living neighbors → becomes alive
- Survival: Living cell with 2-3 living neighbors → stays alive
- Death: Otherwise → becomes dead

**Methods:**
- `initialize(seedPattern)` - Set initial state
- `tick()` - Execute one game step
- `countNeighbors(tileId)` - Count living neighbors
- `updateCellVisuals()` - Render cells
- `setTickSpeed(speed)` - Adjust tick interval
- `pause() / resume()` - Control simulation

---

### 4. Organism Tracker (`organisms.js`)

**Responsibilities:**
- Detect connected components (organisms)
- Track organism properties (size, age, position)
- Identify stable/mature organisms
- Find opposite organism pairs
- Manage pairing logic

**Organism Structure:**
```javascript
{
  id: number,
  cells: Array<number>, // tile IDs
  size: number,
  age: number, // min age of cells
  centerPosition: Vector3,
  isStable: boolean,
  pairedWith: number | null, // other organism ID
  color: Color // unique color for visual distinction
}
```

**Methods:**
- `detectOrganisms()` - Find connected components
- `updateOrganisms()` - Update organism states
- `findPairs(angularTolerance)` - Match opposite organisms
- `isOpposite(pos1, pos2, tolerance)` - Check if positions are opposite
- `getQualifiedOrganisms(minAge, minSize)` - Filter by thresholds

---

### 5. Particle Flow Manager (`particles.js`)

**Responsibilities:**
- Create particle emitters for each pair
- Animate particles along curved paths
- Manage particle lifecycle
- Handle intersection effects
- Generate new organisms at intersections
- Control flow speed / vibration mode

**Connection Structure:**
```javascript
{
  id: number,
  organismA: number, // organism ID
  organismB: number,
  particleSystem: THREE.Points,
  path: THREE.Curve,
  color: Color,
  flowSpeed: number,
  isVibrating: boolean,
  particles: Array<ParticleData>
}
```

**Particle Data:**
```javascript
{
  position: Vector3,
  velocity: Vector3,
  progress: number, // 0-1 along path
  age: number
}
```

**Methods:**
- `createConnection(orgA, orgB)` - New particle flow
- `updateParticles(deltaTime)` - Animate particles
- `removeConnection(id)` - Cleanup
- `setFlowSpeed(speed)` - Adjust animation speed
- `setVibrationMode(enabled)` - Toggle vibration
- `detectIntersections()` - Find particle collision zones
- `spawnOrganism(position)` - Create new life at intersection

---

### 6. UI Controller (`ui.js`)

**Responsibilities:**
- Initialize dat.GUI controls
- Bind parameters to game logic
- Handle user input
- Display statistics

**Parameter Structure:**
```javascript
{
  simulation: {
    tickSpeed: number (0.1 - 5.0s),
    paused: boolean
  },
  sphere: {
    radius: number (50 - 500),
    gridOpacity: number (0.1 - 1.0),
    subdivisions: number (2 - 6)
  },
  organisms: {
    minAge: number (10 - 200 ticks),
    minSize: number (5 - 100 cells),
    angularTolerance: number (5 - 45 degrees)
  },
  particles: {
    flowSpeed: number (0 - 5.0),
    vibrationMode: boolean
  },
  visual: {
    theme: 'light' | 'dark',
    cellOpacity: number (0.3 - 1.0)
  },
  seed: {
    pattern: 'random' | 'glider' | 'cluster' | 'ring',
    density: number (0.1 - 0.5)
  }
}
```

**Methods:**
- `initGUI()` - Setup dat.GUI
- `updateParameter(param, value)` - Handle changes
- `regenerateSeed()` - Reset simulation
- `exportConfig()` - Save current settings (future)
- `importConfig()` - Load settings (future)

---

### 7. Theme Manager (`themes.js`)

**Responsibilities:**
- Define light and dark themes
- Apply theme to scene elements
- Smooth transitions between themes

**Theme Structure:**
```javascript
{
  background: Color,
  gridColor: Color,
  cellColors: {
    young: Color,
    mature: Color,
    old: Color
  },
  particleColors: Array<Color>, // palette for connections
  lights: {
    ambientIntensity: number,
    directionalIntensity: number,
    directionalColor: Color
  }
}
```

**Themes:**
- **Dark Theme:** Space-like, glowing cells, luminous particles
- **Light Theme:** Clean, bright cells, vibrant particles

**Methods:**
- `getTheme(name)` - Retrieve theme config
- `applyTheme(theme)` - Update scene materials/colors
- `transitionTheme(from, to, duration)` - Smooth change (optional)

---

## Game Logic

### Game of Life Rules (Hexagonal Adaptation)

#### Standard Rules (Square Grid)
- Birth: 3 neighbors
- Survival: 2-3 neighbors
- Death: <2 or >3 neighbors

#### Hexagonal Rules (6 neighbors per hex, 5 for pentagons)
**Option A - Conservative:**
- Birth: Exactly 2 living neighbors
- Survival: 2-3 living neighbors
- Death: Otherwise

**Option B - Balanced:**
- Birth: 2-3 living neighbors
- Survival: 2-4 living neighbors
- Death: Otherwise

**Recommendation:** Start with Option A, make rules configurable via UI

### Organism Detection Algorithm

**Connected Component Detection (Flood Fill):**
```
For each alive cell:
  If not visited:
    Create new organism
    Flood fill to find all connected cells
    Calculate organism properties:
      - size = cell count
      - age = minimum cell age
      - center = average position
      - stability = min(cell.stabilityCounter)
```

### Pairing Algorithm

**Opposite Detection:**
```
For each organism A:
  For each organism B (where B > A):
    angle = acos(dot(A.center.normalize(), B.center.normalize()))
    angleDegrees = angle * 180 / PI

    if abs(angleDegrees - 180) <= angularTolerance:
      if A.age >= minAge AND A.size >= minSize:
        if B.age >= minAge AND B.size >= minSize:
          Create pair(A, B)
```

### Particle Flow Path

**Path Generation:**
```
pathPoints = [
  organismA.centerPosition,
  sphereCenter (0, 0, 0),
  organismB.centerPosition
]

curve = new THREE.CatmullRomCurve3(pathPoints)
// OR
curve = new THREE.QuadraticBezierCurve3(
  organismA.centerPosition,
  sphereCenter,
  organismB.centerPosition
)
```

**Particle Animation:**
```
For each particle in connection:
  particle.progress += flowSpeed * deltaTime

  if particle.progress >= 1.0:
    particle.progress = 0 // loop

  particle.position = curve.getPoint(particle.progress)
```

### Intersection Detection

**Sphere Center Proximity:**
```
For each connection:
  particlesNearCenter = particles.filter(p =>
    p.position.length() < intersectionRadius
  )

  if particlesNearCenter.length > threshold:
    Trigger intersection event
    Spawn new organism near center
```

---

## Visual Specifications

### Grid Rendering

**Geometry:**
- Line segments connecting hex boundaries
- THREE.BufferGeometry with positions from Hexasphere

**Material:**
```javascript
new THREE.LineBasicMaterial({
  color: theme.gridColor,
  transparent: true,
  opacity: gridOpacity,
  linewidth: 1 // Note: linewidth > 1 not supported in WebGL
})
```

### Living Cell Rendering

**Geometry:**
- Hexagonal prisms (extruded hexagons)
- Small height (0.1 * radius) to show "on surface"
- OR: Simple circles (THREE.CircleGeometry) oriented to sphere normal

**Material:**
```javascript
new THREE.MeshPhongMaterial({
  color: getCellColor(cell.age),
  transparent: true,
  opacity: cellOpacity,
  emissive: getCellColor(cell.age),
  emissiveIntensity: 0.3,
  side: THREE.DoubleSide
})
```

**Color Scheme (Age-based):**
- Age 0-10: Green (young)
- Age 11-50: Yellow-Orange (mature)
- Age 51+: Blue-Purple (old)

### Particle Rendering

**Geometry:**
- THREE.BufferGeometry with position attribute
- Multiple particles per connection (50-200)

**Material:**
```javascript
new THREE.PointsMaterial({
  size: particleSize,
  color: connection.color,
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending, // glow effect
  sizeAttenuation: true
})
```

**Connection Colors:**
- Unique HSL color per pair
- Hue: `(pairIndex * 137.5) % 360` (golden angle distribution)
- Saturation: 80%
- Lightness: 60%

### Theme Definitions

**Dark Theme:**
```javascript
{
  background: 0x000510,
  gridColor: 0x444444,
  cellColors: {
    young: 0x00ff88,
    mature: 0xffaa00,
    old: 0x8888ff
  },
  particleColors: [/* HSL palette */],
  lights: {
    ambientIntensity: 0.4,
    directionalIntensity: 0.8,
    directionalColor: 0xffffff
  }
}
```

**Light Theme:**
```javascript
{
  background: 0xf0f0f0,
  gridColor: 0x333333,
  cellColors: {
    young: 0x00cc66,
    mature: 0xff8800,
    old: 0x6666dd
  },
  particleColors: [/* HSL palette */],
  lights: {
    ambientIntensity: 0.6,
    directionalIntensity: 0.5,
    directionalColor: 0xffffee
  }
}
```

---

## User Interface

### dat.GUI Layout

```javascript
const gui = new dat.GUI();

// Simulation Folder
const simFolder = gui.addFolder('Simulation');
simFolder.add(params.simulation, 'tickSpeed', 0.1, 5.0).step(0.1);
simFolder.add(params.simulation, 'paused');
simFolder.open();

// Sphere Folder
const sphereFolder = gui.addFolder('Sphere');
sphereFolder.add(params.sphere, 'radius', 50, 500).step(10)
  .onChange(value => grid.updateRadius(value));
sphereFolder.add(params.sphere, 'gridOpacity', 0.1, 1.0).step(0.1);
sphereFolder.add(params.sphere, 'subdivisions', 2, 6).step(1)
  .onChange(value => grid.regenerate(value));
sphereFolder.open();

// Organisms Folder
const orgFolder = gui.addFolder('Organism Pairing');
orgFolder.add(params.organisms, 'minAge', 10, 200).step(5);
orgFolder.add(params.organisms, 'minSize', 5, 100).step(5);
orgFolder.add(params.organisms, 'angularTolerance', 5, 45).step(5);
orgFolder.open();

// Particles Folder
const particlesFolder = gui.addFolder('Particles');
particlesFolder.add(params.particles, 'flowSpeed', 0, 5.0).step(0.1);
particlesFolder.add(params.particles, 'vibrationMode');
particlesFolder.open();

// Visual Folder
const visualFolder = gui.addFolder('Visual');
visualFolder.add(params.visual, 'theme', ['light', 'dark'])
  .onChange(value => scene.switchTheme(value));
visualFolder.add(params.visual, 'cellOpacity', 0.3, 1.0).step(0.1);
visualFolder.open();

// Seed Folder
const seedFolder = gui.addFolder('Initial Seed');
seedFolder.add(params.seed, 'pattern', ['random', 'glider', 'cluster', 'ring']);
seedFolder.add(params.seed, 'density', 0.1, 0.5).step(0.05);
seedFolder.add({ regenerate: () => gameoflife.initialize(params.seed) }, 'regenerate');
seedFolder.open();
```

### Controls Legend (Optional Overlay)

```
Camera Controls:
- Left Mouse: Rotate
- Right Mouse: Pan
- Scroll: Zoom
- R: Reset camera
```

---

## File Structure

```
lifeprojection/
│
├── index.html                  # Main HTML entry point
│
├── css/
│   └── style.css              # Minimal styling (fullscreen canvas)
│
├── js/
│   ├── main.js                # Entry point, initialization, main loop
│   ├── scene.js               # Three.js scene setup and management
│   ├── grid.js                # Hexasphere grid generation and rendering
│   ├── gameoflife.js          # Game of Life engine (rules, state, tick)
│   ├── organisms.js           # Organism detection, tracking, pairing
│   ├── particles.js           # Particle flow system and animations
│   ├── ui.js                  # dat.GUI setup and parameter binding
│   └── themes.js              # Light/dark theme definitions
│
├── lib/                       # External libraries (CDN fallback)
│   ├── three.min.js           # Three.js (r160+)
│   ├── OrbitControls.js       # Three.js addon
│   ├── hexasphere.min.js      # Hexasphere.js
│   └── dat.gui.min.js         # dat.GUI
│
├── SPEC.md                    # This specification document
└── README.md                  # Project description and setup instructions
```

---

## Implementation Phases

### Phase 1: Foundation (Basic 3D Scene)
**Duration:** 1-2 days
**Goals:**
- Set up project structure
- Create `index.html` with all CDN links
- Implement `scene.js` with basic Three.js setup
- Add OrbitControls
- Verify rendering works locally

**Deliverables:**
- Rotating camera around empty scene
- Responsive canvas (window resize)
- Basic lighting

---

### Phase 2: Hexagonal Grid
**Duration:** 1-2 days
**Goals:**
- Integrate Hexasphere.js
- Implement `grid.js`
- Render transparent grid lines
- Test different subdivision levels

**Deliverables:**
- Visible hexagonal sphere grid
- Adjustable transparency
- Tile neighbor access working

---

### Phase 3: Game of Life Core
**Duration:** 2-3 days
**Goals:**
- Implement `gameoflife.js`
- Hex-adapted GOL rules
- Cell state management
- Tick system with adjustable speed
- Cell rendering (transparent hexagons/circles)

**Deliverables:**
- Working GOL simulation on sphere
- Visible living cells
- Pause/resume functionality
- Speed control

---

### Phase 4: Organism Detection
**Duration:** 2 days
**Goals:**
- Implement `organisms.js`
- Connected component detection
- Organism tracking (size, age)
- Stability detection
- Visual debugging (highlight organisms)

**Deliverables:**
- Organisms detected and tracked
- Filtering by size/age thresholds
- Console logging for debugging

---

### Phase 5: Pairing System
**Duration:** 1-2 days
**Goals:**
- Implement opposite-point detection
- Angular tolerance calculation
- Pairing logic
- Visual debug lines (optional)

**Deliverables:**
- Automatic pairing of qualified organisms
- Console/visual confirmation of pairs

---

### Phase 6: Particle Flows
**Duration:** 3-4 days
**Goals:**
- Implement `particles.js`
- Create particle emitters for each pair
- Curved path generation (through sphere center)
- Particle animation
- Unique colors per connection
- Intersection detection
- New organism spawning

**Deliverables:**
- Animated particles flowing between pairs
- Visually distinct connections
- Basic intersection effects
- New organisms appearing at intersections

---

### Phase 7: UI Integration
**Duration:** 2 days
**Goals:**
- Implement `ui.js` with dat.GUI
- Connect all parameters to logic
- Add seed pattern presets
- Regeneration functionality

**Deliverables:**
- Full UI control panel
- All parameters adjustable in real-time
- Seed pattern switching

---

### Phase 8: Theme System
**Duration:** 1 day
**Goals:**
- Implement `themes.js`
- Define light/dark themes
- Theme switching logic
- Update all materials/colors

**Deliverables:**
- Light/dark theme toggle
- Smooth visual transitions

---

### Phase 9: Polish & Optimization
**Duration:** 2-3 days
**Goals:**
- Performance optimization (instancing, pooling)
- Visual tweaks (colors, opacity, effects)
- Bug fixes
- Documentation
- README creation

**Deliverables:**
- Smooth 60fps performance
- Polished visuals
- Complete documentation

---

**Total Estimated Duration:** 15-20 days

---

## Technical Details

### Hexasphere Configuration

**Subdivision Levels:**
- Level 1: 20 tiles (minimal, testing only)
- Level 2: 80 tiles
- Level 3: 320 tiles (recommended minimum)
- Level 4: 1,280 tiles (good balance)
- Level 5: 5,120 tiles (detailed)
- Level 6: 20,480 tiles (very detailed, may impact performance)

**Initialization:**
```javascript
const hexasphere = new Hexasphere(radius, subdivisions, hexSize);
const tiles = hexasphere.tiles;

// Access tile properties
tiles.forEach(tile => {
  const center = tile.centerPoint; // {x, y, z}
  const neighbors = tile.neighborIds; // array of IDs
  const boundary = tile.boundary; // array of {x, y, z}
});
```

### Camera Setup

**Initial Position:**
```javascript
camera.position.set(
  radius * 2.5,
  radius * 1.5,
  radius * 2.5
);
camera.lookAt(0, 0, 0);
```

**OrbitControls:**
```javascript
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = radius * 1.2;
controls.maxDistance = radius * 5.0;
controls.autoRotate = false; // optional
controls.autoRotateSpeed = 0.5;
```

### Animation Loop

```javascript
let lastTickTime = 0;
const tickInterval = params.simulation.tickSpeed * 1000; // ms

function animate(currentTime) {
  requestAnimationFrame(animate);

  // Update controls
  controls.update();

  // Game tick
  if (!params.simulation.paused && currentTime - lastTickTime > tickInterval) {
    gameoflife.tick();
    organisms.update();
    lastTickTime = currentTime;
  }

  // Particle animation (runs every frame)
  const deltaTime = clock.getDelta();
  particles.update(deltaTime);

  // Render
  renderer.render(scene, camera);
}
```

### Seed Patterns

**Random:**
```javascript
tiles.forEach(tile => {
  tile.cell.alive = Math.random() < params.seed.density;
});
```

**Glider (adapted for sphere):**
```javascript
// Find a starting tile, set it and specific neighbors alive
// Requires manual configuration for hex geometry
```

**Cluster:**
```javascript
// Pick random tile, set it and all neighbors alive
// Repeat N times
```

**Ring:**
```javascript
// Find tiles at specific latitude
// Set them alive to create ring around sphere
```

### Performance Optimization

**Instanced Meshes for Cells:**
```javascript
const cellGeometry = new THREE.CircleGeometry(cellSize, 6);
const instancedMesh = new THREE.InstancedMesh(
  cellGeometry,
  cellMaterial,
  maxCells
);

// Update per cell
const matrix = new THREE.Matrix4();
matrix.setPosition(tile.centerPoint);
instancedMesh.setMatrixAt(index, matrix);
instancedMesh.instanceMatrix.needsUpdate = true;
```

**Object Pooling for Particles:**
```javascript
// Reuse particle objects instead of creating/destroying
const particlePool = [];

function getParticle() {
  return particlePool.pop() || createNewParticle();
}

function releaseParticle(particle) {
  particlePool.push(particle);
}
```

**Dirty Flagging:**
```javascript
// Only update cells that changed state
const dirtyCells = new Set();

function tick() {
  const nextState = calculateNextState();
  nextState.forEach((newState, tileId) => {
    if (newState !== currentState[tileId]) {
      dirtyCells.add(tileId);
      currentState[tileId] = newState;
    }
  });
  updateVisuals(dirtyCells);
  dirtyCells.clear();
}
```

---

## Performance Considerations

### Target Performance
- **Frame Rate:** 60 FPS
- **Tick Rate:** User-configurable (0.1s - 5.0s)
- **Max Cells:** ~5,000 (subdivision level 5)
- **Max Particles:** ~200 per connection, up to 10 connections = 2,000 particles

### Bottlenecks

1. **Cell Rendering:**
   - Use instanced meshes
   - Only update changed cells
   - LOD for distant cells (future)

2. **Particle System:**
   - Use THREE.Points (single draw call)
   - Object pooling
   - Cull off-screen particles

3. **Game Logic:**
   - Optimize neighbor lookup (cache)
   - Use typed arrays for state
   - Consider Web Workers for heavy computation

4. **Organism Detection:**
   - Run less frequently than tick (e.g., every 5 ticks)
   - Incremental updates instead of full scan

### Monitoring
```javascript
// Add Stats.js for FPS monitoring
import Stats from 'https://cdn.jsdelivr.net/npm/stats.js/build/stats.min.js';
const stats = new Stats();
document.body.appendChild(stats.dom);

function animate() {
  stats.begin();
  // ... render
  stats.end();
}
```

---

## Future Enhancements

### Phase 2 Features (Post-MVP)
- [ ] Custom seed pattern editor (click to toggle cells)
- [ ] Export/import organism configurations (JSON)
- [ ] Multiple spheres with different radii
- [ ] Organism "genetics" - color/behavior inheritance
- [ ] Sound effects (Web Audio API)
- [ ] Time-lapse recording (canvas capture)
- [ ] VR support (WebXR)
- [ ] Preset library of interesting patterns
- [ ] Statistics dashboard (population over time, etc.)
- [ ] Configurable GOL rules (custom birth/survival numbers)

### Advanced Visualizations
- [ ] Trail effects for particles (motion blur)
- [ ] Bloom post-processing for glow
- [ ] Shader-based cell rendering (custom materials)
- [ ] Animated textures for cells
- [ ] Dynamic particle count based on organism size
- [ ] Particle collision physics

### Optimization
- [ ] Web Workers for game logic
- [ ] GPU compute shaders (WebGL2 compute)
- [ ] LOD system for cells
- [ ] Frustum culling for particles
- [ ] Spatial partitioning for organism detection

---

## Development Guidelines

### Code Style
- ES6+ features encouraged
- Clear variable/function names
- Comment complex algorithms
- Modular design (one concern per file)

### Testing
- Manual testing in Chrome, Firefox, Edge
- Test at different subdivision levels
- Verify performance with many organisms/particles
- Test all UI controls

### Browser Compatibility
- **Minimum:** Modern browsers with WebGL support
- **Recommended:** Chrome 90+, Firefox 88+, Edge 90+
- **Safari:** WebGL support required (Safari 14+)

### Local Development
```bash
# Option 1: Simple HTTP Server (Python)
python -m http.server 8000

# Option 2: Node.js http-server
npx http-server -p 8000

# Option 3: VS Code Live Server extension
# Just right-click index.html > "Open with Live Server"

# Then open: http://localhost:8000
```

---

## Appendix

### Useful Resources

**Three.js:**
- Documentation: https://threejs.org/docs/
- Examples: https://threejs.org/examples/
- Forum: https://discourse.threejs.org/

**Hexasphere.js:**
- GitHub: https://github.com/arscan/hexasphere.js/
- Demo: https://www.robscanlon.com/hexasphere/

**Game of Life:**
- Wikipedia: https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life
- LifeWiki: https://conwaylife.com/wiki/

**WebGL/Graphics:**
- WebGL Fundamentals: https://webglfundamentals.org/
- The Book of Shaders: https://thebookofshaders.com/

### Math Reference

**Angle Between Vectors:**
```javascript
function angleBetween(v1, v2) {
  const dot = v1.dot(v2);
  const mag = v1.length() * v2.length();
  const angle = Math.acos(dot / mag); // radians
  return angle * 180 / Math.PI; // degrees
}
```

**Check if Opposite:**
```javascript
function isOpposite(v1, v2, tolerance = 15) {
  const angle = angleBetween(v1, v2);
  return Math.abs(angle - 180) <= tolerance;
}
```

**HSL to RGB (for particle colors):**
```javascript
function hslToRgb(h, s, l) {
  // h: 0-360, s: 0-1, l: 0-1
  // Returns {r, g, b} in 0-1 range
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  // ... standard HSL to RGB conversion
}
```

---

## Version History

- **v1.0** (2025-10-15): Initial specification

---

## License

This project specification is provided as-is for the Life Projection visualization project.

---

**End of Specification**
