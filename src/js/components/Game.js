import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Player } from './Player.js';
import TWEEN from '@tweenjs/tween.js';

export class Game {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.score = 0;
        this.missions = [];
        this.activeMission = null;
        this.gameTime = 0;
        this.isGameOver = false;
        this.landmarks = []; // Initialize landmarks array

        // Physics world
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0)
        });

        // Initialize game components
        this.player = new Player(scene, this.world);
        this.setupPhysicsGround();
        this.setupUI();
        this.setupCamera();
        this.setupLandmarks(); // Add landmarks before missions
        this.setupMissions();

        // Collision detection
        this.world.addEventListener('beginContact', this.handleCollision.bind(this));
    }

    setupPhysicsGround() {
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({
            mass: 0,
            shape: groundShape,
            material: new CANNON.Material({ friction: 0.5 })
        });
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.world.addBody(groundBody);
    }

    setupLandmarks() {
        // Define Bangalore landmarks with positions and info
        const landmarkData = [
            {
                name: "Vidhana Soudha",
                position: new THREE.Vector3(50, 0, -30),
                description: "The seat of Karnataka's legislative assembly"
            },
            {
                name: "UB City",
                position: new THREE.Vector3(-40, 0, 40),
                description: "Luxury mall and business center"
            },
            {
                name: "Cubbon Park",
                position: new THREE.Vector3(30, 0, 60),
                description: "Historic park in the heart of the city"
            },
            {
                name: "MTR Restaurant",
                position: new THREE.Vector3(-60, 0, -20),
                description: "Iconic South Indian restaurant"
            },
            {
                name: "Bangalore Palace",
                position: new THREE.Vector3(70, 0, 10),
                description: "Historic royal palace built in Tudor style"
            }
        ];

        // Create landmarks and store them
        this.landmarks = landmarkData.map(data => {
            const marker = this.createMissionMarker(data.position);
            return {
                ...data,
                marker,
                isCompleted: false
            };
        });
    }

    setupMissions() {
        // Define delivery locations with Bangalore landmarks
        const locations = [
            {
                name: "Vidhana Soudha",
                position: new THREE.Vector3(100, 0, 100),
                reward: 500
            },
            {
                name: "Cubbon Park",
                position: new THREE.Vector3(-150, 0, 50),
                reward: 300
            },
            {
                name: "UB City",
                position: new THREE.Vector3(80, 0, -120),
                reward: 400
            },
            {
                name: "Bangalore Palace",
                position: new THREE.Vector3(-100, 0, -100),
                reward: 450
            },
            {
                name: "MG Road Metro",
                position: new THREE.Vector3(0, 0, 150),
                reward: 350
            }
        ];

        this.missions = locations.map(loc => {
            // Create delivery marker
            const markerGeometry = new THREE.CylinderGeometry(2, 2, 10, 32);
            const markerMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xffeb3b,
                transparent: true,
                opacity: 0.7
            });
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.copy(loc.position);
            this.scene.add(marker);

            // Create floating text
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 128;
            context.fillStyle = '#ffffff';
            context.font = 'bold 24px Arial';
            context.fillText(loc.name, 10, 64);

            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.copy(loc.position);
            sprite.position.y += 15;
            sprite.scale.set(20, 10, 1);
            this.scene.add(sprite);

            return {
                ...loc,
                marker,
                sprite,
                isCompleted: false
            };
        });

        this.startNewMission();
    }

    setupUI() {
        try {
            // First try to find existing UI elements in the DOM
            this.scoreElement = document.getElementById('score');
            this.missionElement = document.getElementById('mission-info');
            this.timerElement = document.getElementById('timer');
            
            // If UI elements exist, we'll use them
            if (this.scoreElement && this.missionElement && this.timerElement) {
                console.log('Found existing UI elements');
                return;
            }
            
            // Otherwise, create a new UI container and elements
            console.log('Creating new UI elements');
            const uiContainer = document.createElement('div');
            uiContainer.id = 'game-ui-container';
            uiContainer.style.position = 'absolute';
            uiContainer.style.top = '20px';
            uiContainer.style.left = '20px';
            uiContainer.style.color = 'white';
            uiContainer.style.fontFamily = 'Arial, sans-serif';
            uiContainer.style.padding = '20px';
            uiContainer.style.background = 'rgba(0, 0, 0, 0.7)';
            uiContainer.style.borderRadius = '10px';
            document.body.appendChild(uiContainer);

            // Create elements if they don't exist
            if (!this.scoreElement) {
                this.scoreElement = document.createElement('div');
                this.scoreElement.id = 'score';
                uiContainer.appendChild(this.scoreElement);
                this.scoreElement.textContent = 'Score: 0';
            }

            if (!this.missionElement) {
                this.missionElement = document.createElement('div');
                this.missionElement.id = 'mission-info';
                this.missionElement.style.marginTop = '10px';
                uiContainer.appendChild(this.missionElement);
            }

            if (!this.timerElement) {
                this.timerElement = document.createElement('div');
                this.timerElement.id = 'timer';
                this.timerElement.style.marginTop = '10px';
                uiContainer.appendChild(this.timerElement);
                this.timerElement.textContent = 'Time: 2:00';
            }
        } catch (e) {
            console.error('Error setting up UI:', e);
        }
    }

    setupCamera() {
        this.camera.position.set(0, 20, 30);
        this.cameraTarget = new THREE.Vector3();
    }

    startNewMission() {
        try {
            if (this.currentMission) {
                // Hide the previous mission destination
                if (this.currentMission.marker) {
                    this.currentMission.marker.visible = false;
                }
            }

            // Filter out completed landmarks
            const availableLandmarks = this.landmarks.filter(l => !l.isCompleted);

            if (availableLandmarks.length === 0) {
                console.warn('No landmarks available for missions');
                this.gameOver(true); // Game completed successfully
                return;
            }

            // Get a random landmark for delivery
            const randomIndex = Math.floor(Math.random() * availableLandmarks.length);
            this.currentMission = availableLandmarks[randomIndex];

            // Make the marker visible
            if (this.currentMission.marker) {
                this.currentMission.marker.visible = true;
            }

            // Update mission UI
            if (this.missionElement && typeof this.missionElement.textContent !== 'undefined') {
                this.missionElement.textContent = `Deliver to: ${this.currentMission.name}`;
            } else {
                console.warn('Mission element not found or not fully initialized');
            }

            // Start the timer
            this.updateTimer();
            clearInterval(this.timerInterval);
            this.timerInterval = setInterval(() => this.updateTimer(), 1000);

            console.log('New mission started:', this.currentMission.name);
        } catch (e) {
            console.error('Error starting new mission:', e);
        }
    }

    handleCollision(event) {
        if (!this.activeMission) return;

        const playerPos = this.player.getPosition();
        const missionPos = this.activeMission.position;
        const distance = playerPos.distanceTo(missionPos);

        if (distance < 5) {
            this.completeMission();
        }
    }

    completeMission() {
        if (!this.activeMission) return;

        this.score += this.activeMission.reward;
        this.scoreElement.textContent = `Score: ${this.score}`;
        this.activeMission.isCompleted = true;
        this.activeMission.marker.material.color.setHex(0x00ff00);

        // Show completion message
        const message = document.createElement('div');
        message.textContent = `Delivery Complete! +${this.activeMission.reward}`;
        message.style.position = 'absolute';
        message.style.top = '50%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.color = '#00ff00';
        message.style.fontSize = '24px';
        message.style.fontWeight = 'bold';
        document.body.appendChild(message);

        setTimeout(() => {
            document.body.removeChild(message);
            this.startNewMission();
        }, 2000);
    }

    gameOver(success) {
        this.isGameOver = true;
        const message = document.createElement('div');
        message.style.position = 'absolute';
        message.style.top = '50%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.color = success ? '#00ff00' : '#ff0000';
        message.style.fontSize = '36px';
        message.style.fontWeight = 'bold';
        message.style.background = 'rgba(0, 0, 0, 0.8)';
        message.style.padding = '20px';
        message.style.borderRadius = '10px';
        message.textContent = success ? 
            `Game Complete! Final Score: ${this.score}` :
            'Game Over!';
        document.body.appendChild(message);
    }

    update(delta) {
        if (this.isGameOver) return;

        // Update physics
        this.world.step(1/60);

        // Update player with current state
        if (this.player) {
            this.player.update({
                position: this.player.getPosition(),
                rotation: this.player.motorcycle ? this.player.motorcycle.rotation : new THREE.Euler(),
                speed: this.player.speed,
                keys: this.player.keys
            });
        }

        // Update camera
        const playerPos = this.player ? this.player.getPosition() : new THREE.Vector3();
        this.cameraTarget.lerp(playerPos, 0.1);
        this.camera.position.lerp(
            new THREE.Vector3(
                playerPos.x,
                playerPos.y + 20,
                playerPos.z + 30
            ),
            0.1
        );
        this.camera.lookAt(this.cameraTarget);

        // Update mission arrow
        if (this.missionArrow && this.activeMission) {
            const direction = this.activeMission.position.clone().sub(playerPos).normalize();
            this.missionArrow.position.copy(playerPos).add(new THREE.Vector3(0, 10, 0));
            this.missionArrow.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                direction
            );
        }

        // Update game time
        this.gameTime += delta;
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        this.timerElement.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Update tweens
        TWEEN.update();
    }

    createMissionMarker(position) {
        try {
            // Create a mission marker with a cone shape
            const geometry = new THREE.ConeGeometry(3, 8, 16);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const marker = new THREE.Mesh(geometry, material);
            
            // Position the marker
            marker.position.copy(position);
            marker.position.y += 15; // Position above the landmark
            
            // Add animation
            marker.userData.originalY = marker.position.y;
            marker.userData.animationOffset = Math.random() * Math.PI * 2;
            
            // Add to scene
            this.scene.add(marker);
            
            return marker;
        } catch (e) {
            console.error('Error creating mission marker:', e);
            return null;
        }
    }

    updateTimer() {
        try {
            if (!this.currentMission || !this.timerElement) return;
            
            const elapsedTime = Date.now() - this.currentMission.startTime;
            const remainingTime = Math.max(0, this.currentMission.timeLimit - elapsedTime);
            
            const minutes = Math.floor(remainingTime / 60000);
            const seconds = Math.floor((remainingTime % 60000) / 1000);
            
            if (this.timerElement) {
                this.timerElement.textContent = `Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            }
            
            // Check if time's up
            if (remainingTime <= 0) {
                clearInterval(this.timerInterval);
                this.missionFailed();
            }
        } catch (e) {
            console.error('Error updating timer:', e);
        }
    }

    missionFailed() {
        try {
            console.log('Mission failed!');
            
            // Show failure message
            if (this.missionElement) {
                this.missionElement.textContent = 'Mission failed! Time\'s up.';
                this.missionElement.style.color = 'red';
            }
            
            // Reset after a delay
            setTimeout(() => {
                if (this.missionElement) {
                    this.missionElement.style.color = 'white';
                }
                this.startNewMission();
            }, 3000);
        } catch (e) {
            console.error('Error handling mission failure:', e);
        }
    }
} 