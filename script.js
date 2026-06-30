// --- THEME SWITCHER LOGIC ---
const themeToggleBtn = document.getElementById('theme-toggle');
const rootElement = document.documentElement;

// Recupera a preferência do usuário ou define "light" como padrão
const savedTheme = localStorage.getItem('theme') || 'light';
rootElement.setAttribute('data-theme', savedTheme);
updateToggleIcon(savedTheme);

themeToggleBtn.addEventListener('click', () => {
  const currentTheme = rootElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  rootElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateToggleIcon(newTheme);
});

function updateToggleIcon(theme) {
  if (theme === 'dark') {
    themeToggleBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
      </svg>
    `;
  } else {
    themeToggleBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-12.37c-.39-.39-.39-1.03 0-1.41s1.03-.39 1.41 0l1.06 1.06c.39.39.39 1.03 0 1.41s-1.03.39-1.41 0l-1.06-1.06zM5.99 16.95l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0z"/>
      </svg>
    `;
  }
}

// --- CURSOR PARTICLES SYSTEM ---
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

let particles = [];
let mouse = { x: null, y: null, lastX: null, lastY: null, speed: 0 };

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  if (mouse.lastX !== null && mouse.lastY !== null) {
    const dx = mouse.x - mouse.lastX;
    const dy = mouse.y - mouse.lastY;
    mouse.speed = Math.hypot(dx, dy);
    const density = Math.min(Math.floor(mouse.speed / 2) + 1, 8);
    for (let i = 0; i < density; i++) createParticle(mouse.x, mouse.y);
  }
  mouse.lastX = mouse.x;
  mouse.lastY = mouse.y;
});

window.addEventListener('mouseout', () => {
  mouse.x = mouse.y = mouse.lastX = mouse.lastY = null;
});

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2 - 0.5;
    this.size = Math.random() * 3 + 1.5;
    this.maxLife = Math.random() * 30 + 30;
    this.life = this.maxLife;
    const colors = [
      'rgba(171, 32, 253, ',
      'rgba(111, 0, 255, ',
      'rgba(0, 240, 255, ',
      'rgba(255, 0, 128, '
    ];
    this.colorBase = colors[Math.floor(Math.random() * colors.length)];
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    if (this.size > 0.1) this.size -= 0.03;
  }
  draw() {
    const opacity = this.life / this.maxLife;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `${this.colorBase}${opacity})`;
    ctx.shadowBlur = 10;
    ctx.shadowColor = `${this.colorBase}${opacity})`;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
function createParticle(x, y) {
  if (particles.length < 150) particles.push(new Particle(x, y));
}
function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    if (p.life <= 0 || p.size <= 0.1) particles.splice(i, 1);
    else p.draw();
  }
  requestAnimationFrame(animateParticles);
}
animateParticles();


