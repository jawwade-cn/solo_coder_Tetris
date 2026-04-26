class Game {
    constructor() {
        this.canvas = null;
        this.nextCanvas = null;
        this.renderer = null;
        this.elementSystem = null;
        this.enemyManager = null;
        this.towerManager = null;
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

        this.currentLevel = null;
        this.currentWave = 0;
        this.playerHP = 10;
        this.maxPlayerHP = 10;
        this.waveTransition = false;
        this.waveTransitionTime = 0;

        this.lastTime = 0;
        this.gameLoopId = null;
    }

    init(canvas, nextCanvas) {
        this.canvas = canvas;
        this.nextCanvas = nextCanvas;
        
        this.renderer = new GameRenderer(canvas, nextCanvas);
        this.elementSystem = new ElementSystem();
        this.enemyManager = new EnemyManager();
        this.enemyManager.setCanvas(canvas);
        this.towerManager = new TowerManager(this.elementSystem, this.enemyManager);
        this.stats = new BattleStats();
        this.achievementManager = new AchievementManager();

        this.renderer.clear();
    }

    setLevel(levelId) {
        this.currentLevel = getLevelById(levelId);
        if (!this.currentLevel) {
            this.currentLevel = getLevelById(1);
        }
    }

    start() {
        initAudio();
        this.elementSystem.init();
        this.enemyManager.reset();
        this.towerManager.reset();
        this.stats.reset();

        this.score = 0;
        this.level = 1;
        this.isGameOver = false;
        this.isPaused = false;
        this.isStarted = true;
        this.currentWave = 0;
        this.waveTransition = false;

        if (this.currentLevel) {
            this.playerHP = this.currentLevel.startHP;
            this.maxPlayerHP = this.currentLevel.startHP;
        } else {
            this.playerHP = 10;
            this.maxPlayerHP = 10;
        }

        this.updateUI();

        this.currentPiece = this.elementSystem.createRandomPiece();
        this.nextPiece = this.elementSystem.createRandomPiece();

        this.startWave();

        this.lastTime = performance.now();
        this.gameLoopId = requestAnimationFrame((time) => this.update(time));

        this.hideOverlays();
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

        if (this.waveTransition) {
            if (currentTime - this.waveTransitionTime > 2000) {
                this.waveTransition = false;
            }
        }

        if (!this.isPaused && !this.isGameOver && !this.waveTransition) {
            const enemyResult = this.enemyManager.update(deltaTime);
            
            enemyResult.killed.forEach(enemy => {
                this.score += enemy.reward;
                this.stats.addKill(enemy.type);
            });

            enemyResult.reached.forEach(enemy => {
                this.playerHP -= 1;
                this.stats.addDamageTaken(10);
                if (this.playerHP <= 0) {
                    this.gameOver(false);
                    return;
                }
            });

            const towerResult = this.towerManager.update(currentTime, this.stats);
            this.towerManager.updateAnimations(currentTime);

            if (towerResult.kills.length > 0) {
                towerResult.kills.forEach(enemy => {
                    this.score += enemy.reward;
                    this.stats.addKill(enemy.type);
                });
            }

            if (this.enemyManager.isWaveComplete()) {
                if (this.currentWave >= this.currentLevel.waves) {
                    this.gameOver(true);
                    return;
                } else {
                    this.startWave();
                }
            }

            this.updateUI();
        }

        this.draw();

        this.gameLoopId = requestAnimationFrame((time) => this.update(time));
    }

    draw() {
        this.renderer.clear();
        this.renderer.drawGrid();
        
        this.towerManager.draw(this.renderer.ctx, performance.now());
        this.enemyManager.draw(this.renderer.ctx);

        if (this.currentPiece && !this.isGameOver) {
            const ghostY = this.getGhostY();
            this.renderer.drawPiece(this.currentPiece, ghostY);
        }

        this.renderer.drawHP(this.playerHP, this.maxPlayerHP);
        this.renderer.drawWaveInfo(
            this.currentWave,
            this.currentLevel?.waves || 0,
            this.enemyManager.getAliveEnemies().length
        );

        this.renderer.drawNextPiece(this.nextPiece);

        if (this.isPaused) {
            this.renderer.drawPause();
        }

        if (this.waveTransition) {
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

        if (!this.elementSystem.checkCollision(
            this.currentPiece.x + dx, 
            this.currentPiece.y + dy, 
            this.currentPiece.shape
        )) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            playSound('move');
            return true;
        }
        return false;
    }

    rotatePiece() {
        if (!this.currentPiece || this.isPaused || this.isGameOver) return;

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

        const towers = this.elementSystem.lockPiece(this.currentPiece);
        this.towerManager.addTowers(towers);
        this.stats.addTowerBuild();
        this.stats.addPieceDrop();
        this.stats.addElementUse(this.currentPiece.element);

        if (this.currentLevel?.enableMerge) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        const boardX = this.currentPiece.x + x;
                        const boardY = this.currentPiece.y + y;
                        
                        if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                            const merged = this.elementSystem.tryMerge(boardX, boardY);
                            if (merged) {
                                this.stats.addMerge(merged.type);
                                playSound('merge');
                            }
                        }
                    }
                }
            }
        }

        this.clearLines();
        this.spawnPiece();
    }

    clearLines() {
        const linesCleared = this.elementSystem.clearLines();
        
        if (linesCleared.length > 0) {
            playSound('clear');
            this.stats.addLinesCleared(linesCleared.length);
            
            const lineScores = [0, 100, 300, 500, 800];
            const scoreGain = lineScores[Math.min(linesCleared.length, 4)] * this.level;
            this.score += scoreGain;

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
            this.gameOver(false);
        }
    }

    updateUI() {
        const scoreElement = document.getElementById('score');
        const levelElement = document.getElementById('level');
        
        if (scoreElement) scoreElement.textContent = this.score;
        if (levelElement) levelElement.textContent = this.level;
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
            perfectDefense: finalStats.perfectDefense
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

        if (gameOverTitle) {
            gameOverTitle.textContent = won ? '胜利!' : '游戏结束';
            gameOverTitle.style.color = won ? '#4CAF50' : '#e94560';
        }

        if (finalScoreElement) {
            finalScoreElement.textContent = `${this.score} (${stats.kills}击杀, ${stats.merges}融合)`;
        }

        if (gameOverOverlay) {
            gameOverOverlay.classList.add('show');
        }

        if (newAchievements.length > 0) {
            setTimeout(() => {
                alert(`🎉 恭喜解锁成就: ${newAchievements.map(a => a.name).join(', ')}`);
            }, 500);
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
}
