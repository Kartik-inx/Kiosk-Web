document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const idleScreen = document.getElementById('idle-screen');
    const welcomeScreen = document.getElementById('welcome-screen');
    const mapScreen = document.getElementById('map-screen');
    const videoScreen = document.getElementById('video-screen');
    const transitionLayer = document.getElementById('transition-layer');
    const mapContainer = document.getElementById('map-container');
    
    const idleVideo = document.getElementById('idle-video');
    const videoContainer = document.getElementById('video-container');
    const videoTitle = document.getElementById('video-title');
    
    const hotspotsLayer = document.getElementById('hotspots-layer');
    const timerText = document.getElementById('timer-text');
    const timerProgress = document.querySelector('.timer-progress');
    const particlesContainer = document.getElementById('particles');

    // State
    let currentScreen = 'idle'; // 'idle', 'map', 'video'
    let sessionTimer;
    const SESSION_TIMEOUT = 120; // seconds
    let timeLeft = SESSION_TIMEOUT;

    // Hotspot Data (8 museum exhibit zones)
    const hotspots = [
        { id: 1, name: "Ancient Sculptures", x: 15, y: 40, icon: "assets/Hagia-Sophia.png" },
        { id: 2, name: "Renaissance Gallery", x: 38, y: 22, icon: "assets/unnamed.png" },
        { id: 3, name: "Egyptian Artifacts", x: 70, y: 18, icon: "assets/Hagia-Sophia.png" },
        { id: 4, name: "Modern Art Wing", x: 85, y: 38, icon: "assets/unnamed.png" },
        { id: 5, name: "Grand Atrium", x: 50, y: 50, icon: "assets/Hagia-Sophia.png" },
        { id: 6, name: "Science Exhibit", x: 22, y: 72, icon: "assets/unnamed.png" },
        { id: 7, name: "Interactive Lab", x: 55, y: 78, icon: "assets/Hagia-Sophia.png" },
        { id: 8, name: "Digital Gallery", x: 82, y: 72, icon: "assets/unnamed.png" }
    ];

    // Video Elements Store
    const videoElements = {};
    let activeLocationVideo = null;

    // Initialize App
    function initApp() {
        // Create Hotspots & Preload
        hotspotsLayer.innerHTML = '';
        hotspots.forEach((spot, index) => {
            // Hotspot UI
            const el = document.createElement('div');
            el.className = 'hotspot';
            el.style.left = `${spot.x}%`;
            el.style.top = `${spot.y}%`;
            
            el.innerHTML = `
                <div class="hotspot-ring"></div>
                <div class="hotspot-ring hotspot-ring-2"></div>
                <div class="hotspot-core">
                    <img class="hotspot-icon" src="${spot.icon}" alt="${spot.name}" draggable="false">
                </div>
                <div class="hotspot-label">
                    <span class="hotspot-number">0${index + 1}</span>
                    <span class="hotspot-name">${spot.name}</span>
                </div>
            `;
            
            el.addEventListener('mousedown', (e) => handleHotspotTap(e, spot));
            el.addEventListener('touchstart', (e) => handleHotspotTap(e, spot));
            
            hotspotsLayer.appendChild(el);

            // Preload Video
            const vid = document.createElement('video');
            vid.src = `videos/location-${index + 1}.mp4`;
            vid.preload = 'auto';
            vid.muted = true; 
            vid.playsInline = true;
            vid.loop = true;
            
            vid.onerror = () => console.warn(`Failed to load video for ${spot.name}.`);

            videoContainer.appendChild(vid);
            videoElements[spot.id] = vid;
        });

        // Generate Ambient Particles
        for(let i=0; i<30; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            const size = Math.random() * 4 + 2;
            p.style.width = `${size}px`;
            p.style.height = `${size}px`;
            p.style.left = `${Math.random() * 100}%`;
            p.style.top = `${Math.random() * 100}%`;
            p.style.animationDelay = `${Math.random() * 10}s`;
            p.style.animationDuration = `${Math.random() * 10 + 10}s`;
            particlesContainer.appendChild(p);
        }
    }

    // Touch Ripple
    function createRipple(event) {
        const x = event.clientX || (event.touches && event.touches[0].clientX);
        const y = event.clientY || (event.touches && event.touches[0].clientY);
        
        if (x === undefined || y === undefined) return;

        const ripple = document.createElement('div');
        ripple.className = 'touch-ripple';
        
        const size = 150;
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x - size/2}px`;
        ripple.style.top = `${y - size/2}px`;
        
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 800);
    }

    // Global listeners
    document.addEventListener('mousedown', (e) => {
        createRipple(e);
        if (currentScreen !== 'idle') resetTimer();
    });
    document.addEventListener('touchstart', (e) => {
        createRipple(e);
        if (currentScreen !== 'idle') resetTimer();
    });

    // Cinematic Transitions
    function playTransition(callback, isZoom = false) {
        // Apply zoom transform to map if needed
        if (isZoom && currentScreen === 'map') {
            mapContainer.style.transform = 'scale(1.5)';
        }

        transitionLayer.classList.add('is-transitioning');
        
        setTimeout(() => {
            callback();
            
            // Revert transition layer
            setTimeout(() => {
                transitionLayer.classList.remove('is-transitioning');
                if (isZoom) {
                    // Reset map scale silently while hidden
                    mapContainer.style.transform = '';
                }
            }, 100); // slight overlap
            
        }, 600); // 600ms corresponds to transition solid opacity duration
    }

    function switchScreen(toScreen) {
        // Hide all
        idleScreen.classList.remove('active');
        idleScreen.classList.add('hidden');
        welcomeScreen.classList.remove('active');
        welcomeScreen.classList.add('hidden');
        mapScreen.classList.remove('active');
        mapScreen.classList.add('hidden');
        videoScreen.classList.remove('active');
        videoScreen.classList.add('hidden');
        
        if (toScreen === 'idle') {
            idleScreen.classList.remove('hidden');
            idleScreen.classList.add('active');
            if (idleVideo) idleVideo.play().catch(() => {});
            if (activeLocationVideo) activeLocationVideo.pause();
            stopTimer();
        } else if (toScreen === 'welcome') {
            welcomeScreen.classList.remove('hidden');
            welcomeScreen.classList.add('active');
            if (idleVideo) idleVideo.pause();
        } else if (toScreen === 'map') {
            mapScreen.classList.remove('hidden');
            mapScreen.classList.add('active');
            if (idleVideo) idleVideo.pause();
            if (activeLocationVideo) {
                activeLocationVideo.pause();
                activeLocationVideo.classList.remove('active-video');
                activeLocationVideo = null;
            }
            resetTimer();
        } else if (toScreen === 'video') {
            videoScreen.classList.remove('hidden');
            videoScreen.classList.add('active');
            if (idleVideo) idleVideo.pause();
            if (activeLocationVideo) {
                activeLocationVideo.currentTime = 0;
                activeLocationVideo.play().catch(() => {});
            }
            resetTimer();
        }
        
        currentScreen = toScreen;
    }

    // Interactions
    function wakeUp() {
        if (currentScreen !== 'idle') return;
        playTransition(() => {
            switchScreen('welcome');
            // After 5 seconds, transition to map
            setTimeout(() => {
                playTransition(() => switchScreen('map'));
            }, 5000);
        });
    }

    idleScreen.addEventListener('mousedown', wakeUp);
    idleScreen.addEventListener('touchstart', wakeUp);

    function handleHotspotTap(e, spot) {
        e.stopPropagation();
        e.preventDefault();
        createRipple(e);
        
        videoTitle.textContent = spot.name;
        
        if (activeLocationVideo) {
            activeLocationVideo.classList.remove('active-video');
            activeLocationVideo.pause();
        }
        
        activeLocationVideo = videoElements[spot.id];
        if (activeLocationVideo) {
            activeLocationVideo.classList.add('active-video');
            activeLocationVideo.currentTime = 0;
            activeLocationVideo.play().catch(() => {});
        }
        
        // Pass true for zoom effect
        playTransition(() => switchScreen('video'), true);
    }

    function closeVideo(e) {
        // Only close if we tap the video screen background or back button, not the video overlay text directly (though it's fine for kiosk)
        if (currentScreen !== 'video') return;
        playTransition(() => switchScreen('map'));
    }

    videoScreen.addEventListener('mousedown', closeVideo);
    videoScreen.addEventListener('touchstart', closeVideo);

    // Timer Logic
    function updateTimerUI() {
        timerText.textContent = timeLeft;
        // SVG circle radius is 48, circumference is 2 * PI * 48 = 301.59
        const dashoffset = 301.59 - (timeLeft / SESSION_TIMEOUT) * 301.59;
        timerProgress.style.strokeDashoffset = dashoffset;
    }

    function resetTimer() {
        timeLeft = SESSION_TIMEOUT;
        updateTimerUI();
        
        clearInterval(sessionTimer);
        sessionTimer = setInterval(() => {
            timeLeft--;
            updateTimerUI();
            
            if (timeLeft <= 0) {
                playTransition(() => switchScreen('idle'));
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(sessionTimer);
    }

    // Run
    initApp();
    switchScreen('idle');
    window.addEventListener('contextmenu', e => e.preventDefault());
});
