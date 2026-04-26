function getLevelById(id) {
    return LEVELS.find(level => level.id === id);
}

function getUnlockedLevels() {
    const progress = loadFromStorage(STORAGE_KEYS.LEVEL_PROGRESS, {});
    return LEVELS.map(level => ({
        ...level,
        unlocked: level.unlocked || Object.keys(progress).some(pid => {
            const prevLevel = getLevelById(parseInt(pid));
            return prevLevel && prevLevel.id === level.id - 1 && progress[pid]?.won;
        }),
        bestScore: progress[level.id]?.score || 0,
        bestTime: progress[level.id]?.duration || 0,
        perfect: progress[level.id]?.perfectDefense || false
    }));
}

function canUnlockLevel(levelId) {
    const level = getLevelById(levelId);
    if (!level) return false;
    if (level.unlocked) return true;

    const progress = loadFromStorage(STORAGE_KEYS.LEVEL_PROGRESS, {});
    const prevLevel = getLevelById(levelId - 1);
    return prevLevel && progress[prevLevel.id]?.won === true;
}

function unlockNextLevel(currentLevelId) {
    const nextLevel = getLevelById(currentLevelId + 1);
    if (nextLevel) {
        return true;
    }
    return false;
}
