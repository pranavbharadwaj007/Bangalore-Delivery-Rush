import * as THREE from 'three';
import { ModelLoader } from './ModelLoader.js';

export class RoadNetwork {
    constructor(scene) {
        this.scene = scene;
        this.roads = new THREE.Group();
        this.vehicles = new THREE.Group();
        this.scene.add(this.roads);
        this.scene.add(this.vehicles);
        this.modelLoader = new ModelLoader();
        this.roadTexture = this.loadRoadTexture();
    }

    loadRoadTexture() {
        // Create procedural textures instead of loading from URLs
        const size = 512;
        
        // Create diffuse/base texture
        const baseTextureCanvas = document.createElement('canvas');
        baseTextureCanvas.width = size;
        baseTextureCanvas.height = size;
        const baseCtx = baseTextureCanvas.getContext('2d');
        baseCtx.fillStyle = '#333333';
        baseCtx.fillRect(0, 0, size, size);
        
        // Add some noise for asphalt texture
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = Math.random() * 2 + 0.5;
            const color = Math.random() * 40;
            baseCtx.fillStyle = `rgb(${color+40},${color+40},${color+40})`;
            baseCtx.beginPath();
            baseCtx.arc(x, y, radius, 0, Math.PI * 2);
            baseCtx.fill();
        }
        
        // Create normal map
        const normalMapCanvas = document.createElement('canvas');
        normalMapCanvas.width = size;
        normalMapCanvas.height = size;
        const normalCtx = normalMapCanvas.getContext('2d');
        normalCtx.fillStyle = '#8080ff'; // Default normal color (pointing up)
        normalCtx.fillRect(0, 0, size, size);
        
        for (let i = 0; i < 2000; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = Math.random() * 3 + 1;
            const r = Math.floor(Math.random() * 40) + 90;
            const g = Math.floor(Math.random() * 40) + 90;
            normalCtx.fillStyle = `rgb(${r},${g},255)`;
            normalCtx.beginPath();
            normalCtx.arc(x, y, radius, 0, Math.PI * 2);
            normalCtx.fill();
        }
        
        // Create roughness map
        const roughnessMapCanvas = document.createElement('canvas');
        roughnessMapCanvas.width = size;
        roughnessMapCanvas.height = size;
        const roughnessCtx = roughnessMapCanvas.getContext('2d');
        roughnessCtx.fillStyle = '#777777';
        roughnessCtx.fillRect(0, 0, size, size);
        
        for (let i = 0; i < 3000; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = Math.random() * 4 + 1;
            const bright = Math.random() * 60 + 80;
            roughnessCtx.fillStyle = `rgb(${bright},${bright},${bright})`;
            roughnessCtx.beginPath();
            roughnessCtx.arc(x, y, radius, 0, Math.PI * 2);
            roughnessCtx.fill();
        }
        
        // Create Three.js textures from canvases
        const baseTexture = new THREE.CanvasTexture(baseTextureCanvas);
        const normalMap = new THREE.CanvasTexture(normalMapCanvas);
        const roughnessMap = new THREE.CanvasTexture(roughnessMapCanvas);
        
        // Configure texture properties
        [baseTexture, normalMap, roughnessMap].forEach(texture => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 10);
        });
        
        return new THREE.MeshStandardMaterial({
            map: baseTexture,
            normalMap: normalMap,
            roughnessMap: roughnessMap,
            roughness: 0.8,
            metalness: 0.2
        });
    }

    async generateRoad(start, end, width = 10) {
        // Calculate road properties
        const length = start.distanceTo(end);
        const direction = end.clone().sub(start).normalize();
        const angle = Math.atan2(direction.x, direction.z);

        // Create main road surface
        const roadGeometry = new THREE.PlaneGeometry(width, length);
        const road = new THREE.Mesh(roadGeometry, this.roadTexture);

        // Position and rotate road
        road.position.set(
            (start.x + end.x) / 2,
            0.1,
            (start.z + end.z) / 2
        );
        road.rotation.x = -Math.PI / 2;
        road.rotation.y = angle;
        road.receiveShadow = true;

        // Add road markings
        this.addRoadMarkings(road, length, width);

        // Add sidewalks
        this.addSidewalks(road, length, width);

        // Add street lights
        await this.addStreetLights(road, length, width);

        // Add traffic lights at intersections
        if (Math.random() < 0.3) { // 30% chance of traffic light at each road segment
            await this.addTrafficLights(road, width);
        }

        this.roads.add(road);
        return road;
    }

    addRoadMarkings(road, length, width) {
        // Center line (double yellow)
        const centerLineGeometry = new THREE.PlaneGeometry(0.3, length);
        const centerLineMaterial = new THREE.MeshBasicMaterial({
            color: 0xffeb3b,
            side: THREE.DoubleSide
        });

        const leftLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
        leftLine.position.set(-0.2, 0.05, 0);
        road.add(leftLine);

        const rightLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
        rightLine.position.set(0.2, 0.05, 0);
        road.add(rightLine);

        // Side lines (white dashed)
        const dashCount = Math.floor(length / 4);
        const dashLength = 2;
        const dashGap = (length - (dashCount * dashLength)) / (dashCount - 1);
        const dashGeometry = new THREE.PlaneGeometry(0.15, dashLength);
        const dashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide
        });

        for (let i = 0; i < dashCount; i++) {
            const leftDash = new THREE.Mesh(dashGeometry, dashMaterial);
            leftDash.position.set(-width/2 + 0.5, 0.05, -length/2 + i * (dashLength + dashGap) + dashLength/2);
            road.add(leftDash);

            const rightDash = new THREE.Mesh(dashGeometry, dashMaterial);
            rightDash.position.set(width/2 - 0.5, 0.05, -length/2 + i * (dashLength + dashGap) + dashLength/2);
            road.add(rightDash);
        }
    }

    addSidewalks(road, length, width) {
        const sidewalkGeometry = new THREE.BoxGeometry(2, 0.3, length);
        const sidewalkMaterial = new THREE.MeshStandardMaterial({
            color: 0x999999,
            roughness: 0.8,
            metalness: 0.2
        });

        const leftSidewalk = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
        leftSidewalk.position.set(-width/2 - 1, -0.15, 0);
        leftSidewalk.receiveShadow = true;
        leftSidewalk.castShadow = true;
        road.add(leftSidewalk);

        const rightSidewalk = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
        rightSidewalk.position.set(width/2 + 1, -0.15, 0);
        rightSidewalk.receiveShadow = true;
        rightSidewalk.castShadow = true;
        road.add(rightSidewalk);
    }

    async addStreetLights(road, length, width) {
        const lightCount = Math.floor(length / 30); // One light every 30 units
        const lightSpacing = length / lightCount;

        for (let i = 0; i < lightCount; i++) {
            // Left side light
            const leftLight = await this.createStreetLight();
            leftLight.position.set(-width/2 - 2, 0, -length/2 + i * lightSpacing);
            road.add(leftLight);

            // Right side light
            const rightLight = await this.createStreetLight();
            rightLight.position.set(width/2 + 2, 0, -length/2 + i * lightSpacing);
            rightLight.rotation.y = Math.PI;
            road.add(rightLight);
        }
    }

    async createStreetLight() {
        try {
            const lightPole = await this.modelLoader.loadModel(ModelLoader.MODELS.TRAFFIC_LIGHT);
            lightPole.scale.set(0.5, 0.5, 0.5);
            
            // Add actual light source
            const light = new THREE.PointLight(0xffffcc, 0.5, 20);
            light.position.set(0, 5, 0);
            lightPole.add(light);

            return lightPole;
        } catch (error) {
            console.error('Error creating street light:', error);
            return new THREE.Group(); // Return empty group if model loading fails
        }
    }

    async addTrafficLights(road, width) {
        try {
            const trafficLight = await this.modelLoader.loadModel(ModelLoader.MODELS.TRAFFIC_LIGHT);
            trafficLight.scale.set(0.8, 0.8, 0.8);
            trafficLight.position.set(-width/2 - 2, 0, -2);
            road.add(trafficLight);

            const trafficLight2 = trafficLight.clone();
            trafficLight2.position.set(width/2 + 2, 0, 2);
            trafficLight2.rotation.y = Math.PI;
            road.add(trafficLight2);
        } catch (error) {
            console.error('Error adding traffic lights:', error);
        }
    }

    async generateVehicle() {
        try {
            const vehicleTypes = [
                ModelLoader.MODELS.CAR,
                ModelLoader.MODELS.TRUCK,
                ModelLoader.MODELS.MOTORCYCLE
            ];
            const randomType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
            const vehicle = await this.modelLoader.loadModel(randomType);
            
            // Adjust scale based on vehicle type
            if (randomType === ModelLoader.MODELS.TRUCK) {
                vehicle.scale.set(0.8, 0.8, 0.8);
            } else if (randomType === ModelLoader.MODELS.MOTORCYCLE) {
                vehicle.scale.set(0.5, 0.5, 0.5);
            } else {
                vehicle.scale.set(0.6, 0.6, 0.6);
            }

            vehicle.castShadow = true;
            vehicle.receiveShadow = true;
            this.vehicles.add(vehicle);
            return vehicle;
        } catch (error) {
            console.error('Error generating vehicle:', error);
            // Fallback to simple box if model loading fails
            const geometry = new THREE.BoxGeometry(2, 1.5, 4);
            const material = new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff });
            const vehicle = new THREE.Mesh(geometry, material);
            vehicle.castShadow = true;
            this.vehicles.add(vehicle);
            return vehicle;
        }
    }

    clear() {
        while (this.roads.children.length) {
            this.roads.remove(this.roads.children[0]);
        }
        while (this.vehicles.children.length) {
            this.vehicles.remove(this.vehicles.children[0]);
        }
    }
} 