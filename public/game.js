class DocumentProcessingGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Game state
        this.gameRunning = false; // Start with start screen
        this.gameMode = 'manual'; // 'manual' or 'ai'
        this.score = 0;
        this.processedDocs = 0;
        this.missedDocs = 0;
        this.totalDocs = 0;
        this.revenue = 0;
        this.gameTime = 60; // 60 seconds
        this.gameStartTime = 0;
        
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
        // Mode switching (only allowed before game starts)
        document.getElementById('manualMode').addEventListener('click', () => {
            if (!this.gameRunning) this.setMode('manual');
        });
        document.getElementById('aiMode').addEventListener('click', () => {
            if (!this.gameRunning) this.setMode('ai');
        });
        
        // Start screen buttons
        document.getElementById('startManual').addEventListener('click', () => {
            this.setMode('manual');
            this.start();
        });
        document.getElementById('startAI').addEventListener('click', () => {
            this.setMode('ai');
            this.start();
        });
        
        document.getElementById('restartManual').addEventListener('click', () => {
            this.setMode('manual');
            this.restart();
        });
        document.getElementById('restartAI').addEventListener('click', () => {
            this.setMode('ai');
            this.restart();
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
    
    setMode(mode) {
        this.gameMode = mode;
        
        // Update UI
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active', 'ai-active'));
        
        if (mode === 'manual') {
            document.getElementById('manualMode').classList.add('active');
            this.mainAgent = null;
            this.subAgent = null;
        } else {
            document.getElementById('aiMode').classList.add('ai-active');
            this.mainAgent = new MainAgent();
            this.subAgent = new SubAgent();
        }
    }
    
    updateModeButtons() {
        const modeButtons = document.querySelectorAll('.mode-btn');
        if (this.gameRunning) {
            modeButtons.forEach(btn => btn.classList.add('disabled'));
        } else {
            modeButtons.forEach(btn => btn.classList.remove('disabled'));
        }
    }
    
    toggleMode() {
        this.setMode(this.gameMode === 'manual' ? 'ai' : 'manual');
    }
    
    start() {
        this.gameRunning = true;
        this.gameStartTime = Date.now();
        this.gameTime = 60; // Reset to 60 seconds
        document.getElementById('startScreen').classList.add('hidden');
        this.updateModeButtons();
        this.updateMetrics();
        this.updateTimeBar();
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
        this.mainAgent = null;
        this.subAgent = null;
        
        document.getElementById('gameOver').classList.add('hidden');
        this.updateModeButtons();
        this.updateMetrics();
        this.updateTimeBar();
    }
    
    spawnDocument() {
        const types = ['high', 'medium', 'low', 'no-value'];
        const type = types[Math.floor(Math.random() * types.length)];
        const x = Math.random() * (this.width - 60);
        const y = -60;
        
        const doc = new Document(x, y, type, this.gameMode === 'ai');
        this.documents.push(doc);
        this.totalDocs++;
    }
    
    update() {
        if (!this.gameRunning) return;
        
        // Spawn documents
        if (Math.random() < this.documentSpawnRate) {
            this.spawnDocument();
        }
        
        // Update player
        this.player.update(this.keys, this.gameMode);
        
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
        if (this.gameRunning) {
            const elapsed = (Date.now() - this.gameStartTime) / 1000;
            this.gameTime = Math.max(0, 60 - elapsed);
            
            const percentage = (this.gameTime / 60) * 100;
            document.getElementById('timeBar').style.width = percentage + '%';
            document.getElementById('timeText').textContent = Math.ceil(this.gameTime) + 's';
            
            // Change color based on time remaining
            const timeBar = document.getElementById('timeBar');
            if (this.gameTime > 30) {
                timeBar.style.background = 'linear-gradient(90deg, #4CAF50 0%, #FFC107 50%, #FF5722 100%)';
            } else if (this.gameTime > 10) {
                timeBar.style.background = 'linear-gradient(90deg, #FFC107 0%, #FF5722 100%)';
            } else {
                timeBar.style.background = '#FF5722';
            }
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').classList.remove('hidden');
        this.updateModeButtons();
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw stars
        this.drawStars();
        
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
        this.ctx.fillStyle = this.gameMode === 'ai' ? '#2196F3' : '#4CAF50';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Mode: ${this.gameMode.toUpperCase()}`, 10, 30);
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
        this.speed = 5;
        this.lastShot = 0;
        this.shootCooldown = 500; // ms between shots in manual mode
    }
    
    update(keys, mode) {
        // Movement
        if (keys['ArrowLeft'] && this.x > 0) {
            this.x -= this.speed;
        }
        if (keys['ArrowRight'] && this.x < 800 - this.width) {
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
        this.speed = 1 + Math.random() * 2;
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
            const moveSpeed = 8; // Increased from 2 to 8 for much faster movement
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
        // Draw main agent with better graphics
        // Main body with gradient
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#64B5F6');
        gradient.addColorStop(1, '#1565C0');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Border
        ctx.strokeStyle = '#0D47A1';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Inner circle
        ctx.fillStyle = '#E3F2FD';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Target icon
        ctx.fillStyle = '#1976D2';
        ctx.font = '20px Arial';
        ctx.fillText('🎯', this.x + 8, this.y + 26);
        
        // Antenna
        ctx.strokeStyle = '#1976D2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2, this.y);
        ctx.lineTo(this.x + this.width/2, this.y - 10);
        ctx.stroke();
        
        // Status indicator
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(this.x + this.width - 5, this.y + 5, 4, 0, Math.PI * 2);
        ctx.fill();
        
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
        this.shootInterval = 500;
    }
    
    update(documents, bullets) {
        // Find low-value documents to auto-target
        const lowValueDocs = documents.filter(doc => 
            doc.type === 'low' && doc.y > 0 && doc.y < 400 && !doc.lassoed
        );
        
        if (lowValueDocs.length > 0 && Date.now() - this.lastShot > this.shootInterval) {
            const target = lowValueDocs[0];
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
        // Draw sub-agent with better graphics
        // Main body
        ctx.fillStyle = '#FF5722';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add gradient effect
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#FF8A65');
        gradient.addColorStop(1, '#D84315');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Border
        ctx.strokeStyle = '#BF360C';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Gun barrel
        ctx.fillStyle = '#424242';
        ctx.fillRect(this.x + this.width - 5, this.y + 10, 8, 10);
        
        // Icon
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText('🔫', this.x + 8, this.y + 20);
        
        // Status indicator
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(this.x - 3, this.y - 3, 6, 6);
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
