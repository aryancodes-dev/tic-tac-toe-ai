// Tic-Tac-Toe v5 — everything from v1 kept, plus v5 additions.
// KEPT: Minimax Impossible AI, Easy/Medium, Vs Friend, scoreboard, winning-line highlight, PWA.
// NEW in v5: Hard difficulty, play as X or O, who moves first, Hint, Undo, streaks + win rate,
// match history + move log, sound toggle, light/dark theme, saved scores on this phone,
// keyboard play (1-9), dynamic You/AI vs Player X/O labels, phone/desktop fit.
const WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const $ = id => document.getElementById(id);
const boardEl = $("board"), statusEl = $("status"), modeEl = $("mode"), diffEl = $("difficulty"),
      sideEl = $("side"), firstEl = $("first"), hintLine = $("hintLine"), endBanner = $("endBanner");

let board, turn, over, moves = [], lastResult = null, hintCell = null;
let scores = load("ttt-v5-scores", {X:0, O:0, D:0});
let history = load("ttt-v5-history", []);
let streak = load("ttt-v5-streak", {current:0, best:0, lastWinner:null});
let soundOn = load("ttt-v5-sound", true);
let theme = load("ttt-v5-theme", "dark");

function load(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v === null || v === undefined ? fallback : v; } catch (e) { return fallback; } }
function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }
function other(p) { return p === "X" ? "O" : "X"; }

function winner(b) {
  for (const [a,c,d] of WINS) if (b[a] && b[a]===b[c] && b[a]===b[d]) return {player:b[a], line:[a,c,d]};
  return null;
}
function emptyCells(b){ return b.map((v,i)=>v?null:i).filter(v=>v!==null); }

// Minimax, scored from the AI's point of view: AI win = +10, human win = -10, faster wins are better.
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
function bestMoveFor(b, player, ai) {
  // Best move for `player`: maximise if player is AI, minimise if player is human.
  let bestScore = player===ai ? -Infinity : Infinity, move = null;
  for (const i of emptyCells(b)) {
    b[i]=player; const s=minimax(b, other(player), ai); b[i]="";
    if ((player===ai && s>bestScore) || (player!==ai && s<bestScore)) { bestScore=s; move=i; }
  }
  return move;
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
}

function render() {
  boardEl.innerHTML = "";
  board.forEach((v,i)=>{
    const btn=document.createElement("button");
    btn.className="cell"+(v?" "+v.toLowerCase():"")+(hintCell===i?" hint":"");
    btn.textContent=v||""; btn.disabled=over||!!v; btn.setAttribute("aria-label", v ? v+" in square "+(i+1) : "Empty square "+(i+1)+" — press "+(i+1));
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
    const note = modeEl.value==="ai" && diffEl.value==="impossible" && w.player!==humanPlayer()
      ? "Impossible AI never loses — a draw is the best result against it. Try Easy or Medium to win."
      : (modeEl.value==="ai" && w.player===humanPlayer() ? `You beat ${diffEl.value} AI — nice!` : "");
    history.push(`${w.player} won`); save("ttt-v5-scores", scores); save("ttt-v5-history", history);
    endGame(label, w.line, w.player, note); return;
  }
  if (!emptyCells(board).length){
    scores.D++; lastResult = "D"; recordStreak("D");
    history.push("Draw"); save("ttt-v5-scores", scores); save("ttt-v5-history", history);
    endGame("🤝 It's a draw!", null, "D", modeEl.value==="ai" && diffEl.value==="impossible" ? "A draw against Impossible AI is a perfect result — it never loses." : ""); return;
  }
  turn = other(player);
  statusEl.textContent = modeEl.value==="ai" ? (turn===humanPlayer() ? "Your turn ("+humanPlayer()+")" : "AI is thinking…") : `Player ${turn}'s turn`;
  render();
  if (modeEl.value==="ai" && turn===aiPlayer() && !over) setTimeout(aiMove, 400);
}
function aiMove() {
  if (over) return;
  const ai = aiPlayer(), empties = emptyCells(board);
  if (!empties.length) return;
  const diff = diffEl.value;
  const chanceBest = diff==="impossible" ? 1 : diff==="hard" ? 0.85 : diff==="medium" ? 0.5 : 0;
  const move = Math.random() < chanceBest ? bestMoveFor([...board], ai, ai) : empties[Math.floor(Math.random()*empties.length)];
  play(move, ai);
}
function onTap(i){
  if (modeEl.value==="ai" && turn!==humanPlayer()) return;
  play(i, turn);
}
function newGame(){
  board=Array(9).fill(""); over=false; moves=[]; lastResult=null; hintCell=null; hintLine.textContent="";
  endBanner.style.display="none";
  turn = modeEl.value==="ai" ? (firstEl.value==="ai" ? aiPlayer() : humanPlayer()) : "X";
  updateLabels();
  statusEl.textContent = modeEl.value==="ai" ? (turn===humanPlayer() ? "Your turn ("+humanPlayer()+") — tap a square" : "AI is thinking…") : "Player X's turn — tap a square";
  render();
  if (modeEl.value==="ai" && turn===aiPlayer()) setTimeout(aiMove, 400);
}
function undo(){
  if (!moves.length) return;
  // If the game just ended, roll back its score too.
  if (over && lastResult) {
    if (lastResult==="D") scores.D--; else scores[lastResult]--;
    save("ttt-v5-scores", scores); history.pop(); save("ttt-v5-history", history);
    streak = load("ttt-v5-streak", streak); // keep streak simple: do not recompute old streaks
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
  hintCell = move; hintLine.textContent = `💡 Best move: square ${move+1} (top-left is 1, bottom-right is 9).`;
  render();
}

modeEl.addEventListener("change", newGame);
diffEl.addEventListener("change", newGame);
sideEl.addEventListener("change", newGame);
firstEl.addEventListener("change", newGame);
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
  if (/^[1-9]$/.test(e.key)) onTap(parseInt(e.key,10)-1);
});
newGame();
