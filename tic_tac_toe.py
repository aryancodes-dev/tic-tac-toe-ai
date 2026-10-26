"""Tic-Tac-Toe v6 with AI — Project #02 of the 100+ AI Projects series.
Same brain as the web version (app.js), plus v6 board sizes:
  3x3, 4x4, 5x5, 6x6, 9x9, 12x12, 15x15.
Win length: 3 on 3x3, 4 on 4x4, 5 on 5x5 and bigger (15x15 = Gomoku-style).
3x3 Impossible = perfect Minimax. Big boards use a strong heuristic
(win > block win > open 4 > open 3 > centre) — perfect Minimax on 15x15
would take forever on a phone, so no app does it instantly.
Run:  python tic_tac_toe.py
Positions: 1 to size*size, left-to-right, top-to-bottom.
"""
import random

DIFF_CHANCE = {"easy": 0.0, "medium": 0.5, "hard": 0.85, "impossible": 1.0}
DIRS = [(0, 1), (1, 0), (1, 1), (1, -1)]


def other(p):
    return "O" if p == "X" else "X"


def win_len(size):
    return size if size <= 4 else 5


def winner(board, size):
    w = win_len(size)
    for r in range(size):
        for c in range(size):
            p = board[r * size + c]
            if not p:
                continue
            for dr, dc in DIRS:
                line = []
                for k in range(w):
                    rr, cc = r + dr * k, c + dc * k
                    if not (0 <= rr < size and 0 <= cc < size):
                        break
                    if board[rr * size + cc] != p:
                        break
                    line.append(rr * size + cc)
                if len(line) == w:
                    return p
    return None


def empty_cells(board):
    return [i for i, v in enumerate(board) if v == ""]


def minimax(board, size, turn, ai, depth=0):
    w = winner(board, size)
    if w == ai:
        return 10 - depth
    if w:
        return depth - 10
    if not empty_cells(board):
        return 0
    scores = []
    for i in empty_cells(board):
        board[i] = turn
        scores.append(minimax(board, size, other(turn), ai, depth + 1))
        board[i] = ""
    return max(scores) if turn == ai else min(scores)


def minimax_move(board, size, player, ai):
    best_score, move = (-9999 if player == ai else 9999), None
    for i in empty_cells(board):
        board[i] = player
        score = minimax(board, size, other(player), ai)
        board[i] = ""
        if (player == ai and score > best_score) or (player != ai and score < best_score):
            best_score, move = score, i
    return move


def _line_count(board, size, r, c, dr, dc, player):
    w = win_len(size)
    count, open_ends = 0, 0
    for d in (1, -1):
        for k in range(1, w):
            rr, cc = r + dr * d * k, c + dc * d * k
            if not (0 <= rr < size and 0 <= cc < size):
                break
            v = board[rr * size + cc]
            if v == player:
                count += 1
            elif not v:
                open_ends += 1
                break
            else:
                break
    return count, open_ends


def _score_cell(board, size, i, player, opponent):
    r, c = divmod(i, size)
    w = win_len(size)
    score = 0
    for dr, dc in DIRS:
        pc, po = _line_count(board, size, r, c, dr, dc, player)
        oc, oo = _line_count(board, size, r, c, dr, dc, opponent)
        if pc >= w - 1:
            score += 100000
        elif pc == w - 2 and po >= 1:
            score += 5000
        elif pc == w - 2:
            score += 500
        else:
            score += pc * 10 + po
        if oc >= w - 1:
            score += 90000
        elif oc == w - 2 and oo >= 1:
            score += 4000
        elif oc == w - 2:
            score += 400
        else:
            score += oc * 8
    centre = (size - 1) / 2
    score -= (abs(r - centre) + abs(c - centre)) * 0.5
    return score


def heuristic_move(board, size, player, opponent):
    for i in empty_cells(board):
        board[i] = player
        w = winner(board, size)
        board[i] = ""
        if w == player:
            return i
    for i in empty_cells(board):
        board[i] = opponent
        w = winner(board, size)
        board[i] = ""
        if w == opponent:
            return i
    best, move = -10**18, None
    for i in empty_cells(board):
        s = _score_cell(board, size, i, player, opponent)
        if s > best:
            best, move = s, i
    return move


def best_move(board, size, player, ai):
    if size == 3:
        return minimax_move(board, size, player, ai)
    return heuristic_move(board, size, player, other(player))


def _near_cells(board, size):
    empties = empty_cells(board)
    near = []
    for i in empties:
        r, c = divmod(i, size)
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                rr, cc = r + dr, c + dc
                if 0 <= rr < size and 0 <= cc < size and board[rr * size + cc]:
                    near.append(i)
                    break
            else:
                continue
            break
    return near or empties


def ai_move(board, size, ai, difficulty):
    empties = empty_cells(board)
    if not empties:
        return None
    if not any(board):
        return (size // 2) * size + (size // 2)
    if random.random() < DIFF_CHANCE[difficulty]:
        return best_move(board, size, ai, ai)
    if size == 3:
        return random.choice(empties)
    return random.choice(_near_cells(board, size))


def show(board, size):
    for r in range(size):
        row = []
        for c in range(size):
            i = r * size + c
            row.append(board[i] or str(i + 1))
        print(" | ".join(row))
        if r < size - 1:
            print("-" * (4 * size - 1))


def play_round(human, ai, difficulty, ai_first, size):
    board = [""] * size * size
    moves = []
    turn = ai if ai_first else human
    while True:
        show(board, size)
        if turn == human:
            raw = input(f"Your move (1-{size*size}, 'u' = undo, 'q' = quit): ").strip().lower()
            if raw == "q":
                return None
            if raw == "u":
                for _ in range(2):
                    if moves:
                        board[moves.pop()] = ""
                turn = human
                continue
            try:
                move = int(raw) - 1
            except ValueError:
                print("Invalid — enter a number.")
                continue
            if move not in range(size * size) or board[move]:
                print("Invalid move, try again.")
                continue
        else:
            move = ai_move(board, size, ai, difficulty)
            print(f"AI played {move + 1}.")
        board[move] = turn
        moves.append(move)
        w = winner(board, size)
        if w:
            show(board, size)
            print("You win!" if w == human else "AI wins!")
            return w
        if not empty_cells(board):
            show(board, size)
            print("Draw!")
            return "D"
        turn = other(turn)


def main():
    print("Tic-Tac-Toe v6 vs AI — by Aryan Kumar Shah")
    human = ""
    while human not in ("X", "O"):
        human = input("Play as X or O? ").strip().upper()
    ai = other(human)
    size = 0
    while size not in (3, 4, 5, 6, 9, 12, 15):
        try:
            size = int(input("Board size (3, 4, 5, 6, 9, 12, 15): ").strip())
        except ValueError:
            size = 0
    print(f"Board {size}x{size} — get {win_len(size)} in a row to win.")
    difficulty = ""
    while difficulty not in DIFF_CHANCE:
        difficulty = input("Difficulty (easy / medium / hard / impossible): ").strip().lower()
    ai_first = input("AI first? (y/n): ").strip().lower() == "y"
    scores = {"X": 0, "O": 0, "D": 0}
    streak = 0
    while True:
        result = play_round(human, ai, difficulty, ai_first, size)
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
