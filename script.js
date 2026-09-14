document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. MANEJO DE FASES DE INICIO
    // ==========================================
    const loadingPhase = document.getElementById("loading-phase");
    const birthdayPhase = document.getElementById("birthday-phase");
    const mainMenuPhase = document.getElementById("main-menu-phase");
    const bdayWish = document.getElementById("bday-wish");
    const nextBtn = document.getElementById("next-btn");

    // Lógica para mostrar la Fase 2 (Cumpleaños) después de "cargar"
    setTimeout(() => {
        if (loadingPhase) loadingPhase.style.display = "none";
        if (birthdayPhase) birthdayPhase.style.display = "flex";
        
        // Validar si la fecha del dispositivo es 20 de septiembre
        const hoy = new Date();
        const dia = hoy.getDate();
        const mes = hoy.getMonth() + 1; // getMonth() empieza en 0 (Enero)

        if (dia === 20 && mes === 9) {
            if (bdayWish) bdayWish.style.display = "block"; // Muestra el mensaje extra
        }
    }, 2500); // 2.5 segundos de carga

    // Transición al Menú Principal al pulsar SIGUIENTE
    if (nextBtn) {
    nextBtn.addEventListener("click", () => {
        playSound(audioBtn); 
        audioBackground.play().catch(e => console.log("Esperando interacción", e)); // Inicia la música aquí
        birthdayPhase.style.display = "none";
        mainMenuPhase.style.display = "flex";
    });
}


    // ==========================================
    // 2. REFERENCIAS Y VARIABLES DEL JUEGO
    // ==========================================
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzj3t8oQfGaeroksE1IPEf9OMroz2yRi6HMtSUziR46BgQ-h09gmtyYF2M1NpO3ygqBNA/exec"; 
    
    const leaderboardList = document.getElementById("leaderboard-list");
    const introScreen = document.getElementById("intro-screen");
    const gameArea = document.getElementById("game-area");
    const instructionsModal = document.getElementById("instructions-modal");
    
    const startBtn = document.getElementById("start-btn");
    const readyBtn = document.getElementById("ready-btn");
    const stopBtn = document.getElementById("stop-btn");
    const playerNameInput = document.getElementById("player-name");
    
    const jugador = document.getElementById("jugador");
    const pelota = document.getElementById("pelota");
    const redZone = document.getElementById("red-zone");
    
    const scoreElement = document.getElementById("score");
    const highScoreElement = document.getElementById("high-score");
    const gameContainer = document.getElementById("game-container");

    // Elementos de Audio
    const audioBtn = document.getElementById("audio-btn");
    const audioAtajar = document.getElementById("audio-atajar");
    const audioPerder = document.getElementById("audio-perder");
    audioPerder.volume = 0.5; // Reducir volumen del sonido de perder
    const audioFin = document.getElementById("audio-fin");
    const audioBackground = document.getElementById("audio-background");

    // Elementos del Modal de Game Over
    const gameOverModal = document.getElementById("game-over-modal");
    const gameOverReason = document.getElementById("game-over-reason");
    const gameOverPlayer = document.getElementById("game-over-player");
    const gameOverScore = document.getElementById("game-over-score");
    const restartBtn = document.getElementById("restart-btn");
    const menuBtn = document.getElementById("menu-btn");

    // Variables de Estado
    let score = 0;
    let highScore = localStorage.getItem("nicoCumpleHighScore2") || 0;
    highScoreElement.textContent = highScore;

    let isPlaying = false;
    let parpadeoInterval;
    let animationFrameId;
    let timeoutTarget, timeoutShoot, timeoutReset;
    let weatherInterval;
    let weatherStates = ["", "weather-sunset", "weather-night", "weather-rain"];
    let currentWeatherIndex = 0;

    let playerName = "Amigo de Nico";

    // Sprites
    const sprNormal = "imagenes/jugador.png";
    const sprParpadeo = "imagenes/parpadeando.gif";
    const sprAtajando = "imagenes/atajando.gif";

    // Físicas
    let targetX = 0, targetY = 0;
    let ballSpeed = 1500; 
    let playerX = gameContainer.offsetWidth / 2;
    let playerY = gameContainer.offsetHeight - 80;

    let currentProjectile = "normal";
    let slowNextShot = false;


    // ==========================================
    // 3. FUNCIONES GENERALES
    // ==========================================
    function playSound(audioElement) {
        if (!audioElement) return;
        audioElement.currentTime = 0;
        audioElement.play().catch(e => console.log("Audio en espera de interacción", e));
    }

    function updatePlayerPos(clientX, clientY) {
        if (!isPlaying) return;
        const rect = gameContainer.getBoundingClientRect();
        playerX = clientX - rect.left;
        playerY = clientY - rect.top;

        if (playerX < 0) playerX = 0;
        if (playerX > rect.width) playerX = rect.width;
        if (playerY < 0) playerY = 0;
        if (playerY > rect.height) playerY = rect.height;

        jugador.style.left = playerX + "px";
        jugador.style.top = playerY + "px";
    }

    function iniciarParpadeo() {
        parpadeoInterval = setInterval(() => {
            if (!isPlaying) return;
            if (jugador.src.includes(sprNormal)) {
                jugador.src = sprParpadeo;
                setTimeout(() => {
                    if (jugador.src.includes(sprParpadeo)) jugador.src = sprNormal;
                }, 800); 
            }
        }, 3000 + Math.random() * 2000);
    }


    // ==========================================
    // 4. EVENTOS DE LOS BOTONES
    // ==========================================
    startBtn.addEventListener("click", () => {
        playSound(audioBtn);
        if (playerNameInput.value.trim() !== "") {
            playerName = playerNameInput.value.trim();
        }
        introScreen.style.display = "none";
        instructionsModal.style.display = "flex";
    });

    readyBtn.addEventListener("click", () => {
        playSound(audioBtn);
        instructionsModal.style.display = "none";
        gameArea.style.display = "block";
        
        const rect = gameContainer.getBoundingClientRect();
        playerX = rect.width / 2;
        playerY = rect.height - 100;
        jugador.style.left = playerX + "px";
        jugador.style.top = playerY + "px";

        startGame();
    });

    stopBtn.addEventListener("click", () => {
        playSound(audioBtn);
        playSound(audioFin); // Ahora solo suena al hacer clic en PARAR
        endGame("Juego detenido manualmente.");
    });

    restartBtn.addEventListener("click", () => {
        playSound(audioBtn);
        gameOverModal.style.display = "none";
        gameArea.style.display = "block";
        
        const rect = gameContainer.getBoundingClientRect();
        playerX = rect.width / 2;
        playerY = rect.height - 100;
        jugador.style.left = playerX + "px";
        jugador.style.top = playerY + "px";

        startGame();
    });

    menuBtn.addEventListener("click", () => {
        playSound(audioBtn);
        gameOverModal.style.display = "none";
        introScreen.style.display = "flex";
        cargarLeaderboard();
    });

    // Control de Movimiento
    gameContainer.addEventListener("mousemove", (e) => updatePlayerPos(e.clientX, e.clientY));
    gameContainer.addEventListener("touchmove", (e) => {
        if (!isPlaying) return;
        e.preventDefault(); 
        updatePlayerPos(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });


    // ==========================================
    // 5. LÓGICA PRINCIPAL DEL JUEGO
    // ==========================================
    function startGame() {
        score = 0;
        scoreElement.textContent = score;
        jugador.src = sprNormal;
        
        // Resetear dificultad inicial
        let nivelDificultad = Math.floor(score / 10);
        ballSpeed = Math.max(300, 1500 - (score * 35) - (nivelDificultad * 100)); 
        
        // --- NUEVO SISTEMA DE CLIMA EN LOOP ---
        currentWeatherIndex = 0; // Empezar de día
        document.getElementById("weather-overlay").className = weatherStates[currentWeatherIndex];
        
        clearInterval(weatherInterval); // Limpiar cualquier loop anterior
        weatherInterval = setInterval(() => {
            if (!isPlaying) return;
            // Avanzar al siguiente estado y volver a 0 si llega al final
            currentWeatherIndex = (currentWeatherIndex + 1) % weatherStates.length;
            document.getElementById("weather-overlay").className = weatherStates[currentWeatherIndex];
        }, 15000); // Cambia de clima cada 15 segundos (puedes ajustar este número)
        // --------------------------------------

        isPlaying = true;
        iniciarParpadeo();
        
        timeoutTarget = setTimeout(spawnTarget, 1000);
    }

    function spawnTarget() {
        if (!isPlaying) return;

        const rect = gameContainer.getBoundingClientRect();
        const marginX = 60;
        
        targetX = marginX + Math.random() * (rect.width - marginX * 2);
        targetY = (rect.height * 0.1) + Math.random() * (rect.height * 0.5);

        // Probabilidades de Proyectiles Especiales
        let chance = Math.random();
        if (chance < 0.15) {
            currentProjectile = "torta";
            pelota.src = "imagenes/torta.png";
        } else if (chance < 0.30) {
            currentProjectile = "regalo";
            pelota.src = "imagenes/regalo.png";
        } else {
            currentProjectile = "normal";
            pelota.src = "imagenes/pelota.png";
        }
        let nivelDificultad = Math.floor(score / 10);

        // Tiro con Amague (A partir de 5 puntos, 30% de probabilidad progresiva)
        let probAmague = Math.min(0.75, 0.30 + (nivelDificultad * 0.15));
        let isAmague = score >= 5 && Math.random() < probAmague;
        
        if (isAmague) {
            let fakeX = marginX + Math.random() * (rect.width - marginX * 2);
            let fakeY = (rect.height * 0.1) + Math.random() * (rect.height * 0.5);
            
            redZone.style.left = fakeX + "px";
            redZone.style.top = fakeY + "px";
            redZone.classList.add("amague-glitch");
            redZone.style.display = "block";

            setTimeout(() => {
                if(!isPlaying) return;
                redZone.classList.remove("amague-glitch");
                redZone.style.left = targetX + "px";
                redZone.style.top = targetY + "px";
            }, 500); 
        } else {
            redZone.classList.remove("amague-glitch");
            redZone.style.left = targetX + "px";
            redZone.style.top = targetY + "px";
            redZone.style.display = "block";
        }

        pelota.style.left = (rect.width / 2) + "px";
        pelota.style.top = (rect.height + 50) + "px";
        pelota.style.transform = "translate(-50%, -50%) scale(0.1)";
        pelota.style.display = "block";

        // Ajuste de tiempo de reacción
        let reactionTime = 800 - (score * 20);
        if (slowNextShot) {
            reactionTime *= 1.4; // 40% más lento si agarró regalo
            slowNextShot = false;
        }
        if (reactionTime < 300) reactionTime = 300; 

        timeoutShoot = setTimeout(shootBall, isAmague ? reactionTime + 400 : reactionTime);
    }

    function shootBall() {
        if (!isPlaying) return;
        
        const rect = gameContainer.getBoundingClientRect();
        let startTime = performance.now();
        
        let startX = rect.width / 2;
        let startY = rect.height + 50;
        let startScale = 0.1;

        function animateBall(time) {
            if (!isPlaying) return;
            
            let elapsed = time - startTime;
            let progress = elapsed / ballSpeed;
            if (progress > 1) progress = 1;

            let currentX = startX + (targetX - startX) * progress;
            let currentY = startY + (targetY - startY) * progress;
            let currentScale = startScale + (1 - startScale) * progress;
            let rotacion = progress * 720;

            pelota.style.left = currentX + "px";
            pelota.style.top = currentY + "px";
            pelota.style.transform = `translate(-50%, -50%) scale(${currentScale}) rotate(${rotacion}deg)`;

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animateBall);
            } else {
                checkSave(); 
            }
        }
        animationFrameId = requestAnimationFrame(animateBall);
    }

    function checkSave() {
        const distX = Math.abs(playerX - targetX);
        const distY = Math.abs(playerY - targetY);

        const hitRadiusX = jugador.offsetWidth / 1.5;
        const hitRadiusY = jugador.offsetHeight / 1.5;

        // Si se atajó
        if (distX < hitRadiusX && distY < hitRadiusY) {
            
            // Atajada Perfecta (Milimétrica)
            let isPerfect = distX < 25 && distY < 25;
            let timeFreeze = 600; 
            
            if (isPerfect) {
                score += 2; // Puntos extra
                timeFreeze = 1200; // Efecto de tiempo bala
                
                const perfectMsg = document.getElementById("perfect-msg");
                const timeWarp = document.getElementById("time-warp-flash");
                
                perfectMsg.style.display = "block";
                timeWarp.style.display = "block";
                
                setTimeout(() => {
                    perfectMsg.style.display = "none";
                    timeWarp.style.display = "none";
                }, 800);
            } else {
                score++;
            }

            // Beneficios de proyectiles
            if (currentProjectile === "torta") score += 4; 
            if (currentProjectile === "regalo") slowNextShot = true;

            scoreElement.textContent = score;
            jugador.src = sprAtajando; 
            playSound(audioAtajar);
            
            // Hito cada 10 puntos
            if (score % 10 === 0 && score > 0) {
                const milestoneMsg = document.getElementById("milestone-msg");
                milestoneMsg.style.display = "block";
                milestoneMsg.classList.remove("pop-animation");
                void milestoneMsg.offsetWidth; // Reflow para reiniciar animación
                milestoneMsg.classList.add("pop-animation");
            }
            
            jugador.classList.add("flash-save");
            setTimeout(() => jugador.classList.remove("flash-save"), 300);
            
            redZone.style.display = "none";
            pelota.style.display = "none";

            // Aumentar velocidad progresivamente
            ballSpeed = Math.max(450, 1500 - (score * 35)); 

            timeoutReset = setTimeout(() => {
                if (isPlaying) {
                    jugador.src = sprNormal;
                    spawnTarget(); 
                }
            }, timeFreeze);
            
        } else {
            // ¡Golazo!
            playSound(audioPerder);
            gameContainer.classList.add("shake");
            setTimeout(() => {
                gameContainer.classList.remove("shake");
                endGame("No llegaste a tiempo.");
            }, 400); 
        }
    }

    function endGame(reason) {
        isPlaying = false;
        clearInterval(parpadeoInterval);
        clearInterval(weatherInterval);
        clearTimeout(timeoutTarget);
        clearTimeout(timeoutShoot);
        clearTimeout(timeoutReset);
        cancelAnimationFrame(animationFrameId);
        
        if (score > highScore) {
            highScore = score;
            localStorage.setItem("nicoCumpleHighScore2", highScore);
        }
        
        setTimeout(() => {
            playSound(audioFin);
            
            gameOverReason.textContent = reason;
            gameOverPlayer.textContent = playerName;
            gameOverScore.textContent = score;
            
            gameArea.style.display = "none";
            gameOverModal.style.display = "flex";
            
            highScoreElement.textContent = highScore;
            redZone.style.display = "none";
            pelota.style.display = "none";

            // Guardar puntaje en Google Sheets
            fetch(SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ jugador: playerName, puntos: score })
            }).then(() => {
                console.log("Puntaje guardado en Google Sheets");
            }).catch(err => console.error("Error al guardar:", err));

        }, 100);
    }

    // ==========================================
    // 6. LEADERBOARD (TABLA DE POSICIONES)
    // ==========================================
    function cargarLeaderboard() {
        leaderboardList.innerHTML = "<li>Cargando puntajes...</li>";
        
        fetch(SCRIPT_URL)
            .then(res => res.json())
            .then(data => {
                leaderboardList.innerHTML = "";
                
                if(!data || data.length === 0) {
                    leaderboardList.innerHTML = "<li>Nadie ha jugado aún.</li>";
                    return;
                }

                data.forEach((item, index) => {
                    let medalla = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "💀";
                    let li = document.createElement("li");
                    li.innerHTML = `<span>${medalla} ${item.nombre}</span> <b>${item.puntos} pts</b>`;
                    leaderboardList.appendChild(li);
                });
            })
            .catch(() => {
                leaderboardList.innerHTML = "<li>Error al sincronizar.</li>";
            });
    }

    // Cargar leaderboard inicial
    cargarLeaderboard();
});