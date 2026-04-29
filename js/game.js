class Game {
    constructor() {
        this.canvas = null;
        this.nextCanvas = null;
        this.renderer = null;
        this.elementSystem = null;
        this.enemyManager = null;
        this.heroSystem = null;
        this.stats = null;
        this.achievementManager = null;

        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.gameInterval = null;
        this.isGameOver = false;
        this.isPaused = false;
        this.isStarted = false;

        this.phase = GAME_PHASES.PREPARATION;
        this.currentLevel = null;
        this.currentWave = 0;
        this.playerHP = 10;
        this.maxPlayerHP = 10;
        this.waveTransition = false;
        this.waveTransitionTime = 0;
        this.phaseTransition = false;
        this.phaseTransitionTime = 0;

        this.preparationTime = 0;
        this.preparationTimeLimit = 60;
        this.preparationPiecesUsed = 0;
        this.preparationPiecesLimit = 30;
        this.energy = 0;
        this.linesCleared = 0;

        this.elementsBoard = [];

        this.lastTime = 0;
        this.gameLoopId = null;

        this.dropCounter = 0;
        this.dropInterval = 1000;
    }

    init(canvas, nextCanvas) {
        this.canvas = canvas;
        this.nextCanvas = nextCanvas;
        
        this.renderer = new GameRenderer(canvas, nextCanvas);
        this.elementSystem = new ElementSystem();
        this.enemyManager = new EnemyManager();
        this.enemyManager.setCanvas(canvas);
        this.heroSystem = new HeroSystem();
        this.stats = new BattleStats();
        this.achievementManager = new AchievementManager();

        this.elementsBoard = Array(ROWS).fill().map(() => Array(COLS).fill(null));

        this.renderer.clear();
    }

    setLevel(levelId) {
        this.currentLevel = getLevelById(levelId);
        if (!this.currentLevel) {
            this.currentLevel = getLevelById(1);
        }

        if (this.currentLevel?.preparation) {
            this.preparationTimeLimit = this.currentLevel.preparation.timeLimit || 60;
            this.preparationPiecesLimit = this.currentLevel.preparation.pieceLimit || 30;
        }
    }

    start() {
        initAudio();
        this.elementSystem.init();
        this.enemyManager.reset();
        this.heroSystem.reset();
        this.stats.reset();

        this.elementsBoard = Array(ROWS).fill().map(() => Array(COLS).fill(null));

        if (!this.currentLevel) {
            this.setLevel(1);
        }

        this.score = 0;
        this.level = 1;
        this.isGameOver = false;
        this.isPaused = false;
        this.isStarted = true;
        this.currentWave = 0;
        this.waveTransition = false;

        this.phase = GAME_PHASES.PREPARATION;
        this.preparationTime = 0;
        this.preparationPiecesUsed = 0;
        this.energy = 0;
        this.linesCleared = 0;
        this.dropCounter = 0;
        this.dropInterval = 1000;

        this.playerHP = this.currentLevel.startHP;
        this.maxPlayerHP = this.currentLevel.startHP;

        this.updateUI();

        this.currentPiece = this.elementSystem.createRandomPiece();
        this.nextPiece = this.elementSystem.createRandomPiece();

        this.lastTime = performance.now();
        this.gameLoopId = requestAnimationFrame((time) => this.update(time));

        this.hideOverlays();
    }

    switchToBattlePhase() {
        if (this.phase !== GAME_PHASES.PREPARATION) return;

        this.phase = GAME_PHASES.BATTLE;

        const convertedBoard = [];
        for (let y = 0; y < ROWS; y++) {
            convertedBoard[y] = [];
            for (let x = 0; x < COLS; x++) {
                const boardValue = this.elementSystem.board[y][x];
                if (boardValue) {
                    const elements = ['FIRE', 'WATER', 'EARTH'];
                    const element = elements[((boardValue - 1) % 3)];
                    convertedBoard[y][x] = {
                        element: element,
                        isMerged: typeof boardValue === 'string',
                        mergedType: typeof boardValue === 'string' ? boardValue : null
                    };
                } else {
                    convertedBoard[y][x] = null;
                }
            }
        }

        this.heroSystem.convertBoardToHeroes(convertedBoard);

        const enableMerge = this.currentLevel?.preparation?.enableHeroMerge || false;
        const merged = this.heroSystem.checkAndMerge(enableMerge);

        if (merged.length > 0) {
            this.stats.addMerges(merged.length);
        }

        this.phaseTransition = true;
        this.phaseTransitionTime = performance.now();

        playSound('wave');
    }

    startWave() {
        if (!this.currentLevel) return;

        this.currentWave++;
        this.stats.startWave(this.currentWave);
        this.enemyManager.startWave(this.currentLevel, this.currentWave);

        this.waveTransition = true;
        this.waveTransitionTime = performance.now();
    }

    update(currentTime) {
        if (!this.isStarted) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (this.phaseTransition) {
            if (currentTime - this.phaseTransitionTime > 2000) {
                this.phaseTransition = false;
                this.startWave();
            }
        }

        if (this.waveTransition) {
            if (currentTime - this.waveTransitionTime > 2000) {
                this.waveTransition = false;
            }
        }

        if (this.phase === GAME_PHASES.PREPARATION) {
            this.updatePreparationPhase(deltaTime, currentTime);
        } else if (this.phase === GAME_PHASES.BATTLE && !this.phaseTransition) {
            this.updateBattlePhase(deltaTime, currentTime);
        }

        this.draw();

        this.gameLoopId = requestAnimationFrame((time) => this.update(time));
    }

    updatePreparationPhase(deltaTime, currentTime) {
        if (this.isPaused || this.isGameOver) return;

        this.preparationTime += deltaTime / 1000;

        if (this.preparationTime >= this.preparationTimeLimit ||
            this.preparationPiecesUsed >= this.preparationPiecesLimit) {
            this.switchToBattlePhase();
            return;
        }

        this.dropCounter += deltaTime;
        
        this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
        
        if (this.dropCounter >= this.dropInterval) {
            if (!this.movePiece(0, 1)) {
                this.lockPiece();
            }
            this.dropCounter = 0;
        }

        this.updateUI();
    }

    updateBattlePhase(deltaTime, currentTime) {
        if (this.isPaused || this.isGameOver || this.waveTransition) return;

        const enemyResult = this.enemyManager.update(deltaTime);
        
        enemyResult.killed.forEach(enemy => {
            this.score += enemy.reward;
            this.stats.addKill(enemy.type);
        });

        enemyResult.reached.forEach(enemy => {
            this.playerHP -= enemy.damage;
            this.stats.addDamageTaken(enemy.damage * 10);
            if (this.playerHP <= 0) {
                this.gameOver(false);
                return;
            }
        });

        const heroResult = this.heroSystem.update(currentTime, this.enemyManager, this.stats);

        if (heroResult.kills.length > 0) {
            heroResult.kills.forEach(enemy => {
                this.score += enemy.reward;
                this.stats.addKill(enemy.type);
            });
        }

        if (this.enemyManager.isWaveComplete()) {
            const totalWaves = this.currentLevel?.battle?.waves || 3;
            if (this.currentWave >= totalWaves) {
                this.gameOver(true);
                return;
            } else {
                this.startWave();
            }
        }

        this.updateUI();
    }

    draw() {
        this.renderer.clear();
        this.renderer.drawGrid();
        
        if (this.phase === GAME_PHASES.PREPARATION) {
            this.renderer.drawBoard(this.elementSystem.board, this.elementSystem.elementBoard);
        } else {
            this.heroSystem.draw(this.renderer.ctx, performance.now());
            this.enemyManager.draw(this.renderer.ctx);
        }

        if (this.phase === GAME_PHASES.PREPARATION) {
            if (this.currentPiece && !this.isGameOver) {
                const ghostY = this.getGhostY();
                this.renderer.drawPiece(this.currentPiece, ghostY);
            }
            this.renderer.drawNextPiece(this.nextPiece);
            this.renderer.drawPreparationPhase(
                this.preparationTime,
                this.preparationTimeLimit,
                this.preparationPiecesUsed,
                this.preparationPiecesLimit,
                this.energy
            );
        } else {
            this.renderer.drawHP(this.playerHP, this.maxPlayerHP);
            this.renderer.drawWaveInfo(
                this.currentWave,
                this.currentLevel?.battle?.waves || 0,
                this.enemyManager.getAliveEnemies().length
            );
        }

        if (this.isPaused) {
            this.renderer.drawPause();
        }

        if (this.phaseTransition) {
            this.renderer.drawPhaseTransition(
                GAME_PHASES.PREPARATION,
                GAME_PHASES.BATTLE
            );
        } else if (this.waveTransition) {
            const isWaveComplete = this.currentWave > 1 && 
                performance.now() - this.waveTransitionTime < 1000;
            this.renderer.drawLevelTransition(
                this.currentLevel, 
                this.currentWave,
                isWaveComplete
            );
        }
    }

    getGhostY() {
        if (!this.currentPiece) return 0;
        
        let ghostY = this.currentPiece.y;
        while (!this.elementSystem.checkCollision(
            this.currentPiece.x, 
            ghostY + 1, 
            this.currentPiece.shape
        )) {
            ghostY++;
        }
        return ghostY;
    }

    movePiece(dx, dy) {
        if (!this.currentPiece || this.isPaused || this.isGameOver) return false;
        if (this.phase !== GAME_PHASES.PREPARATION) return false;

        if (!this.elementSystem.checkCollision(
            this.currentPiece.x + dx, 
            this.currentPiece.y + dy, 
            this.currentPiece.shape
        )) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            if (dy > 0) {
                this.dropCounter = 0;
            }
            playSound('move');
            return true;
        }
        return false;
    }

    rotatePiece() {
        if (!this.currentPiece || this.isPaused || this.isGameOver) return;
        if (this.phase !== GAME_PHASES.PREPARATION) return;

        const rotated = this.currentPiece.rotate();

        if (!this.elementSystem.checkCollision(this.currentPiece.x, this.currentPiece.y, rotated)) {
            this.currentPiece.shape = rotated;
            playSound('rotate');
        } else {
            if (!this.elementSystem.checkCollision(this.currentPiece.x - 1, this.currentPiece.y, rotated)) {
                this.currentPiece.x -= 1;
                this.currentPiece.shape = rotated;
                playSound('rotate');
            } else if (!this.elementSystem.checkCollision(this.currentPiece.x + 1, this.currentPiece.y, rotated)) {
                this.currentPiece.x += 1;
                this.currentPiece.shape = rotated;
                playSound('rotate');
            }
        }
    }

    hardDrop() {
        if (!this.currentPiece || this.isPaused || this.isGameOver) return;
        if (this.phase !== GAME_PHASES.PREPARATION) return;

        let distance = 0;
        while (this.movePiece(0, 1)) {
            this.score += 2;
            distance++;
        }
        playSound('drop');
        this.lockPiece();
    }

    lockPiece() {
        if (!this.currentPiece) return;

        this.elementSystem.lockPiece(this.currentPiece);
        this.stats.addTowerBuild();
        this.stats.addPieceDrop();
        this.stats.addElementUse(this.currentPiece.element);
        this.preparationPiecesUsed++;

        this.clearLines();
        this.spawnPiece();
    }

    clearLines() {
        const linesCleared = this.elementSystem.clearLines();
        
        if (linesCleared.length > 0) {
            playSound('clear');
            this.linesCleared += linesCleared.length;
            this.stats.addLinesCleared(linesCleared.length);

            const reward = CLEAR_REWARDS[Math.min(linesCleared.length, 4)] || CLEAR_REWARDS[1];
            const scoreGain = reward.score * this.level;
            const energyGain = reward.energy;
            
            this.score += scoreGain;
            this.energy += energyGain;

            if (linesCleared.length === 4) {
                this.stats.addTetris();
                playSound('levelup');
            }

            const newLevel = Math.floor(this.score / 1000) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                playSound('levelup');
            }

            this.updateUI();
        } else {
            this.stats.resetCombo();
        }
    }

    spawnPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.elementSystem.createRandomPiece();

        if (this.elementSystem.checkCollision(
            this.currentPiece.x, 
            this.currentPiece.y, 
            this.currentPiece.shape
        )) {
            if (this.phase === GAME_PHASES.PREPARATION) {
                this.switchToBattlePhase();
            } else {
                this.gameOver(false);
            }
        }
    }

    updateUI() {
        const scoreElement = document.getElementById('score');
        const levelElement = document.getElementById('level');
        const phaseElement = document.getElementById('phase');
        
        if (scoreElement) scoreElement.textContent = this.score;
        if (levelElement) levelElement.textContent = this.level;
        if (phaseElement) {
            phaseElement.textContent = this.phase === GAME_PHASES.PREPARATION ? '准备阶段' : '战斗阶段';
            phaseElement.className = `phase-indicator ${this.phase === GAME_PHASES.PREPARATION ? 'preparation' : 'battle'}`;
        }
    }

    gameOver(won) {
        this.isGameOver = true;
        this.isStarted = false;
        
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }

        playSound('gameover');

        const finalStats = this.stats.endBattle(
            this.currentLevel?.id || 1,
            won
        );
        finalStats.score = this.score;
        this.stats.score = this.score;

        if (won && this.currentLevel) {
            saveLevelProgress(this.currentLevel.id, finalStats);
            unlockNextLevel(this.currentLevel.id);
        }

        const totalStats = updateTotalStats({
            score: this.score,
            kills: finalStats.kills,
            merges: finalStats.merges,
            time: finalStats.duration,
            levelCompleted: won ? this.currentLevel?.id : null,
            perfectDefense: finalStats.perfectDefense,
            tetrisCount: finalStats.tetrisCount
        });

        const newAchievements = this.achievementManager.checkAchievements(
            finalStats,
            totalStats
        );

        this.showGameOverOverlay(won, finalStats, newAchievements);
    }

    showGameOverOverlay(won, stats, newAchievements) {
        const gameOverOverlay = document.getElementById('gameOverOverlay');
        const finalScoreElement = document.getElementById('finalScore');
        const gameOverTitle = document.querySelector('.game-over-title');
        const achievementNotice = document.getElementById('achievementNotice');
        const achievementList = document.getElementById('achievementList');

        if (gameOverTitle) {
            gameOverTitle.textContent = won ? '胜利!' : '游戏结束';
            gameOverTitle.style.color = won ? '#4CAF50' : '#e94560';
        }

        if (finalScoreElement) {
            finalScoreElement.textContent = `${this.score} (${stats.kills}击杀, ${stats.merges}合成, ${this.linesCleared}消除)`;
        }

        if (achievementNotice && achievementList) {
            if (newAchievements.length > 0) {
                achievementNotice.style.display = 'block';
                achievementList.innerHTML = newAchievements.map(a => 
                    `<div style="padding: 8px; margin: 5px 0; background: rgba(0, 0, 0, 0.3); border-radius: 4px;">
                        <span style="font-size: 18px; margin-right: 8px;">${a.icon}</span>
                        <span style="font-weight: bold; color: #FFD700;">${a.name}</span>
                        <span style="color: #999; font-size: 12px; margin-left: 10px;">${a.description}</span>
                    </div>`
                ).join('');
            } else {
                achievementNotice.style.display = 'none';
            }
        }

        if (gameOverOverlay) {
            gameOverOverlay.classList.add('show');
        }
    }

    hideOverlays() {
        const startOverlay = document.getElementById('startOverlay');
        const gameOverOverlay = document.getElementById('gameOverOverlay');

        if (startOverlay) startOverlay.classList.add('hide');
        if (gameOverOverlay) gameOverOverlay.classList.remove('show');
    }

    togglePause() {
        if (this.isGameOver || !this.isStarted) return;

        this.isPaused = !this.isPaused;
        const btnPause = document.getElementById('btnPause');
        if (btnPause) {
            btnPause.textContent = this.isPaused ? '继续' : '暂停';
        }
    }

    skipPreparation() {
        if (this.phase === GAME_PHASES.PREPARATION) {
            this.switchToBattlePhase();
        }
    }
}
