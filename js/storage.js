const STORAGE_KEYS = {
    HIGH_SCORES: 'tetris_tower_high_scores',
    ACHIEVEMENTS: 'tetris_tower_achievements',
    LEVEL_PROGRESS: 'tetris_tower_level_progress',
    GAME_STATS: 'tetris_tower_game_stats',
    SETTINGS: 'tetris_tower_settings'
};

function isValidNumber(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

function getValidNumber(value, defaultValue) {
    return isValidNumber(value) ? value : defaultValue;
}

function getValidArray(value, defaultValue) {
    return Array.isArray(value) ? value : defaultValue;
}

function getValidObject(value, defaultValue) {
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : defaultValue;
}

function getValidBoolean(value, defaultValue) {
    return typeof value === 'boolean' ? value : defaultValue;
}

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
    const rawData = loadFromStorage(STORAGE_KEYS.ACHIEVEMENTS, null);
    if (!rawData) {
        return [];
    }
    const validated = getValidArray(rawData, []);
    return validated.filter(x => typeof x === 'string');
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
    const rawData = loadFromStorage(STORAGE_KEYS.GAME_STATS, null);
    const defaultStats = {
        totalGames: 0,
        totalScore: 0,
        totalKills: 0,
        totalMerges: 0,
        totalTime: 0,
        levelsCompleted: [],
        perfectDefenses: 0
    };

    if (!rawData) {
        return defaultStats;
    }

    const validated = getValidObject(rawData, defaultStats);
    
    return {
        totalGames: Math.max(0, getValidNumber(validated.totalGames, 0)),
        totalScore: Math.max(0, getValidNumber(validated.totalScore, 0)),
        totalKills: Math.max(0, getValidNumber(validated.totalKills, 0)),
        totalMerges: Math.max(0, getValidNumber(validated.totalMerges, 0)),
        totalTime: Math.max(0, getValidNumber(validated.totalTime, 0)),
        levelsCompleted: getValidArray(validated.levelsCompleted, []).filter(x => isValidNumber(x)),
        perfectDefenses: Math.max(0, getValidNumber(validated.perfectDefenses, 0))
    };
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
    const rawData = loadFromStorage(STORAGE_KEYS.SETTINGS, null);
    const defaultSettings = {
        soundEnabled: true,
        difficulty: 'normal'
    };

    if (!rawData) {
        return defaultSettings;
    }

    const validated = getValidObject(rawData, defaultSettings);
    
    return {
        soundEnabled: getValidBoolean(validated.soundEnabled, true),
        difficulty: typeof validated.difficulty === 'string' ? validated.difficulty : 'normal'
    };
}

function saveSettings(settings) {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
}
