// Improved Minimap class for Bangalore Delivery Rush

export class Minimap {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.landmarks = [];
        this.currentDestination = null;
        this.useFixedOrientation = true; // Fixed orientation by default
        
        // Create minimap container
        this.createMinimapContainer();
        
        // Setup minimap canvas
        this.setupCanvas();
        
        // Add toggle button
        this.addToggleButton();
        
        // Start rendering
        this.render();
    }
    
    createMinimapContainer() {
        // Create container div with improved styling - INCREASED SIZE
        this.container = document.createElement('div');
        this.container.id = 'minimap-container';
        this.container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 220px;  /* Increased size */
            height: 220px; /* Increased size */
            background-color: rgba(0, 0, 0, 0.5);
            border: 4px solid rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            overflow: hidden;
            z-index: 1000;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.8);
        `;
        
        // Add a North indicator
        const northIndicator = document.createElement('div');
        northIndicator.id = 'north-indicator';
        northIndicator.innerHTML = 'N';
        northIndicator.style.cssText = `
            position: absolute;
            top: 8px;
            left: 50%;
            transform: translateX(-50%);
            color: #ff3333;
            font-weight: bold;
            font-size: 20px;
            z-index: 1001;
            text-shadow: 0px 0px 4px #000, 0px 0px 4px #000, 0px 0px 4px #000;
            letter-spacing: 1px;
        `;
        
        // Add to document body
        document.body.appendChild(this.container);
        this.container.appendChild(northIndicator);
        console.log("Minimap container created");
    }
    
    setupCanvas() {
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = 220; // Match container size
        this.canvas.height = 220; // Match container size
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
        
        // Draw grid for better orientation
        this.drawGrid();
        
        // Draw roads
        this.drawRoads();
        
        // Draw landmarks
        this.drawLandmarks();
        
        // Draw destination
        this.drawDestination();
        
        // Draw compass rose in the center
        this.drawCompassRose();
        
        // Draw player (ON TOP of everything else)
        this.drawPlayer();
        
        // Draw border
        this.drawBorder();
        
        // Continue rendering
        requestAnimationFrame(() => this.render());
    }
    
    drawGrid() {
        // Draw a subtle grid for better orientation
        const spacing = 30; // Grid spacing
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = this.canvas.width / 2 - 5;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        // Draw horizontal grid lines
        for (let y = -radius; y <= radius; y += spacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - radius, centerY + y);
            this.ctx.lineTo(centerX + radius, centerY + y);
            this.ctx.stroke();
        }
        
        // Draw vertical grid lines
        for (let x = -radius; x <= radius; x += spacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(centerX + x, centerY - radius);
            this.ctx.lineTo(centerX + x, centerY + radius);
            this.ctx.stroke();
        }
    }
    
    drawCompassRose() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = 15;
        
        // Draw compass circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fill();
        
        // Draw compass points
        const directions = [
            { label: 'N', angle: 0, color: '#ff3333' },
            { label: 'E', angle: Math.PI / 2, color: '#ffffff' },
            { label: 'S', angle: Math.PI, color: '#ffffff' },
            { label: 'W', angle: Math.PI * 3/2, color: '#ffffff' }
        ];
        
        directions.forEach(dir => {
            const x = centerX + Math.sin(dir.angle) * (radius + 10);
            const y = centerY - Math.cos(dir.angle) * (radius + 10);
            
            this.ctx.fillStyle = dir.color;
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Add text shadow
            this.ctx.shadowColor = 'black';
            this.ctx.shadowBlur = 4;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            
            this.ctx.fillText(dir.label, x, y);
            
            // Reset shadow
            this.ctx.shadowBlur = 0;
        });
    }
    
    drawRoads() {
        if (!this.player) return;
        
        // Set road style
        this.ctx.strokeStyle = '#aaaaaa';
        this.ctx.lineWidth = 3;
        
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
        
        // Calculate player position
        const playerPos = this.player.position;
        // Use player rotation only if we're not using fixed orientation
        const playerRot = this.useFixedOrientation ? 0 : (this.player.rotation ? this.player.rotation.y : 0);
        
        // Scale factor (increase for better visibility)
        const scale = 0.15;
        
        // Calculate road endpoints relative to player
        const start = road.userData.start;
        const end = road.userData.end;
        
        const startX = (start.x - playerPos.x) * scale;
        const startZ = (start.z - playerPos.z) * scale;
        const endX = (end.x - playerPos.x) * scale;
        const endZ = (end.z - playerPos.z) * scale;
        
        // Rotate positions based on player rotation if not using fixed orientation
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
        
        // Calculate player position
        const playerPos = this.player.position;
        // Use player rotation only if we're not using fixed orientation
        const playerRot = this.useFixedOrientation ? 0 : (this.player.rotation ? this.player.rotation.y : 0);
        
        // Scale factor (increase for better visibility)
        const scale = 0.15;
        
        // Find all landmark objects in the scene
        this.scene.traverse((obj) => {
            if (obj.userData && obj.userData.type === 'landmark') {
                const landmarkPos = obj.position;
                
                // Calculate landmark position relative to player
                const landmarkX = (landmarkPos.x - playerPos.x) * scale;
                const landmarkZ = (landmarkPos.z - playerPos.z) * scale;
                
                // Rotate position based on player orientation if not using fixed orientation
                const rotatedX = landmarkX * Math.cos(-playerRot) - landmarkZ * Math.sin(-playerRot);
                const rotatedZ = landmarkX * Math.sin(-playerRot) + landmarkZ * Math.cos(-playerRot);
                
                // Calculate screen position
                const screenX = centerX + rotatedX;
                const screenY = centerY + rotatedZ;
                
                // Check if landmark is within minimap bounds
                const distance = Math.sqrt(rotatedX * rotatedX + rotatedZ * rotatedZ);
                const radius = this.canvas.width / 2;
                
                if (distance < radius - 5) {
                    // First draw a background for landmark to make text more readable
                    if (obj.userData.name) {
                        const textWidth = obj.userData.name.length * 4;
                        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                        this.ctx.fillRect(
                            screenX - textWidth/2 - 2,
                            screenY - 15,
                            textWidth + 4,
                            12
                        );
                    }
                    
                    // Draw landmark marker (more visible)
                    this.ctx.fillStyle = '#ffff00'; // Bright yellow
                    this.ctx.beginPath();
                    this.ctx.arc(screenX, screenY, 5, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Draw landmark outline for better visibility
                    this.ctx.strokeStyle = '#000000';
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.arc(screenX, screenY, 5, 0, Math.PI * 2);
                    this.ctx.stroke();
                    
                    // Add a label if we have the landmark name
                    if (obj.userData.name) {
                        this.ctx.fillStyle = '#ffffff';
                        this.ctx.font = '10px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'bottom';
                        this.ctx.fillText(obj.userData.name, screenX, screenY - 7);
                    }
                }
            }
        });
    }
    
    drawDestination() {
        if (!this.player || !this.currentDestination) return;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Calculate player position
        const playerPos = this.player.position;
        // Use player rotation only if we're not using fixed orientation
        const playerRot = this.useFixedOrientation ? 0 : (this.player.rotation ? this.player.rotation.y : 0);
        
        // Scale factor (increase for better visibility)
        const scale = 0.15;
        
        // Calculate destination position relative to player
        const destX = (this.currentDestination.x - playerPos.x) * scale;
        const destZ = (this.currentDestination.z - playerPos.z) * scale;
        
        // Rotate position based on player orientation if not using fixed orientation
        const rotatedX = destX * Math.cos(-playerRot) - destZ * Math.sin(-playerRot);
        const rotatedZ = destX * Math.sin(-playerRot) + destZ * Math.cos(-playerRot);
        
        // Calculate screen position
        const screenX = centerX + rotatedX;
        const screenY = centerY + rotatedZ;
        
        // Check if destination is within minimap bounds
        const distance = Math.sqrt(rotatedX * rotatedX + rotatedZ * rotatedZ);
        const radius = this.canvas.width / 2;
        
        if (distance < radius - 5) {
            // Draw destination marker (more visible with pulsing)
            const pulseSize = 8 + Math.sin(Date.now() * 0.01) * 3;
            
            // Outer glow
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, pulseSize + 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Inner marker
            this.ctx.fillStyle = '#ff0000';  // Red
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, pulseSize / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw destination outline for better visibility
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, pulseSize / 2, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Add a "DELIVER" label with background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(screenX - 25, screenY - 21, 50, 14);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'bottom';
            this.ctx.fillText('DELIVER', screenX, screenY - 10);
        } else {
            // Draw edge indicator
            const angle = Math.atan2(rotatedZ, rotatedX);
            const edgeX = centerX + Math.cos(angle) * (radius - 12);
            const edgeY = centerY + Math.sin(angle) * (radius - 12);
            
            // Pulsing edge marker
            const pulseSize = 6 + Math.sin(Date.now() * 0.01) * 1;
            
            this.ctx.fillStyle = '#ff0000';
            this.ctx.beginPath();
            this.ctx.arc(edgeX, edgeY, pulseSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Outline for better visibility
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(edgeX, edgeY, pulseSize, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Add arrow pointing to destination direction
            this.ctx.fillStyle = '#ff0000';
            this.ctx.beginPath();
            this.ctx.moveTo(
                edgeX + Math.cos(angle) * 10,
                edgeY + Math.sin(angle) * 10
            );
            this.ctx.lineTo(
                edgeX + Math.cos(angle + 2.5) * 10,
                edgeY + Math.sin(angle + 2.5) * 10
            );
            this.ctx.lineTo(
                edgeX + Math.cos(angle - 2.5) * 10,
                edgeY + Math.sin(angle - 2.5) * 10
            );
            this.ctx.closePath();
            this.ctx.fill();
            
            // Outline
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
    }
    
    drawPlayer() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Get player rotation if we're using fixed orientation
        const playerRot = this.useFixedOrientation ? (this.player.rotation ? this.player.rotation.y : 0) : 0;
        
        // IMPROVED PLAYER MARKER - make it larger and more visible
        
        // Draw player as triangle with rotation
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(playerRot);
        
        // Shadow for player marker
        this.ctx.shadowColor = 'black';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // Draw player marker body (square instead of triangle)
        this.ctx.fillStyle = '#00aaff'; // Bright blue
        this.ctx.fillRect(-8, -8, 16, 16);
        
        // Draw direction indicator (arrow)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -12);
        this.ctx.lineTo(-6, -6);
        this.ctx.lineTo(6, -6);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        
        // Draw outline
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(-8, -8, 16, 16);
        
        // Direction arrow outline
        this.ctx.strokeStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -12);
        this.ctx.lineTo(-6, -6);
        this.ctx.lineTo(6, -6);
        this.ctx.closePath();
        this.ctx.stroke();
        
        this.ctx.restore();
        
        // Add glow effect around player
        this.ctx.strokeStyle = 'rgba(0, 170, 255, 0.5)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    drawBorder() {
        // Draw circular border with improved styling
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width/2, this.canvas.height/2, this.canvas.width/2 - 2, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Add inner border for better effect
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width/2, this.canvas.height/2, this.canvas.width/2 - 6, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    // Add a button to toggle between fixed and rotating minimap
    addToggleButton() {
        const toggleButton = document.createElement('button');
        toggleButton.id = 'minimap-toggle-button';
        toggleButton.innerHTML = this.useFixedOrientation ? '🔄' : '🔒';
        toggleButton.title = this.useFixedOrientation ? 'Switch to rotating map' : 'Switch to fixed map';
        toggleButton.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.8);
            border: 2px solid #333;
            color: #333;
            font-size: 16px;
            cursor: pointer;
            z-index: 1001;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
        `;
        
        toggleButton.onclick = () => {
            this.useFixedOrientation = !this.useFixedOrientation;
            toggleButton.innerHTML = this.useFixedOrientation ? '🔄' : '🔒';
            toggleButton.title = this.useFixedOrientation ? 'Switch to rotating map' : 'Switch to fixed map';
        };
        
        this.container.appendChild(toggleButton);
    }
}