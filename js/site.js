const init_main = () => {
    window.stopExecution = false; // we aren't running
    const currentValue = window.cmEditor.state.doc.toString();
    const endPosition = currentValue.length;
    window.update_terminal();
    // set option if url has option
    const params = new URLSearchParams(window.location.search);
    const example = params.get('example');
    if (example) {
        const examples = document.getElementById('examples');
        for (let i = 0; i < examples.options.length; i++) {
            if (examples.options[i].text == example) {
                examples.value = i;
                window.update_terminal();
                break;
            }
        }
    }
}

window.init_main = init_main;

///// 

window.get_input = () => {
    window.reset_console();
    const context = {}; // we might use this to pass parameters to a program,
    // e.g. { name: "Chris", num: 5, arr: [1, 2, 3], }
    const code = window.cmEditor.state.doc.toString();
    python_run(code);
}

const python_run = (code) => {
    let ws;
    window.unique_id = uuidv4();

    // Connect to Web Socket
    ws = new WebSocket("wss://server.yourfirstyearteaching.com:49001/");

    // Set event handlers.
    ws.onopen = function() {
        console.log('opened websocket connection');
        // send the code to run
        const run_str = JSON.stringify({
            "web_id": window.unique_id,
            "command":"run", 
            "data": code
        })
        ws.send(run_str);
    };

    ws.onmessage = function(e) {
        // e.data contains received string.
        console.log("websocket onmessage: " + e.data);
        if (e.data.indexOf('received program from ' + window.unique_id + ' to run') == -1) {
            const terminal = document.getElementById('console-output');
            terminal.value += e.data;
            terminal.blur();
            terminal.focus();
            window.originalText += e.data;
        }
    };

    ws.onclose = function() {
        console.log("closed websocket connection");
    };

    ws.onerror = function(e) {
        console.log("websocket error:");
        console.log(e)
    };
    window.ws = ws;
    getInputFromTerminal();

}

function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

window.reset_console = () => {
    if (window.codeRunning) {
        // interruptExecution();
    }
    document.getElementById('console-output').value = '';
}

window.interruptExecution = () => {
    console.log("stopping program");
}

window.update_terminal = () => {
    const snippets = [`def main():
    sum = 0
    for i in range(5):
        next_num = input("Please enter a number, <return> to end: ")
        if next_num == '':
            print(f"Total sum: {sum}")
            quit()
        sum += int(next_num)
        print(f"Sum so far: {sum}")

if __name__ == '__main__':
    main()`,
        `print('Hello, World!')`,

        `first_number = int(input("Please type a number: "))
second_number = int(input("Please type another number: "))
result = first_number + second_number
print(f"The sum of {first_number} + {second_number} = {result}")`,

        `def main():
    size = int(input("Size of triangle (5-21)? "))
    triangle(size)

def triangle(n):
    for i in range(0, n, 2):
        for j in range((n - i) // 2):
            print(' ', end='')
        for j in range(i + 1):
            print('*', end='')
        print()

if __name__ == '__main__':
    main()`,
        `import time
for i in range(10):
    print(i)
    time.sleep(1)`,
        `def main():
    print('in main()')
    nextFunc()

def nextFunc():
    print("about to divide by zero...")
    a = 1 / 0

if __name__ == "__main__":
    main()`,
        `import random

NUM_TO_CONNECT = 4
NUM_ROWS = 6 
NUM_COLUMNS = 7 
COLORS = ['Red', 'Yellow']

# simple random
# def ai_turn(board, color, other_color):
#   while True:
#     # choose a random column in the board and attempt to drop a token there
#     col = random.randrange(len(board[0]))
#     if drop_token(board, col, color):
#       return col

# will always go in a winning column if it can
def ai_turn(board, color, other_color):
    win_col = col_to_win(board, color)
    if win_col is not None:
        # we have a winning move!
        drop_token(board, win_col, color)
        return win_col

    # no winning move -- just randomly drop as before
    while True:
        # choose a random column in the board and attempt to drop a token there
        col = random.randrange(len(board[0]))
        if drop_token(board, col, color):
            return col

# helper functions
def remove_token(board, col):
    """
    Nice function to have for testing strategies
    Removes the highest token in a column
    """
    # find the first row that has a token in that column
    for row in board:
        if row[col] is not None:
            # and remove it
            row[col] = None
            return

def col_to_win(board, color):
  """
  Returns a column that will win for color.
  If there are multiple winning moves, only
  returns one column.
  If there isn't a winning move, returns None.
  """
  for col_num in range(len(board[0])):
      # drop a token at the column to test
    if drop_token(board, col_num, color):
        # see if it was a winning move
      possible_winner = check_board_for_winner(board, NUM_TO_CONNECT)

      # undo the drop
      remove_token(board, col_num)

      if possible_winner:
          return col_num
  return None

def main():
    """
    The main function runs the game. There is some setup
    and then the players play the game.
    """
    # choices for player_functions: real_player_turn and ai_turn
    player_functions = [real_player_turn, ai_turn]
    # player_functions = [ai_turn, ai_turn]

    board = create_board(NUM_ROWS, NUM_COLUMNS)

    turn_number = 1
    while True: 
        print_board(board)
        print(f"Turn {turn_number}")

        player_turn_function = player_functions[(turn_number - 1) % 2]
        color1 = COLORS[(turn_number - 1) % 2]
        color2 = COLORS[turn_number % 2]

        print(f"It is the {color1} player's turn.")
        col = player_turn_function(board, color1, color2)
        print(f"{color1} played in column {col}.")
        print()

        winner = check_board_for_winner(board, NUM_TO_CONNECT)
        if winner is not None:
            print_board(board)
            print(f"Winner! {winner['winner']} won the game!")
            print(winner)
            print(f"The game took {turn_number} turns")
            print_board(board)
            break 


        if None not in board[0]:
            print("The board is full and the players tied!")
            print_board(board)
            break

        turn_number += 1

# Game functions

def create_board(num_rows, num_columns):
    """
    Creates a board of num_rows x num_columns
    filled with None
    Returns the board
    """
    board = []
    for row in range(num_rows):
        new_row = []
        for col in range(num_columns):
            new_row.append(None)
        board.append(new_row)
    return board

def print_board(board):
    """
    Prints the board, which consists of
    rows of columns. E.g., an example board could be:
    [
     [None,     None,     None,  None,     None,  None,     None], 
     [None,     None,     None,  None,     None,  None,     None], 
     [None,     None,     None,  None,     'Red', None,     None], 
     [None,     'Yellow', None,  'Yellow', 'Red', 'Red',    None], 
     [None,     'Red',    None,  'Yellow', 'Red', 'Red',    'Red'], 
     ['Yellow', 'Yellow', 'Red', 'Yellow', 'Red', 'Yellow', 'Yellow']
    ]

    The board would print as follows:
     0 1 2 3 4 5 6
    ---------------
    | | | | | | | |
    | | | | | | | |
    | | | | |R| | |
    | |Y| |Y|R|R| |
    | |R| |Y|R|R|R|
    |Y|Y|R|Y|R|Y|Y|
    ---------------
    |             |
    """
    num_cols = len(board[0])

    # column numbers
    for i in range(num_cols):
        print(f' {i}', end='')
    print()

    # horizontal dashes
    num_dashes = 2 * num_cols + 1
    print('-' * num_dashes)

    # actual rows
    for row in board:
        for token in row:
            if token is None:
                ch = ' '
            else:
                ch = token[0]
            print(f"|{ch}", end='')
        print('|')
    # horizontal dashes
    print(f"-" * num_dashes)

    # feet
    print(f"|{' ' * (num_dashes - 2)}|")
    print()

def drop_token(board, col, color):
    """
    Drops a token of color into column col.
    Returns True if the token can be dropped into that column.

    This is a bit tricky, because we have rows in our board.
    We need to look at the col in each row and stop when
    we get to the bottom of the board
    Special case: top row is not None: cannot put a token there
    """
    if board[0][col] is not None:
        # full row
        return False
    for row_index in range(len(board)):
        if row_index == len(board) - 1 or board[row_index + 1][col] is not None:
            # last row or blocked below
            board[row_index][col] = color
            return True

def real_player_turn(board, color, other_color):
    """
    Asks a real player to play a turn.
    Drops the token in the column the player chooses
    and returns the column chosen. Ignores bad input,
    including trying to drop into a full column.
    """
    while True:
        try:
            col = int(input("Please choose a column: "))
            if 0 <= col < len(board[0]) and drop_token(board, col, color):
                return col
        except ValueError:
            pass

def check_board_for_winner(board, num_to_connect):
    """
    determines if there is a winner
    returns a dict with a 'start_row', a 'start_col',
    a 'direction' of 'horizontal', 'vertical', 'diag_up', or 'diag_down'
    and the 'winner', or None if there is no winning NUM_TO_CONNECT-token sequence
    e.g., {'start_row': 0, 'start_col': 1, 'direction': 'diagonal': 'winner': 'red'}
    """
    for row_num in range(len(board)):
        for col_num in range(len(board[0])):
            for fn in [check_for_row_win, check_for_col_win, 
                       check_for_diag_down_win, check_for_diag_up_win]:
                winner = fn(board, row_num, col_num, num_to_connect)
                if winner is not None:
                    return winner
    return None

def check_for_row_win(board, row_num, col_num, num_to_connect):
    """
    If there is a winning row, populates the winning dict and
    returns it.
    Returns None if there is no winning row.
    """
    row = board[row_num]
    color = row[col_num]
    # if there aren't four more in the row, or there isn't a token,
    # we don't have a winner
    if col_num > len(row) - num_to_connect or color is None:
        return None

    for i in range(num_to_connect - 1): # only need to find three more
        next_col_num = i + col_num + 1
        if row[next_col_num] != color:
            return None

    return {
            'start_row': row_num, 
            'start_col': col_num, 
            'direction': 'horizontal', 
            'winner': color,
            }

def check_for_col_win(board, row_num, col_num, num_to_connect):
    """
    If there is a winning column, populates the winning dict and
    returns it.
    Returns None if there is no winning column.
    """
    row = board[row_num]
    color = row[col_num]
    # if there aren't four more in the col, or there isn't a token,
    # we don't have a winner
    if row_num > len(board) - num_to_connect or color is None:
        return None

    for i in range(num_to_connect - 1): # only need to find three more
        next_row_num = i + row_num + 1
        row = board[next_row_num]
        if row[col_num] != color:
            return None

    return {
            'start_row': row_num, 
            'start_col': col_num, 
            'direction': 'vertical', 
            'winner': color,
            }

def check_for_diag_down_win(board, row_num, col_num, num_to_connect):
    """
    If there is a winning diagonal from top left to bottom right,
    populates the winning dict and returns it.
    Returns None if there is no winning down diagonal.
    """
    row = board[row_num]
    color = row[col_num]
    # if there aren't four more in the row or col, or there isn't a token,
    # we don't have a winner
    if (row_num > len(board) - num_to_connect or 
        col_num > len(row) - num_to_connect or 
        color is None):
        return None

    for i in range(num_to_connect - 1): # only need to find three more
        next_row_num = i + row_num + 1
        next_col_num = i + col_num + 1
        row = board[next_row_num]
        if row[next_col_num] != color:
            return None

    return {
            'start_row': row_num, 
            'start_col': col_num, 
            'direction': 'diag-down', 
            'winner': color,
            }

def check_for_diag_up_win(board, row_num, col_num, num_to_connect):
    """
    If there is a winning diagonal from bottom left to top right,
    populates the winning dict and returns it.
    Returns None if there is no winning up diagonal.
    """
    row = board[row_num]
    color = row[col_num]
    # if there aren't four more in the row or col, or there isn't a token,
    # we don't have a winner
    if (row_num < num_to_connect - 1 or 
        col_num > len(row) - num_to_connect or 
        color is None):
        return None

    for i in range(num_to_connect - 1): # only need to find three more
        next_row_num = row_num - i - 1
        next_col_num = col_num + i + 1 
        row = board[next_row_num]
        if row[next_col_num] != color:
            return None

    return {
            'start_row': row_num, 
            'start_col': col_num, 
            'direction': 'diag-up', 
            'winner': color,
            }

if __name__ == "__main__":
    main()
`,
        `import random
import sys

def count_matching_dice(d1, d2, d3, d4, d5, num):
    """
    counts the total number of dice that num
    returns the total
    """
    total = 0
    if d1 == num:
        total += 1
    if d2 == num:
        total += 1
    if d3 == num:
        total += 1
    if d4 == num:
        total += 1
    if d5 == num:
        total += 1
    return total

def score_matching_dice(d1, d2, d3, d4, d5, num):
    """
    The score is determined by the count of that num times num
    Returns the score for dice matching num.
    """
    return count_matching_dice(d1, d2, d3, d4, d5, num) * num

def score_three_or_four_of_a_kind_or_yahtzee(d1, d2, d3, d4, d5, kind_type):
    """
    dice_num will be either 3, 4, or 5.
    Returns the score for a three-of-a-kind (3) 
    or a four-of-a-kind (4), or yahtzee (5)
    where at least three dice are the same number for a three-of-a-kind,
    and at least four dice are the same number for four-of-a-kind, 
    and all five dice are the same number for yahtzee.
    The score is the sum of all the dice for 
    three-of-a-kind and four-of-a-kind
    and the score is 50 for yahtzee.
    If there isn't a match, returns 0
    """
    total = d1 + d2 + d3 + d4 + d5
    dice_num = 1
    while (dice_num <= 6):
        count = count_matching_dice(d1, d2, d3, d4, d5, dice_num)
        if count >= kind_type:
            if kind_type == 5:
                return 50
            else:
                return total 
        dice_num += 1
    return 0

def score_full_house(d1, d2, d3, d4, d5):
    # a full house has exactly 3 of one number dice
    # and two of another
    # A full house scores 25 points
    count1s = count_matching_dice(d1, d2, d3, d4, d5, 1)
    count2s = count_matching_dice(d1, d2, d3, d4, d5, 2)
    count3s = count_matching_dice(d1, d2, d3, d4, d5, 3)
    count4s = count_matching_dice(d1, d2, d3, d4, d5, 4)
    count5s = count_matching_dice(d1, d2, d3, d4, d5, 5)
    count6s = count_matching_dice(d1, d2, d3, d4, d5, 6)

    if count1s == 3:
        if count2s == 2 or count3s == 2 or count4s == 2 or count5s == 2 or count6s == 2:
            return 25
    if count2s == 3:
        if count1s == 2 or count3s == 2 or count4s == 2 or count5s == 2 or count6s == 2:
            return 25
    if count3s == 3:
        if count1s == 2 or count2s == 2 or count4s == 2 or count5s == 2 or count6s == 2:
            return 25
    if count4s == 3:
        if count1s == 2 or count2s == 2 or count3s == 2 or count5s == 2 or count6s == 2:
            return 25
    if count5s == 3:
        if count1s == 2 or count2s == 2 or count3s == 2 or count4s == 2 or count6s == 2:
            return 25
    if count6s == 3:
        if count1s == 2 or count2s == 2 or count3s == 2 or count4s == 2 or count5s == 2:
            return 25
    return 0


def score_straight(d1, d2, d3, d4, d5, straight_type):
    """
    Scores a small or large straight. 
    A small straight must be four
    in a row (1-2-3-4, 2-3-4-5, or 3-4-5-6) and scores 30.
    A large straight is five in a row (1-2-3-4-5, or 2-3-4-5-6)
    and scores 40.
    If there isn't a straight of straight_type, returns 0
    """
    count1s = count_matching_dice(d1, d2, d3, d4, d5, 1)
    count2s = count_matching_dice(d1, d2, d3, d4, d5, 2)
    count3s = count_matching_dice(d1, d2, d3, d4, d5, 3)
    count4s = count_matching_dice(d1, d2, d3, d4, d5, 4)
    count5s = count_matching_dice(d1, d2, d3, d4, d5, 5)
    count6s = count_matching_dice(d1, d2, d3, d4, d5, 6)

    if straight_type == 4:
        # count small straights
        if count1s >= 1 and count2s >= 1 and count3s >= 1 and count4s >= 1:
            return 30
        if count2s >= 1 and count3s >= 1 and count4s >= 1 and count5s >= 1:
            return 30
        if count3s >= 1 and count4s >= 1 and count5s >= 1 and count6s >= 1:
            return 30
        # none found
        return 0

    if straight_type == 5:
        # count large straights
        if count1s >= 1 and count2s >= 1 and count3s >= 1 and count4s >= 1 and count5s >= 1:
            return 40
        if count2s >= 1 and count3s >= 1 and count4s >= 1 and count5s >= 1 and count6s >= 1:
            return 40
        return 0

def roll_die():
    """
    returns the result of a single die roll (1-6)
    """
    return random.randint(1, 6)

# tests
def test_matches(d1, d2, d3, d4, d5):
    """
    test the score for matching dice: 1s, 2s, ..., 6s
    """
    total = d1 + d2 + d3 + d4 + d5
    sums_total = 0
    num = 1
    while num <= 6:
        score = score_matching_dice(d1, d2, d3, d4, d5, num)
        print(f"{num}s sum: {score} ") 
        sums_total += score
        num += 1
    # if sums_total == total:
    #     print("Total sums match.")
    # else:
    #     print("Total sums do not match!")

def test_X_of_a_kinds(d1, d2, d3, d4, d5):
    kind_type = 3
    while kind_type <= 5:
        score = score_three_or_four_of_a_kind_or_yahtzee(d1, d2, d3, d4, d5, kind_type)
        if score > 0:
            if kind_type == 5:
                print(f"Yahtzee! Score: {score}")
            else:
                print(f"{kind_type}-of-a-kind! Score: {score}")
        else:
            if kind_type == 5:
                print(f"Not a yahtzee")
            else:
                print(f"Not a {kind_type}-of-a-kind")
        kind_type += 1

def test_full_house(d1, d2, d3, d4, d5):
    score = score_full_house(d1, d2, d3, d4, d5)
    if score > 0:
        print(f"Full house! Score: {score}")
    else:
        print(f"Not a full house")

def test_straights(d1, d2, d3, d4, d5):
    small_straight_score = score_straight(d1, d2, d3, d4, d5, 4)
    if small_straight_score > 0:
        print(f"Small straight! Score: {small_straight_score}")
    else:
        print(f"Not a small straight")

    large_straight_score = score_straight(d1, d2, d3, d4, d5, 5)
    if large_straight_score > 0:
        print(f"Large straight! Score: {large_straight_score}")
    else:
        print(f"Not a large straight")

def run_tests():
    # to test for yahtzee fast:
    # bash: while [ 1 ]; do python3 yahtzee.py | egrep "seed|5-"; done
    # full house seed: 3124296115595568993
    # three-of-a-kind seed: 7015785909153204237 
    # four-of-a-kind seeds: 3906350539248440928, 4228015625983181528
    # yahtzee seed: 8610573526024559617 
    # small straight seed: 7545246043489357022
    # large straight seed: 7966523343836331803
    seed = random.randrange(sys.maxsize)
    random.seed(seed)
    print(f"seed (for debugging): {seed}")
    d1 = roll_die()    
    d2 = roll_die()    
    d3 = roll_die()    
    d4 = roll_die()    
    d5 = roll_die()    
    print(f"Random Roll: {d1} {d2} {d3} {d4} {d5}")
    test_matches(d1, d2, d3, d4, d5)
    test_X_of_a_kinds(d1, d2, d3, d4, d5)
    test_full_house(d1, d2, d3, d4, d5)
    test_straights(d1, d2, d3, d4, d5)

    print()
    print(f"Testing known dice rolls:")
    known_inputs = [[1, 5, 2, 4, 4], # matches
                    [4, 3, 4, 3, 3], # full house
                    [1, 3, 4, 3, 3], # 3-of-a-kind
                    [6, 6, 1, 6, 6], # 4-of-a-kind
                    [2, 2, 2, 2, 2], # yahtzee!
                    [2, 1, 3, 5, 4], # large straight
                    [2, 1, 3, 3, 4], # small straight
                    ]
    for test_input in known_inputs:
        print(f"Testing {test_input}:")
        test_matches(*test_input)
        test_full_house(*test_input)
        test_X_of_a_kinds(*test_input)
        test_straights(*test_input)
        print(f"***********************")

def print_roll(roll):
    print(f"You rolled:")
    print(f"A B C D E")
    for d in roll:
        print(f"{d} ", end='')
    print()

def roll_dice(num_to_roll):
    dice = []
    for i in range(num_to_roll):
        dice.append(roll_die())
    return dice

def play_game():
    print(f"Welcome to Yahtzee!")
    while True:
        input(f"Press the <return> key for your first roll...")
        roll = roll_dice(5) 
        print_roll(roll)
        print()

        keepers = input("What dice would you like to keep for your second roll? (e.g., A C D): ").upper()
        second_roll = roll_dice(5) 
        for idx, letter in enumerate("ABCDE"):
            if letter in keepers:
                second_roll.pop()
                second_roll = [roll[idx]] + second_roll # push onto beginning
        print_roll(second_roll)
        print()

        keepers = input("What dice would you like to keep for your third roll? (e.g., A C D): ").upper()
        third_roll = roll_dice(5) 
        for idx, letter in enumerate("ABCDE"):
            if letter in keepers:
                third_roll.pop()
                third_roll = [second_roll[idx]] + third_roll # push onto beginning
        print_roll(third_roll)
        print()

        test_matches(*third_roll)
        test_full_house(*third_roll)
        test_X_of_a_kinds(*third_roll)
        test_straights(*third_roll)

        print()
        play_again = input("Would you like to play again? (Y/n): ").lower()
        if play_again != "" and play_again[0] == 'n':
            print("Thank you for playing Yahtzee!")
            break
        print()


def main():
    # run_tests()
    play_game()

if __name__ == "__main__":
    main()
`,
    ]
    const value = document.getElementById('examples').value;
    const currentValue = window.cmEditor.state.doc.toString();
    const endPosition = currentValue.length;
    window.cmEditor.dispatch({
        changes: {
            from: 0, 
            to: endPosition,
            insert: snippets[value]
        }
    });
}

const consoleListener = () => {
    const terminal = document.getElementById('console-output');
    // first, check to see that the original text is still
    // present (otherwise, change back)
    const currentVal = terminal.value;
    if (!currentVal.startsWith(window.originalText)) {
        terminal.value = window.originalText + window.userInput;
    } else if (currentVal.endsWith('\n')) {
        terminal.removeEventListener('input', consoleListener);
        console.log("user input: " + window.userInput);
        const command_info = {
            "web_id": window.unique_id,
            "command":"input", 
            "data": window.userInput,
        }
        window.ws.send(JSON.stringify(command_info));
        getInputFromTerminal();
    }
    else{
        window.userInput = currentVal.substring(window.originalText.length);
    }
}

const getInputFromTerminal = () => {
    const terminal = document.getElementById('console-output');
    const end = terminal.value.length;

    terminal.setSelectionRange(end, end);
    terminal.focus();
    // we need to configure the textarea so that we can control how the user
    // changes it. I.e., only allow text after the current text
    // get the current text in the textarea so we have it when there are changes
    window.originalText = terminal.value;
    window.userInput = '';
    terminal.addEventListener('input', consoleListener, false);
}
