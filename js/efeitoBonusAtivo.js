// efeitoBonusAtivoComFumaca.js
// Versão: mantém fumaça legada + trails que seguem (~30% do lifespan) + cascata menos pesada
(function () {
  const MOBILE = /Mobi|Android/i.test(navigator.userAgent);
  const FIRE_INTERVAL_MS = MOBILE ? 1200 : 700;
  const SPARK_THROTTLE_MS = 100;

  const bonusCheckbox = document.getElementById('bonusEspecialCheckbox');
  if (!bonusCheckbox) return;

  const glowTargets = [document.body, ...document.querySelectorAll('.section')];

  let fireIntervalId = null;
  const activeSparks = new Set();
  const activeParticles = new Set();
  const smokeTrailMap = new WeakMap(); // particleEl -> intervalId

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
    p.style.position = 'absolute';
    if (typeof lifespanMs === 'number') p._lifespan = Math.max(60, Math.round(lifespanMs));
    document.body.appendChild(p);
    return p;
  }

  function spawnFireSmoke(x, y, lifeMs = 900) {
    const smoke = document.createElement('div');
    smoke.className = 'fire-smoke';
    smoke.style.position = 'absolute';
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
    smoke.style.zIndex = 1280;
    document.body.appendChild(smoke);

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
        try {
          smoke.remove();
        } catch (e) {}
        return;
      }
      requestAnimationFrame(step);
    })(start);
  }

  function spawnFireSmokeGroup(x, y, opts = {}) {
    const { count = Math.floor(rand(3, 5)), life = 600 + Math.random() * 220, spread = 8 + Math.random() * 8, rise = 0.18 + Math.random() * 0.18, drift = 0.06 + Math.random() * 0.08, staticness = 0.55 } = opts;

    const group = document.createElement('div');
    group.className = 'fire-smoke-group';
    group.style.position = 'absolute';
    group.style.left = x + 'px';
    group.style.top = y + 'px';
    group.style.pointerEvents = 'none';
    group.style.zIndex = 1295;
    document.body.appendChild(group);

    const lifeHalf = Math.max(80, Math.round(life * 0.5));
    let alive = 0;
    for (let i = 0; i < count; i++) {
      alive++;
      const puff = document.createElement('div');
      puff.className = 'fire-smoke-puff';
      const size = (6 + Math.random() * 8) * (1 - staticness * 0.3);
      puff.style.width = size + 'px';
      puff.style.height = size + 'px';
      puff.style.borderRadius = '50%';
      const gray = Math.round(170 + Math.random() * 50);
      puff.style.background = `radial-gradient(circle, rgba(${gray},${gray},${gray},${0.22 + Math.random() * 0.12}) 0%, rgba(${gray},${gray},${gray},0) 68%)`;
      const sx = rand(-spread, spread);
      const sy = rand(-spread * 0.2, spread * 0.1);
      puff.style.left = sx + 'px';
      puff.style.top = sy + 'px';
      puff.style.position = 'absolute';
      puff.style.opacity = (0.3 + Math.random() * 0.12).toString();
      group.appendChild(puff);

      const vx = (Math.random() - 0.5) * drift * 30 * (1 - staticness);
      const vy = -(rise * (5 + Math.random() * 6)) * (1 - staticness * 0.6);
      const start = performance.now();

      (function animatePuff(puffEl, startX, startY, idx) {
        function frame(now) {
          const t = now - start;
          const p = Math.min(1, t / lifeHalf);
          if (p >= 1) {
            try {
              puffEl.remove();
            } catch (e) {}
            alive--;
            if (alive <= 0)
              try {
                group.remove();
              } catch (e) {}
            return;
          }
          const cx = startX + vx * (t / 18) + Math.sin((t + idx * 20) / 200) * 0.7 * (1 - staticness);
          const cy = startY + vy * (t / 18) + p * (6 * staticness);
          const scale = 1 + p * (0.45 + Math.random() * 0.25);
          const opacityStart = parseFloat(puffEl.style.opacity) || 0.35;
          const opacity = Math.max(0, opacityStart * (1 - p * 1.9));
          puffEl.style.left = cx + 'px';
          puffEl.style.top = cy + 'px';
          puffEl.style.transform = `translate3d(0,0,0) scale(${scale}) rotate(${(idx % 2 ? 1 : -1) * p * 4}deg)`;
          puffEl.style.opacity = opacity.toFixed(3);
          requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      })(puff, sx, sy, i);
    }
  }

  function spawnTrailSmoke(x, y, life = 250) {
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
    puff.style.zIndex = 1300;
    const gray = Math.round(185 + Math.random() * 20);
    puff.style.background = `radial-gradient(circle, rgba(${gray},${gray},${gray},${0.22 + Math.random() * 0.12}) 0%, rgba(${gray},${gray},${gray},0) 65%)`;
    puff.style.willChange = 'transform, opacity';
    document.body.appendChild(puff);

    const vx = (Math.random() - 0.5) * 0.35;
    const vy = -(0.35 + Math.random() * 0.45);
    const startOpacity = 0.44 + Math.random() * 0.12;
    const start = performance.now();

    (function frame(now) {
      const t = now - start;
      const p = Math.min(1, t / life);
      const opacity = Math.max(0, startOpacity * (1 - p * 2.2));
      const cx = vx * (t / 14) + Math.sin(t / 150) * 0.35;
      const cy = vy * (t / 14) - p * 2.2;
      puff.style.transform = `translate(${cx}px, ${cy}px) scale(${1 + p * 0.35})`;
      puff.style.opacity = opacity.toFixed(3);
      if (p >= 1) {
        try {
          puff.remove();
        } catch (e) {}
        return;
      }
      requestAnimationFrame(frame);
    })(start);
  }

  function attachSmokeTrailToParticle(particleEl) {
    if (!particleEl || smokeTrailMap.has(particleEl)) return;

    const baseLife = particleEl._lifespan && Number(particleEl._lifespan) ? Number(particleEl._lifespan) : 700;
    let puffLife = Math.max(60, Math.round(baseLife * 0.3));
    let freq = Math.max(45, Math.round(Math.min(220, baseLife * 0.08)));

    try {
      const cl = particleEl.className || '';
      if (cl.indexOf('cascade-trail') !== -1) {
        puffLife = Math.max(50, Math.round(baseLife * 0.25));
        freq = Math.max(80, Math.round(Math.min(320, baseLife * 0.12)));
      }
    } catch (e) {}

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

  // ---------- BURSTS ----------
  function spawnShell(x, y) {
    const hueBase = getThemeHue();
    const targetY = y - rand(150, 250);
    const trailDuration = 400;

    const shell = createParticle(x, y, hueBase, trailDuration + 40);
    shell.classList.add('shell-trail');
    shell.style.transitionDuration = `${trailDuration}ms`;
    shell.style.transform = `translateY(${targetY - y}px) scale(1.5)`;
    activeParticles.add(shell);

    attachSmokeTrailToParticle(shell);

    setTimeout(() => {
      shell.style.opacity = '0';
      try {
        shell.remove();
      } catch (e) {}
      activeParticles.delete(shell);

      if (Math.random() < 0.5) spawnSmallBurst(x, targetY, hueBase);
      else spawnWillowBurst(x, targetY, hueBase);

      spawnFireSmoke(x + rand(-6, 6), targetY + rand(-6, 6), 900);
      spawnFireSmokeGroup(x + rand(-6, 6), targetY + rand(-6, 6), { count: 3, life: 520, spread: 10, rise: 0.18, drift: 0.07, staticness: 0.6 });
    }, trailDuration);
  }

  function spawnSmallBurst(x, y, hueBase) {
    const count = Math.floor(rand(12, 20));
    const duration = 1500;
    for (let i = 0; i < count; i++) {
      const p = createParticle(x, y, Math.round((hueBase + rand(-30, 30) + 360) % 360), duration + rand(0, 120));
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
        try {
          p.remove();
        } catch (e) {}
        activeParticles.delete(p);
      }, duration + rand(0, 120));
    }
  }

  function spawnWillowBurst(x, y, hueBase) {
    const count = Math.floor(rand(8, 12));
    const duration = 3000;
    for (let i = 0; i < count; i++) {
      const p = createParticle(x, y, Math.round((hueBase + rand(-30, 30) + 360) % 360), duration + rand(0, 200));
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
        try {
          p.remove();
        } catch (e) {}
        activeParticles.delete(p);
      }, duration + rand(80, 240));
    }
  }

  function spawnGoldCascade(x, y) {
    const hueBase = 50;
    const count = Math.floor(rand(10, 18));
    const duration = 3000;
    for (let i = 0; i < count; i++) {
      const p = createParticle(x, y, Math.round((hueBase + rand(-15, 15) + 360) % 360), duration + rand(0, 200));
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
        try {
          p.remove();
        } catch (e) {}
        activeParticles.delete(p);
      }, duration + rand(80, 360));
    }
    spawnFireSmokeGroup(x, y + 8, { count: 3, life: 620, spread: 18, rise: 0.16, drift: 0.1, staticness: 0.6 });
  }

  function spawnRingBurst(x, y) {
    const hueBase = getThemeHue();
    const count = Math.floor(rand(20, 32));
    const duration = 4000;
    const ringRadius = MOBILE ? 60 : 100;

    for (let i = 0; i < count; i++) {
      const p = createParticle(x, y, Math.round((hueBase + rand(-15, 15) + 360) % 360));
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

  function spawnSpiderBurst(x, y) {
    const hueBase = getThemeHue();
    const count = Math.floor(rand(8, 12));
    const duration = 3000;

    for (let i = 0; i < count; i++) {
      const p = createParticle(x, y, Math.round((hueBase + rand(-30, 30) + 360) % 360), duration + rand(0, 240));
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
        try {
          p.remove();
        } catch (e) {}
        activeParticles.delete(p);
      }, duration + rand(180, 420));
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

  function spawnSpark(x, y) {
    const s = document.createElement('div');
    s.className = 'bonus-spark';
    s.style.left = x - 3 + 'px';
    s.style.top = y - 3 + 'px';
    s.style.setProperty('--x', `${rand(-18, 18).toFixed(1)}px`);
    s.style.setProperty('--y', `${rand(-12, -28).toFixed(1)}px`);
    document.body.appendChild(s);
    activeSparks.add(s);
    setTimeout(() => {
      try {
        s.remove();
      } catch (e) {}
      activeSparks.delete(s);
    }, 900);
  }

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
    activeSparks.forEach((s) => {
      try {
        s.remove();
      } catch (e) {}
    });
    activeSparks.clear();
    activeParticles.forEach((p) => {
      const iv = smokeTrailMap.get(p);
      if (iv) clearInterval(iv);
      try {
        p.remove();
      } catch (e) {}
    });
    activeParticles.clear();
    try {
      smokeTrailMap.forEach && smokeTrailMap.forEach((iv) => clearInterval(iv));
    } catch (e) {}
    if (MOBILE) {
      document.removeEventListener('touchstart', onTouchSpark);
      document.removeEventListener('touchmove', onTouchSpark);
    } else {
      document.removeEventListener('mousemove', onMouseSpark);
    }
  }

  let lastMouse = 0;
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
