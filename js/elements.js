class ElementPiece {
    constructor(shape, element, colorIndex) {
        this.shape = JSON.parse(JSON.stringify(shape));
        this.element = element;
        this.colorIndex = colorIndex;
        this.x = Math.floor(COLS / 2) - Math.floor(shape[0].length / 2);
        this.y = 0;
        this.isMerged = false;
        this.mergedType = null;
    }

    rotate() {
        const rotated = [];
        for (let x = 0; x < this.shape[0].length; x++) {
            rotated[x] = [];
            for (let y = this.shape.length - 1; y >= 0; y--) {
                rotated[x].push(this.shape[y][x]);
            }
        }
        return rotated;
    }

    getColor() {
        if (this.isMerged && this.mergedType && MERGED_ELEMENTS[this.mergedType]) {
            return MERGED_ELEMENTS[this.mergedType].color;
        }
        return ELEMENTS[this.element]?.color || COLORS[this.colorIndex];
    }

    getDamage() {
        if (this.isMerged && this.mergedType && MERGED_ELEMENTS[this.mergedType]) {
            return MERGED_ELEMENTS[this.mergedType].damage;
        }
        return ELEMENTS[this.element]?.damage || 10;
    }

    getRange() {
        if (this.isMerged && this.mergedType && MERGED_ELEMENTS[this.mergedType]) {
            return MERGED_ELEMENTS[this.mergedType].range;
        }
        return ELEMENTS[this.element]?.range || 1;
    }

    getEffect() {
        if (this.isMerged && this.mergedType && MERGED_ELEMENTS[this.mergedType]) {
            return MERGED_ELEMENTS[this.mergedType].effect;
        }
        return ELEMENTS[this.element]?.slow ? 'slow' : 
               ELEMENTS[this.element]?.stun ? 'stun' : null;
    }
}

class ElementSystem {
    constructor() {
        this.board = [];
        this.elementBoard = [];
    }

    init() {
        this.board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        this.elementBoard = Array(ROWS).fill().map(() => Array(COLS).fill(null));
    }

    createRandomPiece() {
        const shapeIndex = Math.floor(Math.random() * SHAPES.length);
        const elements = ['FIRE', 'WATER', 'EARTH'];
        const element = elements[Math.floor(Math.random() * elements.length)];
        const colorIndex = Math.floor(Math.random() * COLORS.length);
        return new ElementPiece(SHAPES[shapeIndex], element, colorIndex);
    }

    checkAdjacentElements(x, y) {
        const element = this.elementBoard[y]?.[x];
        if (!element) return [];

        const adjacent = [];
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1]
        ];

        directions.forEach(([dx, dy]) => {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
                const adjElement = this.elementBoard[ny][nx];
                if (adjElement) {
                    adjacent.push({ x: nx, y: ny, element: adjElement });
                }
            }
        });

        return adjacent;
    }

    tryMerge(x, y) {
        const currentElement = this.elementBoard[y]?.[x];
        if (!currentElement || currentElement.isMerged) return null;

        const adjacent = this.checkAdjacentElements(x, y);
        
        for (const adj of adjacent) {
            if (adj.element.isMerged) continue;

            const mergeKey1 = `${currentElement.element}_${adj.element.element}`;
            const mergeKey2 = `${adj.element.element}_${currentElement.element}`;
            
            const mergedType = MERGE_RULES[mergeKey1] || MERGE_RULES[mergeKey2];
            
            if (mergedType) {
                this.board[y][x] = 0;
                this.board[adj.y][adj.x] = 0;
                this.elementBoard[y][x] = null;
                this.elementBoard[adj.y][adj.x] = null;

                const mergedPiece = {
                    type: mergedType,
                    element: mergedType,
                    isMerged: true,
                    damage: MERGED_ELEMENTS[mergedType].damage,
                    range: MERGED_ELEMENTS[mergedType].range,
                    effect: MERGED_ELEMENTS[mergedType].effect,
                    color: MERGED_ELEMENTS[mergedType].color,
                    position: { x, y }
                };

                const midX = Math.floor((x + adj.x) / 2);
                const midY = Math.floor((y + adj.y) / 2);
                
                if (this.board[midY] && this.board[midY][midX] === 0) {
                    this.board[midY][midX] = mergedType;
                    this.elementBoard[midY][midX] = mergedPiece;
                }

                return mergedPiece;
            }
        }

        return null;
    }

    lockPiece(piece) {
        const towers = [];
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardY = piece.y + y;
                    const boardX = piece.x + x;

                    if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                        const cellValue = piece.isMerged ? piece.mergedType : (piece.colorIndex + 1);
                        this.board[boardY][boardX] = cellValue;
                        
                        const tower = {
                            x: boardX,
                            y: boardY,
                            element: piece.element,
                            isMerged: piece.isMerged,
                            mergedType: piece.mergedType,
                            damage: piece.getDamage(),
                            range: piece.getRange(),
                            effect: piece.getEffect(),
                            color: piece.getColor(),
                            lastAttack: 0,
                            attackCooldown: 1000
                        };
                        
                        this.elementBoard[boardY][boardX] = tower;
                        towers.push(tower);
                    }
                }
            }
        }

        return towers;
    }

    getTowersInRange(enemyX, enemyY) {
        const towers = [];

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const tower = this.elementBoard[y][x];
                if (tower) {
                    const towerPixelX = x * BLOCK_SIZE + BLOCK_SIZE / 2;
                    const towerPixelY = y * BLOCK_SIZE + BLOCK_SIZE / 2;
                    
                    const distance = Math.sqrt(
                        Math.pow(towerPixelX - enemyX, 2) + 
                        Math.pow(towerPixelY - enemyY, 2)
                    );

                    const rangePixels = tower.range * BLOCK_SIZE * 2;
                    if (distance <= rangePixels) {
                        towers.push(tower);
                    }
                }
            }
        }

        return towers;
    }

    clearLines() {
        const linesCleared = [];
        
        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                linesCleared.push(y);
                this.board.splice(y, 1);
                this.board.unshift(Array(COLS).fill(0));
                
                this.elementBoard.splice(y, 1);
                this.elementBoard.unshift(Array(COLS).fill(null));
                y++;
            }
        }

        return linesCleared;
    }

    checkCollision(x, y, shape) {
        for (let shapeY = 0; shapeY < shape.length; shapeY++) {
            for (let shapeX = 0; shapeX < shape[shapeY].length; shapeX++) {
                if (shape[shapeY][shapeX]) {
                    const boardX = x + shapeX;
                    const boardY = y + shapeY;

                    if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
                        return true;
                    }

                    if (boardY >= 0 && this.board[boardY][boardX] !== 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}
