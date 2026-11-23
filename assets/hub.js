(function () {
  'use strict';
  const Core = window.ArcadeCore, save = Core.browserStorage(), PAGE_SIZE = 12;
  const $ = id => document.getElementById(id);
  const latest = Core.CATALOG.reduce((date, game) => game.added > date ? game.added : date, '');
  let filter = 'All', query = '', sort = 'discover', limit = PAGE_SIZE;
  function text(tag, className, content) { const e = document.createElement(tag); e.className = className; e.textContent = content; return e; }
  function render() {
    const data = save.read();
    const games = Core.CATALOG.filter(game =>
      (filter === 'All' || filter === 'New' && latest && game.added === latest || filter === 'Favorites' && data.favorites.includes(game.id) || game.group === filter) &&
      (game.title + ' ' + game.category + ' ' + game.group + ' ' + game.hook).toLowerCase().includes(query));
    games.sort((a, b) => {
      if (sort === 'az') return a.title.localeCompare(b.title);
      if (sort === 'played') return (data.games[b.id]?.plays || 0) - (data.games[a.id]?.plays || 0);
      if (sort === 'unplayed') return Number(!!data.games[a.id]?.plays) - Number(!!data.games[b.id]?.plays);
      return Number(b.added === latest) - Number(a.added === latest);
    });
    const visible = games.slice(0, limit), grid = $('game-grid'); grid.replaceChildren();
    for (const game of visible) {
      const record = data.games[game.id];
      const card = text('article', 'game-card', ''); card.style.setProperty('--card-accent', game.color);
      const link = text('a', 'card-link', ''); link.href = Core.href(game); link.setAttribute('aria-label', 'Play ' + game.title + ' — ' + game.category);
      const img = document.createElement('img'); img.className = 'card-art'; img.src = 'assets/art/' + game.id + '.svg'; img.alt = ''; img.loading = 'lazy'; img.width = 600; img.height = 380;
      link.append(img, text('span', 'card-index', game.added === latest ? 'NEW DISCOVERY' : game.category.toUpperCase()));
      const body = text('div', 'card-body', ''), top = text('div', 'card-topline', '');
      top.append(text('span', 'card-category', game.category), text('span', 'card-duration', game.duration));
      body.append(top, text('h3', '', game.title), text('p', 'card-hook', game.hook));
      const foot = text('div', 'card-footer', '');
      foot.append(text('span', 'card-best', record?.best ? 'BEST ' + record.best.toLocaleString() + (record.medals ? ' · ' + '✦'.repeat(record.medals) : '') : game.id === 'candy-drop' ? 'THE ORIGINAL' : 'YOUR NEXT DISCOVERY'), text('span', 'card-play', 'Play now ↗'));
      body.append(foot); link.append(body); card.append(link);
      const saved = data.favorites.includes(game.id), favorite = text('button', 'favorite-button', saved ? '♥' : '♡'); favorite.type = 'button'; favorite.setAttribute('aria-label', (saved ? 'Unsave ' : 'Save ') + game.title); favorite.setAttribute('aria-pressed', String(saved));
      favorite.addEventListener('click', () => {
        save.change(value => { value.favorites = value.favorites.includes(game.id) ? value.favorites.filter(id => id !== game.id) : [...value.favorites, game.id]; });
        if (filter === 'Favorites') render();
        else { const active = save.read().favorites.includes(game.id); favorite.textContent = active ? '♥' : '♡'; favorite.setAttribute('aria-pressed', String(active)); favorite.setAttribute('aria-label', (active ? 'Unsave ' : 'Save ') + game.title); }
      }); card.append(favorite); grid.append(card);
    }
    $('empty-state').hidden = !!games.length;
    $('game-count').textContent = games.length + (games.length === 1 ? ' game' : ' games');
    $('visible-count').textContent = games.length ? 'Showing ' + visible.length + ' of ' + games.length + ' games' : '';
    $('load-more').hidden = visible.length >= games.length;
    $('filter-status').textContent = games.length + ' games found, ' + visible.length + ' shown';
    $('hero-game-total').textContent = Core.CATALOG.length;
    const entries = Object.values(data.games);
    $('stat-explored').textContent = entries.filter(e => e.plays > 0).length + '/' + Core.CATALOG.length;
    $('stat-runs').textContent = entries.reduce((sum, e) => sum + e.plays, 0).toLocaleString();
    $('stat-medals').textContent = entries.reduce((sum, e) => sum + e.medals, 0);
    const familiar = Core.CATALOG.filter(g => data.games[g.id]?.plays).sort((a, b) => Number(b.id === data.last) - Number(a.id === data.last) || data.games[b.id].plays - data.games[a.id].plays).slice(0, 3);
    $('return-section').hidden = !familiar.length; $('return-links').replaceChildren();
    for (const game of familiar) { const link = text('a', 'return-link', game.title + ' ↗'); link.href = Core.href(game); link.style.setProperty('--card-accent', game.color); $('return-links').append(link); }
    if (!save.available()) $('storage-note').textContent = 'Browser storage is unavailable. You can still play; progress lasts for this page only.';
  }
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter; limit = PAGE_SIZE;
    document.querySelectorAll('[data-filter]').forEach(node => { node.classList.toggle('active', node === button); node.setAttribute('aria-pressed', String(node === button)); }); render();
  }));
  $('game-search').addEventListener('input', event => { query = event.target.value.trim().toLowerCase(); limit = PAGE_SIZE; render(); });
  $('game-sort').addEventListener('change', event => { sort = event.target.value; limit = PAGE_SIZE; render(); });
  $('load-more').addEventListener('click', () => { const count = $('game-grid').children.length; limit += PAGE_SIZE; render(); $('game-grid').children[count]?.querySelector('a').focus({ preventScroll: true }); });
  $('surprise-button').addEventListener('click', () => { const data = save.read(), unplayed = Core.CATALOG.filter(g => !data.games[g.id]?.plays), pool = unplayed.length ? unplayed : Core.CATALOG.filter(g => g.id !== data.last); location.href = Core.href(pool[Math.floor(Math.random() * pool.length)]); });
  function refreshDaily() { const day = Core.dayKey(), daily = Core.dailyGame(day); $('daily-title').textContent = 'Today’s pick: ' + daily.title; $('daily-description').textContent = 'A shared starting seed. A fresh personal best to chase.'; $('daily-date').textContent = new Date(day + 'T12:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }) + ' · UTC'; $('daily-link').href = Core.href(daily) + '?mode=daily'; }
  window.addEventListener('pageshow', () => { render(); refreshDaily(); }); window.addEventListener('storage', render);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshDaily(); });
  render(); refreshDaily();
})();
