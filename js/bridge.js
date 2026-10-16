/**
 * WebView2 宿主桥接脚本（桌面程序集成专用）
 *
 * 职责：
 * 1. 页面加载完成后向宿主发送 ready 消息（回传 URL 参数 plane，用于参数校验与标题状态）。
 * 2. 读取 URL 参数 plane（1/2/3），游戏加载完成后将玩家战机素材染色为对应颜色：
 *    1 = 雷霆蓝（与原素材一致风格），2 = 赤焰红，3 = 疾电金；
 *    染色算法（灰度亮度 → 目标颜色）与战机选择窗体的效果保持一致。
 *
 * 注意：本脚本仅在与 WebView2 宿主集成时发送消息（window.chrome.webview 存在），
 * 在普通浏览器中调试时会自动跳过消息发送，不影响游戏运行。
 */
(function () {
    'use strict';

    // 战机配色（与 SelectionForm 一致）
    var PLANE_COLORS = {
        1: { r: 70, g: 150, b: 255 },   // 雷霆：蓝
        2: { r: 255, g: 90, b: 70 },    // 赤焰：红
        3: { r: 255, g: 190, b: 60 },   // 疾电：金
    };

    /**
     * 向桌面程序发送消息（异常时静默，保证浏览器环境可用）。
     */
    function postToHost(message) {
        try {
            if (window.chrome && window.chrome.webview) {
                window.chrome.webview.postMessage(typeof message === 'string' ? message : JSON.stringify(message));
            }
        } catch (e) {
            // 非 WebView2 环境或消息失败时忽略
        }
    }

    /**
     * 通知宿主：页面加载完成、游戏已就绪。
     * 回传 URL 参数中的战机编号，宿主据此校验参数传递是否正确。
     */
    function postReady() {
        var params = new URLSearchParams(window.location.search);
        var planeId = parseInt(params.get('plane') || '1', 10);
        postToHost({ type: 'ready', planeId: planeId });
    }

    /**
     * 对图片做“灰度亮度 → 目标颜色”染色（保留 Alpha 与明暗细节）。
     * 与桌面端 SelectionForm 使用的 ColorMatrix 效果一致。
     */
    function tintImage(img, r, g, b) {
        var canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        var data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var px = data.data;
        var cr = r / 255, cg = g / 255, cb = b / 255;
        for (var i = 0; i < px.length; i += 4) {
            var lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
            px[i] = Math.min(255, lum * cr + 15);
            px[i + 1] = Math.min(255, lum * cg + 15);
            px[i + 2] = Math.min(255, lum * cb + 15);
            // Alpha 保持不变（透明背景不受影响）
        }
        ctx.putImageData(data, 0, 0);
        return canvas;
    }

    /**
     * 将 ImageManager 中缓存的玩家战机素材替换为染色版本。
     * 在 gameReadyComplete 事件后执行（此时所有图片已加载完成、游戏尚未开始，
     * 玩家战机还未绘制）；若素材尚未就绪则短暂轮询重试。
     */
    function swapPlayerSkin(planeId, attempt) {
        attempt = attempt || 0;
        var manager = window.ImageManager && window.ImageManager.getInstance();
        var src = manager && manager.getImage('player');
        if (!src) {
            // 素材还没加载完：最多重试 20 次（约 10 秒）
            if (attempt < 20) {
                setTimeout(function () { swapPlayerSkin(planeId, attempt + 1); }, 500);
            }
            return;
        }

        ['player', 'player_damaged'].forEach(function (name) {
            var image = manager.getImage(name);
            if (image) {
                // 染色版 canvas 与原图同尺寸，绘制逻辑无感知
                manager.images.set(name, tintImage(image, PLANE_COLORS[planeId].r,
                    PLANE_COLORS[planeId].g, PLANE_COLORS[planeId].b));
            }
        });
        console.log('玩家战机皮肤已应用: plane=' + planeId);
    }

    /**
     * 根据 URL 参数 plane 切换玩家战机素材。
     */
    function applyPlaneSkin() {
        var params = new URLSearchParams(window.location.search);
        var planeId = parseInt(params.get('plane') || '1', 10);
        if (!PLANE_COLORS[planeId]) {
            console.log('未知战机编号，保持默认素材: ' + planeId);
            return;
        }

        // 游戏初始化完成（图片加载完毕）后再替换，保证替换的是最终素材；
        // 同时通知宿主“游戏已真正就绪”（主菜单可见，可开始游戏）
        window.addEventListener('gameReadyComplete', function () {
            swapPlayerSkin(planeId);
            postToHost({ type: 'gameReady', planeId: planeId });
        });
    }

    /**
     * autostart 模式（自动化验证专用，URL 带 autostart=1 时启用）：
     * 游戏就绪后自动点击“开始游戏”按钮并通知宿主。
     * 玩家无输入时停留在出生点，便于外部截图验证战机皮肤。
     */
    function applyAutoStart() {
        var params = new URLSearchParams(window.location.search);
        // 兼容多个入口参数，供自动化验证使用
        var page = params.get('page');
        if (params.get('autostart') !== '1' && params.get('opensettings') !== '1' &&
            page !== 'leaderboard' && page !== 'achievements' && page !== 'gameover') {
            return;
        }
        var openSettings = params.get('opensettings') === '1';
        window.addEventListener('gameReadyComplete', function () {
            // 先安装状态上报钩子（确保捕获菜单切换的状态变化）；
            // 同时检查当前页面相关控件的存在性，供自动化验证
            var sm = window.game && window.game.stateManager;
            var idsByPage = {
                settings: ['playerLives', 'playerLivesValue', 'invincibleMode',
                    'soundVolume', 'musicVolume', 'controlTypeSwitch'],
                leaderboard: ['leaderboardList', 'clearLeaderboard'],
                achievements: ['achievementsList', 'achievementsProgressBar', 'achievementsProgressText'],
                gameover: ['finalScore', 'newRecordBadge', 'gameOverStats']
            };
            var checkPage = page || (openSettings ? 'settings' : 'game');
            var checkIds = idsByPage[checkPage] || [];
            // 移动端模式：额外检查虚拟按钮存在性
            if (params.get('mobile') === '1') {
                checkIds = checkIds.concat(['touchControls', 'touchSpecialBtn', 'touchPauseBtn']);
            }
            var uiOk = checkIds.every(function (id) { return !!document.getElementById(id); });
            if (sm && sm.changeState) {
                var original = sm.changeState.bind(sm);
                sm.changeState = function (state) {
                    original(state);
                    postToHost({ type: 'debugState', state: String(state), ui: uiOk ? 'ok' : 'missing' });
                };
            }

            // 自动打开目标页面：游戏结束页直接切换状态（不经 saveScore，无数据污染）
            if (page === 'gameover') {
                setTimeout(function () {
                    if (window.game && window.game.stateManager) {
                        window.game.stateManager.changeState('gameOver', {
                            score: 123456, level: 5, kills: 66, achievements: 7,
                            rank: 0, isNewRecord: true
                        });
                    }
                }, 1200);
                return;
            }

            var targetId = page === 'leaderboard' ? 'showLeaderboard'
                : page === 'achievements' ? 'showAchievements'
                : openSettings ? 'showSettings' : 'startGame';
            setTimeout(function () {
                var btn = document.getElementById(targetId);
                if (btn) {
                    btn.click();
                }
            }, 1200);

            // 自动化验证：模拟设置控件交互（滑杆/输入框），验证设置链路生效后恢复原值
            if (openSettings) {
                setTimeout(function () {
                    try {
                        var game = window.game;
                        var origLives = game ? game.config.playerLives : 1;
                        var origName = game ? game.config.playerName : '玩家';
                        var origSfx = game && game.audioManager ? game.audioManager.sfxVolume : 0.7;
                        var r = { lives: false, nickname: false, volume: false };

                        var livesSlider = document.getElementById('playerLives');
                        if (livesSlider) {
                            livesSlider.value = '3';
                            livesSlider.dispatchEvent(new Event('input', { bubbles: true }));
                            r.lives = game && game.config.playerLives === 3;
                        }

                        var nameInput = document.getElementById('playerName');
                        if (nameInput) {
                            nameInput.value = '自动化测试';
                            nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                            r.nickname = game && game.config.playerName === '自动化测试';
                        }

                        var vol = document.getElementById('soundVolume');
                        if (vol) {
                            vol.value = '25';
                            vol.dispatchEvent(new Event('input', { bubbles: true }));
                            r.volume = game && game.audioManager &&
                                Math.abs(game.audioManager.sfxVolume - 0.25) < 0.01;
                        }

                        // 恢复原值（避免污染用户设置）
                        if (livesSlider) {
                            livesSlider.value = String(origLives);
                            livesSlider.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                        if (nameInput) {
                            nameInput.value = origName;
                            nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                        if (vol) {
                            vol.value = String(Math.round(origSfx * 100));
                            vol.dispatchEvent(new Event('input', { bubbles: true }));
                        }

                        postToHost({ type: 'settingsCheck',
                            ok: r.lives && r.nickname && r.volume,
                            detail: 'lives=' + r.lives + ' name=' + r.nickname + ' vol=' + r.volume });
                    } catch (err) {
                        postToHost({ type: 'settingsCheck', ok: false, detail: 'exception ' + err.message });
                    }
                }, 3000);
            }

            // 移动端模式 + 自动开局：模拟触摸拖动，验证触屏控制链路（战机跟随触摸点）
            if (params.get('mobile') === '1' && params.get('autostart') === '1') {
                setTimeout(function () {
                    // 注意：class 是全局词法绑定，不在 window 上，需用裸引用
                    var im = (typeof InputManager !== 'undefined') ? InputManager.getInstance() : null;
                    if (im) {
                        im.touch.active = true;
                        im.touch.hasMoved = true;
                        im.touch.x = 300;
                        im.touch.y = 200;
                    }
                }, 3500);
                setTimeout(function () {
                    var p = window.game && window.game.player;
                    postToHost({
                        type: 'debugTouch',
                        x: Math.round(p ? p.position.x : -1),
                        y: Math.round(p ? p.position.y : -1)
                    });
                }, 5000);
            }

            // 自动化模式：游戏窗口失焦会自动暂停，这里立刻恢复，
            // 避免外部焦点切换干扰无人值守验证（仅自动入口模式生效）
            window.addEventListener('blur', function () {
                setTimeout(function () {
                    if (!openSettings && !page && window.game && window.game.stateManager &&
                        window.game.stateManager.getCurrentState() === 'paused') {
                        window.game.resume();
                    }
                }, 100);
            });
        });
    }

    // 初始化
    applyPlaneSkin();
    applyAutoStart();

    if (document.readyState === 'complete') {
        postReady();
    } else {
        window.addEventListener('load', postReady);
    }
})();
