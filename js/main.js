let game = null;
let uiManager = null;

let canvas = null;
let nextCanvas = null;

function initGame() {
    canvas = document.getElementById('gameCanvas');
    nextCanvas = document.getElementById('nextCanvas');

    game = new Game();
    uiManager = new UIManager(game);
    
    window.game = game;
    window.uiManager = uiManager;
    window.canvas = canvas;
    window.nextCanvas = nextCanvas;

    addExtraButtons();
}

function addExtraButtons() {
    const buttonControls = document.querySelector('.button-controls');
    if (buttonControls && !document.getElementById('btnLevels')) {
        const extraButtons = document.createElement('div');
        extraButtons.className = 'button-controls';
        extraButtons.style.cssText = 'margin-top: 15px;';
        extraButtons.innerHTML = `
            <button class="game-btn secondary" id="btnLevels">关卡选择</button>
            <button class="game-btn secondary" id="btnAchievements">成就</button>
            <button class="game-btn secondary" id="btnStats">统计</button>
        `;
        
        buttonControls.parentNode.insertBefore(extraButtons, buttonControls.nextSibling);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initGame();
});

window.addEventListener('beforeunload', () => {
    if (game && game.gameLoopId) {
        cancelAnimationFrame(game.gameLoopId);
    }
});
