"""Tic-Tac-Toe with AI — Project #02 of the 100+ AI Projects series.
Unbeatable Minimax AI. Same logic as the web version (app.js).
Run:  python tic_tac_toe.py
You are X, AI is O. Enter a position 1-9.
"""
WINS = [(0, 1, 2), (3, 4, 5), (6, 7, 8), (0, 3, 6), (1, 4, 7), (2, 5, 8), (0, 4, 8), (2, 4, 6)]


def winner(board):
    for a, b, c in WINS:
        if board[a] and board[a] == board[b] == board[c]:
            return board[a]
    return None


def empty_cells(board):
    return [i for i, v in enumerate(board) if v == ""]


def minimax(board, is_max, depth=0):
    w = winner(board)
    if w == "O":
        return 10 - depth
    if w == "X":
        return depth - 10
    if not empty_cells(board):
        return 0
    scores = []
    for i in empty_cells(board):
        board[i] = "O" if is_max else "X"
        scores.append(minimax(board, not is_max, depth + 1))
        board[i] = ""
    return max(scores) if is_max else min(scores)


def best_move(board):
    best_score, move = -999, None
    for i in empty_cells(board):
        board[i] = "O"
        score = minimax(board, False)
        board[i] = ""
        if score > best_score:
            best_score, move = score, i
    return move


def show(board):
    for r in range(3):
        row = [board[r * 3 + c] or str(r * 3 + c + 1) for c in range(3)]
        print(" | ".join(row))
        if r < 2:
            print("---------")


def main():
    board = [""] * 9
    print("Tic-Tac-Toe vs AI — you are X, AI is O. Enter 1-9.")
    while True:
        show(board)
        try:
            move = int(input("Your move (1-9): ")) - 1
        except (ValueError, EOFError, KeyboardInterrupt):
            print("\nGame ended.")
            break
        if move not in range(9) or board[move]:
            print("Invalid move, try again.")
            continue
        board[move] = "X"
        if winner(board) == "X":
            show(board)
            print("You win!")
            break
        if not empty_cells(board):
            show(board)
            print("Draw!")
            break
        board[best_move(board)] = "O"
        print("AI played.")
        if winner(board) == "O":
            show(board)
            print("AI wins!")
            break
        if not empty_cells(board):
            show(board)
            print("Draw!")
            break


if __name__ == "__main__":
    main()
