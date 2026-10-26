"""Tic-Tac-Toe v5 with AI — Project #02 of the 100+ AI Projects series.
Same Minimax brain as the web version (app.js), plus v5 features:
  - Play as X or O, choose who moves first
  - Difficulties: Easy (random), Medium (50% best), Hard (85% best),
    Impossible (100% Minimax, never loses)
  - Scoreboard + streak across rounds, play-again loop, Undo (type 'u')
Run:  python tic_tac_toe.py
Positions: 1-9, top-left = 1, bottom-right = 9.
"""
import random

WINS = [(0, 1, 2), (3, 4, 5), (6, 7, 8), (0, 3, 6), (1, 4, 7), (2, 5, 8), (0, 4, 8), (2, 4, 6)]
DIFF_CHANCE = {"easy": 0.0, "medium": 0.5, "hard": 0.85, "impossible": 1.0}


def winner(board):
    for a, b, c in WINS:
        if board[a] and board[a] == board[b] == board[c]:
            return board[a]
    return None


def empty_cells(board):
    return [i for i, v in enumerate(board) if v == ""]


def other(p):
    return "O" if p == "X" else "X"


def minimax(board, turn, ai, depth=0):
    w = winner(board)
    if w == ai:
        return 10 - depth
    if w:
        return depth - 10
    if not empty_cells(board):
        return 0
    scores = []
    for i in empty_cells(board):
        board[i] = turn
        scores.append(minimax(board, other(turn), ai, depth + 1))
        board[i] = ""
    return max(scores) if turn == ai else min(scores)


def best_move(board, player, ai):
    best_score, move = (-9999 if player == ai else 9999), None
    for i in empty_cells(board):
        board[i] = player
        score = minimax(board, other(player), ai)
        board[i] = ""
        if (player == ai and score > best_score) or (player != ai and score < best_score):
            best_score, move = score, i
    return move


def ai_move(board, ai, difficulty):
    empties = empty_cells(board)
    if random.random() < DIFF_CHANCE[difficulty]:
        return best_move(board, ai, ai)
    return random.choice(empties)


def show(board):
    for r in range(3):
        row = [board[r * 3 + c] or str(r * 3 + c + 1) for c in range(3)]
        print(" | ".join(row))
        if r < 2:
            print("---------")


def play_round(human, ai, difficulty, ai_first):
    board = [""] * 9
    moves = []
    turn = ai if ai_first else human
    while True:
        show(board)
        if turn == human:
            raw = input("Your move (1-9, 'u' = undo, 'q' = quit): ").strip().lower()
            if raw == "q":
                return None
            if raw == "u":
                # Undo your move + the AI move before it, if there are any.
                for _ in range(2):
                    if moves:
                        board[moves.pop()] = ""
                turn = human
                continue
            try:
                move = int(raw) - 1
            except ValueError:
                print("Invalid — enter 1-9.")
                continue
            if move not in range(9) or board[move]:
                print("Invalid move, try again.")
                continue
        else:
            move = ai_move(board, ai, difficulty)
            print(f"AI played {move + 1}.")
        board[move] = turn
        moves.append(move)
        w = winner(board)
        if w:
            show(board)
            print("You win!" if w == human else "AI wins!")
            return w
        if not empty_cells(board):
            show(board)
            print("Draw!")
            return "D"
        turn = other(turn)


def main():
    print("Tic-Tac-Toe v5 vs AI — by Aryan Kumar Shah")
    human = ""
    while human not in ("X", "O"):
        human = input("Play as X or O? ").strip().upper()
    ai = other(human)
    difficulty = ""
    while difficulty not in DIFF_CHANCE:
        difficulty = input("Difficulty (easy / medium / hard / impossible): ").strip().lower()
    ai_first = input("AI first? (y/n): ").strip().lower() == "y"
    scores = {"X": 0, "O": 0, "D": 0}
    streak = 0
    while True:
        result = play_round(human, ai, difficulty, ai_first)
        if result is None:
            break
        scores[result] += 1
        streak = streak + 1 if result == human else 0
        print(f"Score — X: {scores['X']}  Draws: {scores['D']}  O: {scores['O']}  • Your streak: {streak}")
        if input("Play again? (y/n): ").strip().lower() != "y":
            break
    print("Thanks for playing!")


if __name__ == "__main__":
    main()
