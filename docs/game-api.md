# Arcade game contract

Games are dependency-free classic JavaScript scripts, loaded after `../../assets/arcade.js`.
Call `Arcade.mount(config)` exactly once. The shared runtime owns the canvas, animation,
menus, pause/resume, sound toggle, input, best scores, medals and seeded daily runs.

```js
Arcade.mount({
  id: 'game-slug', title: 'Game Title', category: 'Category', accent: '#5eead4',
  description: 'One sentence hook.',
  howTo: ['Goal and rules.', 'Controls.', 'Skill tip.'],
  controls: [{ id: 'left', label: '←', keys: ['ArrowLeft', 'KeyA'] }],
  // Medals are awarded for >= these score thresholds.
  medals: [200, 600, 1200],
  create(api) {
    // api.w=960, api.h=600. All coordinates use these logical pixels.
    // api.random() is the gameplay RNG; never use Math.random for game state.
    // api.input.down(id): held action, api.input.pressed(id): one frame edge.
    // api.input.pointer: {x,y,down,pressed,released,inside,active}; logical canvas coords.
    // down = pointer held, pressed/released edges; active = pointer has been used.
    // api.input keys also work through id mappings in controls.
    // api.score(number), api.hud([{label:'Wave',value:'1'}, ...]) updates DOM HUD.
    // api.sound('hit'|'good'|'bad'|'win'|'click'|'shoot', pitch=1)
    // api.burst(x,y,color,count=12); api.shake(amount=5); api.toast('message')
    // api.end({score, title:'Run complete', message:'Specific feedback', stats:[{label,value}]})
    // api.time is elapsed active game seconds; api.mode is 'classic' or 'daily'.
    // api.reducedMotion is boolean.
    return {
      update(dt) { /* delta seconds, capped at 1/30; only called when playing */ },
      draw(ctx) { /* draw full frame, called for menu preview and while paused too */ },
      cancelInput() { /* optional: discard an in-progress swipe, putt or charge */ },
      inspect() { return {}; } // optional JSON-serializable test/debug state
    };
  }
});
```

The runtime resets input on pause and on new runs. `create` must construct a playable
initial frame without advancing gameplay. No DOM manipulation, timers, global listeners,
storage or animation loops in game modules. `api.end` may be called once per run; the
runtime ignores repeats. Ended games must stop mutating after calling it in `update`.

All games should have clear end conditions, purposeful skill mechanics, fair early
rounds and bounded arrays. Support keyboard plus touch through the declared control
buttons or pointer. Every pointer-only action needs a keyboard alternative. Use canvas
primitives for original visual art, no external assets. Protect canvas state with
save/restore. Avoid tiny text; key HUD belongs in `api.hud`.

Each game lives in `games/<slug>/game.js`. The integrator generates `index.html` pages,
the shared runtime, card art, and the hub. Only edit your assigned game modules.

For automation, runtime exposes `window.__arcade = { start(mode), state(), inspect(),
step(seconds), pause(), resume() }` only when URL includes `?test=1`. `step` advances
simulation using fixed 1/60-second substeps; normal gameplay uses requestAnimationFrame.

## Optional enlarged board view

Catalog entries can include `focus: [x, y, width, height]` within the 960 × 600 scene.
The toolbar then offers **Enlarge board / Show full scene**. The runtime crops the view,
adapts the stage proportions and maps pointer positions back to logical coordinates.
Game modules continue drawing and handling input in the same coordinate system.
Keep every required interactive element inside the crop, and put essential status in
`api.hud`. Test a direct tap or drag in both views. Zoom cancels a pending gesture
without changing the puzzle or simulation state.
