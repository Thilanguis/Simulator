// efeitoBonusAtivo.js
// Versão otimizada:
// - Mantém todos os efeitos originais (fogos, ring, cascata, spider, fumaça)
// - Android em tela cheia com mais fumaça porém fluido
// - Evita explosões pesadas em todo movimento/toque (apenas brilhos)
// - Usa container fixo para não ser cortado pelo layout/PWA

(function () {
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua) || (navigator.userAgentData && /Android/i.test(navigator.userAgentData.platform || ''));
  const MOBILE = /Mobi|Android/i.test(ua);

  // Ajustes globais
  const TIME_SCALE = isAndroid ? 1.3 : 1.0; // Android anima um pouco mais lento p/ acompanhar
  const SMOKE_MULT = isAndroid ? 1.7 : 1.0; // Mais fumaça no Android (realismo)
  const FIRE_INTERVAL_MS = isAndroid
    ? 2200 // Menos rajada automática no Android (menos lag)
    : MOBILE
    ? 1200
    : 700;
  const SPARK_THROTTLE_MS = MOBILE ? 140 : 80; // Menos spam de brilhos em touch

  // Limites para não travar
  const MAX_PARTICLES = isAndroid ? 160 : 320; // Limite de partículas de fogo
  const MAX_SMOKE = isAndroid ? 260 : 520; // Limite de fumaça ativa

  const bonusCheckbox = document.getElementById('bonusEspecialCheckbox');
  if (!bonusCheckbox) return;

  const glowTargets = [document.body, ...document.querySelectorAll('.section')];

  let fireIntervalId = null;
  const activeParticles = new Set();
  const activeSparks = new Set();
  const activeSmoke = new Set();
  const smokeTrailMap = new WeakMap();
  const smokeTrailIntervals = new Set();

  // Container fixo para fogos (evita clipping e respeita tela cheia no PWA)
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

  // Utils
  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function getThemeHue() {
    const p = Math.random();
    if (p < 0.33) return rand(280, 330); // roxos/rosas
    if (p < 0.66) return rand(0, 40); // vermelhos/laranjas
    return rand(40, 65); // dourados
  }

  function trackParticle(el) {
    activeParticles.add(el);
  }
  function untrackParticle(el) {
    activeParticles.delete(el);
  }

  function trackSmoke(el) {
    activeSmoke.add(el);
  }
  function untrackSmoke(el) {
    activeSmoke.delete(el);
  }

  // ---------- Partícula base ----------
  function createParticle(x, y, hue, lifespanMs) {
    if (activeParticles.size >= MAX_PARTICLES) return null;

    const p = document.createElement('div');
    p.className = 'fire-particle';

    const sat = Math.round(rand(70, 90));
    const light = Math.round(rand(60, 80));

    // Android tem bug com hsl + filter; usamos box-shadow colorido lá.
    if (isAndroid) {
      const color = `hsl(${hue}, ${sat}%, ${light}%)`;
      p.style.background = 'transparent';
      p.style.boxShadow = `0 0 10px ${color}, 0 0 4px rgba(255,255,255,0.4)`;
      p.style.filter = 'none';
    } else {
      p.style.background = `hsl(${hue} ${sat}% ${light}%)`;
      p.style.boxShadow = '0 0 10px rgba(255, 0, 150, 0.95), 0 0 4px rgba(255, 200, 200, 0.28)';
      p.style.filter = 'brightness(1.45)';
    }

    p.style.position = 'fixed';
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.zIndex = '99999';
    p.style.pointerEvents = 'none';

    if (typeof lifespanMs === 'number') {
      p._lifespan = Math.max(80, Math.round(lifespanMs * TIME_SCALE));
    }

    fireContainer.appendChild(p);
    trackParticle(p);
    return p;
  }

  // ---------- Fumaça estática (explosão) ----------
  function spawnFireSmoke(x, y, lifeMs = 900) {
    lifeMs = Math.round(lifeMs * TIME_SCALE);
    const baseCount = 4;
    const count = Math.max(3, Math.round(baseCount * SMOKE_MULT));

    for (let i = 0; i < count; i++) {
      if (activeSmoke.size >= MAX_SMOKE) break;

      const smoke = document.createElement('div');
      smoke.className = 'fire-smoke';
      smoke.style.position = 'fixed';
      smoke.style.left = x + rand(-6, 6) + 'px';
      smoke.style.top = y + rand(-4, 4) + 'px';
      smoke.style.width = '10px';
      smoke.style.height = '10px';
      smoke.style.borderRadius = '50%';
      smoke.style.background = 'radial-gradient(circle, rgba(200,200,200,0.30) 0%, rgba(200,200,200,0) 70%)';
      smoke.style.pointerEvents = 'none';
      smoke.style.opacity = isAndroid ? '0.26' : '0.42';
      smoke.style.transform = 'scale(1)';
      smoke.style.zIndex = '99999';

      fireContainer.appendChild(smoke);
      trackSmoke(smoke);

      const vx = (Math.random() - 0.5) * 0.55;
      const vy = -(Math.random() * 0.5 + 0.35);
      const start = performance.now();

      (function step(now) {
        const t = now - start;
        const p = Math.min(1, t / lifeMs);
        const fade = 1 - p;
        smoke.style.transform = `translate(${vx * (t / 16)}px, ${vy * (t / 16)}px) scale(${1 + p * 0.55})`;
        smoke.style.opacity = String((isAndroid ? 0.26 : 0.42) * fade);

        if (p >= 1 || !fireContainer.contains(smoke)) {
          smoke.remove();
          untrackSmoke(smoke);
          return;
        }
        requestAnimationFrame(step);
      })(start);
    }
  }

  // ---------- Fumaça trail (rastro dos fogos) ----------
  function spawnTrailSmoke(x, y, life = 260) {
    if (activeSmoke.size >= MAX_SMOKE) return;

    life = Math.round(life * TIME_SCALE);

    const puff = document.createElement('div');
    puff.className = 'fire-smoke-trail';
    puff.style.position = 'fixed';
    const size = 3 + Math.random() * 5;
    puff.style.width = size + 'px';
    puff.style.height = size + 'px';
    puff.style.left = x - size / 2 + 'px';
    puff.style.top = y - size / 2 + 'px';
    puff.style.borderRadius = '50%';
    puff.style.pointerEvents = 'none';
    puff.style.zIndex = '99999';

    const gray = Math.round(185 + Math.random() * 20);
    puff.style.background = `radial-gradient(circle, rgba(${gray},${gray},${gray},0.22) 0%, rgba(${gray},${gray},${gray},0) 65%)`;
    if (!isAndroid) puff.style.willChange = 'transform, opacity';

    fireContainer.appendChild(puff);
    trackSmoke(puff);

    const vx = (Math.random() - 0.5) * 0.3;
    const vy = -(0.3 + Math.random() * 0.35);
    const startOpacity = 0.36 + Math.random() * 0.12;
    const start = performance.now();

    (function frame(now) {
      const t = now - start;
      const p = Math.min(1, t / life);
      puff.style.transform = `translate(${vx * (t / 16)}px, ${vy * (t / 16)}px) scale(${1 + p * 0.35})`;
      puff.style.opacity = String(startOpacity * (1 - p * 2.1));

      if (p >= 1 || !fireContainer.contains(puff)) {
        puff.remove();
        untrackSmoke(puff);
        return;
      }
      requestAnimationFrame(frame);
    })(start);
  }

  function attachSmokeTrailToParticle(particleEl) {
    if (!particleEl || smokeTrailMap.has(particleEl)) return;

    const baseLife = particleEl._lifespan || 700 * TIME_SCALE;
    const puffLife = Math.max(80, Math.round(baseLife * (isAndroid ? 0.22 : 0.3)));
    const freq = Math.max(isAndroid ? 110 : 60, Math.round(Math.min(220, baseLife * 0.09)));

    const iv = setInterval(() => {
      if (!fireContainer.contains(particleEl)) {
        clearInterval(iv);
        smokeTrailMap.delete(particleEl);
        smokeTrailIntervals.delete(iv);
        return;
      }
      if (activeSmoke.size >= MAX_SMOKE) return;

      const rect = particleEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      spawnTrailSmoke(cx + rand(-2, 2), cy + rand(-2, 2), puffLife);
    }, freq);

    smokeTrailMap.set(particleEl, iv);
    smokeTrailIntervals.add(iv);
  }

  // ---------- TIPOS DE FOGOS (mantidos) ----------

  function spawnShell(x, y) {
    const hueBase = getThemeHue();
    const targetY = y - rand(150, 250);
    const trailDuration = 420 * TIME_SCALE;

    const shell = createParticle(x, y, hueBase, trailDuration + 40);
    if (!shell) return;

    shell.classList.add('shell-trail');
    shell.style.transitionDuration = `${trailDuration}ms`;
    shell.style.transform = `translateY(${targetY - y}px) scale(1.5)`;
    attachSmokeTrailToParticle(shell);

    setTimeout(() => {
      if (fireContainer.contains(shell)) {
        shell.remove();
        untrackParticle(shell);
      }
      if (Math.random() < 0.5) {
        spawnSmallBurst(x, targetY, hueBase);
      } else {
        spawnWillowBurst(x, targetY, hueBase);
      }
      spawnFireSmoke(x + rand(-6, 6), targetY + rand(-6, 6), 900);
    }, trailDuration);
  }

  function spawnSmallBurst(x, y, hueBase) {
    const count = Math.floor(rand(10, 18));
    const duration = 1500 * TIME_SCALE;

    for (let i = 0; i < count; i++) {
      const p = createParticle(x, y, hueBase, duration + rand(0, 120));
      if (!p) return;

      const angle = rand(0, Math.PI * 2);
      const dist = rand(MOBILE ? 24 : 40, MOBILE ? 46 : 90);
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist * -1;
      const delay = rand(0, 40);

      setTimeout(() => {
        if (!fireContainer.contains(p)) return;
        p.style.transform = `translate(${tx}px, ${ty}px) scale(${rand(0.7, 1.25)})`;
        p.style.opacity = '0';
        spawnFireSmoke(x + rand(-10, 10), y + rand(-10, 10), 720);
      }, delay);

      setTimeout(() => {
        if (fireContainer.contains(p)) p.remove();
        untrackParticle(p);
      }, duration + 180);
    }
  }

  function spawnWillowBurst(x, y, hueBase) {
    const count = Math.floor(rand(8, 11));
    const duration = 3000 * TIME_SCALE;

    for (let i = 0; i < count; i++) {
      const p = createParticle(x, y, hueBase, duration + rand(0, 220));
      if (!p) return;

      p.classList.add('fire-trail');

      const angle = rand(0, Math.PI * 2);
      const dist = rand(MOBILE ? 22 : 36, MOBILE ? 40 : 72);
      const tx = Math.cos(angle) * dist * 1.4;
      const ty = Math.sin(angle) * dist * -0.8 + rand(18, 36);
      const delay = rand(0, 90);

      setTimeout(() => {
        if (!fireContainer.contains(p)) return;
        p.style.transform = `translate(${tx}px, ${ty}px) scale(${rand(0.5, 0.9)})`;
        p.style.opacity = '0.01';
        p.style.transitionDuration = `${duration}ms`;
        spawnFireSmoke(x + rand(-10, 10), y + rand(-10, 10), 760);
      }, delay);

      attachSmokeTrailToParticle(p);

      setTimeout(() => {
        if (fireContainer.contains(p)) p.remove();
        untrackParticle(p);
      }, duration + 260);
    }
  }

  function spawnGoldCascade(x, y) {
    const hueBase = 50;
    const count = Math.floor(rand(10, 16));
    const duration = 2800 * TIME_SCALE;

    for (let i = 0; i < count; i++) {
      const p = createParticle(x, y, hueBase, duration + rand(0, 200));
      if (!p) return;

      p.classList.add('cascade-trail');

      const angle = rand(Math.PI / 4, (3 * Math.PI) / 4);
      const dist = rand(30, 70);
      const tx = Math.cos(angle) * dist * 0.8;
      const ty = Math.sin(angle) * dist + rand(30, 80);
      const delay = rand(0, 140);

      setTimeout(() => {
        if (!fireContainer.contains(p)) return;
        p.style.transform = `translate(${tx}px, ${ty}px) scale(0.6)`;
        p.style.opacity = '0.05';
        p.style.transitionDuration = `${duration}ms`;
        spawnFireSmoke(x + rand(-10, 10), y + rand(-10, 10), 600);
      }, delay);

      attachSmokeTrailToParticle(p);

      setTimeout(() => {
        if (fireContainer.contains(p)) p.remove();
        untrackParticle(p);
      }, duration + 260);
    }
  }

  function spawnSpiderBurst(x, y) {
    const hueBase = getThemeHue();
    const count = Math.floor(rand(7, 10));
    const duration = 2900 * TIME_SCALE;

    for (let i = 0; i < count; i++) {
      const p = createParticle(x, y, hueBase, duration + rand(0, 260));
      if (!p) return;

      p.classList.add('spider-trail');

      const angle = rand(0, Math.PI * 2);
      const dist = rand(MOBILE ? 80 : 150, MOBILE ? 120 : 240);
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist * -1;
      const delay = rand(0, 150);

      setTimeout(() => {
        if (!fireContainer.contains(p)) return;
        p.style.transform = `translate(${tx}px, ${ty}px) scale(0.6)`;
        p.style.opacity = '0.01';
        p.style.transitionDuration = `${duration}ms`;
        spawnFireSmoke(x + rand(-10, 10), y + rand(-10, 10), 760);
      }, delay);

      attachSmokeTrailToParticle(p);

      setTimeout(() => {
        if (fireContainer.contains(p)) p.remove();
        untrackParticle(p);
      }, duration + 360);
    }
  }

  function spawnRingBurst(x, y) {
    const hueBase = getThemeHue();
    const count = Math.floor(rand(20, 30));
    const duration = 3800 * TIME_SCALE;
    const ringRadius = MOBILE ? 60 : 100;

    for (let i = 0; i < count; i++) {
      const p = createParticle(x, y, hueBase, duration);
      if (!p) return;

      p.classList.add('ring-particle');
      p.style.transition = `transform ${duration}ms cubic-bezier(0.1, 0.8, 0.2, 1), opacity ${duration}ms ease-out`;

      const angle = (i / count) * Math.PI * 2;
      const dist = ringRadius + rand(-5, 5);
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist * -1;
      const delay = rand(0, 80);

      setTimeout(() => {
        if (!fireContainer.contains(p)) return;
        p.style.transform = `translate(${tx}px, ${ty}px) scale(${rand(0.7, 1.1)})`;
        p.style.opacity = '0';
        spawnFireSmoke(x + rand(-10, 10), y + rand(-10, 10), duration * 0.6);
      }, delay);

      setTimeout(() => {
        if (fireContainer.contains(p)) p.remove();
        untrackParticle(p);
      }, duration + 260);
    }
  }

  function spawnFirework(x, y) {
    const r = Math.random();
    if (r < 0.25) spawnShell(x, y);
    else if (r < 0.45) spawnSmallBurst(x, y, getThemeHue());
    else if (r < 0.65) spawnWillowBurst(x, y, getThemeHue());
    else if (r < 0.8) spawnGoldCascade(x, y);
    else if (r < 0.9) spawnSpiderBurst(x, y);
    else spawnRingBurst(x, y);
  }

  // ---------- SPARKS (apenas brilhos, sem fogos pesados no input) ----------

  let lastSparkTime = 0;

  function spawnSpark(x, y) {
    const now = Date.now();
    if (now - lastSparkTime < SPARK_THROTTLE_MS) return;
    lastSparkTime = now;

    const s = document.createElement('div');
    s.className = 'bonus-spark';
    s.style.position = 'fixed';
    s.style.left = x - 3 + 'px';
    s.style.top = y - 3 + 'px';
    s.style.zIndex = '99999';
    s.style.pointerEvents = 'none';
    s.style.setProperty('--x', `${rand(-18, 18).toFixed(1)}px`);
    s.style.setProperty('--y', `${rand(-12, -28).toFixed(1)}px`);

    fireContainer.appendChild(s);
    activeSparks.add(s);

    setTimeout(() => {
      if (fireContainer.contains(s)) s.remove();
      activeSparks.delete(s);
    }, 900);
  }

  function onMouseSpark(e) {
    if (!bonusCheckbox.checked) return;
    spawnSpark(e.clientX, e.clientY);
    // Sem spawnFirework aqui -> evita explosão pesada em todo movimento
  }

  function onTouchSpark(e) {
    if (!bonusCheckbox.checked) return;
    for (const t of e.touches) {
      spawnSpark(t.clientX, t.clientY);
    }
    // Sem spawnFirework aqui também
  }

  // ---------- CONTROLE PRINCIPAL ----------

  function startEffects() {
    glowTargets.forEach((el) => el.classList.add('bonus-inner-glow'));

    if (!fireIntervalId) {
      fireIntervalId = setInterval(() => {
        if (activeParticles.size >= MAX_PARTICLES) return;
        const x = rand(window.innerWidth * 0.12, window.innerWidth * 0.88);
        const y = rand(window.innerHeight * 0.18, window.innerHeight * 0.6);
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

    activeParticles.forEach((p) => p.remove());
    activeParticles.clear();

    activeSparks.forEach((s) => s.remove());
    activeSparks.clear();

    activeSmoke.forEach((sm) => sm.remove());
    activeSmoke.clear();

    smokeTrailIntervals.forEach((iv) => clearInterval(iv));
    smokeTrailIntervals.clear();

    document.removeEventListener('mousemove', onMouseSpark);
    document.removeEventListener('touchstart', onTouchSpark);
    document.removeEventListener('touchmove', onTouchSpark);
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
