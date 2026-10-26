// Tic-Tac-Toe with AI — Minimax (unbeatable on Impossible).
// Same logic as tic_tac_toe.py.
const WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
let board, turn, over, scores = {X:0, O:0, D:0};
const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const modeEl = document.getElementById("mode");
const diffEl = document.getElementById("difficulty");

function winner(b) {
  for (const [a,c,d] of WINS) if (b[a] && b[a]===b[c] && b[a]===b[d]) return {player:b[a], line:[a,c,d]};
  return null;
}
function emptyCells(b){ return b.map((v,i)=>v?null:i).filter(v=>v!==null); }
function minimax(b, isMax, depth=0) {
  const w = winner(b);
  if (w) return w.player==="O" ? 10-depth : depth-10;
  if (!emptyCells(b).length) return 0;
  let best = isMax ? -Infinity : Infinity;
  for (const i of emptyCells(b)) {
    b[i] = isMax ? "O" : "X";
    const s = minimax(b, !isMax, depth+1);
    b[i] = "";
    best = isMax ? Math.max(best,s) : Math.min(best,s);
  }
  return best;
}
function bestMove() {
  let bestScore=-Infinity, move=null;
  for (const i of emptyCells(board)) {
    board[i]="O"; const s=minimax(board,false); board[i]="";
    if (s>bestScore){bestScore=s; move=i;}
  }
  return move;
}
function aiMove() {
  const diff = diffEl.value, empties = emptyCells(board);
  if (!empties.length) return;
  let move;
  if (diff==="easy") move = empties[Math.floor(Math.random()*empties.length)];
  else if (diff==="medium") move = Math.random()<0.5 ? empties[Math.floor(Math.random()*empties.length)] : bestMove();
  else move = bestMove();
  play(move, "O");
}
function render() {
  boardEl.innerHTML = "";
  board.forEach((v,i)=>{
    const btn=document.createElement("button");
    btn.className="cell"+(v?" "+v.toLowerCase():""); btn.textContent=v||""; btn.disabled=over||!!v;
    btn.addEventListener("click",()=>onTap(i));
    boardEl.appendChild(btn);
  });
  document.getElementById("scoreX").textContent=scores.X;
  document.getElementById("scoreO").textContent=scores.O;
  document.getElementById("scoreDraw").textContent=scores.D;
}
function endGame(msg, winLine) {
  over=true;
  if (winLine) winLine.forEach(i=>boardEl.children[i].classList.add("win"));
  statusEl.textContent=msg; render();
}
function play(i, player) {
  if (over || board[i]) return;
  board[i]=player;
  const w=winner(board);
  if (w){ scores[w.player]++; endGame(w.player==="X" ? "🎉 X wins!" : "🤖 O wins!", w.line); return; }
  if (!emptyCells(board).length){ scores.D++; endGame("🤝 It's a draw!"); return; }
  turn = player==="X" ? "O" : "X";
  statusEl.textContent = modeEl.value==="ai" ? (turn==="X" ? "Your turn (X)" : "AI is thinking…") : `Player ${turn}'s turn`;
  render();
  if (modeEl.value==="ai" && turn==="O" && !over) setTimeout(aiMove, 400);
}
function onTap(i){
  if (modeEl.value==="ai" && turn!=="X") return;
  play(i, turn);
}
function newGame(){
  board=Array(9).fill(""); turn="X"; over=false;
  statusEl.textContent="Your turn — tap a square";
  document.getElementById("diffWrap").style.display = modeEl.value==="ai" ? "flex" : "none";
  render();
}
modeEl.addEventListener("change", newGame);
diffEl.addEventListener("change", newGame);
document.getElementById("resetBtn").addEventListener("click", newGame);
newGame();
