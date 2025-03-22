import * as THREE from 'three';
import { CITY_CONFIG } from '../config/cityConfig.js';

export class BuildingGenerator {
    constructor(scene) {
        this.scene = scene;
        this.buildings = new THREE.Group();
        this.buildingMaterials = this.createBuildingMaterials();
        this.scene.add(this.buildings);
        this.textureLoader = new THREE.TextureLoader();
    }

    createBuildingMaterials() {
        // Create base materials
        const materials = {
            residential: new THREE.MeshPhysicalMaterial({
                color: CITY_CONFIG.colors.buildings.residential,
                roughness: 0.7,
                metalness: 0.1
            }),
            commercial: new THREE.MeshPhysicalMaterial({
                color: CITY_CONFIG.colors.buildings.commercial,
                roughness: 0.2,
                metalness: 0.8,
                envMapIntensity: 1.0
            }),
            tech: new THREE.MeshPhysicalMaterial({
                color: CITY_CONFIG.colors.buildings.tech,
                roughness: 0.1,
                metalness: 0.9,
                envMapIntensity: 1.2
            }),
            landmark: new THREE.MeshPhysicalMaterial({
                color: CITY_CONFIG.colors.buildings.landmark,
                roughness: 0.5,
                metalness: 0.3
            }),
            traditional: new THREE.MeshPhysicalMaterial({
                color: CITY_CONFIG.colors.buildings.traditional,
                roughness: 0.9,
                metalness: 0.1
            })
        };

        // Add textures
        this.addBuildingTextures(materials);

        return materials;
    }

    addBuildingTextures(materials) {
        // Create window patterns
        materials.residential.map = this.createWindowTexture(4, 6, 0.7);
        materials.commercial.map = this.createWindowTexture(6, 8, 0.9);
        materials.tech.map = this.createGlassFacadeTexture();
        materials.traditional.map = this.createTraditionalTexture();
        
        // Add normal maps for surface detail
        Object.values(materials).forEach(material => {
            material.normalMap = this.createNormalMap();
            material.normalScale.set(0.5, 0.5);
        });
    }

    createWindowTexture(cols, rows, lightProbability) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Base color
        ctx.fillStyle = '#444444';
        ctx.fillRect(0, 0, 512, 512);

        // Draw windows
        const windowWidth = 512 / cols;
        const windowHeight = 512 / rows;
        const padding = 4;

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                if (Math.random() < lightProbability) {
                    // Window frame
                    ctx.fillStyle = '#666666';
                    ctx.fillRect(
                        i * windowWidth + padding,
                        j * windowHeight + padding,
                        windowWidth - padding * 2,
                        windowHeight - padding * 2
                    );
                    
                    // Window light
                    const gradient = ctx.createLinearGradient(
                        i * windowWidth + padding,
                        j * windowHeight + padding,
                        (i + 1) * windowWidth - padding,
                        (j + 1) * windowHeight - padding
                    );
                    gradient.addColorStop(0, '#ffd700');
                    gradient.addColorStop(1, '#ff8c00');
                    
                    ctx.fillStyle = gradient;
                    ctx.fillRect(
                        i * windowWidth + padding * 2,
                        j * windowHeight + padding * 2,
                        windowWidth - padding * 4,
                        windowHeight - padding * 4
                    );
                }
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    createGlassFacadeTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Create glass panel pattern
        ctx.fillStyle = '#a5d6ff';
        ctx.fillRect(0, 0, 512, 512);

        // Add reflective highlights
        for (let i = 0; i < 512; i += 32) {
            for (let j = 0; j < 512; j += 32) {
                const gradient = ctx.createLinearGradient(i, j, i + 32, j + 32);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
                gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(i, j, 32, 32);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    createTraditionalTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Base color
        ctx.fillStyle = '#ffe0b2';
        ctx.fillRect(0, 0, 512, 512);

        // Add traditional patterns
        for (let i = 0; i < 512; i += 64) {
            for (let j = 0; j < 512; j += 64) {
                // Draw kolam-inspired patterns
                ctx.strokeStyle = '#8d6e63';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(i + 32, j + 32, 24, 0, Math.PI * 2);
                ctx.stroke();
                
                // Add dots
                for (let k = 0; k < 8; k++) {
                    const angle = (k / 8) * Math.PI * 2;
                    const x = i + 32 + Math.cos(angle) * 16;
                    const y = j + 32 + Math.sin(angle) * 16;
                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    createNormalMap() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Create normal map pattern
        ctx.fillStyle = '#8080ff';
        ctx.fillRect(0, 0, 512, 512);

        // Add surface variations
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const size = Math.random() * 4 + 2;
            const intensity = Math.random() * 40 + 100;
            
            ctx.fillStyle = `rgb(${intensity},${intensity},255)`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    generateBuilding(x, z, type = 'residential', config = null) {
        let building;

        try {
            if (config && config.architecture) {
                // Generate landmark building with specific architecture
                building = this.generateLandmarkBuilding(config);
            } else {
                // Generate standard building
                const height = this.getBuildingHeight(type);
                const width = this.getBuildingWidth(type);
                const depth = this.getBuildingDepth(type);

                const geometry = new THREE.BoxGeometry(width, height, depth);
                const material = this.buildingMaterials[type];
                building = new THREE.Mesh(geometry, material);

                // Add architectural details based on type
                this.addBuildingDetails(building, type);
            }

            // Position the building
            const yPosition = (building.geometry instanceof THREE.BoxGeometry) ? 
                            building.geometry.parameters.height / 2 : 
                            config ? config.scale.y / 2 : 0;
            
            building.position.set(x, yPosition, z);
            building.castShadow = true;
            building.receiveShadow = true;

            if (config) {
                building.userData = config;
            }

            this.buildings.add(building);
            return building;
        } catch (error) {
            console.error('Error generating building:', error);
            throw error;
        }
    }

    generateLandmarkBuilding(config) {
        const group = new THREE.Group();

        switch (config.architecture.style) {
            case 'neo-dravidian':
                this.generateVidhanaShoudha(group, config);
                break;
            case 'tudor':
                this.generateBangalorePalace(group, config);
                break;
            case 'modern':
                this.generateModernBuilding(group, config);
                break;
            default:
                this.generateStandardBuilding(group, config);
        }

        return group;
    }

    generateVidhanaShoudha(group, config) {
        // Main building
        const mainGeometry = new THREE.BoxGeometry(
            config.scale.x,
            config.scale.y,
            config.scale.z
        );
        const mainBuilding = new THREE.Mesh(mainGeometry, this.buildingMaterials.landmark);
        group.add(mainBuilding);

        // Add columns
        const columnCount = 12;
        const columnSpacing = config.scale.x / (columnCount + 1);
        const columnHeight = config.scale.y * 0.8;
        const columnRadius = config.scale.x * 0.02;

        for (let i = 0; i < columnCount; i++) {
            const column = this.createColumn(columnHeight, columnRadius);
            column.position.set(
                -config.scale.x/2 + (i + 1) * columnSpacing,
                0,
                config.scale.z/2 + columnRadius
            );
            group.add(column);
        }

        // Add central dome
        const domeRadius = config.scale.x * 0.15;
        const dome = this.createDome(domeRadius);
        dome.position.set(0, config.scale.y/2 + domeRadius * 0.5, 0);
        group.add(dome);

        // Add smaller domes
        const smallDomeRadius = domeRadius * 0.6;
        [-1, 1].forEach(x => {
            const smallDome = this.createDome(smallDomeRadius);
            smallDome.position.set(
                x * (config.scale.x/3),
                config.scale.y/2 + smallDomeRadius * 0.5,
                0
            );
            group.add(smallDome);
        });

        // Add steps
        const steps = this.createSteps(config.scale.x * 1.2, config.scale.z * 0.2, 10);
        steps.position.set(0, -config.scale.y/2, config.scale.z/2 + config.scale.z * 0.1);
        group.add(steps);

        return group;
    }

    generateBangalorePalace(group, config) {
        // Main building
        const mainGeometry = new THREE.BoxGeometry(
            config.scale.x,
            config.scale.y,
            config.scale.z
        );
        const mainBuilding = new THREE.Mesh(mainGeometry, this.buildingMaterials.traditional);
        group.add(mainBuilding);

        // Add towers
        const towerPositions = [
            { x: -config.scale.x/2, z: -config.scale.z/2 },
            { x: config.scale.x/2, z: -config.scale.z/2 },
            { x: -config.scale.x/2, z: config.scale.z/2 },
            { x: config.scale.x/2, z: config.scale.z/2 }
        ];

        towerPositions.forEach(pos => {
            const tower = this.createTower(
                config.scale.y * 1.2,
                config.scale.x * 0.15
            );
            tower.position.set(pos.x, 0, pos.z);
            group.add(tower);
        });

        // Add decorative elements
        this.addTudorDetails(group, config);

        return group;
    }

    generateModernBuilding(group, config) {
        // Create glass facade building
        const mainGeometry = new THREE.BoxGeometry(
            config.scale.x,
            config.scale.y,
            config.scale.z
        );
        const mainBuilding = new THREE.Mesh(mainGeometry, this.buildingMaterials.tech);
        group.add(mainBuilding);

        // Add setbacks for modern look
        const setbackLevels = 3;
        for (let i = 1; i <= setbackLevels; i++) {
            const setbackGeometry = new THREE.BoxGeometry(
                config.scale.x * (1 - i * 0.2),
                config.scale.y * 0.2,
                config.scale.z * (1 - i * 0.2)
            );
            const setback = new THREE.Mesh(setbackGeometry, this.buildingMaterials.tech);
            setback.position.y = config.scale.y/2 + i * config.scale.y * 0.1;
            group.add(setback);
        }

        // Add spire
        const spireHeight = config.scale.y * 0.3;
        const spireGeometry = new THREE.CylinderGeometry(2, 0.5, spireHeight, 8);
        const spireMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
        const spire = new THREE.Mesh(spireGeometry, spireMaterial);
        spire.position.y = config.scale.y/2 + setbackLevels * config.scale.y * 0.1 + spireHeight/2;
        group.add(spire);

        return group;
    }

    createColumn(height, radius) {
        const geometry = new THREE.CylinderGeometry(radius, radius * 1.2, height, 16);
        const material = new THREE.MeshPhongMaterial({ color: 0xdddddd });
        return new THREE.Mesh(geometry, material);
    }

    createDome(radius) {
        const geometry = new THREE.SphereGeometry(radius, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const material = new THREE.MeshPhongMaterial({
            color: 0xffd700,
            metalness: 0.8,
            roughness: 0.2
        });
        return new THREE.Mesh(geometry, material);
    }

    createSteps(width, depth, steps) {
        const group = new THREE.Group();
        const stepHeight = 0.2;
        const stepDepth = depth / steps;

        for (let i = 0; i < steps; i++) {
            const geometry = new THREE.BoxGeometry(
                width - i * (width/steps),
                stepHeight,
                stepDepth
            );
            const material = new THREE.MeshPhongMaterial({ color: 0xdddddd });
            const step = new THREE.Mesh(geometry, material);
            step.position.y = i * stepHeight;
            step.position.z = i * stepDepth;
            group.add(step);
        }

        return group;
    }

    createTower(height, radius) {
        const group = new THREE.Group();

        // Tower base
        const baseGeometry = new THREE.CylinderGeometry(radius, radius * 1.2, height, 8);
        const baseMaterial = new THREE.MeshPhongMaterial({ color: 0xd2b48c });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        group.add(base);

        // Tower roof
        const roofGeometry = new THREE.ConeGeometry(radius, height * 0.3, 8);
        const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = height/2;
        group.add(roof);

        return group;
    }

    addTudorDetails(group, config) {
        // Add timber frames
        const frameWidth = 0.5;
        const frameSpacing = 5;

        for (let x = -config.scale.x/2; x < config.scale.x/2; x += frameSpacing) {
            const frameGeometry = new THREE.BoxGeometry(frameWidth, config.scale.y, frameWidth);
            const frameMaterial = new THREE.MeshPhongMaterial({ color: 0x4a3728 });
            const frame = new THREE.Mesh(frameGeometry, frameMaterial);
            frame.position.set(x, 0, config.scale.z/2);
            group.add(frame);
        }

        // Add horizontal frames
        for (let y = -config.scale.y/4; y < config.scale.y/2; y += config.scale.y/4) {
            const frameGeometry = new THREE.BoxGeometry(config.scale.x, frameWidth, frameWidth);
            const frameMaterial = new THREE.MeshPhongMaterial({ color: 0x4a3728 });
            const frame = new THREE.Mesh(frameGeometry, frameMaterial);
            frame.position.set(0, y, config.scale.z/2);
            group.add(frame);
        }
    }

    getBuildingHeight(type) {
        switch (type) {
            case 'residential':
                return 10 + Math.random() * 20;
            case 'commercial':
                return 30 + Math.random() * 50;
            case 'tech':
                return 40 + Math.random() * 60;
            default:
                return 20 + Math.random() * 30;
        }
    }

    getBuildingWidth(type) {
        switch (type) {
            case 'residential':
                return 10 + Math.random() * 5;
            case 'commercial':
                return 20 + Math.random() * 10;
            case 'tech':
                return 25 + Math.random() * 15;
            default:
                return 15 + Math.random() * 10;
        }
    }

    getBuildingDepth(type) {
        return this.getBuildingWidth(type);
    }

    addBuildingDetails(building, type) {
        if (type === 'tech') {
            this.addAntennas(building);
            this.addGlassTexture(building);
        } else if (type === 'landmark') {
            this.addLandmarkFeatures(building);
        } else if (type === 'commercial') {
            this.addStorefront(building);
        }
    }

    addAntennas(building) {
        const antennaGeometry = new THREE.CylinderGeometry(0.1, 0.1, 5, 8);
        const antennaMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });

        for (let i = 0; i < 2; i++) {
            const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
            antenna.position.y = building.geometry.parameters.height / 2 + 2.5;
            antenna.position.x = (i === 0 ? 1 : -1) * 2;
            building.add(antenna);
        }
    }

    addGlassTexture(building) {
        const glassGeometry = new THREE.PlaneGeometry(
            building.geometry.parameters.width * 0.8,
            building.geometry.parameters.height * 0.8
        );
        const glassMaterial = new THREE.MeshPhongMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });

        // Add glass panels to each side
        const sides = [
            { rotation: [0, 0, 0], position: [0, 0, building.geometry.parameters.depth/2 + 0.1] },
            { rotation: [0, Math.PI, 0], position: [0, 0, -building.geometry.parameters.depth/2 - 0.1] },
            { rotation: [0, Math.PI/2, 0], position: [building.geometry.parameters.width/2 + 0.1, 0, 0] },
            { rotation: [0, -Math.PI/2, 0], position: [-building.geometry.parameters.width/2 - 0.1, 0, 0] }
        ];

        sides.forEach(side => {
            const glass = new THREE.Mesh(glassGeometry, glassMaterial);
            glass.rotation.set(...side.rotation);
            glass.position.set(...side.position);
            building.add(glass);
        });
    }

    addLandmarkFeatures(building) {
        // Add a dome on top
        const domeGeometry = new THREE.SphereGeometry(
            building.geometry.parameters.width * 0.3,
            16,
            16,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2
        );
        const domeMaterial = new THREE.MeshPhongMaterial({
            color: 0xdddddd,
            flatShading: true
        });
        const dome = new THREE.Mesh(domeGeometry, domeMaterial);
        dome.position.y = building.geometry.parameters.height / 2;
        building.add(dome);

        // Add columns
        const columnGeometry = new THREE.CylinderGeometry(0.5, 0.5, building.geometry.parameters.height, 8);
        const columnMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });

        for (let i = 0; i < 4; i++) {
            const column = new THREE.Mesh(columnGeometry, columnMaterial);
            const angle = (i / 4) * Math.PI * 2;
            const radius = building.geometry.parameters.width * 0.4;
            column.position.x = Math.cos(angle) * radius;
            column.position.z = Math.sin(angle) * radius;
            building.add(column);
        }
    }

    addStorefront(building) {
        const storefrontGeometry = new THREE.PlaneGeometry(
            building.geometry.parameters.width * 0.8,
            3
        );
        const storefrontMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            side: THREE.DoubleSide
        });

        // Add storefront to each side
        const sides = [
            { rotation: [0, 0, 0], position: [0, -building.geometry.parameters.height/2 + 1.5, building.geometry.parameters.depth/2 + 0.1] },
            { rotation: [0, Math.PI, 0], position: [0, -building.geometry.parameters.height/2 + 1.5, -building.geometry.parameters.depth/2 - 0.1] },
            { rotation: [0, Math.PI/2, 0], position: [building.geometry.parameters.width/2 + 0.1, -building.geometry.parameters.height/2 + 1.5, 0] },
            { rotation: [0, -Math.PI/2, 0], position: [-building.geometry.parameters.width/2 - 0.1, -building.geometry.parameters.height/2 + 1.5, 0] }
        ];

        sides.forEach(side => {
            const storefront = new THREE.Mesh(storefrontGeometry, storefrontMaterial);
            storefront.rotation.set(...side.rotation);
            storefront.position.set(...side.position);
            building.add(storefront);
        });
    }

    clear() {
        while(this.buildings.children.length > 0) {
            const building = this.buildings.children[0];
            this.buildings.remove(building);
        }
    }

    generateBuildings() {
        this.buildings = new THREE.Group();
        
        const gridSize = 400; // Match the road grid size
        const blockSize = 80; // Match the road block size
        const buildingMargin = 20; // Distance from road
        
        // Create buildings along the grid
        for (let x = -gridSize/2 + blockSize/2; x <= gridSize/2 - blockSize/2; x += blockSize) {
            for (let z = -gridSize/2 + blockSize/2; z <= gridSize/2 - blockSize/2; z += blockSize) {
                // Add random variation to position within the block
                const offsetX = (Math.random() - 0.5) * (blockSize - buildingMargin * 2);
                const offsetZ = (Math.random() - 0.5) * (blockSize - buildingMargin * 2);
                
                // Create building
                const building = this.createBuilding();
                building.position.set(
                    x + offsetX,
                    0,
                    z + offsetZ
                );
                
                // Random rotation in 90-degree increments
                building.rotation.y = Math.PI * 0.5 * Math.floor(Math.random() * 4);
                
                this.buildings.add(building);
            }
        }
        
        this.scene.add(this.buildings);
    }

    createBuilding() {
        // Random building dimensions
        const width = 10 + Math.random() * 10;
        const height = 20 + Math.random() * 30;
        const depth = 10 + Math.random() * 10;
        
        const building = new THREE.Group();
        
        // Main building body
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: this.getRandomBuildingColor(),
            roughness: 0.7,
            metalness: 0.2
        });
        
        const mainBody = new THREE.Mesh(geometry, material);
        mainBody.position.y = height / 2;
        mainBody.castShadow = true;
        mainBody.receiveShadow = true;
        building.add(mainBody);
        
        // Add windows
        this.addWindows(mainBody, width, height, depth);
        
        // Add random details
        if (Math.random() > 0.5) {
            this.addRoof(building, width, height, depth);
        }
        
        // Add entrance
        this.addEntrance(building, width, depth);
        
        return building;
    }

    addWindows(building, width, height, depth) {
        const windowSize = 1;
        const windowSpacing = 2;
        const windowGeometry = new THREE.BoxGeometry(windowSize, windowSize, 0.1);
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            emissive: 0x88ccff,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.9
        });

        // Add windows to front and back
        for (let y = 2; y < height - 2; y += windowSpacing) {
            for (let x = -width/2 + 2; x < width/2 - 2; x += windowSpacing) {
                const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
                windowMesh.position.set(x, y, depth/2 + 0.1);
                building.add(windowMesh);
                
                const windowMeshBack = windowMesh.clone();
                windowMeshBack.position.z = -depth/2 - 0.1;
                building.add(windowMeshBack);
            }
        }

        // Add windows to sides
        const sideWindowGeometry = new THREE.BoxGeometry(0.1, windowSize, windowSize);
        for (let y = 2; y < height - 2; y += windowSpacing) {
            for (let z = -depth/2 + 2; z < depth/2 - 2; z += windowSpacing) {
                const windowMesh = new THREE.Mesh(sideWindowGeometry, windowMaterial);
                windowMesh.position.set(width/2 + 0.1, y, z);
                building.add(windowMesh);
                
                const windowMeshLeft = windowMesh.clone();
                windowMeshLeft.position.x = -width/2 - 0.1;
                building.add(windowMeshLeft);
            }
        }
    }

    addRoof(building, width, height, depth) {
        const roofGeometry = new THREE.ConeGeometry(Math.max(width, depth) / 2, height * 0.2, 4);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8
        });
        
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = height + height * 0.1;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        building.add(roof);
    }

    addEntrance(building, width, depth) {
        const doorWidth = 2;
        const doorHeight = 3;
        const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, 0.1);
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.5,
            metalness: 0.5
        });
        
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, doorHeight/2, depth/2 + 0.1);
        building.add(door);
    }

    getRandomBuildingColor() {
        const colors = [
            0xcccccc, // Light gray
            0xd3d3d3, // Lighter gray
            0xe8e8e8, // Almost white
            0xdcdcdc, // Gainsboro
            0xf5f5f5  // White smoke
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
} 