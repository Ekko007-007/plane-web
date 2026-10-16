/**
 * 飞机大战游戏入口文件
 * 负责初始化和启动游戏
 */

// 游戏实例
let game = null;

/**
 * 文档加载完成后初始化游戏
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('飞机大战游戏启动中...');
    
    // 立即显示加载界面
    showImmediateLoadingScreen();
    
    // 检查浏览器兼容性
    if (!checkBrowserCompatibility()) {
        showCompatibilityError();
        return;
    }
    
    // 创建临时的子弹、敌机、道具类（简化版本）
    // createTemporaryClasses(); // 移除临时类，使用正确的类定义
    
    // 直接初始化游戏，跳过旧的加载系统
    initGame().catch(error => {
        console.error('游戏初始化失败:', error);
        showLoadError();
    });
});

/**
 * 立即显示加载界面
 */
function showImmediateLoadingScreen() {
    console.log('=== 立即显示加载界面 ===');
    
    // 注意：不要强制隐藏主菜单，让GameStateManager控制菜单显示
    // 主菜单的显示/隐藏应该由GameStateManager统一管理
    
    // 创建加载界面
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'immediateLoading';
    loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #000814, #001d3d, #003566);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #00ffff;
        font-family: Arial, sans-serif;
        z-index: 10000;
        overflow: hidden;
    `;
    
    loadingOverlay.innerHTML = `
        <div style="text-align: center;">
            <!-- 转圈加载器 -->
            <div style="margin-bottom: 40px; position: relative; display: inline-block;">
                <div style="width: 120px; height: 120px; border: 4px solid rgba(0, 255, 255, 0.2); border-radius: 50%; position: relative;">
                    <div style="position: absolute; top: -4px; left: -4px; width: 120px; height: 120px; border: 4px solid transparent; border-top: 4px solid #00ffff; border-right: 4px solid #00ccff; border-radius: 50%; animation: spin 1.5s linear infinite;"></div>
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 40px; animation: pulse 2s ease-in-out infinite;">🚀</div>
                </div>
            </div>
            
            <h1 style="font-size: 48px; margin: 0 0 20px; text-shadow: 0 0 20px #00ffff;">✈️ 飞机大战</h1>
            <p style="font-size: 22px; margin: 0; color: #00ffff;">正在启动游戏系统...</p>
        </div>
        
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            @keyframes pulse {
                0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; }
            }
        </style>
    `;
    
    document.body.appendChild(loadingOverlay);
    console.log('立即加载界面已显示');
}

/**
 * 检查浏览器兼容性
 */
function checkBrowserCompatibility() {
    // 检查必要的API支持
    const requiredFeatures = [
        'requestAnimationFrame',
        'addEventListener',
        'localStorage',
        'JSON'
    ];
    
    for (let feature of requiredFeatures) {
        if (!(feature in window)) {
            console.error(`浏览器不支持 ${feature}`);
            return false;
        }
    }
    
    // 检查Canvas支持
    const canvas = document.createElement('canvas');
    if (!canvas.getContext || !canvas.getContext('2d')) {
        console.error('浏览器不支持Canvas 2D');
        return false;
    }
    
    // 检查音频支持
    const audio = document.createElement('audio');
    if (!audio.play) {
        console.warn('浏览器音频支持有限');
    }
    
    return true;
}

/**
 * 显示兼容性错误
 */
function showCompatibilityError() {
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) {
        gameContainer.innerHTML = `
            <div style="text-align: center; padding: 50px; color: white;">
                <h2>浏览器兼容性问题</h2>
                <p>您的浏览器版本过旧，无法运行此游戏。</p>
                <p>请升级到最新版本的Chrome、Firefox、Safari或Edge浏览器。</p>
            </div>
        `;
    }
}

/**
 * 显示加载错误
 */
function showLoadError() {
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) {
        gameContainer.innerHTML = `
            <div style="text-align: center; padding: 50px; color: white;">
                <h2>加载错误</h2>
                <p>游戏资源加载失败，请刷新页面重试。</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px;">刷新页面</button>
            </div>
        `;
    }
}

/**
 * 加载游戏资源
 */
async function loadGameResources() {
    console.log('开始加载游戏资源...');
    
    // 显示加载进度
    showLoadingProgress();
    
    try {
        // 快速加载基础资源，主要的音频加载会在后面的全屏界面显示
        await updateLoadingProgress('正在检查浏览器兼容性...', 20);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await updateLoadingProgress('正在初始化游戏引擎...', 60);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await updateLoadingProgress('正在准备渲染系统...', 90);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await updateLoadingProgress('基础资源加载完成！', 100);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('游戏资源加载完成');
        hideLoadingProgress();
        
    } catch (error) {
        hideLoadingProgress();
        throw error;
    }
}

/**
 * 显示加载进度
 */
function showLoadingProgress() {
    const gameCanvas = document.getElementById('gameCanvas');
    const ctx = gameCanvas.getContext('2d');
    
    // 绘制加载界面
    ctx.fillStyle = '#000814';
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    ctx.fillStyle = '#00ffff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('加载中...', gameCanvas.width / 2, gameCanvas.height / 2);
    
    // 绘制加载动画
    let loadingAngle = 0;
    const loadingInterval = setInterval(() => {
        ctx.fillStyle = '#000814';
        ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
        
        ctx.fillStyle = '#00ffff';
        ctx.fillText('加载中...', gameCanvas.width / 2, gameCanvas.height / 2 - 30);
        
        // 旋转的加载指示器
        ctx.save();
        ctx.translate(gameCanvas.width / 2, gameCanvas.height / 2 + 30);
        ctx.rotate(loadingAngle);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI);
        ctx.stroke();
        ctx.restore();
        
        loadingAngle += 0.1;
    }, 50);
    
    // 保存interval用于清理
    window.loadingInterval = loadingInterval;
}

/**
 * 隐藏加载进度
 */
function hideLoadingProgress() {
    if (window.loadingInterval) {
        clearInterval(window.loadingInterval);
        window.loadingInterval = null;
    }
}

/**
 * 更新加载进度
 */
async function updateLoadingProgress(message, progress) {
    const gameCanvas = document.getElementById('gameCanvas');
    const ctx = gameCanvas.getContext('2d');
    
    // 清除画布
    ctx.fillStyle = '#000814';
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // 绘制进度条背景
    const barWidth = 300;
    const barHeight = 20;
    const barX = (gameCanvas.width - barWidth) / 2;
    const barY = gameCanvas.height / 2 + 20;
    
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // 绘制进度条
    const progressWidth = (barWidth - 4) * (progress / 100);
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(barX + 2, barY + 2, progressWidth, barHeight - 4);
    
    // 绘制加载文字
    ctx.fillStyle = '#00ffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('正在加载游戏...', gameCanvas.width / 2, gameCanvas.height / 2 - 40);
    
    // 绘制具体进度信息
    ctx.font = '14px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(message, gameCanvas.width / 2, gameCanvas.height / 2 - 10);
    
    // 绘制百分比
    ctx.font = '12px Arial';
    ctx.fillStyle = '#00ffff';
    ctx.fillText(`${progress}%`, gameCanvas.width / 2, barY + barHeight + 20);
}

/**
 * 显示游戏初始化进度
 */
function showGameInitProgress() {
    // 更新开始游戏按钮状态
    const startGameBtn = document.getElementById('startGame');
    if (startGameBtn) {
        startGameBtn.disabled = true;
        startGameBtn.textContent = '初始化中...';
        startGameBtn.style.opacity = '0.6';
        startGameBtn.style.cursor = 'not-allowed';
    }
    
    // 显示初始化消息
    const gameCanvas = document.getElementById('gameCanvas');
    const ctx = gameCanvas.getContext('2d');
    
    // 保存当前canvas内容，在主菜单上显示初始化状态
    if (!window.initializationOverlay) {
        window.initializationOverlay = true;
        
        // 在主菜单上添加半透明遮罩
        const overlay = document.createElement('div');
        overlay.id = 'initOverlay';
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #00ffff;
            font-family: Arial, sans-serif;
            z-index: 1000;
        `;
        
        overlay.innerHTML = `
            <div style="text-align: center;">
                <div id="initSpinner" style="
                    border: 3px solid #0a4a6b;
                    border-top: 3px solid #00ffff;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                "></div>
                <h3 style="margin: 0; font-size: 18px;">正在初始化游戏系统...</h3>
                <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.8;">这可能需要几秒钟时间</p>
            </div>
        `;
        
        // 添加CSS动画
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.appendChild(overlay);
        }
    }
}

/**
 * 隐藏游戏初始化进度
 */
function hideGameInitProgress() {
    // 恢复开始游戏按钮状态
    const startGameBtn = document.getElementById('startGame');
    if (startGameBtn) {
        startGameBtn.disabled = false;
        startGameBtn.textContent = '开始游戏';
        startGameBtn.style.opacity = '1';
        startGameBtn.style.cursor = 'pointer';
    }
    
    // 移除初始化遮罩
    const overlay = document.getElementById('initOverlay');
    if (overlay) {
        overlay.remove();
    }
    
    window.initializationOverlay = false;
}

/**
 * 初始化游戏
 */
async function initGame() {
    try {
        console.log('初始化游戏...');
        
        // 创建游戏实例，会自动显示全屏加载界面并进行音频初始化
        game = new Game();
        console.log('Game实例创建完成，当前状态:', game.stateManager.getCurrentState());
        
        // 将游戏实例暴露到全局作用域（用于调试）
        window.game = game;
        
        // 等待游戏系统完全准备就绪
        console.log('开始等待游戏系统准备完成...');
        await new Promise((resolve, reject) => {
            // 设置超时保护，避免无限等待
            const timeout = setTimeout(() => {
                console.error('游戏初始化超时（45秒）');
                reject(new Error('游戏初始化超时'));
            }, 45000);
            
            // 监听游戏准备完成事件
            const handleGameReady = (event) => {
                console.log('主进程收到游戏准备完成事件:', event.detail.message);
                clearTimeout(timeout);
                window.removeEventListener('gameReadyComplete', handleGameReady);
                
                // 执行加载完成的回调
                onLoadingComplete(resolve);
            };
            window.addEventListener('gameReadyComplete', handleGameReady);
            console.log('gameReadyComplete事件监听器已注册');
        });
        
        // 预热音频系统（需要用户交互）
        document.addEventListener('click', () => {
            if (game.audioManager) {
                game.audioManager.warmUp();
            }
        }, { once: true });
        
        document.addEventListener('keydown', () => {
            if (game.audioManager) {
                game.audioManager.warmUp();
            }
        }, { once: true });
        
        console.log('游戏初始化完成！');
        
        // 显示操作说明
        showGameInstructions();
        
    } catch (error) {
        console.error('游戏初始化失败:', error);
        showInitError(error);
    }
}

/**
 * 显示初始化错误
 */
function showInitError(error) {
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) {
        gameContainer.innerHTML = `
            <div style="text-align: center; padding: 50px; color: white;">
                <h2>游戏初始化失败</h2>
                <p>错误信息: ${error.message}</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px;">重新加载</button>
            </div>
        `;
    }
}

/**
 * 加载完成的回调函数
 */
function onLoadingComplete(resolve) {
    console.log('🎯 游戏加载完成！执行回调...');
    
    // 移除立即显示的加载界面
    const immediateLoading = document.getElementById('immediateLoading');
    if (immediateLoading) {
        immediateLoading.remove();
        console.log('移除立即加载界面');
    }
    
    // 移除GameStateManager创建的加载界面
    const fullScreenLoading = document.getElementById('fullScreenLoading');
    if (fullScreenLoading) {
        fullScreenLoading.remove();
        console.log('移除全屏加载界面');
    }
    
    // 可以在这里添加任何加载完成后需要执行的逻辑
    // 例如：显示欢迎消息、检查用户设置、显示更新日志等
    
    // 快速显示主菜单
    setTimeout(() => {
        console.log('✅ 回调执行完成，显示主菜单');
        
        // 调用游戏的显示主菜单方法
        if (game && game.showMainMenu) {
            game.showMainMenu();
        }
        
        // 显示操作说明
        showGameInstructions();
        
        // 通知Promise resolve
        resolve();
        
    }, 100); // 从300ms减少到100ms，快速切换
}

/**
 * 显示游戏说明
 */
function showGameInstructions() {
    // 可以在这里显示初次进入游戏的说明
    console.log('游戏说明:');
    console.log('- WASD或方向键: 移动战机');
    console.log('- 空格键: 射击');
    console.log('- F键: 使用特殊技能');
    console.log('- ESC键: 暂停/继续游戏');
}

// 临时类函数已移除，使用正确的类定义

/**
 * 窗口关闭前的清理
 */
window.addEventListener('beforeunload', function() {
    if (game) {
        game.destroy();
    }
});

/**
 * 错误处理
 */
window.addEventListener('error', function(event) {
    console.error('游戏运行时错误:', event.error);
});

/**
 * 调试功能（仅在开发环境）
 */
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // 移除F12键处理，让浏览器调试工具优先
    // 可以使用其他键来切换调试模式，比如F9
    window.addEventListener('keydown', function(event) {
        if (event.key === 'F9') {
            event.preventDefault();
            if (game) {
                game.config.debug = !game.config.debug;
                console.log('调试模式:', game.config.debug ? '开启' : '关闭');
            }
        }
    });
    
    console.log('开发模式激活，按F9切换调试信息显示（F12用于浏览器调试工具）');
}

console.log('飞机大战游戏脚本加载完成'); 