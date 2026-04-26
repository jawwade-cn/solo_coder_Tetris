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

const ELEMENTS = {
    FIRE: { name: '火', color: '#FF6B6B', damage: 20, range: 2 },
    WATER: { name: '水', color: '#4ECDC4', damage: 15, range: 3, slow: true },
    EARTH: { name: '土', color: '#96CEB4', damage: 25, range: 1, stun: true }
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
    MOLTEN: { name: '熔岩', color: '#FF4500', damage: 40, range: 2, effect: 'burn' },
    TSUNAMI: { name: '海啸', color: '#00CED1', damage: 35, range: 5, effect: 'slow' },
    QUAKE: { name: '地震', color: '#8B4513', damage: 50, range: 1, effect: 'stun' },
    STEAM: { name: '蒸汽', color: '#B0C4DE', damage: 30, range: 4, effect: 'blind' },
    LAVA: { name: '岩浆', color: '#FF6347', damage: 45, range: 2, effect: 'burn' },
    MUD: { name: '泥流', color: '#8B7355', damage: 25, range: 3, effect: 'trap' }
};

const ENEMY_TYPES = {
    BASIC: { name: '小怪', hp: 50, speed: 1, color: '#FF0000', reward: 10 },
    FAST: { name: '疾风', hp: 30, speed: 2, color: '#00FF00', reward: 15 },
    TANK: { name: '重甲', hp: 150, speed: 0.5, color: '#0000FF', reward: 25 },
    BOSS: { name: 'BOSS', hp: 500, speed: 0.3, color: '#FF00FF', reward: 100 }
};

const ACHIEVEMENTS = [
    { id: 'first_win', name: '初出茅庐', description: '完成第一个关卡', icon: '🏆', tier: 'bronze' },
    { id: 'combo_5', name: '连击大师', description: '一次消除5行以上', icon: '🔥', tier: 'bronze' },
    { id: 'merge_10', name: '元素融合者', description: '融合10次元素', icon: '✨', tier: 'silver' },
    { id: 'kill_100', name: '百人斩', description: '击败100个敌人', icon: '⚔️', tier: 'silver' },
    { id: 'level_5', name: '冒险达人', description: '完成5个关卡', icon: '🌟', tier: 'gold' },
    { id: 'no_damage', name: '完美防守', description: '在一个关卡中不受到任何伤害', icon: '🛡️', tier: 'gold' },
    { id: 'merge_master', name: '融合大师', description: '融合所有类型的元素', icon: '🌈', tier: 'platinum' },
    { id: 'all_levels', name: '传奇玩家', description: '完成所有关卡', icon: '👑', tier: 'platinum' }
];

const TIER_COLORS = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2'
};
