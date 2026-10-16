/**
 * 移动端适配（PWA）：
 * - 画布容器按窗口等比缩放，游戏逻辑坐标保持 800x600 不变；
 * - 菜单反缩放（--ui-zoom）保持手机端可读性；
 * - 触屏设备自动启用触屏控制模式（手指拖动战机 + 按住自动射击）；
 * - 虚拟按钮（技能 / 暂停）在触屏模式下随游戏状态显隐；
 * - 设置中的控制方式开关在触屏设备上显示为 键盘 ⇄ 触屏。
 */
(function () {
    'use strict';

    const DESIGN_WIDTH = 800;
    const DESIGN_HEIGHT = 600;

    // 触屏设备检测：以“主输入为触摸”为准，避免带触摸屏的桌面电脑误判
    const isMobileParam = new URLSearchParams(window.location.search).get('mobile') === '1';
    const isTouchDevice = (('ontouchstart' in window) || navigator.maxTouchPoints > 0)
        && window.matchMedia('(pointer: coarse)').matches;
    const touchMode = isTouchDevice || isMobileParam;
    // 供 Game.js 设置开关映射使用（键盘 ⇄ 鼠标/触屏）
    window.__touchMode = touchMode;

    /**
     * 更新容器缩放：scale = min(视口宽/800, 视口高/600)，不超过 1
     */
    function fitCanvas() {
        const container = document.getElementById('gameContainer');
        if (!container) return;

        const scale = Math.min(
            window.innerWidth / DESIGN_WIDTH,
            window.innerHeight / DESIGN_HEIGHT,
            1
        );
        container.style.transform = `scale(${scale})`;

        // 菜单/按钮反缩放倍数（1/scale，上限 1.7），保持移动端可读
        const uiZoom = Math.min(1.7, Math.max(1, 1 / scale));
        document.documentElement.style.setProperty('--ui-zoom', uiZoom.toFixed(3));
        document.body.classList.toggle('mobile-ui', scale < 0.85);
    }

    /**
     * 触屏设备默认启用触屏控制（用户已保存的设置优先；mobile 测试参数强制覆盖）
     */
    function applyDefaultControl() {
        if (!touchMode) return;
        try {
            const saved = JSON.parse(localStorage.getItem('planewar_settings') || '{}');
            if (isMobileParam || saved.controlType === undefined) {
                if (window.game) {
                    window.game.config.controlType = 'touch';
                }
            }
        } catch (e) {
            if (window.game) {
                window.game.config.controlType = 'touch';
            }
        }
    }

    /**
     * 触屏设备：设置开关显示为 键盘 ⇄ 触屏
     */
    function relabelControlSwitch() {
        if (!touchMode) return;
        const mouseLabel = document.getElementById('controlMouseLabel');
        if (mouseLabel) mouseLabel.textContent = '触屏';
    }

    /**
     * 虚拟按钮事件（技能 / 暂停）
     */
    function setupTouchButtons() {
        if (!touchMode) return;

        const specialBtn = document.getElementById('touchSpecialBtn');
        specialBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const player = window.game?.player;
            if (player && player.canUseSpecial && player.canUseSpecial()) {
                player.useSpecialAbility();
            }
        });

        const pauseBtn = document.getElementById('touchPauseBtn');
        pauseBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const game = window.game;
            if (game && game.stateManager) {
                const state = game.stateManager.getCurrentState();
                if (state === 'playing') {
                    game.pause();
                } else if (state === 'paused') {
                    game.resume();
                }
            }
        });
    }

    /**
     * 随游戏状态显隐虚拟按钮（观察 body.game-playing class）
     */
    function observePlayingState() {
        const controls = document.getElementById('touchControls');
        if (!controls) return;

        const update = () => {
            const playing = document.body.classList.contains('game-playing');
            controls.classList.toggle('visible', playing);
        };

        new MutationObserver(update).observe(document.body, { attributes: true, attributeFilter: ['class'] });
        update();
    }

    /**
     * 初始化（DOM 就绪后）
     */
    function init() {
        fitCanvas();
        window.addEventListener('resize', fitCanvas);
        window.addEventListener('orientationchange', () => setTimeout(fitCanvas, 150));

        // 游戏就绪后应用触屏默认控制与开关文案
        window.addEventListener('gameReadyComplete', () => {
            applyDefaultControl();
            relabelControlSwitch();
            setupTouchButtons();
        });

        observePlayingState();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
