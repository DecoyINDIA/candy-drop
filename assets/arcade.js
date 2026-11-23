/* One small runtime for the entire arcade. No framework, network or build step. */
(function () {
  'use strict';
  const Core = window.ArcadeCore;
  const save = Core.browserStorage();
  const $ = id => document.getElementById(id);
  const fmt = n => Math.round(n).toLocaleString();
  const icon = (name) => ({ pause: 'Ⅱ', play: '▶', sound: '♪', muted: '♩', expand: '⛶' }[name] || name);
  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  window.Arcade = {
    mount(config) {
      const canvas = $('game');
      const ctx = canvas.getContext('2d');
      if (!ctx) { $('game-status').textContent = 'This browser does not support canvas. Please try an up-to-date browser.'; return; }
      const w = 960, h = 600;
      const focusView = Core.CATALOG.find(g => g.id === config.id)?.focus;
      const focusButton = $('focus-button');
      let zoomed = false;
      const view = () => zoomed ? focusView : [0, 0, w, h];
      function applyView() {
        const [x, y, width, height] = view();
        ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, -x * canvas.width / width, -y * canvas.height / height);
      }
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let state = 'menu', mode = new URLSearchParams(location.search).get('mode') === 'daily' ? 'daily' : 'classic';
      let game, api, points = 0, elapsed = 0, hudStamp = '', lastTime = 0, day = Core.dayKey(), pendingHud = null, lastHudTime = -1;
      let effects = [], shake = 0, toastRemaining = 0, soundOn = save.read().sound, audio = null;
      let lastDraw = 0, ending = null, beforePause = null, runNumber = 0;
      const actions = new Map(), mapping = new Map();
      const pointer = { x: w / 2, y: h / 2, down: false, pressed: false, released: false, inside: false, active: false };
      for (const control of config.controls) {
        actions.set(control.id, { sources: new Set(), pressed: false });
        for (const key of control.keys || []) mapping.set(key, control.id);
      }
      const input = {
        down(id) { return !!actions.get(id)?.sources.size; },
        pressed(id) { return !!actions.get(id)?.pressed; }, pointer
      };
      function action(id, source, down) {
        const item = actions.get(id);
        if (!item) return;
        if (down) { if (!item.sources.size) item.pressed = true; item.sources.add(source); }
        else item.sources.delete(source);
        document.querySelector('[data-control="' + id + '"]')?.classList.toggle('held', !!item.sources.size);
      }
      function resetInput() {
        game?.cancelInput?.();
        for (const item of actions.values()) { item.sources.clear(); item.pressed = false; }
        pointer.down = pointer.pressed = pointer.released = false;
        for (const button of document.querySelectorAll('.control-button')) button.classList.remove('held');
      }
      function clearEdges() { for (const item of actions.values()) item.pressed = false; pointer.pressed = pointer.released = false; }
      function initAudio() {
        if (!soundOn) return;
        try {
          if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
          if (audio.state === 'suspended') audio.resume().catch(() => {});
        } catch (_) { audio = null; }
      }
      function sound(kind, pitch = 1) {
        if (!soundOn || !audio || audio.state !== 'running') return;
        const notes = { hit: [170, 65, .10, 'triangle'], good: [540, 900, .14, 'sine'], bad: [150, 45, .22, 'sawtooth'], win: [523, 1046, .35, 'triangle'], click: [390, 520, .07, 'sine'], shoot: [680, 120, .065, 'triangle'] };
        const [from, to, duration, type] = notes[kind] || notes.click;
        try {
          const node = audio.createOscillator(), gain = audio.createGain(), t = audio.currentTime;
          node.type = type;
          node.frequency.setValueAtTime(Math.max(20, from * pitch), t);
          node.frequency.exponentialRampToValueAtTime(Math.max(20, to * pitch), t + duration);
          gain.gain.setValueAtTime(kind === 'shoot' ? .025 : .065, t);
          gain.gain.exponentialRampToValueAtTime(.001, t + duration);
          node.connect(gain); gain.connect(audio.destination); node.start(t); node.stop(t + duration);
          node.onended = () => { node.disconnect(); gain.disconnect(); };
        } catch (_) { /* Sound is optional on browsers with restricted audio. */ }
      }
      function resize() {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight);
        canvas.width = Math.round(width * pixelRatio); canvas.height = Math.round(height * pixelRatio);
        applyView();
      }
      new ResizeObserver(resize).observe(canvas);
      function paintHud(items) {
        const stamp = JSON.stringify(items);
        if (stamp === hudStamp) return;
        hudStamp = stamp;
        const row = $('game-hud'); row.replaceChildren();
        for (const item of items.slice(0, 5)) {
          const box = el('div', 'hud-item'); box.append(el('span', 'eyebrow', item.label), el('strong', '', item.value)); row.append(box);
        }
      }
      function hud(items) {
        pendingHud = items;
        if (state !== 'playing' || elapsed - lastHudTime >= .1 || lastHudTime < 0) {
          paintHud(items); lastHudTime = elapsed; pendingHud = null;
        }
      }
      function best() {
        const entry = save.read().games[config.id];
        return mode === 'daily' ? (entry?.daily?.day === day ? entry.daily.best : 0) : entry?.best || 0;
      }
      function refreshBest() { $('best-value').textContent = fmt(best()); $('mode-label').textContent = mode === 'daily' ? 'DAILY · ' + day : 'CLASSIC'; }
      function makeGame() {
        points = 0; elapsed = 0; effects = []; shake = 0; hudStamp = ''; ending = null; pendingHud = null; lastHudTime = -1;
        $('score-value').textContent = '0';
        const random = Core.random(mode === 'daily' ? config.id + ':' + day : config.id + ':' + Date.now() + ':' + (++runNumber));
        api = {
          w, h, input, random, mode, reducedMotion,
          get time() { return elapsed; },
          score(value) { const next = Core.score(value); if (points !== next) { points = next; $('score-value').textContent = fmt(points); } },
          hud, sound,
          toast(message) { $('toast').textContent = message; $('toast').classList.add('visible'); toastRemaining = 2.2; },
          shake(value = 5) { if (!reducedMotion) shake = Math.min(16, Math.max(shake, value)); },
          burst(x, y, color, count = 12) {
            if (reducedMotion) return;
            for (let i = 0; i < Math.min(count, 36) && effects.length < 180; i++) {
              const angle = Math.random() * Math.PI * 2, velocity = 45 + Math.random() * 150;
              effects.push({ x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity, life: .4 + Math.random() * .3, color });
            }
          },
          end(result = {}) {
            if (state !== 'playing' || ending) return;
            points = Core.score(result.score === undefined ? points : result.score);
            ending = result; state = 'ended'; resetInput();
            if (pendingHud) { paintHud(pendingHud); pendingHud = null; }
            const previous = best();
            save.finish(config.id, points, config.medals, mode, day);
            refreshBest(); $('score-value').textContent = fmt(points);
            showResult(result, previous);
          }
        };
        game = config.create(api);
        refreshBest();
      }
      function start(nextMode = mode) {
        mode = nextMode === 'daily' ? 'daily' : 'classic'; day = Core.dayKey();
        resetInput(); initAudio(); state = 'playing';
        makeGame(); save.begin(config.id);
        $('overlay').hidden = true; $('overlay').parentElement.classList.remove('has-overlay'); $('pause-button').disabled = false;
        $('pause-button').setAttribute('aria-label', 'Pause game'); $('pause-button').textContent = icon('pause');
        $('game-status').textContent = config.title + ' started. ' + (mode === 'daily' ? 'Daily challenge.' : 'Classic mode.');
        $('toast').classList.remove('visible'); toastRemaining = 0;
        canvas.focus({ preventScroll: true }); lastTime = performance.now();
      }
      function button(text, cls, fn) { const node = el('button', cls, text); node.type = 'button'; node.addEventListener('click', fn); return node; }
      function basePanel(kicker, title, message) {
        const panel = $('overlay-panel'); panel.replaceChildren();
        panel.append(el('span', 'eyebrow panel-kicker', kicker), el('h2', '', title), el('p', 'panel-description', message));
        $('overlay').hidden = false;
        $('overlay').parentElement.classList.add('has-overlay');
        return panel;
      }
      function modeNote(panel) { panel.append(el('p', 'panel-note', 'Daily uses the same opening seed for everyone. Daily scores are saved separately. Resets at 00:00 UTC.')); }
      function showMenu() {
        state = 'menu'; resetInput(); makeGame();
        const panel = basePanel(config.category + ' / ' + (Core.CATALOG.find(g => g.id === config.id)?.duration || 'Quick play'), config.title, config.description);
        const list = el('ol', 'quick-rules');
        for (const rule of config.howTo) list.append(el('li', '', rule));
        panel.append(list);
        const actionsRow = el('div', 'panel-actions');
        actionsRow.append(button(mode === 'daily' ? 'Play daily challenge  →' : 'Let’s play  →', 'button primary', () => start(mode)), button(mode === 'daily' ? 'Classic mode' : 'Daily challenge', 'button secondary', () => start(mode === 'daily' ? 'classic' : 'daily')));
        panel.append(actionsRow); modeNote(panel); $('pause-button').disabled = true;
      }
      function pause() {
        if (state !== 'playing') return;
        state = 'paused'; resetInput(); beforePause = document.activeElement;
        const panel = basePanel('TAKE YOUR TIME', 'Game paused', 'Your run is right where you left it.');
        const row = el('div', 'panel-actions');
        row.append(button('Keep playing  →', 'button primary', resume), button('Restart run', 'button secondary', () => start(mode)));
        panel.append(row);
        const link = el('a', 'quiet-link', 'Back to the arcade'); link.href = '../../arcade.html'; panel.append(link);
        $('pause-button').textContent = icon('play'); $('pause-button').setAttribute('aria-label', 'Resume game');
        $('game-status').textContent = 'Game paused'; row.firstChild.focus({ preventScroll: true });
      }
      function resume() {
        if (state !== 'paused') return;
        resetInput(); state = 'playing'; $('overlay').hidden = true; $('overlay').parentElement.classList.remove('has-overlay');
        $('pause-button').textContent = icon('pause'); $('pause-button').setAttribute('aria-label', 'Pause game');
        canvas.focus({ preventScroll: true }); lastTime = performance.now(); initAudio();
        $('game-status').textContent = 'Game resumed';
      }
      function showResult(result, previous) {
        const rank = Core.medal(points, config.medals), names = ['Keep exploring', 'Bronze medal', 'Silver medal', 'Gold medal'];
        const panel = basePanel(mode === 'daily' ? 'DAILY CHALLENGE COMPLETE' : 'RUN COMPLETE', result.title || 'Nicely played.', result.message || 'There’s another great run in you.');
        const total = el('div', 'result-total'); total.append(el('strong', '', fmt(points)), el('span', '', 'POINTS')); panel.append(total);
        const medalRow = el('div', 'medal-row');
        for (let i = 1; i <= 3; i++) { const m = el('span', 'medal ' + (rank >= i ? 'earned' : ''), '✦'); m.setAttribute('aria-hidden', 'true'); medalRow.append(m); }
        medalRow.append(el('strong', '', names[rank])); panel.append(medalRow);
        if (points > previous && points > 0) panel.append(el('p', 'new-best', 'A new personal best. Nice one!'));
        else if (rank < 3) panel.append(el('p', 'panel-note', fmt(config.medals[rank] - points) + ' more points to your next medal.'));
        if (result.stats?.length) {
          const row = el('div', 'result-stats');
          for (const item of result.stats.slice(0, 4)) { const s = el('div', ''); s.append(el('span', 'eyebrow', item.label), el('strong', '', item.value)); row.append(s); }
          panel.append(row);
        }
        const row = el('div', 'panel-actions'); row.append(button('Play again  ↻', 'button primary', () => start(mode)));
        const current = Core.CATALOG.find(g => g.id === config.id), records = save.read().games;
        const pool = Core.CATALOG.filter(g => g.id !== config.id && g.id !== 'candy-drop');
        pool.sort((a, b) => Number(!!records[a.id]?.plays) - Number(!!records[b.id]?.plays) || Number(b.group === current?.group) - Number(a.group === current?.group));
        const next = pool[0] || Core.CATALOG[0]; const link = el('a', 'button secondary', 'Try ' + next.title + ' →'); link.href = Core.href(next, '../../'); row.append(link); panel.append(row);
        const share = button('Copy my score', 'quiet-link', async () => {
          const text = config.title + ': ' + fmt(points) + ' points' + (mode === 'daily' ? ' in the ' + day + ' daily challenge' : '') + '. Can you beat it? ' + location.href.replace(/[?#].*$/, '') + (mode === 'daily' ? '?mode=daily' : '');
          try { await navigator.clipboard.writeText(text); share.textContent = 'Copied!'; }
          catch (_) { const output = el('textarea', 'share-fallback'); output.value = text; output.readOnly = true; output.setAttribute('aria-label', 'Score text to copy'); panel.append(output); output.select(); share.textContent = 'Select and copy the text below'; }
        });
        panel.append(share); $('pause-button').disabled = true;
        $('game-status').textContent = (result.title || 'Run complete') + '. ' + points + ' points. ' + names[rank] + '.';
        row.firstChild.focus({ preventScroll: true });
      }
      function tick(dt) {
        if (state !== 'playing') return;
        elapsed += dt; game.update(dt); clearEdges();
        for (const particle of effects) { particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.vy += 120 * dt; particle.life -= dt; }
        effects = effects.filter(p => p.life > 0); shake = Math.max(0, shake - dt * 30);
        if (toastRemaining > 0) { toastRemaining -= dt; if (toastRemaining <= 0) $('toast').classList.remove('visible'); }
      }
      function draw() {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height); applyView(); ctx.save();
        if (shake > 0) ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
        game.draw(ctx); ctx.restore();
        for (const particle of effects) { ctx.globalAlpha = Math.min(1, particle.life * 2); ctx.fillStyle = particle.color; ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4); }
        ctx.globalAlpha = 1;
      }
      function frame(now) {
        const dt = Math.min(1 / 30, Math.max(0, (now - lastTime) / 1000)); lastTime = now;
        tick(dt);
        if (state === 'playing' || now - lastDraw > 100) { draw(); lastDraw = now; }
        requestAnimationFrame(frame);
      }
      function point(event) {
        const rect = canvas.getBoundingClientRect();
        const [x, y, width, height] = view();
        pointer.x = x + Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * width;
        pointer.y = y + Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) * height;
        pointer.inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
        pointer.active = true;
      }
      canvas.addEventListener('pointerdown', event => { if (state !== 'playing') return; event.preventDefault(); point(event); pointer.down = pointer.pressed = true; canvas.setPointerCapture(event.pointerId); canvas.focus({ preventScroll: true }); initAudio(); });
      canvas.addEventListener('pointermove', event => point(event));
      canvas.addEventListener('pointerup', event => { point(event); if (pointer.down) pointer.released = true; pointer.down = false; });
      canvas.addEventListener('pointercancel', () => { pointer.down = pointer.pressed = pointer.released = false; game?.cancelInput?.(); });
      canvas.addEventListener('pointerleave', () => { pointer.inside = false; });
      canvas.addEventListener('contextmenu', event => event.preventDefault());
      const controls = $('controls');
      for (const control of config.controls) {
        const node = button(control.label, 'control-button', () => {}); node.dataset.control = control.id;
        const keys = (control.keys || []).map(key => key.replace('Arrow', '').replace('Key', '').replace('Digit', '').replace('Space', 'Space')).join(' / ');
        node.setAttribute('aria-label', control.label + (keys ? ' (' + keys + ')' : '')); node.title = keys;
        node.addEventListener('pointerdown', event => { if (state !== 'playing') return; event.preventDefault(); initAudio(); node.setPointerCapture(event.pointerId); action(control.id, 'pointer:' + event.pointerId, true); });
        for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) node.addEventListener(eventName, event => action(control.id, 'pointer:' + event.pointerId, false));
        node.addEventListener('keydown', event => { if ((event.code === 'Space' || event.code === 'Enter') && state === 'playing') { event.preventDefault(); action(control.id, 'button-key', true); } });
        node.addEventListener('keyup', event => { if (event.code === 'Space' || event.code === 'Enter') action(control.id, 'button-key', false); });
        node.addEventListener('blur', () => action(control.id, 'button-key', false));
        controls.append(node);
      }
      window.addEventListener('keydown', event => {
        if (event.ctrlKey || event.metaKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
        if (event.target.dataset.control && (event.code === 'Space' || event.code === 'Enter')) return;
        if ((event.code === 'Space' || event.code === 'Enter') && event.target.closest('button,a,summary')) return;
        if (event.code === 'Escape' || event.code === 'KeyP') { event.preventDefault(); if (!event.repeat) state === 'playing' ? pause() : resume(); return; }
        if (state === 'playing' && mapping.has(event.code)) { event.preventDefault(); action(mapping.get(event.code), event.code, true); }
        else if (event.code === 'Enter' && (state === 'menu' || state === 'ended') && !event.target.closest('button,a')) { event.preventDefault(); start(); }
      });
      window.addEventListener('keyup', event => { if (mapping.has(event.code)) action(mapping.get(event.code), event.code, false); });
      window.addEventListener('blur', () => { resetInput(); pause(); });
      document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
      $('pause-button').addEventListener('click', () => state === 'playing' ? pause() : resume());
      function soundButton() { $('sound-button').textContent = icon(soundOn ? 'sound' : 'muted'); $('sound-button').setAttribute('aria-label', soundOn ? 'Mute sound' : 'Enable sound'); $('sound-button').setAttribute('aria-pressed', String(soundOn)); }
      $('sound-button').addEventListener('click', () => { soundOn = !soundOn; save.change(data => { data.sound = soundOn; }); initAudio(); soundButton(); }); soundButton();
      $('fullscreen-button').addEventListener('click', async () => {
        try { if (document.fullscreenElement) await document.exitFullscreen(); else await $('game-shell').requestFullscreen(); }
        catch (_) { api.toast('Fullscreen is unavailable. Try rotating your device for a wider view.'); }
      });
      function fitFullscreen() {
        if (document.fullscreenElement !== $('game-shell')) return;
        const chrome = [...$('game-shell').children].filter(node => !node.classList.contains('stage')).reduce((height, node) => height + node.getBoundingClientRect().height, 0);
        $('game-shell').style.setProperty('--game-chrome', Math.ceil(chrome) + 'px');
      }
      if (focusButton && Array.isArray(focusView) && focusView.length === 4) {
        focusButton.hidden = false;
        focusButton.addEventListener('click', () => {
          resetInput(); zoomed = !zoomed;
          const [, , width, height] = view();
          $('game-shell').style.setProperty('--view-ratio', String(width / height));
          focusButton.setAttribute('aria-pressed', String(zoomed));
          focusButton.setAttribute('aria-label', zoomed ? 'Show full scene' : 'Enlarge board');
          focusButton.title = zoomed ? 'Show full scene' : 'Enlarge board';
          focusButton.textContent = zoomed ? '−' : '+';
          fitFullscreen(); resize(); draw();
          $('game-status').textContent = zoomed ? 'Board enlarged. Game controls are unchanged.' : 'Full scene restored.';
        });
      }
      document.addEventListener('fullscreenchange', fitFullscreen);
      window.addEventListener('resize', fitFullscreen);
      $('help-button').addEventListener('click', () => { if (state === 'playing') pause(); $('instructions').open = true; $('instructions').scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'nearest' }); });
      const rules = $('rules'); for (const rule of config.howTo) rules.append(el('li', '', rule));
      const keyList = $('key-list');
      for (const control of config.controls) {
        const row = el('div', 'key-description'); row.append(el('span', '', control.label), el('kbd', '', (control.keys || []).map(k => k.replace('Arrow', '').replace('Key', '').replace('Digit', '')).join(' / '))); keyList.append(row);
      }
      $('medal-targets').textContent = 'Bronze ' + fmt(config.medals[0]) + ' · Silver ' + fmt(config.medals[1]) + ' · Gold ' + fmt(config.medals[2]) + ' points';
      document.documentElement.style.setProperty('--game-accent', config.accent);
      canvas.setAttribute('aria-label', config.title + ' game area. Instructions and controls are below.');
      showMenu(); resize(); lastTime = performance.now(); requestAnimationFrame(frame);
      if (new URLSearchParams(location.search).get('test') === '1') {
        window.__arcade = { start, pause, resume, state: () => ({ phase: state, mode, score: points, time: elapsed, best: best(), result: ending }), inspect: () => game.inspect ? game.inspect() : {}, step(seconds) { for (let t = 0; t < seconds && state === 'playing'; t += 1 / 60) tick(Math.min(1 / 60, seconds - t)); draw(); } };
      }
    }
  };
})();
