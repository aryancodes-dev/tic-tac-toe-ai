# ❌⭕ Tic-Tac-Toe v6 with AI

**Project #02 of the 100+ AI Projects series — by Aryan Kumar Shah**

Play Tic-Tac-Toe against an unbeatable Minimax AI, or with a friend.
On Impossible mode the AI never loses — the best you can do is draw.

## What it can do — v6, everything included
### Added in v6 — board sizes
- **Board size selector: 3×3, 4×4, 5×5, 6×6, 9×9, 12×12, 15×15** — change it any time, a new game starts
- **Win length:** 3 in a row on 3×3, 4 on 4×4, 5 on 5×5 and bigger (15×15 is Gomoku-style, 5 in a row)
- **Big-board AI:** on 3×3 Impossible is perfect Minimax; on 4×4 and bigger it uses a strong heuristic (win > block win > open 4 > open 3 > centre) — perfect Minimax on 15×15 would hang a phone, so this is the honest limit
- **Hint, Undo, streaks, scores, history all work on every board size**, and cells shrink automatically so 15×15 still fits on a phone screen with no sideways scroll
- **Keyboard 1-9** works on 3×3 only (on bigger boards, tap the square)

### Kept from v5 (nothing removed)
- Vs AI mode: Easy, Medium, Impossible (Minimax)
- Vs Friend mode (2 players on one phone)
- Scoreboard: X wins, Draws, O wins, with winning-line highlight
- Works as a website AND as an installable app (PWA)
- Python version included, with the same Minimax brain
- Custom favicon (favicon.svg)

### Added in v5
- **Hard difficulty** — 85% best Minimax move, 15% mistake (Easy = random, Medium = 50% best, Impossible = 100% best)
- **Play as X or O**, and **who moves first** (You first / AI first) — before, you were always X first
- **💡 Hint** — highlights the best square for you, and tells you its number (1 = top-left, 9 = bottom-right)
- **↩ Undo** — Vs AI undoes your + AI's last moves, Vs Friend undoes one move; undo after a finished game also rolls the score back
- **Streaks + win rate** — current streak, best streak, games played, win rate, all saved on your phone
- **Move log + match history** — every move listed, last 10 results kept, in the "Moves & match history" panel
- **Sound on/off** — small beep on win/draw, no downloaded sound file
- **Light / Dark theme** toggle, saved on your phone
- **Keyboard play** — press 1-9 to play a square
- **End-game banner** — result + reason + Play Again button (e.g. "A draw against Impossible AI is a perfect result")
- **Dynamic labels** — Vs AI shows "You (X) / AI (O)" correctly even when you play as O; Vs Friend shows "Player X / Player O"

### Enhanced in v5
- **Minimax generalised** — the AI brain now works for either side (X or O), not only O. The Python version matches exactly.
- **PWA cache** — bumped to `tictactoe-v5` with skipWaiting + old-cache delete, so v5 actually replaces the old version instead of staying stuck in cache (the Lumora cache lesson)
- **Phone + desktop fit** — controls wrap, no horizontal scroll, smaller cells/buttons on phones ≤600px, larger centred board on desktop

## Try it
**Website:** Open `index.html`, or enable GitHub Pages and open the live link.
**App:** Open the live link in Chrome on your phone → menu → "Add to Home screen".
**Python:**
```bash
python tic_tac_toe.py
```
Choose board size (3, 4, 5, 6, 9, 12, 15), X or O, difficulty, AI first or not. Type `u` to undo, `q` to quit.

## Files (upload exactly like this, all at repo root)
```
index.html
style.css
app.js
tic_tac_toe.py
favicon.svg
manifest.json
sw.js
README.md
LICENSE
POSTING_KIT.md
```

## Tech stack
HTML, CSS, JavaScript (Minimax AI + PWA + localStorage), Python

## Next project
Project #03: Autocorrect Tool — only after this one, one by one.
