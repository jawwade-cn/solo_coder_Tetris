class Enemy {
    constructor(type, path, startDelay = 0, gameCanvas = null) {
        this.type = type;
        this.config = ENEMY_TYPES[type];
        this.x = -30;
        this.y = path.y;
        this.baseY = path.y;
        
        const canvasWidth = gameCanvas ? gameCanvas.width : 
                           (window.canvas ? window.canvas.width : 200);
        this.targetX = canvasWidth + 30;
        
        this.hp = this.config.hp;
        this.maxHp = this.config.hp;
        this.speed = this.config.speed;
        this.baseSpeed = this.config.speed;
        this.color = this.config.color;
        this.reward = this.config.reward;
        this.alive = true;
        this.startDelay = startDelay;
        this.spawned = false;
        this.spawnTime = Date.now();

        this.effects = {
            slow: { active: false, duration: 0 },
            stun: { active: false, duration: 0 },
            burn: { active: false, duration: 0, damage: 0 },
            trap: { active: false, duration: 0 },
            blind: { active: false, duration: 0 }
        };

        this.size = type === 'BOSS' ? 40 : 20;
        this.animOffset = Math.random() * Math.PI * 2;
    }

    update(deltaTime) {
        if (!this.spawned) {
            if (Date.now() - this.spawnTime >= this.startDelay) {
                this.spawned = true;
            }
            return;
        }

        if (!this.alive) return;

        this.updateEffects(deltaTime);

        if (this.effects.stun.active) return;

        let currentSpeed = this.baseSpeed;
        if (this.effects.slow.active) {
            currentSpeed *= 0.5;
        }
        if (this.effects.trap.active) {
            currentSpeed *= 0.3;
        }

        this.x += currentSpeed * 2;

        const time = Date.now() / 200;
        this.y = this.baseY + Math.sin(time + this.animOffset) * 10;

        if (this.effects.burn.active) {
            this.takeDamage(this.effects.burn.damage * deltaTime / 1000);
        }
    }

    updateEffects(deltaTime) {
        const now = Date.now();
        for (const effect in this.effects) {
            if (this.effects[effect].active && now >= this.effects[effect].endTime) {
                this.effects[effect].active = false;
            }
        }
    }

    applyEffect(effect, duration = 2000, extraData = {}) {
        this.effects[effect] = {
            active: true,
            duration: duration,
            endTime: Date.now() + duration,
            ...extraData
        };
    }

    takeDamage(damage) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.alive = false;
            return true;
        }
        return false;
    }

    reachedEnd() {
        return this.x >= this.targetX;
    }

    draw(ctx) {
        if (!this.spawned || !this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = this.color;
        const size = this.size;
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#000';
        ctx.font = `bold ${size / 3}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const typeSymbol = {
            BASIC: '👾',
            FAST: '💨',
            TANK: '🛡️',
            BOSS: '👹'
        };
        ctx.fillText(typeSymbol[this.type] || '?', 0, 0);

        const hpBarWidth = size + 10;
        const hpBarHeight = 6;
        const hpPercent = this.hp / this.maxHp;

        ctx.fillStyle = '#333';
        ctx.fillRect(-hpBarWidth / 2, -size / 2 - 12, hpBarWidth, hpBarHeight);

        ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.25 ? '#FF9800' : '#F44336';
        ctx.fillRect(-hpBarWidth / 2, -size / 2 - 12, hpBarWidth * hpPercent, hpBarHeight);

        let effectY = size / 2 + 5;
        if (this.effects.slow.active) {
            ctx.fillStyle = '#4ECDC4';
            ctx.font = '12px sans-serif';
            ctx.fillText('❄️', 0, effectY);
            effectY += 15;
        }
        if (this.effects.stun.active) {
            ctx.fillStyle = '#FFD700';
            ctx.fillText('💫', 0, effectY);
        }
        if (this.effects.burn.active) {
            ctx.fillStyle = '#FF6B6B';
            ctx.fillText('🔥', 0, effectY);
        }

        ctx.restore();
    }
}

class EnemyManager {
    constructor() {
        this.enemies = [];
        this.wave = 0;
        this.totalEnemiesKilled = 0;
        this.totalEnemiesSpawned = 0;
        this.waveEnemies = 0;
        this.waveKills = 0;
        this.canvas = null;
    }

    reset() {
        this.enemies = [];
        this.wave = 0;
        this.totalEnemiesKilled = 0;
        this.totalEnemiesSpawned = 0;
        this.waveEnemies = 0;
        this.waveKills = 0;
    }

    setCanvas(canvas) {
        this.canvas = canvas;
    }

    startWave(level, waveNum) {
        this.wave = waveNum;
        this.waveEnemies = 0;
        this.waveKills = 0;

        const enemyTypes = level.enemyTypes || ['BASIC'];
        const enemiesPerWave = level.enemiesPerWave || 5;

        for (let i = 0; i < enemiesPerWave; i++) {
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            const path = {
                y: 100 + Math.random() * 200
            };
            const delay = i * 800 + Math.random() * 500;

            if (level.bossWave && waveNum === level.bossWave && i === enemiesPerWave - 1) {
                const boss = new Enemy('BOSS', path, delay, this.canvas);
                boss.hp *= 1.5;
                boss.maxHp = boss.hp;
                this.enemies.push(boss);
            } else {
                this.enemies.push(new Enemy(type, path, delay, this.canvas));
            }
            this.waveEnemies++;
            this.totalEnemiesSpawned++;
        }

        playSound('wave');
    }

    update(deltaTime) {
        const killed = [];
        const reached = [];

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime);

            if (!enemy.alive) {
                killed.push(enemy);
                this.enemies.splice(i, 1);
                this.totalEnemiesKilled++;
                this.waveKills++;
            } else if (enemy.reachedEnd()) {
                reached.push(enemy);
                this.enemies.splice(i, 1);
            }
        }

        return { killed, reached };
    }

    getEnemiesInRange(x, y, range) {
        return this.enemies.filter(enemy => {
            if (!enemy.spawned && enemy.alive) {
                const distance = Math.sqrt(
                    Math.pow(enemy.x - x, 2) +
                    Math.pow(enemy.y - y, 2)
                );
                return distance <= range;
            }
            return false;
        });
    }

    getAliveEnemies() {
        return this.enemies.filter(e => e.alive && e.spawned);
    }

    isWaveComplete() {
        return this.waveKills >= this.waveEnemies && this.enemies.length === 0;
    }

    draw(ctx) {
        this.enemies.forEach(enemy => enemy.draw(ctx));
    }
}
