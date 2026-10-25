#!/usr/bin/env python3
"""
__GAME_TITLE__
Built & hosted on Arena.ai Game Hub
Run with: python3 main.py
"""

import random


def main():
    print("=" * 50)
    print("  WELCOME TO __GAME_TITLE__")
    print("=" * 50)
    secret = random.randint(1, 20)
    attempts = 0
    while True:
        guess_raw = input("Guess a number between 1 and 20 (or 'q' to quit): ").strip()
        if guess_raw.lower() == 'q':
            print("Thanks for playing!")
            break
        if not guess_raw.isdigit():
            print("Please enter a valid number.")
            continue
        attempts += 1
        guess = int(guess_raw)
        if guess < secret:
            print("Too low!")
        elif guess > secret:
            print("Too high!")
        else:
            print(f"Victory in {attempts} tries!")
            break


if __name__ == "__main__":
    main()
