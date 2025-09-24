class DocumentProcessingGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        console.log('Canvas element:', this.canvas);
        
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        console.log('Canvas initialized:', this.width, 'x', this.height);
        console.log('Canvas context:', this.ctx);
        
        // Game state
        this.gameRunning = false;
        this.gameMode = 'manual';
        this.playerName = 'Player';
        this.score = 0;
        this.processedDocs = 0;
        this.missedDocs = 0;
        this.totalDocs = 0;
        this.revenue = 0;
        this.gameTime = 60;
        this.gameStartTime = 0;
        this.currentScreen = 'name'; // 'name', 'mode', 'play', 'game', 'over'
        
        // Game objects
        this.player = new Player(this.width / 2, this.height - 50);
        this.bullets = [];
        this.documents = [];
        this.particles = [];
        this.mainAgent = null;
        this.subAgent = null;
        
        // Game settings
        this.documentSpawnRate = 0.02;
        this.gameSpeed = 1;
        this.lastDocumentSpawn = 0;
        
        // AI mode settings
        this.aiShootCooldown = 0;
        this.aiShootInterval = 100; // ms between AI shots
        
        this.setupEventListeners();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Name entry
        document.getElementById('continueBtn').addEventListener('click', () => {
            const name = document.getElementById('playerName').value.trim();
            if (name) {
                this.playerName = name;
                document.getElementById('displayName').textContent = name;
                this.showScreen('mode');
            }
        });
        
        // Mode selection
        document.getElementById('selectManual').addEventListener('click', () => {
            this.setMode('manual');
            this.showScreen('play');
        });
        document.getElementById('selectAI').addEventListener('click', () => {
            this.setMode('ai');
            this.showScreen('play');
        });
        
        // Play button
        document.getElementById('playBtn').addEventListener('click', () => {
            console.log('Play button clicked!');
            this.startGame();
        });
        
        // Restart buttons
        document.getElementById('restartManual').addEventListener('click', () => {
            this.setMode('manual');
            this.restart();
        });
        document.getElementById('restartAI').addEventListener('click', () => {
            this.setMode('ai');
            this.restart();
        });
        
        // Enter key for name input
        document.getElementById('playerName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('continueBtn').click();
            }
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyM') {
                this.toggleMode();
            }
        });
        
        // Game controls
        this.keys = {};
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Prevent default behavior for game keys
            if (e.code === 'Space' || e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'KeyM') {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            
            // Prevent default behavior for game keys
            if (e.code === 'Space' || e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'KeyM') {
                e.preventDefault();
            }
        });
    }
    
    showScreen(screenName) {
        console.log('Showing screen:', screenName);
        
        // Hide all screens
        document.querySelectorAll('.game-screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Show target screen (if it exists)
        if (screenName !== 'game') {
            const targetScreen = document.getElementById(screenName + 'Screen');
            if (targetScreen) {
                targetScreen.classList.remove('hidden');
                this.currentScreen = screenName;
                console.log('Screen shown:', screenName);
            } else {
                console.error('Screen not found:', screenName + 'Screen');
            }
        } else {
            // For 'game' screen, just hide all overlays
            this.currentScreen = 'game';
            console.log('Game screen - all overlays hidden');
        }
        
        // Show/hide game UI
        const gameUI = document.getElementById('gameUI');
        if (screenName === 'game') {
            gameUI.classList.remove('hidden');
            console.log('Game UI shown');
        } else {
            gameUI.classList.add('hidden');
            console.log('Game UI hidden');
        }
    }
    
    setMode(mode) {
        this.gameMode = mode;
        
        // Update mode indicator
        const modeIndicator = document.getElementById('currentMode');
        modeIndicator.textContent = mode.toUpperCase();
        modeIndicator.className = mode === 'ai' ? 'ai-mode' : '';
        
        if (mode === 'manual') {
            this.mainAgent = null;
            this.subAgent = null;
        } else {
            this.mainAgent = new MainAgent();
            this.subAgent = new SubAgent();
        }
    }
    
    toggleMode() {
        this.setMode(this.gameMode === 'manual' ? 'ai' : 'manual');
    }
    
    startGame() {
        console.log('Starting game with mode:', this.gameMode);
        
        // Reset all game state
        this.gameRunning = true;
        this.gameStartTime = Date.now();
        this.gameTime = 60;
        this.score = 0;
        this.processedDocs = 0;
        this.missedDocs = 0;
        this.totalDocs = 0;
        this.revenue = 0;
        this.bullets = [];
        this.documents = [];
        this.particles = [];
        this.player = new Player(this.width / 2, this.height - 50);
        this.lastDocumentSpawn = 0;
        
        // Initialize agents based on mode
        if (this.gameMode === 'ai') {
            this.mainAgent = new MainAgent();
            this.subAgent = new SubAgent();
            console.log('AI agents initialized');
        } else {
            this.mainAgent = null;
            this.subAgent = null;
            console.log('Manual mode - no AI agents');
        }
        
        this.showScreen('game');
        this.updateMetrics();
        this.updateTimeBar();
        
        console.log('Game started successfully');
    }
    
    restart() {
        this.gameRunning = true;
        this.gameStartTime = Date.now();
        this.gameTime = 60;
        this.score = 0;
        this.processedDocs = 0;
        this.missedDocs = 0;
        this.totalDocs = 0;
        this.revenue = 0;
        this.bullets = [];
        this.documents = [];
        this.particles = [];
        this.player = new Player(this.width / 2, this.height - 50);
        this.lastDocumentSpawn = 0;
        
        this.showScreen('game');
        this.updateMetrics();
        this.updateTimeBar();
    }
    
    spawnDocument() {
        const types = ['high', 'medium', 'low', 'no-value'];
        const type = types[Math.floor(Math.random() * types.length)];
        const x = Math.random() * (this.width - 60);
        const y = -60;
        
        const doc = new Document(x, y, type, this.gameMode === 'ai');
        
        // Make documents fall faster as time progresses
        const timeProgress = (60 - this.gameTime) / 60; // 0 to 1 as time progresses
        const speedMultiplier = 1 + (timeProgress * 1.5); // 1x to 2.5x speed
        doc.speed *= speedMultiplier;
        
        this.documents.push(doc);
        this.totalDocs++;
    }
    
    update() {
        if (!this.gameRunning || this.currentScreen !== 'game') return;
        
        // Spawn documents with progressive difficulty
        const timeProgress = (60 - this.gameTime) / 60; // 0 to 1 as time progresses
        const difficultyMultiplier = 1 + (timeProgress * 2); // 1x to 3x spawn rate
        const currentSpawnRate = this.documentSpawnRate * difficultyMultiplier;
        
        if (Math.random() < currentSpawnRate) {
            this.spawnDocument();
        }
        
        // Update player
        this.player.update(this.keys, this.gameMode, this.width);
        
        // Handle shooting (player always shoots manually)
        if (this.keys['Space'] && this.player.canShoot(this.gameMode)) {
            this.shoot();
        }
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.update();
            return bullet.y > -10;
        });
        
        // Update documents
        this.documents = this.documents.filter(doc => {
            doc.update();
            
            // Check if document passed by
            if (doc.y > this.height) {
                this.missedDocs++;
                this.createMissEffect(doc.x, doc.y);
                return false;
            }
            
            return true;
        });
        
        // Update AI agents
        if (this.mainAgent) {
            this.mainAgent.update(this.documents, this.bullets);
        }
        if (this.subAgent) {
            this.subAgent.update(this.documents, this.bullets);
        }
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.update();
            return particle.life > 0;
        });
        
        // Check collisions
        this.checkCollisions();
        
        // Update metrics and time
        this.updateMetrics();
        this.updateTimeBar();
        
        // Check game over conditions
        if (this.missedDocs > 20 || this.gameTime <= 0) {
            this.gameOver();
            return; // Stop updating when game is over
        }
    }
    
    shoot() {
        const accuracy = this.gameMode === 'ai' ? 1 : 0.7; // AI is perfectly accurate
        const spread = this.gameMode === 'ai' ? 0 : 3; // Manual has spread
        
        this.bullets.push(new Bullet(
            this.player.x + this.player.width / 2,
            this.player.y,
            accuracy,
            spread
        ));
        
        this.player.lastShot = Date.now();
    }
    
    
    checkCollisions() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            for (let j = this.documents.length - 1; j >= 0; j--) {
                const doc = this.documents[j];
                
                if (this.isColliding(bullet, doc)) {
                    // Hit!
                    this.processedDocs++;
                    this.revenue += doc.value;
                    this.score += doc.value;
                    
                    this.createHitEffect(doc.x, doc.y, doc.type);
                    this.bullets.splice(i, 1);
                    this.documents.splice(j, 1);
                    break;
                }
            }
        }
    }
    
    isColliding(bullet, doc) {
        return bullet.x < doc.x + doc.width &&
               bullet.x + bullet.width > doc.x &&
               bullet.y < doc.y + doc.height &&
               bullet.y + bullet.height > doc.y;
    }
    
    createHitEffect(x, y, type) {
        const colors = {
            'high': '#4CAF50',
            'medium': '#FFC107',
            'low': '#FF5722',
            'no-value': '#9E9E9E'
        };
        
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(x, y, colors[type]));
        }
    }
    
    createMissEffect(x, y) {
        for (let i = 0; i < 5; i++) {
            this.particles.push(new Particle(x, y, '#FF0000'));
        }
    }
    
    updateMetrics() {
        const processRate = this.totalDocs > 0 ? (this.processedDocs / this.totalDocs * 100).toFixed(1) : 0;
        const missedRate = this.totalDocs > 0 ? (this.missedDocs / this.totalDocs * 100).toFixed(1) : 0;
        
        document.getElementById('processRate').textContent = processRate + '%';
        document.getElementById('revenue').textContent = '$' + this.revenue.toLocaleString();
        document.getElementById('missed').textContent = missedRate + '%';
        document.getElementById('processed').textContent = this.processedDocs;
    }
    
    updateTimeBar() {
        if (this.gameRunning && this.currentScreen === 'game') {
            const elapsed = (Date.now() - this.gameStartTime) / 1000;
            this.gameTime = Math.max(0, 60 - elapsed);
            
            const percentage = (this.gameTime / 60) * 100;
            const timeBarElement = document.getElementById('timeBar');
            const timeTextElement = document.getElementById('timeText');
            
            if (timeBarElement && timeTextElement) {
                timeBarElement.style.width = percentage + '%';
                timeTextElement.textContent = Math.ceil(this.gameTime) + 's';
                
                // Change color based on time remaining
                if (this.gameTime > 30) {
                    timeBarElement.style.background = 'linear-gradient(90deg, #4CAF50 0%, #FFC107 50%, #FF5722 100%)';
                } else if (this.gameTime > 10) {
                    timeBarElement.style.background = 'linear-gradient(90deg, #FFC107 0%, #FF5722 100%)';
                } else {
                    timeBarElement.style.background = '#FF5722';
                }
            }
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        
        // Update final stats
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalProcessRate').textContent = 
            this.totalDocs > 0 ? (this.processedDocs / this.totalDocs * 100).toFixed(1) + '%' : '0%';
        document.getElementById('finalRevenue').textContent = '$' + this.revenue.toLocaleString();
        document.getElementById('finalProcessed').textContent = this.processedDocs;
        document.getElementById('finalMissed').textContent = this.missedDocs;
        
        // Show appropriate message based on mode
        const manualMessage = document.getElementById('manualModeMessage');
        const aiMessage = document.getElementById('aiModeMessage');
        
        if (this.gameMode === 'manual') {
            manualMessage.classList.remove('hidden');
            aiMessage.classList.add('hidden');
        } else {
            manualMessage.classList.add('hidden');
            aiMessage.classList.remove('hidden');
        }
        
        this.showScreen('gameOver');
    }
    
    render() {
        // Clear canvas with solid background
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw stars
        this.drawStars();
        
        // Only render game objects when actually playing
        if (this.gameRunning && this.currentScreen === 'game') {
            // Draw game objects
            this.player.render(this.ctx);
            
            this.bullets.forEach(bullet => bullet.render(this.ctx));
            this.documents.forEach(doc => doc.render(this.ctx));
            this.particles.forEach(particle => particle.render(this.ctx));
            
            // Draw AI agents
            if (this.mainAgent) {
                this.mainAgent.render(this.ctx);
            }
            if (this.subAgent) {
                this.subAgent.render(this.ctx);
            }
        }
        
        // Draw mode indicator
        this.drawModeIndicator();
    }
    
    drawStars() {
        this.ctx.fillStyle = 'white';
        for (let i = 0; i < 50; i++) {
            const x = (i * 37) % this.width;
            const y = (i * 23) % this.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
    }
    
    drawModeIndicator() {
        // Mode indicator is now in the UI overlay, not on canvas
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 40;
        this.speed = 12; // Increased from 8 to 12 for even faster movement
        this.lastShot = 0;
        this.shootCooldown = 500; // ms between shots in manual mode
    }
    
    update(keys, mode, canvasWidth = 1200) {
        // Movement - use dynamic canvas width
        if (keys['ArrowLeft'] && this.x > 0) {
            this.x -= this.speed;
        }
        if (keys['ArrowRight'] && this.x < canvasWidth - this.width) {
            this.x += this.speed;
        }
    }
    
    canShoot(mode) {
        const cooldown = mode === 'ai' ? 100 : this.shootCooldown;
        return Date.now() - this.lastShot > cooldown;
    }
    
    render(ctx) {
        // Draw player ship with better graphics
        // Main body with gradient
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#81C784');
        gradient.addColorStop(1, '#2E7D32');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Border
        ctx.strokeStyle = '#1B5E20';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Cockpit
        ctx.fillStyle = '#1B5E20';
        ctx.fillRect(this.x + 10, this.y + 5, this.width - 20, this.height - 10);
        
        // Cockpit window
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(this.x + 15, this.y + 8, this.width - 30, 8);
        
        // Engine glow
        ctx.fillStyle = '#A5D6A7';
        ctx.fillRect(this.x + 5, this.y + this.height - 5, this.width - 10, 5);
        
        // Engine exhaust
        ctx.fillStyle = '#FFD54F';
        ctx.fillRect(this.x + 8, this.y + this.height, this.width - 16, 3);
        
        // Wings
        ctx.fillStyle = '#66BB6A';
        ctx.fillRect(this.x - 5, this.y + 10, 5, 20);
        ctx.fillRect(this.x + this.width, this.y + 10, 5, 20);
        
        // Status indicator
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(this.x + this.width/2 - 2, this.y - 3, 4, 4);
    }
}

class Bullet {
    constructor(x, y, accuracy, spread, target = null) {
        this.x = x - 2;
        this.y = y;
        this.width = 4;
        this.height = 10;
        this.speed = 8;
        this.target = target;
        
        // Apply accuracy and spread
        if (target && accuracy === 1) {
            // Perfect AI targeting
            const dx = target.x - x;
            const dy = target.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            this.vx = (dx / distance) * this.speed;
            this.vy = (dy / distance) * this.speed;
        } else {
            // Manual shooting with inaccuracy
            this.vx = (Math.random() - 0.5) * spread;
            this.vy = -this.speed;
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
    }
    
    render(ctx) {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Document {
    constructor(x, y, type, isClassified) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 60;
        this.speed = 2 + Math.random() * 3; // Increased from 1-3 to 2-5
        this.type = type;
        this.isClassified = isClassified;
        this.lassoed = false;
        this.targetX = null;
        
        // Set value based on type
        this.value = this.getValue();
    }
    
    getValue() {
        const values = {
            'high': 1000 + Math.random() * 500,
            'medium': 500 + Math.random() * 499,
            'low': 100 + Math.random() * 399,
            'no-value': 0
        };
        return Math.floor(values[this.type]);
    }
    
    update() {
        this.y += this.speed;
        
        // Move towards target position if lassoed (much faster horizontal movement)
        if (this.targetX !== null) {
            const moveSpeed = 12; // Increased from 8 to 12 for even faster movement
            if (this.x < this.targetX) {
                this.x = Math.min(this.x + moveSpeed, this.targetX);
            } else if (this.x > this.targetX) {
                this.x = Math.max(this.x - moveSpeed, this.targetX);
            }
        }
    }
    
    render(ctx) {
        // Draw document background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw border - grey in manual mode, colored in AI mode
        if (this.isClassified) {
            ctx.strokeStyle = this.getTypeColor();
        } else {
            ctx.strokeStyle = '#9E9E9E'; // Grey for manual mode
        }
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Draw document icon
        ctx.fillStyle = '#333';
        ctx.font = '20px Arial';
        ctx.fillText('📄', this.x + 15, this.y + 35);
        
        // Show value if classified (AI mode)
        if (this.isClassified) {
            ctx.fillStyle = this.getTypeColor();
            ctx.font = '10px Arial';
            ctx.fillText('$' + this.value, this.x + 5, this.y + 55);
        } else {
            // Show question mark for unclassified (manual mode)
            ctx.fillStyle = '#666';
            ctx.font = '12px Arial';
            ctx.fillText('?', this.x + 22, this.y + 55);
        }
    }
    
    getTypeColor() {
        const colors = {
            'high': '#4CAF50',
            'medium': '#FFC107',
            'low': '#FF5722',
            'no-value': '#9E9E9E'
        };
        return colors[this.type];
    }
}

class MainAgent {
    constructor() {
        this.x = 400; // Center of screen
        this.y = 100;
        this.width = 40;
        this.height = 40;
        this.lassos = [];
        this.lastLasso = 0;
        this.lassoInterval = 300; // Much faster - 0.3 seconds between lassos
    }
    
    update(documents, bullets) {
        // Find documents to lasso and sort by value
        const targetDocs = documents.filter(doc => 
            doc.y > 50 && doc.y < 300 && !doc.lassoed
        );
        
        if (targetDocs.length > 0 && Date.now() - this.lastLasso > this.lassoInterval) {
            // Sort by value (lowest to highest)
            targetDocs.sort((a, b) => a.value - b.value);
            
            // Create lasso for the most valuable document
            const target = targetDocs[targetDocs.length - 1];
            this.lassos.push(new Lasso(this.x, this.y, target));
            target.lassoed = true;
            this.lastLasso = Date.now();
        }
        
        // Update lassos
        this.lassos = this.lassos.filter(lasso => {
            lasso.update();
            return lasso.active;
        });
    }
    
    render(ctx) {
        // Draw robot main agent
        // Main body - metallic silver
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#E0E0E0');
        gradient.addColorStop(0.5, '#BDBDBD');
        gradient.addColorStop(1, '#757575');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Robot body panels
        ctx.strokeStyle = '#424242';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Vertical panel lines
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/3, this.y);
        ctx.lineTo(this.x + this.width/3, this.y + this.height);
        ctx.moveTo(this.x + 2*this.width/3, this.y);
        ctx.lineTo(this.x + 2*this.width/3, this.y + this.height);
        ctx.stroke();
        
        // Robot head/visor
        ctx.fillStyle = '#1976D2';
        ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, 12);
        
        // Visor glow
        ctx.fillStyle = '#64B5F6';
        ctx.fillRect(this.x + 7, this.y + 7, this.width - 14, 8);
        
        // Robot eyes (LEDs)
        ctx.fillStyle = '#00E676';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 11, 2, 0, Math.PI * 2);
        ctx.arc(this.x + this.width - 10, this.y + 11, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Robot antenna
        ctx.strokeStyle = '#424242';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2, this.y);
        ctx.lineTo(this.x + this.width/2, this.y - 15);
        ctx.stroke();
        
        // Antenna tip
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y - 15, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Robot arms (lasso launchers)
        ctx.strokeStyle = '#616161';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.x - 5, this.y + 15);
        ctx.lineTo(this.x - 15, this.y + 15);
        ctx.moveTo(this.x + this.width + 5, this.y + 15);
        ctx.lineTo(this.x + this.width + 15, this.y + 15);
        ctx.stroke();
        
        // Robot status indicator
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(this.x + this.width - 8, this.y + 8, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Robot label
        ctx.fillStyle = '#1976D2';
        ctx.font = '10px Arial';
        ctx.fillText('SORTER', this.x + 2, this.y + this.height + 12);
        
        // Draw lassos
        this.lassos.forEach(lasso => lasso.render(ctx));
    }
}

class Lasso {
    constructor(startX, startY, target) {
        this.startX = startX;
        this.startY = startY;
        this.target = target;
        this.active = true;
        this.progress = 0;
        this.maxProgress = 100;
    }
    
    update() {
        this.progress += 4; // Faster lasso animation
        
        if (this.progress >= this.maxProgress) {
            // Move document to appropriate lane
            this.moveDocumentToLane();
            this.active = false;
        }
    }
    
    moveDocumentToLane() {
        // Determine lane based on value
        let targetX;
        if (this.target.value === 0) {
            targetX = 100; // Left lane for no value
        } else if (this.target.value < 500) {
            targetX = 200; // Left-middle for low value
        } else if (this.target.value < 1000) {
            targetX = 400; // Center for medium value
        } else {
            targetX = 600; // Right for high value
        }
        
        // Smoothly move document to target position
        this.target.targetX = targetX;
        this.target.lassoed = true;
    }
    
    render(ctx) {
        if (!this.active) return;
        
        const progress = this.progress / this.maxProgress;
        const currentX = this.startX + (this.target.x - this.startX) * progress;
        const currentY = this.startY + (this.target.y - this.startY) * progress;
        
        // Draw lasso line
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(this.startX + 15, this.startY + 15);
        ctx.lineTo(currentX + 25, currentY + 30);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw lasso circle around target
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.target.x + 25, this.target.y + 30, 30, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class SubAgent {
    constructor() {
        this.x = 50; // Left side
        this.y = 550; // Ground level with player
        this.width = 40;
        this.height = 30;
        this.lastShot = 0;
        this.shootInterval = 150; // Even faster fire rate for better coverage
    }
    
    update(documents, bullets) {
        // Find ALL documents in the left quadrant to auto-target
        const leftQuadrantDocs = documents.filter(doc => 
            doc.x < 300 && // Left side of screen (quarter of 1200px width)
            doc.y > 0 && 
            doc.y < 500 && 
            !doc.lassoed
        );
        
        if (leftQuadrantDocs.length > 0 && Date.now() - this.lastShot > this.shootInterval) {
            // Prioritize by value: low-value first, then medium, then high
            leftQuadrantDocs.sort((a, b) => {
                const valueOrder = { 'low': 0, 'medium': 1, 'high': 2, 'no-value': 3 };
                return valueOrder[a.type] - valueOrder[b.type];
            });
            
            const target = leftQuadrantDocs[0];
            bullets.push(new Bullet(
                this.x + this.width / 2,
                this.y,
                1, // Perfect accuracy
                0, // No spread
                target
            ));
            this.lastShot = Date.now();
        }
    }
    
    render(ctx) {
        // Draw robot sub-agent
        // Main body - metallic bronze
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#FFB74D');
        gradient.addColorStop(0.5, '#FF8A65');
        gradient.addColorStop(1, '#D84315');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Robot body panels
        ctx.strokeStyle = '#BF360C';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Horizontal panel lines
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height/3);
        ctx.lineTo(this.x + this.width, this.y + this.height/3);
        ctx.moveTo(this.x, this.y + 2*this.height/3);
        ctx.lineTo(this.x + this.width, this.y + 2*this.height/3);
        ctx.stroke();
        
        // Robot head/visor
        ctx.fillStyle = '#D84315';
        ctx.fillRect(this.x + 5, this.y + 2, this.width - 10, 8);
        
        // Visor glow
        ctx.fillStyle = '#FF8A65';
        ctx.fillRect(this.x + 7, this.y + 4, this.width - 14, 4);
        
        // Robot eye (LED)
        ctx.fillStyle = '#FF1744';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + 6, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Robot gun barrel
        ctx.fillStyle = '#424242';
        ctx.fillRect(this.x + this.width - 3, this.y + 12, 12, 6);
        
        // Gun barrel tip
        ctx.fillStyle = '#212121';
        ctx.fillRect(this.x + this.width + 9, this.y + 13, 4, 4);
        
        // Robot arm joints
        ctx.fillStyle = '#616161';
        ctx.beginPath();
        ctx.arc(this.x - 2, this.y + 8, 3, 0, Math.PI * 2);
        ctx.arc(this.x - 2, this.y + 22, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Robot status indicator
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(this.x + this.width - 6, this.y + 4, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Robot label
        ctx.fillStyle = '#D84315';
        ctx.font = '8px Arial';
        ctx.fillText('SNIPER', this.x - 2, this.y + this.height + 10);
        
        // Show coverage area (left quadrant)
        ctx.strokeStyle = 'rgba(255, 87, 34, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(0, 0, 300, 500);
        ctx.setLineDash([]);
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.color = color;
        this.life = 30;
        this.maxLife = 30;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = this.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fillRect(this.x, this.y, 3, 3);
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new DocumentProcessingGame();
});
