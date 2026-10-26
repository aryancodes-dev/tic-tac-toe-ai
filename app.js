// Tic-Tac-Toe v6 — everything from v5 kept, plus board sizes.
// KEPT: Minimax Impossible AI, Easy/Medium/Hard, Vs Friend, play as X/O, first move,
// Hint, Undo, streaks + win rate, move log + match history, sound, light/dark theme, PWA.
// NEW in v6: Board size 3x3, 4x4, 5x5, 6x6, 9x9, 12x12, 15x15.
// Win length: 3 in a row on 3x3, 4 on 4x4, 5 on 5x5 and bigger (15x15 is Gomoku-style).
// HONEST AI LIMIT: 3x3 Impossible = perfect Minimax, never loses. On big boards perfect
// Minimax would need to search millions of moves and would hang a phone, so big-board
// Impossible uses a strong heuristic (win > block win > open 4 > open 3 > centre). It is
// very strong, but it is not mathematically perfect like 3x3 Minimax.
const $ = id => document.getElementById(id);
const boardEl = $("board"), statusEl = $("status"), modeEl = $("mode"), diffEl = $("difficulty"),
      sideEl = $("side"), firstEl = $("first"), hintLine = $("hintLine"), endBanner = $("endBanner"),
      sizeEl = $("boardSize");

let board, turn, over, moves = [], lastResult = null, hintCell = null;
let scores = load("ttt-v5-scores", {X:0, O:0, D:0});
let history = load("ttt-v5-history", []);
let streak = load("ttt-v5-streak", {current:0, best:0, lastWinner:null});
let soundOn = load("ttt-v5-sound", true);
let theme = load("ttt-v5-theme", "dark");

function load(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v === null || v === undefined ? fallback : v; } catch (e) { return fallback; } }
function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }
function other(p) { return p === "X" ? "O" : "X"; }
function size() { return parseInt(sizeEl.value, 10); }
function winLen() { return size() <= 4 ? size() : 5; }
function rc(i) { return [Math.floor(i / size()), i % size()]; }
function idx(r, c) { return r * size() + c; }
function inBoard(r, c) { return r >= 0 && r < size() && c >= 0 && c < size(); }

function winner(b) {
  const n = size(), w = winLen();
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (let r=0;r<n;r++) for (let c=0;c<n;c++) {
    const p = b[idx(r,c)]; if (!p) continue;
    for (const [dr,dc] of dirs) {
      const line = [];
      for (let k=0;k<w;k++) { const rr=r+dr*k, cc=c+dc*k; if (!inBoard(rr,cc) || b[idx(rr,cc)]!==p) break; line.push(idx(rr,cc)); }
      if (line.length===w) return {player:p, line};
    }
  }
  return null;
}
function emptyCells(b){ return b.map((v,i)=>v?null:i).filter(v=>v!==null); }

// --- 3x3 Minimax (perfect, only used on 3x3) ---
function minimax(b, turnPlayer, ai, depth=0) {
  const w = winner(b);
  if (w) return w.player===ai ? 10-depth : depth-10;
  if (!emptyCells(b).length) return 0;
  let best = turnPlayer===ai ? -Infinity : Infinity;
  for (const i of emptyCells(b)) {
    b[i] = turnPlayer;
    const s = minimax(b, other(turnPlayer), ai, depth+1);
    b[i] = "";
    best = turnPlayer===ai ? Math.max(best,s) : Math.min(best,s);
  }
  return best;
}
function minimaxMove(b, player, ai) {
  let bestScore = player===ai ? -Infinity : Infinity, move = null;
  for (const i of emptyCells(b)) {
    b[i]=player; const s=minimax(b, other(player), ai); b[i]="";
    if ((player===ai && s>bestScore) || (player!==ai && s<bestScore)) { bestScore=s; move=i; }
  }
  return move;
}

// --- Big-board heuristic (used on 4x4 and bigger, and for Hint there) ---
function lineCount(b, r, c, dr, dc, player) {
  let count = 0, open = 0;
  for (const dir of [1,-1]) {
    for (let k=1;k<winLen();k++) {
      const rr=r+dr*dir*k, cc=c+dc*dir*k;
      if (!inBoard(rr,cc)) break;
      const v=b[idx(rr,cc)];
      if (v===player) count++;
      else if (!v) { open++; break; }
      else break;
    }
  }
  return {count, open};
}
function scoreCell(b, i, player, opponent) {
  const [r,c] = rc(i);
  let score = 0;
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (const [dr,dc] of dirs) {
    const p = lineCount(b, r, c, dr, dc, player);
    const o = lineCount(b, r, c, dr, dc, opponent);
    const w = winLen();
    if (p.count >= w-1) score += 100000;
    else if (p.count === w-2 && p.open >= 1) score += 5000;
    else if (p.count === w-2) score += 500;
    else if (p.count === w-3 && p.open >= 2) score += 800;
    else score += p.count * 10 + p.open;
    if (o.count >= w-1) score += 90000;
    else if (o.count === w-2 && o.open >= 1) score += 4000;
    else if (o.count === w-2) score += 400;
    else score += o.count * 8;
  }
  // Prefer centre on big empty boards.
  const centre = (size()-1)/2;
  score -= (Math.abs(r-centre) + Math.abs(c-centre)) * 0.5;
  return score;
}
function heuristicMove(b, player, opponent) {
  // 1) Win now. 2) Block opponent win now. 3) Best scored cell.
  for (const i of emptyCells(b)) { b[i]=player; const w=winner(b); b[i]=""; if (w && w.player===player) return i; }
  for (const i of emptyCells(b)) { b[i]=opponent; const w=winner(b); b[i]=""; if (w && w.player===opponent) return i; }
  let best=-Infinity, move=null;
  for (const i of emptyCells(b)) { const s=scoreCell(b, i, player, opponent); if (s>best) { best=s; move=i; } }
  return move;
}
function bestMoveFor(b, player, ai) {
  if (size()===3) return minimaxMove(b, player, ai);
  return heuristicMove(b, player, other(player));
}
function nearCells(b) {
  const empties = emptyCells(b);
  if (!empties.length) return empties;
  const near = empties.filter(i=>{
    const [r,c]=rc(i);
    for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++) {
      if (dr===0 && dc===0) continue;
      const rr=r+dr, cc=c+dc;
      if (inBoard(rr,cc) && b[idx(rr,cc)]) return true;
    }
    return false;
  });
  return near.length ? near : empties;
}
function aiPlayer() { return modeEl.value==="ai" ? other(sideEl.value) : null; }
function humanPlayer() { return sideEl.value; }

function beep(freq, ms=120) {
  if (!soundOn) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.12, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ms/1000);
    o.start(); o.stop(ctx.currentTime + ms/1000);
  } catch (e) {}
}

function updateLabels() {
  if (modeEl.value==="ai") {
    $("labelX").textContent = humanPlayer()==="X" ? "You (X)" : "AI (X)";
    $("labelO").textContent = humanPlayer()==="O" ? "You (O)" : "AI (O)";
  } else { $("labelX").textContent = "Player X"; $("labelO").textContent = "Player O"; }
  $("diffWrap").style.display = modeEl.value==="ai" ? "flex" : "none";
  $("sideWrap").style.display = modeEl.value==="ai" ? "flex" : "none";
  $("firstWrap").style.display = modeEl.value==="ai" ? "flex" : "none";
  $("soundBtn").textContent = soundOn ? "🔊 Sound: On" : "🔇 Sound: Off";
  document.body.classList.toggle("light", theme==="light");
  $("themeBtn").textContent = theme==="light" ? "☀️ Light" : "🌙 Dark";
  $("winInfo").textContent = `Get ${winLen()} in a row to win on ${size()} × ${size()}.` + (size()>=9 ? " Big board = Gomoku-style, 5 in a row." : "");
}

function render() {
  boardEl.innerHTML = "";
  boardEl.style.gridTemplateColumns = `repeat(${size()}, 1fr)`;
  boardEl.className = "board size" + size();
  board.forEach((v,i)=>{
    const btn=document.createElement("button");
    btn.className="cell"+(v?" "+v.toLowerCase():"")+(hintCell===i?" hint":"");
    btn.textContent=v||""; btn.disabled=over||!!v; btn.setAttribute("aria-label", v ? v+" in square "+(i+1) : "Empty square "+(i+1));
    btn.addEventListener("click",()=>onTap(i));
    boardEl.appendChild(btn);
  });
  $("scoreX").textContent=scores.X; $("scoreO").textContent=scores.O; $("scoreDraw").textContent=scores.D;
  const games = scores.X + scores.O + scores.D;
  const youWins = modeEl.value==="ai" ? scores[humanPlayer()] : scores.X;
  const rate = games ? Math.round((youWins / games) * 100) + "%" : "—";
  $("statsLine").textContent = `Games: ${games} • Win rate: ${rate} • Streak: ${streak.current} • Best streak: ${streak.best}`;
  $("moveLog").textContent = moves.length ? moves.map((m,idx)=>`${idx+1}. ${m.player} → ${m.index+1}`).join("  •  ") : "No moves yet.";
  $("matchHistory").textContent = history.length ? history.slice(-10).reverse().map(h=>h).join("  •  ") : "No finished games yet.";
}

function recordStreak(resultPlayer) {
  if (resultPlayer==="D") { streak.current = 0; }
  else if (streak.lastWinner===resultPlayer) { streak.current++; }
  else { streak.current = 1; streak.lastWinner = resultPlayer; }
  if (streak.current > streak.best) streak.best = streak.current;
  save("ttt-v5-streak", streak);
}

function endGame(msg, winLine, resultPlayer, note) {
  over=true;
  if (winLine) winLine.forEach(i=>boardEl.children[i].classList.add("win"));
  statusEl.textContent=msg;
  $("endText").textContent=msg; $("endNote").textContent=note||""; endBanner.style.display="block";
  if (resultPlayer==="D") beep(440, 180); else beep(resultPlayer===humanPlayer() && modeEl.value==="ai" ? 880 : 220, 220);
  render();
}
function play(i, player) {
  if (over || board[i]) return;
  hintCell = null; hintLine.textContent = "";
  board[i]=player; moves.push({player, index:i});
  const w=winner(board);
  if (w){
    scores[w.player]++; lastResult = w.player; recordStreak(w.player);
    const label = modeEl.value==="ai" ? (w.player===humanPlayer() ? "🎉 You win!" : "🤖 AI wins!") : `🎉 Player ${w.player} wins!`;
    const note = modeEl.value==="ai" && diffEl.value==="impossible" && size()===3 && w.player!==humanPlayer()
      ? "Impossible AI on 3×3 never loses — a draw is the best result against it. Try Easy or Medium to win."
      : (modeEl.value==="ai" && w.player===humanPlayer() ? `You beat ${diffEl.value} AI on ${size()}×${size()} — nice!` : "");
    history.push(`${w.player} won (${size()}×${size()})`); save("ttt-v5-scores", scores); save("ttt-v5-history", history);
    endGame(label, w.line, w.player, note); return;
  }
  if (!emptyCells(board).length){
    scores.D++; lastResult = "D"; recordStreak("D");
    history.push(`Draw (${size()}×${size()})`); save("ttt-v5-scores", scores); save("ttt-v5-history", history);
    endGame("🤝 It's a draw!", null, "D", modeEl.value==="ai" && diffEl.value==="impossible" && size()===3 ? "A draw against Impossible AI on 3×3 is a perfect result — it never loses." : ""); return;
  }
  turn = other(player);
  statusEl.textContent = modeEl.value==="ai" ? (turn===humanPlayer() ? "Your turn ("+humanPlayer()+")" : "AI is thinking…") : `Player ${turn}'s turn`;
  render();
  if (modeEl.value==="ai" && turn===aiPlayer() && !over) setTimeout(aiMove, size()>=9 ? 200 : 400);
}
function aiMove() {
  if (over) return;
  const ai = aiPlayer(), empties = emptyCells(board);
  if (!empties.length) return;
  if (!moves.length) { play(idx(Math.floor(size()/2), Math.floor(size()/2)), ai); return; }
  const diff = diffEl.value;
  const chanceBest = diff==="impossible" ? 1 : diff==="hard" ? 0.85 : diff==="medium" ? 0.5 : 0;
  let move;
  if (Math.random() < chanceBest) move = bestMoveFor([...board], ai, ai);
  else move = size()===3 ? empties[Math.floor(Math.random()*empties.length)] : nearCells(board)[Math.floor(Math.random()*nearCells(board).length)];
  play(move, ai);
}
function onTap(i){
  if (modeEl.value==="ai" && turn!==humanPlayer()) return;
  play(i, turn);
}
function newGame(){
  board=Array(size()*size()).fill(""); over=false; moves=[]; lastResult=null; hintCell=null; hintLine.textContent="";
  endBanner.style.display="none";
  turn = modeEl.value==="ai" ? (firstEl.value==="ai" ? aiPlayer() : humanPlayer()) : "X";
  updateLabels();
  statusEl.textContent = modeEl.value==="ai" ? (turn===humanPlayer() ? "Your turn ("+humanPlayer()+") — tap a square" : "AI is thinking…") : "Player X's turn — tap a square";
  render();
  if (modeEl.value==="ai" && turn===aiPlayer()) setTimeout(aiMove, 400);
}
function undo(){
  if (!moves.length) return;
  if (over && lastResult) {
    if (lastResult==="D") scores.D--; else scores[lastResult]--;
    save("ttt-v5-scores", scores); history.pop(); save("ttt-v5-history", history);
    over=false; lastResult=null; endBanner.style.display="none";
  }
  const steps = modeEl.value==="ai" && moves.length>=2 ? 2 : 1;
  for (let k=0;k<steps && moves.length;k++) { const m=moves.pop(); board[m.index]=""; }
  turn = moves.length ? other(moves[moves.length-1].player) : (modeEl.value==="ai" ? (firstEl.value==="ai" ? aiPlayer() : humanPlayer()) : "X");
  hintCell=null; hintLine.textContent="";
  statusEl.textContent = modeEl.value==="ai" ? (turn===humanPlayer() ? "Your turn ("+humanPlayer()+")" : "AI is thinking…") : `Player ${turn}'s turn`;
  render();
  if (modeEl.value==="ai" && turn===aiPlayer() && !over) setTimeout(aiMove, 400);
}
function hint(){
  if (over) { hintLine.textContent = "Game is over — start a New Game."; return; }
  if (modeEl.value==="ai" && turn!==humanPlayer()) { hintLine.textContent = "Wait for the AI to move first."; return; }
  const player = modeEl.value==="ai" ? humanPlayer() : turn;
  const ai = modeEl.value==="ai" ? aiPlayer() : other(player);
  const move = bestMoveFor([...board], player, ai);
  if (move===null || move===undefined) { hintLine.textContent = "No hint — board is full."; return; }
  hintCell = move; hintLine.textContent = `💡 Best move: square ${move+1} (square 1 = top-left).`;
  render();
}

modeEl.addEventListener("change", newGame);
diffEl.addEventListener("change", newGame);
sideEl.addEventListener("change", newGame);
firstEl.addEventListener("change", newGame);
sizeEl.addEventListener("change", newGame);
$("resetBtn").addEventListener("click", newGame);
$("playAgainBtn").addEventListener("click", newGame);
$("hintBtn").addEventListener("click", hint);
$("undoBtn").addEventListener("click", undo);
$("resetScoresBtn").addEventListener("click", ()=>{
  if (!confirm("Reset all scores, streaks and match history on this phone?")) return;
  scores={X:0,O:0,D:0}; history=[]; streak={current:0,best:0,lastWinner:null};
  save("ttt-v5-scores", scores); save("ttt-v5-history", history); save("ttt-v5-streak", streak);
  newGame();
});
$("soundBtn").addEventListener("click", ()=>{ soundOn=!soundOn; save("ttt-v5-sound", soundOn); updateLabels(); render(); });
$("themeBtn").addEventListener("click", ()=>{ theme = theme==="light" ? "dark" : "light"; save("ttt-v5-theme", theme); updateLabels(); });
document.addEventListener("keydown", e=>{
  if (size()===3 && /^[1-9]$/.test(e.key)) onTap(parseInt(e.key,10)-1);
});
newGame();
