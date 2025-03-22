import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CITY_CONFIG } from '../config/cityConfig.js';
import { BuildingGenerator } from './BuildingGenerator.js';
import { RoadNetwork } from './RoadNetwork.js';
import { MaterialManager } from './MaterialManager.js';

export class Scene {
    constructor(container) {
        if (!container) {
            throw new Error('Container element is required');
        }
        
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = this.setupCamera();
        this.renderer = this.setupRenderer();
        this.controls = this.setupControls();
        this.materialManager = new MaterialManager(this.scene, this.renderer, this.camera);
        
        // Initialize components
        this.buildingGenerator = new BuildingGenerator(this.scene);
        this.roadNetwork = new RoadNetwork(this.scene);
        
        // Setup scene
        this.setupLighting();
        this.setupEnvironment();
        this.generateCity();
        
        // Start animation loop
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }
    
    setupCamera() {
        const camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
        camera.position.set(200, 200, 200);
        camera.lookAt(0, 0, 0);
        return camera;
    }
    
    setupRenderer() {
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance",
            stencil: false,
            depth: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        renderer.physicallyCorrectLights = true;
        this.container.appendChild(renderer.domElement);
        return renderer;
    }
    
    setupControls() {
        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 100;
        controls.maxDistance = 500;
        controls.maxPolarAngle = Math.PI / 2;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        return controls;
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Sun light with better shadows
        const sunLight = new THREE.DirectionalLight(0xffffff, 1);
        sunLight.position.set(100, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -200;
        sunLight.shadow.camera.right = 200;
        sunLight.shadow.camera.top = 200;
        sunLight.shadow.camera.bottom = -200;
        sunLight.shadow.bias = -0.0001;
        this.scene.add(sunLight);
        
        // Additional fill lights for better illumination
        const fillLight1 = new THREE.DirectionalLight(0x8ec4ff, 0.5);
        fillLight1.position.set(-100, 50, -50);
        this.scene.add(fillLight1);

        const fillLight2 = new THREE.DirectionalLight(0xffe5bd, 0.3);
        fillLight2.position.set(50, 50, 100);
        this.scene.add(fillLight2);
    }
    
    setupEnvironment() {
        // Sky
        const sky = new THREE.HemisphereLight(0x87ceeb, 0x404040, 0.6);
        this.scene.add(sky);
        
        // Ground with better material
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 128, 128);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: CITY_CONFIG.colors.ground,
            roughness: 0.8,
            metalness: 0.2,
            side: THREE.DoubleSide
        });
        
        // Add displacement to ground for more realism
        const displacementTexture = new THREE.TextureLoader().load(
            'https://cdn.jsdelivr.net/gh/mrdoob/three.js/examples/textures/terrain/grasslight-big.jpg'
        );
        displacementTexture.wrapS = THREE.RepeatWrapping;
        displacementTexture.wrapT = THREE.RepeatWrapping;
        displacementTexture.repeat.set(10, 10);
        groundMaterial.displacementMap = displacementTexture;
        groundMaterial.displacementScale = 2;
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add fog for atmosphere
        this.scene.fog = new THREE.FogExp2(0xd7e1e9, 0.0015);
    }
    
    generateCity() {
        try {
            // Generate landmarks
            CITY_CONFIG.landmarks.forEach(landmark => {
                this.buildingGenerator.generateBuilding(
                    landmark.position.x,
                    landmark.position.z,
                    'landmark',
                    landmark
                );
            });

            // Generate commercial areas
            CITY_CONFIG.commercialAreas.forEach(area => {
                const buildingCount = Math.floor(area.length / 10);
                for (let i = 0; i < buildingCount; i++) {
                    const x = area.position.x + (Math.random() - 0.5) * area.length;
                    const z = area.position.z + (Math.random() - 0.5) * area.width;
                    this.buildingGenerator.generateBuilding(x, z, 'commercial');
                }
            });

            // Generate tech parks
            CITY_CONFIG.techParks.forEach(park => {
                for (let i = 0; i < park.buildings; i++) {
                    const x = park.position.x + (Math.random() - 0.5) * park.scale.x;
                    const z = park.position.z + (Math.random() - 0.5) * park.scale.z;
                    this.buildingGenerator.generateBuilding(x, z, 'tech');
                }
            });

            // Generate residential areas
            const gridSize = CITY_CONFIG.gridSize;
            const blockSize = CITY_CONFIG.blockSize;
            for (let x = -gridSize/2; x < gridSize/2; x++) {
                for (let z = -gridSize/2; z < gridSize/2; z++) {
                    if (Math.random() < CITY_CONFIG.buildingDensity) {
                        const posX = x * blockSize;
                        const posZ = z * blockSize;
                        this.buildingGenerator.generateBuilding(posX, posZ, 'residential');
                    }
                }
            }

            // Generate roads
            if (CITY_CONFIG.roads && CITY_CONFIG.roads.main) {
                CITY_CONFIG.roads.main.forEach(road => {
                    const start = new THREE.Vector3(road.start.x, 0, road.start.z);
                    const end = new THREE.Vector3(road.end.x, 0, road.end.z);
                    this.roadNetwork.generateRoad(start, end, road.width);
                });
            }
        } catch (error) {
            console.error('Error generating city:', error);
            throw error;
        }
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.materialManager.onWindowResize();
    }
    
    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.materialManager.update();
        this.render();
    }
} 