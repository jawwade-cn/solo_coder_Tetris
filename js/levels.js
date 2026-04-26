const LEVELS = [
    {
        id: 1,
        name: '新手试炼',
        description: '学习基本操作，击败简单敌人',
        waves: 3,
        enemiesPerWave: 5,
        enemyTypes: ['BASIC'],
        startHP: 10,
        baseScore: 1000,
        unlocked: true,
        background: '#1a1a2e'
    },
    {
        id: 2,
        name: '疾风来袭',
        description: '快速敌人出现，考验反应速度',
        waves: 4,
        enemiesPerWave: 8,
        enemyTypes: ['BASIC', 'FAST'],
        startHP: 8,
        baseScore: 2000,
        unlocked: false,
        background: '#16213e'
    },
    {
        id: 3,
        name: '重甲堡垒',
        description: '高血量敌人出现，需要更强攻击',
        waves: 5,
        enemiesPerWave: 10,
        enemyTypes: ['BASIC', 'FAST', 'TANK'],
        startHP: 6,
        baseScore: 3500,
        unlocked: false,
        background: '#0f3460'
    },
    {
        id: 4,
        name: '元素觉醒',
        description: '解锁元素融合，释放更强力量',
        waves: 5,
        enemiesPerWave: 12,
        enemyTypes: ['BASIC', 'FAST', 'TANK'],
        startHP: 5,
        baseScore: 5000,
        unlocked: false,
        background: '#1a1a2e',
        enableMerge: true
    },
    {
        id: 5,
        name: 'BOSS之战',
        description: '最终BOSS出现，全力以赴',
        waves: 6,
        enemiesPerWave: 15,
        enemyTypes: ['BASIC', 'FAST', 'TANK', 'BOSS'],
        startHP: 3,
        baseScore: 10000,
        unlocked: false,
        background: '#0f3460',
        enableMerge: true,
        bossWave: 6
    }
];

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
