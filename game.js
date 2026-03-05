const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width, height;

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

// UI elements
const uiDiv = document.getElementById('ui');
const menuDiv = document.getElementById('menu');
const menuTitle = document.getElementById('menuTitle');
const buttonsDiv = document.getElementById('buttonsDiv');

// Game state
let gameState = 'playing'; // playing, menu, gameover
let fase = 1;
let kills = 0;
let moedas = 0;
let ammo = 30;
let maxAmmo = 30;
let ammoPickups = [];

setInterval(() => {
    if (gameState === 'playing') {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.max(width, height) / 2 + Math.random() * 200 + 100;
        ammoPickups.push({
            x: player.x + Math.cos(angle) * distance,
            y: player.y + Math.sin(angle) * distance,
            size: 24
        });
    }
}, 12000); // 12 seconds

// Player (fixed in center)
const player = {
    x: 0, // logical world x
    y: 0, // logical world y
    radius: 15,
    color: '#0074D9',
    hp: 100,
    maxHp: 100,
    speed: 5
};

// Sword (orbits player)
const sword = {
    length: 80,
    angle: 0,
    rotationSpeed: 0.05,
    color: '#FFDC00',
    damage: 10
};

// Upgrades
let swordLengthLevel = 1;
let swordSpeedLevel = 1;
let damageLevel = 1;

// Input
const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

const mouse = { x: 0, y: 0 };
let bullets = [];

window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mousedown', e => {
    if (gameState !== 'playing') return;
    if (ammo <= 0) return;

    const cw = width / 2;
    const ch = height / 2;

    // Calculate angle from center to mouse
    const angle = Math.atan2(mouse.y - ch, mouse.x - cw);

    // Starting position at the edge of the player
    const startX = player.x + Math.cos(angle) * player.radius;
    const startY = player.y + Math.sin(angle) * player.radius;

    bullets.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * 15,
        vy: Math.sin(angle) * 15,
        radius: 4,
        color: '#FFDC00',
        damage: 15
    });

    ammo--;
});

window.addEventListener('keydown', e => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true;
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});
window.addEventListener('keyup', e => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false;
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

// Zombies
let zombies = [];
const zombieBaseCount = 5;

// Particles
let particles = [];

function updateUI() {
    uiDiv.innerText = `Fase: ${fase} | Kills: ${kills} | Moedas: ${moedas}`;
}

function spawnWave() {
    zombies = [];
    const count = Math.floor(zombieBaseCount * Math.pow(1.5, fase));
    const hpMultiplier = Math.pow(1.10, fase - 1);

    for (let i = 0; i < count; i++) {
        // Spawn outside screen logically
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.max(width, height) / 2 + Math.random() * 500 + 100;
        zombies.push({
            x: player.x + Math.cos(angle) * distance,
            y: player.y + Math.sin(angle) * distance,
            radius: 15,
            hp: 20 * hpMultiplier,
            maxHp: 20 * hpMultiplier,
            speed: 1.5 + Math.random() * 1.5,
            color: '#2ECC40'
        });
    }
}

function createParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1.0,
            color: color
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function update() {
    if (gameState !== 'playing') return;

    // Move player logic
    let dx = 0, dy = 0;
    if (keys.w || keys.ArrowUp) dy -= player.speed;
    if (keys.s || keys.ArrowDown) dy += player.speed;
    if (keys.a || keys.ArrowLeft) dx -= player.speed;
    if (keys.d || keys.ArrowRight) dx += player.speed;

    // Normalize diagonal speed
    if (dx !== 0 && dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy);
        dx = (dx / length) * player.speed;
        dy = (dy / length) * player.speed;
    }

    player.x += dx;
    player.y += dy;

    // Update sword angle
    sword.angle += sword.rotationSpeed;

    // Absolute position of the sword's tip logically
    const swordTipX = player.x + Math.cos(sword.angle) * sword.length;
    const swordTipY = player.y + Math.sin(sword.angle) * sword.length;

    // Update zombies
    for (let i = zombies.length - 1; i >= 0; i--) {
        const z = zombies[i];

        // Move towards player
        const angleToPlayer = Math.atan2(player.y - z.y, player.x - z.x);
        z.x += Math.cos(angleToPlayer) * z.speed;
        z.y += Math.sin(angleToPlayer) * z.speed;

        // Check collision with player
        const distToPlayer = Math.hypot(player.x - z.x, player.y - z.y);
        if (distToPlayer < player.radius + z.radius) {
            player.hp -= 10; // Simple damage per frame hit
            createParticles(player.x, player.y, '#FF4136');

            // Knockback zombie heavily to avoid instant death
            z.x -= Math.cos(angleToPlayer) * 100;
            z.y -= Math.sin(angleToPlayer) * 100;

            if (player.hp <= 0) {
                showGameOver();
                return;
            }
        }

        // Check collision with sword (line segment vs circle)
        const lineLen2 = sword.length * sword.length;
        let t = 0;
        if (lineLen2 > 0) {
            t = ((z.x - player.x) * (swordTipX - player.x) + (z.y - player.y) * (swordTipY - player.y)) / lineLen2;
            t = Math.max(0, Math.min(1, t));
        }
        const projX = player.x + t * (swordTipX - player.x);
        const projY = player.y + t * (swordTipY - player.y);
        const distToSword = Math.hypot(z.x - projX, z.y - projY);

        if (distToSword < z.radius) {
            // Hit by sword
            z.hp -= sword.damage;
            createParticles(projX, projY, '#AAAAAA');

            // Knockback
            z.x -= Math.cos(angleToPlayer) * 30;
            z.y -= Math.sin(angleToPlayer) * 30;

            if (z.hp <= 0) {
                zombies.splice(i, 1);
                kills++;
                moedas += Math.floor(Math.random() * 3) + 1; // 1 to 3 moedas
                createParticles(z.x, z.y, z.color);
            }
        }
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;

        // Remove if off-screen (distance from player > max dimension)
        const distToPlayer = Math.hypot(b.x - player.x, b.y - player.y);
        if (distToPlayer > Math.max(width, height)) {
            bullets.splice(i, 1);
            continue;
        }

        let hit = false;
        for (let j = zombies.length - 1; j >= 0; j--) {
            const z = zombies[j];
            const dist = Math.hypot(b.x - z.x, b.y - z.y);
            if (dist < b.radius + z.radius) {
                z.hp -= b.damage;
                createParticles(b.x, b.y, b.color);

                // Knockback
                const angle = Math.atan2(b.vy, b.vx);
                z.x += Math.cos(angle) * 20;
                z.y += Math.sin(angle) * 20;

                if (z.hp <= 0) {
                    zombies.splice(j, 1);
                    kills++;
                    moedas += Math.floor(Math.random() * 3) + 1;
                    createParticles(z.x, z.y, z.color);
                }
                hit = true;
                break;
            }
        }
        if (hit) {
            bullets.splice(i, 1);
        }
    }

    // Update ammo pickups
    for (let i = ammoPickups.length - 1; i >= 0; i--) {
        const p = ammoPickups[i];
        const dist = Math.hypot(player.x - p.x, player.y - p.y);
        if (dist < player.radius + p.size / 2) {
            ammo += 10;
            if (ammo > maxAmmo) ammo = maxAmmo;
            ammoPickups.splice(i, 1);
            createParticles(p.x, p.y, '#888888');
        }
    }

    // Next wave logic
    if (zombies.length === 0) {
        showUpgradeMenu();
    }

    updateParticles();
    updateUI();
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    // Center is (width/2, height/2)
    const cw = width / 2;
    const ch = height / 2;

    // Draw background grid
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    const startX = - (player.x % 100);
    const startY = - (player.y % 100);

    ctx.beginPath();
    for (let x = startX; x < width; x += 100) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }
    for (let y = startY; y < height; y += 100) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Draw Ammo Pickups
    ammoPickups.forEach(p => {
        const screenX = cw + (p.x - player.x);
        const screenY = ch + (p.y - player.y);
        ctx.fillStyle = '#888888';
        ctx.fillRect(screenX - p.size / 2, screenY - p.size / 2, p.size, p.size);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('R', screenX, screenY);
    });

    // Draw Bullets
    bullets.forEach(b => {
        const screenX = cw + (b.x - player.x);
        const screenY = ch + (b.y - player.y);
        ctx.shadowBlur = 10;
        ctx.shadowColor = b.color;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Draw Particles
    particles.forEach(p => {
        const screenX = cw + (p.x - player.x);
        const screenY = ch + (p.y - player.y);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });

    // Draw Zombies
    zombies.forEach(z => {
        const screenX = cw + (z.x - player.x);
        const screenY = ch + (z.y - player.y);

        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = z.color;

        ctx.fillStyle = z.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, z.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // HP bar
        const hpPercent = z.hp / z.maxHp;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(screenX - 15, screenY - 25, 30, 4);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(screenX - 15, screenY - 25, 30 * hpPercent, 4);
    });

    // Draw Player
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(cw, ch, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cw, ch, player.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Player HP
    const playerHpPercent = player.hp / player.maxHp;
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(cw - 25, ch + 25, 50, 6);
    ctx.fillStyle = '#FF4136';
    ctx.fillRect(cw - 25, ch + 25, 50 * playerHpPercent, 6);

    // Draw Sword
    const swordScreenX = cw + Math.cos(sword.angle) * sword.length;
    const swordScreenY = ch + Math.sin(sword.angle) * sword.length;

    ctx.shadowBlur = 15;
    ctx.shadowColor = sword.color;
    ctx.strokeStyle = sword.color;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cw, ch);
    ctx.lineTo(swordScreenX, swordScreenY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Ammo UI Text
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.font = 'bold 24px Inter';
    ctx.fillStyle = ammo > 0 ? '#FFDC00' : '#FF4136';
    ctx.fillText(`Munição: ${ammo}/${maxAmmo}`, 20, height - 20);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function showUpgradeMenu() {
    gameState = 'menu';
    menuDiv.style.display = 'flex';
    menuTitle.innerText = `Onda ${fase} Completa!`;
    const costComprimento = swordLengthLevel * 50;
    const costVelocidade = swordSpeedLevel * 50;
    const costDano = damageLevel * 50;

    buttonsDiv.innerHTML = `
        <button id="btnComp">Comprimento (${costComprimento} moedas)</button>
        <button id="btnVel">Velocidade (${costVelocidade} moedas)</button>
        <button id="btnDmg">Dano (${costDano} moedas)</button>
        <button id="btnNext" style="background-color: #2ECC40; margin-top: 10px;">Próxima Fase >></button>
    `;

    document.getElementById('btnComp').onclick = () => {
        if (moedas >= costComprimento) {
            moedas -= costComprimento;
            sword.length += 15;
            swordLengthLevel++;
            showUpgradeMenu();
        }
    };

    document.getElementById('btnVel').onclick = () => {
        if (moedas >= costVelocidade) {
            moedas -= costVelocidade;
            sword.rotationSpeed += 0.015;
            swordSpeedLevel++;
            showUpgradeMenu();
        }
    };

    document.getElementById('btnDmg').onclick = () => {
        if (moedas >= costDano) {
            moedas -= costDano;
            sword.damage += 10;
            damageLevel++;
            showUpgradeMenu();
        }
    }

    document.getElementById('btnNext').onclick = () => {
        fase++;
        gameState = 'playing';
        menuDiv.style.display = 'none';
        spawnWave();
    };

    updateUI();
}

function showGameOver() {
    gameState = 'gameover';
    menuDiv.style.display = 'flex';
    menuTitle.innerText = "Game Over";

    const reviveCost = fase * 50;

    buttonsDiv.innerHTML = `
        <p style="margin-bottom: 20px;">Kills: ${kills} | Fase alcançada: ${fase}</p>
        <button id="btnRevive">Reviver (${reviveCost} moedas)</button>
        <button id="btnRestart" style="background-color: #FF4136; margin-top: 10px;">Recomeçar</button>
    `;

    document.getElementById('btnRevive').onclick = () => {
        if (moedas >= reviveCost) {
            moedas -= reviveCost;
            player.hp = player.maxHp;
            ammo = maxAmmo;
            gameState = 'playing';
            menuDiv.style.display = 'none';
        } else {
            alert("Moedas insuficientes!");
        }
    };

    document.getElementById('btnRestart').onclick = () => {
        fase = 1;
        moedas = 0;
        kills = 0;
        player.hp = player.maxHp;
        bullets = [];
        ammo = maxAmmo;
        ammoPickups = [];
        sword.length = 80;
        sword.rotationSpeed = 0.05;
        sword.damage = 10;
        swordLengthLevel = 1;
        swordSpeedLevel = 1;
        damageLevel = 1;
        player.x = 0;
        player.y = 0;
        gameState = 'playing';
        menuDiv.style.display = 'none';
        spawnWave();
    };
}

// Start Game
spawnWave();
requestAnimationFrame(gameLoop);
