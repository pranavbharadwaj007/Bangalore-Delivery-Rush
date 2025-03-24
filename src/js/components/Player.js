import * as THREE from 'three';
import { ModelLoader } from './ModelLoader.js';
import * as CANNON from 'cannon-es';

export class Player {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.modelLoader = new ModelLoader();
        this.motorcycle = null;
        this.speed = 0;
        this.maxSpeed = 50;
        this.acceleration = 0.5;
        this.deceleration = 0.3;
        this.turnSpeed = 0.03;
        this.isMoving = false;
        this.isBoosting = false;
        this.boostFactor = 1.5;
        this.boostMeter = 100;
        this.maxBoost = 100;
        this.boostRecoveryRate = 0.2;
        this.boostDepletionRate = 0.5;

        // Initialize position and rotation
        this.position = new THREE.Vector3(0, 1, 0);
        this.rotation = new THREE.Euler(0, 0, 0);

        // Initialize keys state
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            boost: false
        };

        // Physics
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.defaultContactMaterial.friction = 0.5;

        this.setupControls();
        this.createPlayer();
        this.createPhysicsBody();
        this.setupCameraFollow();
    }

    async createPlayer() {
        try {
            // Create motorcycle group
            this.motorcycle = new THREE.Group();
            
            // Motorcycle body (main part)
            const bodyGeometry = new THREE.BoxGeometry(0.8, 0.4, 2);
            const bodyMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xe74c3c,
                roughness: 0.5,
                metalness: 0.7
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 0.5;
            body.castShadow = true;
            this.motorcycle.add(body);
            
            // Front fork
            const forkGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8);
            const forkMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xaaaaaa, 
                metalness: 0.8, 
                roughness: 0.2 
            });
            const fork = new THREE.Mesh(forkGeometry, forkMaterial);
            fork.position.set(0, 0.5, 0.8);
            fork.rotation.x = Math.PI / 6;
            fork.castShadow = true;
            this.motorcycle.add(fork);
            
            // Handlebars
            const handlebarGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8);
            handlebarGeometry.rotateZ(Math.PI / 2);
            const handlebar = new THREE.Mesh(handlebarGeometry, forkMaterial);
            handlebar.position.set(0, 0.7, 0.7);
            handlebar.castShadow = true;
            this.motorcycle.add(handlebar);
            
            // Seat
            const seatGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.8);
            const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
            const seat = new THREE.Mesh(seatGeometry, seatMaterial);
            seat.position.set(0, 0.7, -0.2);
            seat.castShadow = true;
            this.motorcycle.add(seat);
            
            // Wheels
            const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
            wheelGeometry.rotateZ(Math.PI / 2);
            const wheelMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x111111,
                roughness: 0.7,
                metalness: 0.3
            });
            
            // Front wheel
            const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            frontWheel.position.set(0, 0.3, 0.8);
            frontWheel.castShadow = true;
            frontWheel.userData.isWheel = true;
            this.motorcycle.add(frontWheel);
            
            // Back wheel
            const backWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            backWheel.position.set(0, 0.3, -0.8);
            backWheel.castShadow = true;
            backWheel.userData.isWheel = true;
            this.motorcycle.add(backWheel);
            
            // Add headlight
            const headlight = new THREE.SpotLight(0xffffcc, 2);
            headlight.position.set(0, 0.5, 1);
            headlight.angle = Math.PI / 6;
            headlight.penumbra = 0.2;
            headlight.decay = 2;
            headlight.distance = 30;
            headlight.castShadow = true;
            
            // Create headlight target
            const headlightTarget = new THREE.Object3D();
            headlightTarget.position.set(0, 0, 5);
            this.motorcycle.add(headlightTarget);
            headlight.target = headlightTarget;
            
            this.motorcycle.add(headlight);
            
            // Add exhaust pipes
            const exhaustGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
            const exhaustMaterial = new THREE.MeshStandardMaterial({
                color: 0xcccccc,
                metalness: 0.8,
                roughness: 0.2
            });
            
            [-0.2, 0.2].forEach(x => {
                const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
                exhaust.position.set(x, 0.3, -0.9);
                exhaust.rotation.x = Math.PI / 8;
                exhaust.castShadow = true;
                this.motorcycle.add(exhaust);
            });
            
            // Add to scene
            this.scene.add(this.motorcycle);
            
        } catch (error) {
            console.error('Error creating motorcycle:', error);
        }
    }

    createPhysicsBody() {
        // Create motorcycle physics body
        const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 1));
        this.body = new CANNON.Body({
            mass: 200,
            position: new CANNON.Vec3(0, 1, 0),
            shape: shape,
            material: new CANNON.Material()
        });
        this.world.addBody(this.body);

        // Add wheels
        this.wheels = [];
        const wheelShape = new CANNON.Sphere(0.3);
        const wheelMaterial = new CANNON.Material();

        // Front wheel
        const frontWheel = new CANNON.Body({
            mass: 1,
            material: wheelMaterial,
            shape: wheelShape,
            position: new CANNON.Vec3(0, 0.3, 1)
        });
        this.wheels.push(frontWheel);
        this.world.addBody(frontWheel);

        // Back wheel
        const backWheel = new CANNON.Body({
            mass: 1,
            material: wheelMaterial,
            shape: wheelShape,
            position: new CANNON.Vec3(0, 0.3, -1)
        });
        this.wheels.push(backWheel);
        this.world.addBody(backWheel);

        // Connect wheels to body
        this.wheelConstraints = this.wheels.map(wheel => {
            return new CANNON.HingeConstraint(this.body, wheel, {
                pivotA: new CANNON.Vec3(0, -0.5, wheel.position.z - this.body.position.z),
                axisA: new CANNON.Vec3(1, 0, 0),
                maxForce: 1e6
            });
        });
        this.wheelConstraints.forEach(constraint => this.world.addConstraint(constraint));
    }

    setupControls() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    handleKeyDown(event) {
        switch(event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.keys.forward = true;
                break;
            case 's':
            case 'arrowdown':
                this.keys.backward = true;
                break;
            case 'a':
            case 'arrowleft':
                this.keys.left = true;
                break;
            case 'd':
            case 'arrowright':
                this.keys.right = true;
                break;
            case ' ':
                this.keys.boost = true;
                break;
        }
    }

    handleKeyUp(event) {
        switch(event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.keys.forward = false;
                break;
            case 's':
            case 'arrowdown':
                this.keys.backward = false;
                break;
            case 'a':
            case 'arrowleft':
                this.keys.left = false;
                break;
            case 'd':
            case 'arrowright':
                this.keys.right = false;
                break;
            case ' ':
                this.keys.boost = false;
                break;
        }
    }

    setupCameraFollow() {
        this.cameraOffset = new THREE.Vector3(0, 5, -10);
        this.cameraLookAt = new THREE.Vector3(0, 2, 5);
        this.cameraDampening = 0.1;
    }

    getPosition() {
        // Make sure we return a valid position even if motorcycle isn't loaded yet
        if (this.motorcycle) {
            return this.motorcycle.position.clone();
        } else if (this.position) {
            return this.position.clone();
        } else {
            console.warn("No valid position found for player. Returning default position.");
            return new THREE.Vector3(0, 0, 0);
        }
    }
    

    update(state) {
        if (!this.motorcycle) return;

        // Update motorcycle position and rotation
        this.motorcycle.position.copy(state.position);
        this.motorcycle.rotation.y = state.rotation.y;
        
        // Apply lean effect
        this.motorcycle.rotation.z = state.leanAngle;
        
        // Animate wheels based on speed
        this.motorcycle.children.forEach(child => {
            if (child.userData.isWheel) {
                child.rotation.x += state.wheelRotation;
            }
        });

        // Update headlight direction
        this.motorcycle.children.forEach(child => {
            if (child instanceof THREE.SpotLight) {
                const targetPos = new THREE.Vector3(
                    this.motorcycle.position.x + Math.sin(this.motorcycle.rotation.y) * 10,
                    0,
                    this.motorcycle.position.z + Math.cos(this.motorcycle.rotation.y) * 10
                );
                child.target.position.copy(targetPos);
            }
        });
    }
    getDeliveryCollider() {
        // Create a delivery detection sphere around the player
        if (!this._deliveryCollider) {
            const geometry = new THREE.SphereGeometry(15, 16, 16);
            const material = new THREE.MeshBasicMaterial({ 
                color: 0x00ff00, 
                transparent: true, 
                opacity: 0.2,
                wireframe: true
            });
            this._deliveryCollider = new THREE.Mesh(geometry, material);
            
            // Only show in debug mode
            this._deliveryCollider.visible = false;
            
            if (this.motorcycle) {
                this.motorcycle.add(this._deliveryCollider);
            } else if (this.scene) {
                this.scene.add(this._deliveryCollider);
                // Update position in scene
                this._deliveryCollider.position.copy(this.getPosition());
            }
        }
        
        // Make sure collider follows the player
        if (this._deliveryCollider.parent !== this.motorcycle && this.motorcycle) {
            if (this._deliveryCollider.parent) {
                this._deliveryCollider.parent.remove(this._deliveryCollider);
            }
            this.motorcycle.add(this._deliveryCollider);
            this._deliveryCollider.position.set(0, 0, 0);
        }
        
        return this._deliveryCollider;
    }
    handleMovement() {
        const currentSpeed = this.speed * (this.isBoosting ? this.boostFactor : 1);

        if (this.keys.forward) {
            this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
            this.isMoving = true;
        } else if (this.keys.backward) {
            this.speed = Math.max(this.speed - this.acceleration, -this.maxSpeed / 2);
            this.isMoving = true;
        } else {
            this.speed *= (1 - this.deceleration);
            if (Math.abs(this.speed) < 0.01) {
                this.speed = 0;
                this.isMoving = false;
            }
        }

        // Apply turning
        if (this.isMoving) {
            if (this.keys.left) {
                this.motorcycle.rotation.y += this.turnSpeed * (this.speed > 0 ? 1 : -1);
            }
            if (this.keys.right) {
                this.motorcycle.rotation.y -= this.turnSpeed * (this.speed > 0 ? 1 : -1);
            }
        }

        // Update position
        const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(this.motorcycle.quaternion);
        this.body.velocity.set(
            direction.x * currentSpeed,
            this.body.velocity.y,
            direction.z * currentSpeed
        );
    }

    updateBoost() {
        if (this.keys.boost && this.boostMeter > 0) {
            this.isBoosting = true;
            this.boostMeter = Math.max(0, this.boostMeter - this.boostDepletionRate);
        } else {
            this.isBoosting = false;
            this.boostMeter = Math.min(this.maxBoost, this.boostMeter + this.boostRecoveryRate);
        }
    }

    updateCamera() {
        if (!this.motorcycle) return;

        // Calculate target camera position
        const targetPosition = this.motorcycle.position.clone()
            .add(this.cameraOffset.clone().applyQuaternion(this.motorcycle.quaternion));

        // Smoothly move camera to target position
        this.camera.position.lerp(targetPosition, this.cameraDampening);

        // Calculate target look position
        const targetLook = this.motorcycle.position.clone()
            .add(this.cameraLookAt.clone().applyQuaternion(this.motorcycle.quaternion));

        // Smoothly look at target
        const currentLook = new THREE.Vector3();
        this.camera.getWorldDirection(currentLook);
        const targetDirection = targetLook.sub(this.camera.position).normalize();
        const newDirection = currentLook.lerp(targetDirection, this.cameraDampening);
        this.camera.lookAt(this.camera.position.clone().add(newDirection));
    }

    applyLeanEffect() {
        if (!this.motorcycle) return;

        const leanAmount = 0.3;
        let targetLean = 0;

        if (this.keys.left) targetLean = leanAmount;
        if (this.keys.right) targetLean = -leanAmount;

        this.motorcycle.rotation.z = THREE.MathUtils.lerp(
            this.motorcycle.rotation.z,
            targetLean,
            0.1
        );
    }

    setPosition(x, y, z) {
        if (this.motorcycle) {
            this.motorcycle.position.set(x, y, z);
            this.body.position.set(x, y, z);
        }
    }
} 