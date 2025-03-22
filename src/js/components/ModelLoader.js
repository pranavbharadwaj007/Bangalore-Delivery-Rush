import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

export class ModelLoader {
    constructor() {
        this.loader = new GLTFLoader();
        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        this.loader.setDRACOLoader(this.dracoLoader);
        this.cache = new Map();
    }

    async loadModel(url) {
        if (this.cache.has(url)) {
            return this.cache.get(url).clone();
        }

        try {
            const gltf = await this.loader.loadAsync(url);
            this.cache.set(url, gltf.scene);
            return gltf.scene.clone();
        } catch (error) {
            console.error(`Error loading model from ${url}:`, error);
            throw error;
        }
    }

    // Pre-defined models - Using a placeholder method for now since external URLs are failing
    static MODELS = {
        // Use simple geometries instead of failing external models
        MOTORCYCLE: 'motorcycle',
        MODERN_BUILDING: 'building',
        ROAD: 'road',
        CAR: 'car',
        TRUCK: 'truck',
        TREE: 'tree',
        TRAFFIC_LIGHT: 'traffic_light'
    };

    // Override loadModel to handle our special model names
    async loadModel(modelNameOrUrl) {
        // If it's a URL, use the original method logic
        if (modelNameOrUrl.startsWith('http')) {
            // Original logic for URLs
            if (this.cache.has(modelNameOrUrl)) {
                return this.cache.get(modelNameOrUrl).clone();
            }

            try {
                const gltf = await this.loader.loadAsync(modelNameOrUrl);
                this.cache.set(modelNameOrUrl, gltf.scene);
                return gltf.scene.clone();
            } catch (error) {
                console.error(`Error loading model from ${modelNameOrUrl}:`, error);
                throw error;
            }
        }
        
        // Otherwise, create a placeholder model based on the name
        return this.createPlaceholderModel(modelNameOrUrl);
    }

    createPlaceholderModel(modelName) {
        const group = new THREE.Group();
        
        switch(modelName) {
            case 'motorcycle':
                // Create a simple motorcycle shape
                const body = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 0.8, 2.5),
                    new THREE.MeshStandardMaterial({ color: 0xe74c3c, metalness: 0.7, roughness: 0.5 })
                );
                body.position.y = 0.6;
                group.add(body);
                
                // Wheels
                const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
                wheelGeometry.rotateZ(Math.PI / 2);
                const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
                
                const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
                frontWheel.position.set(0, 0, 1.2);
                group.add(frontWheel);
                
                const backWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
                backWheel.position.set(0, 0, -1);
                group.add(backWheel);
                
                break;
                
            case 'car':
                // Create a simple car shape
                const carBody = new THREE.Mesh(
                    new THREE.BoxGeometry(2, 1, 4),
                    new THREE.MeshStandardMaterial({ color: 0x3498db, metalness: 0.5, roughness: 0.5 })
                );
                carBody.position.y = 0.5;
                group.add(carBody);
                
                // Cabin
                const cabin = new THREE.Mesh(
                    new THREE.BoxGeometry(1.8, 0.8, 1.5),
                    new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.8, roughness: 0.2 })
                );
                cabin.position.set(0, 1.4, 0.2);
                group.add(cabin);
                
                break;
                
            case 'truck':
                // Create a simple truck shape
                const truckCabin = new THREE.Mesh(
                    new THREE.BoxGeometry(2.2, 1.5, 2),
                    new THREE.MeshStandardMaterial({ color: 0xe74c3c, metalness: 0.5, roughness: 0.5 })
                );
                truckCabin.position.set(0, 0.75, -1.5);
                group.add(truckCabin);
                
                const trailer = new THREE.Mesh(
                    new THREE.BoxGeometry(2, 2, 4),
                    new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.3, roughness: 0.7 })
                );
                trailer.position.set(0, 1, 1.5);
                group.add(trailer);
                
                break;
                
            case 'traffic_light':
                // Create a simple traffic light pole
                const pole = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.1, 0.1, 6, 8),
                    new THREE.MeshStandardMaterial({ color: 0x888888 })
                );
                pole.position.y = 3;
                group.add(pole);
                
                // Traffic light housing
                const housing = new THREE.Mesh(
                    new THREE.BoxGeometry(0.6, 1.5, 0.6),
                    new THREE.MeshStandardMaterial({ color: 0x333333 })
                );
                housing.position.set(0, 5.5, 0);
                group.add(housing);
                
                // Lights
                const redLight = new THREE.Mesh(
                    new THREE.CircleGeometry(0.2, 16),
                    new THREE.MeshBasicMaterial({ color: 0xff0000 })
                );
                redLight.position.set(0.31, 6, 0);
                redLight.rotation.y = -Math.PI / 2;
                group.add(redLight);
                
                const yellowLight = new THREE.Mesh(
                    new THREE.CircleGeometry(0.2, 16),
                    new THREE.MeshBasicMaterial({ color: 0xffff00 })
                );
                yellowLight.position.set(0.31, 5.5, 0);
                yellowLight.rotation.y = -Math.PI / 2;
                group.add(yellowLight);
                
                const greenLight = new THREE.Mesh(
                    new THREE.CircleGeometry(0.2, 16),
                    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
                );
                greenLight.position.set(0.31, 5, 0);
                greenLight.rotation.y = -Math.PI / 2;
                group.add(greenLight);
                
                break;
                
            default:
                // Default box for any other model type
                const defaultMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 1, 1),
                    new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
                );
                group.add(defaultMesh);
        }
        
        group.castShadow = true;
        group.receiveShadow = true;
        
        // Create a clone to avoid reference issues
        const modelClone = group.clone();
        this.cache.set(modelName, group);
        return modelClone;
    }

    async preloadModels() {
        // No need to preload since we're creating models dynamically
        return Promise.resolve();
    }
} 