// src/pages/home/fx/homeFx.js
// موتور «جادوی اسکرول» صفحهٔ خانه — بدون هیچ وابستگی خارجی.
// همهٔ افکت‌ها طوری نوشته شده‌اند که در jsdom (بدون canvas/layout) نشکنند.

export function createHomeFx(root, { motionEnabled = () => true } = {}) {
  const cleanups = [];
  const add = (fn) => cleanups.push(fn);

  /* ---------- نوار پیشرفت اسکرول ---------- */
  function initProgressBar() {
    const bar = root.querySelector('[data-fx-progress]');
    if (!bar) return;
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.transform = `scaleX(${p / 100})`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    add(() => window.removeEventListener('scroll', onScroll));
    onScroll();
  }

  /* ---------- ذرات ستاره‌ای (canvas) ---------- */
  function initStarfield() {
    const canvas = root.querySelector('[data-fx-stars]');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0; let h = 0; let raf = 0;
    const stars = [];
    const COUNT = 60;

    const resize = () => {
      w = canvas.width = canvas.offsetWidth || 0;
      h = canvas.height = canvas.offsetHeight || 0;
    };

    const seed = () => {
      stars.length = 0;
      for (let i = 0; i < COUNT; i++) {
        stars.push({
          x: Math.random() * w, y: Math.random() * h,
          r: Math.random() * 1.8 + 0.4,
          s: Math.random() * 0.5 + 0.1,
          tw: Math.random() * Math.PI * 2,
        });
      }
    };

    let mouseX = -999; let mouseY = -999;
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left; mouseY = e.clientY - rect.top;
    };

    const tick = (t) => {
      if (!motionEnabled()) { raf = requestAnimationFrame(tick); return; }
      ctx.clearRect(0, 0, w, h);
      for (const st of stars) {
        st.y += st.s; st.tw += 0.02;
        if (st.y > h) { st.y = -4; st.x = Math.random() * w; }
        // جاذبهٔ ملایم ماوس
        const dx = mouseX - st.x; const dy = mouseY - st.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 120 && dist > 0.01) { st.x += (dx / dist) * 0.4; st.y += (dy / dist) * 0.4; }
        const alpha = 0.4 + Math.abs(Math.sin(st.tw)) * 0.6;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(140,160,255,${alpha})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    resize(); seed();
    window.addEventListener('resize', () => { resize(); seed(); });
    canvas.parentElement?.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(tick);
    add(() => { cancelAnimationFrame(raf); canvas.parentElement?.removeEventListener('mousemove', onMove); });
  }

  /* ---------- ظهور با اسکرول (reveal) ---------- */
  function initReveal() {
    const els = root.querySelectorAll('[data-fx-reveal]');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      }
    }, { threshold: 0.15 });
    els.forEach((el) => io.observe(el));
    add(() => io.disconnect());
  }

  /* ---------- شمارندهٔ اعداد ---------- */
  function initCounters() {
    const els = root.querySelectorAll('[data-fx-count]');
    if (!els.length) return;
    const animate = (el) => {
      const target = parseFloat(el.getAttribute('data-fx-count')) || 0;
      const suffix = el.getAttribute('data-fx-suffix') || '';
      const dur = 1400; const start = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString('fa-IR') + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) { els.forEach(animate); return; }
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) { animate(en.target); io.unobserve(en.target); }
    }, { threshold: 0.4 });
    els.forEach((el) => io.observe(el));
    add(() => io.disconnect());
  }

  /* ---------- متن scramble/decode ---------- */
  function initScramble() {
    const els = root.querySelectorAll('[data-fx-scramble]');
    if (!els.length) return;
    const CHARS = '!<>-_\\/[]{}—=+*^?#________';
    const decode = (el) => {
      const finalText = el.getAttribute('data-text') || el.textContent;
      let frame = 0;
      const total = finalText.length * 3 + 20;
      const step = () => {
        let out = '';
        for (let i = 0; i < finalText.length; i++) {
          const reveal = frame / 3;
          if (i < reveal) out += finalText[i];
          else out += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
        el.textContent = out;
        frame++;
        if (frame <= total) requestAnimationFrame(step);
        else el.textContent = finalText;
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) { els.forEach(decode); return; }
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) { decode(en.target); io.unobserve(en.target); }
    }, { threshold: 0.5 });
    els.forEach((el) => io.observe(el));
    add(() => io.disconnect());
  }

  /* ---------- parallax ملایم ---------- */
  function initParallax() {
    const els = root.querySelectorAll('[data-fx-parallax]');
    if (!els.length) return;
    const onScroll = () => {
      if (!motionEnabled()) return;
      const y = window.scrollY;
      els.forEach((el) => {
        const speed = parseFloat(el.getAttribute('data-fx-parallax')) || 0.2;
        el.style.transform = `translateY(${y * speed}px)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    add(() => window.removeEventListener('scroll', onScroll));
  }

  /* ---------- نور دنبال‌کنندهٔ ماوس ---------- */
  function initCursorGlow() {
    const glow = root.querySelector('[data-fx-glow]');
    if (!glow) return;
    const onMove = (e) => {
      glow.style.transform = `translate(${e.clientX - 250}px, ${e.clientY - 250}px)`;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    add(() => window.removeEventListener('mousemove', onMove));
  }

  /* ---------- دکمه‌های مغناطیسی ---------- */
  function initMagnetic() {
    const els = root.querySelectorAll('[data-fx-magnetic]');
    if (!els.length) return;
    const handlers = [];
    els.forEach((el) => {
      const move = (e) => {
        if (!motionEnabled()) return;
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
      };
      const leave = () => { el.style.transform = ''; };
      el.addEventListener('mousemove', move);
      el.addEventListener('mouseleave', leave);
      handlers.push([el, move, leave]);
    });
    add(() => handlers.forEach(([el, m, l]) => { el.removeEventListener('mousemove', m); el.removeEventListener('mouseleave', l); }));
  }

  /* ---------- کارت‌های tilt ---------- */
  function initTilt() {
    const els = root.querySelectorAll('[data-fx-tilt]');
    if (!els.length) return;
    const handlers = [];
    els.forEach((el) => {
      const move = (e) => {
        if (!motionEnabled()) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(800px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translateY(-4px)`;
        el.style.setProperty('--gx', `${(px + 0.5) * 100}%`);
        el.style.setProperty('--gy', `${(py + 0.5) * 100}%`);
      };
      const leave = () => { el.style.transform = ''; };
      el.addEventListener('mousemove', move);
      el.addEventListener('mouseleave', leave);
      handlers.push([el, move, leave]);
    });
    add(() => handlers.forEach(([el, m, l]) => { el.removeEventListener('mousemove', m); el.removeEventListener('mouseleave', l); }));
  }

  function initAll() {
    initProgressBar();
    initStarfield();
    initReveal();
    initCounters();
    initScramble();
    initParallax();
    initCursorGlow();
    initMagnetic();
    initTilt();
  }

  function destroy() {
    cleanups.forEach((fn) => fn());
    cleanups.length = 0;
  }

  return { initAll, destroy };
}

/* ---------- کد کنامی (ایسترآگ) ---------- */
export function createKonami(onUnlock) {
  const SEQ = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let idx = 0;
  const onKey = (e) => {
    idx = e.key === SEQ[idx] ? idx + 1 : 0;
    if (idx === SEQ.length) { idx = 0; onUnlock(); }
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}
