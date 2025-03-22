import * as THREE from 'three';

export class Minimap {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.landmarks = [];
        this.currentDestination = null;
        
        // Create minimap container
        this.createMinimapContainer();
        
        // Setup minimap canvas
        this.setupCanvas();
        
        // Start rendering
        this.render();
    }
    
    createMinimapContainer() {
        // Create container div with basic styling
        this.container = document.createElement('div');
        this.container.id = 'minimap-container';
        this.container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 150px;
            height: 150px;
            background-color: rgba(0, 0, 0, 0.6);
            border: 2px solid #fff;
            border-radius: 50%;
            overflow: hidden;
            z-index: 1000;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
        `;
        
        // Add to document body
        document.body.appendChild(this.container);
        console.log("Minimap container created");
    }
    
    setupCanvas() {
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = 150;
        this.canvas.height = 150;
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        
        // Get context
        this.ctx = this.canvas.getContext('2d');
        
        // Add canvas to container
        this.container.appendChild(this.canvas);
        console.log("Minimap canvas setup complete");
    }
    
    setDestination(destination) {
        this.currentDestination = destination;
    }
    
    addLandmark(landmark) {
        this.landmarks.push(landmark);
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.ctx.fillStyle = '#1a3c1a';  // Dark green
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width/2, this.canvas.height/2, this.canvas.width/2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw roads
        this.drawRoads();
        
        // Draw landmarks
        this.drawLandmarks();
        
        // Draw destination
        this.drawDestination();
        
        // Draw player
        this.drawPlayer();
        
        // Draw border
        this.drawBorder();
        
        // Continue rendering
        requestAnimationFrame(() => this.render());
    }
    
    drawRoads() {
        if (!this.player) return;
        
        // Set road style
        this.ctx.strokeStyle = '#555555';
        this.ctx.lineWidth = 2;
        
        // Find all road objects in the scene
        this.scene.traverse((obj) => {
            if (obj.userData && obj.userData.type === 'road') {
                this.drawRoad(obj);
            }
        });
    }
    
    drawRoad(road) {
        if (!road.userData || !road.userData.start || !road.userData.end) return;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Calculate player position and rotation
        const playerPos = this.player.position;
        const playerRot = this.player.rotation ? this.player.rotation.y : 0;
        
        // Scale factor (adjust based on your game world size)
        const scale = 0.1;
        
        // Calculate road endpoints relative to player
        const start = road.userData.start;
        const end = road.userData.end;
        
        const startX = (start.x - playerPos.x) * scale;
        const startZ = (start.z - playerPos.z) * scale;
        const endX = (end.x - playerPos.x) * scale;
        const endZ = (end.z - playerPos.z) * scale;
        
        // Rotate positions based on player rotation
        const rotatedStartX = startX * Math.cos(-playerRot) - startZ * Math.sin(-playerRot);
        const rotatedStartZ = startX * Math.sin(-playerRot) + startZ * Math.cos(-playerRot);
        const rotatedEndX = endX * Math.cos(-playerRot) - endZ * Math.sin(-playerRot);
        const rotatedEndZ = endX * Math.sin(-playerRot) + endZ * Math.cos(-playerRot);
        
        // Draw road line
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + rotatedStartX, centerY + rotatedStartZ);
        this.ctx.lineTo(centerX + rotatedEndX, centerY + rotatedEndZ);
        this.ctx.stroke();
    }
    
    drawLandmarks() {
        if (!this.player) return;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Calculate player position and rotation
        const playerPos = this.player.position;
        const playerRot = this.player.rotation ? this.player.rotation.y : 0;
        
        // Scale factor
        const scale = 0.1;
        
        // Find all landmark objects in the scene
        this.scene.traverse((obj) => {
            if (obj.userData && obj.userData.type === 'landmark') {
                const landmarkPos = obj.position;
                
                // Calculate landmark position relative to player
                const landmarkX = (landmarkPos.x - playerPos.x) * scale;
                const landmarkZ = (landmarkPos.z - playerPos.z) * scale;
                
                // Rotate position based on player orientation
                const rotatedX = landmarkX * Math.cos(-playerRot) - landmarkZ * Math.sin(-playerRot);
                const rotatedZ = landmarkX * Math.sin(-playerRot) + landmarkZ * Math.cos(-playerRot);
                
                // Calculate screen position
                const screenX = centerX + rotatedX;
                const screenY = centerY + rotatedZ;
                
                // Check if landmark is within minimap bounds
                const distance = Math.sqrt(rotatedX * rotatedX + rotatedZ * rotatedZ);
                const radius = this.canvas.width / 2;
                
                if (distance < radius - 5) {
                    // Draw landmark marker
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        });
    }
    
    drawDestination() {
        if (!this.player || !this.currentDestination) return;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Calculate player position and rotation
        const playerPos = this.player.position;
        const playerRot = this.player.rotation ? this.player.rotation.y : 0;
        
        // Scale factor
        const scale = 0.1;
        
        // Calculate destination position relative to player
        const destX = (this.currentDestination.x - playerPos.x) * scale;
        const destZ = (this.currentDestination.z - playerPos.z) * scale;
        
        // Rotate position based on player orientation
        const rotatedX = destX * Math.cos(-playerRot) - destZ * Math.sin(-playerRot);
        const rotatedZ = destX * Math.sin(-playerRot) + destZ * Math.cos(-playerRot);
        
        // Calculate screen position
        const screenX = centerX + rotatedX;
        const screenY = centerY + rotatedZ;
        
        // Check if destination is within minimap bounds
        const distance = Math.sqrt(rotatedX * rotatedX + rotatedZ * rotatedZ);
        const radius = this.canvas.width / 2;
        
        if (distance < radius - 5) {
            // Draw destination marker
            this.ctx.fillStyle = '#ff0000';  // Red
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add pulsing effect
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, 5 + Math.sin(Date.now() * 0.01) * 3, 0, Math.PI * 2);
            this.ctx.stroke();
        } else {
            // Draw edge indicator
            const angle = Math.atan2(rotatedZ, rotatedX);
            const edgeX = centerX + Math.cos(angle) * (radius - 10);
            const edgeY = centerY + Math.sin(angle) * (radius - 10);
            
            this.ctx.fillStyle = '#ff0000';
            this.ctx.beginPath();
            this.ctx.arc(edgeX, edgeY, 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add arrow pointing to destination direction
            this.ctx.beginPath();
            this.ctx.moveTo(
                edgeX + Math.cos(angle) * 8,
                edgeY + Math.sin(angle) * 8
            );
            this.ctx.lineTo(
                edgeX + Math.cos(angle + 2.5) * 8,
                edgeY + Math.sin(angle + 2.5) * 8
            );
            this.ctx.lineTo(
                edgeX + Math.cos(angle - 2.5) * 8,
                edgeY + Math.sin(angle - 2.5) * 8
            );
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
    
    drawPlayer() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Draw player as triangle (pointing up as north)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - 8);
        this.ctx.lineTo(centerX - 5, centerY + 4);
        this.ctx.lineTo(centerX + 5, centerY + 4);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Add glow effect
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    drawBorder() {
        // Draw circular border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width/2, this.canvas.height/2, this.canvas.width/2 - 1, 0, Math.PI * 2);
        this.ctx.stroke();
    }
}