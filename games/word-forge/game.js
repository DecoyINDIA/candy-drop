/* Word Forge — a curated, entirely local anagram workshop. */
(() => {
  'use strict';
  const PACKS = [
    { letters: 'PLANET', name: 'FIELD NOTES', words: ['PLANET', 'PLANE', 'PLANT', 'PANEL', 'PETAL', 'PLATE', 'PLEAT', 'LEAP', 'TALE', 'LATE', 'NEAT', 'TAPE'] },
    { letters: 'STREAM', name: 'THE WORKSHOP', words: ['STREAM', 'MASTER', 'TAMERS', 'SMART', 'STEAM', 'TEAMS', 'MATES', 'TAMER', 'RATES', 'STARE', 'MEAT', 'TEAM'] },
    { letters: 'GARDEN', name: 'FRESH GROWTH', words: ['GARDEN', 'DANGER', 'RANGED', 'ANGER', 'RANGE', 'GRAND', 'GRADE', 'DEAR', 'DARE', 'READ', 'GEAR', 'DRAG'] },
    { letters: 'SILENT', name: 'AFTER HOURS', words: ['SILENT', 'LISTEN', 'TINSEL', 'INLETS', 'ENLIST', 'LINES', 'TILES', 'INLET', 'ISLET', 'LENT', 'LINE', 'LENS'] }
  ];
  const X = 218, Y = 337, S = 76;
  Arcade.mount({
    id: 'word-forge', title: 'Word Forge', category: 'Anagrams', accent: '#f1c98c',
    description: 'Six letters. A small workshop of possibilities.',
    howTo: ['Make any six of the twelve words on the word wall to complete a rack. Finish three racks, or bank your collection with B.', 'Tap letter tiles, or use number keys 1–6, to build a word. Enter or Space submits it; Backspace returns the last tile. Each tile can be used once per word.', 'R rearranges the rack. H reveals a letter of an unfound word for 40 points. Accepted words come from the twelve-word local set; the wall shows every word length.'],
    controls: Array.from({ length: 6 }, (_, i) => ({ id: 'tile' + i, label: 'Tile ' + (i + 1), keys: ['Digit' + (i + 1), 'Numpad' + (i + 1)] })).concat([{ id: 'submit', label: 'Forge word', keys: ['Enter', 'Space'] }, { id: 'erase', label: 'Backspace', keys: ['Backspace', 'Delete'] }, { id: 'shuffle', label: 'Rearrange', keys: ['KeyR'] }, { id: 'hint', label: 'Hint', keys: ['KeyH'] }, { id: 'bank', label: 'Bank', keys: ['KeyB'] }]),
    medals: [1000, 3000, 5500],
    create(api) {
      const order = [0, 1, 2, 3];
      function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(api.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } }
      shuffle(order);
      let rack = [], found = [], chosen = [], reveals = {}, round = 1, cleared = 0, totalWords = 0, hints = 0, mistakes = 0, roundMistakes = 0, roundHints = 0, earned = 0, score = 0, transition = 0, ended = false, notice = 'Every little word counts.', noticeTime = 0;
      const pack = () => PACKS[order[round - 1]];
      const draft = () => chosen.map(i => rack[i]).join('');
      function load() { rack = pack().letters.split(''); shuffle(rack); found = []; chosen = []; reveals = {}; roundMistakes = roundHints = 0; notice = 'Find any six words on the wall.'; noticeTime = 0; transition = 0; }
      function finish(all) { ended = true; api.end({ score, title: all ? 'A lovely way with words.' : 'A collection worth keeping.', message: all ? 'Three racks transformed into eighteen discoveries. Familiar letters can still surprise you.' : 'Your found words are banked. A fresh rack is always another little possibility.', stats: [{ label: 'Words forged', value: totalWords }, { label: 'Racks cleared', value: cleared + ' / 3' }, { label: 'Hints', value: hints }] }); }
      function pick(i) { if (transition > 0 || chosen.includes(i) || chosen.length >= 6) return; chosen.push(i); api.sound('click', 1 + chosen.length * .04); }
      function submit() {
        if (transition > 0 || !chosen.length) return;
        const word = draft();
        if (!pack().words.includes(word)) { mistakes++; roundMistakes++; notice = 'Try a word with a length on the wall.'; noticeTime = 2; api.sound('bad'); return; }
        if (found.includes(word)) { notice = 'That word is already in your collection.'; noticeTime = 2; chosen = []; return; }
        found.push(word); totalWords++; chosen = []; earned += word.length * 50 + (word.length === 6 ? 100 : 0); score = Math.max(0, earned - hints * 40); api.score(score); api.sound('good', 1 + found.length * .07); notice = word + ' · a good little discovery'; noticeTime = 2;
        if (found.length === 6) { cleared++; earned += Math.max(0, 250 - roundMistakes * 15 - roundHints * 15); score = Math.max(0, earned - hints * 40); api.score(score); api.sound('win'); transition = 1; }
      }
      function hint() { const word = pack().words.find(w => !found.includes(w) && (reveals[w] || 0) < w.length); if (!word) return; reveals[word] = (reveals[word] || 0) + 1; hints++; roundHints++; score = Math.max(0, earned - hints * 40); api.score(score); notice = 'A letter is waiting on the word wall.'; noticeTime = 2; }
      function hud() { api.hud([{ label: 'Rack', value: round + ' / 3' }, { label: 'Words', value: found.length + ' / 6' }, { label: 'Collection', value: totalWords }, { label: 'Letters', value: chosen.length + ' / 6' }]); }
      load(); hud();
      return {
        update(dt) {
          if (ended) return;
          if (transition > 0) { transition -= dt; if (transition <= 0) { if (round === 3) { finish(true); return; } round++; load(); hud(); } return; }
          noticeTime = Math.max(0, noticeTime - dt);
          const k = api.input;
          for (let i = 0; i < 6; i++) if (k.pressed('tile' + i)) pick(i);
          if (k.pressed('erase')) chosen.pop();
          if (k.pressed('shuffle')) { chosen = []; shuffle(rack); api.sound('click'); }
          if (k.pressed('hint')) hint();
          const p = k.pointer;
          if (p.pressed && p.inside) {
            if (p.x >= X && p.x < X + 6 * S && p.y >= Y && p.y < Y + 80) pick(Math.floor((p.x - X) / S));
            else if (p.x >= 354 && p.x < 574 && p.y >= 450 && p.y < 504) submit();
            else if (p.x >= 222 && p.x < 330 && p.y >= 450 && p.y < 504) chosen.pop();
            else if (p.x >= 594 && p.x < 694 && p.y >= 450 && p.y < 504) { chosen = []; shuffle(rack); }
          }
          if (k.pressed('submit')) submit();
          if (k.pressed('bank') && !transition) { finish(false); return; }
          hud();
        },
        draw(c) {
          c.save(); c.fillStyle = '#f0e8da'; c.fillRect(0, 0, 960, 600); c.textAlign = 'left'; c.fillStyle = '#64513e'; c.font = '800 31px Georgia,serif'; c.fillText('MAKE', 30, 184); c.fillText('SOMETHING', 30, 225, 170); c.fillText('OF IT.', 30, 266); c.fillStyle = '#99856e'; c.font = '15px system-ui'; ['Six familiar letters.', 'A fresh arrangement.', 'A little word magic.'].forEach((t, i) => c.fillText(t, 30, 323 + i * 26, 175));
          c.fillStyle = '#9e8466'; c.font = '700 13px system-ui'; c.fillText('RACK ' + round + ' · ' + pack().name, 222, 93); c.fillStyle = '#d9c7ad'; c.fillRect(218, 184, 456, 104);
          for (let i = 0; i < 6; i++) { c.fillStyle = i < chosen.length ? '#fffaf0' : '#e8dcc8'; c.beginPath(); c.roundRect(X + i * S + 4, 191, S - 8, 90, 6); c.fill(); if (i < chosen.length) { c.fillStyle = '#725841'; c.font = '800 40px Georgia,serif'; c.textAlign = 'center'; c.fillText(rack[chosen[i]], X + i * S + S / 2, 250); } }
          c.textAlign = 'center'; c.fillStyle = '#9b846d'; c.font = '14px system-ui'; c.fillText(noticeTime ? notice : 'Build a word. Give it a place.', 447, 139, 450);
          for (let i = 0; i < 6; i++) { const x = X + i * S, used = chosen.includes(i); c.fillStyle = used ? '#d7cbb8' : '#a8754f'; c.beginPath(); c.roundRect(x + 3, Y + 5, S - 6, 78, 8); c.fill(); c.fillStyle = used ? '#e3d8c5' : '#f6d49d'; c.beginPath(); c.roundRect(x + 3, Y, S - 6, 76, 8); c.fill(); c.fillStyle = used ? '#b9a88e' : '#684b31'; c.font = '800 36px Georgia,serif'; c.fillText(rack[i], x + S / 2, Y + 46); c.font = '11px system-ui'; c.fillText(i + 1, x + S / 2, Y + 66); }
          for (const [x, w, label, fill] of [[222, 108, 'UNDO', '#dfd0ba'], [354, 220, 'FORGE WORD', '#5d7969'], [594, 100, 'MIX', '#dfd0ba']]) { c.fillStyle = fill; c.beginPath(); c.roundRect(x, 450, w, 54, 9); c.fill(); c.fillStyle = label === 'FORGE WORD' ? '#f5edda' : '#8e755a'; c.font = '700 14px system-ui'; c.fillText(label, x + w / 2, 484); }
          c.fillStyle = '#fff9ee'; c.beginPath(); c.roundRect(723, 64, 207, 472, 14); c.fill(); c.fillStyle = '#8e7455'; c.font = '700 13px system-ui'; c.fillText('THE WORD WALL', 826, 98); c.fillStyle = '#b5a58d'; c.font = '12px system-ui'; c.fillText('find any six', 826, 120);
          pack().words.forEach((word, i) => { const done = found.includes(word), count = reveals[word] || 0; c.textAlign = 'left'; c.fillStyle = done ? '#668572' : '#9b8c74'; c.font = done ? '700 18px system-ui' : '21px ui-monospace,monospace'; const label = done ? word : word.slice(0, count) + '·'.repeat(word.length - count); c.fillText(label, 744, 155 + i * 29); c.textAlign = 'right'; c.fillStyle = done ? '#7b9a80' : '#b5a58b'; c.font = '16px system-ui'; c.fillText(done ? '✓' : word.length, 910, 155 + i * 29); });
          c.textAlign = 'center'; c.fillStyle = '#a68d72'; c.font = '13px system-ui'; c.fillText('1–6 PICK A LETTER · ENTER FORGES IT · BACKSPACE GIVES ONE BACK', 480, 568);
          if (transition > 0) { c.fillStyle = '#4c6f60f0'; c.fillRect(246, 214, 416, 96); c.fillStyle = '#fff0cd'; c.font = '800 29px system-ui'; c.fillText('SIX LITTLE DISCOVERIES', 454, 272, 390); }
          c.restore();
        },
        inspect() { return { rack: rack.slice(), words: pack().words.slice(), found: found.slice(), chosen: chosen.slice(), draft: draft(), reveals: { ...reveals }, round, cleared, totalWords, hints, mistakes, earned, score, transition, ended }; }
      };
    }
  });
})();
