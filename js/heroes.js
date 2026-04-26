class Hero {
    constructor(element, x, y, level = 1, isMerged = false, mergedType = null) {
        this.element = element;
        this.x = x;
        this.y = y;
        this.level = level;
        this.isMerged = isMerged;
        this.mergedType = mergedType;
        
        this.config = this.getConfig();
        this.lastAttack = 0;
        this.alive = true;
    }

    getConfig() {
        if (this.isMerged && this.mergedType && MERGED_ELEMENTS[this.mergedType]) {
            return MERGED_ELEMENTS[this.mergedType];
        }
        return ELEMENTS[this.element] || ELEMENTS.FIRE;
    }

    getDamage() {
        const levelMultiplier = HERO_LEVELS[`L${this.level}`]?.multiplier || 1;
        return this.config.damage * levelMultiplier;
    }

    getRange() {
        const levelBonus = HERO_LEVELS[`L${this.level}`]?.rangeBonus || 0;
        return (this.config.range + levelBonus) * BLOCK_SIZE;
    }

    getAttackSpeed() {
        return this.config.attackSpeed || 1000;
    }

    getEffect() {
        return this.config.effect;
    }

    getColor() {
        return this.config.color;
    }

    getSymbol() {
        return this.config.symbol;
    }

    canAttack(currentTime) {
        return currentTime - this.lastAttack >= this.getAttackSpeed();
    }

    attack(currentTime) {
        this.lastAttack = currentTime;
    }

    upgrade() {
        if (this.level < 3) {
            this.level++;
            return true;
        }
        return false;
    }
}

class HeroSystem {
    constructor() {
        this.heroes = [];
        this.board = [];
        this.heroBoard = [];
    }

    reset() {
        this.heroes = [];
        this.board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        this.heroBoard = Array(ROWS).fill().map(() => Array(COLS).fill(null));
    }

    addHeroFromPiece(piece) {
        const heroes = [];
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardX = piece.x + x;
                    const boardY = piece.y + y;
                    
                    if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                        const hero = new Hero(
                            piece.element,
                            boardX,
                            boardY,
                            1,
                            piece.isMerged,
                            piece.mergedType
                        );
                        
                        this.heroes.push(hero);
                        this.board[boardY][boardX] = piece.isMerged ? piece.mergedType : (piece.colorIndex + 1);
                        this.heroBoard[boardY][boardX] = hero;
                        heroes.push(hero);
                    }
                }
            }
        }
        
        return heroes;
    }

    convertBoardToHeroes(elementsBoard) {
        this.heroes = [];
        this.board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        this.heroBoard = Array(ROWS).fill().map(() => Array(COLS).fill(null));

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const elementData = elementsBoard[y][x];
                if (elementData) {
                    const hero = new Hero(
                        elementData.element || 'FIRE',
                        x,
                        y,
                        1,
                        elementData.isMerged || false,
                        elementData.mergedType || null
                    );
                    
                    this.heroes.push(hero);
                    this.board[y][x] = elementData.isMerged ? elementData.mergedType : 1;
                    this.heroBoard[y][x] = hero;
                }
            }
        }
    }

    checkAndMerge(enableHeroMerge = false) {
        const mergedHeroes = [];
        let hasMerge = true;

        while (hasMerge) {
            hasMerge = false;

            for (let y = ROWS - 1; y >= 0; y--) {
                for (let x = 0; x < COLS; x++) {
                    const hero = this.heroBoard[y][x];
                    if (!hero || hero.level >= 3) continue;

                    const adjacentSame = this.findAdjacentSameHeroes(x, y, hero.element, hero.level);
                    
                    if (adjacentSame.length >= 2) {
                        const allHeroes = [hero, ...adjacentSame];
                        this.mergeHeroes(allHeroes);
                        hasMerge = true;
                        mergedHeroes.push({
                            x,
                            y,
                            element: hero.element,
                            fromLevel: hero.level,
                            toLevel: hero.level + 1
                        });
                        playSound('merge');
                    }
                }
            }

            if (hasMerge) {
                this.applyGravity();
            }
        }

        return mergedHeroes;
    }

    findAdjacentSameHeroes(x, y, element, level) {
        const adjacent = [];
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1]
        ];

        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
                const hero = this.heroBoard[ny][nx];
                if (hero && hero.element === element && hero.level === level && !adjacent.includes(hero)) {
                    adjacent.push(hero);
                }
            }
        }

        return adjacent;
    }

    mergeHeroes(heroes) {
        if (heroes.length < 3) return;

        const targetHero = heroes[0];
        const newLevel = targetHero.level + 1;

        heroes.forEach(hero => {
            this.heroes = this.heroes.filter(h => h !== hero);
            this.board[hero.y][hero.x] = 0;
            this.heroBoard[hero.y][hero.x] = null;
        });

        targetHero.level = newLevel;
        this.heroes.push(targetHero);
        this.board[targetHero.y][targetHero.x] = newLevel;
        this.heroBoard[targetHero.y][targetHero.x] = targetHero;
    }

    applyGravity() {
        for (let x = 0; x < COLS; x++) {
            let writePos = ROWS - 1;
            
            for (let y = ROWS - 1; y >= 0; y--) {
                if (this.heroBoard[y][x]) {
                    if (y !== writePos) {
                        const hero = this.heroBoard[y][x];
                        hero.y = writePos;
                        
                        this.heroBoard[writePos][x] = hero;
                        this.board[writePos][x] = this.board[y][x];
                        
                        this.heroBoard[y][x] = null;
                        this.board[y][x] = 0;
                    }
                    writePos--;
                }
            }
        }
    }

    getHeroesInRange(enemyX, enemyY) {
        const inRange = [];

        for (const hero of this.heroes) {
            if (!hero.alive) continue;

            const heroPixelX = hero.x * BLOCK_SIZE + BLOCK_SIZE / 2;
            const heroPixelY = hero.y * BLOCK_SIZE + BLOCK_SIZE / 2;
            
            const distance = Math.sqrt(
                Math.pow(heroPixelX - enemyX, 2) +
                Math.pow(heroPixelY - enemyY, 2)
            );

            if (distance <= hero.getRange()) {
                inRange.push(hero);
            }
        }

        return inRange;
    }

    update(currentTime, enemyManager, stats) {
        const kills = [];
        const damageDealt = 0;

        for (const hero of this.heroes) {
            if (!hero.alive || !hero.canAttack(currentTime)) continue;

            const heroPixelX = hero.x * BLOCK_SIZE + BLOCK_SIZE / 2;
            const heroPixelY = hero.y * BLOCK_SIZE + BLOCK_SIZE / 2;

            const enemiesInRange = enemyManager.getEnemiesInRange(
                heroPixelX,
                heroPixelY,
                hero.getRange()
            );

            if (enemiesInRange.length > 0) {
                const targetEnemy = enemiesInRange[0];
                hero.attack(currentTime);

                const damage = hero.getDamage();
                const killed = targetEnemy.takeDamage(damage);

                const effect = hero.getEffect();
                if (effect) {
                    const effectDurations = {
                        slow: 2000,
                        stun: 1000,
                        burn: 3000,
                        poison: 4000,
                        trap: 2500
                    };
                    const burnDamage = effect === 'burn' || effect === 'poison' ? damage * 0.2 : 0;
                    targetEnemy.applyEffect(effect, effectDurations[effect] || 1000, {
                        damage: burnDamage
                    });
                }

                if (killed) {
                    kills.push(targetEnemy);
                    playSound('kill');
                } else {
                    playSound('attack');
                }
            }
        }

        return { kills, damageDealt };
    }

    draw(ctx, currentTime) {
        for (const hero of this.heroes) {
            if (!hero.alive) continue;

            const x = hero.x * BLOCK_SIZE;
            const y = hero.y * BLOCK_SIZE;
            const centerX = x + BLOCK_SIZE / 2;
            const centerY = y + BLOCK_SIZE / 2;

            ctx.strokeStyle = hero.getColor() + '40';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, hero.getRange(), 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = hero.getColor();
            ctx.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(x + 3, y + 3, BLOCK_SIZE - 8, BLOCK_SIZE - 8);

            ctx.fillStyle = '#fff';
            ctx.font = `${12 + hero.level * 2}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(hero.getSymbol(), centerX, centerY);

            if (hero.level > 1) {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 8px "Courier New"';
                ctx.fillText(`Lv${hero.level}`, centerX, centerY + 14);
            }

            if (hero.isMerged) {
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
            }
        }
    }
}
