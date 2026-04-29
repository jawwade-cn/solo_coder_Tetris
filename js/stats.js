class BattleStats {
    constructor() {
        this.reset();
    }

    reset() {
        this.startTime = Date.now();
        this.endTime = null;
        this.score = 0;
        this.kills = 0;
        this.damageDealt = 0;
        this.damageTaken = 0;
        this.linesCleared = 0;
        this.merges = 0;
        this.mergeTypes = {};
        this.towersBuilt = 0;
        this.piecesDropped = 0;
        this.maxCombo = 0;
        this.currentCombo = 0;
        this.enemiesByType = {};
        this.elementsUsed = { FIRE: 0, WATER: 0, EARTH: 0 };
        this.waveStats = [];
        this.currentWave = 0;
        this.tetrisCount = 0;
    }

    addTetris() {
        this.tetrisCount++;
    }

    startWave(wave) {
        this.currentWave = wave;
        this.waveStats[wave] = {
            wave: wave,
            kills: 0,
            damageDealt: 0,
            damageTaken: 0,
            merges: 0
        };
    }

    addKill(enemyType) {
        this.kills++;
        this.damageDealt += 50;
        this.enemiesByType[enemyType] = (this.enemiesByType[enemyType] || 0) + 1;
        if (this.waveStats[this.currentWave]) {
            this.waveStats[this.currentWave].kills++;
        }
    }

    addDamageDealt(damage) {
        this.damageDealt += damage;
        if (this.waveStats[this.currentWave]) {
            this.waveStats[this.currentWave].damageDealt += damage;
        }
    }

    addDamageTaken(damage) {
        this.damageTaken += damage;
        if (this.waveStats[this.currentWave]) {
            this.waveStats[this.currentWave].damageTaken += damage;
        }
    }

    addLinesCleared(count) {
        this.linesCleared += count;
        this.currentCombo++;
        this.maxCombo = Math.max(this.maxCombo, this.currentCombo);
    }

    addMerge(mergeType) {
        this.merges++;
        this.mergeTypes[mergeType] = (this.mergeTypes[mergeType] || 0) + 1;
        if (this.waveStats[this.currentWave]) {
            this.waveStats[this.currentWave].merges++;
        }
    }

    addElementUse(element) {
        if (this.elementsUsed[element] !== undefined) {
            this.elementsUsed[element]++;
        }
    }

    addTowerBuild() {
        this.towersBuilt++;
    }

    addPieceDrop() {
        this.piecesDropped++;
    }

    resetCombo() {
        this.currentCombo = 0;
    }

    endBattle(levelId, won) {
        this.endTime = Date.now();
        const duration = Math.floor((this.endTime - this.startTime) / 1000);

        return {
            levelId: levelId,
            won: won,
            score: this.score,
            duration: duration,
            kills: this.kills,
            damageDealt: this.damageDealt,
            damageTaken: this.damageTaken,
            linesCleared: this.linesCleared,
            merges: this.merges,
            mergeTypes: { ...this.mergeTypes },
            towersBuilt: this.towersBuilt,
            piecesDropped: this.piecesDropped,
            maxCombo: this.maxCombo,
            enemiesByType: { ...this.enemiesByType },
            elementsUsed: { ...this.elementsUsed },
            waveStats: [...this.waveStats],
            perfectDefense: this.damageTaken === 0,
            timestamp: this.endTime,
            tetrisCount: this.tetrisCount
        };
    }
}

class ChartGenerator {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    drawBarChart(data, title, labels) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const padding = 50;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        ctx.fillStyle = '#16213e';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#e94560';
        ctx.font = 'bold 16px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText(title, width / 2, 25);

        const maxValue = Math.max(...data, 1);
        const barWidth = chartWidth / data.length * 0.6;
        const barSpacing = chartWidth / data.length * 0.4;

        data.forEach((value, index) => {
            const barHeight = (value / maxValue) * chartHeight;
            const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
            const y = padding + chartHeight - barHeight;

            const colors = ['#FF6B6B', '#4ECDC4', '#96CEB4', '#FFEAA7', '#DDA0DD', '#45B7D1'];
            ctx.fillStyle = colors[index % colors.length];
            ctx.fillRect(x, y, barWidth, barHeight);

            ctx.fillStyle = '#fff';
            ctx.font = '12px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText(value.toString(), x + barWidth / 2, y - 5);

            if (labels && labels[index]) {
                ctx.fillStyle = '#00d4ff';
                ctx.fillText(labels[index], x + barWidth / 2, height - 10);
            }
        });

        ctx.strokeStyle = '#0f3460';
        ctx.lineWidth = 2;
        ctx.strokeRect(padding, padding, chartWidth, chartHeight);
    }

    drawPieChart(data, title, labels) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2 + 20;
        const radius = Math.min(width, height) / 2 - 60;

        ctx.fillStyle = '#16213e';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#e94560';
        ctx.font = 'bold 16px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText(title, width / 2, 25);

        const total = data.reduce((sum, value) => sum + value, 0);
        if (total === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '14px "Courier New"';
            ctx.fillText('无数据', centerX, centerY);
            return;
        }

        const colors = ['#FF6B6B', '#4ECDC4', '#96CEB4', '#FFEAA7', '#DDA0DD', '#45B7D1'];
        let startAngle = -Math.PI / 2;

        data.forEach((value, index) => {
            const sliceAngle = (value / total) * Math.PI * 2;
            const endAngle = startAngle + sliceAngle;

            ctx.fillStyle = colors[index % colors.length];
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fill();

            if (labels && labels[index] && value > 0) {
                const midAngle = startAngle + sliceAngle / 2;
                const labelX = centerX + Math.cos(midAngle) * (radius + 25);
                const labelY = centerY + Math.sin(midAngle) * (radius + 25);

                ctx.fillStyle = '#fff';
                ctx.font = '11px "Courier New"';
                ctx.textAlign = 'center';
                const percentage = Math.round((value / total) * 100);
                ctx.fillText(`${labels[index]}: ${percentage}%`, labelX, labelY);
            }

            startAngle = endAngle;
        });

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawWaveChart(waveStats, title) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const padding = 50;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        ctx.fillStyle = '#16213e';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#e94560';
        ctx.font = 'bold 16px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText(title, width / 2, 25);

        if (!waveStats || waveStats.length === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '14px "Courier New"';
            ctx.fillText('无波次数据', width / 2, height / 2);
            return;
        }

        const maxKills = Math.max(...waveStats.map(w => w.kills), 1);
        const maxDamage = Math.max(...waveStats.map(w => w.damageDealt), 1);
        const maxValue = Math.max(maxKills, maxDamage);

        const waveCount = waveStats.length;
        const barWidth = chartWidth / waveCount * 0.35;
        const waveSpacing = chartWidth / waveCount;

        waveStats.forEach((wave, index) => {
            const x = padding + index * waveSpacing + barWidth / 2;

            const killsHeight = (wave.kills / maxValue) * chartHeight;
            ctx.fillStyle = '#FF6B6B';
            ctx.fillRect(x, padding + chartHeight - killsHeight, barWidth, killsHeight);

            const damageHeight = (wave.damageDealt / maxValue) * chartHeight;
            ctx.fillStyle = '#4ECDC4';
            ctx.fillRect(x + barWidth + 5, padding + chartHeight - damageHeight, barWidth, damageHeight);

            ctx.fillStyle = '#00d4ff';
            ctx.font = '12px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText(`波次${index + 1}`, x + barWidth + 2.5, height - 10);
        });

        ctx.fillStyle = '#FF6B6B';
        ctx.font = '12px "Courier New"';
        ctx.fillText('击杀数', padding + 60, height - 30);
        ctx.fillStyle = '#4ECDC4';
        ctx.fillText('伤害', padding + 140, height - 30);

        ctx.strokeStyle = '#0f3460';
        ctx.lineWidth = 2;
        ctx.strokeRect(padding, padding, chartWidth, chartHeight);
    }
}
