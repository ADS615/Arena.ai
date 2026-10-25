#!/usr/bin/env python3
"""
Crypt of the Astral King — Standalone Python 3 Roguelike
Created for the Arena.ai Game Hub (ADS615/Arena.ai)
Run locally with: python3 dungeon_crawler.py
"""

import random
import sys

WIDTH = 14
HEIGHT = 8


class Game:
    def __init__(self):
        self.floor = 1
        self.hp = 30
        self.max_hp = 30
        self.atk = 6
        self.gold = 0
        self.potions = 2
        self.px = 1
        self.py = 1
        self.log = ["You descend into the Crypt of the Astral King..."]
        self.generate_floor()

    def generate_floor(self):
        self.px, self.py = 1, 1
        self.stairs = (WIDTH - 2, HEIGHT - 2)
        self.enemies = {}
        self.chests = set()
        for _ in range(3 + self.floor):
            ex, ey = random.randint(2, WIDTH - 2), random.randint(1, HEIGHT - 2)
            if (ex, ey) != (self.px, self.py) and (ex, ey) != self.stairs:
                self.enemies[(ex, ey)] = {
                    "name": random.choice(["Astral Wraith", "Bone Sentinel", "Void Stalker"]),
                    "hp": 8 + self.floor * 4,
                    "atk": 3 + self.floor * 2,
                }
        for _ in range(2):
            cx, cy = random.randint(2, WIDTH - 2), random.randint(1, HEIGHT - 2)
            if (cx, cy) not in self.enemies and (cx, cy) != self.stairs:
                self.chests.add((cx, cy))

    def render(self):
        print("\n" + "=" * 54)
        print(f" FLOOR {self.floor} | HP: {self.hp}/{self.max_hp} | ATK: {self.atk} | POTIONS: {self.potions} | GOLD: {self.gold}")
        print("=" * 54)
        for y in range(HEIGHT):
            row = []
            for x in range(WIDTH):
                if x == 0 or x == WIDTH - 1 or y == 0 or y == HEIGHT - 1:
                    row.append("#")
                elif (x, y) == (self.px, self.py):
                    row.append("@")
                elif (x, y) in self.enemies:
                    row.append("E")
                elif (x, y) in self.chests:
                    row.append("$")
                elif (x, y) == self.stairs:
                    row.append(">")
                else:
                    row.append(".")
            print("  " + " ".join(row))
        print("-" * 54)
        for msg in self.log[-3:]:
            print(" > " + msg)
        print("-" * 54)

    def step(self, dx, dy):
        nx, ny = self.px + dx, self.py + dy
        if nx <= 0 or nx >= WIDTH - 1 or ny <= 0 or ny >= HEIGHT - 1:
            self.log.append("Blocked by ancient obsidian walls.")
            return
        if (nx, ny) in self.enemies:
            enemy = self.enemies[(nx, ny)]
            dmg = random.randint(self.atk - 1, self.atk + 2)
            enemy["hp"] -= dmg
            self.log.append(f"You strike {enemy['name']} for {dmg} dmg!")
            if enemy["hp"] <= 0:
                self.log.append(f"Defeated {enemy['name']}! (+15 Gold)")
                self.gold += 15
                del self.enemies[(nx, ny)]
            else:
                edmg = random.randint(max(1, enemy["atk"] - 2), enemy["atk"] + 1)
                self.hp -= edmg
                self.log.append(f"{enemy['name']} hits back for {edmg} dmg!")
            return

        self.px, self.py = nx, ny
        if (nx, ny) in self.chests:
            self.chests.remove((nx, ny))
            if random.random() < 0.5:
                self.potions += 1
                self.log.append("Opened chest: Found an Astral Potion!")
            else:
                self.atk += 2
                self.log.append("Opened chest: Found a Runed Blade (+2 ATK)!")
        elif (nx, ny) == self.stairs:
            self.floor += 1
            self.max_hp += 5
            self.hp = min(self.max_hp, self.hp + 8)
            self.log.append(f"Descended to Floor {self.floor}!")
            self.generate_floor()


def main():
    game = Game()
    while game.hp > 0:
        game.render()
        cmd = input("Move (W/A/S/D), (P)otion, or (Q)uit: ").strip().lower()
        if not cmd:
            continue
        c = cmd[0]
        if c == "q":
            print(f"You escaped with {game.gold} gold on Floor {game.floor}!")
            sys.exit(0)
        elif c == "p":
            if game.potions > 0:
                game.potions -= 1
                game.hp = min(game.max_hp, game.hp + 15)
                game.log.append("Drank Astral Potion (+15 HP)!")
            else:
                game.log.append("No potions remaining!")
        elif c == "w":
            game.step(0, -1)
        elif c == "s":
            game.step(0, 1)
        elif c == "a":
            game.step(-1, 0)
        elif c == "d":
            game.step(1, 0)

    game.render()
    print(f"\nYOU HAVE FALLEN ON FLOOR {game.floor}. Final Gold: {game.gold}")


if __name__ == "__main__":
    main()
