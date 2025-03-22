import * as THREE from 'three';
import { TextureLoader } from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';

export class MaterialManager {
    constructor(scene, renderer, camera) {
        this.scene = scene;
        this.renderer = renderer;
        this.camera = camera;
        this.textureLoader = new TextureLoader();
        this.materials = {};
        this.composer = this.setupPostProcessing();
        this.loadTextures();
        this.loadEnvironmentMap();
    }

    setupPostProcessing() {
        const composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        composer.addPass(renderPass);

        // Add bloom effect for neon and lights
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.5,  // bloom strength
            0.4,  // radius
            0.85  // threshold
        );
        composer.addPass(bloomPass);

        // Add SMAA for anti-aliasing
        const smaaPass = new SMAAPass(
            window.innerWidth * this.renderer.getPixelRatio(),
            window.innerHeight * this.renderer.getPixelRatio()
        );
        composer.addPass(smaaPass);

        return composer;
    }

    async loadEnvironmentMap() {
        const rgbeLoader = new RGBELoader();
        const envMap = await rgbeLoader.loadAsync('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/venice_sunset_1k.hdr');
        envMap.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.environment = envMap;
        this.scene.background = envMap;
    }

    loadTextures() {
        // Road textures
        this.materials.road = new THREE.MeshStandardMaterial({
            map: this.textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/terrain/grasslight-big.jpg'),
            normalMap: this.textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/terrain/grasslight-big-nm.jpg'),
            roughnessMap: this.textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/terrain/grasslight-big-ao.jpg'),
            roughness: 0.8,
            metalness: 0.2
        });

        // Building textures
        this.materials.modernBuilding = new THREE.MeshStandardMaterial({
            map: this.textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/brick_diffuse.jpg'),
            normalMap: this.textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/brick_bump.jpg'),
            roughnessMap: this.textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/brick_roughness.jpg'),
            roughness: 0.7,
            metalness: 0.3
        });

        // Glass material for windows
        this.materials.glass = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0.9,
            roughness: 0.1,
            transparency: 0.8,
            transparent: true,
            envMapIntensity: 10,
            clearcoat: 1,
            clearcoatRoughness: 0.1
        });

        // Concrete material
        this.materials.concrete = new THREE.MeshStandardMaterial({
            map: this.textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/concrete.jpg'),
            normalMap: this.textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/concrete_normal.jpg'),
            roughnessMap: this.textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/concrete_roughness.jpg'),
            roughness: 0.9,
            metalness: 0.1
        });

        // Asphalt material for roads
        this.materials.asphalt = new THREE.MeshStandardMaterial({
            map: this.textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/asphalt.jpg'),
            normalMap: this.textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/asphalt_normal.jpg'),
            roughnessMap: this.textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/asphalt_roughness.jpg'),
            roughness: 0.8,
            metalness: 0.1
        });

        // Repeat textures
        Object.values(this.materials).forEach(material => {
            if (material.map) {
                material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
                material.map.repeat.set(2, 2);
            }
            if (material.normalMap) {
                material.normalMap.wrapS = material.normalMap.wrapT = THREE.RepeatWrapping;
                material.normalMap.repeat.set(2, 2);
            }
            if (material.roughnessMap) {
                material.roughnessMap.wrapS = material.roughnessMap.wrapT = THREE.RepeatWrapping;
                material.roughnessMap.repeat.set(2, 2);
            }
        });
    }

    getMaterial(type) {
        return this.materials[type] || this.materials.concrete;
    }

    createGlassMaterial() {
        return new THREE.MeshPhysicalMaterial({
            roughness: 0.1,
            transmission: 0.9,
            thickness: 0.5,
            envMapIntensity: 1.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            metalness: 0.1,
            transparent: true,
            opacity: 0.8
        });
    }

    createModernBuildingMaterial() {
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x88ccee,
            metalness: 0.9,
            roughness: 0.1,
            envMapIntensity: 1.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
        });

        // Add subtle normal mapping for surface detail
        const normalMap = this.textureLoader.load('https://cdn.jsdelivr.net/gh/mrdoob/three.js/examples/textures/water/Water_1_M_Normal.jpg');
        normalMap.wrapS = THREE.RepeatWrapping;
        normalMap.wrapT = THREE.RepeatWrapping;
        material.normalMap = normalMap;
        material.normalScale.set(0.2, 0.2);

        return material;
    }

    createTraditionalBuildingMaterial() {
        const material = new THREE.MeshStandardMaterial({
            color: 0xd2b48c,
            roughness: 0.8,
            metalness: 0.1
        });

        // Add stone texture
        const diffuseMap = this.textureLoader.load('https://cdn.jsdelivr.net/gh/mrdoob/three.js/examples/textures/brick_diffuse.jpg');
        const normalMap = this.textureLoader.load('https://cdn.jsdelivr.net/gh/mrdoob/three.js/examples/textures/brick_normal.jpg');
        
        diffuseMap.wrapS = THREE.RepeatWrapping;
        diffuseMap.wrapT = THREE.RepeatWrapping;
        normalMap.wrapS = THREE.RepeatWrapping;
        normalMap.wrapT = THREE.RepeatWrapping;

        material.map = diffuseMap;
        material.normalMap = normalMap;
        material.normalScale.set(1, 1);

        return material;
    }

    createMarbleMaterial() {
        const material = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0.0,
            roughness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.2
        });

        // Add marble texture
        const diffuseMap = this.textureLoader.load('https://cdn.jsdelivr.net/gh/mrdoob/three.js/examples/textures/marble.jpg');
        diffuseMap.wrapS = THREE.RepeatWrapping;
        diffuseMap.wrapT = THREE.RepeatWrapping;
        material.map = diffuseMap;

        return material;
    }

    createRoadMaterial() {
        const material = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.1
        });

        // Add road texture with lane markings
        const diffuseMap = this.textureLoader.load('https://cdn.jsdelivr.net/gh/mrdoob/three.js/examples/textures/terrain/grasslight-big.jpg');
        const normalMap = this.textureLoader.load('https://cdn.jsdelivr.net/gh/mrdoob/three.js/examples/textures/terrain/grasslight-normal.jpg');
        
        diffuseMap.wrapS = THREE.RepeatWrapping;
        diffuseMap.wrapT = THREE.RepeatWrapping;
        normalMap.wrapS = THREE.RepeatWrapping;
        normalMap.wrapT = THREE.RepeatWrapping;

        material.map = diffuseMap;
        material.normalMap = normalMap;
        material.normalScale.set(0.5, 0.5);

        return material;
    }

    update() {
        // Update post-processing effects
        this.composer.render();
    }

    onWindowResize() {
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }
} 