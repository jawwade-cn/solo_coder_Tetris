class Enemy {
    constructor(type, column, gameCanvas = null) {
        this.type = type;
        this.config = ENEMY_TYPES[type];
        
        this.column = column;
        this.x = column * BLOCK_SIZE + BLOCK_SIZE / 2;
        this.y = -BLOCK_SIZE;
        
        this.canvasWidth = gameCanvas ? gameCanvas.width : 200;
        this.canvasHeight = gameCanvas ? gameCanvas.height : 400;
        
        this.hp = this.config.hp;
        this.maxHp = this.config.hp;
        this.speed = this.config.speed;
        this.baseSpeed = this.config.speed;
        this.color = this.config.color;
        this.reward = this.config.reward;
        this.damage = this.config.damage;
        
        this.alive = true;
        this.spawned = true;
        this.spawnTime = Date.now();

        this.effects = {
            slow: { active: false, endTime: 0 },
            stun: { active: false, endTime: 0 },
            burn: { active: false, endTime: 0, damage: 0 },
            poison: { active: false, endTime: 0, damage: 0 },
            trap: { active: false, endTime: 0 }
        };

        this.size = type === 'BOSS' ? 30 : 18;
        this.animOffset = Math.random() * Math.PI * 2;
    }

    update(deltaTime) {
        if (!this.alive) return false;

        this.updateEffects();

        if (this.effects.stun.active) return false;

        let currentSpeed = this.baseSpeed;
        if (this.effects.slow.active) {
            currentSpeed *= 0.5;
        }
        if (this.effects.trap.active) {
            currentSpeed *= 0.3;
        }

        this.y += currentSpeed * BLOCK_SIZE * (deltaTime / 1000);

        if (this.effects.burn.active) {
            this.takeDamage(this.effects.burn.damage * deltaTime / 1000);
        }
        if (this.effects.poison.active) {
            this.takeDamage(this.effects.poison.damage * deltaTime / 1000);
        }

        if (this.y >= this.canvasHeight) {
            return true;
        }

        return false;
    }

    updateEffects() {
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

    draw(ctx) {
        if (!this.alive) return;

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
        ctx.font = `bold ${size / 2}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.config.symbol || '?', 0, 0);

        const hpBarWidth = size + 10;
        const hpBarHeight = 5;
        const hpPercent = this.hp / this.maxHp;

        ctx.fillStyle = '#333';
        ctx.fillRect(-hpBarWidth / 2, -size / 2 - 10, hpBarWidth, hpBarHeight);

        ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.25 ? '#FF9800' : '#F44336';
        ctx.fillRect(-hpBarWidth / 2, -size / 2 - 10, hpBarWidth * hpPercent, hpBarHeight);

        let effectY = size / 2 + 5;
        if (this.effects.slow.active) {
            ctx.fillStyle = '#4ECDC4';
            ctx.font = '10px sans-serif';
            ctx.fillText('❄️', 0, effectY);
            effectY += 12;
        }
        if (this.effects.stun.active) {
            ctx.fillStyle = '#FFD700';
            ctx.fillText('💫', 0, effectY);
        }
        if (this.effects.burn.active || this.effects.poison.active) {
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
        this.waveEscaped = 0;
        this.canvas = null;
    }

    reset() {
        this.enemies = [];
        this.wave = 0;
        this.totalEnemiesKilled = 0;
        this.totalEnemiesSpawned = 0;
        this.waveEnemies = 0;
        this.waveKills = 0;
        this.waveEscaped = 0;
    }

    setCanvas(canvas) {
        this.canvas = canvas;
    }

    startWave(level, waveNum) {
        this.wave = waveNum;
        this.waveEnemies = 0;
        this.waveKills = 0;
        this.waveEscaped = 0;

        const enemyTypes = level.battle?.enemyTypes || ['BASIC'];
        const enemiesPerWave = level.battle?.enemiesPerWave || 5;
        const speedMultiplier = level.battle?.enemySpeedMultiplier || 1;
        const isBossWave = level.battle?.bossWave === waveNum;

        for (let i = 0; i < enemiesPerWave; i++) {
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            const column = Math.floor(Math.random() * COLS);
            const delay = i * 500;

            if (isBossWave && i === enemiesPerWave - 1) {
                const boss = new Enemy('BOSS', column, this.canvas);
                boss.hp *= 1.5;
                boss.maxHp = boss.hp;
                this.enemies.push({ enemy: boss, spawnDelay: delay, spawnTime: Date.now() });
            } else {
                this.enemies.push({ enemy: new Enemy(type, column, this.canvas), spawnDelay: delay, spawnTime: Date.now() });
            }
            this.waveEnemies++;
            this.totalEnemiesSpawned++;
        }

        playSound('wave');
    }

    update(deltaTime) {
        const killed = [];
        const reached = [];
        const now = Date.now();

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const data = this.enemies[i];
            
            if (data.spawnDelay > 0) {
                if (now - data.spawnTime < data.spawnDelay) {
                    continue;
                } else {
                    data.spawnDelay = 0;
                }
            }

            const enemy = data.enemy;
            const reachedBottom = enemy.update(deltaTime);

            if (!enemy.alive) {
                killed.push(enemy);
                this.enemies.splice(i, 1);
                this.totalEnemiesKilled++;
                this.waveKills++;
            } else if (reachedBottom) {
                reached.push(enemy);
                this.enemies.splice(i, 1);
                this.waveEscaped++;
            }
        }

        return { killed, reached };
    }

    getEnemiesInRange(x, y, range) {
        return this.enemies.filter(data => {
            if (data.spawnDelay > 0) return false;
            const enemy = data.enemy;
            if (!enemy.alive) return false;

            const distance = Math.sqrt(
                Math.pow(enemy.x - x, 2) +
                Math.pow(enemy.y - y, 2)
            );
            return distance <= range;
        }).map(data => data.enemy);
    }

    getAliveEnemies() {
        return this.enemies.filter(data => {
            if (data.spawnDelay > 0) return false;
            return data.enemy.alive;
        }).map(data => data.enemy);
    }

    getPendingEnemies() {
        return this.enemies.filter(data => data.spawnDelay > 0);
    }

    isWaveComplete() {
        return (this.waveKills + this.waveEscaped) >= this.waveEnemies && this.enemies.length === 0;
    }

    draw(ctx) {
        this.enemies.forEach(data => {
            if (data.spawnDelay <= 0) {
                data.enemy.draw(ctx);
            }
        });
    }
}
