document.addEventListener('DOMContentLoaded', () => {
    // DOM
    const idleScreen = document.getElementById('idle-screen');
    const welcomeScreen = document.getElementById('welcome-screen');
    const mapScreen = document.getElementById('map-screen');
    const videoScreen = document.getElementById('video-screen');
    const videoContainer = document.getElementById('video-container');
    const videoTitle = document.getElementById('video-title');
    const videoDesc = document.getElementById('video-desc');
    const videoEmoji = document.getElementById('video-emoji');
    const videoProgressBar = document.getElementById('video-progress-bar');
    const hotspotsLayer = document.getElementById('hotspots-layer');
    const timerText = document.getElementById('timer-text');

    // State
    let currentScreen = 'idle';
    let sessionTimer, timeLeft = 120;
    const SESSION_TIMEOUT = 120;

    // Each hotspot: unique color, emoji, position (matching reference image)
    const hotspots = [
        { id:1, name:"The Grand Dining Hall",    emoji:"🍽️", color:"#ff3d8a", x:20, y:25,  icon:"assets/Hagia-Sophia.png", desc:"Fine dining with panoramic views" },
        { id:2, name:"Infinity Pool & Spa",      emoji:"🏊", color:"#00e5ff", x:42, y:15,  icon:"assets/unnamed.png",      desc:"Relax in our world-class infinity pool" },
        { id:3, name:"Luxury Shopping Arcade",   emoji:"🛍️", color:"#ffc107", x:75, y:15,  icon:"assets/Hagia-Sophia.png", desc:"Premium brands and exclusive collections" },
        { id:4, name:"Entertainment Zone",       emoji:"🎭", color:"#a855f7", x:88, y:45,  icon:"assets/unnamed.png",      desc:"Immersive shows and daily performances" },
        { id:5, name:"Rooftop Garden",           emoji:"🌿", color:"#22c55e", x:78, y:75,  icon:"assets/Hagia-Sophia.png", desc:"Urban oasis with lush greenery" },
        { id:6, name:"Fitness & Wellness Center",emoji:"🏋️", color:"#ff8c00", x:50, y:82,  icon:"assets/unnamed.png",      desc:"State-of-the-art fitness equipment" },
        { id:7, name:"Sky Lounge & Bar",         emoji:"🍸", color:"#ff3d8a", x:22, y:75,  icon:"assets/Hagia-Sophia.png", desc:"Signature cocktails and nightlife" },
        { id:8, name:"Conference & Events Hall", emoji:"🤝", color:"#3b82f6", x:10, y:50,  icon:"assets/unnamed.png",      desc:"Premium spaces for corporate events" }
    ];

    const videoElements = {};
    let activeLocationVideo = null;

    // ─── PARTICLES ───
    function initParticles(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const particles = [];
        for (let i = 0; i < 100; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 4 + 1,
                dx: (Math.random() - 0.5) * 0.4,
                dy: (Math.random() - 0.5) * 0.4,
                alpha: Math.random() * 0.5 + 0.1
            });
        }
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200,180,255,${p.alpha})`;
                ctx.fill();
                p.x += p.dx; p.y += p.dy;
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;
            });
            requestAnimationFrame(draw);
        }
        draw();
    }

    let mapAnimationId = null;
    let dashOffset = 0;

    // ─── MAP CONNECTING PATH ───
    function drawMapLines() {
        const canvas = document.getElementById('map-lines-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        if (mapAnimationId) cancelAnimationFrame(mapAnimationId);

        function animatePath() {
            if (currentScreen !== 'map') return;
            
            ctx.clearRect(0,0, canvas.width, canvas.height);
            
            if (hotspots.length < 2) return;

            const pts = hotspots.map(h => ({
                x: h.x / 100 * canvas.width,
                y: h.y / 100 * canvas.height
            }));
            pts.push(pts[0]);

            const drawPath = (dashArr, offset, color, width) => {
                ctx.beginPath();
                ctx.setLineDash(dashArr);
                ctx.lineDashOffset = offset;
                ctx.strokeStyle = color;
                ctx.lineWidth = width;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                ctx.moveTo(pts[0].x, pts[0].y);
                for (let i = 0; i < pts.length - 1; i++) {
                    const p0 = pts[i === 0 ? pts.length - 2 : i - 1];
                    const p1 = pts[i];
                    const p2 = pts[i + 1];
                    const p3 = pts[i + 2 >= pts.length ? (i + 2) % pts.length : i + 2];

                    for (let t = 0; t <= 1; t += 0.1) {
                        const x = 0.5 * ((2*p1.x)+(-p0.x+p2.x)*t+(2*p0.x-5*p1.x+4*p2.x-p3.x)*t*t+(-p0.x+3*p1.x-3*p2.x+p3.x)*t*t*t);
                        const y = 0.5 * ((2*p1.y)+(-p0.y+p2.y)*t+(2*p0.y-5*p1.y+4*p2.y-p3.y)*t*t+(-p0.y+3*p1.y-3*p2.y+p3.y)*t*t*t);
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
            };

            // 1. Background Static Track (faint dashed line)
            drawPath([15, 25], 0, 'rgba(255, 255, 255, 0.12)', 3);
            
            // 2. Subtle Glow behind ants
            drawPath([], 0, 'rgba(100, 150, 255, 0.08)', 25);

            // 3. Primary Marching Ants
            dashOffset -= 0.6;
            drawPath([18, 30], dashOffset, 'rgba(120, 160, 255, 0.8)', 6);

            mapAnimationId = requestAnimationFrame(animatePath);
        }
        
        animatePath();
    }

    // ─── INIT APP ───
    function initApp() {
        initParticles('particles-canvas');
        hotspotsLayer.innerHTML = '';
        hotspots.forEach((spot, index) => {
            const el = document.createElement('div');
            el.className = 'hotspot';
            el.style.left = `${spot.x}%`;
            el.style.top = `${spot.y}%`;
            el.style.animationDelay = `${index * 0.2}s`;

            el.innerHTML = `
                <div class="node-core">
                    <div class="node-ring-outer" style="border-color:${spot.color}"></div>
                    <div class="node-ring-outer node-ring-outer-2" style="border-color:${spot.color}"></div>
                    <div class="node-core-bg" style="border-color:${spot.color}"></div>
                    <div class="node-glow" style="background:${spot.color}"></div>
                    <div class="node-core-inner" style="background:radial-gradient(circle, ${spot.color}33 0%, ${spot.color}11 100%)">
                        <span class="node-emoji">${spot.emoji}</span>
                    </div>
                </div>
                <div class="node-label" style="border-color:${spot.color}66">
                    <span>${spot.name}</span>
                </div>
            `;

            el.addEventListener('mousedown', e => handleHotspotTap(e, spot));
            el.addEventListener('touchstart', e => handleHotspotTap(e, spot));
            hotspotsLayer.appendChild(el);

            // Preload video
            const vid = document.createElement('video');
            const videoPath = `assets/videos/poi-${index + 1}.mp4`;
            vid.src = videoPath;
            vid.preload = 'auto'; vid.muted = true; vid.playsInline = true; vid.loop = false;
            
            vid.onloadeddata = () => console.log(`✅ Video loaded: ${videoPath}`);
            vid.onended = () => {
                if (currentScreen === 'video') switchScreen('map');
            };
            vid.onerror = (e) => {
                console.error(`❌ Video load failed: ${videoPath}`, e);
                // Try fallback to root videos folder if assets/videos fails
                if (!vid.dataset.triedFallback) {
                    vid.dataset.triedFallback = 'true';
                    vid.src = `videos/location-${index + 1}.mp4`;
                }
            };
            videoContainer.appendChild(vid);
            videoElements[spot.id] = vid;
        });
    }

    // ─── RIPPLE ───
    function createRipple(e) {
        const x = e.clientX || (e.touches && e.touches[0].clientX);
        const y = e.clientY || (e.touches && e.touches[0].clientY);
        if (x === undefined) return;
        const r = document.createElement('div');
        r.className = 'touch-ripple';
        const s = 150; // Increased base size
        r.style.cssText = `width:${s}px;height:${s}px;left:${x-s/2}px;top:${y-s/2}px`;
        document.body.appendChild(r);
        setTimeout(() => r.remove(), 1200); // Matches the 1.2s CSS animation
    }

    document.addEventListener('mousedown', e => { createRipple(e); if (currentScreen !== 'idle') resetTimer(); });
    document.addEventListener('touchstart', e => { createRipple(e); if (currentScreen !== 'idle') resetTimer(); });

    // ─── SCREEN TRANSITIONS ───
    function switchScreen(to) {
        [idleScreen, welcomeScreen, mapScreen, videoScreen].forEach(s => {
            s.classList.remove('active'); s.classList.add('hidden');
        });

        if (to === 'idle') {
            idleScreen.classList.remove('hidden'); idleScreen.classList.add('active');
            if (activeLocationVideo) activeLocationVideo.pause();
            stopTimer();
        } else if (to === 'welcome') {
            welcomeScreen.classList.remove('hidden'); welcomeScreen.classList.add('active');
            initParticles('welcome-particles');
        } else if (to === 'map') {
            mapScreen.classList.remove('hidden'); mapScreen.classList.add('active');
            if (activeLocationVideo) {
                activeLocationVideo.pause();
                activeLocationVideo.classList.remove('active-video');
                activeLocationVideo = null;
            }
            drawMapLines();
            resetTimer();
        } else if (to === 'video') {
            videoScreen.classList.remove('hidden'); videoScreen.classList.add('active');
            if (activeLocationVideo) {
                activeLocationVideo.currentTime = 0;
                activeLocationVideo.play().catch(()=>{});
                trackVideoProgress();
            }
            resetTimer();
        }
        currentScreen = to;
    }

    // ─── INTERACTIONS ───
    function wakeUp() {
        if (currentScreen !== 'idle') return;
        switchScreen('welcome');
        setTimeout(() => switchScreen('map'), 2000);
    }
    idleScreen.addEventListener('mousedown', wakeUp);
    idleScreen.addEventListener('touchstart', wakeUp);

    function handleHotspotTap(e, spot) {
        e.stopPropagation(); e.preventDefault();
        createRipple(e);
        videoTitle.textContent = spot.name;
        videoDesc.textContent = spot.desc;
        videoEmoji.textContent = spot.emoji;
        
        // Dynamic UI Coloring based on the location
        const emojiContainer = document.querySelector('.video-emoji-container');
        if (emojiContainer) {
            emojiContainer.style.background = spot.color;
            emojiContainer.style.boxShadow = `0 0 100px ${spot.color}B3`; // ~70% opacity glow
        }
        
        if (videoProgressBar) {
            videoProgressBar.style.background = spot.color;
            videoProgressBar.style.boxShadow = `0 0 20px ${spot.color}E6, 0 0 10px ${spot.color}99`;
        }

        if (activeLocationVideo) {
            activeLocationVideo.classList.remove('active-video');
            activeLocationVideo.pause();
        }
        activeLocationVideo = videoElements[spot.id];
        if (activeLocationVideo) {
            activeLocationVideo.classList.add('active-video');
            activeLocationVideo.currentTime = 0;
            activeLocationVideo.play().catch(()=>{});
        }
        switchScreen('video');
    }

    function closeVideo() {
        if (currentScreen !== 'video') return;
        switchScreen('map');
    }
    videoScreen.addEventListener('mousedown', closeVideo);
    videoScreen.addEventListener('touchstart', closeVideo);

    // Video progress
    function trackVideoProgress() {
        if (!activeLocationVideo) return;
        function update() {
            if (currentScreen !== 'video' || !activeLocationVideo) return;
            if (activeLocationVideo.duration) {
                const pct = (activeLocationVideo.currentTime / activeLocationVideo.duration) * 100;
                videoProgressBar.style.width = `${pct}%`;
            }
            requestAnimationFrame(update);
        }
        update();
    }

    // ─── TIMER ───
    function updateTimerUI() { if (timerText) timerText.textContent = timeLeft; }

    function resetTimer() {
        timeLeft = SESSION_TIMEOUT; updateTimerUI();
        clearInterval(sessionTimer);
        sessionTimer = setInterval(() => {
            timeLeft--;
            updateTimerUI();
            if (timeLeft <= 0) switchScreen('idle');
        }, 1000);
    }

    function stopTimer() { clearInterval(sessionTimer); }

    // ─── BOOT ───
    initApp();
    switchScreen('idle');

    window.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('resize', () => {
        const c1 = document.getElementById('particles-canvas');
        if (c1) { c1.width = window.innerWidth; c1.height = window.innerHeight; }
    });
});
