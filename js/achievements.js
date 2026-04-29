class AchievementManager {
    constructor() {
        this.unlocked = getUnlockedAchievements();
        this.achievements = ACHIEVEMENTS;
    }

    checkAchievements(stats, totalStats) {
        const newlyUnlocked = [];

        if (!this.isUnlocked('first_win') && stats.won) {
            this.unlock('first_win');
            newlyUnlocked.push(this.getAchievement('first_win'));
        }

        if (!this.isUnlocked('tetris') && stats.tetrisCount >= 1) {
            this.unlock('tetris');
            newlyUnlocked.push(this.getAchievement('tetris'));
        }

        if (!this.isUnlocked('merge_hero') && totalStats.totalMerges >= 5) {
            this.unlock('merge_hero');
            newlyUnlocked.push(this.getAchievement('merge_hero'));
        }

        if (!this.isUnlocked('kill_100') && totalStats.totalKills >= 100) {
            this.unlock('kill_100');
            newlyUnlocked.push(this.getAchievement('kill_100'));
        }

        if (!this.isUnlocked('level_5') && totalStats.levelsCompleted.length >= 5) {
            this.unlock('level_5');
            newlyUnlocked.push(this.getAchievement('level_5'));
        }

        if (!this.isUnlocked('no_damage') && stats.perfectDefense) {
            this.unlock('no_damage');
            newlyUnlocked.push(this.getAchievement('no_damage'));
        }

        if (!this.isUnlocked('merge_master')) {
            const mergeTypes = Object.keys(stats.mergeTypes);
            const allMerges = Object.keys(MERGED_ELEMENTS);
            if (allMerges.every(type => mergeTypes.includes(type) || 
                totalStats.totalMerges >= 20)) {
                this.unlock('merge_master');
                newlyUnlocked.push(this.getAchievement('merge_master'));
            }
        }

        if (!this.isUnlocked('all_levels')) {
            const completedLevels = totalStats.levelsCompleted.length;
            if (completedLevels >= LEVELS.length) {
                this.unlock('all_levels');
                newlyUnlocked.push(this.getAchievement('all_levels'));
            }
        }

        return newlyUnlocked;
    }

    isUnlocked(achievementId) {
        return this.unlocked.includes(achievementId);
    }

    unlock(achievementId) {
        if (!this.isUnlocked(achievementId)) {
            if (unlockAchievement(achievementId)) {
                this.unlocked.push(achievementId);
                playSound('unlock');
                return true;
            }
        }
        return false;
    }

    getAchievement(achievementId) {
        return this.achievements.find(a => a.id === achievementId);
    }

    getAllAchievements() {
        return this.achievements.map(a => ({
            ...a,
            unlocked: this.isUnlocked(a.id)
        }));
    }

    getTierProgress() {
        const tiers = ['bronze', 'silver', 'gold', 'platinum'];
        const progress = {};

        tiers.forEach(tier => {
            const tierAchievements = this.achievements.filter(a => a.tier === tier);
            const unlocked = tierAchievements.filter(a => this.isUnlocked(a.id)).length;
            progress[tier] = {
                total: tierAchievements.length,
                unlocked: unlocked,
                completed: unlocked === tierAchievements.length
            };
        });

        return progress;
    }
}

function renderAchievementCard(ctx, achievement, unlocked, x, y, width, height) {
    const padding = 10;

    ctx.fillStyle = unlocked ? '#16213e' : '#333';
    ctx.fillRect(x, y, width, height);

    const tierColor = TIER_COLORS[achievement.tier] || '#666';
    ctx.strokeStyle = tierColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, width, height);

    ctx.fillStyle = tierColor;
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(achievement.icon, x + width / 2, y + 35);

    ctx.fillStyle = unlocked ? '#fff' : '#666';
    ctx.font = 'bold 12px "Courier New"';
    ctx.fillText(achievement.name, x + width / 2, y + 55);

    ctx.fillStyle = unlocked ? '#00d4ff' : '#444';
    ctx.font = '10px "Courier New"';
    const maxWidth = width - padding * 2;
    const description = achievement.description.length > 20 
        ? achievement.description.substring(0, 20) + '...' 
        : achievement.description;
    ctx.fillText(description, x + width / 2, y + 70);

    if (!unlocked) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = '#666';
        ctx.font = '20px sans-serif';
        ctx.fillText('🔒', x + width / 2, y + height / 2 + 5);
    }
}

function renderTierMedal(ctx, tier, x, y, size = 40) {
    const color = TIER_COLORS[tier] || '#666';
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#000';
    ctx.font = `bold ${size / 2}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const tierText = {
        bronze: '🥉',
        silver: '🥈',
        gold: '🥇',
        platinum: '💎'
    };
    ctx.fillText(tierText[tier] || '★', x, y);
}
