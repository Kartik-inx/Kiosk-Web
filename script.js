document.addEventListener('DOMContentLoaded', () => {
    // DOM
    const idleScreen = document.getElementById('idle-screen');

    const mapScreen = document.getElementById('map-screen');
    const introScreen = document.getElementById('intro-screen');
    const introVideo = document.getElementById('intro-video');
    const videoScreen = document.getElementById('video-screen');
    const videoContainer = document.getElementById('video-container');
    const videoTitle = document.getElementById('video-title');
    const videoDesc = document.getElementById('video-desc');
    const videoIcon = document.getElementById('video-icon');
    const videoProgressBar = document.getElementById('video-progress-bar');
    const hotspotsLayer = document.getElementById('hotspots-layer');
    const timerText = document.getElementById('timer-text');

    // State
    let currentScreen = 'idle';
    let sessionTimer, timeLeft = 140;
    const SESSION_TIMEOUT = 140;

    // Each hotspot: unique color, icon, position
    const hotspots = [
        { id:1, name:"Chilandar", icon:"assets/New-data/Icons/Chilandar icon.png", color:"#ff3d8a", x:20, y:25, desc:"Explore the historic Chilandar monastery" },
        { id:2, name:"Holy Sepulchre", icon:"assets/New-data/Icons/Church of the Holy Sepulchre icon copy.png", color:"#00e5ff", x:42, y:15, desc:"Visit the Church of the Holy Sepulchre" },
        { id:3, name:"Hagia Sophia (Iznik)", icon:"assets/New-data/Icons/Hagia Sophia in Iznik icon copy.png", color:"#ffc107", x:75, y:15, desc:"Discover the Hagia Sophia in Iznik" },
        { id:4, name:"Hagios Demetrios", icon:"assets/New-data/Icons/Hagios Demetrios icon copy.png", color:"#a855f7", x:88, y:45, desc:"Explore the Hagios Demetrios basilica" },
        { id:5, name:"Holy Forty Martyrs", icon:"assets/New-data/Icons/Holy Forty Martyrs icon copy.png", color:"#22c55e", x:78, y:75, desc:"Visit the Holy Forty Martyrs church" },
        { id:6, name:"Mar Saba", icon:"assets/New-data/Icons/Mar Saba icon.png", color:"#ff8c00", x:50, y:82, desc:"Discover the Mar Saba monastery" },
        { id:7, name:"Trip-01", icon:"assets/New-data/Icons/Trip-01.png", color:"#ff3d8a", x:22, y:75, desc:"An amazing journey through history" },
        { id:8, name:"Trip-02", icon:"assets/New-data/Icons/Trip-02.png", color:"#3b82f6", x:10, y:50, desc:"Explore the hidden gems of the region" }
    ];

    const videoElements = {};
    let globalLocationVideo = null;
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
        hotspotsLayer.innerHTML = '';
        // Sort hotspots by Y coordinate descending (bottom to top)
        const sortedHotspots = [...hotspots].sort((a, b) => b.y - a.y);
        
        sortedHotspots.forEach((spot, index) => {
            const el = document.createElement('div');
            el.className = 'hotspot';
            el.style.left = `${spot.x}%`;
            el.style.top = `${spot.y}%`;
            el.style.animationDelay = `${index * 0.15}s`; // Staggered reveal

            el.innerHTML = `
                <div class="node-core">
                    <div class="node-glow" style="background:${spot.color}; opacity: 0.15; filter: blur(40px); position: absolute; inset: -10px; border-radius: 50%; z-index: 1;"></div>
                    <div class="node-core-inner">
                        <img src="${spot.icon}" alt="${spot.name}">
                    </div>
                </div>
                <div class="node-label" style="background: rgba(0,0,0,0.5); border: 1px solid ${spot.color}33">
                    <span>${spot.name}</span>
                </div>
            `;

            el.addEventListener('mousedown', e => handleHotspotTap(e, spot));
            el.addEventListener('touchstart', e => handleHotspotTap(e, spot));
            hotspotsLayer.appendChild(el);
        });

        // Setup single global video for all locations
        const vid = document.createElement('video');
        const videoPath = `assets/New-data/Beginning video.mp4`;
        vid.src = videoPath;
        vid.preload = 'auto'; vid.muted = true; vid.playsInline = true; vid.loop = false;
        
        vid.onloadeddata = () => console.log(`✅ Global Video loaded: ${videoPath}`);
        vid.onended = () => {
            if (currentScreen === 'video') switchScreen('map');
        };
        videoContainer.appendChild(vid);
        globalLocationVideo = vid;

        // Intro Video handling
        if (introVideo) {
            introVideo.onended = () => {
                if (currentScreen === 'intro') switchScreen('map');
            };
        }
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
        [idleScreen, mapScreen, videoScreen, introScreen].forEach(s => {
            if (s) { s.classList.remove('active'); s.classList.add('hidden'); }
        });

        if (to === 'idle') {
            idleScreen.classList.remove('hidden'); idleScreen.classList.add('active');
            const idleVideo = document.getElementById('idle-video');
            if (idleVideo) {
                idleVideo.currentTime = 0;
                idleVideo.play().catch(()=>{});
            }
            if (activeLocationVideo) activeLocationVideo.pause();
            if (introVideo) { introVideo.pause(); introVideo.currentTime = 0; }
            stopTimer();
        } else if (to === 'intro') {
            if (introScreen) {
                introScreen.classList.remove('hidden'); introScreen.classList.add('active');
                if (introVideo) { introVideo.currentTime = 0; introVideo.play().catch(()=>{}); }
            }
            resetTimer();
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
        switchScreen('intro');
    }
    idleScreen.addEventListener('mousedown', wakeUp);
    idleScreen.addEventListener('touchstart', wakeUp);

    function handleHotspotTap(e, spot) {
        e.stopPropagation(); e.preventDefault();
        createRipple(e);
        videoTitle.textContent = spot.name;
        videoDesc.textContent = spot.desc;
        if (videoIcon) videoIcon.src = spot.icon;
        
        // Dynamic UI Coloring based on the location
        const emojiContainer = document.querySelector('.video-emoji-container');
        if (emojiContainer) {
            emojiContainer.style.background = 'rgba(255, 255, 255, 0.2)';
            emojiContainer.style.boxShadow = `0 0 100px ${spot.color}80`;
            emojiContainer.style.border = '1px solid rgba(255, 255, 255, 0.3)';
            emojiContainer.style.backdropFilter = 'blur(15px)';
        }
        
        if (videoProgressBar) {
            videoProgressBar.style.background = spot.color;
            videoProgressBar.style.boxShadow = `0 0 20px ${spot.color}E6, 0 0 10px ${spot.color}99`;
        }

        if (activeLocationVideo) {
            activeLocationVideo.classList.remove('active-video');
            activeLocationVideo.pause();
        }
        activeLocationVideo = globalLocationVideo;
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
        // const c1 = document.getElementById('particles-canvas');
        // if (c1) { c1.width = window.innerWidth; c1.height = window.innerHeight; }
        const c2 = document.getElementById('welcome-particles');
        if (c2) { c2.width = window.innerWidth; c2.height = window.innerHeight; }
    });
});
