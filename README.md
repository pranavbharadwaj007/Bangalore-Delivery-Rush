# Bangalore City 3D Simulation

An interactive 3D visualization of Bangalore city using Three.js.

## Features

- Realistic city layout with different types of buildings
- Navigable character with third-person camera
- Dynamic traffic system with vehicles and traffic lights
- Interactive landmarks with information panels
- Realistic road network with proper markings and intersections
- Day/night cycle with dynamic lighting
- Mobile-responsive design
- **Direction Arrow**: Points towards the delivery destination with distance and direction (NORTH, NORTHEAST, etc.)
- **Scoring System**: Earn points for each delivery completed within a time limit
- **Timer**: 2-minute countdown for deliveries

## Controls

- **W/S** - Move forward/backward
- **A/D** - Move left/right
- **Q/E** - Rotate left/right
- **Space** - Boost speed
- **Mouse hover** - View building information

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bangalore-city-3d
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5190`

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```