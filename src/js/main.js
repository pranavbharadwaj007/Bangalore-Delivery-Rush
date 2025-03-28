import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Scene } from './components/Scene.js';
import { BuildingGenerator } from './components/BuildingGenerator.js';
import { RoadNetwork } from './components/RoadNetwork.js';
import { Player } from './components/Player.js';
import { CITY_CONFIG } from './config/cityConfig.js';
import '../styles/main.css';
import { Game } from './components/Game.js';
import { Minimap } from './components/Minimap.js';

// UI elements
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const arrowElement = document.getElementById('direction-arrow');
const missionInfoElement = document.getElementById('mission-info');

// Game state
const gameState = {
    score: 0,
    timeRemaining: 120, // 2 minutes
    isGameOver: false,
    collisionObjects: [],
    currentMission: null,
    landmarks: []
};

class BangaloreCity {
    constructor() {
        this.container = document.getElementById('scene-container');
        
        // Initialize scene, camera, and renderer first
        this.initializeScene();
        
        // Initialize collections
        this.buildings = [];
        this.collisionObjects = [];
        
        // Initialize player state with racing game physics
        this.playerState = {
            position: new THREE.Vector3(0, 0.5, -100),
            rotation: new THREE.Euler(0, 0, 0),
            velocity: new THREE.Vector3(0, 0, 0),
            speed: 0,
            acceleration: 0,
            leanAngle: 0,
            wheelRotation: 0,
            keys: {
                forward: false,
                backward: false,
                left: false,
                right: false,
                brake: false,
                boost: false
            },
            // Racing physics parameters
            maxSpeed: 3.0, // Faster max speed
            maxReverseSpeed: -1.0,
            acceleration: 0.0,
            deceleration: 0.02,
            brakingForce: 0.05,
            turnSpeed: 0.04, // More responsive turning
            maxLeanAngle: Math.PI / 3, // More extreme lean angle
            leanSpeed: 0.15, // Faster lean response
            grip: 0.9, // Better grip
            groundFriction: 0.99 // Less friction for better racing feel
        };
        
        // Initialize other components
        this.setupLighting();
        this.createGround();
        
        // Initialize game components
        this.buildingGenerator = new BuildingGenerator(this.scene, CITY_CONFIG);
        this.roadNetwork = new RoadNetwork(this.scene, CITY_CONFIG);
        
        // Create UI elements
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredBuilding = null;
        this.infoPanel = this.createInfoPanel();
        this.controlsHint = this.createControlsHint();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize the game
        this.initialize();

        // Initialize UI elements
        this.setupDirectionArrow();
        
        // Apply pulse animation to direction arrow
        this.pulseArrow();

        // Initialize game state
        gameState.score = 0;
        gameState.timeRemaining = 120; // 2 minutes
        gameState.isGameOver = false;

        // Start the game timer
        this.startGameTimer();
    }

    initializeScene() {
        // Create the scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue background
        
        // Create and configure the camera
        this.camera = new THREE.PerspectiveCamera(
            60, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            10000
        );
        this.camera.position.set(0, 5, -10);
        this.camera.lookAt(0, 0, 0);
        
        // Create and configure the renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Add renderer to the container
        this.container.appendChild(this.renderer.domElement);
        
        // Add fog to the scene for depth
        this.scene.fog = new THREE.Fog(0x87ceeb, 100, 700);
    }

    setupLighting() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Add directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
    }

    setupEventListeners() {
        // Mouse and window events
        this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Keyboard events
        window.addEventListener('keydown', (e) => {
            if (gameState.isGameOver) return;
            
            switch (e.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    this.playerState.keys.forward = true;
                    break;
                case 's':
                case 'arrowdown':
                    this.playerState.keys.backward = true;
                    break;
                case 'a':
                case 'arrowleft':
                    this.playerState.keys.left = true;
                    break;
                case 'd':
                case 'arrowright':
                    this.playerState.keys.right = true;
                    break;
                case 'shift':
                    this.playerState.keys.boost = true;
                    break;
                case ' ':
                    this.playerState.keys.brake = true;
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    this.playerState.keys.forward = false;
                    break;
                case 's':
                case 'arrowdown':
                    this.playerState.keys.backward = false;
                    break;
                case 'a':
                case 'arrowleft':
                    this.playerState.keys.left = false;
                    break;
                case 'd':
                case 'arrowright':
                    this.playerState.keys.right = false;
                    break;
                case 'shift':
                    this.playerState.keys.boost = false;
                    break;
                case ' ':
                    this.playerState.keys.brake = false;
                    break;
            }
        });
    }

    initialize() {
        this.showLoadingScreen();
        
        // Generate city elements
        this.generateRoads();
        
        // Generate buildings and store references
        this.buildingGenerator.generateBuildings();
        this.buildings = this.buildingGenerator.buildings.children;
        
        // Generate landmarks
        this.generateLandmarks();
        
        // Load player first
        this.player = new Player(this.scene, this.camera);
        
        // Setup game mechanics after player is loaded
        this.game = new Game(this.scene, this.camera);
        
        // Show controls hint
        this.createControlsHint();
        
        // Start animation loop
        this.animate();
        
        // Hide loading screen after everything is initialized
        setTimeout(() => this.hideLoadingScreen(), 1000);
        
        // Initialize minimap with a delay to ensure everything else is loaded
        setTimeout(() => {
            this.initializeMinimap();
            
            // Show notification about score tracking
            this.showNotification("Score Tracking Fixed", "Your score will now update correctly");
        }, 2000);
    }

    initializeMinimap() {
        console.log("Initializing minimap with fixed orientation...");
        try {
            // Check for existing minimap and remove it
            if (this.minimap && this.minimap.container) {
                this.minimap.container.remove();
            }
            
            // Create minimap with player state
            this.minimap = new Minimap(this.scene, this.playerState);
            
            // Set current destination if available
            if (this.game && this.game.currentMission) {
                this.minimap.setDestination(this.game.currentMission.position);
            }
            
            console.log("Minimap initialized successfully");
            
            // Show notification
            this.showNotification("Minimap Updated", "Fixed orientation for easier navigation");
        } catch (error) {
            console.error("Error initializing minimap:", error);
        }
    }
    showNotification(title, message, duration = 3000) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 2000;
            text-align: center;
            animation: fadeInOut ${duration/1000}s forwards;
            max-width: 80%;
        `;
        notification.innerHTML = `
            <h3 style="margin: 0 0 5px 0; font-size: 16px;">${title}</h3>
            <p style="margin: 0; font-size: 14px;">${message}</p>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -20px); }
                10% { opacity: 1; transform: translate(-50%, 0); }
                90% { opacity: 1; transform: translate(-50%, 0); }
                100% { opacity: 0; transform: translate(-50%, -20px); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        // Remove notification after animation
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, duration);
    }
    generateRoads() {
        // Create a grid of roads with wider spacing for buildings
        const gridSize = 400; // Larger city size
        const blockSize = 80; // Larger blocks for better racing
        const roadWidth = 15; // Wider roads

        // Create horizontal roads
        for (let z = -gridSize/2; z <= gridSize/2; z += blockSize) {
            const start = new THREE.Vector3(-gridSize/2, 0, z);
            const end = new THREE.Vector3(gridSize/2, 0, z);
            this.createRoad(start, end);
        }

        // Create vertical roads
        for (let x = -gridSize/2; x <= gridSize/2; x += blockSize) {
            const start = new THREE.Vector3(x, 0, -gridSize/2);
            const end = new THREE.Vector3(x, 0, gridSize/2);
            this.createRoad(start, end);
        }

        // Create a central plaza
        const plazaGeometry = new THREE.CircleGeometry(20, 32);
        const plazaMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.9,
            metalness: 0.1
        });
        const plaza = new THREE.Mesh(plazaGeometry, plazaMaterial);
        plaza.rotation.x = -Math.PI / 2;
        plaza.position.y = 0.1; // Slightly above ground to avoid z-fighting
        this.scene.add(plaza);

        // Add road markings to the plaza
        const plazaMarkingsGeometry = new THREE.CircleGeometry(19.5, 32);
        const plazaMarkingsMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.5,
            metalness: 0.1
        });
        const plazaMarkings = new THREE.Mesh(plazaMarkingsGeometry, plazaMaterial);
        plazaMarkings.rotation.x = -Math.PI / 2;
        plazaMarkings.position.y = 0.11;
        this.scene.add(plazaMarkings);
    }

    createRoad(start, end) {
        // Calculate direction and length
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        
        // Create a group to hold road parts
        const roadGroup = new THREE.Group();
        
        // Road parameters
        const roadWidth = 15;
        const roadHeight = 0.1;
        
        // Create main road with darker color and rougher texture
        const roadGeometry = new THREE.BoxGeometry(roadWidth, roadHeight, length);
        const roadMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a, // Darker color for better contrast
            roughness: 0.9,
            metalness: 0.1
        });
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.receiveShadow = true;
        
        // Create sidewalks with curbs
        const sidewalkWidth = 2;
        const sidewalkHeight = 0.2;
        const curbHeight = 0.1;
        
        // Create curb geometry (small vertical part)
        const curbGeometry = new THREE.BoxGeometry(0.2, curbHeight, length);
        const curbMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x808080,
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Left curb and sidewalk
        const leftCurb = new THREE.Mesh(curbGeometry, curbMaterial);
        leftCurb.position.set(-(roadWidth/2 + 0.1), curbHeight/2, 0);
        roadGroup.add(leftCurb);
        
        const leftSidewalk = new THREE.Mesh(
            new THREE.BoxGeometry(sidewalkWidth, sidewalkHeight, length),
            new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 })
        );
        leftSidewalk.position.set(-(roadWidth/2 + sidewalkWidth/2 + 0.2), sidewalkHeight/2, 0);
        leftSidewalk.receiveShadow = true;
        roadGroup.add(leftSidewalk);
        
        // Right curb and sidewalk
        const rightCurb = new THREE.Mesh(curbGeometry, curbMaterial);
        rightCurb.position.set(roadWidth/2 + 0.1, curbHeight/2, 0);
        roadGroup.add(rightCurb);
        
        const rightSidewalk = new THREE.Mesh(
            new THREE.BoxGeometry(sidewalkWidth, sidewalkHeight, length),
            new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 })
        );
        rightSidewalk.position.set(roadWidth/2 + sidewalkWidth/2 + 0.2, sidewalkHeight/2, 0);
        rightSidewalk.receiveShadow = true;
        roadGroup.add(rightSidewalk);
        
        // Add road markings (center line)
        const centerLineGeometry = new THREE.BoxGeometry(0.2, roadHeight + 0.01, length);
        const markingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            roughness: 0.5,
            metalness: 0.1
        });
        const centerLine = new THREE.Mesh(centerLineGeometry, markingMaterial);
        roadGroup.add(centerLine);
        
        // Add dashed lines on both sides of the center
        const dashLength = 3;
        const dashGap = 3;
        const numDashes = Math.floor(length / (dashLength + dashGap));
        
        for (let side of [-1, 1]) {
            for (let i = 0; i < numDashes; i++) {
                const dash = new THREE.Mesh(
                    new THREE.BoxGeometry(0.1, roadHeight + 0.01, dashLength),
                    markingMaterial
                );
                dash.position.set(
                    side * 2.5, // 2.5 units from center
                    0,
                    -length/2 + i * (dashLength + dashGap) + dashLength/2
                );
                roadGroup.add(dash);
            }
        }
        
        // Add the main road to the group
        roadGroup.add(road);
        
        // Position the road group
        const centerPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        roadGroup.position.copy(centerPoint);
        roadGroup.position.y = 0; // Place at ground level
        
        // Rotate the road to align with direction
        roadGroup.rotation.y = Math.atan2(direction.x, direction.z);
        
        // Add metadata for minimap
        roadGroup.userData = {
            type: 'road',
            start: start,
            end: end
        };
        
        // Add to scene
        this.scene.add(roadGroup);
        
        // Add to collision objects (only the curbs and sidewalks)
        gameState.collisionObjects.push(leftCurb);
        gameState.collisionObjects.push(rightCurb);
        gameState.collisionObjects.push(leftSidewalk);
        gameState.collisionObjects.push(rightSidewalk);
        
        return roadGroup;
    }

    generateLandmarks() {
        // Define Bangalore landmarks with positions and info
        const landmarks = [
            {
                name: "Vidhana Soudha",
                position: new THREE.Vector3(50, 0, -30),
                description: "The seat of Karnataka's legislative assembly",
                model: "building", // type of model to use
                scale: 2 // scale factor
            },
            {
                name: "UB City",
                position: new THREE.Vector3(-40, 0, 40),
                description: "Luxury mall and business center",
                model: "skyscraper",
                scale: 1.5
            },
            {
                name: "Cubbon Park",
                position: new THREE.Vector3(30, 0, 60),
                description: "Historic park in the heart of the city",
                model: "park",
                scale: 3
            },
            {
                name: "MTR Restaurant",
                position: new THREE.Vector3(-60, 0, -20),
                description: "Iconic South Indian restaurant",
                model: "building",
                scale: 1
            },
            {
                name: "Bangalore Palace",
                position: new THREE.Vector3(70, 0, 10),
                description: "Historic royal palace built in Tudor style",
                model: "palace",
                scale: 2.5
            }
        ];
        
        // Create each landmark
        landmarks.forEach(landmark => {
            let landmarkObj;
            
            // Create different models based on type
            switch (landmark.model) {
                case "park":
                    landmarkObj = this.createPark(landmark.position, landmark.scale * 15);
                    break;
                case "palace":
                case "skyscraper":
                case "building":
                default:
                    landmarkObj = this.createLandmarkBuilding(landmark, landmark.scale);
            }
            
            // Add to scene and collision objects
            this.scene.add(landmarkObj);
            gameState.collisionObjects.push(landmarkObj);
            
            // Add to landmarks array for missions
            gameState.landmarks.push(landmarkObj);
            
            // Create nametag
            this.createLandmarkNameTag(landmarkObj, landmark.name);
        });
    }
    
    createLandmarkBuilding(landmark, scale) {
        // Base group for the landmark
        const group = new THREE.Group();
        group.position.copy(landmark.position);
        
        // Create appropriate building based on type
        let building;
        
        if (landmark.model === "palace") {
            // Create palace-like structure
            const baseGeometry = new THREE.BoxGeometry(20 * scale, 10 * scale, 20 * scale);
            const baseMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xf5e6c9,
                roughness: 0.7,
                metalness: 0.2
            });
            building = new THREE.Mesh(baseGeometry, baseMaterial);
            building.position.y = 5 * scale;
            
            // Add towers
            const towerSize = 4 * scale;
            for (let x = -1; x <= 1; x += 2) {
                for (let z = -1; z <= 1; z += 2) {
                    const towerGeometry = new THREE.CylinderGeometry(
                        towerSize / 2, towerSize / 2, 20 * scale, 8
                    );
                    const tower = new THREE.Mesh(towerGeometry, baseMaterial);
                    tower.position.set(
                        x * 10 * scale,
                        10 * scale,
                        z * 10 * scale
                    );
                    group.add(tower);
                    
                    // Add tower top
                    const topGeometry = new THREE.ConeGeometry(
                        towerSize / 2 + 0.5, 5 * scale, 8
                    );
                    const topMaterial = new THREE.MeshStandardMaterial({
                        color: 0x8b4513,
                        roughness: 0.8
                    });
                    const top = new THREE.Mesh(topGeometry, topMaterial);
                    top.position.y = 10 * scale;
                    tower.add(top);
                }
            }
        } else if (landmark.model === "skyscraper") {
            // Create modern skyscraper
            const baseGeometry = new THREE.BoxGeometry(15 * scale, 40 * scale, 15 * scale);
            const baseMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x87ceeb,
                roughness: 0.2,
                metalness: 0.8
            });
            building = new THREE.Mesh(baseGeometry, baseMaterial);
            building.position.y = 20 * scale;
            
            // Add details
            const detailGeometry = new THREE.BoxGeometry(16 * scale, 5 * scale, 16 * scale);
            const detailMaterial = new THREE.MeshStandardMaterial({
                color: 0x333333,
                roughness: 0.5,
                metalness: 0.5
            });
            
            // Add bands around building
            for (let y = -15; y <= 15; y += 10) {
                const detail = new THREE.Mesh(detailGeometry, detailMaterial);
                detail.position.y = y * scale;
                building.add(detail);
            }
        } else {
            // Default building
            const height = (10 + Math.random() * 20) * scale;
            const width = (10 + Math.random() * 5) * scale;
            const depth = (10 + Math.random() * 5) * scale;
            
            const baseGeometry = new THREE.BoxGeometry(width, height, depth);
            const baseMaterial = new THREE.MeshStandardMaterial({ 
                color: landmark.model === "building" ? 0xd2b48c : 0xffffff,
                roughness: 0.7,
                metalness: 0.3
            });
            building = new THREE.Mesh(baseGeometry, baseMaterial);
            building.position.y = height / 2;
        }
        
        building.castShadow = true;
        building.receiveShadow = true;
        group.add(building);
        
        // Add user data for information display
        group.userData = {
            name: landmark.name,
            description: landmark.description,
            type: "landmark"
        };
        
        return group;
    }
    
    createPark(position, size) {
        const group = new THREE.Group();
        group.position.copy(position);
        
        // Create ground
        const groundGeometry = new THREE.CircleGeometry(size, 32);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x2e8b57,
            roughness: 0.9,
            metalness: 0.1
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        group.add(ground);
        
        // Add trees
        const treeCount = Math.floor(size / 3);
        for (let i = 0; i < treeCount; i++) {
            const distance = Math.random() * size * 0.8;
            const angle = Math.random() * Math.PI * 2;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            this.createTree(group, x, 0, z);
        }
        
        // Add a central feature (like a small building or statue)
        const featureGeometry = new THREE.CylinderGeometry(size/10, size/10, size/5, 8);
        const featureMaterial = new THREE.MeshStandardMaterial({
            color: 0xd2b48c,
            roughness: 0.8,
            metalness: 0.2
        });
        const feature = new THREE.Mesh(featureGeometry, featureMaterial);
        feature.position.y = size/10;
        feature.castShadow = true;
        group.add(feature);
        
        // Add user data
        group.userData = {
            name: "Cubbon Park",
            description: "Historic park in the heart of the city",
            type: "landmark"
        };
        
        return group;
    }
    
    createTree(parent, x, y, z) {
        const treeHeight = 1 + Math.random() * 2;
        
        // Create trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, treeHeight, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.9,
            metalness: 0.1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, y + treeHeight/2, z);
        trunk.castShadow = true;
        parent.add(trunk);
        
        // Create foliage
        const foliageSize = 0.5 + Math.random() * 1.5;
        const foliageGeometry = new THREE.SphereGeometry(foliageSize, 8, 8);
        const foliageMaterial = new THREE.MeshStandardMaterial({
            color: 0x2e8b57,
            roughness: 0.9,
            metalness: 0
        });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = treeHeight - 0.3;
        foliage.castShadow = true;
        trunk.add(foliage);
    }
    
    createLandmarkNameTag(landmark, name) {
        // Add a nameplate to the landmark
        const size = 2;
        const plateGeometry = new THREE.BoxGeometry(name.length * 0.5, size * 0.8, 0.2);
        const plateMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.5,
            metalness: 0.5
        });
        const plate = new THREE.Mesh(plateGeometry, plateMaterial);
        
        // Position the plate at the base of the landmark
        const boundingBox = new THREE.Box3().setFromObject(landmark);
        const height = boundingBox.max.y - boundingBox.min.y;
        plate.position.y = -height/2 + size/2;
        plate.rotation.x = Math.PI * 0.1;
        
        landmark.add(plate);
    }

    addVehicles() {
        // Add some random vehicles
        for (let i = 0; i < 10; i++) {
            const vehicle = this.roadNetwork.generateVehicle();
            vehicle.position.set(
                Math.random() * 200 - 100,
                0,
                Math.random() * 200 - 100
            );
            vehicle.rotation.y = Math.random() * Math.PI * 2;
        }
    }

    onMouseMove(event) {
        // Calculate mouse position in normalized device coordinates
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.checkBuildingHover();
    }

    checkBuildingHover() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        const intersects = this.raycaster.intersectObjects(
            this.buildingGenerator.buildings.children,
            true
        );
        
        if (intersects.length > 0) {
            const building = intersects[0].object;
            
            if (this.hoveredBuilding !== building) {
                this.hoveredBuilding = building;
                this.showBuildingInfo(building);
            }
        } else {
            if (this.hoveredBuilding) {
                this.hoveredBuilding = null;
                this.hideBuildingInfo();
            }
        }
    }

    createInfoPanel() {
        const panel = document.createElement('div');
        panel.className = 'info-panel';
        panel.style.display = 'none';
        document.body.appendChild(panel);
        return panel;
    }

    createControlsHint() {
        const hint = document.createElement('div');
        hint.className = 'controls-hint';
        hint.innerHTML = `
            <h2>Controls</h2>
            <ul>
                <li><strong>W/↑</strong> - Accelerate</li>
                <li><strong>S/↓</strong> - Brake/Reverse</li>
                <li><strong>A/←</strong> - Turn Left</li>
                <li><strong>D/→</strong> - Turn Right</li>
                <li><strong>Shift</strong> - Boost Speed</li>
            </ul>
            <p>Deliver to the marked landmarks to score points!</p>
        `;
        hint.style.display = 'none';
        document.body.appendChild(hint);
        return hint;
    }

    showBuildingInfo(building) {
        if (building.userData && building.userData.name) {
            this.infoPanel.innerHTML = `
                <h2>${building.userData.name}</h2>
                <p>${building.userData.description || ''}</p>
                ${building.userData.features ? `
                    <h3>Features:</h3>
                    <ul>
                        ${building.userData.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                ` : ''}
            `;
            this.infoPanel.style.display = 'block';
            
            // Position info panel near the building
            const vector = new THREE.Vector3();
            vector.setFromMatrixPosition(building.matrixWorld);
            vector.project(this.camera);
            
            const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
            
            this.infoPanel.style.transform = `translate(${x}px, ${y}px)`;
        }
    }

    hideBuildingInfo() {
        this.infoPanel.style.display = 'none';
    }

    showLoadingScreen() {
        try {
            // Check if loading screen already exists
            let loadingScreen = document.getElementById('loading-screen');
            
            if (!loadingScreen) {
                // Create loading screen if it doesn't exist
                loadingScreen = document.createElement('div');
                loadingScreen.id = 'loading-screen';
                loadingScreen.style.position = 'fixed';
                loadingScreen.style.top = '0';
                loadingScreen.style.left = '0';
                loadingScreen.style.width = '100%';
                loadingScreen.style.height = '100%';
                loadingScreen.style.backgroundColor = '#000';
                loadingScreen.style.display = 'flex';
                loadingScreen.style.flexDirection = 'column';
                loadingScreen.style.justifyContent = 'center';
                loadingScreen.style.alignItems = 'center';
                loadingScreen.style.zIndex = '1000';
                loadingScreen.style.transition = 'opacity 0.5s ease-in-out';
                
                // Add a title
                const title = document.createElement('h1');
                title.textContent = 'Bangalore Delivery Rush';
                title.style.color = '#fff';
                title.style.marginBottom = '20px';
                title.style.fontFamily = 'Arial, sans-serif';
                loadingScreen.appendChild(title);
                
                // Add a loading spinner
                const spinner = document.createElement('div');
                spinner.style.width = '50px';
                spinner.style.height = '50px';
                spinner.style.border = '5px solid rgba(255, 255, 255, 0.3)';
                spinner.style.borderTop = '5px solid #fff';
                spinner.style.borderRadius = '50%';
                spinner.style.animation = 'spin 1s linear infinite';
                loadingScreen.appendChild(spinner);
                
                // Add animation style
                const style = document.createElement('style');
                style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
                document.head.appendChild(style);
                
                // Add a loading text
                const loadingText = document.createElement('p');
                loadingText.textContent = 'Loading...';
                loadingText.style.color = '#fff';
                loadingText.style.marginTop = '20px';
                loadingText.style.fontFamily = 'Arial, sans-serif';
                loadingScreen.appendChild(loadingText);
                
                document.body.appendChild(loadingScreen);
            } else {
                // Ensure it's visible if it already exists
                loadingScreen.style.display = 'flex';
                loadingScreen.style.opacity = '1';
            }
            
            console.log('Loading screen shown');
        } catch (e) {
            console.error('Error showing loading screen:', e);
        }
    }
    
    hideLoadingScreen() {
        try {
            // Use a delay to ensure everything is loaded before hiding
            setTimeout(() => {
                const loadingScreen = document.getElementById('loading-screen');
                if (loadingScreen) {
                    // Fade out
                    loadingScreen.style.opacity = '0';
                    
                    // Remove after transition completes
                    setTimeout(() => {
                        loadingScreen.remove();
                        console.log('Loading screen removed');
                    }, 500);
                }
            }, 1000);
        } catch (e) {
            console.error('Error hiding loading screen:', e);
            // Fallback removal attempt
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) loadingScreen.remove();
        }
    }
    
    showControlsHint() {
        if (!this.controlsHint) return;
        
        this.controlsHint.style.display = 'block';
        this.controlsHint.style.opacity = '1';
        
        setTimeout(() => {
            this.controlsHint.style.opacity = '0';
            setTimeout(() => {
                this.controlsHint.style.display = 'none';
            }, 500);
        }, 10000);
    }

    onWindowResize() {
        // Update camera aspect ratio and renderer size
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        if (gameState.isGameOver) return;
    
        // Show delivery radius indicator if not already shown
        if (this.game && this.game.currentMission && !this.deliveryRadiusHelper) {
            this.showDeliveryRadiusIndicator();
        }
        
        requestAnimationFrame(this.animate.bind(this));

        // Update physics and controls
        this.updatePlayerPhysics();

        // Update player
        this.player.update(this.playerState);

        // Update camera
        this.updateCamera();

        // Update direction arrow
        this.updateDirectionArrow();

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    updatePlayerPhysics() {
        const state = this.playerState;
        
        // Handle acceleration
        if (state.keys.forward) {
            state.acceleration = state.acceleration * 0.95 + 0.002;
            state.speed += state.acceleration;
        } else if (state.keys.backward) {
            state.acceleration = state.acceleration * 0.95 - 0.002;
            state.speed += state.acceleration;
        } else {
            state.acceleration *= 0.95;
            state.speed *= 0.98; // Natural deceleration
        }

        // Apply braking
        if (state.keys.brake) {
            state.speed *= 0.95;
            state.acceleration *= 0.9;
        }

        // Apply boost
        const currentMaxSpeed = state.keys.boost ? state.maxSpeed * 1.5 : state.maxSpeed;

        // Clamp speed
        state.speed = Math.max(state.maxReverseSpeed, Math.min(currentMaxSpeed, state.speed));

        // Handle turning with increased angle
        let turnAmount = 0;
        if (Math.abs(state.speed) > 0.01) {
            const turnMultiplier = state.speed > 0 ? 1 : -1;
            const baseTurnAngle = Math.PI / 2.5; // Approximately 40 degrees
            
            if (state.keys.left) {
                turnAmount = baseTurnAngle * turnMultiplier * (Math.abs(state.speed) / currentMaxSpeed);
            }
            if (state.keys.right) {
                turnAmount = -baseTurnAngle * turnMultiplier * (Math.abs(state.speed) / currentMaxSpeed);
            }
        }

        // Calculate lean angle for motorcycle
        const targetLean = -turnAmount * 25; // More pronounced lean for sharper turns
        state.leanAngle = THREE.MathUtils.lerp(state.leanAngle, targetLean, 0.1);

        // Update rotation
        state.rotation.y += turnAmount;

        // Calculate forward vector based on rotation
        const forward = new THREE.Vector3(
            Math.sin(state.rotation.y),
            0,
            Math.cos(state.rotation.y)
        );

        // Update position
        state.position.add(forward.multiplyScalar(state.speed));

        // Update wheel rotation based on speed
        state.wheelRotation = state.speed * 0.5;

        // Collision detection and response
        this.handleCollisions();
    }

    handleCollisions() {
        if (!this.buildings || !Array.isArray(this.buildings)) {
            console.warn('Buildings array not properly initialized');
            return;
        }

        const state = this.playerState;
        const position = state.position.clone();
        position.y = 0.5; // Adjust to ground level

        // Create player bounding box
        const playerBox = new THREE.Box3().setFromCenterAndSize(
            position,
            new THREE.Vector3(1, 1, 2)
        );

        // Check for collisions with buildings
        for (let i = 0; i < this.buildings.length; i++) {
            const building = this.buildings[i];
            if (!building) continue;

            const boundingBox = new THREE.Box3().setFromObject(building);
            
            if (playerBox.intersectsBox(boundingBox)) {
                // Calculate push-back direction
                const pushBack = position.clone().sub(boundingBox.getCenter(new THREE.Vector3()));
                pushBack.y = 0;
                pushBack.normalize();

                // Push player away from collision
                state.position.add(pushBack.multiplyScalar(0.5));

                // Reduce speed and add some bounce
                state.speed *= -0.3;
                state.acceleration = 0;
            }
        }

        // Check for collisions with other objects
        if (this.collisionObjects) {
            this.collisionObjects.forEach(obj => {
                if (!obj) return;
                const objBox = new THREE.Box3().setFromObject(obj);
                if (playerBox.intersectsBox(objBox)) {
                    const pushBack = position.clone().sub(objBox.getCenter(new THREE.Vector3()));
                    pushBack.y = 0;
                    pushBack.normalize();
                    state.position.add(pushBack.multiplyScalar(0.5));
                    state.speed *= -0.3;
                    state.acceleration = 0;
                }
            });
        }

        // Keep player within bounds
        const bounds = 1000;
        state.position.x = THREE.MathUtils.clamp(state.position.x, -bounds, bounds);
        state.position.z = THREE.MathUtils.clamp(state.position.z, -bounds, bounds);
    }

    updateCamera() {
        const state = this.playerState;
        
        // Calculate camera position for third-person view
        const distance = 7; // Distance behind the motorcycle
        const height = 2.5; // Height above the motorcycle
        const lookAheadDistance = 5; // How far ahead to look
        
        // Calculate base camera position behind the motorcycle
        const cameraOffset = new THREE.Vector3(
            -Math.sin(state.rotation.y) * distance,
            height + Math.abs(state.speed) * 0.2, // Camera rises slightly with speed
            -Math.cos(state.rotation.y) * distance
        );
        
        // Add lean effect to camera
        cameraOffset.x += state.leanAngle * 0.5;
        
        // Calculate target camera position
        const targetPosition = state.position.clone().add(cameraOffset);
        
        // Smoothly interpolate camera position
        this.camera.position.lerp(targetPosition, 0.1);
        
        // Look ahead point
        const lookAtOffset = new THREE.Vector3(
            Math.sin(state.rotation.y) * lookAheadDistance,
            1 + (state.speed / state.maxSpeed), // Look up more at higher speeds
            Math.cos(state.rotation.y) * lookAheadDistance
        );
        
        // Calculate look at point
        const targetLookAt = state.position.clone().add(lookAtOffset);
        
        // Create a temporary vector for smooth camera rotation
        const currentLookAt = new THREE.Vector3();
        this.camera.getWorldDirection(currentLookAt);
        const newLookAt = targetLookAt.clone().sub(this.camera.position).normalize();
        
        // Smoothly interpolate the look-at direction
        currentLookAt.lerp(newLookAt, 0.1);
        this.camera.lookAt(this.camera.position.clone().add(currentLookAt));
    }

    setupDirectionArrow() {
        // Get existing arrow element
        const existingArrow = document.getElementById('direction-arrow');
        if (existingArrow) {
            // Remove existing arrow to avoid duplicates
            existingArrow.remove();
        }
        
        // Create container div
        const arrowContainer = document.createElement('div');
        arrowContainer.id = 'direction-arrow-container';
        
        // Create arrow element
        const arrowElement = document.createElement('div');
        arrowElement.id = 'direction-arrow';
        arrowElement.innerHTML = '⬆';
        
        // Add arrow to container
        arrowContainer.appendChild(arrowElement);
        
        // Add container to document
        document.body.appendChild(arrowContainer);
        
        // Add CSS styles
        const style = document.createElement('style');
        style.textContent = `
            #direction-arrow-container {
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 1000;
                pointer-events: none;
            }
            
            #direction-arrow {
                font-size: 48px;
                color: white;
                text-shadow: 0 0 10px rgba(33, 150, 243, 0.8);
                transform-origin: center;
                transition: transform 0.3s ease-out, color 0.3s ease-out;
            }
            
            #direction-arrow::after {
                content: attr(data-distance);
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                font-size: 18px;
                font-weight: bold;
                white-space: nowrap;
                margin-top: 10px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                background: rgba(0,0,0,0.5);
                padding: 5px 10px;
                border-radius: 5px;
            }
        `;
        document.head.appendChild(style);
    }

    pulseArrow() {
        const arrowElement = document.getElementById('direction-arrow');
        if (!arrowElement) return;
        
        let scale = 1.0;
        let growing = true;
        
        const pulseInterval = setInterval(() => {
            // Stop if arrow no longer exists
            if (!document.getElementById('direction-arrow')) {
                clearInterval(pulseInterval);
                return;
            }
            
            if (growing) {
                scale += 0.01;
                if (scale >= 1.1) growing = false;
            } else {
                scale -= 0.01;
                if (scale <= 1.0) growing = true;
            }
            
            // Apply scale but keep any existing rotation
            const rotation = arrowElement.style.transform || '';
            const rotateMatch = rotation.match(/rotate\(([^)]+)\)/);
            const rotateValue = rotateMatch ? rotateMatch[0] : '';
            
            arrowElement.style.transform = `scale(${scale}) ${rotateValue}`;
        }, 50);
    }

    updateDirectionArrow() {
        const arrowElement = document.getElementById('direction-arrow');
        if (!arrowElement || !this.game || !this.game.currentMission) return;

        const state = this.playerState;
        const missionPos = this.game.currentMission.position;
        
        // Calculate vector from player to mission target
        const targetVector = new THREE.Vector3(
            missionPos.x - state.position.x,
            0,
            missionPos.z - state.position.z
        );

        // Calculate absolute angle to target (in world space)
        const targetAngle = Math.atan2(targetVector.x, targetVector.z);
        
        // Calculate relative angle by subtracting player's rotation
        let relativeAngle = targetAngle - state.rotation.y;
        
        // Normalize angle to be between -π and π
        while (relativeAngle > Math.PI) relativeAngle -= 2 * Math.PI;
        while (relativeAngle < -Math.PI) relativeAngle += 2 * Math.PI;

        // Convert angle to degrees
        const degrees = (relativeAngle * 180) / Math.PI;

        // Calculate distance to target
        const distance = targetVector.length();

        // Check if within delivery radius (50 meters)
        if (distance <= 50) {
            this.completeDelivery();
        }

        // Update arrow rotation with the relative angle
        // This applies ONLY rotation and preserves scaling from the pulse animation
        arrowElement.style.transform = `rotate(${degrees}deg)`;

        // Get direction text based on angle
        let directionText = "";
        const angleDeg = ((degrees + 360) % 360); // Convert to 0-360 range
        
        if (angleDeg >= 337.5 || angleDeg < 22.5) {
            directionText = "NORTH";
        } else if (angleDeg >= 22.5 && angleDeg < 67.5) {
            directionText = "NORTHEAST";
        } else if (angleDeg >= 67.5 && angleDeg < 112.5) {
            directionText = "EAST";
        } else if (angleDeg >= 112.5 && angleDeg < 157.5) {
            directionText = "SOUTHEAST";
        } else if (angleDeg >= 157.5 && angleDeg < 202.5) {
            directionText = "SOUTH";
        } else if (angleDeg >= 202.5 && angleDeg < 247.5) {
            directionText = "SOUTHWEST";
        } else if (angleDeg >= 247.5 && angleDeg < 292.5) {
            directionText = "WEST";
        } else {
            directionText = "NORTHWEST";
        }

        // Update glow intensity and color based on distance
        const maxDistance = 200;
        const intensity = Math.max(0.3, 1 - (distance / maxDistance));
        const glowSize = Math.max(10, 40 * intensity);
        
        // Change color from red to green based on distance
        const hue = Math.min(120, (1 - distance/100) * 120);
        const color = `hsl(${hue}, 100%, 50%)`;
        
        // Create stronger glow effect when closer
        arrowElement.style.color = color;
        arrowElement.style.textShadow = `
            0 0 ${glowSize}px ${color},
            0 0 ${glowSize * 1.5}px ${color},
            0 0 ${glowSize * 2}px ${color},
            0 0 ${glowSize * 2.5}px ${color}
        `;

        // Update arrow size based on distance
        const size = Math.min(64, Math.max(48, 64 * (50 / Math.max(distance, 1))));
        arrowElement.style.fontSize = `${size}px`;

        // Show distance and direction
        arrowElement.setAttribute('data-distance', `${Math.round(distance)}m ${directionText}`);
        
        // Update minimap destination if available
        if (this.minimap) {
            this.minimap.setDestination(missionPos);
        }
    }
    showDeliveryRadiusIndicator() {
        if (!this.scene || !this.game || !this.game.currentMission) return;
        
        // Remove existing indicator if any
        if (this.deliveryRadiusHelper) {
            this.scene.remove(this.deliveryRadiusHelper);
        }
        
        // Create delivery radius indicator
        const radius = 15; // Delivery detection radius
        const geometry = new THREE.RingGeometry(radius - 0.5, radius, 32);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3
        });
        
        this.deliveryRadiusHelper = new THREE.Mesh(geometry, material);
        this.deliveryRadiusHelper.rotation.x = -Math.PI / 2; // Make it horizontal
        this.deliveryRadiusHelper.position.copy(this.game.currentMission.position);
        this.deliveryRadiusHelper.position.y = 0.1; // Just above ground to avoid z-fighting
        
        // Add pulsing animation
        const startTime = Date.now();
        const animate = () => {
            if (!this.deliveryRadiusHelper) return;
            
            const elapsed = Date.now() - startTime;
            const scale = 1 + Math.sin(elapsed * 0.003) * 0.1; // Gentle pulsing
            
            this.deliveryRadiusHelper.scale.set(scale, scale, 1);
            
            requestAnimationFrame(animate);
        };
        
        // Start animation
        animate();
        
        // Add to scene
        this.scene.add(this.deliveryRadiusHelper);
    }
    
 
    completeDelivery() {
        if (!this.game || !this.game.currentMission || this.game.isDelivering) return;
        
        this.game.isDelivering = true; // Prevent multiple deliveries at same location
        
        // Add visual feedback
        const successFlash = document.createElement('div');
        successFlash.style.position = 'fixed';
        successFlash.style.top = '0';
        successFlash.style.left = '0';
        successFlash.style.width = '100%';
        successFlash.style.height = '100%';
        successFlash.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
        successFlash.style.zIndex = '1000';
        successFlash.style.pointerEvents = 'none';
        successFlash.style.animation = 'flash 0.5s ease-out';
        document.body.appendChild(successFlash);
    
        // Add animation style if not exists
        if (!document.getElementById('flash-animation')) {
            const style = document.createElement('style');
            style.id = 'flash-animation';
            style.textContent = `
                @keyframes flash {
                    0% { opacity: 0.7; }
                    100% { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    
        // Remove the flash effect after animation
        setTimeout(() => {
            if (document.body.contains(successFlash)) {
                document.body.removeChild(successFlash);
            }
        }, 500);
        
        // Update score with clearer feedback
        gameState.score += 100;
        
        // Force update the score element text
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = `Score: ${gameState.score}`;
            
            // Add a visual score indicator that animates
            const scoreIndicator = document.createElement('div');
            scoreIndicator.className = 'score-popup';
            scoreIndicator.textContent = '+100';
            scoreIndicator.style.position = 'absolute';
            scoreIndicator.style.top = '50%';
            scoreIndicator.style.left = '50%';
            scoreIndicator.style.transform = 'translate(-50%, -50%)';
            scoreIndicator.style.color = '#4CAF50';
            scoreIndicator.style.fontSize = '32px';
            scoreIndicator.style.fontWeight = 'bold';
            scoreIndicator.style.animation = 'scorePopup 1.5s ease-out forwards';
            document.body.appendChild(scoreIndicator);
            
            // Add animation keyframes if they don't exist
            if (!document.getElementById('score-popup-style')) {
                const style = document.createElement('style');
                style.id = 'score-popup-style';
                style.textContent = `
                    @keyframes scorePopup {
                        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                        20% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                        100% { opacity: 0; transform: translate(-50%, -100%) scale(1); }
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Remove the indicator after animation completes
            setTimeout(() => {
                if (document.body.contains(scoreIndicator)) {
                    document.body.removeChild(scoreIndicator);
                }
            }, 1500);
        }
    
        // Show success message
        this.showDeliverySuccess();
    
        // Log score update to console for debugging
        console.log("Delivery completed! Score updated to:", gameState.score);
    
        // Set new random destination after a short delay
        setTimeout(() => {
            if (this.game && typeof this.game.setNewRandomDestination === 'function') {
                this.game.setNewRandomDestination();
            } else if (typeof this.setNewRandomDestination === 'function') {
                // Fallback for missing method
                this.setNewRandomDestination();
            }
            this.game.isDelivering = false;
        }, 1500);
    }

    showDeliverySuccess() {
        // Create success message element with improved styling
        const successElement = document.createElement('div');
        successElement.className = 'delivery-success';
        successElement.innerHTML = `
            <div class="success-content">
                <h3>Delivery Complete! +100 points</h3>
                <p>Next destination loading...</p>
            </div>
        `;
    
        // Add success message styles
        const style = document.createElement('style');
        style.textContent = `
            .delivery-success {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 128, 0, 0.2);
                border: 2px solid #00ff00;
                border-radius: 10px;
                padding: 20px;
                color: #fff;
                text-align: center;
                animation: fadeInOut 1.5s ease-in-out forwards;
                z-index: 1000;
                box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
            }
            .success-content {
                text-shadow: 0 0 10px #00ff00;
            }
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(successElement);
    
        // Play success sound if possible
        try {
            const successSound = new Audio();
            successSound.src = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
            successSound.play().catch(e => console.log('Could not play success sound', e));
        } catch (e) {
            console.log('Could not create success sound', e);
        }
    
        // Remove the success message after animation
        setTimeout(() => {
            if (document.body.contains(successElement)) {
                document.body.removeChild(successElement);
            }
        }, 1500);
    }

    startGameTimer() {
        const timerElement = document.getElementById('timer');
        const updateTimer = () => {
            if (gameState.isGameOver) return;
            
            gameState.timeRemaining--;
            
            if (gameState.timeRemaining <= 0) {
                this.gameOver(`Time's up! You made ${gameState.score / 100} deliveries!`);
                return;
            }

            const minutes = Math.floor(gameState.timeRemaining / 60);
            const seconds = gameState.timeRemaining % 60;
            timerElement.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            setTimeout(updateTimer, 1000);
        };

        updateTimer();
    }

    gameOver(reason) {
        if (!gameState.isGameOver) {
            gameState.isGameOver = true;
            const gameOverElement = document.createElement('div');
            gameOverElement.id = 'game-over';
            gameOverElement.className = 'game-ui game-over';
            gameOverElement.innerHTML = `
                <h2>Game Over</h2>
                <p>${reason}</p>
                <p>Final Score: ${gameState.score}</p>
                <button onclick="location.reload()">Play Again</button>
            `;
            document.body.appendChild(gameOverElement);
        }
    }

    createMotorcycle() {
        const group = new THREE.Group();
        
        // Motorcycle body (main part)
        const bodyGeometry = new THREE.BoxGeometry(1, 0.8, 2.5);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xe74c3c,
            roughness: 0.5,
            metalness: 0.7
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6;
        body.castShadow = true;
        group.add(body);
        
        // Front fork
        const forkGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
        const forkMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xaaaaaa, 
            metalness: 0.8, 
            roughness: 0.2 
        });
        const fork = new THREE.Mesh(forkGeometry, forkMaterial);
        fork.position.set(0, 0.5, 1.1);
        fork.rotation.x = Math.PI / 4;
        fork.castShadow = true;
        group.add(fork);
        
        // Handlebars
        const handlebarGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
        handlebarGeometry.rotateZ(Math.PI / 2);
        const handlebar = new THREE.Mesh(handlebarGeometry, forkMaterial);
        handlebar.position.set(0, 0.9, 1.0);
        handlebar.castShadow = true;
        group.add(handlebar);
        
        // Seat
        const seatGeometry = new THREE.BoxGeometry(0.8, 0.1, 1);
        const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(0, 1, -0.2);
        seat.castShadow = true;
        group.add(seat);
        
        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
        wheelGeometry.rotateZ(Math.PI / 2);
        const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
        
        // Front wheel
        const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontWheel.position.set(0, 0, 1.2);
        frontWheel.castShadow = true;
        group.add(frontWheel);
        
        // Back wheel
        const backWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        backWheel.position.set(0, 0, -1);
        backWheel.castShadow = true;
        group.add(backWheel);
        
        // Headlight
        const headlightGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16);
        headlightGeometry.rotateX(Math.PI / 2);
        const headlightMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            emissive: 0xffffcc,
            emissiveIntensity: 0.5
        });
        const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        headlight.position.set(0, 0.6, 1.3);
        group.add(headlight);
        
        // Add directional light for headlight effect
        const headlightLight = new THREE.SpotLight(0xffffcc, 1);
        headlightLight.position.set(0, 0.6, 1.3);
        headlightLight.target.position.set(0, 0, 5);
        headlightLight.angle = Math.PI / 8;
        headlightLight.penumbra = 0.2;
        headlightLight.distance = 20;
        headlightLight.castShadow = true;
        group.add(headlightLight);
        group.add(headlightLight.target);
        
        return group;
    }

    createGround() {
        // Create a large ground plane
        const groundSize = 1000;
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x7cba7c,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // Make it horizontal
        ground.receiveShadow = true;
        this.scene.add(ground);
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new BangaloreCity();
});