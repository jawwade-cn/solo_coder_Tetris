class TowerManager {
    constructor(elementSystem, enemyManager) {
        this.elementSystem = elementSystem;
        this.enemyManager = enemyManager;
        this.towers = [];
        this.attackAnimations = [];
    }

    reset() {
        this.towers = [];
        this.attackAnimations = [];
    }

    addTower(tower) {
        this.towers.push(tower);
    }

    addTowers(towers) {
        this.towers.push(...towers);
    }

    update(currentTime, stats) {
        const aliveEnemies = this.enemyManager.getAliveEnemies();
        const damageDealt = 0;
        const kills = [];

        for (const tower of this.towers) {
            if (currentTime - tower.lastAttack < tower.attackCooldown) continue;

            const towerPixelX = tower.x * BLOCK_SIZE + BLOCK_SIZE / 2;
            const towerPixelY = tower.y * BLOCK_SIZE + BLOCK_SIZE / 2;
            const rangePixels = tower.range * BLOCK_SIZE * 2;

            let nearestEnemy = null;
            let nearestDistance = Infinity;

            for (const enemy of aliveEnemies) {
                if (!enemy.alive) continue;

                const distance = Math.sqrt(
                    Math.pow(enemy.x - towerPixelX, 2) +
                    Math.pow(enemy.y - towerPixelY, 2)
                );

                if (distance <= rangePixels && distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestEnemy = enemy;
                }
            }

            if (nearestEnemy) {
                tower.lastAttack = currentTime;
                const killed = nearestEnemy.takeDamage(tower.damage);

                this.attackAnimations.push({
                    fromX: towerPixelX,
                    fromY: towerPixelY,
                    toX: nearestEnemy.x,
                    toY: nearestEnemy.y,
                    color: tower.color,
                    startTime: currentTime,
                    duration: 200
                });

                if (tower.effect) {
                    const effectDurations = {
                        slow: 2000,
                        stun: 1000,
                        burn: 3000,
                        trap: 2500,
                        blind: 1500
                    };

                    const burnDamage = tower.effect === 'burn' ? tower.damage * 0.2 : 0;
                    nearestEnemy.applyEffect(tower.effect, effectDurations[tower.effect] || 1000, {
                        damage: burnDamage
                    });
                }

                if (killed) {
                    kills.push(nearestEnemy);
                    playSound('kill');
                } else {
                    playSound('attack');
                }
            }
        }

        return { damageDealt, kills };
    }

    updateAnimations(currentTime) {
        this.attackAnimations = this.attackAnimations.filter(anim => {
            return currentTime - anim.startTime < anim.duration;
        });
    }

    draw(ctx, currentTime) {
        this.elementSystem.elementBoard.forEach((row, y) => {
            row.forEach((tower, x) => {
                if (tower) {
                    const towerPixelX = x * BLOCK_SIZE + BLOCK_SIZE / 2;
                    const towerPixelY = y * BLOCK_SIZE + BLOCK_SIZE / 2;
                    const rangePixels = tower.range * BLOCK_SIZE * 2;

                    ctx.strokeStyle = tower.color + '40';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(towerPixelX, towerPixelY, rangePixels, 0, Math.PI * 2);
                    ctx.stroke();

                    ctx.fillStyle = tower.color;
                    ctx.beginPath();
                    ctx.arc(towerPixelX, towerPixelY, BLOCK_SIZE / 2 - 2, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#fff';
                    ctx.font = '10px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    const elementSymbol = {
                        FIRE: '🔥',
                        WATER: '💧',
                        EARTH: '🌍',
                        MOLTEN: '🌋',
                        TSUNAMI: '🌊',
                        QUAKE: '⛰️',
                        STEAM: '💨',
                        LAVA: '🔥',
                        MUD: '🟤'
                    };

                    const symbol = tower.isMerged 
                        ? elementSymbol[tower.mergedType] 
                        : elementSymbol[tower.element];
                    ctx.fillText(symbol || '?', towerPixelX, towerPixelY);

                    ctx.fillStyle = '#00d4ff';
                    ctx.font = '8px "Courier New"';
                    ctx.fillText(tower.damage, towerPixelX, towerPixelY + 12);
                }
            });
        });

        for (const anim of this.attackAnimations) {
            const progress = (currentTime - anim.startTime) / anim.duration;
            const alpha = 1 - progress;

            ctx.strokeStyle = anim.color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(anim.fromX, anim.fromY);
            ctx.lineTo(
                anim.fromX + (anim.toX - anim.fromX) * progress,
                anim.fromY + (anim.toY - anim.fromY) * progress
            );
            ctx.stroke();
            ctx.globalAlpha = 1;

            ctx.fillStyle = anim.color;
            ctx.globalAlpha = alpha * 0.8;
            ctx.beginPath();
            ctx.arc(
                anim.fromX + (anim.toX - anim.fromX) * progress,
                anim.fromY + (anim.toY - anim.fromY) * progress,
                4,
                0,
                Math.PI * 2
            );
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
}
