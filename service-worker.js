/**
 * 飞机大战 PWA Service Worker
 * 策略：网络优先（页面/脚本始终最新，开发与更新友好），失败回退缓存；
 * 图片类资源缓存优先（几乎不变，省流量）。
 */
const CACHE_VERSION = 'planewar-v1';
const CACHE_NAME = `${CACHE_VERSION}-assets`;

// 安装阶段预缓存的核心资源
const PRECACHE = [
    './',
    './index.html',
    './manifest.webmanifest',
    './css/style.css',
    './js/main.js',
    './js/Game.js',
    './js/bridge.js',
    './js/mobile.js',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    // 仅处理同源请求
    if (url.origin !== self.location.origin) return;

    const isImage = /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url.pathname);

    if (isImage) {
        // 图片：缓存优先，后台更新
        event.respondWith(
            caches.match(request).then((cached) => {
                const network = fetch(request).then((response) => {
                    if (response && response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return response;
                }).catch(() => cached);
                return cached || network;
            })
        );
        return;
    }

    // 其他资源：网络优先，失败回退缓存
    event.respondWith(
        fetch(request).then((response) => {
            if (response && response.ok) {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
        }).catch(() =>
            caches.match(request).then((cached) =>
                cached || caches.match('./index.html')
            )
        )
    );
});
