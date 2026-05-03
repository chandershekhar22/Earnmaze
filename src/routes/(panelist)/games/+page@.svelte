<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.svelte';

  let mounted = $state(false);
  let activeFilter = $state('all');
  let openGame = $state<(typeof GAMES)[number] | null>(null);

  onMount(() => { mounted = true; });

  $effect(() => {
    if (mounted && !authStore.state.isLoading && !authStore.state.user) {
      goto('/login?redirect=%2Fgames');
    }
  });

  $effect(() => {
    if (openGame) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });

  function closeModal() { openGame = null; }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && openGame) closeModal();
  }

  const GAMES = [
    { id: 'candy-crush', name: 'Candy Crush', desc: 'Match colorful candies in this addictive puzzle game.', cover: '/game-covers/candy-crush.svg', cat: 'puzzle', reward: '50-150', plays: '34.2k', badge: 'hot', bg: 'linear-gradient(135deg,#ff5f8f,#ff8a3d)', path: '/games-repo/01-Candy-Crush-Game/index.html' },
    { id: 'pac-man', name: 'Pac-Man', desc: 'Navigate the maze, eat dots, avoid ghosts.', cover: '/game-covers/pac-man.svg', cat: 'arcade', reward: '60-200', plays: '28.9k', badge: 'hot', bg: 'linear-gradient(135deg,#ffd166,#ff8a3d)', path: '/games-repo/02-Pac-Man-Game/index.html' },
    { id: 'doodle-jump', name: 'Doodle Jump', desc: 'Bounce higher and higher on platforms.', cover: '/game-covers/doodle-jump.svg', cat: 'arcade', reward: '40-180', plays: '22.1k', badge: null, bg: 'linear-gradient(135deg,#35d39a,#56a8ff)', path: '/games-repo/04-Doodle-Jump-Game/index.html' },
    { id: 'solitaire', name: 'Solitaire', desc: 'The classic card game. Stack them all.', cover: '/game-covers/solitaire.svg', cat: 'casual', reward: '30-120', plays: '41.5k', badge: null, bg: 'linear-gradient(135deg,#1e8560,#35d39a)', path: '/games-repo/05-Solitaire-Game/index.html' },
    { id: 'sudoku', name: 'Sudoku', desc: 'Fill the 9x9 grid with logic. No guessing.', cover: '/game-covers/sudoku.svg', cat: 'puzzle', reward: '80-250', plays: '18.7k', badge: null, bg: 'linear-gradient(135deg,#56a8ff,#8f7cff)', path: '/games-repo/06-Sudoku-Game/index.html' },
    { id: 'crossy-road', name: 'Crossy Road', desc: 'Cross busy roads and rivers without getting hit.', cover: '/game-covers/crossy-road.svg', cat: 'arcade', reward: '50-200', plays: '15.3k', badge: 'new', bg: 'linear-gradient(135deg,#35d39a,#1e8560)', path: '/games-repo/07-Crossy-Road-Game/index.html' },
    { id: 'rps', name: 'Rock Paper Scissors', desc: 'The ultimate showdown. Best of 5 wins.', cover: '/game-covers/rps.svg', cat: 'casual', reward: '20-60', plays: '52.8k', badge: null, bg: 'linear-gradient(135deg,#8f7cff,#ff5f8f)', path: '/games-repo/08-Rock-Paper-Scissors/index.html' },
    { id: 'flappy-bird', name: 'Flappy Bird', desc: 'Tap to fly through pipes. How far can you go?', cover: '/game-covers/flappy-bird.svg', cat: 'arcade', reward: '50-500', plays: '38.4k', badge: 'hot', bg: 'linear-gradient(135deg,#56a8ff,#35d39a)', path: '/games-repo/09-Flappy-Bird-Game/index.html' },
    { id: '2048', name: '2048', desc: 'Merge tiles to reach the legendary 2048.', cover: '/game-covers/2048.svg', cat: 'puzzle', reward: '100-300', plays: '28.1k', badge: null, bg: 'linear-gradient(135deg,#ff8a3d,#ffd166)', path: '/games-repo/10-2048-Game/index.html' },
    { id: 'wordle', name: 'Wordle', desc: 'Guess the 5-letter word in 6 tries.', cover: '/game-covers/wordle.svg', cat: 'puzzle', reward: '40-120', plays: '45.6k', badge: null, bg: 'linear-gradient(135deg,#35d39a,#ffd166)', path: '/games-repo/11-Wordle-Game/index.html' },
    { id: 'hangman', name: 'Hangman', desc: 'Guess the word letter by letter before time runs out.', cover: '/game-covers/hangman.svg', cat: 'casual', reward: '25-80', plays: '19.2k', badge: null, bg: 'linear-gradient(135deg,#5c5c72,#8f7cff)', path: '/games-repo/12-Hangman-Game/index.html' },
    { id: 'tetris', name: 'Tetris', desc: 'Stack falling blocks. Clear lines. Classic.', cover: '/game-covers/tetris.svg', cat: 'arcade', reward: '60-250', plays: '31.7k', badge: 'hot', bg: 'linear-gradient(135deg,#ff5f8f,#8f7cff)', path: '/games-repo/20-Tetris-Game/index.html' },
    { id: 'connect-four', name: 'Connect Four', desc: 'Drop discs and connect four in a row to win.', cover: '/game-covers/connect-four.svg', cat: 'casual', reward: '30-90', plays: '14.8k', badge: null, bg: 'linear-gradient(135deg,#ff5d73,#ffd166)', path: '/games-repo/25-Connect-Four-Game/index.html' },
    { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', desc: 'Beat the AI. Three in a row wins it.', cover: '/game-covers/tic-tac-toe.svg', cat: 'casual', reward: '25-75', plays: '18.9k', badge: null, bg: 'linear-gradient(135deg,#56a8ff,#8f7cff)', path: '/games-repo/15-Tic-Tac-Toe/index.html' },
    { id: 'snake', name: 'Snake', desc: 'The classic. Eat, grow, avoid yourself.', cover: '/game-covers/snake.svg', cat: 'arcade', reward: '30-200', plays: '45.2k', badge: null, bg: 'linear-gradient(135deg,#35d39a,#1e8560)', path: '/games-repo/24-Snake-Game/index.html' },
    { id: 'memory', name: 'Memory Cards', desc: 'Flip cards, match pairs, train your brain.', cover: '/game-covers/memory.svg', cat: 'puzzle', reward: '50-150', plays: '12.4k', badge: 'new', bg: 'linear-gradient(135deg,#8f7cff,#56a8ff)', path: '/games-repo/22-Memory-Card-Game/index.html' },
    { id: 'chess', name: 'Chess', desc: 'Outsmart the board in the classic strategy duel.', cover: '/game-covers/chess.svg', cat: 'puzzle', reward: '100-400', plays: '21.3k', badge: null, bg: 'linear-gradient(135deg,#8c6242,#3a2817)', path: '/games-repo/03-Chess-Game/index.html' },
    { id: 'tower-blocks', name: 'Tower Blocks', desc: 'Stack blocks perfectly. How high can you go?', cover: '/game-covers/tower-blocks.svg', cat: 'arcade', reward: '40-220', plays: '26.7k', badge: 'new', bg: 'linear-gradient(135deg,#4a6dbf,#1f2966)', path: '/games-repo/13-Tower-Blocks/index.html' },
    { id: 'archery', name: 'Archery', desc: 'Aim, draw, release. Hit the bullseye every time.', cover: '/game-covers/archery.svg', cat: 'arcade', reward: '60-260', plays: '17.8k', badge: null, bg: 'linear-gradient(135deg,#ea3b3b,#7fb5f7)', path: '/games-repo/14-Archery-Game/index.html' },
    { id: 'minesweeper', name: 'Minesweeper', desc: 'Clear the board without stepping on mines.', cover: '/game-covers/minesweeper.svg', cat: 'puzzle', reward: '80-280', plays: '16.2k', badge: null, bg: 'linear-gradient(135deg,#4a556b,#1a1e2e)', path: '/games-repo/16-Minesweeper-Game/index.html' },
    { id: 'speed-typing', name: 'Speed Typing', desc: 'Type the quote fast. Track your real WPM.', cover: '/game-covers/speed-typing.svg', cat: 'casual', reward: '30-150', plays: '11.9k', badge: null, bg: 'linear-gradient(135deg,#151a2e,#0b0f1f)', path: '/games-repo/17-Speed-Typing-Game/index.html' },
    { id: 'breakout', name: 'Breakout', desc: 'Smash every brick. Don\'t drop the ball.', cover: '/game-covers/breakout.svg', cat: 'arcade', reward: '50-220', plays: '23.5k', badge: null, bg: 'linear-gradient(135deg,#1a2040,#0a0e27)', path: '/games-repo/18-Breakout-Game/index.html' },
    { id: 'ping-pong', name: 'Ping Pong', desc: 'Rally the ball past the CPU. First to 11.', cover: '/game-covers/ping-pong.svg', cat: 'arcade', reward: '40-180', plays: '19.6k', badge: null, bg: 'linear-gradient(135deg,#0c1226,#000)', path: '/games-repo/19-Ping-Pong-Game/index.html' },
    { id: 'tilting-maze', name: 'Tilting Maze', desc: 'Tilt the board. Roll the ball to the goal.', cover: '/game-covers/tilting-maze.svg', cat: 'puzzle', reward: '60-220', plays: '9.8k', badge: 'new', bg: 'linear-gradient(135deg,#1a1d40,#0a0c20)', path: '/games-repo/21-Tilting-Maze-Game/index.html' },
    { id: 'number-guess', name: 'Number Guess', desc: 'Guess the secret number in 10 tries.', cover: '/game-covers/number-guess.svg', cat: 'casual', reward: '25-90', plays: '13.4k', badge: null, bg: 'linear-gradient(135deg,#1e2766,#0a0e27)', path: '/games-repo/23-Type-Number-Guessing-Game/index.html' },
    { id: 'insect-catch', name: 'Insect Catch', desc: 'Tap bugs before they escape. Fast reflexes win.', cover: '/game-covers/insect-catch.svg', cat: 'arcade', reward: '35-160', plays: '8.7k', badge: null, bg: 'linear-gradient(135deg,#5bbd5b,#1d4f1d)', path: '/games-repo/26-Insect-Catch-Game/index.html' },
    { id: 'word-rush', name: 'Word Rush', desc: 'Type each word before time runs out.', cover: '/game-covers/word-rush.svg', cat: 'casual', reward: '30-160', plays: '10.5k', badge: null, bg: 'linear-gradient(135deg,#1c1040,#0a061a)', path: '/games-repo/27-Typing-Game/index.html' },
    { id: 'dice-roll', name: 'Dice Roller', desc: 'Shake, roll and hit your lucky combo.', cover: '/game-covers/dice-roll.svg', cat: 'casual', reward: '20-60', plays: '7.2k', badge: null, bg: 'linear-gradient(135deg,#3a1d4a,#0a051a)', path: '/games-repo/28-Dice-Roll-Simulator/index.html' },
    { id: 'shape-clicker', name: 'Shape Clicker', desc: 'Tap only the target shape. Build your combo.', cover: '/game-covers/shape-clicker.svg', cat: 'arcade', reward: '30-140', plays: '6.4k', badge: null, bg: 'linear-gradient(135deg,#0c1a3a,#1a2d5c)', path: '/games-repo/29-Shape-Clicker-Game/index.html' },
    { id: 'voice-guess', name: 'Voice Guess', desc: 'Speak your guess. Find the hidden number.', cover: '/game-covers/voice-guess.svg', cat: 'casual', reward: '30-110', plays: '5.8k', badge: 'new', bg: 'linear-gradient(135deg,#1d1f5a,#0a0c20)', path: '/games-repo/31-Speak-Number-Guessing-Game/index.html' },
    { id: 'fruit-slicer', name: 'Fruit Slicer', desc: 'Swipe to slice flying fruit. Avoid the bombs.', cover: '/game-covers/fruit-slicer.svg', cat: 'arcade', reward: '50-240', plays: '29.1k', badge: 'hot', bg: 'linear-gradient(135deg,#5c1a3a,#1a0812)', path: '/games-repo/32-Fruit-Slicer-Game/index.html' },
    { id: 'quiz', name: 'Quick Quiz', desc: 'Answer 10 trivia questions against the clock.', cover: '/game-covers/quiz.svg', cat: 'casual', reward: '60-200', plays: '22.4k', badge: null, bg: 'linear-gradient(135deg,#2b1d6b,#0d0a2e)', path: '/games-repo/33-Quiz-Game/index.html' },
    { id: 'emoji-catcher', name: 'Emoji Catcher', desc: 'Catch falling emojis in your basket. Miss and lose hearts.', cover: '/game-covers/emoji-catcher.svg', cat: 'arcade', reward: '40-180', plays: '14.6k', badge: null, bg: 'linear-gradient(135deg,#ff8fb3,#2d1a5e)', path: '/games-repo/34-Emoji-Catcher-Game/index.html' },
    { id: 'whack-a-mole', name: 'Whack-A-Mole', desc: 'Smash every mole that pops up. Speed matters.', cover: '/game-covers/whack-a-mole.svg', cat: 'arcade', reward: '40-160', plays: '25.8k', badge: 'hot', bg: 'linear-gradient(135deg,#6eb854,#2f5e1b)', path: '/games-repo/35-Whack-A-Mole-Game/index.html' },
    { id: 'simon-says', name: 'Simon Says', desc: 'Repeat the color sequence. Each round gets harder.', cover: '/game-covers/simon-says.svg', cat: 'puzzle', reward: '50-200', plays: '11.3k', badge: null, bg: 'linear-gradient(135deg,#1a1f4a,#06081a)', path: '/games-repo/36-Simon-Says-Game/index.html' },
    { id: 'sliding-puzzle', name: 'Sliding Puzzle', desc: 'Slide numbered tiles into order. Beat your best time.', cover: '/game-covers/sliding-puzzle.svg', cat: 'puzzle', reward: '45-170', plays: '9.2k', badge: null, bg: 'linear-gradient(135deg,#1f294c,#0a0e24)', path: '/games-repo/37-Sliding-Puzzle-Game/index.html' },
    { id: 'hextris', name: 'Hextris', desc: 'Rotate the hex. Match colors. Don\'t overflow.', cover: '/game-covers/hextris.svg', cat: 'puzzle', reward: '60-240', plays: '17.4k', badge: 'new', bg: 'linear-gradient(135deg,#0a1020,#000)', path: '/games-repo/38-Hextris/index.html' },
    { id: 'dark-room', name: 'A Dark Room', desc: 'A minimalist text adventure. The fire is dying.', cover: '/game-covers/dark-room.svg', cat: 'casual', reward: '80-320', plays: '12.6k', badge: 'new', bg: 'linear-gradient(135deg,#3a2a14,#000)', path: '/games-repo/40-A-Dark-Room/index.html' },
    { id: 'asteroids', name: 'Asteroids', desc: 'Survive the asteroid field in your vector ship.', cover: '/game-covers/asteroids.svg', cat: 'arcade', reward: '50-260', plays: '20.1k', badge: null, bg: 'linear-gradient(135deg,#141a3a,#000)', path: '/games-repo/41-Asteroids/index.html' },
    { id: 'particle-clicker', name: 'Particle Clicker', desc: 'Smash particles. Discover physics. Win Nobels.', cover: '/game-covers/particle-clicker.svg', cat: 'casual', reward: '40-200', plays: '8.3k', badge: null, bg: 'linear-gradient(135deg,#1a2a4a,#050814)', path: '/games-repo/42-Particle-Clicker/index.html' },
    { id: 'hexgl', name: 'HexGL', desc: 'Futuristic WebGL racing on neon hex tracks.', cover: '/game-covers/hexgl.svg', cat: 'arcade', reward: '80-350', plays: '15.9k', badge: 'hot', bg: 'linear-gradient(135deg,#4a1e6e,#ff8a3d)', path: '/games-repo/43-HexGL/index.html' },
    { id: 'ski-free', name: 'Ski Free', desc: 'Ski down the mountain. Dodge trees and the yeti.', cover: '/game-covers/ski-free.svg', cat: 'arcade', reward: '40-200', plays: '14.8k', badge: null, bg: 'linear-gradient(135deg,#aee4ff,#b8d4e8)', path: '/games-repo/45-Ski-Free/index.html' },
    { id: 'mario', name: 'Mario HTML5', desc: 'The plumber you know, in pure canvas JavaScript.', cover: '/game-covers/mario.svg', cat: 'arcade', reward: '70-320', plays: '42.1k', badge: 'hot', bg: 'linear-gradient(135deg,#5c94fc,#f09020)', path: '/games-repo/46-Mario-HTML5/main.html' },
    { id: 'alien-invasion', name: 'Alien Invasion', desc: 'Hold the cannon. Blast the alien waves back.', cover: '/game-covers/alien-invasion.svg', cat: 'arcade', reward: '40-200', plays: '11.6k', badge: null, bg: 'linear-gradient(135deg,#0a0520,#000)', path: '/games-repo/48-Alien-Invasion/index.html' },
    { id: 'arashi', name: 'Arashi', desc: 'Tempest-style vector shooter inside the tube.', cover: '/game-covers/arashi.svg', cat: 'arcade', reward: '60-260', plays: '7.9k', badge: null, bg: 'linear-gradient(135deg,#2a0540,#000)', path: '/games-repo/49-Arashi/arashi.html' },
    { id: 'captain-rogers', name: 'Captain Rogers', desc: 'Pilot through the asteroid belt to escape.', cover: '/game-covers/captain-rogers.svg', cat: 'arcade', reward: '45-180', plays: '9.4k', badge: null, bg: 'linear-gradient(135deg,#1a2a6a,#030512)', path: '/games-repo/50-Captain-Rogers/index.html' },
    { id: 'ball-and-wall', name: 'Ball And Wall', desc: 'Break every colored wall with the bouncing ball.', cover: '/game-covers/ball-and-wall.svg', cat: 'arcade', reward: '35-140', plays: '8.6k', badge: null, bg: 'linear-gradient(135deg,#0f1a40,#050918)', path: '/games-repo/51-Ball-And-Wall/index.html' },
    { id: 'save-the-forest', name: 'Save the Forest', desc: 'Douse the fires before the whole forest burns.', cover: '/game-covers/save-the-forest.svg', cat: 'casual', reward: '40-160', plays: '7.1k', badge: 'new', bg: 'linear-gradient(135deg,#ff7a3a,#3a0a0a)', path: '/games-repo/52-Save-The-Forest/dist/index.html' },
    { id: 'jolly-jumper', name: 'Jolly Jumper', desc: 'Spring higher and higher. Grab every coin.', cover: '/game-covers/jolly-jumper.svg', cat: 'arcade', reward: '30-150', plays: '10.3k', badge: null, bg: 'linear-gradient(135deg,#ffd96a,#ff8a3d)', path: '/games-repo/53-Jolly-Jumper/index.html' },
    { id: 'digger', name: 'Digger', desc: 'Dig for gems. Outrun the creatures underground.', cover: '/game-covers/digger.svg', cat: 'arcade', reward: '50-220', plays: '13.5k', badge: null, bg: 'linear-gradient(135deg,#1a0a04,#3a1a0a)', path: '/games-repo/54-Digger/index.html' },
    { id: 'coil', name: 'Coil', desc: 'Loop your trail around enemies to trap them.', cover: '/game-covers/coil.svg', cat: 'arcade', reward: '45-180', plays: '6.8k', badge: null, bg: 'linear-gradient(135deg,#0a1a40,#000)', path: '/games-repo/55-Coil/index.html' },
    { id: 'hexahedral', name: 'Hexahedral', desc: 'Flatten every isometric block. Minimum moves.', cover: '/game-covers/hexahedral.svg', cat: 'puzzle', reward: '70-260', plays: '5.9k', badge: null, bg: 'linear-gradient(135deg,#2a3a5a,#0a1020)', path: '/games-repo/56-Hexahedral/build/index.html' },
    { id: 'descensus', name: 'Descensus 2', desc: 'Swipe bars to guide the ball past saws.', cover: '/game-covers/descensus.svg', cat: 'arcade', reward: '40-180', plays: '8.2k', badge: null, bg: 'linear-gradient(135deg,#1a2a3a,#050810)', path: '/games-repo/57-Descensus/src/index.html' },
    { id: 'squirts', name: 'Squirts', desc: 'Absorb smaller bubbles. Dodge the bigger ones.', cover: '/game-covers/squirts.svg', cat: 'arcade', reward: '35-150', plays: '6.4k', badge: null, bg: 'linear-gradient(135deg,#1a3050,#050810)', path: '/games-repo/58-Squirts/index.html' },
    { id: 'astray', name: 'Astray', desc: 'Navigate the 3D ball-rolling maze to the goal.', cover: '/game-covers/astray.svg', cat: 'puzzle', reward: '60-240', plays: '9.8k', badge: 'new', bg: 'linear-gradient(135deg,#1a1a2e,#050510)', path: '/games-repo/60-Astray/index.html' },
    { id: 'orbium', name: 'Orbium', desc: 'Route orbiting balls into matching color goals.', cover: '/game-covers/orbium.svg', cat: 'puzzle', reward: '50-210', plays: '5.2k', badge: null, bg: 'linear-gradient(135deg,#1a2a4a,#020418)', path: '/games-repo/61-Orbium/index.html' },
    { id: 'zop', name: 'Zop', desc: 'Flip tiles. Clear the board in the fewest moves.', cover: '/game-covers/zop.svg', cat: 'puzzle', reward: '40-170', plays: '7.3k', badge: null, bg: 'linear-gradient(135deg,#2a1a4a,#0a0520)', path: '/games-repo/62-Zop/release/index.html' },
    { id: 'prism', name: 'Prism', desc: 'Bend light through prisms to hit every target.', cover: '/game-covers/prism.svg', cat: 'puzzle', reward: '50-200', plays: '6.7k', badge: null, bg: 'linear-gradient(135deg,#0a0a20,#000)', path: '/games-repo/63-Prism/index.html' },
    { id: 'emberwind', name: 'Emberwind', desc: 'Swing Kee\'s lantern through 3 action chapters.', cover: '/game-covers/emberwind.svg', cat: 'arcade', reward: '80-340', plays: '11.4k', badge: 'hot', bg: 'linear-gradient(135deg,#ffa540,#3a1010)', path: '/games-repo/66-Emberwind/index.html' },
    { id: 'swap', name: 'Swap', desc: 'Swap tiles to match the target pattern.', cover: '/game-covers/swap.svg', cat: 'puzzle', reward: '40-150', plays: '4.8k', badge: null, bg: 'linear-gradient(135deg,#1a3a5a,#050a18)', path: '/games-repo/68-Swap/index.html' },
    { id: 'roguish', name: 'Roguish', desc: 'Old-school ASCII roguelike. Descend. Don\'t die.', cover: '/game-covers/roguish.svg', cat: 'puzzle', reward: '70-300', plays: '5.6k', badge: null, bg: 'linear-gradient(135deg,#0a0a0a,#000)', path: '/games-repo/69-Roguish/index.html' },
    { id: 'bubble-shooter', name: 'Bubble Shooter', desc: 'Aim, shoot, match 3+ to pop the cluster.', cover: '/game-covers/bubble-shooter.svg', cat: 'arcade', reward: '50-220', plays: '24.6k', badge: 'hot', bg: 'linear-gradient(135deg,#172447,#070b1c)', path: '/games-repo/70-Bubble-Shooter/index.html' },
    { id: 'mahjong', name: 'Mahjong Solitaire', desc: 'Match exposed tile pairs to clear the stack.', cover: '/game-covers/mahjong.svg', cat: 'puzzle', reward: '60-260', plays: '13.8k', badge: 'new', bg: 'linear-gradient(135deg,#0a3a2a,#031a10)', path: '/games-repo/71-Mahjong-Solitaire/index.html' },
    { id: 'othello', name: 'Othello', desc: 'Flank to flip. Outscore the AI on 8x8.', cover: '/game-covers/othello.svg', cat: 'puzzle', reward: '70-280', plays: '11.2k', badge: null, bg: 'linear-gradient(135deg,#0a4020,#031808)', path: '/games-repo/72-Othello/index.html' },
    { id: 'lights-out', name: 'Lights Out', desc: 'Flip lights to turn them all off. Pure logic.', cover: '/game-covers/lights-out.svg', cat: 'puzzle', reward: '40-160', plays: '7.4k', badge: null, bg: 'linear-gradient(135deg,#0a1228,#06080f)', path: '/games-repo/73-Lights-Out/index.html' },
    { id: 'sokoban', name: 'Sokoban', desc: 'Push every crate onto a target. 8 levels.', cover: '/game-covers/sokoban.svg', cat: 'puzzle', reward: '70-300', plays: '9.5k', badge: 'hot', bg: 'linear-gradient(135deg,#1a1410,#0a0805)', path: '/games-repo/74-Sokoban/index.html' },
    { id: 'tron', name: 'Tron Lightcycles', desc: 'Trap the AI inside its own glowing trail.', cover: '/game-covers/tron.svg', cat: 'arcade', reward: '60-260', plays: '14.7k', badge: 'hot', bg: 'linear-gradient(135deg,#001020,#000)', path: '/games-repo/75-Tron-Lightcycles/index.html' },
    { id: 'frogger', name: 'Frogger', desc: 'Cross the road and ride logs to safe homes.', cover: '/game-covers/frogger.svg', cat: 'arcade', reward: '50-240', plays: '18.3k', badge: null, bg: 'linear-gradient(135deg,#0a3a6a,#1a4020)', path: '/games-repo/76-Frogger/index.html' },
    { id: 'space-invaders', name: 'Space Invaders', desc: 'Hold the line against descending alien waves.', cover: '/game-covers/space-invaders.svg', cat: 'arcade', reward: '60-280', plays: '32.1k', badge: 'hot', bg: 'linear-gradient(135deg,#000,#0a0518)', path: '/games-repo/77-Space-Invaders/index.html' },
    { id: 'missile-command', name: 'Missile Command', desc: 'Defend six cities from incoming missiles.', cover: '/game-covers/missile-command.svg', cat: 'arcade', reward: '60-260', plays: '8.9k', badge: null, bg: 'linear-gradient(135deg,#000,#1a0a04)', path: '/games-repo/78-Missile-Command/index.html' },
    { id: 'pinball', name: 'Pinball', desc: 'Flip the ball off bumpers. Don\'t drain.', cover: '/game-covers/pinball.svg', cat: 'arcade', reward: '70-340', plays: '21.5k', badge: 'hot', bg: 'linear-gradient(135deg,#2a1054,#0a0420)', path: '/games-repo/79-Pinball/index.html' },
    { id: 'match-3', name: 'Gem Match-3', desc: 'Swap gems to chain three or more in a row.', cover: '/game-covers/match-3.svg', cat: 'puzzle', reward: '60-240', plays: '26.4k', badge: null, bg: 'linear-gradient(135deg,#1a1040,#0a0420)', path: '/games-repo/80-Match-3/index.html' },
    { id: 'air-hockey', name: 'Air Hockey', desc: 'Slam the puck past the CPU. First to 7.', cover: '/game-covers/air-hockey.svg', cat: 'arcade', reward: '50-220', plays: '15.7k', badge: 'new', bg: 'linear-gradient(135deg,#0a1a2e,#020812)', path: '/games-repo/81-Air-Hockey/index.html' },
    { id: 'pool', name: '8-Ball Pool', desc: 'Aim, calibrate power, sink every ball.', cover: '/game-covers/pool-8-ball.svg', cat: 'arcade', reward: '70-320', plays: '28.9k', badge: 'hot', bg: 'linear-gradient(135deg,#1e8540,#5a3a18)', path: '/games-repo/82-Pool-8-Ball/index.html' },
    { id: 'yahtzee', name: 'Yahtzee', desc: 'Roll dice, pick categories, outscore yourself.', cover: '/game-covers/yahtzee.svg', cat: 'casual', reward: '50-220', plays: '12.8k', badge: null, bg: 'linear-gradient(135deg,#1a1040,#06081a)', path: '/games-repo/83-Yahtzee/index.html' },
    { id: 'checkers', name: 'Checkers', desc: 'Capture diagonally. Crown your kings. Beat AI.', cover: '/game-covers/checkers.svg', cat: 'puzzle', reward: '60-260', plays: '19.2k', badge: null, bg: 'linear-gradient(135deg,#5a3a18,#1a1208)', path: '/games-repo/84-Checkers/index.html' },
    { id: 'word-search', name: 'Word Search', desc: 'Hunt hidden words across the letter grid.', cover: '/game-covers/word-search.svg', cat: 'casual', reward: '40-180', plays: '11.4k', badge: null, bg: 'linear-gradient(135deg,#06081a,#0a1228)', path: '/games-repo/85-Word-Search/index.html' },
    { id: 'tower-defense', name: 'Tower Defense', desc: 'Build towers to stop the wave from breaking through.', cover: '/game-covers/tower-defense.svg', cat: 'puzzle', reward: '80-360', plays: '23.6k', badge: 'hot', bg: 'linear-gradient(135deg,#1a3a1a,#0a1408)', path: '/games-repo/86-Tower-Defense/index.html' },
    { id: 'bomberman', name: 'Bomberman', desc: 'Plant bombs, blow up bricks, hunt enemies.', cover: '/game-covers/bomberman.svg', cat: 'arcade', reward: '60-260', plays: '17.8k', badge: null, bg: 'linear-gradient(135deg,#2a4a1a,#1a3010)', path: '/games-repo/87-Bomberman/index.html' },
    { id: 'galaga', name: 'Galaga', desc: 'Formation shooter with diving alien attacks.', cover: '/game-covers/galaga.svg', cat: 'arcade', reward: '70-320', plays: '20.1k', badge: 'hot', bg: 'linear-gradient(135deg,#000,#0a0518)', path: '/games-repo/88-Galaga/index.html' },
    { id: 'centipede', name: 'Centipede', desc: 'Blast the snake through mushrooms. Watch the spider.', cover: '/game-covers/centipede.svg', cat: 'arcade', reward: '60-280', plays: '11.6k', badge: null, bg: 'linear-gradient(135deg,#000,#0a040a)', path: '/games-repo/89-Centipede/index.html' },
    { id: 'lode-climber', name: 'Lode Climber', desc: 'Dig holes to trap enemies. Collect every gold.', cover: '/game-covers/lode-climber.svg', cat: 'arcade', reward: '70-300', plays: '8.4k', badge: null, bg: 'linear-gradient(135deg,#0a0810,#1a0a04)', path: '/games-repo/90-Lode-Climber/index.html' },
    { id: 'barrel-climb', name: 'Barrel Climb', desc: 'Dodge rolling barrels. Reach the top.', cover: '/game-covers/barrel-climb.svg', cat: 'arcade', reward: '50-240', plays: '14.2k', badge: 'new', bg: 'linear-gradient(135deg,#1a0a20,#000)', path: '/games-repo/91-Barrel-Climb/index.html' },
    { id: 'battleship', name: 'Battleship', desc: 'Place your fleet, hunt the enemy. Don\'t miss.', cover: '/game-covers/battleship.svg', cat: 'puzzle', reward: '60-280', plays: '13.9k', badge: null, bg: 'linear-gradient(135deg,#0a1830,#020a18)', path: '/games-repo/92-Battleship/index.html' },
    { id: 'n-queens', name: 'N-Queens', desc: 'Place 6, 8, or 10 queens with no conflicts.', cover: '/game-covers/n-queens.svg', cat: 'puzzle', reward: '60-260', plays: '5.8k', badge: null, bg: 'linear-gradient(135deg,#1a1408,#5a3a18)', path: '/games-repo/93-N-Queens/index.html' },
    { id: '0h-h1', name: '0h h1', desc: 'Binary Sudoku. Three rules. Pure deduction.', cover: '/game-covers/0h-h1.svg', cat: 'puzzle', reward: '50-220', plays: '6.7k', badge: 'new', bg: 'linear-gradient(135deg,#0a1228,#06080f)', path: '/games-repo/94-0h-h1/index.html' },
    { id: 'reaction', name: 'Reaction Test', desc: 'Wait for green. Click. Beat your reflex record.', cover: '/game-covers/reaction.svg', cat: 'casual', reward: '20-80', plays: '18.5k', badge: null, bg: 'linear-gradient(135deg,#1ea050,#0a4020)', path: '/games-repo/95-Reaction-Test/index.html' },
    { id: 'color-mix', name: 'Color Mix', desc: 'Match the target with R-G-B sliders. Eye-train.', cover: '/game-covers/color-mix.svg', cat: 'casual', reward: '30-150', plays: '7.9k', badge: null, bg: 'linear-gradient(135deg,#0a0418,#1a0a30)', path: '/games-repo/96-Color-Mix/index.html' },
    { id: 'mancala', name: 'Mancala', desc: 'Sow your stones. Capture. Out-strategize the CPU.', cover: '/game-covers/mancala.svg', cat: 'puzzle', reward: '50-220', plays: '8.3k', badge: null, bg: 'linear-gradient(135deg,#1a0e08,#5a3a18)', path: '/games-repo/97-Mancala/index.html' },
    { id: 'word-hunt', name: 'Word Hunt', desc: 'Trace adjacent letters into words. Beat the clock.', cover: '/game-covers/word-hunt.svg', cat: 'casual', reward: '60-280', plays: '16.1k', badge: 'hot', bg: 'linear-gradient(135deg,#0a0a18,#1a1f4a)', path: '/games-repo/98-Word-Hunt/index.html' },
    { id: 'mini-rogue', name: 'Mini Rogue', desc: 'Procedural dungeon. Hunt gold. Avoid death.', cover: '/game-covers/mini-rogue.svg', cat: 'puzzle', reward: '80-360', plays: '6.4k', badge: 'new', bg: 'linear-gradient(135deg,#000,#0a0810)', path: '/games-repo/99-Mini-Rogue/index.html' },
  ];

  const FILTERS = [
    { cat: 'all', label: 'All Games', count: 91 },
    { cat: 'puzzle', label: '🧩 Puzzle', count: 30 },
    { cat: 'arcade', label: '🕹️ Arcade', count: 42 },
    { cat: 'casual', label: '☕ Casual', count: 19 },
  ];

  let filteredGames = $derived(
    activeFilter === 'all' ? GAMES : GAMES.filter((g) => g.cat === activeFilter)
  );
</script>

<svelte:window onkeydown={onKeydown} />

<svelte:head>
  <title>Play & Earn — EarnMaze</title>
  <meta name="description" content="Play fun HTML5 games on EarnMaze and earn real rewards." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html `<style>
  *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
  :root{
    --bg:#0b1020;--bg2:#10172b;--bg3:#121c33;
    --sf1:rgba(255,255,255,.03);--sf2:rgba(255,255,255,.06);--sf3:rgba(255,255,255,.09);
    --gl:rgba(255,255,255,.04);--gl-b:rgba(255,255,255,.07);
    --t1:#f5f5fa;--t2:#8888a0;--t3:#5c5c72;
    --green:#35d39a;--gg:rgba(53,211,154,.16);
    --blue:#56a8ff;--bg-b:rgba(86,168,255,.14);
    --orange:#ff8a3d;--og:rgba(255,138,61,.14);
    --purple:#8f7cff;--pg:rgba(143,124,255,.14);
    --pink:#ff5f8f;--yellow:#ffd166;--red:#ff5d73;
    --grad:linear-gradient(135deg,#35d39a,#56a8ff,#8f7cff);
    --grad3:linear-gradient(135deg,#35d39a,#56a8ff);
    --grad-game:linear-gradient(135deg,#0f1730,#101b34,#0d2025);
    --r1:8px;--r2:12px;--r3:16px;--r4:20px;--r5:60px;
    --sh2:0 8px 32px rgba(0,0,0,.3);--sh3:0 24px 64px rgba(0,0,0,.4);
    --f:'Inter',system-ui,sans-serif;--mono:'JetBrains Mono',monospace;
    --ease:cubic-bezier(.16,1,.3,1);
  }
  html{font-size:16px;scroll-behavior:smooth}
  body{background:var(--bg);color:var(--t1);font-family:var(--f);overflow-x:hidden;line-height:1.65;-webkit-font-smoothing:antialiased;min-height:100vh}
  a{text-decoration:none;color:inherit}
  button{font-family:var(--f);cursor:pointer;border:none;background:none;color:inherit}
  ::selection{background:var(--green);color:#000}
  body::before{content:'';position:fixed;top:-200px;right:-200px;width:600px;height:600px;background:radial-gradient(circle,rgba(53,211,154,.08),transparent 70%);border-radius:50%;pointer-events:none;z-index:0}
  body::after{content:'';position:fixed;bottom:-300px;left:-200px;width:700px;height:700px;background:radial-gradient(circle,rgba(143,124,255,.07),transparent 70%);border-radius:50%;pointer-events:none;z-index:0}
  .container{max-width:1240px;margin:0 auto;padding:0 24px;position:relative;z-index:2}
  .grad-text{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}

  /* NAV */
  .ge-nav{position:sticky;top:0;z-index:100;padding:14px 0;background:rgba(6,6,11,.82);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-bottom:1px solid rgba(255,255,255,.06)}
  .ge-nav .container{display:flex;align-items:center;justify-content:space-between;gap:16px}
  .logo{display:flex;align-items:center;gap:11px;font-weight:800;font-size:1.25rem;letter-spacing:-.6px}
  .logo-mark{width:38px;height:38px;background:var(--grad);border-radius:11px;display:grid;place-items:center;position:relative;flex-shrink:0}
  .logo-mark::after{content:'';position:absolute;inset:2px;background:var(--bg);border-radius:9px}
  .logo-mark svg{width:19px;height:19px;position:relative;z-index:1;fill:none;stroke:var(--green);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
  .nav-links{display:flex;align-items:center;gap:26px}
  .nav-links a{font-size:.85rem;font-weight:500;color:var(--t2);transition:color .25s;position:relative}
  .nav-links a:hover,.nav-links a.active{color:var(--t1)}
  .nav-links a.active::after{content:'';position:absolute;bottom:-6px;left:0;right:0;height:2px;background:var(--green);border-radius:2px}
  .nav-right{display:flex;gap:10px;align-items:center}
  .nav-coins{display:flex;align-items:center;gap:6px;padding:8px 14px;background:var(--sf2);border:1px solid var(--gl-b);border-radius:var(--r5);font-family:var(--mono);font-size:.78rem;font-weight:700;color:var(--yellow)}
  .btn{display:inline-flex;align-items:center;gap:8px;padding:10px 22px;font-weight:700;font-size:.82rem;border-radius:var(--r5);cursor:pointer;transition:all .3s var(--ease);border:none;letter-spacing:-.2px;white-space:nowrap}
  .btn-o{background:transparent;border:1.5px solid rgba(255,255,255,.15);color:var(--t1)}
  .btn-o:hover{border-color:rgba(255,255,255,.35);background:rgba(255,255,255,.05)}

  /* HERO */
  .hero{padding:60px 0 30px;position:relative}
  .hero-label{font-family:var(--mono);font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:var(--green);margin-bottom:16px;display:flex;align-items:center;gap:10px}
  .hero-label::before{content:'';width:24px;height:2px;background:var(--green);border-radius:2px}
  .hero h1{font-size:clamp(2.2rem,5.5vw,3.6rem);font-weight:800;letter-spacing:-2px;line-height:1.05;margin-bottom:16px}
  .hero p{font-size:1.05rem;color:var(--t2);max-width:560px;line-height:1.7}

  /* STATS */
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:40px}
  .stat-card{background:linear-gradient(180deg,var(--sf2),var(--sf1));border:1px solid var(--gl-b);border-radius:var(--r3);padding:20px;position:relative;overflow:hidden;transition:all .3s var(--ease)}
  .stat-card:hover{transform:translateY(-3px);border-color:rgba(255,255,255,.14)}
  .stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;opacity:.7}
  .stat-card.c-green::before{background:var(--green)}.stat-card.c-yellow::before{background:var(--yellow)}
  .stat-card.c-orange::before{background:var(--orange)}.stat-card.c-purple::before{background:var(--purple)}
  .stat-ic{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;margin-bottom:12px;font-size:1.1rem}
  .stat-v{font-family:var(--mono);font-size:1.6rem;font-weight:800;color:var(--t1);letter-spacing:-1px;line-height:1}
  .stat-l{font-size:.78rem;color:var(--t2);margin-top:6px;font-weight:500}

  /* FILTERS */
  .filters-wrap{padding:30px 0 8px;position:sticky;top:68px;z-index:50;background:linear-gradient(180deg,var(--bg) 70%,transparent)}
  .filters{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;scrollbar-width:none}
  .filters::-webkit-scrollbar{display:none}
  .filter{padding:10px 18px;background:var(--sf2);border:1px solid var(--gl-b);border-radius:var(--r5);font-size:.82rem;font-weight:600;color:var(--t2);cursor:pointer;transition:all .25s;white-space:nowrap;display:inline-flex;align-items:center;gap:6px}
  .filter:hover{color:var(--t1);background:var(--sf3)}
  .filter.active{background:var(--green);color:#060b08;border-color:var(--green)}
  .filter .count{font-family:var(--mono);font-size:.7rem;opacity:.7}

  /* GAMES GRID */
  .games-section{padding:20px 0 80px}
  .games-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
  .game-card{background:var(--grad-game);border:1px solid var(--gl-b);border-radius:var(--r3);overflow:hidden;cursor:pointer;transition:all .4s var(--ease);position:relative;display:flex;flex-direction:column;animation:cardIn .5s var(--ease) backwards}
  .game-card:hover{transform:translateY(-6px);border-color:rgba(53,211,154,.3);box-shadow:var(--sh3)}
  .game-thumb{height:180px;position:relative;overflow:hidden;display:grid;place-items:center;padding:16px}
  .game-thumb::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at 30% 20%,rgba(255,255,255,.1),transparent 50%);pointer-events:none}
  .game-cover{width:100%;height:100%;object-fit:contain;z-index:1;transition:transform .5s var(--ease);filter:drop-shadow(0 8px 24px rgba(0,0,0,.3))}
  .game-card:hover .game-cover{transform:scale(1.08)}
  .play-badge{position:absolute;top:12px;right:12px;backdrop-filter:blur(12px);padding:5px 10px;border-radius:var(--r5);font-size:.7rem;font-weight:700;display:flex;align-items:center;gap:4px;z-index:2}
  .play-badge.hot{background:var(--orange);color:#fff}
  .play-badge.new{background:var(--green);color:#060b08}
  .game-info{padding:18px 18px 20px;flex:1;display:flex;flex-direction:column}
  .game-name{font-size:1.05rem;font-weight:700;letter-spacing:-.3px;margin-bottom:4px}
  .game-desc{font-size:.82rem;color:var(--t2);line-height:1.5;margin-bottom:12px;flex:1}
  .game-meta{display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid var(--gl-b)}
  .game-reward{display:flex;align-items:center;gap:5px;font-family:var(--mono);font-size:.78rem;font-weight:700;color:var(--yellow)}
  .game-play-btn{background:var(--green);color:#060b08;padding:7px 16px;border-radius:var(--r5);font-size:.76rem;font-weight:700;display:inline-flex;align-items:center;gap:4px;transition:all .25s var(--ease);border:none;cursor:pointer}
  .game-play-btn:hover{box-shadow:0 0 0 3px var(--gg);transform:translateY(-1px)}
  @keyframes cardIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  .game-card:nth-child(1){animation-delay:.03s}.game-card:nth-child(2){animation-delay:.06s}
  .game-card:nth-child(3){animation-delay:.09s}.game-card:nth-child(4){animation-delay:.12s}
  .game-card:nth-child(5){animation-delay:.15s}.game-card:nth-child(6){animation-delay:.18s}
  .game-card:nth-child(7){animation-delay:.21s}.game-card:nth-child(8){animation-delay:.24s}
  .game-card:nth-child(9){animation-delay:.27s}.game-card:nth-child(10){animation-delay:.30s}
  .game-card:nth-child(11){animation-delay:.33s}.game-card:nth-child(12){animation-delay:.36s}
  .game-card:nth-child(13){animation-delay:.39s}.game-card:nth-child(14){animation-delay:.42s}
  .game-card:nth-child(15){animation-delay:.45s}.game-card:nth-child(16){animation-delay:.48s}
  .game-card:nth-child(17){animation-delay:.51s}.game-card:nth-child(18){animation-delay:.54s}
  .game-card:nth-child(19){animation-delay:.57s}.game-card:nth-child(20){animation-delay:.60s}
  .game-card:nth-child(21){animation-delay:.63s}.game-card:nth-child(22){animation-delay:.66s}
  .game-card:nth-child(23){animation-delay:.69s}.game-card:nth-child(24){animation-delay:.72s}
  .game-card:nth-child(n+25){animation-delay:.75s}

  /* MODAL */
  .modal-overlay{position:fixed;inset:0;background:var(--bg);z-index:1000;display:flex;padding:0;animation:fadeIn .25s var(--ease)}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .modal{background:var(--bg2);border:none;border-radius:0;width:100%;height:100%;max-width:100%;max-height:100%;display:flex;flex-direction:column;overflow:hidden;box-shadow:none;animation:slideUp .25s var(--ease)}
  @keyframes slideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
  .modal-head{padding:14px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--gl-b);background:var(--sf1);flex-shrink:0}
  .modal-head-l{display:flex;align-items:center;gap:12px;min-width:0}
  .modal-ic{width:40px;height:40px;border-radius:10px;display:grid;place-items:center;font-size:1.3rem;flex-shrink:0}
  .modal-title{font-size:1rem;font-weight:700;letter-spacing:-.3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .modal-sub{font-size:.72rem;color:var(--t2);font-family:var(--mono);margin-top:2px}
  .modal-close{width:36px;height:36px;border-radius:10px;background:var(--sf2);display:grid;place-items:center;cursor:pointer;transition:all .25s;border:1px solid var(--gl-b);flex-shrink:0}
  .modal-close:hover{background:var(--red);border-color:var(--red)}
  .modal-close svg{width:16px;height:16px;stroke:var(--t1);fill:none;stroke-width:2.5;stroke-linecap:round}
  .game-iframe{flex:1;border:none;width:100%;height:100%;background:#fff;border-radius:0}

  /* RESPONSIVE */
  @media(max-width:1100px){
    .games-grid{grid-template-columns:repeat(3,1fr)}
  }
  @media(max-width:900px){
    .nav-links{display:none}
    .stats{grid-template-columns:repeat(2,1fr)}
    .hero{padding:40px 0 20px}
    .games-grid{grid-template-columns:repeat(2,1fr)}
    .modal{border-radius:0}
  }
  @media(max-width:600px){
    .container{padding:0 16px}
    .nav-coins{padding:7px 10px;font-size:.72rem}
    .btn{padding:8px 16px;font-size:.75rem}
    .stat-card{padding:16px}.stat-v{font-size:1.35rem}
    .games-grid{grid-template-columns:1fr;gap:14px}
    .game-thumb{height:140px}.game-emoji{font-size:3.8rem}
    .modal{border-radius:0}
    .modal-head{padding:12px 16px}
  }
  </style>`}
</svelte:head>

<nav class="ge-nav">
  <div class="container">
    <a href="/" class="logo">
      <span class="logo-mark"><svg viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg></span>
      EarnMaze
    </a>
    <div class="nav-links">
      <a href="/">Home</a>
      <a href="/#earn">Ways to Earn</a>
      <a href="/games" class="active">Play</a>
      <a href="/#streaks">Streaks</a>
      <a href="/#quizzes">Quizzes</a>
    </div>
    <div class="nav-right">
      <div class="nav-coins"><span>🪙</span> 2,480</div>
      <a href="/dashboard" class="btn btn-o">Dashboard</a>
    </div>
  </div>
</nav>

<section class="hero">
  <div class="container">
    <div class="hero-label">Play & Earn</div>
    <h1>Real games. <span class="grad-text">Real rewards.</span></h1>
    <p>Level up in bite-sized HTML5 games and turn idle minutes into real money. No downloads, no nonsense — just tap and earn.</p>
    <div class="stats">
      <div class="stat-card c-green">
        <div class="stat-ic" style="background:var(--gg)">🎮</div>
        <div class="stat-v">91</div>
        <div class="stat-l">Games available</div>
      </div>
      <div class="stat-card c-yellow">
        <div class="stat-ic" style="background:rgba(255,209,102,.14)">🪙</div>
        <div class="stat-v">0</div>
        <div class="stat-l">Points earned today</div>
      </div>
      <div class="stat-card c-orange">
        <div class="stat-ic" style="background:var(--og)">🔥</div>
        <div class="stat-v">7</div>
        <div class="stat-l">Day streak</div>
      </div>
      <div class="stat-card c-purple">
        <div class="stat-ic" style="background:var(--pg)">🏆</div>
        <div class="stat-v">#842</div>
        <div class="stat-l">Weekly rank</div>
      </div>
    </div>
  </div>
</section>

<div class="filters-wrap">
  <div class="container">
    <div class="filters">
      {#each FILTERS as f (f.cat)}
        <button
          class="filter"
          class:active={activeFilter === f.cat}
          onclick={() => (activeFilter = f.cat)}
        >
          {f.label} <span class="count">{f.count}</span>
        </button>
      {/each}
    </div>
  </div>
</div>

<section class="games-section">
  <div class="container">
    <div class="games-grid">
      {#each filteredGames as game (game.id)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="game-card" onclick={() => (openGame = game)}>
          <div class="game-thumb" style="background:{game.bg}">
            <img class="game-cover" src={game.cover} alt={game.name} />
            {#if game.badge === 'hot'}
              <div class="play-badge hot">🔥 HOT</div>
            {:else if game.badge === 'new'}
              <div class="play-badge new">✨ NEW</div>
            {/if}
          </div>
          <div class="game-info">
            <div class="game-name">{game.name}</div>
            <div class="game-desc">{game.desc}</div>
            <div class="game-meta">
              <div class="game-reward"><span>🪙</span> {game.reward} pts</div>
              <button class="game-play-btn">Play ▶</button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

{#if openGame}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
    <div class="modal">
      <div class="modal-head">
        <div class="modal-head-l">
          <div class="modal-ic" style="background:var(--gg)">{openGame.emoji}</div>
          <div>
            <div class="modal-title">{openGame.name}</div>
            <div class="modal-sub">Earn {openGame.reward} points</div>
          </div>
        </div>
        <button class="modal-close" onclick={closeModal} aria-label="Close game">
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>
      <iframe
        class="game-iframe"
        src={openGame.path}
        title={openGame.name}
      ></iframe>
    </div>
  </div>
{/if}
