class GameRenderer {
    constructor(canvas, nextCanvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.nextCanvas = nextCanvas;
        this.nextCtx = nextCanvas.getContext('2d');
    }

    clear() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.nextCtx.fillStyle = '#000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
    }

    drawGrid() {
        this.ctx.strokeStyle = '#1a1a2e';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= COLS; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * BLOCK_SIZE, 0);
            this.ctx.lineTo(i * BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let i = 0; i <= ROWS; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, i * BLOCK_SIZE);
            this.ctx.stroke();
        }
    }

    drawBoard(board, elementBoard) {
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const cellValue = board[y][x];
                if (cellValue !== 0) {
                    const tower = elementBoard?.[y]?.[x];
                    if (tower) {
                        this.drawTowerBlock(this.ctx, x, y, tower);
                    } else if (typeof cellValue === 'string') {
                        const mergedConfig = MERGED_ELEMENTS[cellValue];
                        if (mergedConfig) {
                            this.drawMergedBlock(this.ctx, x, y, mergedConfig);
                        }
                    } else {
                        const colorIndex = cellValue <= COLORS.length ? cellValue - 1 : 0;
                        this.drawBlock(this.ctx, x, y, colorIndex, BLOCK_SIZE);
                    }
                }
            }
        }
    }

    drawTowerBlock(context, x, y, tower) {
        const color = tower.color || ELEMENTS[tower.element]?.color || '#666';
        context.fillStyle = color;
        context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        
        context.fillStyle = 'rgba(255, 255, 255, 0.3)';
        context.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, BLOCK_SIZE - 8, BLOCK_SIZE - 8);
        
        context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        context.lineWidth = 2;
        context.strokeRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);

        const elementSymbol = {
            FIRE: '🔥',
            WATER: '💧',
            EARTH: '🌍'
        };

        if (tower.isMerged) {
            context.fillStyle = '#FFD700';
            context.font = '10px sans-serif';
            context.textAlign = 'center';
            context.fillText('★', x * BLOCK_SIZE + BLOCK_SIZE / 2, y * BLOCK_SIZE + BLOCK_SIZE / 2 + 3);
        } else if (tower.element && elementSymbol[tower.element]) {
            context.font = '12px sans-serif';
            context.textAlign = 'center';
            context.fillText(elementSymbol[tower.element], x * BLOCK_SIZE + BLOCK_SIZE / 2, y * BLOCK_SIZE + BLOCK_SIZE / 2 + 4);
        }
    }

    drawMergedBlock(context, x, y, mergedConfig) {
        context.fillStyle = mergedConfig.color;
        context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        
        context.fillStyle = 'rgba(255, 255, 255, 0.3)';
        context.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, BLOCK_SIZE - 8, BLOCK_SIZE - 8);
        
        context.strokeStyle = '#FFD700';
        context.lineWidth = 2;
        context.strokeRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);

        context.font = '10px sans-serif';
        context.textAlign = 'center';
        context.fillText(mergedConfig.symbol || '★', x * BLOCK_SIZE + BLOCK_SIZE / 2, y * BLOCK_SIZE + BLOCK_SIZE / 2 + 3);
    }

    drawBlock(context, x, y, colorIndex, size) {
        const color = COLORS[colorIndex] || '#666';
        context.fillStyle = color;
        context.fillRect(x * size, y * size, size, size);
        
        context.fillStyle = 'rgba(255, 255, 255, 0.3)';
        context.fillRect(x * size + 2, y * size + 2, size - 8, size - 8);
        
        context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        context.lineWidth = 2;
        context.strokeRect(x * size + 1, y * size + 1, size - 2, size - 2);
    }

    drawPiece(piece, ghostY = null) {
        if (!piece) return;

        if (ghostY !== null) {
            this.ctx.globalAlpha = 0.3;
            for (let y = 0; y < piece.shape.length; y++) {
                for (let x = 0; x < piece.shape[y].length; x++) {
                    if (piece.shape[y][x]) {
                        this.drawElementBlock(this.ctx, piece.x + x, ghostY + y, piece);
                    }
                }
            }
            this.ctx.globalAlpha = 1;
        }

        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    this.drawElementBlock(this.ctx, piece.x + x, piece.y + y, piece);
                }
            }
        }
    }

    drawElementBlock(context, x, y, piece) {
        const color = piece.getColor();
        context.fillStyle = color;
        context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        
        context.fillStyle = 'rgba(255, 255, 255, 0.3)';
        context.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, BLOCK_SIZE - 8, BLOCK_SIZE - 8);
        
        context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        context.lineWidth = 2;
        context.strokeRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);

        const elementSymbol = {
            FIRE: '🔥',
            WATER: '💧',
            EARTH: '🌍'
        };

        if (piece.isMerged) {
            context.fillStyle = '#FFD700';
            context.font = '10px sans-serif';
            context.textAlign = 'center';
            context.fillText('★', x * BLOCK_SIZE + BLOCK_SIZE / 2, y * BLOCK_SIZE + BLOCK_SIZE / 2 + 3);
        } else if (piece.element) {
            context.font = '12px sans-serif';
            context.textAlign = 'center';
            context.fillText(elementSymbol[piece.element] || '', x * BLOCK_SIZE + BLOCK_SIZE / 2, y * BLOCK_SIZE + BLOCK_SIZE / 2 + 4);
        }
    }

    drawNextPiece(piece) {
        if (!piece) return;

        const offsetX = (this.nextCanvas.width / NEXT_BLOCK_SIZE - piece.shape[0].length) / 2;
        const offsetY = (this.nextCanvas.height / NEXT_BLOCK_SIZE - piece.shape.length) / 2;

        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const color = piece.getColor();
                    this.nextCtx.fillStyle = color;
                    this.nextCtx.fillRect(
                        (offsetX + x) * NEXT_BLOCK_SIZE,
                        (offsetY + y) * NEXT_BLOCK_SIZE,
                        NEXT_BLOCK_SIZE,
                        NEXT_BLOCK_SIZE
                    );

                    this.nextCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    this.nextCtx.fillRect(
                        (offsetX + x) * NEXT_BLOCK_SIZE + 1,
                        (offsetY + y) * NEXT_BLOCK_SIZE + 1,
                        NEXT_BLOCK_SIZE - 4,
                        NEXT_BLOCK_SIZE - 4
                    );
                }
            }
        }
    }

    drawPreparationPhase(time, timeLimit, piecesUsed, piecesLimit, energy) {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const topY = 20;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(5, 5, this.canvas.width - 10, 50);

        const timePercent = time / timeLimit;
        const timeRemaining = 1 - timePercent;
        const timeColor = timeRemaining > 0.5 ? '#4CAF50' : timeRemaining > 0.25 ? '#FF9800' : '#F44336';
        
        ctx.fillStyle = '#333';
        ctx.fillRect(10, 10, 180, 10);
        ctx.fillStyle = timeColor;
        ctx.fillRect(10, 10, 180 * timeRemaining, 10);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillText(`时间: ${Math.ceil(timeLimit - time)}s`, 10, 32);

        const piecesRemaining = 1 - (piecesUsed / piecesLimit);
        const piecesColor = piecesRemaining > 0.5 ? '#4CAF50' : piecesRemaining > 0.2 ? '#FF9800' : '#F44336';
        
        ctx.fillStyle = '#333';
        ctx.fillRect(centerX - 90, 10, 180, 10);
        ctx.fillStyle = piecesColor;
        ctx.fillRect(centerX - 90, 10, 180 * piecesRemaining, 10);
        ctx.textAlign = 'center';
        ctx.fillText(`方块: ${piecesLimit - piecesUsed}/${piecesLimit}`, centerX, 32);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`能量: ${energy}`, this.canvas.width - 10, 25);
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 12px "Courier New"';
        ctx.fillText('准备阶段', this.canvas.width - 10, 45);
    }

    drawHP(hp, maxHP) {
        const barWidth = 180;
        const barHeight = 15;
        const x = 10;
        const y = this.canvas.height - 30;

        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x, y, barWidth, barHeight);

        const hpPercent = hp / maxHP;
        const hpColor = hpPercent > 0.6 ? '#4CAF50' : hpPercent > 0.3 ? '#FF9800' : '#F44336';
        this.ctx.fillStyle = hpColor;
        this.ctx.fillRect(x, y, barWidth * hpPercent, barHeight);

        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, barWidth, barHeight);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 10px "Courier New"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`❤️ ${hp}/${maxHP}`, x + barWidth / 2, y + barHeight / 2 + 3);
    }

    drawWaveInfo(wave, totalWaves, enemiesRemaining) {
        const x = this.canvas.width - 10;
        const y = this.canvas.height - 30;

        this.ctx.fillStyle = '#e94560';
        this.ctx.font = 'bold 12px "Courier New"';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`波次: ${wave}/${totalWaves}`, x, y);
        this.ctx.fillText(`敌人: ${enemiesRemaining}`, x, y + 15);

        this.ctx.fillStyle = '#00d4ff';
        this.ctx.font = 'bold 12px "Courier New"';
        this.ctx.fillText('战斗阶段', x, y - 30);
    }

    drawPause() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#e94560';
        this.ctx.font = '24px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('暂停中', this.canvas.width / 2, this.canvas.height / 2);
    }

    drawLevelTransition(level, wave, isWaveComplete = false) {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (isWaveComplete) {
            ctx.fillStyle = '#4CAF50';
            ctx.font = 'bold 20px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText(`波次 ${wave} 完成!`, centerX, centerY - 20);
            ctx.fillStyle = '#00d4ff';
            ctx.font = '14px "Courier New"';
            ctx.fillText('准备下一波...', centerX, centerY + 20);
        } else {
            ctx.fillStyle = '#e94560';
            ctx.font = 'bold 18px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText(`${level.name}`, centerX, centerY - 40);
            ctx.fillStyle = '#00d4ff';
            ctx.font = 'bold 24px "Courier New"';
            ctx.fillText(`波次 ${wave}`, centerX, centerY);
            ctx.fillStyle = '#fff';
            ctx.font = '12px "Courier New"';
            ctx.fillText(level.description, centerX, centerY + 30);
        }
    }

    drawPhaseTransition(fromPhase, toPhase) {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 28px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('⚔️ 战斗开始 ⚔️', centerX, centerY - 20);

        ctx.fillStyle = '#00d4ff';
        ctx.font = '16px "Courier New"';
        ctx.fillText('英雄已就位！消灭所有敌人！', centerX, centerY + 20);

        ctx.fillStyle = '#fff';
        ctx.font = '12px "Courier New"';
        ctx.fillText('敌人将从顶部出现', centerX, centerY + 50);
    }
}
