/**
 * 输入管理器 - 处理键盘和鼠标输入
 * 采用单例模式，统一管理游戏输入
 */
class InputManager {
    constructor() {
        if (InputManager.instance) {
            return InputManager.instance;
        }
        
        // 键盘状态
        this.keys = new Map();
        this.keysDown = new Map(); // 当前帧按下的键
        this.keysUp = new Map();   // 当前帧释放的键
        
        // 鼠标状态
        this.mouse = {
            x: 0,
            y: 0,
            hasMoved: false, // 是否已产生过鼠标移动（鼠标控制模式用于初始位置判定）
            buttons: new Map(),
            buttonsDown: new Map(),
            buttonsUp: new Map(),
            wheel: 0
        };
        
        // 触摸状态（移动设备支持）
        this.touch = {
            active: false,
            x: 0,
            y: 0,
            startX: 0,
            startY: 0,
            hasMoved: false // 是否已产生过触摸移动（触屏控制模式用于初始位置判定）
        };
        
        // 控制映射
        this.keyBindings = new Map();
        this.setupDefaultBindings();
        
        // 事件监听器
        this.eventListeners = new Map();
        
        // 初始化事件监听
        this.initEventListeners();
        
        InputManager.instance = this;
    }

    /**
     * 获取单例实例
     */
    static getInstance() {
        if (!InputManager.instance) {
            new InputManager();
        }
        return InputManager.instance;
    }

    /**
     * 设置默认按键绑定
     */
    setupDefaultBindings() {
        // 移动控制
        this.keyBindings.set('moveUp', ['KeyW', 'ArrowUp']);
        this.keyBindings.set('moveDown', ['KeyS', 'ArrowDown']);
        this.keyBindings.set('moveLeft', ['KeyA', 'ArrowLeft']);
        this.keyBindings.set('moveRight', ['KeyD', 'ArrowRight']);
        
        // 游戏动作
        this.keyBindings.set('shoot', ['Space']);
        this.keyBindings.set('special', ['KeyF', 'KeyX']);
        this.keyBindings.set('pause', ['Escape', 'KeyP']);
        this.keyBindings.set('confirm', ['Enter']);
        this.keyBindings.set('cancel', ['Escape']);
    }

    /**
     * 检查是否为开发者工具快捷键
     */
    isDevToolsKey(event) {
        // F12 键
        if (event.code === 'F12') {
            return true;
        }
        
        // Ctrl+Shift+I (Windows/Linux)
        if (event.ctrlKey && event.shiftKey && event.code === 'KeyI') {
            return true;
        }
        
        // Ctrl+Shift+C (检查元素)
        if (event.ctrlKey && event.shiftKey && event.code === 'KeyC') {
            return true;
        }
        
        // Ctrl+Shift+J (控制台)
        if (event.ctrlKey && event.shiftKey && event.code === 'KeyJ') {
            return true;
        }
        
        // Cmd+Option+I (Mac)
        if (event.metaKey && event.altKey && event.code === 'KeyI') {
            return true;
        }
        
        // Cmd+Option+C (Mac 检查元素)
        if (event.metaKey && event.altKey && event.code === 'KeyC') {
            return true;
        }
        
        // Cmd+Option+J (Mac 控制台)
        if (event.metaKey && event.altKey && event.code === 'KeyJ') {
            return true;
        }
        
        return false;
    }

    /**
     * 初始化事件监听器
     */
    initEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // 鼠标事件
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('wheel', this.handleMouseWheel.bind(this));
        
        // 触摸事件 - 需要显式设置passive为false以支持preventDefault
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        
        // 防止右键菜单
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // 防止页面滚动（表单控件输入时不拦截）
        document.addEventListener('keydown', (e) => {
            // 允许开发者工具快捷键
            if (this.isDevToolsKey(e)) {
                return;
            }
            
            if (this.isTypingTarget(e)) {
                return;
            }
            
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });
    }

    /**
     * 键盘按下事件处理（表单控件输入时不拦截，保证昵称等文本框可输入）
     */
    handleKeyDown(event) {
        const key = event.code;
        
        // 允许开发者工具快捷键
        if (this.isDevToolsKey(event)) {
            return; // 不阻止默认行为
        }

        // 焦点在输入控件上：不拦截、不记录游戏输入
        if (this.isTypingTarget(event)) {
            return;
        }
        
        if (!this.keys.get(key)) {
            this.keysDown.set(key, true);
            this.emit('keyDown', key);
        }
        
        this.keys.set(key, true);
        event.preventDefault();
    }

    /**
     * 键盘释放事件处理
     */
    handleKeyUp(event) {
        const key = event.code;
        
        // 允许开发者工具快捷键
        if (this.isDevToolsKey(event)) {
            return; // 不阻止默认行为
        }

        // 焦点在输入控件上：不拦截
        if (this.isTypingTarget(event)) {
            return;
        }
        
        this.keys.set(key, false);
        this.keysUp.set(key, true);
        this.emit('keyUp', key);
        event.preventDefault();
    }

    /**
     * 事件目标是否为文本输入类控件（输入框/下拉框/可编辑区）
     */
    isTypingTarget(event) {
        const t = event.target;
        if (!t || t === document.body || t === document.documentElement) {
            return false;
        }
        const tag = t.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable;
    }

    /**
     * 鼠标按下事件处理（仅游戏画布上的交互作为游戏输入，菜单控件不拦截）
     */
    handleMouseDown(event) {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas || event.target !== canvas) {
            return; // 菜单/UI 控件：交给原生处理（滑杆/按钮/输入框）
        }

        const button = event.button;
        
        if (!this.mouse.buttons.get(button)) {
            this.mouse.buttonsDown.set(button, true);
            this.emit('mouseDown', button, this.mouse.x, this.mouse.y);
        }
        
        this.mouse.buttons.set(button, true);
        event.preventDefault();
    }

    /**
     * 鼠标释放事件处理（仅游戏画布上的交互作为游戏输入）
     */
    handleMouseUp(event) {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas || event.target !== canvas) {
            return;
        }

        const button = event.button;
        this.mouse.buttons.set(button, false);
        this.mouse.buttonsUp.set(button, true);
        this.emit('mouseUp', button, this.mouse.x, this.mouse.y);
        event.preventDefault();
    }

    /**
     * 鼠标移动事件处理
     */
    handleMouseMove(event) {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        // 画布可能被 CSS 缩放（移动端适配），坐标需换算回 800x600 游戏空间
        const scale = rect.width > 0 ? canvas.width / rect.width : 1;
        
        this.mouse.x = (event.clientX - rect.left) * scale;
        this.mouse.y = (event.clientY - rect.top) * scale;
        this.mouse.hasMoved = true;
        
        this.emit('mouseMove', this.mouse.x, this.mouse.y);
    }

    /**
     * 鼠标滚轮事件处理（仅游戏画布上阻止默认滚动，菜单列表需正常滚动）
     */
    handleMouseWheel(event) {
        const canvas = document.getElementById('gameCanvas');
        this.mouse.wheel = event.deltaY;
        this.emit('mouseWheel', event.deltaY);
        if (canvas && event.target === canvas) {
            event.preventDefault();
        }
    }

    /**
     * 触摸开始事件处理
     */
    handleTouchStart(event) {
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            const canvas = document.getElementById('gameCanvas');
            const rect = canvas.getBoundingClientRect();
            const scale = rect.width > 0 ? canvas.width / rect.width : 1;
            
            // 首次触摸预热音频（移动端画布上的 touchstart 会吞掉合成 click，需主动预热）
            if (!this._audioWarmed) {
                this._audioWarmed = true;
                window.game?.audioManager?.warmUp();
            }
            
            this.touch.active = true;
            this.touch.hasMoved = true;
            this.touch.startX = this.touch.x = (touch.clientX - rect.left) * scale;
            this.touch.startY = this.touch.y = (touch.clientY - rect.top) * scale;
            
            this.emit('touchStart', this.touch.x, this.touch.y);
            
            // 只在游戏画布区域内阻止默认行为
            if (event.target === canvas || canvas.contains(event.target)) {
                event.preventDefault();
            }
        }
    }

    /**
     * 触摸结束事件处理
     */
    handleTouchEnd(event) {
        this.touch.active = false;
        this.emit('touchEnd', this.touch.x, this.touch.y);
        
        // 只在游戏画布区域内阻止默认行为
        const canvas = document.getElementById('gameCanvas');
        if (event.target === canvas || canvas.contains(event.target)) {
            event.preventDefault();
        }
    }

    /**
     * 触摸移动事件处理
     */
    handleTouchMove(event) {
        if (event.touches.length > 0 && this.touch.active) {
            const touch = event.touches[0];
            const canvas = document.getElementById('gameCanvas');
            const rect = canvas.getBoundingClientRect();
            const scale = rect.width > 0 ? canvas.width / rect.width : 1;
            
            this.touch.x = (touch.clientX - rect.left) * scale;
            this.touch.y = (touch.clientY - rect.top) * scale;
            
            this.emit('touchMove', this.touch.x, this.touch.y);
            
            // 只在游戏画布区域内阻止默认行为
            if (event.target === canvas || canvas.contains(event.target)) {
                event.preventDefault();
            }
        }
    }

    /**
     * 检查按键是否被按住
     */
    isKeyPressed(key) {
        return this.keys.get(key) || false;
    }

    /**
     * 检查按键是否在当前帧被按下
     */
    isKeyDown(key) {
        return this.keysDown.get(key) || false;
    }

    /**
     * 检查按键是否在当前帧被释放
     */
    isKeyUp(key) {
        return this.keysUp.get(key) || false;
    }

    /**
     * 检查动作是否被激活（基于按键绑定）
     */
    isActionPressed(action) {
        const keys = this.keyBindings.get(action);
        if (!keys) return false;
        
        return keys.some(key => this.isKeyPressed(key));
    }

    /**
     * 检查动作是否在当前帧被激活
     */
    isActionDown(action) {
        const keys = this.keyBindings.get(action);
        if (!keys) return false;
        
        return keys.some(key => this.isKeyDown(key));
    }

    /**
     * 检查动作是否在当前帧被释放
     */
    isActionUp(action) {
        const keys = this.keyBindings.get(action);
        if (!keys) return false;
        
        return keys.some(key => this.isKeyUp(key));
    }

    /**
     * 获取移动向量（基于WASD或方向键）
     */
    getMovementVector() {
        const vector = new Vector2D(0, 0);
        
        if (this.isActionPressed('moveLeft')) vector.x -= 1;
        if (this.isActionPressed('moveRight')) vector.x += 1;
        if (this.isActionPressed('moveUp')) vector.y -= 1;
        if (this.isActionPressed('moveDown')) vector.y += 1;
        
        // 归一化对角线移动
        if (vector.x !== 0 && vector.y !== 0) {
            vector.normalize();
        }
        
        return vector;
    }

    /**
     * 检查鼠标按钮是否被按住
     */
    isMousePressed(button) {
        return this.mouse.buttons.get(button) || false;
    }

    /**
     * 检查鼠标按钮是否在当前帧被按下
     */
    isMouseDown(button) {
        return this.mouse.buttonsDown.get(button) || false;
    }

    /**
     * 检查鼠标按钮是否在当前帧被释放
     */
    isMouseUp(button) {
        return this.mouse.buttonsUp.get(button) || false;
    }

    /**
     * 获取鼠标位置
     */
    getMousePosition() {
        return new Vector2D(this.mouse.x, this.mouse.y);
    }

    /**
     * 获取触摸位置
     */
    getTouchPosition() {
        return new Vector2D(this.touch.x, this.touch.y);
    }

    /**
     * 设置按键绑定
     */
    setKeyBinding(action, keys) {
        this.keyBindings.set(action, Array.isArray(keys) ? keys : [keys]);
    }

    /**
     * 添加事件监听器
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * 移除事件监听器
     */
    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * 触发事件
     */
    emit(event, ...args) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            for (let callback of listeners) {
                callback(...args);
            }
        }
    }

    /**
     * 更新输入状态（每帧调用）
     */
    update() {
        // 清除当前帧的按键状态
        this.keysDown.clear();
        this.keysUp.clear();
        this.mouse.buttonsDown.clear();
        this.mouse.buttonsUp.clear();
        this.mouse.wheel = 0;
    }

    /**
     * 清理资源
     */
    destroy() {
        // 移除所有事件监听器
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        document.removeEventListener('keyup', this.handleKeyUp.bind(this));
        document.removeEventListener('mousedown', this.handleMouseDown.bind(this));
        document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
        document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        document.removeEventListener('wheel', this.handleMouseWheel.bind(this));
        document.removeEventListener('touchstart', this.handleTouchStart.bind(this));
        document.removeEventListener('touchend', this.handleTouchEnd.bind(this));
        document.removeEventListener('touchmove', this.handleTouchMove.bind(this));
        
        InputManager.instance = null;
    }
} 