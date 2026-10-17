/**
 * 音频管理器 - 管理游戏音效和背景音乐
 * 采用单例模式，提供音频播放、音量控制等功能
 */
class AudioManager {
    constructor() {
        if (AudioManager.instance) {
            return AudioManager.instance;
        }
        
        // 音频资源
        this.sounds = new Map();
        this.music = new Map();
        this.musicPromises = new Map(); // 音乐轨道异步生成 Promise 缓存
        this.musicGenPaused = false;    // 游戏中暂停后台音乐生成（避免抢占手机 CPU）
        
        // 音量设置
        this.masterVolume = 1.0;
        this.sfxVolume = 0.7;
        this.musicVolume = 0.5;
        
        // 当前播放的音乐
        this.currentMusic = null;
        this.musicFadeInterval = null;
        this.pendingMusic = null; // 因上下文挂起而待播的音乐（预热后补播）
        
        // 音频上下文（用于高级音频处理）
        this.audioContext = null;
        this.gainNode = null;
        
        // 音频池，用于同时播放多个相同音效
        this.soundPools = new Map();
        this.maxPoolSize = 10;
        
                this.initialized = false;
        this.audioGenerator = null;
        this.generatedSounds = new Map();
        this.isMuted = false;

        // 添加音频初始化状态跟踪
        this.initializationProgress = 0;
        this.initializationStatus = '准备初始化...';
        this.initializationCallbacks = [];
        
        // 快速初始化音频系统
        setTimeout(() => {
            console.log('AudioManager快速初始化开始');
            this.initAudioContextWithProgress();
        }, 100); // 从500ms减少到100ms

        AudioManager.instance = this;
    }

    /**
     * 获取单例实例
     */
    static getInstance() {
        if (!AudioManager.instance) {
            new AudioManager();
        }
        return AudioManager.instance;
    }

    /**
     * 初始化音频上下文
     */
    async initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.updateMasterVolume();
            
            // 初始化音频生成器
            this.audioGenerator = new AudioGenerator(this.audioContext);
            this.generateAllSounds();
            
            this.initialized = true;
            console.log('音频上下文初始化成功');
        } catch (error) {
            console.warn('无法初始化Web Audio API，回退到传统音频:', error);
            this.initialized = false;
        }
    }

    /**
     * 带进度反馈的音频初始化（快速版本）
     */
    async initAudioContextWithProgress() {
        try {
            this.updateInitProgress(10, '正在启动音频系统...');
            await new Promise(resolve => setTimeout(resolve, 200)); // 从600ms减少到200ms
            
            this.updateInitProgress(30, '正在初始化音频上下文...');
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.updateMasterVolume();
            
            this.updateInitProgress(50, '音频上下文创建成功');
            await new Promise(resolve => setTimeout(resolve, 100)); // 从300ms减少到100ms
            
            this.updateInitProgress(65, '正在初始化音频生成器...');
            this.audioGenerator = new AudioGenerator(this.audioContext);
            
            this.updateInitProgress(80, '正在生成音效库...');
            await new Promise(resolve => setTimeout(resolve, 150)); // 从300ms减少到150ms
            
            // 快速生成音效，避免阻塞
            await this.generateAllSoundsWithProgress();
            
            this.updateInitProgress(100, '音频系统初始化完成！');
            this.initialized = true;
            
            console.log('音频上下文初始化成功');
            
            // 通知所有等待的回调
            this.initializationCallbacks.forEach(callback => callback(true));
            this.initializationCallbacks = [];
            
            // 快速切换到主菜单
            setTimeout(() => {
                console.log('音频初始化完成，发送切换主菜单事件');
                window.dispatchEvent(new CustomEvent('audioInitComplete'));
            }, 300); // 从1500ms减少到300ms
            
        } catch (error) {
            console.warn('无法初始化Web Audio API，回退到传统音频:', error);
            this.initialized = false;
            this.updateInitProgress(100, '音频初始化失败，游戏将静音运行');
            
            // 通知所有等待的回调（失败）
            this.initializationCallbacks.forEach(callback => callback(false));
            this.initializationCallbacks = [];
            
            // 即使失败也要快速通知游戏切换到主菜单
            setTimeout(() => {
                console.log('音频初始化失败，但仍发送切换主菜单事件');
                window.dispatchEvent(new CustomEvent('audioInitComplete'));
            }, 800); // 从3000ms减少到800ms
        }
    }

    /**
     * 更新初始化进度
     */
    updateInitProgress(progress, status) {
        this.initializationProgress = progress;
        this.initializationStatus = status;
        
        // 触发自定义事件，让UI可以监听进度变化
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('audioInitProgress', {
                detail: { progress, status }
            }));
        }
    }

    /**
     * 快速生成音效，避免阻塞UI
     */
    async generateAllSoundsWithProgress() {
        if (!this.audioGenerator) return;
        
        try {
            this.updateInitProgress(85, '正在生成基础音效...');
            await new Promise(resolve => setTimeout(resolve, 100)); // 从400ms减少到100ms
            
            // 快速生成所有音效缓冲区
            console.log('开始生成音效缓冲区...');
            this.generatedSounds = this.audioGenerator.generateAllSounds();
            console.log('音效缓冲区生成完成');
            
            this.updateInitProgress(92, '正在注册音效...');
            
            // 为每个音效创建播放函数
            for (const [name, buffer] of Object.entries(this.generatedSounds)) {
                this.sounds.set(name, buffer);
            }
            
            this.updateInitProgress(96, '正在生成背景音乐...');
            await new Promise(resolve => setTimeout(resolve, 100)); // 从400ms减少到100ms
            
            // 创建简单的背景音乐（使用较长的音调序列）
            this.generateBackgroundMusic();
            
            this.updateInitProgress(100, '🎮 游戏准备完成！');
            await new Promise(resolve => setTimeout(resolve, 100)); // 从300ms减少到100ms
            
            console.log('音频生成完成，共', this.sounds.size, '个音效');
            
        } catch (error) {
            console.warn('生成音频时出错:', error);
            this.updateInitProgress(95, '音效生成部分失败');
        }
    }

    /**
     * 监听音频初始化完成
     */
    onInitializationComplete(callback) {
        if (this.initialized) {
            callback(true);
        } else {
            this.initializationCallbacks.push(callback);
        }
    }

    /**
     * 获取音频初始化进度
     */
    getInitializationProgress() {
        return {
            progress: this.initializationProgress,
            status: this.initializationStatus,
            completed: this.initialized
        };
    }

    /**
     * 恢复音频上下文（用户交互后）
     */
    async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('音频上下文已恢复');
            } catch (error) {
                console.warn('无法恢复音频上下文:', error);
            }
        }
    }

    /**
     * 生成所有音频
     */
    generateAllSounds() {
        if (!this.audioGenerator) return;
        
        try {
            // 生成所有音效缓冲区
            this.generatedSounds = this.audioGenerator.generateAllSounds();
            
            // 为每个音效创建播放函数
            for (const [name, buffer] of Object.entries(this.generatedSounds)) {
                this.sounds.set(name, buffer);
            }
            
            // 创建简单的背景音乐（使用较长的音调序列）
            this.generateBackgroundMusic();
            
            console.log('音频生成完成，共', this.sounds.size, '个音效');
        } catch (error) {
            console.warn('生成音频时出错:', error);
        }
    }
    
    /**
     * 生成背景音乐
     */
    generateBackgroundMusic() {
        // 分块异步生成：立即生成菜单曲，其余轨道空闲时错峰生成（不阻塞主线程，移动端关键）
        this.createMusicTrackAsync('menu_theme').catch(() => {});

        const names = Object.keys(this.getMusicTrackConfig()).filter((n) => n !== 'menu_theme');
        names.forEach((name, index) => {
            setTimeout(() => {
                this.createMusicTrackAsync(name).catch(() => {});
            }, 400 + index * 400);
        });
    }
    
    /**
     * 创建复杂的音乐缓冲区
     */
    createMusicGenerator(style) {
        const sr = this.audioContext.sampleRate;
        const p = this.getMusicParams(style);
        const beat = 60 / p.tempo;
        const bar = beat * 4;
        const eighth = beat / 2;
        const arpPattern = [0, 1, 2, 3, 2, 1, 2, 3];

        // ---- 性能优化：正弦/指数查表 + LCG 噪声（移动端友好） ----
        const TAU = Math.PI * 2;
        const SIN_T = 8192;
        const sinTable = new Float32Array(SIN_T);
        for (let t = 0; t < SIN_T; t++) sinTable[t] = Math.sin((t / SIN_T) * TAU);
        const fastSin = (ph) => {
            const y = (ph / TAU) * SIN_T;
            const i0 = y | 0;
            const f = y - i0;
            return sinTable[i0] * (1 - f) + sinTable[(i0 + 1) & (SIN_T - 1)] * f;
        };
        const EXP_T = 512;
        const expTable = new Float32Array(EXP_T);
        for (let t = 0; t < EXP_T; t++) expTable[t] = Math.exp((-t / EXP_T) * 12);
        const fastExp = (x) => (x >= 12 ? 0 : expTable[(x / 12) * EXP_T | 0]);
        let lcgSeed = 1234567;
        const fastNoise = () => {
            lcgSeed = (lcgSeed * 1664525 + 1013904223) | 0;
            return ((lcgSeed >> 8) & 0xffff) / 32768 - 1;
        };

        // 相位累加器
        let arpPhase = 0, bassPhase = 0;
        let padP1 = 0, padP2 = 0, padP3 = 0, padP4 = 0;
        let i = 0;

        return {
            next() {
                const time = i / sr;
                i++;

                const barIndex = (time / bar | 0) % p.progression.length;
                const chord = p.chords[barIndex];
                const barTime = time % bar;

                // ---- 1) 琶音领奏 ----
                const step = (barTime / eighth) | 0;
                const stepTime = (time % eighth) / eighth;
                const noteFreq = chord[arpPattern[step % arpPattern.length]];
                const pluck = fastExp(stepTime * 4.5) * (1 - fastExp(stepTime * 80));
                const vib = 1 + fastSin(time * 5.3) * 0.0025;
                arpPhase += (noteFreq * vib) / sr * TAU;
                if (arpPhase >= TAU) arpPhase -= TAU;
                const h2 = arpPhase * 2 >= TAU ? arpPhase * 2 - TAU : arpPhase * 2;
                const h3 = arpPhase * 3 >= TAU * 2 ? arpPhase * 3 - TAU * 2 : arpPhase * 3;
                const arp = (fastSin(arpPhase) + 0.4 * fastSin(h2) + 0.15 * fastSin(h3)) * pluck * p.arpGain;

                // ---- 2) 和弦铺垫 ----
                const padAttack = Math.min(1, barTime / 0.25);
                const padRelease = Math.min(1, (bar - barTime) / 0.5);
                const padEnv = Math.min(padAttack, padRelease);
                padP1 += (chord[0] / 2) / sr * TAU; if (padP1 >= TAU) padP1 -= TAU;
                padP2 += chord[1] / sr * TAU; if (padP2 >= TAU) padP2 -= TAU;
                padP3 += chord[2] / sr * TAU; if (padP3 >= TAU) padP3 -= TAU;
                padP4 += chord[3] / sr * TAU; if (padP4 >= TAU) padP4 -= TAU;
                const pad = (fastSin(padP1) + 0.5 * fastSin(padP2) + 0.4 * fastSin(padP3) + 0.25 * fastSin(padP4)) * padEnv * p.padGain;

                // ---- 3) 脉冲低音 ----
                const bassFreq = (step % 2 === 1) ? chord[3] : chord[0];
                const bassPluck = fastExp(stepTime * 3.5);
                bassPhase += bassFreq / sr * TAU;
                if (bassPhase >= TAU) bassPhase -= TAU;
                const bass2 = bassPhase * 2 >= TAU ? bassPhase * 2 - TAU : bassPhase * 2;
                const bass = (fastSin(bassPhase) + 0.3 * fastSin(bass2)) * bassPluck * p.bassGain;

                // ---- 4) 鼓组 ----
                let drums = 0;
                const beatTime = time % beat;
                const beatIndex = (time / beat | 0) % 4;
                if ((beatIndex === 0 || beatIndex === 2) && beatTime < 0.14) {
                    const kf = 55 + 75 * fastExp(beatTime * 22);
                    drums += fastSin((kf * time % 1) * TAU) * fastExp(beatTime * 16) * 0.9;
                }
                if ((beatIndex === 1 || beatIndex === 3) && beatTime < 0.12) {
                    drums += fastNoise() * fastExp(beatTime * 34) * 0.55
                        + fastSin((190 * time % 1) * TAU) * fastExp(beatTime * 26) * 0.3;
                }
                const hatStep = (time / eighth) | 0;
                if (hatStep % p.hatEvery === 0) {
                    const ht = time % eighth;
                    if (ht < 0.03) {
                        drums += fastNoise() * fastExp(ht * 90) * 0.22;
                    }
                }
                drums *= p.drumGain;

                // ---- 混音 ----
                const leftMix = pad + bass * 0.9 + arp * 0.55 + drums;
                const rightMix = pad + bass * 0.9 + arp * 0.85 + drums;
                return [
                    Math.max(-1, Math.min(1, leftMix * 0.5)),
                    Math.max(-1, Math.min(1, rightMix * 0.5))
                ];
            }
        };
    }

    /**
     * 获取音乐风格参数（史诗风格：小调和弦进行 + 琶音驱动）
     */
    getMusicParams(style) {
        const A3 = 220.00;
        const semitone = (n) => A3 * Math.pow(2, n / 12);
        const chords = {
            Am: [semitone(0), semitone(3), semitone(7), semitone(12)],
            F: [semitone(-4), semitone(0), semitone(5), semitone(8)],
            C: [semitone(-9), semitone(-4), semitone(0), semitone(3)],
            G: [semitone(-2), semitone(2), semitone(7), semitone(10)],
            E: [semitone(-5), semitone(-1), semitone(4), semitone(7)],
            Dm: [semitone(-7), semitone(-3), semitone(2), semitone(5)],
            Em: [semitone(-5), semitone(-1), semitone(2), semitone(7)]
        };

        const styles = {
            menu: { tempo: 128, progression: ['Am', 'F', 'C', 'G'], arpGain: 0.26, padGain: 0.26, bassGain: 0.26, drumGain: 0.24, hatEvery: 2 },
            battle: { tempo: 148, progression: ['Am', 'F', 'C', 'G'], arpGain: 0.34, padGain: 0.18, bassGain: 0.34, drumGain: 0.46, hatEvery: 1 },
            boss: { tempo: 164, progression: ['Am', 'E', 'F', 'Dm'], arpGain: 0.38, padGain: 0.16, bassGain: 0.36, drumGain: 0.52, hatEvery: 1 },
            victory: { tempo: 138, progression: ['C', 'G', 'Am', 'F'], arpGain: 0.30, padGain: 0.28, bassGain: 0.26, drumGain: 0.34, hatEvery: 1 },
            sad: { tempo: 78, progression: ['Am', 'Em', 'F', 'C'], arpGain: 0.16, padGain: 0.34, bassGain: 0.20, drumGain: 0.10, hatEvery: 4 }
        };
        const p = styles[style] || styles.menu;
        p.chords = p.progression.map((name) => chords[name]);
        return p;
    }

    /**
     * 音乐轨道配置：名称 -> 风格与时长（秒）。
     * 时长较短（循环播放无缝衔接），降低移动端生成耗时。
     */
    getMusicTrackConfig() {
        return {
            menu_theme: { style: 'menu', duration: 40 },
            gameplay_theme: { style: 'battle', duration: 48 },
            boss_theme: { style: 'boss', duration: 40 },
            victory_theme: { style: 'victory', duration: 28 },
            game_over_theme: { style: 'sad', duration: 32 }
        };
    }

    /**
     * 分块异步生成音乐轨道（每块约 80ms 音频，setTimeout 让出主线程，UI 不卡顿）
     * 返回 Promise<track>；重复调用复用同一 Promise。
     */
    createMusicTrackAsync(name) {
        if (this.musicPromises.has(name)) {
            return this.musicPromises.get(name);
        }

        const config = this.getMusicTrackConfig()[name];
        if (!config) {
            return Promise.resolve(null);
        }
        if (this.music.has(name)) {
            return Promise.resolve(this.music.get(name));
        }

        const promise = new Promise((resolve) => {
            try {
                const sr = this.audioContext.sampleRate;
                const total = Math.floor(config.duration * sr);
                const buffer = this.audioContext.createBuffer(2, total, sr);
                const left = buffer.getChannelData(0);
                const right = buffer.getChannelData(1);
                const generator = this.createMusicGenerator(config.style);
                const chunk = Math.floor(sr * 0.08); // 80ms 音频/块
                let offset = 0;

                const step = () => {
                    // 游戏进行中降速生成（低优先级滴流），避免与战斗渲染/音效抢占主线程
                    if (this.musicGenPaused) {
                        setTimeout(step, 150);
                        return;
                    }

                    const end = Math.min(total, offset + chunk);
                    while (offset < end) {
                        const sample = generator.next();
                        left[offset] = sample[0];
                        right[offset] = sample[1];
                        offset++;
                    }
                    if (offset >= total) {
                        const track = {
                            buffer: buffer,
                            isPlaying: false,
                            source: null,
                            volume: this.musicVolume * this.masterVolume,
                            loop: true
                        };
                        this.music.set(name, track);
                        resolve(track);
                    } else {
                        setTimeout(step, 0); // 让出主线程，保持 UI 响应
                    }
                };
                setTimeout(step, 0);
            } catch (error) {
                console.warn('背景音乐 ' + name + ' 生成失败:', error);
                resolve(null);
            }
        });

        this.musicPromises.set(name, promise);
        return promise;
    }

    /**
     * 播放音效
     */
    /**
     * 播放音效
     */
    async playSound(name, volume = 1.0, playbackRate = 1.0) {
        // 如果音频未初始化，静默跳过（不报错，不阻塞游戏）
        if (this.isMuted || !this.initialized || !this.audioContext) return;
        
        try {
            // 挂起时尝试恢复（用户手势内会成功）；限时 300ms，避免无限等待与节点堆积
            if (this.audioContext.state === 'suspended') {
                await Promise.race([
                    this.audioContext.resume(),
                    new Promise((resolve) => setTimeout(resolve, 300))
                ]);
                if (this.audioContext.state !== 'running') {
                    return;
                }
            }

            await this.resumeAudioContext();
            
            const buffer = this.sounds.get(name);
            if (!buffer) {
                // 仅在debug模式下显示警告，避免控制台噪音
                if (window.game && window.game.config && window.game.config.debug) {
                    console.warn(`音效 ${name} 不存在`);
                }
                return;
            }
            
            // 使用音频生成器播放缓冲区
            if (this.audioGenerator) {
                this.audioGenerator.playBuffer(
                    buffer, 
                    volume * this.sfxVolume * this.masterVolume,
                    playbackRate
                );
            }
        } catch (error) {
            // 仅在debug模式下显示警告，避免控制台噪音
            if (window.game && window.game.config && window.game.config.debug) {
                console.warn(`播放音效 ${name} 失败:`, error);
            }
        }
    }

    /**
     * 播放背景音乐
     */
    async playMusic(name, fadeIn = true) {
        // 如果音频未初始化，静默跳过（不报错，不阻塞游戏）
        if (this.isMuted || !this.initialized || !this.audioContext) return;
        
        try {
            // 1) 先确保轨道已生成（等待期间解除“游戏中暂停生成”，避免死锁）
            const prevPaused = this.musicGenPaused;
            this.musicGenPaused = false;
            let musicData = this.music.get(name);
            if (!musicData) {
                musicData = await this.createMusicTrackAsync(name);
            }
            this.musicGenPaused = prevPaused;
            if (!musicData) {
                console.warn(`背景音乐 ${name} 不存在`);
                return;
            }

            // 2) 再恢复音频上下文（挂起时限时尝试；失败则记住待播曲目，预热后补播）
            if (this.audioContext.state === 'suspended') {
                await Promise.race([
                    this.audioContext.resume(),
                    new Promise((resolve) => setTimeout(resolve, 300))
                ]);
                if (this.audioContext.state !== 'running') {
                    this.pendingMusic = { name, fadeIn };
                    return;
                }
            }
            await this.resumeAudioContext();
            
            // 如果正在播放相同的音乐，不重复播放
            if (this.currentMusic === name && musicData.isPlaying) {
                console.log(`背景音乐 ${name} 已在播放，跳过`);
                return;
            }
            
            // 停止当前音乐
            if (this.currentMusic && this.currentMusic !== name) {
                await this.stopMusic(true);
            }
            
            // 创建音频源
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = musicData.buffer;
            source.loop = true;
            
            // 设置音量
            const targetVolume = this.musicVolume * this.masterVolume;
            gainNode.gain.value = fadeIn ? 0 : targetVolume;
            
            // 连接音频图：音乐 → 主增益 → 输出（统一受主音量/静音控制）
            source.connect(gainNode);
            gainNode.connect(this.gainNode || this.audioContext.destination);
            
            // 开始播放
            source.start();
            
            // 保存当前音乐信息
            this.currentMusic = name;
            musicData.source = source;
            musicData.gainNode = gainNode;
            musicData.isPlaying = true;
            
            // 淡入效果
            if (fadeIn) {
                this.fadeInMusicGain(gainNode, targetVolume);
            }
            
            console.log(`开始播放背景音乐: ${name}`);
        } catch (error) {
            console.warn(`播放背景音乐 ${name} 失败:`, error);
        }
    }

    /**
     * 停止背景音乐
     */
    async stopMusic(fadeOut = true) {
        if (!this.currentMusic) return;
        
        const musicData = this.music.get(this.currentMusic);
        if (musicData && musicData.source && musicData.isPlaying) {
            try {
                if (fadeOut && musicData.gainNode) {
                    await this.fadeOutMusicGain(musicData.gainNode, musicData.source);
                } else {
                    musicData.source.stop();
                }
            } catch (error) {
                console.warn('停止音乐时出错:', error);
            }
            
            musicData.isPlaying = false;
            musicData.source = null;
            musicData.gainNode = null;
        }
        
        console.log(`停止背景音乐: ${this.currentMusic}`);
        this.currentMusic = null;
    }

    /**
     * 暂停音乐播放
     */
    pauseMusic() {
        if (!this.currentMusic) return;
        
        const musicData = this.music.get(this.currentMusic);
        if (musicData && musicData.source && musicData.isPlaying) {
            musicData.source.stop();
            musicData.isPlaying = false;
            musicData.source = null;
            musicData.gainNode = null;
        }
        
        console.log('音乐已暂停');
    }

        /**
     * 淡入音乐增益
     */
    fadeInMusicGain(gainNode, targetVolume, duration = 1000) {
        const steps = 50;
        const stepTime = duration / steps;
        const volumeStep = targetVolume / steps;
        
        let currentStep = 0;
        const fadeInterval = setInterval(() => {
            currentStep++;
            const newVolume = Math.min(targetVolume, volumeStep * currentStep);
            gainNode.gain.setValueAtTime(newVolume, this.audioContext.currentTime);
            
            if (currentStep >= steps) {
                clearInterval(fadeInterval);
                this.musicFadeInterval = null;
                gainNode.gain.setValueAtTime(targetVolume, this.audioContext.currentTime);
            }
        }, stepTime);
        // 记录定时器，音量调整时需取消，避免覆盖用户设置
        if (this.musicFadeInterval) clearInterval(this.musicFadeInterval);
        this.musicFadeInterval = fadeInterval;
    }
    
    /**
     * 淡出音乐增益
     */
    fadeOutMusicGain(gainNode, source, duration = 1000) {
        return new Promise((resolve) => {
            const initialVolume = gainNode.gain.value;
            const steps = 50;
            const stepTime = duration / steps;
            const volumeStep = initialVolume / steps;
            
            let currentStep = 0;
            const fadeInterval = setInterval(() => {
                currentStep++;
                const newVolume = Math.max(0, initialVolume - volumeStep * currentStep);
                gainNode.gain.setValueAtTime(newVolume, this.audioContext.currentTime);
                
                if (currentStep >= steps || newVolume <= 0) {
                    clearInterval(fadeInterval);
                    source.stop();
                    resolve();
                }
            }, stepTime);
        });
    }

    /**
     * 设置主音量
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
        this.updateMasterVolume();
    }

    /**
     * 设置音效音量
     */
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
    }

    /**
     * 设置音乐音量
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        // 取消进行中的淡入动画，避免覆盖用户新设置的音量
        if (this.musicFadeInterval) {
            clearInterval(this.musicFadeInterval);
            this.musicFadeInterval = null;
        }
        this.updateAllVolumes();
    }

    /**
     * 更新Web Audio API主音量
     */
    updateMasterVolume() {
        if (this.gainNode) {
            this.gainNode.gain.setValueAtTime(
                this.isMuted ? 0 : this.masterVolume,
                this.audioContext.currentTime
            );
        }
    }

    /**
     * 更新所有音频的音量
     */
    updateAllVolumes() {
        // 更新当前播放的音乐音量
        if (this.currentMusic) {
            const musicData = this.music.get(this.currentMusic);
            if (musicData && musicData.gainNode) {
                const targetVolume = this.musicVolume * this.masterVolume;
                musicData.gainNode.gain.setValueAtTime(targetVolume, this.audioContext.currentTime);
            }
        }
        
        // 音效音量在播放时会自动应用新的音量设置
        console.log('音量设置已更新');
    }

    /**
     * 静音/取消静音
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.updateMasterVolume();
        
        // 更新当前音乐的音量
        if (this.currentMusic) {
            const musicData = this.music.get(this.currentMusic);
            if (musicData && musicData.gainNode) {
                const targetVolume = this.isMuted ? 0 : this.musicVolume * this.masterVolume;
                musicData.gainNode.gain.setValueAtTime(targetVolume, this.audioContext.currentTime);
            }
        }
        
        console.log(`音频${this.isMuted ? '已静音' : '已取消静音'}`);
        return this.isMuted;
    }

    /**
     * 获取音量设置
     */
    getVolumeSettings() {
        return {
            master: this.masterVolume,
            sfx: this.sfxVolume,
            music: this.musicVolume,
            isMuted: this.isMuted
        };
    }

    /**
     * 停止所有音效
     */
    stopAllSounds() {
        // 由于使用Web Audio API的音频缓冲区，音效会自动停止
        // 这里主要是为了保持接口一致性
        console.log('停止所有音效');
    }

    /**
     * 销毁音频管理器
     */
    destroy() {
        this.stopAllSounds();
        this.stopMusic(false);
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.sounds.clear();
        this.music.clear();
        this.generatedSounds.clear();
        this.currentMusic = null;
        this.audioGenerator = null;
        
        console.log('音频管理器已销毁');
    }

    /**
     * 预热音频系统（在用户首次交互时调用）
     */
    async warmUp() {
        try {
            await this.resumeAudioContext();
            
            // 播放一个极短的静默音频来激活音频系统
            if (this.audioContext) {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.01);
            }

            // 预热成功后补播因挂起而延迟的音乐
            if (this.pendingMusic && this.audioContext && this.audioContext.state === 'running') {
                const pending = this.pendingMusic;
                this.pendingMusic = null;
                this.playMusic(pending.name, pending.fadeIn);
            }
            
            console.log('音频系统预热完成');
        } catch (error) {
            console.warn('音频系统预热失败:', error);
        }
    }
}

// 导出AudioManager类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
} else {
    window.AudioManager = AudioManager;
} 