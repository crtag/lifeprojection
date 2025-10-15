# Life Projection

**3D Spherical Game of Life Visualization**

A stunning visualization of Conway's Game of Life running on the surface of a sphere with hexagonal grid, particle flow connections, and dynamic organism pairing.

---

## Features

- ✅ Game of Life on a hexagonal sphere grid
- ✅ Adjustable sphere radius and grid density
- ✅ Organism detection and tracking
- ✅ Automatic pairing of opposite organisms
- ✅ Particle flow visualization between pairs
- ✅ Light and dark themes
- ✅ Full UI control over all parameters
- ✅ Multiple seed patterns

---

## Quick Start

### Prerequisites

- Modern web browser with WebGL support (Chrome, Firefox, Edge, Safari 14+)
- Local web server (optional but recommended)

### Installation

1. **Download Hexasphere.js**

   The project requires Hexasphere.js to be downloaded manually:

   - Visit: https://github.com/arscan/hexasphere.js/
   - Download `hexasphere.min.js` from the repository
   - Place it in the `lib/` folder: `lib/hexasphere.min.js`

2. **Open in Browser**

   **Option A - Direct File Access:**
   ```
   Simply open index.html in your browser
   ```

   **Option B - Local Server (Recommended):**
   ```bash
   # Using Python 3
   python -m http.server 8000

   # Using Python 2
   python -m SimpleHTTPServer 8000

   # Using Node.js
   npx http-server -p 8000

   # Using PHP
   php -S localhost:8000
   ```

   Then open: `http://localhost:8000`

3. **Start Exploring!**

   The visualization will start automatically with a random seed pattern.

---

## Usage

### Camera Controls

- **Left Mouse Drag**: Rotate camera around sphere
- **Right Mouse Drag**: Pan camera
- **Mouse Wheel**: Zoom in/out

### UI Controls (dat.GUI Panel)

**Simulation**
- **Tick Speed**: How fast the Game of Life evolves (0.1 - 5.0 seconds)
- **Paused**: Pause/resume the simulation

**Sphere**
- **Radius**: Size of the sphere (50 - 500)
- **Grid Opacity**: Transparency of the hex grid lines (0.1 - 1.0)
- **Subdivisions**: Grid density (2-6, higher = more hexagons)

**Organism Pairing**
- **Min Age**: Minimum age (in ticks) for organisms to be paired
- **Min Size**: Minimum cell count for organisms to be paired
- **Angular Tolerance**: How precisely opposite organisms must be (degrees)

**Particles**
- **Flow Speed**: How fast particles move along connections
- **Vibration Mode**: Toggle between flowing and vibrating particles
- **Particle Size**: Size of individual particles

**Visual**
- **Theme**: Switch between light and dark themes
- **Cell Opacity**: Transparency of living cells

**Initial Seed**
- **Pattern**: Choose seed pattern (random, cluster, ring)
- **Density**: For random pattern, how many cells start alive
- **Regenerate**: Restart simulation with new seed

---

## Project Structure

```
lifeprojection/
│
├── index.html              # Main HTML entry point
├── README.md               # This file
├── SPEC.md                 # Full technical specification
│
├── css/
│   └── style.css          # Minimal styles
│
├── js/
│   ├── main.js            # Entry point and animation loop
│   ├── scene.js           # Three.js scene management
│   ├── grid.js            # Hexagonal sphere grid
│   ├── gameoflife.js      # Game of Life engine
│   ├── organisms.js       # Organism detection and pairing
│   ├── particles.js       # Particle flow system
│   ├── ui.js              # dat.GUI controls
│   └── themes.js          # Light/dark themes
│
└── lib/
    └── hexasphere.min.js  # Download separately (see installation)
```

---

## How It Works

### Game of Life on a Sphere

The classic Conway's Game of Life has been adapted to work on a hexagonal grid wrapped around a sphere:

- **Grid**: Uses geodesic polyhedron (12 pentagons + many hexagons)
- **Rules**: Adapted for hexagonal neighbors (birth: 2 neighbors, survival: 2-3 neighbors)
- **Cells**: Color-coded by age (green = young, orange = mature, purple = old)

### Organism Detection

Connected groups of living cells are detected and tracked:

- **Size**: Number of cells in the organism
- **Age**: Minimum age of cells in the organism
- **Stability**: Organisms that have lived for many ticks

### Pairing System

Qualified organisms on opposite sides of the sphere are automatically paired:

- **Opposite Detection**: Uses vector math to find organisms ~180° apart
- **Thresholds**: Only mature, large organisms are paired
- **Visual Connections**: Each pair gets a unique color

### Particle Flow

Particles flow from one organism through the sphere center to its paired organism:

- **Path**: Curved Bezier path through the sphere center
- **Animation**: Smooth particle motion along the path
- **Modes**: Flow (moving) or Vibration (oscillating)
- **Intersection**: Particles meet at the sphere center (future: spawn new organisms)

---

## Technology Stack

- **Three.js** - WebGL 3D rendering
- **Hexasphere.js** - Hexagonal geodesic sphere generation
- **dat.GUI** - Real-time UI controls
- **Pure JavaScript** - No build process required

---

## Performance

- **Target**: 60 FPS on modern hardware
- **Recommended Settings**:
  - Subdivisions: 3-4 (320-1280 tiles)
  - Radius: 100-200
  - Max particles per connection: 100

For slower systems:
- Reduce subdivisions to 2-3
- Lower particle count in code
- Reduce tick speed

---

## Customization

### Modifying Game of Life Rules

Edit `js/gameoflife.js`, find the `tick()` method:

```javascript
// Current rules
if (cell.alive) {
    nextAlive = neighborCount === 2 || neighborCount === 3;
} else {
    nextAlive = neighborCount === 2;
}
```

### Adding New Seed Patterns

Edit `js/gameoflife.js`, add a new case in `initialize()`:

```javascript
case 'mypattern':
    this.seedMyPattern();
    break;
```

Then implement `seedMyPattern()` method.

### Changing Colors

Edit `js/themes.js` to modify the theme colors.

---

## Known Limitations

- Grid cannot be perfectly hexagonal on a sphere (12 pentagons are required by topology)
- Performance may degrade with very high subdivisions (level 6+)
- Particle intersection organism spawning not yet implemented (TODO)

---

## Future Enhancements

- [ ] Spawn new organisms at particle intersections
- [ ] Export/import configurations
- [ ] Time-lapse recording
- [ ] VR support
- [ ] Sound effects
- [ ] Organism genetics/evolution
- [ ] Multiple spheres

---

## Technical Documentation

For detailed technical specifications, architecture, and implementation details, see [SPEC.md](SPEC.md).

---

## License

This project is open source and available for educational and personal use.

---

## Acknowledgments

- **Conway's Game of Life** - John Conway
- **Hexasphere.js** - Rob Scanlon (https://github.com/arscan/hexasphere.js/)
- **Three.js** - Three.js Authors (https://threejs.org/)

---

## Troubleshooting

**Problem**: Blank screen or errors in console

**Solutions**:
- Check that `lib/hexasphere.min.js` exists
- Ensure you're using a local server (not `file://` protocol)
- Check browser console for specific error messages
- Try a different browser

**Problem**: Low frame rate

**Solutions**:
- Reduce subdivisions to 2-3
- Lower sphere radius
- Reduce particle count in `particles.js`
- Close other browser tabs

**Problem**: Grid or cells not showing

**Solutions**:
- Increase grid opacity
- Increase cell opacity
- Try regenerating with a different seed pattern
- Switch themes (some elements more visible in dark theme)

---

**Enjoy exploring Life Projection!**
