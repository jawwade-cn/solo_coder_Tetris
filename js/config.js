const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 20;
const NEXT_BLOCK_SIZE = 15;

const COLORS = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD'
];

const SHAPES = [
    [
        [1, 1, 1, 1]
    ],
    [
        [1, 1],
        [1, 1]
    ],
    [
        [1, 1, 1],
        [0, 1, 0]
    ],
    [
        [1, 1, 1],
        [1, 0, 0]
    ],
    [
        [1, 1, 1],
        [0, 0, 1]
    ],
    [
        [1, 1, 0],
        [0, 1, 1]
    ],
    [
        [0, 1, 1],
        [1, 1, 0]
    ]
];

const GAME_PHASES = {
    PREPARATION: 'preparation',
    BATTLE: 'battle',
    VICTORY: 'victory',
    DEFEAT: 'defeat'
};

const ELEMENTS = {
    FIRE: { 
        name: '火', 
        color: '#FF6B6B', 
        symbol: '🔥',
        damage: 10, 
        range: 1,
        attackSpeed: 1000
    },
    WATER: { 
        name: '水', 
        color: '#4ECDC4', 
        symbol: '💧',
        damage: 8, 
        range: 2, 
        effect: 'slow',
        attackSpeed: 1200
    },
    EARTH: { 
        name: '土', 
        color: '#96CEB4', 
        symbol: '🌍',
        damage: 12, 
        range: 1, 
        effect: 'stun',
        attackSpeed: 1500
    }
};

const HERO_LEVELS = {
    L1: { level: 1, name: '初级英雄', multiplier: 1, rangeBonus: 0 },
    L2: { level: 2, name: '中级英雄', multiplier: 2, rangeBonus: 1 },
    L3: { level: 3, name: '高级英雄', multiplier: 4, rangeBonus: 2 }
};

const MERGE_RULES = {
    FIRE_FIRE: 'MOLTEN',
    WATER_WATER: 'TSUNAMI',
    EARTH_EARTH: 'QUAKE',
    FIRE_WATER: 'STEAM',
    FIRE_EARTH: 'LAVA',
    WATER_EARTH: 'MUD'
};

const MERGED_ELEMENTS = {
    MOLTEN: { 
        name: '熔岩', 
        color: '#FF4500', 
        symbol: '🌋',
        damage: 40, 
        range: 2, 
        effect: 'burn',
        attackSpeed: 800
    },
    TSUNAMI: { 
        name: '海啸', 
        color: '#00CED1', 
        symbol: '🌊',
        damage: 30, 
        range: 4, 
        effect: 'slow',
        attackSpeed: 1000
    },
    QUAKE: { 
        name: '地震', 
        color: '#8B4513', 
        symbol: '⛰️',
        damage: 50, 
        range: 2, 
        effect: 'stun',
        attackSpeed: 1200
    },
    STEAM: { 
        name: '蒸汽', 
        color: '#B0C4DE', 
        symbol: '💨',
        damage: 25, 
        range: 3, 
        effect: 'poison',
        attackSpeed: 900
    },
    LAVA: { 
        name: '岩浆', 
        color: '#FF6347', 
        symbol: '🔥',
        damage: 45, 
        range: 2, 
        effect: 'burn',
        attackSpeed: 850
    },
    MUD: { 
        name: '泥流', 
        color: '#8B7355', 
        symbol: '🟤',
        damage: 20, 
        range: 3, 
        effect: 'trap',
        attackSpeed: 1100
    }
};

const CLEAR_REWARDS = {
    1: { score: 100, energy: 10, description: '消除1行' },
    2: { score: 300, energy: 30, description: '消除2行' },
    3: { score: 500, energy: 50, description: '消除3行' },
    4: { score: 800, energy: 100, description: '消除4行 (Tetris!)' }
};

const ENEMY_TYPES = {
    BASIC: { 
        name: '小怪', 
        symbol: '👾',
        hp: 50, 
        speed: 0.5, 
        color: '#FF0000', 
        reward: 10,
        damage: 1
    },
    FAST: { 
        name: '疾风', 
        symbol: '💨',
        hp: 30, 
        speed: 1, 
        color: '#00FF00', 
        reward: 15,
        damage: 1
    },
    TANK: { 
        name: '重甲', 
        symbol: '🛡️',
        hp: 150, 
        speed: 0.3, 
        color: '#0000FF', 
        reward: 25,
        damage: 2
    },
    BOSS: { 
        name: 'BOSS', 
        symbol: '👹',
        hp: 500, 
        speed: 0.15, 
        color: '#FF00FF', 
        reward: 100,
        damage: 5
    }
};

const LEVELS = [
    {
        id: 1,
        name: '新手试炼',
        description: '学习准备阶段和战斗阶段',
        preparation: {
            timeLimit: 60,
            pieceLimit: 30,
            enableTetris: true
        },
        battle: {
            waves: 3,
            enemiesPerWave: 5,
            enemyTypes: ['BASIC'],
            enemySpeedMultiplier: 1
        },
        startHP: 10,
        baseScore: 1000,
        unlocked: true,
        background: '#1a1a2e'
    },
    {
        id: 2,
        name: '疾风来袭',
        description: '快速敌人出现，考验反应速度',
        preparation: {
            timeLimit: 50,
            pieceLimit: 25,
            enableTetris: true
        },
        battle: {
            waves: 4,
            enemiesPerWave: 6,
            enemyTypes: ['BASIC', 'FAST'],
            enemySpeedMultiplier: 1.2
        },
        startHP: 8,
        baseScore: 2000,
        unlocked: false,
        background: '#16213e'
    },
    {
        id: 3,
        name: '重甲堡垒',
        description: '高血量敌人出现，需要更强英雄',
        preparation: {
            timeLimit: 45,
            pieceLimit: 20,
            enableTetris: true
        },
        battle: {
            waves: 5,
            enemiesPerWave: 8,
            enemyTypes: ['BASIC', 'FAST', 'TANK'],
            enemySpeedMultiplier: 1
        },
        startHP: 6,
        baseScore: 3500,
        unlocked: false,
        background: '#0f3460'
    },
    {
        id: 4,
        name: '英雄觉醒',
        description: '解锁英雄合成系统',
        preparation: {
            timeLimit: 40,
            pieceLimit: 20,
            enableTetris: true,
            enableHeroMerge: true
        },
        battle: {
            waves: 5,
            enemiesPerWave: 10,
            enemyTypes: ['BASIC', 'FAST', 'TANK'],
            enemySpeedMultiplier: 1.1
        },
        startHP: 5,
        baseScore: 5000,
        unlocked: false,
        background: '#1a1a2e'
    },
    {
        id: 5,
        name: 'BOSS之战',
        description: '最终BOSS出现，全力以赴',
        preparation: {
            timeLimit: 35,
            pieceLimit: 18,
            enableTetris: true,
            enableHeroMerge: true
        },
        battle: {
            waves: 6,
            enemiesPerWave: 12,
            enemyTypes: ['BASIC', 'FAST', 'TANK', 'BOSS'],
            enemySpeedMultiplier: 1,
            bossWave: 6
        },
        startHP: 3,
        baseScore: 10000,
        unlocked: false,
        background: '#0f3460'
    }
];

const ACHIEVEMENTS = [
    { id: 'first_win', name: '初出茅庐', description: '完成第一个关卡', icon: '🏆', tier: 'bronze' },
    { id: 'tetris', name: 'Tetris大师', description: '完成一次4行消除', icon: '🔥', tier: 'bronze' },
    { id: 'merge_hero', name: '英雄合成者', description: '合成5次高级英雄', icon: '✨', tier: 'silver' },
    { id: 'kill_100', name: '百人斩', description: '击败100个敌人', icon: '⚔️', tier: 'silver' },
    { id: 'level_5', name: '冒险达人', description: '完成5个关卡', icon: '🌟', tier: 'gold' },
    { id: 'no_damage', name: '完美防守', description: '在一个关卡中不受到任何伤害', icon: '🛡️', tier: 'gold' },
    { id: 'merge_master', name: '合成大师', description: '合成所有类型的融合英雄', icon: '🌈', tier: 'platinum' },
    { id: 'all_levels', name: '传奇玩家', description: '完成所有关卡', icon: '👑', tier: 'platinum' }
];

const TIER_COLORS = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2'
};
