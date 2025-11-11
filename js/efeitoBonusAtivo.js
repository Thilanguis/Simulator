// efeitoBonusAtivo.js
// Corrigido para Android: mantém o visual idêntico ao PC (fumaça, tempo e densidade sincronizados + visibilidade garantida)

(function () {
  // ---------- DETECÇÃO E AJUSTES ANDROID ----------
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua) || (navigator.userAgentData && /Android/i.test(navigator.userAgentData.platform || ''));
  const TIME_SCALE = isAndroid ? 1.5 : 1.0; // ANDROID FIX: compensa aceleração do Android
  const SMOKE_MULT = isAndroid ? 2 : 1; // ANDROID FIX: reforça a fumaça

  const MOBILE = /Mobi|Android/i.test(navigator.userAgent);
  const FIRE_INTERVAL_MS = MOBILE ? Math.round(1200 * TIME_SCALE) : 700;
  const SPARK_THROTTLE_MS = 100;

  const bonusCheckbox = document.getElementById('bonusEspecialCheckbox');
  if (!bonusCheckbox) return;

  const glowTargets = [document.body, ...document.querySelectorAll('.section')];
  let fireIntervalId = null;
  const activeSparks = new Set();
  const activeParticles = new Set();
  const smokeTrailMap = new WeakMap();

  // ---------- CONTAINER GLOBAL PARA FOGOS (evita clipping Android) ----------
  let fireContainer = document.getElementById('fire-container');
  if (!fireContainer) {
    fireContainer = document.createElement('div');
    fireContainer.id = 'fire-container';
    Object.assign(fireContainer.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      width: '100vw',
      height: '100vh',
      overflow: 'visible',
      zIndex: '99999',
      pointerEvents: 'none',
    });
    document.body.appendChild(fireContainer);
  }

  // ---------- FUNÇÕES BASE ----------
  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function getThemeHue() {
    const p = Math.random();
    if (p < 0.33) return rand(280, 330);
    if (p < 0.66) return rand(0, 40);
    return rand(40, 65);
  }

  function createParticle(x, y, hue, lifespanMs) {
    const p = document.createElement('div');
    p.className = 'fire-particle';
    const sat = Math.round(rand(70, 90));
    const light = Math.round(rand(60, 80));
    p.style.background = `hsl(${hue} ${sat}% ${light}%)`;
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.position = 'fixed';
    p.style.zIndex = '99999';
    p.style.pointerEvents = 'none';
    if (typeof lifespanMs === 'number') p._lifespan = Math.max(60, Math.round(lifespanMs * TIME_SCALE));
    fireContainer.appendChild(p);
    return p;
  }

  // ---------- FUMAÇA ----------
  function spawnFireSmoke(x, y, lifeMs = 900) {
    lifeMs *= TIME_SCALE;
    for (let i = 0; i < SMOKE_MULT; i++) {
      const smoke = document.createElement('div');
      smoke.className = 'fire-smoke';
      smoke.style.position = 'fixed';
      smoke.style.left = x + 'px';
      smoke.style.top = y + 'px';
      smoke.style.width = '10px';
      smoke.style.height = '10px';
      smoke.style.borderRadius = '50%';
      smoke.style.background = 'radial-gradient(circle, rgba(200,200,200,0.32) 0%, rgba(200,200,200,0) 70%)';
      smoke.style.pointerEvents = 'none';
      smoke.style.userSelect = 'none';
      smoke.style.opacity = '0.45';
      smoke.style.transform = 'scale(1)';
      smoke.style.zIndex = '99999';
      fireContainer.appendChild(smoke);

      const vx = (Math.random() - 0.5) * 0.8;
      const vy = -(Math.random() * 0.6 + 0.4);
      const start = performance.now();

      (function step(now) {
        const t = now - start;
        const p = Math.min(1, t / lifeMs);
        const fadeFactor = p < 0.7 ? 1 - p / 0.7 : 0;
        smoke.style.transform = `translate(${vx * (t / 14)}px, ${vy * (t / 14)}px) scale(${1 + p * 0.6})`;
        smoke.style.opacity = `${Math.max(0, 0.45 * fadeFactor)}`;
        if (p >= 1) {
          smoke.remove();
          return;
        }
        requestAnimationFrame(step);
      })(start);
    }
  }

  function spawnTrailSmoke(x, y, life = 250) {
    life *= TIME_SCALE;
    for (let i = 0; i < SMOKE_MULT; i++) {
      const puff = document.createElement('div');
      puff.className = 'fire-smoke-trail';
      puff.style.position = 'fixed';
      const size = 4 + Math.random() * 6;
      puff.style.width = size + 'px';
      puff.style.height = size + 'px';
      puff.style.left = x - size / 2 + 'px';
      puff.style.top = y - size / 2 + 'px';
      puff.style.borderRadius = '50%';
      puff.style.pointerEvents = 'none';
      puff.style.zIndex = '99999';
      const gray = Math.round(185 + Math.random() * 20);
      puff.style.background = `radial-gradient(circle, rgba(${gray},${gray},${gray},${0.22 + Math.random() * 0.12}) 0%, rgba(${gray},${gray},${gray},0) 65%)`;
      puff.style.willChange = 'transform, opacity';
      fireContainer.appendChild(puff);

      const vx = (Math.random() - 0.5) * 0.35;
      const vy = -(0.35 + Math.random() * 0.45);
      const startOpacity = 0.44 + Math.random() * 0.12;
      const start = performance.now();

      (function frame(now) {
        const t = now - start;
        const p = Math.min(1, t / life);
        puff.style.transform = `translate(${vx * (t / 14)}px, ${vy * (t / 14)}px) scale(${1 + p * 0.35})`;
        puff.style.opacity = (startOpacity * (1 - p * 2.2)).toFixed(3);
        if (p >= 1) {
          puff.remove();
          return;
        }
        requestAnimationFrame(frame);
      })(start);
    }
  }

  function attachSmokeTrailToParticle(particleEl) {
    if (!particleEl || smokeTrailMap.has(particleEl)) return;
    const baseLife = particleEl._lifespan ? Number(particleEl._lifespan) : 700 * TIME_SCALE;
    const puffLife = Math.max(60, Math.round(baseLife * 0.3));
    const freq = Math.max(45, Math.round(Math.min(220, baseLife * 0.08)));

    const iv = setInterval(() => {
      if (!document.body.contains(particleEl)) {
        clearInterval(iv);
        smokeTrailMap.delete(particleEl);
        return;
      }
      const rect = particleEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      spawnTrailSmoke(cx + rand(-2, 2), cy + rand(-2, 2), puffLife);
    }, freq);
    smokeTrailMap.set(particleEl, iv);
  }

  // ---------- FOGOS ----------
  function spawnShell(x, y) {
    const hueBase = getThemeHue();
    const targetY = y - rand(150, 250);
    const trailDuration = 400 * TIME_SCALE;
    const shell = createParticle(x, y, hueBase, trailDuration + 40);
    shell.classList.add('shell-trail');
    shell.style.transitionDuration = `${trailDuration}ms`;
    shell.style.transform = `translateY(${targetY - y}px) scale(1.5)`;
    activeParticles.add(shell);
    attachSmokeTrailToParticle(shell);

    setTimeout(() => {
      shell.remove();
      activeParticles.delete(shell);
      if (Math.random() < 0.5) spawnSmallBurst(x, targetY, hueBase);
      else spawnWillowBurst(x, targetY, hueBase);
      spawnFireSmoke(x + rand(-6, 6), targetY + rand(-6, 6), 900);
    }, trailDuration);
  }

  function spawnSmallBurst(x, y, hueBase) {
    const count = Math.floor(rand(12, 20));
    const duration = 1500 * TIME_SCALE;
    for (let i = 0; i < count; i++) {
      const p = createParticle(x, y, hueBase, duration + rand(0, 120));
      activeParticles.add(p);
      const angle = rand(0, Math.PI * 2);
      const dist = rand(MOBILE ? 20 : 40, MOBILE ? 40 : 90);
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist * -1;
      const delay = rand(0, 40);
      setTimeout(() => {
        p.style.transform = `translate(${tx}px, ${ty}px) scale(${rand(0.7, 1.3)})`;
        p.style.opacity = '0';
        spawnFireSmoke(x + rand(-10, 10), y + rand(-10, 10), 700);
      }, delay);
      setTimeout(() => {
        p.remove();
        activeParticles.delete(p);
      }, duration + rand(0, 120));
    }
  }

  function spawnWillowBurst(x, y, hueBase) {
    const count = Math.floor(rand(8, 12));
    const duration = 3000 * TIME_SCALE;
    for (let i = 0; i < count; i++) {
      const p = createParticle(x, y, hueBase, duration + rand(0, 200));
      p.classList.add('fire-trail');
      activeParticles.add(p);
      const angle = rand(0, Math.PI * 2);
      const dist = rand(MOBILE ? 18 : 36, MOBILE ? 36 : 72);
      const tx = Math.cos(angle) * dist * 1.4;
      const ty = Math.sin(angle) * dist * -0.8 + rand(18, 36);
      const delay = rand(0, 90);
      setTimeout(() => {
        p.style.transform = `translate(${tx}px, ${ty}px) scale(${rand(0.5, 0.9)})`;
        p.style.opacity = '0.01';
        p.style.transitionDuration = `${duration}ms`;
        spawnFireSmoke(x + rand(-10, 10), y + rand(-10, 10), 760);
      }, delay);
      attachSmokeTrailToParticle(p);
      setTimeout(() => {
        p.remove();
        activeParticles.delete(p);
      }, duration + rand(80, 240));
    }
  }

  function spawnGoldCascade(x, y) {
    const hueBase = 50;
    const count = Math.floor(rand(10, 18));
    const duration = 3000 * TIME_SCALE;
    for (let i = 0; i < count; i++) {
      const p = createParticle(x, y, hueBase, duration + rand(0, 200));
      p.classList.add('cascade-trail');
      activeParticles.add(p);
      const angle = rand(Math.PI / 4, (3 * Math.PI) / 4);
      const dist = rand(30, 70);
      const tx = Math.cos(angle) * dist * 0.8;
      const ty = Math.sin(angle) * dist + rand(30, 80);
      const delay = rand(0, 160);
      setTimeout(() => {
        p.style.transform = `translate(${tx}px, ${ty}px) scale(0.6)`;
        p.style.opacity = '0.05';
        p.style.transitionDuration = `${duration}ms`;
        spawnFireSmoke(x + rand(-10, 10), y + rand(-10, 10), 580);
      }, delay);
      attachSmokeTrailToParticle(p);
      setTimeout(() => {
        p.remove();
        activeParticles.delete(p);
      }, duration + rand(80, 360));
    }
  }

  function spawnSpiderBurst(x, y) {
    const hueBase = getThemeHue();
    const count = Math.floor(rand(8, 12));
    const duration = 3000 * TIME_SCALE;
    for (let i = 0; i < count; i++) {
      const p = createParticle(x, y, hueBase, duration + rand(0, 240));
      p.classList.add('spider-trail');
      activeParticles.add(p);
      const angle = rand(0, Math.PI * 2);
      const dist = rand(MOBILE ? 80 : 150, MOBILE ? 120 : 250);
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist * -1;
      const delay = rand(0, 150);
      setTimeout(() => {
        p.style.transform = `translate(${tx}px, ${ty}px) scale(0.6)`;
        p.style.opacity = '0.01';
        p.style.transitionDuration = `${duration}ms`;
        spawnFireSmoke(x + rand(-10, 10), y + rand(-10, 10), 760);
      }, delay);
      attachSmokeTrailToParticle(p);
      setTimeout(() => {
        p.remove();
        activeParticles.delete(p);
      }, duration + rand(180, 420));
    }
  }

  function spawnRingBurst(x, y) {
    const hueBase = getThemeHue();
    const count = Math.floor(rand(20, 32));
    const duration = 4000 * TIME_SCALE;
    const ringRadius = MOBILE ? 60 : 100;
    for (let i = 0; i < count; i++) {
      const p = createParticle(x, y, hueBase, duration);
      p.classList.add('ring-particle');
      p.style.transition = `transform ${duration}ms cubic-bezier(0.1, 0.8, 0.2, 1), opacity ${duration}ms ease-out`;
      activeParticles.add(p);
      const angle = (i / count) * Math.PI * 2;
      const dist = ringRadius + rand(-5, 5);
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist * -1;
      const delay = rand(0, 80);
      setTimeout(() => {
        p.style.transform = `translate(${tx}px, ${ty}px) scale(${rand(0.7, 1.1)})`;
        p.style.opacity = '0';
        spawnFireSmoke(x + rand(-10, 10), y + rand(-10, 10), duration * 0.65);
      }, delay);
      setTimeout(() => {
        p.remove();
        activeParticles.delete(p);
      }, duration + delay);
    }
  }

  function spawnFirework(x, y) {
    const type = Math.random();
    if (type < 0.25) spawnShell(x, y);
    else if (type < 0.45) spawnSmallBurst(x, y, getThemeHue());
    else if (type < 0.65) spawnWillowBurst(x, y, getThemeHue());
    else if (type < 0.8) spawnGoldCascade(x, y);
    else if (type < 0.9) spawnSpiderBurst(x, y);
    else spawnRingBurst(x, y);
  }

  // ---------- SPARKS ----------
  let lastMouse = 0;
  function spawnSpark(x, y) {
    const s = document.createElement('div');
    s.className = 'bonus-spark';
    s.style.left = x - 3 + 'px';
    s.style.top = y - 3 + 'px';
    s.style.zIndex = '99999';
    s.style.pointerEvents = 'none';
    s.style.setProperty('--x', `${rand(-18, 18).toFixed(1)}px`);
    s.style.setProperty('--y', `${rand(-12, -28).toFixed(1)}px`);
    fireContainer.appendChild(s);
    activeSparks.add(s);
    setTimeout(() => {
      s.remove();
      activeSparks.delete(s);
    }, 900);
  }

  function onMouseSpark(e) {
    const now = Date.now();
    if (now - lastMouse < SPARK_THROTTLE_MS) return;
    lastMouse = now;
    spawnSpark(e.clientX + rand(-10, 10), e.clientY + rand(-10, 10));
    if (Math.random() < 0.06) spawnFirework(e.clientX + rand(-30, 30), e.clientY + rand(-30, 30));
  }

  function onTouchSpark(e) {
    for (let t of e.touches) {
      spawnSpark(t.clientX + rand(-8, 8), t.clientY + rand(-8, 8));
      if (Math.random() < 0.12) spawnFirework(t.clientX + rand(-30, 30), t.clientY + rand(-30, 30));
    }
  }

  // ---------- ATIVAÇÃO ----------
  function startEffects() {
    glowTargets.forEach((el) => el.classList.add('bonus-inner-glow'));
    if (!fireIntervalId) {
      fireIntervalId = setInterval(() => {
        const x = rand(window.innerWidth * 0.08, window.innerWidth * 0.92);
        const y = rand(window.innerHeight * 0.12, window.innerHeight * 0.6);
        spawnFirework(x, y);
      }, FIRE_INTERVAL_MS);
    }
    if (MOBILE) {
      document.addEventListener('touchstart', onTouchSpark, { passive: true });
      document.addEventListener('touchmove', onTouchSpark, { passive: true });
    } else {
      document.addEventListener('mousemove', onMouseSpark);
    }
  }

  function stopEffects() {
    glowTargets.forEach((el) => el.classList.remove('bonus-inner-glow'));
    if (fireIntervalId) {
      clearInterval(fireIntervalId);
      fireIntervalId = null;
    }
    activeSparks.forEach((s) => s.remove());
    activeParticles.forEach((p) => p.remove());
  }

  function handleToggle() {
    if (bonusCheckbox.checked) startEffects();
    else stopEffects();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (bonusCheckbox.checked) startEffects();
    bonusCheckbox.addEventListener('change', handleToggle);
  });

  window.addEventListener('pagehide', stopEffects, { once: true });
})();
