const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('scoreEl');
const highScoreEl = document.getElementById('highScoreEl');
const livesEl = document.getElementById('livesEl');
const shieldEl = document.getElementById('shieldEl');
const weaponEl = document.getElementById('weaponEl');
const startButton = document.getElementById('startButton');
const muteButton = document.getElementById('muteButton');
const shootSound = document.getElementById('shootSound');
const explosionSound = document.getElementById('explosionSound');
const powerUpSound = document.getElementById('powerUpSound');

canvas.width = 800;
canvas.height = 600;

let isMuted = false;
let highScore = localStorage.getItem('highScore') || 0;
highScoreEl.textContent = highScore;

muteButton.addEventListener('click', () => {
    isMuted = !isMuted;
    muteButton.textContent = isMuted ? 'UNMUTE' : 'MUTE';
});

function playSound(sound) {
    if (!isMuted) {
        sound.volume = 0.3; // Ses seviyesini %30'a düşür
        sound.currentTime = 0;
        sound.play();
    }
}

// Yıldız arka planı için sınıf
class Star {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2;
        this.speed = Math.random() * 3 + 1;
    }

    update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.reset();
            this.y = 0;
        }
    }

    draw() {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Player {
    constructor() {
        this.width = 40;
        this.height = 30;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 20;
        this.speed = 5;
        this.lives = 3;
        this.shield = 100;
        this.weaponType = 'NORMAL'; // NORMAL, DOUBLE, TRIPLE
        this.isInvulnerable = false;
        this.invulnerableTimer = 0;
    }

    draw() {
        if (this.isInvulnerable && Math.floor(Date.now() / 100) % 2) return;
        
        ctx.fillStyle = '#00ff00';
        
        // Ana gövde
        ctx.fillRect(this.x, this.y + this.height - 10, this.width, 10);
        
        // Üst kısım
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height - 10);
        ctx.lineTo(this.x, this.y + this.height - 10);
        ctx.closePath();
        ctx.fill();
    }

    update(keys) {
        if (keys.ArrowLeft && this.x > 0) {
            this.x -= this.speed;
        }
        if (keys.ArrowRight && this.x < canvas.width - this.width) {
            this.x += this.speed;
        }

        if (this.isInvulnerable) {
            this.invulnerableTimer--;
            if (this.invulnerableTimer <= 0) {
                this.isInvulnerable = false;
            }
        }
    }

    hit() {
        if (!this.isInvulnerable) {
            this.lives--;
            livesEl.textContent = this.lives;
            this.isInvulnerable = true;
            this.invulnerableTimer = 100;
        }
    }

    activateShield() {
        if (this.shield > 0) {
            this.isInvulnerable = true;
            this.invulnerableTimer = 100;
            this.shield -= 20;
            shieldEl.textContent = this.shield + '%';
        }
    }

    changeWeapon() {
        const weapons = ['NORMAL', 'DOUBLE', 'TRIPLE'];
        const currentIndex = weapons.indexOf(this.weaponType);
        this.weaponType = weapons[(currentIndex + 1) % weapons.length];
        weaponEl.textContent = this.weaponType;
    }
}

class Projectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 15;
        this.speed = 7;
        this.toRemove = false;
    }

    draw() {
        ctx.fillStyle = '#0f0';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Işık efekti
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        this.y -= this.speed;
    }
}

class Enemy {
    constructor(x, y, type, level) {
        this.width = 40;
        this.height = 30;
        this.x = x;
        this.y = y;
        this.speed = 1 + (level * 0.2); // Her seviyede %20 hız artışı, ama daha yavaş başlangıç
        this.direction = 1;
        this.type = type;
        this.animationFrame = 0;
    }

    draw() {
        const colors = ['#ff0000', '#00ffff', '#ff00ff'];
        ctx.fillStyle = colors[this.type];

        // Düşman tipine göre farklı şekiller
        if (this.type === 0) {
            // Kalamar tipi düşman
            ctx.fillRect(this.x + 10, this.y, 20, 5); // Üst çizgi
            ctx.fillRect(this.x, this.y + 5, 40, 15); // Gövde
            ctx.fillRect(this.x, this.y + 20, 10, 10); // Sol bacak
            ctx.fillRect(this.x + 30, this.y + 20, 10, 10); // Sağ bacak
            ctx.fillRect(this.x + 15, this.y + 20, 10, 10); // Orta bacak
        } else if (this.type === 1) {
            // Yengeç tipi düşman
            ctx.fillRect(this.x + 5, this.y, 30, 20); // Gövde
            ctx.fillRect(this.x, this.y + 5, 5, 10); // Sol kıskaç
            ctx.fillRect(this.x + 35, this.y + 5, 5, 10); // Sağ kıskaç
            ctx.fillRect(this.x + 10, this.y + 20, 20, 5); // Alt kısım
        } else {
            // Ahtapot tipi düşman
            ctx.fillRect(this.x + 10, this.y, 20, 20); // Kafa
            ctx.fillRect(this.x, this.y + 10, 10, 15); // Sol kol
            ctx.fillRect(this.x + 30, this.y + 10, 10, 15); // Sağ kol
            ctx.fillRect(this.x + 15, this.y + 20, 10, 10); // Alt merkez
        }
    }

    update() {
        this.x += this.speed * this.direction;
        this.animationFrame += 0.1;
    }
}

class EnemyProjectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 10;
        this.speed = 3; // Mermi hızını 5'ten 3'e düşürdüm
        this.toRemove = false;
    }

    draw() {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.y += this.speed;
    }
}

class Explosion {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.particles = [];
        this.init();
    }

    init() {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: this.x,
                y: this.y,
                dx: (Math.random() - 0.5) * 8,
                dy: (Math.random() - 0.5) * 8,
                alpha: 1
            });
        }
    }

    draw() {
        this.particles.forEach(p => {
            ctx.fillStyle = `rgba(${this.color}, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    update() {
        this.particles.forEach(p => {
            p.x += p.dx;
            p.y += p.dy;
            p.alpha -= 0.02;
        });
        return this.particles[0].alpha <= 0;
    }
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.type = type; // 'shield', 'weapon', 'life'
        this.speed = 2;
    }

    draw() {
        ctx.fillStyle = this.type === 'shield' ? '#4488ff' : 
                       this.type === 'weapon' ? '#ff4444' : '#44ff44';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Power-up simgesi
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        const symbol = this.type === 'shield' ? 'S' : 
                      this.type === 'weapon' ? 'W' : 'L';
        ctx.fillText(symbol, this.x + 5, this.y + 15);
    }

    update() {
        this.y += this.speed;
    }
}

class Game {
    constructor() {
        this.reset();
        this.setupEventListeners();
        this.stars = Array(100).fill().map(() => new Star());
        this.explosions = [];
        this.powerUps = [];
        this.enemyProjectiles = [];
        this.gameStarted = false;
        this.powerUpChance = 0.02;
        this.enemyShootChance = 0.001;
        this.lastSoundTime = 0;
        this.soundCooldowns = {
            shoot: 250,
            explosion: 200,
            powerUp: 300
        };
        this.currentLevel = 1;
        this.maxLevel = 10;
        this.levelStarting = false;
        this.countdownValue = 3;
        this.barriers = this.createBarriers();
        this.ufoSpawnTimer = 0;
        this.ufo = null;
    }

    createBarriers() {
        const barriers = [];
        const barrierCount = 4;
        const barrierWidth = 60;
        const barrierHeight = 40;
        const spacing = (canvas.width - (barrierCount * barrierWidth)) / (barrierCount + 1);
        
        for (let i = 0; i < barrierCount; i++) {
            const x = spacing + i * (barrierWidth + spacing);
            const y = canvas.height - 150;
            barriers.push({
                x,
                y,
                width: barrierWidth,
                height: barrierHeight,
                grid: this.createBarrierGrid()
            });
        }
        return barriers;
    }

    createBarrierGrid() {
        const grid = [];
        const shape = [
            "XXXXXXXXXX",
            "XXXXXXXXXX",
            "XXXXXXXXXX",
            "XXXXXXXXXX",
            "XXXXXXXXXX",
            "XXX    XXX",
            "XX      XX"
        ];

        for (let y = 0; y < shape.length; y++) {
            const row = [];
            for (let x = 0; x < shape[y].length; x++) {
                // Her blok için sağlamlık değeri ekle (1-3 arası)
                row.push(shape[y][x] === 'X' ? 3 : 0);
            }
            grid.push(row);
        }
        return grid;
    }

    drawBarriers() {
        this.barriers.forEach(barrier => {
            const blockSize = barrier.width / 10;
            
            barrier.grid.forEach((row, rowIndex) => {
                row.forEach((block, colIndex) => {
                    if (block > 0) {
                        // Sağlamlık seviyesine göre renk değiştir
                        switch(block) {
                            case 3:
                                ctx.fillStyle = '#00ff00'; // Tam sağlam
                                break;
                            case 2:
                                ctx.fillStyle = '#008800'; // Orta hasarlı
                                break;
                            case 1:
                                ctx.fillStyle = '#004400'; // Çok hasarlı
                                break;
                        }
                        ctx.fillRect(
                            barrier.x + colIndex * blockSize,
                            barrier.y + rowIndex * blockSize,
                            blockSize,
                            blockSize
                        );
                    }
                });
            });
        });
    }

    damageBarrier(barrier, x, y) {
        const blockSize = barrier.width / 10;
        const relativeX = x - barrier.x;
        const relativeY = y - barrier.y;
        
        const gridX = Math.floor(relativeX / blockSize);
        const gridY = Math.floor(relativeY / blockSize);
        
        // Mermi çarpma noktasındaki bloğa hasar ver
        if (gridY >= 0 && gridY < barrier.grid.length &&
            gridX >= 0 && gridX < barrier.grid[0].length) {
            
            // Eğer blok varsa hasar ver
            if (barrier.grid[gridY][gridX] > 0) {
                barrier.grid[gridY][gridX]--;
                
                // Çevredeki bloklara rastgele hasar ver
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const ny = gridY + dy;
                        const nx = gridX + dx;
                        if (ny >= 0 && ny < barrier.grid.length &&
                            nx >= 0 && nx < barrier.grid[0].length &&
                            barrier.grid[ny][nx] > 0 &&
                            Math.random() < 0.2) { // %20 şansla çevre bloklara hasar
                            barrier.grid[ny][nx] = Math.max(1, barrier.grid[ny][nx] - 1);
                        }
                    }
                }
                return true; // Hasar verildi
            }
        }
        return false; // Hasar verilemedi
    }

    spawnUFO() {
        if (!this.ufo && Math.random() < 0.001) {
            const direction = Math.random() < 0.5 ? 1 : -1;
            const x = direction === 1 ? -50 : canvas.width + 50;
            this.ufo = {
                x: x,
                y: 30,
                width: 40,
                height: 20,
                speed: 3 * direction,
                points: Math.floor(Math.random() * 3 + 1) * 50
            };
        }
    }

    updateUFO() {
        if (this.ufo) {
            this.ufo.x += this.ufo.speed;
            
            // UFO ekrandan çıktı mı kontrol et
            if (this.ufo.x < -100 || this.ufo.x > canvas.width + 100) {
                this.ufo = null;
            }
        }
    }

    drawUFO() {
        if (this.ufo) {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.ellipse(
                this.ufo.x + this.ufo.width / 2,
                this.ufo.y + this.ufo.height / 2,
                this.ufo.width / 2,
                this.ufo.height / 2,
                0, 0, Math.PI * 2
            );
            ctx.fill();
        }
    }

    reset() {
        this.player = new Player();
        this.projectiles = [];
        this.enemies = [];
        this.powerUps = [];
        this.enemyProjectiles = [];
        this.keys = {};
        this.score = this.score || 0;
        this.gameOver = false;
        this.enemyRows = Math.min(3 + Math.floor((this.currentLevel - 1) / 2), 6);
        this.enemyCols = 11;
        this.enemyPadding = 50;
        scoreEl.textContent = this.score;
        livesEl.textContent = this.player.lives;
        shieldEl.textContent = this.player.shield + '%';
        weaponEl.textContent = this.player.weaponType;
        this.initEnemies();
    }

    initEnemies() {
        const startX = (canvas.width - (this.enemyCols * this.enemyPadding)) / 2;
        for (let row = 0; row < this.enemyRows; row++) {
            for (let col = 0; col < this.enemyCols; col++) {
                const x = startX + col * this.enemyPadding;
                const y = row * 50 + 50;
                this.enemies.push(new Enemy(x, y, row % 3, this.currentLevel));
            }
        }
    }

    startLevel() {
        this.levelStarting = true;
        this.countdownValue = 3;
        
        // Reset positions for new level
        this.player.x = canvas.width / 2 - this.player.width / 2;
        this.player.y = canvas.height - this.player.height - 20;
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.powerUps = [];
        this.enemies = [];
        this.initEnemies();
        
        const countdown = () => {
            if (this.countdownValue > 0) {
                setTimeout(() => {
                    this.countdownValue--;
                    countdown();
                }, 1000);
            } else {
                this.levelStarting = false;
            }
        };
        
        countdown();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (!this.gameStarted) return;
            this.keys[e.key] = true;
            if (e.key === ' ') {
                this.shoot();
            }
            if (e.key.toLowerCase() === 's') {
                this.player.activateShield();
            }
            if (e.key.toLowerCase() === 'w') {
                this.player.changeWeapon();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        startButton.addEventListener('click', () => {
            if (!this.gameStarted || this.gameOver) {
                this.gameStarted = true;
                this.gameOver = false;
                this.reset();
                startButton.textContent = 'RESTART';
            }
        });
    }

    playGameSound(sound, type) {
        const currentTime = Date.now();
        const cooldown = this.soundCooldowns[type] || 200;
        
        // Belirtilen süre kadar bekle
        if (currentTime - this.lastSoundTime >= cooldown) {
            playSound(sound);
            this.lastSoundTime = currentTime;
        }
    }

    shoot() {
        switch(this.player.weaponType) {
            case 'NORMAL':
                this.projectiles.push(new Projectile(
                    this.player.x + this.player.width / 2 - 2,
                    this.player.y
                ));
                break;
            case 'DOUBLE':
                this.projectiles.push(
                    new Projectile(this.player.x + 10, this.player.y),
                    new Projectile(this.player.x + this.player.width - 10, this.player.y)
                );
                break;
            case 'TRIPLE':
                this.projectiles.push(
                    new Projectile(this.player.x + this.player.width / 2 - 2, this.player.y),
                    new Projectile(this.player.x + 5, this.player.y + 5),
                    new Projectile(this.player.x + this.player.width - 5, this.player.y + 5)
                );
                break;
        }
        this.playGameSound(shootSound, 'shoot');
    }

    checkCollisions() {
        // Bariyer çarpışmalarını kontrol et (hem oyuncu hem düşman mermileri için)
        [...this.projectiles, ...this.enemyProjectiles].forEach(projectile => {
            if (this.checkBarrierCollisions(projectile, this.projectiles.includes(projectile))) {
                return; // Mermi bariyere çarptıysa diğer kontrolleri yapma
            }
        });

        // Düşman-mermi çarpışması
        this.projectiles.forEach((projectile, projectileIndex) => {
            if (projectile.toRemove) return; // Eğer mermi zaten bariyere çarptıysa kontrol etme
            
            this.enemies.forEach((enemy, enemyIndex) => {
                if (
                    projectile.x < enemy.x + enemy.width &&
                    projectile.x + projectile.width > enemy.x &&
                    projectile.y < enemy.y + enemy.height &&
                    projectile.y + projectile.height > enemy.y
                ) {
                    this.explosions.push(new Explosion(
                        enemy.x + enemy.width / 2,
                        enemy.y + enemy.height / 2,
                        '255, 100, 0'
                    ));
                    
                    // Power-up oluşturma şansı
                    if (Math.random() < this.powerUpChance) {
                        const types = ['shield', 'weapon', 'life'];
                        const type = types[Math.floor(Math.random() * types.length)];
                        this.powerUps.push(new PowerUp(
                            enemy.x + enemy.width / 2,
                            enemy.y,
                            type
                        ));
                    }

                    this.playGameSound(explosionSound, 'explosion');
                    this.enemies.splice(enemyIndex, 1);
                    this.projectiles.splice(projectileIndex, 1);
                    this.score += 100;
                    scoreEl.textContent = this.score;
                    
                    if (this.score > highScore) {
                        highScore = this.score;
                        highScoreEl.textContent = highScore;
                        localStorage.setItem('highScore', highScore);
                    }
                }
            });
        });

        // Power-up çarpışması
        this.powerUps.forEach((powerUp, index) => {
            if (
                this.player.x < powerUp.x + powerUp.width &&
                this.player.x + this.player.width > powerUp.x &&
                this.player.y < powerUp.y + powerUp.height &&
                this.player.y + this.player.height > powerUp.y
            ) {
                this.playGameSound(powerUpSound, 'powerUp');
                switch(powerUp.type) {
                    case 'shield':
                        this.player.shield = Math.min(100, this.player.shield + 50);
                        shieldEl.textContent = this.player.shield + '%';
                        break;
                    case 'weapon':
                        this.player.changeWeapon();
                        break;
                    case 'life':
                        this.player.lives++;
                        livesEl.textContent = this.player.lives;
                        break;
                }
                this.powerUps.splice(index, 1);
            }
        });

        // Düşman mermisi çarpışması
        this.enemyProjectiles.forEach((projectile, index) => {
            if (
                !this.player.isInvulnerable &&
                projectile.x < this.player.x + this.player.width &&
                projectile.x + projectile.width > this.player.x &&
                projectile.y < this.player.y + this.player.height &&
                projectile.y + projectile.height > this.player.y
            ) {
                this.player.hit();
                this.enemyProjectiles.splice(index, 1);
                if (this.player.lives <= 0) {
                    this.gameOver = true;
                }
            }
        });

        // Düşman-oyuncu çarpışması
        this.enemies.forEach(enemy => {
            if (
                this.player.x < enemy.x + enemy.width &&
                this.player.x + this.player.width > enemy.x &&
                this.player.y < enemy.y + enemy.height &&
                this.player.y + this.player.height > enemy.y
            ) {
                this.player.hit();
                if (this.player.lives <= 0) {
                    this.gameOver = true;
                }
            }
        });
    }

    checkEnemyMovement() {
        let hitEdge = false;
        this.enemies.forEach(enemy => {
            if (
                (enemy.x + enemy.width >= canvas.width && enemy.direction > 0) ||
                (enemy.x <= 0 && enemy.direction < 0)
            ) {
                hitEdge = true;
            }
        });

        if (hitEdge) {
            this.enemies.forEach(enemy => {
                enemy.direction *= -1;
                enemy.y += 20;
            });
        }
    }

    drawBackground() {
        // Uzay arka planı
        ctx.fillStyle = '#0B1026';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Yıldızlar
        this.stars.forEach(star => {
            star.update();
            star.draw();
        });
    }

    drawLevelInfo() {
        ctx.fillStyle = '#fff';
        ctx.font = '40px "Press Start 2P"';
        ctx.textAlign = 'center';
        
        if (this.countdownValue > 0) {
            ctx.fillText(this.countdownValue.toString(), canvas.width / 2, canvas.height / 2);
        } else {
            ctx.fillText('GO!', canvas.width / 2, canvas.height / 2);
        }
        
        ctx.font = '20px "Press Start 2P"';
        ctx.fillText(`LEVEL ${this.currentLevel}`, canvas.width / 2, canvas.height / 2 - 60);
    }

    update() {
        this.drawBackground();

        if (!this.gameStarted) {
            ctx.fillStyle = '#fff';
            ctx.font = '30px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText('SPACE INVADERS', canvas.width / 2, canvas.height / 2);
            ctx.font = '16px "Press Start 2P"';
            ctx.fillText('Click START to play', canvas.width / 2, canvas.height / 2 + 50);
            requestAnimationFrame(() => this.update());
            return;
        }

        if (this.gameOver) {
            ctx.fillStyle = '#f00';
            ctx.font = '40px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
            requestAnimationFrame(() => this.update());
            return;
        }

        if (this.levelStarting) {
            this.drawLevelInfo();
            requestAnimationFrame(() => this.update());
            return;
        }

        // Draw barriers
        this.drawBarriers();

        // Spawn and update UFO
        this.spawnUFO();
        this.updateUFO();
        this.drawUFO();

        this.player.update(this.keys);
        this.player.draw();

        // Update and check projectiles
        this.projectiles.forEach((projectile, index) => {
            projectile.update();
            
            // Check UFO collision
            if (this.ufo && this.checkCollisions(projectile, this.ufo)) {
                this.score += this.ufo.points;
                scoreEl.textContent = this.score;
                this.explosions.push(new Explosion(this.ufo.x + this.ufo.width/2, this.ufo.y + this.ufo.height/2, '#ff0000'));
                this.ufo = null;
                projectile.toRemove = true;
                this.playGameSound(explosionSound, 'explosion');
            }
            
            this.checkBarrierCollisions(projectile, true);
            if (projectile.toRemove || projectile.y < 0) {
                this.projectiles.splice(index, 1);
            } else {
                projectile.draw();
            }
        });

        this.enemyProjectiles.forEach((projectile, index) => {
            projectile.update();
            this.checkBarrierCollisions(projectile, false);
            if (projectile.toRemove || projectile.y > canvas.height) {
                this.enemyProjectiles.splice(index, 1);
            } else {
                projectile.draw();
            }
        });

        // Check if all enemies are destroyed
        if (this.enemies.length === 0 && !this.levelStarting) {
            if (this.currentLevel < this.maxLevel) {
                this.currentLevel++;
                this.startLevel();
            } else {
                ctx.fillStyle = '#0f0';
                ctx.font = '40px "Press Start 2P"';
                ctx.textAlign = 'center';
                ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2);
            }
            requestAnimationFrame(() => this.update());
            return;
        }

        this.enemies.forEach(enemy => {
            enemy.update();
            enemy.draw();

            if (Math.random() < this.enemyShootChance && enemy.y > canvas.height * 0.3) {
                this.enemyProjectiles.push(new EnemyProjectile(
                    enemy.x + enemy.width / 2,
                    enemy.y + enemy.height
                ));
            }
        });

        this.powerUps.forEach((powerUp, index) => {
            powerUp.update();
            powerUp.draw();
            if (powerUp.y > canvas.height) {
                this.powerUps.splice(index, 1);
            }
        });

        this.explosions.forEach((explosion, index) => {
            explosion.update();
            explosion.draw();
            if (explosion.particles.length === 0) {
                this.explosions.splice(index, 1);
            }
        });

        this.checkCollisions();
        this.checkEnemyMovement();

        requestAnimationFrame(() => this.update());
    }

    checkBarrierCollisions(projectile, isPlayerProjectile) {
        for (let barrier of this.barriers) {
            // Mermi bariyerin alanı içinde mi kontrol et
            if (projectile.x < barrier.x + barrier.width &&
                projectile.x + projectile.width > barrier.x &&
                projectile.y < barrier.y + barrier.height &&
                projectile.y + projectile.height > barrier.y) {
                
                // Çarpışma noktasındaki bloğu bul
                const blockSize = barrier.width / 10;
                const relativeX = projectile.x - barrier.x;
                const relativeY = projectile.y - barrier.y;
                const gridX = Math.floor(relativeX / blockSize);
                const gridY = Math.floor(relativeY / blockSize);

                // Hasar yarıçapı ve şiddetini ayarla
                const damageRadius = 2; // Daha geniş hasar alanı
                const centerDamage = 2; // Merkezdeki hasar miktarı
                let hasHitBlock = false;

                // Hasar yarıçapı içindeki tüm bloklara hasar ver
                for (let dy = -damageRadius; dy <= damageRadius; dy++) {
                    for (let dx = -damageRadius; dx <= damageRadius; dx++) {
                        const ny = gridY + dy;
                        const nx = gridX + dx;
                        
                        // Blok koordinatları geçerli mi ve blok var mı kontrol et
                        if (ny >= 0 && ny < barrier.grid.length &&
                            nx >= 0 && nx < barrier.grid[0].length &&
                            barrier.grid[ny][nx] > 0) {
                            
                            // Merkezden uzaklığa göre hasar hesapla
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance <= damageRadius) {
                                // Merkeze yakın bloklar daha çok hasar alır
                                const damage = Math.ceil(centerDamage * (1 - distance / (damageRadius + 1)));
                                
                                // Rastgele ek hasar şansı
                                const randomDamage = Math.random() < 0.4 ? 1 : 0; // %40 şansla ekstra hasar
                                
                                // Toplam hasarı uygula
                                barrier.grid[ny][nx] = Math.max(0, barrier.grid[ny][nx] - (damage + randomDamage));
                                hasHitBlock = true;
                            }
                        }
                    }
                }

                if (hasHitBlock) {
                    // Mermiyi yok et ve patlama efekti ekle
                    projectile.toRemove = true;
                    
                    // Ana patlama efekti
                    this.explosions.push(new Explosion(
                        projectile.x,
                        projectile.y,
                        isPlayerProjectile ? '#00ff00' : '#ff0000'
                    ));
                    
                    // Ek küçük patlama efektleri
                    for (let i = 0; i < 2; i++) {
                        const offsetX = (Math.random() - 0.5) * 20;
                        const offsetY = (Math.random() - 0.5) * 20;
                        this.explosions.push(new Explosion(
                            projectile.x + offsetX,
                            projectile.y + offsetY,
                            isPlayerProjectile ? '#00ff00' : '#ff0000'
                        ));
                    }
                    
                    // Ses efekti ekle
                    this.playGameSound(explosionSound, 'explosion');
                    
                    return true;
                }
            }
        }
        return false;
    }
}

const game = new Game();
game.update();
