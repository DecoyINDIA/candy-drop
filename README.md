# Candy Drop 🍬

A bright, fast, one-more-try browser arcade game. Slide your basket, catch the falling candy, dodge the bombs, and chase the combo.

## About

Candy Drop is a single-file HTML5 canvas game with no dependencies, no build step, and no assets. It is designed to be picked up in seconds by anyone and to be hard to put down.

- **Simple controls:** mouse, touch, or the arrow keys / A and D.
- **Combo multipliers:** every 5 catches in a row raises your multiplier; a missed candy resets it.
- **Rising difficulty:** each level is faster, spawns more bombs, and from level 3 the candy sways sideways.
- **Power-ups:** a star starts a 5-second frenzy (double points, no bombs); a heart restores a life.
- **Juicy feedback:** particle bursts, screen shake, and synthesized sounds whose pitch rises with your combo.
- **High score** is saved in your browser.

## Play

Open `index.html` in any modern browser, or serve the folder:

```bash
npx http-server -p 8321
```

Then visit http://localhost:8321.

## Files

- `index.html` - the entire game (HTML, CSS, JavaScript).
