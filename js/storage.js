const STORAGE_KEYS = {
    HIGH_SCORES: 'tetris_tower_high_scores',
    ACHIEVEMENTS: 'tetris_tower_achievements',
    LEVEL_PROGRESS: 'tetris_tower_level_progress',
    GAME_STATS: 'tetris_tower_game_stats',
    SETTINGS: 'tetris_tower_settings'
};

function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('Storage save error:', e);
        return false;
    }
}

function loadFromStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        console.error('Storage load error:', e);
        return defaultValue;
    }
}

function getLevelProgress(levelId) {
    const progress = loadFromStorage(STORAGE_KEYS.LEVEL_PROGRESS, {});
    return progress[levelId] || null;
}

function saveLevelProgress(levelId, stats) {
    const progress = loadFromStorage(STORAGE_KEYS.LEVEL_PROGRESS, {});
    const existing = progress[levelId];

    if (!existing || stats.score > existing.score) {
        progress[levelId] = {
            ...stats,
            timestamp: Date.now()
        };
        saveToStorage(STORAGE_KEYS.LEVEL_PROGRESS, progress);
        return true;
    }
    return false;
}

function getUnlockedAchievements() {
    return loadFromStorage(STORAGE_KEYS.ACHIEVEMENTS, []);
}

function unlockAchievement(achievementId) {
    const unlocked = getUnlockedAchievements();
    if (!unlocked.includes(achievementId)) {
        unlocked.push(achievementId);
        saveToStorage(STORAGE_KEYS.ACHIEVEMENTS, unlocked);
        return true;
    }
    return false;
}

function getTotalStats() {
    return loadFromStorage(STORAGE_KEYS.GAME_STATS, {
        totalGames: 0,
        totalScore: 0,
        totalKills: 0,
        totalMerges: 0,
        totalTime: 0,
        levelsCompleted: [],
        perfectDefenses: 0
    });
}

function updateTotalStats(newStats) {
    const stats = getTotalStats();
    stats.totalGames += 1;
    stats.totalScore += newStats.score || 0;
    stats.totalKills += newStats.kills || 0;
    stats.totalMerges += newStats.merges || 0;
    stats.totalTime += newStats.time || 0;
    if (newStats.perfectDefense) {
        stats.perfectDefenses += 1;
    }
    if (newStats.levelCompleted && !stats.levelsCompleted.includes(newStats.levelCompleted)) {
        stats.levelsCompleted.push(newStats.levelCompleted);
    }
    saveToStorage(STORAGE_KEYS.GAME_STATS, stats);
    return stats;
}

function getSettings() {
    return loadFromStorage(STORAGE_KEYS.SETTINGS, {
        soundEnabled: true,
        difficulty: 'normal'
    });
}

function saveSettings(settings) {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
}
