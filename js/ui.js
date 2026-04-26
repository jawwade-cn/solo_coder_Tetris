class UIManager {
    constructor(game) {
        this.game = game;
        this.elements = {};
        this.setupElements();
        this.setupEventListeners();
    }

    setupElements() {
        this.elements = {
            canvas: document.getElementById('gameCanvas'),
            nextCanvas: document.getElementById('nextCanvas'),
            score: document.getElementById('score'),
            level: document.getElementById('level'),
            finalScore: document.getElementById('finalScore'),
            startOverlay: document.getElementById('startOverlay'),
            gameOverOverlay: document.getElementById('gameOverOverlay'),
            startGameBtn: document.getElementById('startGameBtn'),
            restartGameBtn: document.getElementById('restartGameBtn'),
            btnNewGame: document.getElementById('btnNewGame'),
            btnSound: document.getElementById('btnSound'),
            btnPause: document.getElementById('btnPause'),
            btnRotate: document.getElementById('btnRotate'),
            btnLeft: document.getElementById('btnLeft'),
            btnRight: document.getElementById('btnRight'),
            btnDown: document.getElementById('btnDown'),
            btnHardDrop: document.getElementById('btnHardDrop'),
            btnAchievements: document.getElementById('btnAchievements'),
            btnLevels: document.getElementById('btnLevels'),
            btnStats: document.getElementById('btnStats'),
            btnLevelSelect: document.getElementById('btnLevelSelect')
        };
    }

    setupEventListeners() {
        const {
            startGameBtn, restartGameBtn, btnNewGame, btnSound, btnPause,
            btnRotate, btnLeft, btnRight, btnDown, btnHardDrop,
            btnAchievements, btnLevels, btnStats, btnLevelSelect
        } = this.elements;

        console.log('UIManager: Setting up event listeners...');
        console.log('startGameBtn:', startGameBtn);
        console.log('restartGameBtn:', restartGameBtn);

        if (startGameBtn) {
            startGameBtn.addEventListener('click', (e) => {
                console.log('Start Game button clicked');
                try {
                    this.startGame(1);
                } catch (err) {
                    console.error('Error starting game:', err);
                    alert('启动游戏失败: ' + err.message);
                }
            });
        } else {
            console.warn('startGameBtn not found!');
        }
        
        if (restartGameBtn) {
            restartGameBtn.addEventListener('click', () => {
                console.log('Restart Game button clicked');
                try {
                    this.startGame(1);
                } catch (err) {
                    console.error('Error restarting game:', err);
                    alert('重新开始失败: ' + err.message);
                }
            });
        }
        
        if (btnLevelSelect) {
            btnLevelSelect.addEventListener('click', () => {
                console.log('Level Select button clicked (game over)');
                try {
                    this.showLevelSelect();
                } catch (err) {
                    console.error('Error showing level select:', err);
                }
            });
        }
        
        if (btnNewGame) {
            btnNewGame.addEventListener('click', () => this.showLevelSelect());
        }
        if (btnSound) {
            btnSound.addEventListener('click', () => this.toggleSound());
        }
        if (btnPause) {
            btnPause.addEventListener('click', () => this.game.togglePause());
        }

        this.setupButtonEvent(btnLeft, () => { 
            if (!this.game.isPaused && !this.game.isGameOver) this.game.movePiece(-1, 0); 
        });
        this.setupButtonEvent(btnRight, () => { 
            if (!this.game.isPaused && !this.game.isGameOver) this.game.movePiece(1, 0); 
        });
        this.setupButtonEvent(btnDown, () => { 
            if (!this.game.isPaused && !this.game.isGameOver) {
                if (this.game.movePiece(0, 1)) {
                    this.game.score += 1;
                    this.game.updateUI();
                }
            }
        });
        this.setupButtonEvent(btnRotate, () => { 
            if (!this.game.isPaused && !this.game.isGameOver) this.game.rotatePiece(); 
        });
        this.setupButtonEvent(btnHardDrop, () => { 
            if (!this.game.isPaused && !this.game.isGameOver) this.game.hardDrop(); 
        });

        if (btnAchievements) {
            btnAchievements.addEventListener('click', () => this.showAchievements());
        }
        if (btnLevels) {
            btnLevels.addEventListener('click', () => this.showLevelSelect());
        }
        if (btnStats) {
            btnStats.addEventListener('click', () => this.showStats());
        }

        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    handleKeyDown(e) {
        if (this.game.isGameOver || !this.game.isStarted) return;

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                if (!this.game.isPaused) this.game.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (!this.game.isPaused) this.game.movePiece(1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (!this.game.isPaused) {
                    if (this.game.movePiece(0, 1)) {
                        this.game.score += 1;
                        this.game.updateUI();
                    }
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (!this.game.isPaused) this.game.rotatePiece();
                break;
            case ' ':
                e.preventDefault();
                if (!this.game.isPaused) this.game.hardDrop();
                break;
            case 'p':
            case 'P':
                e.preventDefault();
                this.game.togglePause();
                break;
        }
    }

    setupButtonEvent(button, action, isToggle = false) {
        if (!button) return;

        button.addEventListener('mousedown', () => {
            button.classList.add('active');
            if (!isToggle) action();
        });

        button.addEventListener('mouseup', () => {
            button.classList.remove('active');
            if (isToggle) action();
        });

        button.addEventListener('mouseleave', () => {
            button.classList.remove('active');
        });

        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            button.classList.add('active');
            if (!isToggle) action();
        });

        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            button.classList.remove('active');
            if (isToggle) action();
        });
    }

    startGame(levelId) {
        this.game.setLevel(levelId);
        this.game.init(this.elements.canvas, this.elements.nextCanvas);
        this.game.start();
    }

    toggleSound() {
        const enabled = toggleSound();
        if (this.elements.btnSound) {
            this.elements.btnSound.textContent = enabled ? '音效: 开' : '音效: 关';
        }
    }

    showAchievements() {
        const achievementManager = new AchievementManager();
        const allAchievements = achievementManager.getAllAchievements();
        const tierProgress = achievementManager.getTierProgress();

        let html = '<div style="text-align: center; max-height: 80vh; overflow-y: auto;">';
        html += '<h2 style="color: #e94560; margin-bottom: 20px;">🏆 成就系统</h2>';
        
        html += '<div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">';
        for (const [tier, progress] of Object.entries(tierProgress)) {
            const color = TIER_COLORS[tier];
            html += `<div style="text-align: center;">
                <div style="font-size: 24px; margin-bottom: 5px;">${
                    tier === 'bronze' ? '🥉' : 
                    tier === 'silver' ? '🥈' : 
                    tier === 'gold' ? '🥇' : '💎'
                }</div>
                <div style="color: ${color}; font-weight: bold;">${
                    tier === 'bronze' ? '青铜' : 
                    tier === 'silver' ? '白银' : 
                    tier === 'gold' ? '黄金' : '铂金'
                }</div>
                <div style="color: #fff; font-size: 12px;">${progress.unlocked}/${progress.total}</div>
            </div>`;
        }
        html += '</div>';

        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 15px; padding: 10px;">';
        for (const achievement of allAchievements) {
            const tierColor = TIER_COLORS[achievement.tier] || '#666';
            html += `<div style="
                background: ${achievement.unlocked ? '#16213e' : '#333'};
                border: 3px solid ${tierColor};
                border-radius: 8px;
                padding: 15px;
                text-align: center;
                opacity: ${achievement.unlocked ? 1 : 0.6};
            ">
                <div style="font-size: 28px; margin-bottom: 8px;">${achievement.unlocked ? achievement.icon : '🔒'}</div>
                <div style="color: #fff; font-weight: bold; font-size: 12px; margin-bottom: 5px;">${achievement.name}</div>
                <div style="color: #00d4ff; font-size: 10px;">${achievement.description}</div>
                <div style="color: ${tierColor}; font-size: 10px; margin-top: 5px;">${
                    achievement.tier === 'bronze' ? '青铜' : 
                    achievement.tier === 'silver' ? '白银' : 
                    achievement.tier === 'gold' ? '黄金' : '铂金'
                }</div>
            </div>`;
        }
        html += '</div></div>';

        this.showModal(html);
    }

    showLevelSelect() {
        const unlockedLevels = getUnlockedLevels();
        const totalStats = getTotalStats();
        const self = this;

        let html = '<div id="levelSelectContainer" style="text-align: center; max-height: 80vh; overflow-y: auto;">';
        html += '<h2 style="color: #e94560; margin-bottom: 20px;">🎮 关卡选择</h2>';
        
        html += '<div id="levelCards" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; padding: 10px;">';
        
        for (const level of unlockedLevels) {
            const isUnlocked = level.unlocked;
            const bestScore = level.bestScore || 0;
            const perfect = level.perfect;

            html += `<div class="level-card" 
                data-level-id="${level.id}"
                data-unlocked="${isUnlocked}"
                style="
                    background: ${isUnlocked ? level.background : '#333'};
                    border: 4px solid ${isUnlocked ? '#00d4ff' : '#555'};
                    border-radius: 10px;
                    padding: 20px;
                    text-align: center;
                    cursor: ${isUnlocked ? 'pointer' : 'not-allowed'};
                    opacity: ${isUnlocked ? 1 : 0.6};
                    transition: transform 0.2s;
                ">
                <div style="font-size: 32px; margin-bottom: 10px;">${isUnlocked ? '🎯' : '🔒'}</div>
                <div style="color: #fff; font-weight: bold; font-size: 16px; margin-bottom: 5px;">
                    第${level.id}关: ${level.name}
                </div>
                <div style="color: #00d4ff; font-size: 12px; margin-bottom: 10px;">
                    ${level.description}
                </div>
                <div style="color: #999; font-size: 11px; margin-bottom: 5px;">
                    波次: ${level.waves} | 基础分: ${level.baseScore}
                </div>
                ${bestScore > 0 ? `
                    <div style="color: #FFD700; font-size: 12px; margin-top: 10px;">
                        🏆 最佳: ${bestScore}分
                        ${perfect ? ' | 🛡️ 完美' : ''}
                    </div>
                ` : ''}
            </div>`;
        }
        
        html += '</div></div>';

        this.showModal(html);

        setTimeout(() => {
            const levelCards = document.querySelectorAll('.level-card');
            levelCards.forEach(card => {
                const levelId = parseInt(card.dataset.levelId);
                const isUnlocked = card.dataset.unlocked === 'true';
                
                if (isUnlocked) {
                    card.addEventListener('mouseenter', () => {
                        card.style.transform = 'scale(1.02)';
                    });
                    card.addEventListener('mouseleave', () => {
                        card.style.transform = 'scale(1)';
                    });
                    card.addEventListener('click', () => {
                        try {
                            self.startGame(levelId);
                            self.closeModal();
                        } catch (e) {
                            console.error('Error starting game:', e);
                            alert('启动游戏时出错: ' + e.message);
                        }
                    });
                }
            });
        }, 100);
    }

    showStats() {
        const totalStats = getTotalStats();
        const levelProgress = loadFromStorage(STORAGE_KEYS.LEVEL_PROGRESS, {});

        let html = '<div style="text-align: center; max-height: 80vh; overflow-y: auto;">';
        html += '<h2 style="color: #e94560; margin-bottom: 20px;">📊 游戏统计</h2>';

        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">';
        
        const statItems = [
            { label: '总游戏次数', value: totalStats.totalGames, icon: '🎮' },
            { label: '总得分', value: totalStats.totalScore.toLocaleString(), icon: '💰' },
            { label: '总击杀', value: totalStats.totalKills, icon: '⚔️' },
            { label: '总融合', value: totalStats.totalMerges, icon: '✨' },
            { label: '完成关卡', value: totalStats.levelsCompleted.length, icon: '🏆' },
            { label: '完美防守', value: totalStats.perfectDefenses, icon: '🛡️' },
            { label: '总游戏时间', value: this.formatTime(totalStats.totalTime), icon: '⏱️' }
        ];

        for (const item of statItems) {
            html += `<div style="
                background: #16213e;
                border: 2px solid #0f3460;
                border-radius: 8px;
                padding: 15px;
            ">
                <div style="font-size: 24px; margin-bottom: 5px;">${item.icon}</div>
                <div style="color: #00d4ff; font-size: 20px; font-weight: bold;">${item.value}</div>
                <div style="color: #999; font-size: 11px;">${item.label}</div>
            </div>`;
        }
        html += '</div>';

        if (Object.keys(levelProgress).length > 0) {
            html += '<h3 style="color: #00d4ff; margin: 20px 0;">关卡记录</h3>';
            html += '<div style="display: grid; grid-template-columns: 1fr; gap: 10px; text-align: left;">';
            
            for (const [levelId, progress] of Object.entries(levelProgress)) {
                const level = getLevelById(parseInt(levelId));
                html += `<div style="
                    background: #16213e;
                    border: 2px solid ${progress.won ? '#4CAF50' : '#F44336'};
                    border-radius: 8px;
                    padding: 12px;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="color: #fff; font-weight: bold;">${level?.name || `关卡${levelId}`}</span>
                            <span style="color: ${progress.won ? '#4CAF50' : '#F44336'}; margin-left: 10px;">
                                ${progress.won ? '✅ 已完成' : '❌ 失败'}
                            </span>
                        </div>
                        <div style="color: #FFD700;">${progress.score}分</div>
                    </div>
                    <div style="color: #999; font-size: 11px; margin-top: 5px;">
                        击杀: ${progress.kills} | 融合: ${progress.merges} | 时间: ${this.formatTime(progress.duration)}
                        ${progress.perfectDefense ? ' | 🛡️ 完美防守' : ''}
                    </div>
                </div>`;
            }
            html += '</div>';
        }

        html += '</div>';
        this.showModal(html);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}分${secs}秒`;
    }

    showModal(content) {
        let modal = document.getElementById('gameModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'gameModal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2000;
                padding: 20px;
                box-sizing: border-box;
            `;
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div style="
                background: #16213e;
                border: 6px solid #0f3460;
                border-radius: 12px;
                padding: 30px;
                max-width: 900px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 0 50px rgba(233, 69, 96, 0.3);
                position: relative;
            ">
                <button id="closeModalBtn" style="
                    position: absolute;
                    top: 10px;
                    right: 15px;
                    background: none;
                    border: none;
                    color: #e94560;
                    font-size: 28px;
                    cursor: pointer;
                    padding: 5px;
                ">&times;</button>
                ${content}
            </div>
        `;

        modal.style.display = 'flex';

        document.getElementById('closeModalBtn').addEventListener('click', () => {
            this.closeModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    closeModal() {
        const modal = document.getElementById('gameModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}
