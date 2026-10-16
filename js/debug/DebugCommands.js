/**
 * 调试命令系统 - 用于测试和调试游戏功能
 */
class DebugCommands {
    constructor() {
        this.setupCommands();
    }

    /**
     * 设置调试命令
     */
    setupCommands() {
        // 在控制台添加全局调试函数
        if (typeof window !== 'undefined') {
            // 生成特定类型的敌机
            window.spawnEnemy = (type = 'basic', x = 400, y = 50) => {
                if (window.game) {
                    console.log(`生成敌机: ${type} at (${x}, ${y})`);
                    return window.game.createEnemy(x, y, type);
                }
            };

            // 生成所有类型的敌机用于测试
            window.spawnAllEnemyTypes = () => {
                if (!window.game) return;
                
                const types = ['basic', 'scout', 'fighter', 'heavy', 'elite', 'interceptor', 'bomber'];
                const spacing = 80;
                const startX = 80;
                
                types.forEach((type, index) => {
                    const x = startX + (index % 4) * spacing;
                    const y = 100 + Math.floor(index / 4) * 80;
                    console.log(`生成 ${type} at (${x}, ${y})`);
                    window.game.createEnemy(x, y, type);
                });
            };

            // 生成Boss
            window.spawnBoss = (type = 'standard', x = 400, y = 100) => {
                if (window.game) {
                    console.log(`生成Boss: ${type} at (${x}, ${y})`);
                    return window.game.createBoss(x, y, type);
                }
            };
            
            // 快速生成Boss（跳过警告时间）
            window.spawnBossNow = (type = 'standard') => {
                if (window.game) {
                    console.log(`立即生成Boss: ${type}`);
                    const boss = window.game.createBoss(400, 100, type);
                    if (boss) {
                        boss.warningTimer = 0; // 跳过警告时间
                        boss.y = -boss.height * 0.5; // 设置优化后的起始位置
                        console.log(`Boss起始位置: y=${boss.y}, 目标位置: y=${boss.originalY}`);
                        console.log(`预计入场时间: ${((boss.originalY - boss.y) / 150).toFixed(2)}秒`);
                    }
                    return boss;
                }
            };
            
            // 测试Boss入场速度
            window.testBossEntrance = () => {
                const boss = window.spawnBossNow();
                if (boss) {
                    const startTime = Date.now();
                    const checkEntrance = () => {
                        if (boss.inGameArea) {
                            const duration = (Date.now() - startTime) / 1000;
                            console.log(`✅ Boss入场完成！实际用时: ${duration.toFixed(2)}秒`);
                        } else if (boss.active) {
                            setTimeout(checkEntrance, 100);
                        }
                    };
                    checkEntrance();
                }
            };
            
            // 测试Boss激光攻击
            window.testBossLaser = () => {
                if (window.game && window.game.boss && window.game.boss.active) {
                    console.log('强制触发Boss激光攻击');
                    window.game.boss.fireLaserBeam();
                    console.log('激光攻击已发射，请检查红色激光束是否显示');
                } else {
                    console.log('需要先召唤Boss: spawnBossNow()');
                    // 自动召唤Boss并测试激光
                    const boss = window.spawnBossNow();
                    if (boss) {
                        console.log('Boss已召唤，2秒后发射激光测试');
                        setTimeout(() => {
                            if (boss.active) {
                                boss.fireLaserBeam();
                                console.log('激光测试完成 - 应看到红色激光束');
                            }
                        }, 2000);
                    }
                }
            };
            
            // 测试Boss性能
            window.testBossPerformance = () => {
                if (!window.game) return;
                
                console.log('开始Boss性能测试...');
                const boss = window.spawnBossNow();
                if (!boss) return;
                
                let frameCount = 0;
                let totalFrameTime = 0;
                let maxFrameTime = 0;
                let minFrameTime = Infinity;
                
                const startTime = performance.now();
                
                const measureFrame = () => {
                    const frameStart = performance.now();
                    
                    // 模拟一帧的处理
                    requestAnimationFrame(() => {
                        const frameEnd = performance.now();
                        const frameTime = frameEnd - frameStart;
                        
                        frameCount++;
                        totalFrameTime += frameTime;
                        maxFrameTime = Math.max(maxFrameTime, frameTime);
                        minFrameTime = Math.min(minFrameTime, frameTime);
                        
                        // 测试5秒
                        if (performance.now() - startTime < 5000) {
                            measureFrame();
                        } else {
                            const avgFrameTime = totalFrameTime / frameCount;
                            const fps = 1000 / avgFrameTime;
                            
                            console.log('=== Boss性能测试结果 ===');
                            console.log(`测试时长: 5秒`);
                            console.log(`总帧数: ${frameCount}`);
                            console.log(`平均帧时间: ${avgFrameTime.toFixed(2)}ms`);
                            console.log(`平均FPS: ${fps.toFixed(1)}`);
                            console.log(`最大帧时间: ${maxFrameTime.toFixed(2)}ms`);
                            console.log(`最小帧时间: ${minFrameTime.toFixed(2)}ms`);
                            
                            // 触发激光攻击测试性能
                            if (boss.active) {
                                console.log('\n开始激光攻击性能测试...');
                                boss.fireLaserBeam();
                                
                                setTimeout(() => {
                                    console.log('激光攻击性能测试完成');
                                    console.log('请观察游戏是否流畅，战机移动和子弹发射是否正常');
                                }, 3000);
                            }
                        }
                    });
                };
                
                measureFrame();
            };

            // 生成所有类型的Boss
            window.spawnAllBossTypes = () => {
                if (!window.game) return;
                
                const types = ['standard', 'fast', 'heavy', 'ultimate'];
                const spacing = 150;
                const startX = 150;
                
                types.forEach((type, index) => {
                    const x = startX + index * spacing;
                    const y = 100 + index * 20;
                    console.log(`生成Boss ${type} at (${x}, ${y})`);
                    setTimeout(() => {
                        window.game.createBoss(x, y, type);
                    }, index * 1000); // 延迟生成，避免重叠
                });
            };

            // 切换图片渲染模式
            window.toggleImageRender = () => {
                if (!window.game) return;
                
                const useImage = !window.game.player?.useImageRender;
                console.log(`切换图片渲染模式: ${useImage ? '开启' : '关闭'}`);
                
                // 切换玩家
                if (window.game.player) {
                    window.game.player.useImageRender = useImage;
                }
                
                // 切换敌机
                window.game.enemies.forEach(enemy => {
                    enemy.useImageRender = useImage;
                });
                
                // 切换Boss
                if (window.game.boss) {
                    window.game.boss.useImageRender = useImage;
                }
                
                // 切换僚机
                if (window.game.player?.wingmen) {
                    window.game.player.wingmen.forEach(wingman => {
                        wingman.useImageRender = useImage;
                    });
                }
            };

            // 重新加载图片
            window.reloadImages = () => {
                const imageManager = window.ImageManager?.getInstance();
                if (imageManager) {
                    console.log('重新加载图片资源...');
                    imageManager.clear();
                    imageManager.loadAllImages().then(() => {
                        console.log('图片重新加载完成');
                    });
                } else {
                    console.error('ImageManager未找到');
                }
            };

            // 设置敌机生成概率
            window.setEnemySpawnRate = (type, probability) => {
                if (!window.game?.enemySpawner) return;
                
                const oldProb = window.game.enemySpawner.spawnProbabilities[type];
                window.game.enemySpawner.spawnProbabilities[type] = probability;
                console.log(`${type} 生成概率从 ${oldProb} 调整为 ${probability}`);
            };

            // 显示当前敌机生成概率
            window.showSpawnRates = () => {
                if (!window.game?.enemySpawner) return;
                
                console.log('当前敌机生成概率:');
                console.table(window.game.enemySpawner.spawnProbabilities);
            };

            // 增加轰炸机出现率（用于测试）
            window.increaseBomberRate = () => {
                if (!window.game?.enemySpawner) return;
                
                const spawner = window.game.enemySpawner;
                spawner.spawnProbabilities.bomber = 0.3; // 30%概率
                spawner.spawnProbabilities.basic = 0.2;
                spawner.spawnProbabilities.scout = 0.2;
                spawner.spawnProbabilities.fighter = 0.15;
                spawner.spawnProbabilities.heavy = 0.1;
                spawner.spawnProbabilities.elite = 0.05;
                
                console.log('轰炸机出现率已增加到30%');
                console.table(spawner.spawnProbabilities);
            };

            // 显示碰撞边界（调试用）
            window.toggleCollisionBounds = () => {
                if (!window.game) return;
                
                if (!window.game.showCollisionBounds) {
                    window.game.showCollisionBounds = true;
                    console.log('碰撞边界显示已开启');
                } else {
                    window.game.showCollisionBounds = false;
                    console.log('碰撞边界显示已关闭');
                }
            };

            // 测试消息显示
            window.testMessage = (text = '测试消息显示', duration = 2000) => {
                if (!window.game) return;
                
                console.log(`显示测试消息: "${text}", 持续时间: ${duration}ms`);
                window.game.showMessage(text, duration);
            };

            // 测试Boss激光警告消息
            window.testLaserWarning = () => {
                if (!window.game) return;
                
                console.log('测试Boss激光警告消息序列');
                window.game.showMessage('⚡ 危险！Boss正在充能激光攻击！ ⚡', 2500);
                setTimeout(() => {
                    window.game.showMessage('💥 激光即将发射！快速躲避！ 💥', 1500);
                }, 500);
                setTimeout(() => {
                    window.game.showMessage('🔥 激光发射！ 🔥', 2000);
                }, 1000);
            };

            // 测试玩家激光武器
            window.testPlayerLaser = () => {
                if (!window.game || !window.game.player) {
                    console.log('需要先开始游戏');
                    return;
                }
                
                console.log('测试玩家激光武器...');
                
                // 强制切换到激光武器
                window.game.player.weaponType = 'laser_beam';
                window.game.player.weaponLevel = 3;
                
                // 创建测试激光
                const laser = window.game.createBullet(
                    window.game.player.position.x,
                    window.game.player.position.y - 30,
                    0, -800,
                    'laser_beam'
                );
                
                if (laser) {
                    console.log('激光创建成功:', {
                        type: laser.type,
                        color: laser.color,
                        size: `${laser.width}x${laser.height}`,
                        isLaserBeam: laser.isLaserBeam,
                        damage: laser.damage,
                        position: `(${laser.position.x}, ${laser.position.y})`
                    });
                    
                    // 生成一个敌机来测试碰撞
                    const enemy = window.game.createEnemy(
                        window.game.player.position.x,
                        window.game.player.position.y - 100,
                        'basic'
                    );
                    
                    if (enemy) {
                        console.log('测试敌机已生成，激光应该能击中它');
                    }
                } else {
                    console.log('激光创建失败');
                }
            };
            
            // 测试所有武器类型
            window.testAllWeapons = () => {
                if (!window.game || !window.game.player) {
                    console.log('需要先开始游戏');
                    return;
                }
                
                const weapons = ['player', 'laser', 'laser_beam', 'plasma', 'missile', 'spread', 'piercing', 'energy_beam'];
                const spacing = 50;
                const startY = window.game.player.position.y - 50;
                
                weapons.forEach((weapon, index) => {
                    const x = window.game.player.position.x + (index - weapons.length/2) * spacing;
                    const bullet = window.game.createBullet(x, startY, 0, -400, weapon);
                    
                    if (bullet) {
                        console.log(`${weapon} 武器测试: 颜色=${bullet.color}, 大小=${bullet.width}x${bullet.height}`);
                    }
                });
                
                console.log('所有武器类型已发射，请观察效果');
            };

            // 显示调试帮助
            window.debugHelp = () => {
                console.log(`
=== 飞机大战调试命令 ===

基础命令:
• spawnEnemy(type, x, y) - 生成指定类型敌机
• spawnAllEnemyTypes() - 生成所有类型敌机用于测试
• spawnBoss(type, x, y) - 生成指定类型Boss
• spawnAllBossTypes() - 生成所有类型Boss

图片相关:
• toggleImageRender() - 切换图片/几何图形渲染模式
• reloadImages() - 重新加载图片资源

生成控制:
• setEnemySpawnRate(type, probability) - 设置敌机生成概率
• showSpawnRates() - 显示当前生成概率
• increaseBomberRate() - 增加轰炸机出现率(测试用)

调试功能:
• toggleCollisionBounds() - 显示/隐藏碰撞边界
• testBossLaser() - 测试Boss激光攻击
• testBossEntrance() - 测试Boss入场速度
• testMessage(text, duration) - 测试消息显示
• testLaserWarning() - 测试Boss激光警告消息
• testBossPerformance() - 测试Boss攻击性能

移动和碰撞测试:
• testPlayerMovementBounds() - 测试玩家移动边界逻辑
• showCollisionBounds() - 显示碰撞边界可视化
• quickTestMovementFix() - 快速测试移动边界修复
• testSmoothBoundaryPush() - 测试平滑边界推出逻辑
• quickVerifyBoundaryFix() - 快速验证边界修复效果
• testBossWallCollision() - 测试Boss墙壁阻挡效果
• testBossWall() - 简单测试Boss墙壁效果

敌机类型: basic, scout, fighter, heavy, elite, interceptor, bomber
Boss类型: standard, fast, heavy, ultimate

示例:
spawnEnemy('bomber', 400, 100)  // 生成轰炸机
increaseBomberRate()            // 增加轰炸机出现率
toggleImageRender()             // 切换渲染模式
                `);
            };

            // 测试Boss激光渲染
            window.testBossLaserRender = () => {
                if (!window.game) {
                    console.log('需要先开始游戏');
                    return;
                }
                
                console.log('测试Boss激光渲染...');
                
                // 创建多个Boss激光进行测试
                const laserCount = 3;
                const spacing = 100;
                const startX = window.game.config.canvasWidth / 2 - spacing;
                
                for (let i = 0; i < laserCount; i++) {
                    const laser = window.game.createBullet(
                        startX + i * spacing,
                        100,
                        0, 0, // 静止的激光
                        'boss_laser'
                    );
                    
                    if (laser) {
                        // 设置激光范围
                        laser.laserStartY = 100;
                        laser.laserEndY = window.game.config.canvasHeight - 50;
                        laser.renderHeight = laser.laserEndY - laser.laserStartY;
                        
                        console.log(`Boss激光 ${i+1} 创建成功:`, {
                            type: laser.type,
                            color: laser.color,
                            size: `${laser.width}x${laser.height}`,
                            isBossLaser: laser.isBossLaser,
                            damage: laser.damage,
                            position: `(${laser.position.x}, ${laser.position.y})`,
                            laserRange: `${laser.laserStartY} - ${laser.laserEndY}`
                        });
                    }
                }
                
                console.log('Boss激光渲染测试完成，应该看到3道红色激光束');
            };
            
            // 对比测试玩家激光和Boss激光
            window.compareLasers = () => {
                if (!window.game) {
                    console.log('需要先开始游戏');
                    return;
                }
                
                console.log('对比测试玩家激光和Boss激光...');
                
                const centerX = window.game.config.canvasWidth / 2;
                
                // 创建玩家激光
                const playerLaser = window.game.createBullet(
                    centerX - 100,
                    200,
                    0, -400,
                    'laser_beam'
                );
                
                // 创建Boss激光
                const bossLaser = window.game.createBullet(
                    centerX + 100,
                    200,
                    0, 0,
                    'boss_laser'
                );
                
                if (bossLaser) {
                    bossLaser.laserStartY = 200;
                    bossLaser.laserEndY = window.game.config.canvasHeight - 50;
                }
                
                console.log('激光对比测试完成:');
                console.log('- 左侧: 玩家激光 (青色, 向上移动)');
                console.log('- 右侧: Boss激光 (红色, 静止)');
            };

            // 测试Boss激光生命周期
            window.testBossLaserLifetime = () => {
                if (!window.game) {
                    console.log('需要先开始游戏');
                    return;
                }
                
                console.log('测试Boss激光生命周期（3秒自动消失）...');
                
                const laser = window.game.createBullet(
                    window.game.config.canvasWidth / 2,
                    100,
                    0, 0, // 静止的激光
                    'boss_laser'
                );
                
                if (laser) {
                    // 设置激光范围
                    laser.laserStartY = 100;
                    laser.laserEndY = window.game.config.canvasHeight - 50;
                    
                    console.log('Boss激光已创建，将在3秒后自动消失');
                    console.log('- 前2.5秒：正常显示');
                    console.log('- 最后0.5秒：渐隐效果');
                    
                    // 监控激光状态
                    const startTime = Date.now();
                    const checkStatus = () => {
                        const elapsed = (Date.now() - startTime) / 1000;
                        
                        if (laser.destroyed) {
                            console.log(`✅ 激光已销毁，实际持续时间: ${elapsed.toFixed(2)}秒`);
                            return;
                        }
                        
                        if (elapsed < 4) { // 最多检查4秒
                            setTimeout(checkStatus, 100);
                        } else {
                            console.log('❌ 激光未在预期时间内销毁');
                        }
                    };
                    
                    setTimeout(checkStatus, 100);
                } else {
                    console.log('激光创建失败');
                }
            };
            
            // 测试Boss完整激光攻击流程
            window.testBossLaserFlow = () => {
                if (!window.game) {
                    console.log('需要先开始游戏');
                    return;
                }
                
                console.log('测试Boss完整激光攻击流程...');
                
                // 召唤Boss
                const boss = window.spawnBossNow();
                if (!boss) {
                    console.log('Boss召唤失败');
                    return;
                }
                
                console.log('Boss已召唤，2秒后开始激光攻击测试');
                
                setTimeout(() => {
                    if (boss.active) {
                        console.log('开始激光攻击...');
                        boss.fireLaserBeam();
                        
                        console.log('激光攻击已触发，观察以下效果：');
                        console.log('1. 激光充能警告消息');
                        console.log('2. 红色激光束出现');
                        console.log('3. 激光持续3秒后自动消失');
                        console.log('4. 最后0.5秒有渐隐效果');
                    }
                }, 2000);
            };

            // 测试玩家战机尺寸
            window.testPlayerSize = () => {
                if (!window.game || !window.game.player) {
                    console.log('需要先开始游戏');
                    return;
                }
                
                const player = window.game.player;
                const bounds = player.getBounds();
                
                console.log('=== 玩家战机尺寸信息 ===');
                console.log(`视觉尺寸: ${player.width} x ${player.height}`);
                console.log(`碰撞边界: ${bounds.right - bounds.left} x ${bounds.bottom - bounds.top}`);
                console.log(`位置: (${player.position.x}, ${player.position.y})`);
                console.log(`碰撞区域: left=${bounds.left}, right=${bounds.right}, top=${bounds.top}, bottom=${bounds.bottom}`);
                
                // 计算面积
                const visualArea = player.width * player.height;
                const collisionArea = (bounds.right - bounds.left) * (bounds.bottom - bounds.top);
                
                console.log(`视觉面积: ${visualArea} 像素²`);
                console.log(`碰撞面积: ${collisionArea} 像素²`);
                console.log(`碰撞面积占视觉面积的比例: ${(collisionArea / visualArea * 100).toFixed(1)}%`);
                
                // 与原始尺寸对比
                const originalArea = 80 * 120; // 原始面积
                const currentArea = player.width * player.height;
                const areaRatio = currentArea / originalArea;
                
                console.log(`原始面积: ${originalArea} 像素²`);
                console.log(`当前面积: ${currentArea} 像素²`);
                console.log(`面积比例: ${(areaRatio * 100).toFixed(1)}% (目标: 80%)`);
            };
            
            // 显示玩家碰撞边界
            window.showPlayerBounds = () => {
                if (!window.game) {
                    console.log('需要先开始游戏');
                    return;
                }
                
                if (!window.game.showCollisionBounds) {
                    window.game.showCollisionBounds = true;
                    console.log('✅ 碰撞边界显示已开启');
                } else {
                    window.game.showCollisionBounds = false;
                    console.log('❌ 碰撞边界显示已关闭');
                }
            };

            // 测试Boss激光特效
            window.testBossLaserEffects = function() {
                console.log('开始测试Boss激光特效...');
                
                // 确保游戏在运行中
                if (!window.game || window.game.gameState !== 'playing') {
                    window.game = window.game || new Game();
                    window.game.gameState = 'playing';
                    window.game.initializeGame();
                    console.log('初始化游戏环境');
                }
                
                // 清除现有敌机
                window.game.enemies = [];
                window.game.bullets = [];
                
                // 创建Boss
                if (!window.game.boss || !window.game.boss.active) {
                    window.game.spawnBoss();
                    console.log('生成Boss');
                }
                
                // 强制Boss进入游戏区域
                if (window.game.boss) {
                    window.game.boss.movementPattern = 'patrol';
                    window.game.boss.y = 100; // 移动到合适位置
                    window.game.boss.warningTimer = 0; // 取消警告
                    window.game.boss.inGameArea = true;
                    console.log('Boss已进入游戏区域');
                    
                    // 立即触发激光攻击
                    setTimeout(() => {
                        if (window.game.boss && window.game.boss.active) {
                            console.log('触发Boss激光攻击！');
                            window.game.boss.fireLaserBeam();
                        }
                    }, 500);
                }
                
                console.log('Boss激光特效测试已启动');
            };

            // 测试Boss碰撞无伤害
            window.testBossCollisionSafe = function() {
                console.log('开始测试Boss碰撞无伤害...');
                
                // 确保游戏在运行中
                if (!window.game || window.game.gameState !== 'playing') {
                    window.game = window.game || new Game();
                    window.game.gameState = 'playing';
                    window.game.initializeGame();
                    console.log('初始化游戏环境');
                }
                
                // 创建Boss
                if (!window.game.boss || !window.game.boss.active) {
                    window.game.spawnBoss();
                    console.log('生成Boss');
                }
                
                // 强制Boss进入游戏区域并移动到玩家附近
                if (window.game.boss && window.game.player) {
                    const player = window.game.player;
                    window.game.boss.movementPattern = 'patrol';
                    window.game.boss.x = player.position.x;
                    window.game.boss.y = player.position.y + 100; // Boss位置靠近玩家
                    window.game.boss.warningTimer = 0; // 取消警告
                    window.game.boss.inGameArea = true;
                    
                    console.log('Boss已移动到玩家附近，准备测试碰撞');
                    console.log(`玩家血量: ${player.hp}`);
                    
                    // 等待几秒看是否有碰撞
                    setTimeout(() => {
                        console.log(`测试结束，玩家血量: ${window.game.player.hp} (应该没有变化)`);
                    }, 3000);
                }
                
                console.log('Boss碰撞无伤害测试已启动');
            };

            // 测试Boss激光性能优化效果
            window.testBossLaserPerformance = function() {
                console.log('开始Boss激光性能测试...');
                
                // 确保游戏在运行中
                if (!window.game || window.game.gameState !== 'playing') {
                    window.game = window.game || new Game();
                    window.game.gameState = 'playing';
                    window.game.initializeGame();
                    console.log('初始化游戏环境');
                }
                
                // 清除现有敌机和子弹
                window.game.enemies = [];
                window.game.bullets = [];
                
                // 创建Boss
                if (!window.game.boss || !window.game.boss.active) {
                    window.game.spawnBoss();
                    console.log('生成Boss');
                }
                
                // 强制Boss进入游戏区域
                if (window.game.boss) {
                    window.game.boss.movementPattern = 'patrol';
                    window.game.boss.y = 100;
                    window.game.boss.warningTimer = 0;
                    window.game.boss.inGameArea = true;
                    console.log('Boss已进入游戏区域');
                    
                    // 开始性能监控
                    let frameCount = 0;
                    let startTime = performance.now();
                    let minFPS = Infinity;
                    let maxFPS = 0;
                    let lastFrameTime = startTime;
                    
                    const monitorPerformance = () => {
                        const currentTime = performance.now();
                        const deltaTime = currentTime - lastFrameTime;
                        const fps = 1000 / deltaTime;
                        
                        frameCount++;
                        minFPS = Math.min(minFPS, fps);
                        maxFPS = Math.max(maxFPS, fps);
                        lastFrameTime = currentTime;
                        
                        if (frameCount % 30 === 0) { // 每30帧输出一次
                            const averageFPS = frameCount / ((currentTime - startTime) / 1000);
                            console.log(`性能监控 - 帧数: ${frameCount}, 平均FPS: ${averageFPS.toFixed(1)}, 最低FPS: ${minFPS.toFixed(1)}, 最高FPS: ${maxFPS.toFixed(1)}`);
                        }
                        
                        if (frameCount < 300) { // 监控300帧（约5秒）
                            requestAnimationFrame(monitorPerformance);
                        } else {
                            const totalTime = (currentTime - startTime) / 1000;
                            const averageFPS = frameCount / totalTime;
                            console.log('=== 性能测试完成 ===');
                            console.log(`总帧数: ${frameCount}`);
                            console.log(`总时间: ${totalTime.toFixed(2)}秒`);
                            console.log(`平均FPS: ${averageFPS.toFixed(1)}`);
                            console.log(`最低FPS: ${minFPS.toFixed(1)}`);
                            console.log(`最高FPS: ${maxFPS.toFixed(1)}`);
                            console.log(`FPS波动: ${(maxFPS - minFPS).toFixed(1)}`);
                        }
                    };
                    
                    // 触发激光攻击
                    setTimeout(() => {
                        if (window.game.boss && window.game.boss.active) {
                            console.log('触发Boss激光攻击！开始性能监控...');
                            window.game.boss.fireLaserBeam();
                            requestAnimationFrame(monitorPerformance);
                        }
                    }, 1000);
                }
                
                console.log('Boss激光性能测试已启动');
            };

            // 快速性能检查
            window.quickPerformanceCheck = function() {
                console.log('快速性能检查...');
                
                const startTime = performance.now();
                let frameCount = 0;
                
                const checkFrames = () => {
                    frameCount++;
                    if (frameCount < 60) { // 检查60帧
                        requestAnimationFrame(checkFrames);
                    } else {
                        const endTime = performance.now();
                        const fps = 60 / ((endTime - startTime) / 1000);
                        console.log(`60帧耗时: ${(endTime - startTime).toFixed(2)}ms, 估算FPS: ${fps.toFixed(1)}`);
                        
                        if (fps >= 55) {
                            console.log('✅ 性能良好');
                        } else if (fps >= 30) {
                            console.log('⚠️ 性能一般');
                        } else {
                            console.log('❌ 性能较差');
                        }
                    }
                };
                
                requestAnimationFrame(checkFrames);
            };

            // 综合测试Boss优化效果
            window.testBossOptimizations = function() {
                console.log('开始综合测试Boss优化效果...');
                
                // 确保游戏在运行中
                if (!window.game || window.game.gameState !== 'playing') {
                    window.game = window.game || new Game();
                    window.game.gameState = 'playing';
                    window.game.initializeGame();
                    console.log('初始化游戏环境');
                }
                
                // 清除现有敌机和子弹
                window.game.enemies = [];
                window.game.bullets = [];
                
                // 创建Boss
                if (!window.game.boss || !window.game.boss.active) {
                    window.game.spawnBoss();
                    console.log('生成Boss');
                }
                
                if (window.game.boss && window.game.player) {
                    const boss = window.game.boss;
                    const player = window.game.player;
                    
                    // 强制Boss进入游戏区域
                    boss.movementPattern = 'patrol';
                    boss.y = 100;
                    boss.warningTimer = 0;
                    boss.inGameArea = true;
                    
                    console.log('=== 测试项目 ===');
                    console.log('1. Boss激光性能优化');
                    console.log('2. 玩家移动边界限制');
                    console.log('3. Boss黄色冲击波伤害');
                    
                    // 记录玩家初始状态
                    const initialPlayerHP = player.hp;
                    const initialPlayerY = player.position.y;
                    
                    console.log(`玩家初始血量: ${initialPlayerHP}`);
                    console.log(`玩家初始Y位置: ${initialPlayerY}`);
                    console.log(`Boss Y位置: ${boss.y}, Boss底部: ${boss.y + boss.height/2}`);
                    console.log(`玩家移动上限应该是: ${boss.y + boss.height/2 + 50}`);
                    
                    // 测试1: Boss激光攻击
                    setTimeout(() => {
                        console.log('=== 测试1: Boss激光攻击 ===');
                        boss.fireLaserBeam();
                    }, 1000);
                    
                    // 测试2: Boss冲击波攻击
                    setTimeout(() => {
                        console.log('=== 测试2: Boss冲击波攻击 ===');
                        boss.fireShockwave();
                        console.log('已发射黄色冲击波，请观察是否造成伤害');
                    }, 3000);
                    
                    // 测试3: 检查结果
                    setTimeout(() => {
                        console.log('=== 测试结果 ===');
                        const finalPlayerHP = window.game.player.hp;
                        console.log(`玩家最终血量: ${finalPlayerHP} (初始: ${initialPlayerHP})`);
                        
                        if (finalPlayerHP < initialPlayerHP) {
                            console.log('✅ Boss攻击造成伤害正常');
                        } else {
                            console.log('❌ Boss攻击可能没有造成伤害');
                        }
                        
                        // 测试移动限制
                        console.log('=== 移动限制测试说明 ===');
                        console.log('请尝试向上移动玩家，应该无法进入Boss区域');
                        console.log(`当前玩家可移动的最高位置应该是: ${boss.y + boss.height/2 + 50}`);
                    }, 6000);
                }
                
                console.log('综合测试已启动，请观察游戏画面和控制台输出');
            };

            // 测试Boss黄色冲击波
            window.testBossShockwave = function() {
                console.log('开始测试Boss黄色冲击波...');
                
                // 确保游戏在运行中
                if (!window.game || window.game.gameState !== 'playing') {
                    window.game = window.game || new Game();
                    window.game.gameState = 'playing';
                    window.game.initializeGame();
                    console.log('初始化游戏环境');
                }
                
                // 清除现有敌机和子弹
                window.game.enemies = [];
                window.game.bullets = [];
                
                // 创建Boss
                if (!window.game.boss || !window.game.boss.active) {
                    window.game.spawnBoss();
                    console.log('生成Boss');
                }
                
                if (window.game.boss && window.game.player) {
                    const boss = window.game.boss;
                    const player = window.game.player;
                    
                    // 强制Boss进入游戏区域
                    boss.movementPattern = 'patrol';
                    boss.y = 100;
                    boss.warningTimer = 0;
                    boss.inGameArea = true;
                    
                    // 记录玩家血量
                    const initialHP = player.hp;
                    console.log(`玩家当前血量: ${initialHP}`);
                    
                    // 发射冲击波
                    setTimeout(() => {
                        console.log('Boss发射黄色冲击波！');
                        boss.fireShockwave();
                        
                        // 3秒后检查伤害
                        setTimeout(() => {
                            const finalHP = window.game.player.hp;
                            console.log(`玩家血量变化: ${initialHP} -> ${finalHP}`);
                            
                            if (finalHP < initialHP) {
                                console.log('✅ 黄色冲击波伤害正常');
                            } else {
                                console.log('⚠️ 黄色冲击波可能没有造成伤害，请确保接触到冲击波');
                            }
                        }, 3000);
                    }, 500);
                }
                
                console.log('黄色冲击波测试已启动');
            };

            // 测试新的玩家移动边界逻辑
            window.testPlayerMovementBounds = function() {
                console.log('开始测试玩家移动边界逻辑...');
                
                // 确保游戏在运行中
                if (!window.game || window.game.gameState !== 'playing') {
                    window.game = window.game || new Game();
                    window.game.gameState = 'playing';
                    window.game.initializeGame();
                    console.log('初始化游戏环境');
                }
                
                // 清除现有敌机和子弹
                window.game.enemies = [];
                window.game.bullets = [];
                
                // 创建Boss
                if (!window.game.boss || !window.game.boss.active) {
                    window.game.spawnBoss();
                    console.log('生成Boss');
                }
                
                if (window.game.boss && window.game.player) {
                    const boss = window.game.boss;
                    const player = window.game.player;
                    
                    // 强制Boss进入游戏区域
                    boss.movementPattern = 'patrol';
                    boss.y = 150; // 稍微降低Boss位置
                    boss.x = 400; // Boss在屏幕中央
                    boss.warningTimer = 0;
                    boss.inGameArea = true;
                    
                    console.log('=== 移动边界测试 ===');
                    console.log(`Boss位置: x=${boss.x}, y=${boss.y}`);
                    console.log(`Boss尺寸: width=${boss.width}, height=${boss.height}`);
                    console.log(`Boss边界: left=${boss.x - boss.width/2}, right=${boss.x + boss.width/2}, top=${boss.y - boss.height/2}, bottom=${boss.y + boss.height/2}`);
                    
                    // 测试不同位置的移动
                    const testPositions = [
                        { x: 200, y: 100, desc: "Boss左上方" },
                        { x: 600, y: 100, desc: "Boss右上方" },
                        { x: 400, y: 100, desc: "Boss正上方" },
                        { x: 400, y: 200, desc: "Boss正下方" },
                        { x: 200, y: 200, desc: "Boss左下方" },
                        { x: 600, y: 200, desc: "Boss右下方" },
                        { x: 400, y: 150, desc: "Boss中心位置" }
                    ];
                    
                    let testIndex = 0;
                    
                    const testNextPosition = () => {
                        if (testIndex >= testPositions.length) {
                            console.log('=== 测试完成 ===');
                            console.log('现在玩家应该可以在Boss周围自由移动，只有直接重叠时才会被推开');
                            return;
                        }
                        
                        const pos = testPositions[testIndex];
                        console.log(`\n测试位置${testIndex + 1}: ${pos.desc} (${pos.x}, ${pos.y})`);
                        
                        // 移动玩家到测试位置
                        player.position.x = pos.x;
                        player.position.y = pos.y;
                        
                        // 触发边界检查
                        player.checkBounds();
                        
                        console.log(`移动后玩家位置: (${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)})`);
                        
                        // 检查是否与Boss重叠
                        const isOverlapping = player.isOverlappingWithBoss(boss);
                        console.log(`与Boss重叠: ${isOverlapping ? '是' : '否'}`);
                        
                        testIndex++;
                        setTimeout(testNextPosition, 1000);
                    };
                    
                    // 开始测试序列
                    setTimeout(testNextPosition, 1000);
                    
                    console.log('=== 操作说明 ===');
                    console.log('测试期间您可以手动移动玩家，观察以下行为：');
                    console.log('1. 玩家应该可以在Boss周围自由移动');
                    console.log('2. 只有当玩家试图进入Boss区域时才会被推开');
                    console.log('3. 推开方向应该是最短路径');
                    console.log('4. 玩家不应该被困在Boss下方');
                }
                
                console.log('玩家移动边界测试已启动');
            };

            // 显示Boss和玩家的碰撞边界（调试可视化）
            window.showCollisionBounds = function() {
                console.log('显示碰撞边界（调试模式）');
                
                if (window.game?.boss && window.game?.player) {
                    const boss = window.game.boss;
                    const player = window.game.player;
                    
                    // 添加调试渲染标志
                    boss.showDebugBounds = true;
                    player.showDebugBounds = true;
                    
                    console.log('碰撞边界可视化已启用');
                    console.log('Boss和玩家的碰撞边界将显示为红色框线');
                    
                    // 10秒后自动关闭
                    setTimeout(() => {
                        if (window.game?.boss) window.game.boss.showDebugBounds = false;
                        if (window.game?.player) window.game.player.showDebugBounds = false;
                        console.log('碰撞边界可视化已关闭');
                    }, 10000);
                } else {
                    console.log('需要先生成Boss和玩家');
                }
            };

            // 快速测试移动边界修复
            window.quickTestMovementFix = function() {
                console.log('🔧 快速测试移动边界修复...');
                
                // 确保游戏在运行
                if (!window.game || window.game.gameState !== 'playing') {
                    window.game = window.game || new Game();
                    window.game.gameState = 'playing';
                    window.game.initializeGame();
                }
                
                // 清理环境
                window.game.enemies = [];
                window.game.bullets = [];
                
                // 生成Boss
                if (!window.game.boss || !window.game.boss.active) {
                    window.game.spawnBoss();
                }
                
                const boss = window.game.boss;
                const player = window.game.player;
                
                if (boss && player) {
                    // 设置Boss位置
                    boss.y = 150;
                    boss.x = 400;
                    boss.inGameArea = true;
                    boss.warningTimer = 0;
                    
                    console.log('✅ 测试环境已设置');
                    console.log(`📍 Boss位置: (${boss.x}, ${boss.y})`);
                    console.log(`📏 Boss尺寸: ${boss.width} x ${boss.height}`);
                    
                    // 计算Boss边界
                    const bossLeft = boss.x - boss.width / 2;
                    const bossRight = boss.x + boss.width / 2;
                    const bossTop = boss.y - boss.height / 2;
                    const bossBottom = boss.y + boss.height / 2;
                    
                    console.log(`🔴 Boss边界: left=${bossLeft}, right=${bossRight}, top=${bossTop}, bottom=${bossBottom}`);
                    
                    // 测试玩家移动到Boss周围
                    console.log('\n🎮 开始测试玩家移动:');
                    console.log('1. 您现在可以手动控制玩家移动');
                    console.log('2. 尝试移动到Boss周围不同位置');
                    console.log('3. 玩家应该可以接近Boss，但不能重叠');
                    console.log('4. 发生重叠时会被平滑推开');
                    console.log('5. 不再有"红框下方禁区"的限制');
                    
                    // 启用碰撞边界可视化
                    showCollisionBounds();
                    
                    console.log('\n📊 修复对比:');
                    console.log('❌ 修复前: 玩家被困在Boss下方大区域，不能接近Boss');
                    console.log('✅ 修复后: 玩家可以在Boss周围自由移动，只在重叠时被推开');
                    
                    return true;
                } else {
                    console.log('❌ Boss或玩家创建失败');
                    return false;
                }
            };

            // 测试改进后的平滑边界推出逻辑
            window.testSmoothBoundaryPush = function() {
                console.log('🔧 测试改进后的平滑边界推出逻辑...');
                
                // 确保游戏环境
                if (!window.game || window.game.gameState !== 'playing') {
                    window.game = window.game || new Game();
                    window.game.gameState = 'playing';
                    window.game.initializeGame();
                }
                
                // 清理环境
                window.game.enemies = [];
                window.game.bullets = [];
                
                // 生成Boss
                if (!window.game.boss || !window.game.boss.active) {
                    window.game.spawnBoss();
                }
                
                const boss = window.game.boss;
                const player = window.game.player;
                
                if (boss && player) {
                    // 设置Boss在中央位置
                    boss.y = 200;
                    boss.x = 400;
                    boss.inGameArea = true;
                    boss.warningTimer = 0;
                    
                    console.log('✅ 测试环境已设置');
                    console.log(`📍 Boss位置: (${boss.x}, ${boss.y})`);
                    
                    // 启用边界可视化
                    showCollisionBounds();
                    
                    console.log('\n🎮 改进测试指南:');
                    console.log('请测试以下场景，观察推出效果是否平滑：');
                    console.log('');
                    console.log('1️⃣ 【从下往上接触Boss】');
                    console.log('   - 从Boss下方向上移动接触Boss');
                    console.log('   - ❌ 修复前: 玩家会反弹回来');
                    console.log('   - ✅ 修复后: 玩家平滑停在Boss下方边界，无反弹');
                    console.log('');
                    console.log('2️⃣ 【从左右接触Boss】');
                    console.log('   - 从Boss左侧向右移动接触Boss');
                    console.log('   - 从Boss右侧向左移动接触Boss');
                    console.log('   - ❌ 修复前: 玩家突然跳跃到相反位置');
                    console.log('   - ✅ 修复后: 玩家平滑停在Boss左/右侧边界');
                    console.log('');
                    console.log('3️⃣ 【从上往下接触Boss】');
                    console.log('   - 从Boss上方向下移动接触Boss');
                    console.log('   - ✅ 应该平滑停在Boss上方边界');
                    console.log('');
                    console.log('4️⃣ 【对角线接触】');
                    console.log('   - 斜向移动接触Boss角落');
                    console.log('   - ✅ 应该根据主要移动方向平滑推出');
                    
                    // 自动测试序列
                    let testStep = 0;
                    const autoTests = [
                        {
                            name: "下往上接触测试",
                            startPos: { x: 400, y: 350 },
                            velocity: { x: 0, y: -100 },
                            duration: 2000,
                            expected: "玩家应该平滑停在Boss下方，无反弹"
                        },
                        {
                            name: "左往右接触测试", 
                            startPos: { x: 200, y: 200 },
                            velocity: { x: 100, y: 0 },
                            duration: 2000,
                            expected: "玩家应该平滑停在Boss左侧，无跳跃"
                        },
                        {
                            name: "右往左接触测试",
                            startPos: { x: 600, y: 200 },
                            velocity: { x: -100, y: 0 },
                            duration: 2000,
                            expected: "玩家应该平滑停在Boss右侧，无跳跃"
                        },
                        {
                            name: "上往下接触测试",
                            startPos: { x: 400, y: 50 },
                            velocity: { x: 0, y: 100 },
                            duration: 2000,
                            expected: "玩家应该平滑停在Boss上方"
                        }
                    ];
                    
                    console.log('\n🤖 自动测试序列将在3秒后开始...');
                    console.log('（您也可以随时手动控制玩家进行测试）');
                    
                    setTimeout(() => {
                        const runNextTest = () => {
                            if (testStep >= autoTests.length) {
                                console.log('\n🎉 自动测试序列完成！');
                                console.log('现在您可以手动测试各种碰撞场景');
                                return;
                            }
                            
                            const test = autoTests[testStep];
                            console.log(`\n🧪 自动测试 ${testStep + 1}: ${test.name}`);
                            console.log(`📝 预期结果: ${test.expected}`);
                            
                            // 设置玩家位置和速度
                            player.position.x = test.startPos.x;
                            player.position.y = test.startPos.y;
                            player.velocity.x = test.velocity.x;
                            player.velocity.y = test.velocity.y;
                            
                            testStep++;
                            setTimeout(runNextTest, test.duration);
                        };
                        
                        runNextTest();
                    }, 3000);
                    
                    return true;
                } else {
                    console.log('❌ Boss或玩家创建失败');
                    return false;
                }
            };

            // 简单快速验证边界修复
            window.quickVerifyBoundaryFix = function() {
                console.log('⚡ 快速验证边界修复...');
                
                // 确保游戏环境
                if (!window.game || window.game.gameState !== 'playing') {
                    window.game = window.game || new Game();
                    window.game.gameState = 'playing';
                    window.game.initializeGame();
                }
                
                window.game.enemies = [];
                window.game.bullets = [];
                
                if (!window.game.boss || !window.game.boss.active) {
                    window.game.spawnBoss();
                }
                
                const boss = window.game.boss;
                const player = window.game.player;
                
                if (boss && player) {
                    boss.y = 200;
                    boss.x = 400;
                    boss.inGameArea = true;
                    
                    console.log('✅ 测试环境准备完成');
                    console.log('');
                    console.log('🔍 主要修复内容:');
                    console.log('1. ❌ 修复前: 从下往上接触Boss时玩家会反弹');
                    console.log('   ✅ 修复后: 平滑停在Boss下方，无反弹');
                    console.log('');
                    console.log('2. ❌ 修复前: 左右接触Boss时玩家突然跳跃到相反位置');
                    console.log('   ✅ 修复后: 平滑停在Boss左右侧边界');
                    console.log('');
                    console.log('🎮 请手动测试:');
                    console.log('• 用WASD控制玩家从各个方向接触Boss');
                    console.log('• 观察玩家是否平滑停留在Boss边界，而不是跳跃或反弹');
                    console.log('• 特别测试从下往上和左右接触的情况');
                    
                    // 启用边界可视化
                    showCollisionBounds();
                    
                    return true;
                } else {
                    console.log('❌ 环境设置失败');
                    return false;
                }
            };

            // 测试Boss边界阻挡逻辑（无推出效果）
            window.testBossWallCollision = function() {
                console.log('🧱 测试Boss边界阻挡逻辑（墙壁效果）...');
                
                // 确保游戏环境
                if (!window.game || window.game.gameState !== 'playing') {
                    window.game = window.game || new Game();
                    window.game.gameState = 'playing';
                    window.game.initializeGame();
                }
                
                window.game.enemies = [];
                window.game.bullets = [];
                
                if (!window.game.boss || !window.game.boss.active) {
                    window.game.spawnBoss();
                }
                
                const boss = window.game.boss;
                const player = window.game.player;
                
                if (boss && player) {
                    boss.y = 200;
                    boss.x = 400;
                    boss.inGameArea = true;
                    boss.warningTimer = 0;
                    
                    console.log('✅ 测试环境已设置');
                    console.log(`📍 Boss位置: (${boss.x}, ${boss.y})`);
                    
                    // 启用边界可视化
                    showCollisionBounds();
                    
                    console.log('\n🧱 新的边界阻挡逻辑特点:');
                    console.log('');
                    console.log('✅ Boss现在像一堵墙一样工作:');
                    console.log('• 玩家碰到Boss时会被阻挡，不能继续向Boss方向移动');
                    console.log('• 没有推出或反弹效果');
                    console.log('• 可以沿着Boss边界滑动');
                    console.log('• 可以向远离Boss的方向移动');
                    console.log('');
                    console.log('🎮 测试指南:');
                    console.log('1️⃣ 从下往上接触Boss: 应该平滑停止，无反弹');
                    console.log('2️⃣ 从左右接触Boss: 应该平滑停止，无跳跃');
                    console.log('3️⃣ 沿边界移动: 可以沿着Boss边缘滑动');
                    console.log('4️⃣ 离开边界: 可以随时向远离Boss的方向移动');
                    console.log('');
                    console.log('📊 对比效果:');
                    console.log('❌ 修复前: 玩家被推出或反弹');
                    console.log('✅ 修复后: 玩家被阻挡，像碰到墙壁一样');
                    
                    // 自动演示序列
                    console.log('\n🤖 3秒后开始自动演示...');
                    setTimeout(() => {
                        let demoStep = 0;
                        const demos = [
                            {
                                name: "从下往上碰撞演示",
                                setup: () => {
                                    player.position.x = 400;
                                    player.position.y = 300;
                                    player.velocity.x = 0;
                                    player.velocity.y = -120;
                                },
                                duration: 1500,
                                description: "玩家从下方向上移动，应该平滑停在Boss下方"
                            },
                            {
                                name: "从左往右碰撞演示", 
                                setup: () => {
                                    player.position.x = 250;
                                    player.position.y = 200;
                                    player.velocity.x = 120;
                                    player.velocity.y = 0;
                                },
                                duration: 1500,
                                description: "玩家从左侧向右移动，应该平滑停在Boss左侧"
                            },
                            {
                                name: "从右往左碰撞演示",
                                setup: () => {
                                    player.position.x = 550;
                                    player.position.y = 200; 
                                    player.velocity.x = -120;
                                    player.velocity.y = 0;
                                },
                                duration: 1500,
                                description: "玩家从右侧向左移动，应该平滑停在Boss右侧"
                            },
                            {
                                name: "沿边界滑动演示",
                                setup: () => {
                                    player.position.x = boss.x - boss.width/2 - 20;
                                    player.position.y = 200;
                                    player.velocity.x = 0;
                                    player.velocity.y = 50;
                                },
                                duration: 2000,
                                description: "玩家贴着Boss左边界向下滑动"
                            }
                        ];
                        
                        const runDemo = () => {
                            if (demoStep >= demos.length) {
                                console.log('\n🎉 自动演示完成！现在可以手动测试');
                                return;
                            }
                            
                            const demo = demos[demoStep];
                            console.log(`\n🎬 演示 ${demoStep + 1}: ${demo.name}`);
                            console.log(`📝 ${demo.description}`);
                            
                            demo.setup();
                            demoStep++;
                            
                            setTimeout(runDemo, demo.duration);
                        };
                        
                        runDemo();
                    }, 3000);
                    
                    return true;
                } else {
                    console.log('❌ 环境设置失败');
                    return false;
                }
            };

            // 简单测试Boss墙壁效果
            window.testBossWall = function() {
                console.log('🧱 简单测试Boss墙壁效果...');
                
                if (!window.game || window.game.gameState !== 'playing') {
                    window.game = window.game || new Game();
                    window.game.gameState = 'playing';
                    window.game.initializeGame();
                }
                
                window.game.enemies = [];
                window.game.bullets = [];
                
                if (!window.game.boss || !window.game.boss.active) {
                    window.game.spawnBoss();
                }
                
                const boss = window.game.boss;
                const player = window.game.player;
                
                if (boss && player) {
                    boss.y = 200;
                    boss.x = 400;
                    boss.inGameArea = true;
                    
                    console.log('✅ 环境已设置，Boss位置: (' + boss.x + ', ' + boss.y + ')');
                    console.log('');
                    console.log('🎯 关键改进:');
                    console.log('❌ 修复前: 玩家碰到Boss会被推出或反弹');
                    console.log('✅ 修复后: Boss像墙壁一样阻挡玩家移动');
                    console.log('');
                    console.log('🎮 请测试:');
                    console.log('• 从各个方向接触Boss');
                    console.log('• 观察是否像碰到墙壁一样停住');
                    console.log('• 检查是否能沿着Boss边界滑动');
                    console.log('• 确认没有反弹或跳跃效果');
                    
                    showCollisionBounds();
                    return true;
                } else {
                    console.log('❌ 设置失败');
                    return false;
                }
            };

            console.log('调试命令已加载！输入 debugHelp() 查看帮助');
        }
    }
}

// 创建调试命令实例
if (typeof window !== 'undefined') {
    window.debugCommands = new DebugCommands();
} 