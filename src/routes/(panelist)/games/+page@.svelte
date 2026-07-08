<script lang="ts">
  import { onMount } from 'svelte';
  import { persistState } from '$lib/utils/iframe-state';

  type UploadedGame = { id: string; title: string; file: string; thumb?: string };
  let { data } = $props<{ data: { todaysGame: UploadedGame | null } }>();

  // The modal only needs name/path/reward; allow both catalog games and the uploaded pick.
  type PlayableGame = { id: string; name: string; path: string; reward: string; thumb?: string | null };

  let activeFilter = $state('all');
  let sortBy = $state('popular');
  let openGame = $state<PlayableGame | null>(null);
  let faqOpen = $state<number>(0);
  let resetCountdown = $state('00:00:00');

  onMount(() => {
    const nav = document.getElementById('nav');
    const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll);

    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(24, 0, 0, 0);
      let s = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
      const h = String(Math.floor(s / 3600)).padStart(2, '0');
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      const sec = String(s % 60).padStart(2, '0');
      resetCountdown = `${h}:${m}:${sec}`;
    };
    tick();
    const timer = setInterval(tick, 1000);

    return () => {
      window.removeEventListener('scroll', onScroll);
      clearInterval(timer);
    };
  });

  $effect(() => {
    if (openGame) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });

  function closeModal() { openGame = null; }
  function toggleFaq(i: number) { faqOpen = faqOpen === i ? -1 : i; }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && openGame) closeModal();
  }

  const GAMES = [
    { id: 'candy-crush', name: 'Candy Crush', desc: 'Match colorful candies in this addictive puzzle game.', cover: '/game-covers/candy-crush.svg', cat: 'puzzle', diff: 'easy', time: '3 min', reward: '50-150', rating: 4.8, plays: '1,322', badge: 'hot', bg: 'linear-gradient(135deg,#ff5f8f,#ff8a3d)', path: '/games-repo/01-Candy-Crush-Game/index.html' },
    { id: 'pac-man', name: 'Pac-Man', desc: 'Navigate the maze, eat dots, avoid ghosts.', cover: '/game-covers/pac-man.svg', cat: 'arcade', diff: 'medium', time: '5 min', reward: '60-200', rating: 4.9, plays: '2,071', badge: 'hot', bg: 'linear-gradient(135deg,#ffd166,#ff8a3d)', path: '/games-repo/02-Pac-Man-Game/index.html' },
    { id: 'doodle-jump', name: 'Doodle Jump', desc: 'Bounce higher and higher on platforms.', cover: '/game-covers/doodle-jump.svg', cat: 'arcade', diff: 'easy', time: '2 min', reward: '40-180', rating: 4.7, plays: '903', badge: null, bg: 'linear-gradient(135deg,#35d39a,#56a8ff)', path: '/games-repo/04-Doodle-Jump-Game/index.html' },
    { id: 'solitaire', name: 'Solitaire', desc: 'The classic card game. Stack them all.', cover: '/game-covers/solitaire.svg', cat: 'casual', diff: 'easy', time: '7 min', reward: '30-120', rating: 4.8, plays: '569', badge: null, bg: 'linear-gradient(135deg,#1e8560,#35d39a)', path: '/games-repo/05-Solitaire-Game/index.html' },
    { id: 'sudoku', name: 'Sudoku', desc: 'Fill the 9×9 grid with logic. No guessing.', cover: '/game-covers/sudoku.svg', cat: 'puzzle', diff: 'hard', time: '15 min', reward: '80-250', rating: 4.6, plays: '446', badge: null, bg: 'linear-gradient(135deg,#56a8ff,#8f7cff)', path: '/games-repo/06-Sudoku-Game/index.html' },
    { id: 'crossy-road', name: 'Crossy Road', desc: 'Cross busy roads and rivers without getting hit.', cover: '/game-covers/crossy-road.svg', cat: 'arcade', diff: 'medium', time: '3 min', reward: '50-200', rating: 4.8, plays: '762', badge: 'new', bg: 'linear-gradient(135deg,#35d39a,#1e8560)', path: '/games-repo/07-Crossy-Road-Game/index.html' },
    { id: 'rps', name: 'Rock Paper Scissors', desc: 'The ultimate showdown. Best of 5 wins.', cover: '/game-covers/rps.svg', cat: 'casual', diff: 'easy', time: '2 min', reward: '20-60', rating: 4.5, plays: '1,875', badge: 'hot', bg: 'linear-gradient(135deg,#8f7cff,#ff5f8f)', path: '/games-repo/08-Rock-Paper-Scissors/index.html' },
    { id: 'flappy-bird', name: 'Flappy Bird', desc: 'Tap to fly through pipes. How far can you go?', cover: '/game-covers/flappy-bird.svg', cat: 'arcade', diff: 'hard', time: '3 min', reward: '50-500', rating: 4.7, plays: '3,093', badge: 'hot', bg: 'linear-gradient(135deg,#56a8ff,#35d39a)', path: '/games-repo/09-Flappy-Bird-Game/index.html' },
    { id: '2048', name: '2048', desc: 'Merge tiles to reach the legendary 2048.', cover: '/game-covers/2048.svg', cat: 'puzzle', diff: 'medium', time: '8 min', reward: '100-300', rating: 4.8, plays: '721', badge: null, bg: 'linear-gradient(135deg,#ff8a3d,#ffd166)', path: '/games-repo/10-2048-Game/index.html' },
    { id: 'wordle', name: 'Wordle', desc: 'Six tries. Five letters. One word a day.', cover: '/game-covers/wordle.svg', cat: 'puzzle', diff: 'medium', time: '5 min', reward: '100-300', rating: 4.9, plays: '4,201', badge: null, bg: 'linear-gradient(135deg,#35d39a,#ffd166)', path: '/games-repo/11-Wordle-Game/index.html' },
    { id: 'hangman', name: 'Hangman', desc: 'Guess the word before you run out of tries.', cover: '/game-covers/hangman.svg', cat: 'casual', diff: 'easy', time: '4 min', reward: '40-140', rating: 4.5, plays: '1,144', badge: null, bg: 'linear-gradient(135deg,#5c5c72,#8f7cff)', path: '/games-repo/12-Hangman-Game/index.html' },
    { id: 'tetris', name: 'Tetris', desc: 'Stack the blocks. Clear the lines. Keep going.', cover: '/game-covers/tetris.svg', cat: 'arcade', diff: 'medium', time: '8 min', reward: '90-400', rating: 4.9, plays: '3,408', badge: 'hot', bg: 'linear-gradient(135deg,#ff5f8f,#8f7cff)', path: '/games-repo/20-Tetris-Game/index.html' },
    { id: 'connect-four', name: 'Connect Four', desc: 'Drop discs and connect four in a row to win.', cover: '/game-covers/connect-four.svg', cat: 'casual', diff: 'easy', time: '4 min', reward: '30-90', rating: 4.4, plays: '848', badge: null, bg: 'linear-gradient(135deg,#ff5d73,#ffd166)', path: '/games-repo/25-Connect-Four-Game/index.html' },
    { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', desc: 'Beat the AI. Three in a row wins it.', cover: '/game-covers/tic-tac-toe.svg', cat: 'casual', diff: 'easy', time: '2 min', reward: '25-75', rating: 4.3, plays: '1,289', badge: null, bg: 'linear-gradient(135deg,#56a8ff,#8f7cff)', path: '/games-repo/15-Tic-Tac-Toe/index.html' },
    { id: 'snake', name: 'Snake', desc: 'The classic. Eat, grow, avoid yourself.', cover: '/game-covers/snake.svg', cat: 'arcade', diff: 'medium', time: '5 min', reward: '30-200', rating: 4.7, plays: '2,452', badge: null, bg: 'linear-gradient(135deg,#35d39a,#1e8560)', path: '/games-repo/24-Snake-Game/index.html' },
    { id: 'memory', name: 'Memory Cards', desc: 'Flip cards, match pairs, train your brain.', cover: '/game-covers/memory.svg', cat: 'puzzle', diff: 'easy', time: '4 min', reward: '50-150', rating: 4.5, plays: '624', badge: 'new', bg: 'linear-gradient(135deg,#8f7cff,#56a8ff)', path: '/games-repo/22-Memory-Card-Game/index.html' },
    { id: 'chess', name: 'Chess', desc: 'Outsmart the board in the classic strategy duel.', cover: '/game-covers/chess.svg', cat: 'puzzle', diff: 'hard', time: '20 min', reward: '100-400', rating: 4.9, plays: '1,033', badge: null, bg: 'linear-gradient(135deg,#8c6242,#3a2817)', path: '/games-repo/03-Chess-Game/index.html' },
    { id: 'tower-blocks', name: 'Tower Blocks', desc: 'Stack blocks perfectly. How high can you go?', cover: '/game-covers/tower-blocks.svg', cat: 'arcade', diff: 'medium', time: '4 min', reward: '40-220', rating: 4.6, plays: '1,267', badge: 'new', bg: 'linear-gradient(135deg,#4a6dbf,#1f2966)', path: '/games-repo/13-Tower-Blocks/index.html' },
    { id: 'archery', name: 'Archery', desc: 'Aim, draw, release. Hit the bullseye every time.', cover: '/game-covers/archery.svg', cat: 'arcade', diff: 'medium', time: '5 min', reward: '60-260', rating: 4.6, plays: '878', badge: null, bg: 'linear-gradient(135deg,#ea3b3b,#7fb5f7)', path: '/games-repo/14-Archery-Game/index.html' },
    { id: 'minesweeper', name: 'Minesweeper', desc: 'Clear the board without stepping on mines.', cover: '/game-covers/minesweeper.svg', cat: 'puzzle', diff: 'hard', time: '10 min', reward: '80-280', rating: 4.7, plays: '762', badge: null, bg: 'linear-gradient(135deg,#4a556b,#1a1e2e)', path: '/games-repo/16-Minesweeper-Game/index.html' },
    { id: 'speed-typing', name: 'Speed Typing', desc: 'Type the quote fast. Track your real WPM.', cover: '/game-covers/speed-typing.svg', cat: 'casual', diff: 'medium', time: '3 min', reward: '30-150', rating: 4.4, plays: '519', badge: null, bg: 'linear-gradient(135deg,#151a2e,#0b0f1f)', path: '/games-repo/17-Speed-Typing-Game/index.html' },
    { id: 'breakout', name: 'Breakout', desc: "Smash every brick. Don't drop the ball.", cover: '/game-covers/breakout.svg', cat: 'arcade', diff: 'medium', time: '6 min', reward: '50-220', rating: 4.6, plays: '1,135', badge: null, bg: 'linear-gradient(135deg,#1a2040,#0a0e27)', path: '/games-repo/18-Breakout-Game/index.html' },
    { id: 'ping-pong', name: 'Ping Pong', desc: 'Rally the ball past the CPU. First to 11.', cover: '/game-covers/ping-pong.svg', cat: 'arcade', diff: 'medium', time: '4 min', reward: '40-180', rating: 4.5, plays: '946', badge: null, bg: 'linear-gradient(135deg,#0c1226,#000)', path: '/games-repo/19-Ping-Pong-Game/index.html' },
    { id: 'tilting-maze', name: 'Tilting Maze', desc: 'Tilt the board. Roll the ball to the goal.', cover: '/game-covers/tilting-maze.svg', cat: 'puzzle', diff: 'medium', time: '5 min', reward: '60-220', rating: 4.5, plays: '418', badge: 'new', bg: 'linear-gradient(135deg,#1a1d40,#0a0c20)', path: '/games-repo/21-Tilting-Maze-Game/index.html' },
    { id: 'number-guess', name: 'Number Guess', desc: 'Guess the secret number in 10 tries.', cover: '/game-covers/number-guess.svg', cat: 'casual', diff: 'easy', time: '2 min', reward: '25-90', rating: 4.2, plays: '627', badge: null, bg: 'linear-gradient(135deg,#1e2766,#0a0e27)', path: '/games-repo/23-Type-Number-Guessing-Game/index.html' },
    { id: 'insect-catch', name: 'Insect Catch', desc: 'Tap bugs before they escape. Fast reflexes win.', cover: '/game-covers/insect-catch.svg', cat: 'arcade', diff: 'easy', time: '3 min', reward: '35-160', rating: 4.4, plays: '353', badge: null, bg: 'linear-gradient(135deg,#5bbd5b,#1d4f1d)', path: '/games-repo/26-Insect-Catch-Game/index.html' },
    { id: 'word-rush', name: 'Word Rush', desc: 'Type each word before time runs out.', cover: '/game-covers/word-rush.svg', cat: 'casual', diff: 'medium', time: '3 min', reward: '30-160', rating: 4.5, plays: '485', badge: null, bg: 'linear-gradient(135deg,#1c1040,#0a061a)', path: '/games-repo/27-Typing-Game/index.html' },
    { id: 'dice-roll', name: 'Dice Roller', desc: 'Shake, roll and hit your lucky combo.', cover: '/game-covers/dice-roll.svg', cat: 'casual', diff: 'easy', time: '1 min', reward: '20-60', rating: 4.1, plays: '272', badge: null, bg: 'linear-gradient(135deg,#3a1d4a,#0a051a)', path: '/games-repo/28-Dice-Roll-Simulator/index.html' },
    { id: 'shape-clicker', name: 'Shape Clicker', desc: 'Tap only the target shape. Build your combo.', cover: '/game-covers/shape-clicker.svg', cat: 'arcade', diff: 'easy', time: '2 min', reward: '30-140', rating: 4.3, plays: '264', badge: null, bg: 'linear-gradient(135deg,#0c1a3a,#1a2d5c)', path: '/games-repo/29-Shape-Clicker-Game/index.html' },
    { id: 'voice-guess', name: 'Voice Guess', desc: 'Speak your guess. Find the hidden number.', cover: '/game-covers/voice-guess.svg', cat: 'casual', diff: 'medium', time: '3 min', reward: '30-110', rating: 4.4, plays: '218', badge: 'new', bg: 'linear-gradient(135deg,#1d1f5a,#0a0c20)', path: '/games-repo/31-Speak-Number-Guessing-Game/index.html' },
    { id: 'fruit-slicer', name: 'Fruit Slicer', desc: 'Swipe to slice flying fruit. Avoid the bombs.', cover: '/game-covers/fruit-slicer.svg', cat: 'arcade', diff: 'medium', time: '4 min', reward: '50-240', rating: 4.7, plays: '1,491', badge: 'hot', bg: 'linear-gradient(135deg,#5c1a3a,#1a0812)', path: '/games-repo/32-Fruit-Slicer-Game/index.html' },
    { id: 'quiz', name: 'Quick Quiz', desc: 'Answer 10 trivia questions against the clock.', cover: '/game-covers/quiz.svg', cat: 'casual', diff: 'medium', time: '4 min', reward: '60-200', rating: 4.6, plays: '1,124', badge: null, bg: 'linear-gradient(135deg,#2b1d6b,#0d0a2e)', path: '/games-repo/33-Quiz-Game/index.html' },
    { id: 'emoji-catcher', name: 'Emoji Catcher', desc: 'Catch falling emojis in your basket. Miss and lose hearts.', cover: '/game-covers/emoji-catcher.svg', cat: 'arcade', diff: 'easy', time: '3 min', reward: '40-180', rating: 4.5, plays: '636', badge: null, bg: 'linear-gradient(135deg,#ff8fb3,#2d1a5e)', path: '/games-repo/34-Emoji-Catcher-Game/index.html' },
    { id: 'whack-a-mole', name: 'Whack-A-Mole', desc: 'Smash every mole that pops up. Speed matters.', cover: '/game-covers/whack-a-mole.svg', cat: 'arcade', diff: 'easy', time: '3 min', reward: '40-160', rating: 4.6, plays: '1,258', badge: 'hot', bg: 'linear-gradient(135deg,#6eb854,#2f5e1b)', path: '/games-repo/35-Whack-A-Mole-Game/index.html' },
    { id: 'simon-says', name: 'Simon Says', desc: 'Repeat the color sequence. Each round gets harder.', cover: '/game-covers/simon-says.svg', cat: 'puzzle', diff: 'medium', time: '4 min', reward: '50-200', rating: 4.5, plays: '513', badge: null, bg: 'linear-gradient(135deg,#1a1f4a,#06081a)', path: '/games-repo/36-Simon-Says-Game/index.html' },
    { id: 'sliding-puzzle', name: 'Sliding Puzzle', desc: 'Slide numbered tiles into order. Beat your best time.', cover: '/game-covers/sliding-puzzle.svg', cat: 'puzzle', diff: 'medium', time: '4 min', reward: '45-170', rating: 4.4, plays: '382', badge: null, bg: 'linear-gradient(135deg,#1f294c,#0a0e24)', path: '/games-repo/37-Sliding-Puzzle-Game/index.html' },
    { id: 'hextris', name: 'Hextris', desc: "Rotate the hex. Match colors. Don't overflow.", cover: '/game-covers/hextris.svg', cat: 'puzzle', diff: 'hard', time: '6 min', reward: '60-240', rating: 4.7, plays: '744', badge: 'new', bg: 'linear-gradient(135deg,#0a1020,#000)', path: '/games-repo/38-Hextris/index.html' },
    { id: 'dark-room', name: 'A Dark Room', desc: 'A minimalist text adventure. The fire is dying.', cover: '/game-covers/dark-room.svg', cat: 'casual', diff: 'medium', time: '20 min', reward: '80-320', rating: 4.6, plays: '506', badge: 'new', bg: 'linear-gradient(135deg,#3a2a14,#000)', path: '/games-repo/40-A-Dark-Room/index.html' },
    { id: 'asteroids', name: 'Asteroids', desc: 'Survive the asteroid field in your vector ship.', cover: '/game-covers/asteroids.svg', cat: 'arcade', diff: 'medium', time: '5 min', reward: '50-260', rating: 4.6, plays: '1,001', badge: null, bg: 'linear-gradient(135deg,#141a3a,#000)', path: '/games-repo/41-Asteroids/index.html' },
    { id: 'particle-clicker', name: 'Particle Clicker', desc: 'Smash particles. Discover physics. Win Nobels.', cover: '/game-covers/particle-clicker.svg', cat: 'casual', diff: 'easy', time: '10 min', reward: '40-200', rating: 4.3, plays: '333', badge: null, bg: 'linear-gradient(135deg,#1a2a4a,#050814)', path: '/games-repo/42-Particle-Clicker/index.html' },
    { id: 'hexgl', name: 'HexGL', desc: 'Futuristic WebGL racing on neon hex tracks.', cover: '/game-covers/hexgl.svg', cat: 'arcade', diff: 'hard', time: '6 min', reward: '80-350', rating: 4.8, plays: '789', badge: 'hot', bg: 'linear-gradient(135deg,#4a1e6e,#ff8a3d)', path: '/games-repo/43-HexGL/index.html' },
    { id: 'ski-free', name: 'Ski Free', desc: 'Ski down the mountain. Dodge trees and the yeti.', cover: '/game-covers/ski-free.svg', cat: 'arcade', diff: 'medium', time: '4 min', reward: '40-200', rating: 4.5, plays: '738', badge: null, bg: 'linear-gradient(135deg,#aee4ff,#b8d4e8)', path: '/games-repo/45-Ski-Free/index.html' },
    { id: 'mario', name: 'Mario HTML5', desc: 'The plumber you know, in pure canvas JavaScript.', cover: '/game-covers/mario.svg', cat: 'arcade', diff: 'medium', time: '10 min', reward: '70-320', rating: 4.9, plays: '2,031', badge: 'hot', bg: 'linear-gradient(135deg,#5c94fc,#f09020)', path: '/games-repo/46-Mario-HTML5/main.html' },
    { id: 'alien-invasion', name: 'Alien Invasion', desc: 'Hold the cannon. Blast the alien waves back.', cover: '/game-covers/alien-invasion.svg', cat: 'arcade', diff: 'medium', time: '5 min', reward: '40-200', rating: 4.4, plays: '516', badge: null, bg: 'linear-gradient(135deg,#0a0520,#000)', path: '/games-repo/48-Alien-Invasion/index.html' },
    { id: 'arashi', name: 'Arashi', desc: 'Tempest-style vector shooter inside the tube.', cover: '/game-covers/arashi.svg', cat: 'arcade', diff: 'hard', time: '6 min', reward: '60-260', rating: 4.5, plays: '293', badge: null, bg: 'linear-gradient(135deg,#2a0540,#000)', path: '/games-repo/49-Arashi/arashi.html' },
    { id: 'captain-rogers', name: 'Captain Rogers', desc: 'Pilot through the asteroid belt to escape.', cover: '/game-covers/captain-rogers.svg', cat: 'arcade', diff: 'medium', time: '5 min', reward: '45-180', rating: 4.4, plays: '344', badge: null, bg: 'linear-gradient(135deg,#1a2a6a,#030512)', path: '/games-repo/50-Captain-Rogers/index.html' },
    { id: 'ball-and-wall', name: 'Ball And Wall', desc: 'Break every colored wall with the bouncing ball.', cover: '/game-covers/ball-and-wall.svg', cat: 'arcade', diff: 'easy', time: '4 min', reward: '35-140', rating: 4.3, plays: '256', badge: null, bg: 'linear-gradient(135deg,#0f1a40,#050918)', path: '/games-repo/51-Ball-And-Wall/index.html' },
    { id: 'save-the-forest', name: 'Save the Forest', desc: 'Douse the fires before the whole forest burns.', cover: '/game-covers/save-the-forest.svg', cat: 'casual', diff: 'medium', time: '5 min', reward: '40-160', rating: 4.5, plays: '211', badge: 'new', bg: 'linear-gradient(135deg,#ff7a3a,#3a0a0a)', path: '/games-repo/52-Save-The-Forest/dist/index.html' },
    { id: 'jolly-jumper', name: 'Jolly Jumper', desc: 'Spring higher and higher. Grab every coin.', cover: '/game-covers/jolly-jumper.svg', cat: 'arcade', diff: 'medium', time: '3 min', reward: '30-150', rating: 4.4, plays: '385', badge: null, bg: 'linear-gradient(135deg,#ffd96a,#ff8a3d)', path: '/games-repo/53-Jolly-Jumper/index.html' },
    { id: 'digger', name: 'Digger', desc: 'Dig for gems. Outrun the creatures underground.', cover: '/game-covers/digger.svg', cat: 'arcade', diff: 'medium', time: '5 min', reward: '50-220', rating: 4.5, plays: '564', badge: null, bg: 'linear-gradient(135deg,#1a0a04,#3a1a0a)', path: '/games-repo/54-Digger/index.html' },
    { id: 'coil', name: 'Coil', desc: 'Loop your trail around enemies to trap them.', cover: '/game-covers/coil.svg', cat: 'arcade', diff: 'medium', time: '4 min', reward: '45-180', rating: 4.4, plays: '227', badge: null, bg: 'linear-gradient(135deg,#0a1a40,#000)', path: '/games-repo/55-Coil/index.html' },
    { id: 'hexahedral', name: 'Hexahedral', desc: 'Flatten every isometric block. Minimum moves.', cover: '/game-covers/hexahedral.svg', cat: 'puzzle', diff: 'hard', time: '6 min', reward: '70-260', rating: 4.6, plays: '198', badge: null, bg: 'linear-gradient(135deg,#2a3a5a,#0a1020)', path: '/games-repo/56-Hexahedral/build/index.html' },
    { id: 'descensus', name: 'Descensus 2', desc: 'Swipe bars to guide the ball past saws.', cover: '/game-covers/descensus.svg', cat: 'arcade', diff: 'medium', time: '4 min', reward: '40-180', rating: 4.5, plays: '274', badge: null, bg: 'linear-gradient(135deg,#1a2a3a,#050810)', path: '/games-repo/57-Descensus/src/index.html' },
    { id: 'squirts', name: 'Squirts', desc: 'Absorb smaller bubbles. Dodge the bigger ones.', cover: '/game-covers/squirts.svg', cat: 'arcade', diff: 'easy', time: '3 min', reward: '35-150', rating: 4.3, plays: '213', badge: null, bg: 'linear-gradient(135deg,#1a3050,#050810)', path: '/games-repo/58-Squirts/index.html' },
    { id: 'astray', name: 'Astray', desc: 'Navigate the 3D ball-rolling maze to the goal.', cover: '/game-covers/astray.svg', cat: 'puzzle', diff: 'hard', time: '7 min', reward: '60-240', rating: 4.6, plays: '329', badge: 'new', bg: 'linear-gradient(135deg,#1a1a2e,#050510)', path: '/games-repo/60-Astray/index.html' },
    { id: 'orbium', name: 'Orbium', desc: 'Route orbiting balls into matching color goals.', cover: '/game-covers/orbium.svg', cat: 'puzzle', diff: 'medium', time: '5 min', reward: '50-210', rating: 4.5, plays: '174', badge: null, bg: 'linear-gradient(135deg,#1a2a4a,#020418)', path: '/games-repo/61-Orbium/index.html' },
    { id: 'zop', name: 'Zop', desc: 'Flip tiles. Clear the board in the fewest moves.', cover: '/game-covers/zop.svg', cat: 'puzzle', diff: 'medium', time: '4 min', reward: '40-170', rating: 4.4, plays: '243', badge: null, bg: 'linear-gradient(135deg,#2a1a4a,#0a0520)', path: '/games-repo/62-Zop/release/index.html' },
    { id: 'prism', name: 'Prism', desc: 'Bend light through prisms to hit every target.', cover: '/game-covers/prism.svg', cat: 'puzzle', diff: 'medium', time: '5 min', reward: '50-200', rating: 4.6, plays: '223', badge: null, bg: 'linear-gradient(135deg,#0a0a20,#000)', path: '/games-repo/63-Prism/index.html' },
    { id: 'emberwind', name: 'Emberwind', desc: "Swing Kee's lantern through 3 action chapters.", cover: '/game-covers/emberwind.svg', cat: 'arcade', diff: 'hard', time: '12 min', reward: '80-340', rating: 4.7, plays: '380', badge: 'hot', bg: 'linear-gradient(135deg,#ffa540,#3a1010)', path: '/games-repo/66-Emberwind/index.html' },
    { id: 'swap', name: 'Swap', desc: 'Swap tiles to match the target pattern.', cover: '/game-covers/swap.svg', cat: 'puzzle', diff: 'easy', time: '3 min', reward: '40-150', rating: 4.3, plays: '160', badge: null, bg: 'linear-gradient(135deg,#1a3a5a,#050a18)', path: '/games-repo/68-Swap/index.html' },
    { id: 'roguish', name: 'Roguish', desc: "Old-school ASCII roguelike. Descend. Don't die.", cover: '/game-covers/roguish.svg', cat: 'puzzle', diff: 'hard', time: '15 min', reward: '70-300', rating: 4.5, plays: '187', badge: null, bg: 'linear-gradient(135deg,#0a0a0a,#000)', path: '/games-repo/69-Roguish/index.html' },
    { id: 'bubble-shooter', name: 'Bubble Shooter', desc: 'Aim, shoot, match 3+ to pop the cluster.', cover: '/game-covers/bubble-shooter.svg', cat: 'arcade', diff: 'easy', time: '5 min', reward: '50-220', rating: 4.7, plays: '897', badge: 'hot', bg: 'linear-gradient(135deg,#172447,#070b1c)', path: '/games-repo/70-Bubble-Shooter/index.html' },
    { id: 'mahjong', name: 'Mahjong Solitaire', desc: 'Match exposed tile pairs to clear the stack.', cover: '/game-covers/mahjong.svg', cat: 'puzzle', diff: 'medium', time: '10 min', reward: '60-260', rating: 4.6, plays: '459', badge: 'new', bg: 'linear-gradient(135deg,#0a3a2a,#031a10)', path: '/games-repo/71-Mahjong-Solitaire/index.html' },
    { id: 'othello', name: 'Othello', desc: 'Flank to flip. Outscore the AI on 8x8.', cover: '/game-covers/othello.svg', cat: 'puzzle', diff: 'medium', time: '8 min', reward: '70-280', rating: 4.6, plays: '372', badge: null, bg: 'linear-gradient(135deg,#0a4020,#031808)', path: '/games-repo/72-Othello/index.html' },
    { id: 'lights-out', name: 'Lights Out', desc: 'Flip lights to turn them all off. Pure logic.', cover: '/game-covers/lights-out.svg', cat: 'puzzle', diff: 'medium', time: '4 min', reward: '40-160', rating: 4.4, plays: '247', badge: null, bg: 'linear-gradient(135deg,#0a1228,#06080f)', path: '/games-repo/73-Lights-Out/index.html' },
    { id: 'sokoban', name: 'Sokoban', desc: 'Push every crate onto a target. 8 levels.', cover: '/game-covers/sokoban.svg', cat: 'puzzle', diff: 'hard', time: '9 min', reward: '70-300', rating: 4.7, plays: '318', badge: 'hot', bg: 'linear-gradient(135deg,#1a1410,#0a0805)', path: '/games-repo/74-Sokoban/index.html' },
    { id: 'tron', name: 'Tron Lightcycles', desc: 'Trap the AI inside its own glowing trail.', cover: '/game-covers/tron.svg', cat: 'arcade', diff: 'medium', time: '4 min', reward: '60-260', rating: 4.6, plays: '491', badge: 'hot', bg: 'linear-gradient(135deg,#001020,#000)', path: '/games-repo/75-Tron-Lightcycles/index.html' },
    { id: 'frogger', name: 'Frogger', desc: 'Cross the road and ride logs to safe homes.', cover: '/game-covers/frogger.svg', cat: 'arcade', diff: 'medium', time: '5 min', reward: '50-240', rating: 4.6, plays: '610', badge: null, bg: 'linear-gradient(135deg,#0a3a6a,#1a4020)', path: '/games-repo/76-Frogger/index.html' },
    { id: 'space-invaders', name: 'Space Invaders', desc: 'Hold the line against descending alien waves.', cover: '/game-covers/space-invaders.svg', cat: 'arcade', diff: 'medium', time: '6 min', reward: '60-280', rating: 4.8, plays: '1,067', badge: 'hot', bg: 'linear-gradient(135deg,#000,#0a0518)', path: '/games-repo/77-Space-Invaders/index.html' },
    { id: 'missile-command', name: 'Missile Command', desc: 'Defend six cities from incoming missiles.', cover: '/game-covers/missile-command.svg', cat: 'arcade', diff: 'medium', time: '5 min', reward: '60-260', rating: 4.5, plays: '296', badge: null, bg: 'linear-gradient(135deg,#000,#1a0a04)', path: '/games-repo/78-Missile-Command/index.html' },
    { id: 'pinball', name: 'Pinball', desc: "Flip the ball off bumpers. Don't drain.", cover: '/game-covers/pinball.svg', cat: 'arcade', diff: 'medium', time: '8 min', reward: '70-340', rating: 4.7, plays: '714', badge: 'hot', bg: 'linear-gradient(135deg,#2a1054,#0a0420)', path: '/games-repo/79-Pinball/index.html' },
    { id: 'match-3', name: 'Gem Match-3', desc: 'Swap gems to chain three or more in a row.', cover: '/game-covers/match-3.svg', cat: 'puzzle', diff: 'easy', time: '6 min', reward: '60-240', rating: 4.6, plays: '880', badge: null, bg: 'linear-gradient(135deg,#1a1040,#0a0420)', path: '/games-repo/80-Match-3/index.html' },
    { id: 'air-hockey', name: 'Air Hockey', desc: 'Slam the puck past the CPU. First to 7.', cover: '/game-covers/air-hockey.svg', cat: 'arcade', diff: 'medium', time: '4 min', reward: '50-220', rating: 4.5, plays: '523', badge: 'new', bg: 'linear-gradient(135deg,#0a1a2e,#020812)', path: '/games-repo/81-Air-Hockey/index.html' },
    { id: 'pool', name: '8-Ball Pool', desc: 'Aim, calibrate power, sink every ball.', cover: '/game-covers/pool-8-ball.svg', cat: 'arcade', diff: 'medium', time: '8 min', reward: '70-320', rating: 4.8, plays: '964', badge: 'hot', bg: 'linear-gradient(135deg,#1e8540,#5a3a18)', path: '/games-repo/82-Pool-8-Ball/index.html' },
    { id: 'yahtzee', name: 'Yahtzee', desc: 'Roll dice, pick categories, outscore yourself.', cover: '/game-covers/yahtzee.svg', cat: 'casual', diff: 'medium', time: '6 min', reward: '50-220', rating: 4.5, plays: '427', badge: null, bg: 'linear-gradient(135deg,#1a1040,#06081a)', path: '/games-repo/83-Yahtzee/index.html' },
    { id: 'checkers', name: 'Checkers', desc: 'Capture diagonally. Crown your kings. Beat AI.', cover: '/game-covers/checkers.svg', cat: 'puzzle', diff: 'medium', time: '10 min', reward: '60-260', rating: 4.6, plays: '641', badge: null, bg: 'linear-gradient(135deg,#5a3a18,#1a1208)', path: '/games-repo/84-Checkers/index.html' },
    { id: 'word-search', name: 'Word Search', desc: 'Hunt hidden words across the letter grid.', cover: '/game-covers/word-search.svg', cat: 'casual', diff: 'easy', time: '5 min', reward: '40-180', rating: 4.4, plays: '380', badge: null, bg: 'linear-gradient(135deg,#06081a,#0a1228)', path: '/games-repo/85-Word-Search/index.html' },
    { id: 'tower-defense', name: 'Tower Defense', desc: 'Build towers to stop the wave from breaking through.', cover: '/game-covers/tower-defense.svg', cat: 'puzzle', diff: 'hard', time: '15 min', reward: '80-360', rating: 4.8, plays: '787', badge: 'hot', bg: 'linear-gradient(135deg,#1a3a1a,#0a1408)', path: '/games-repo/86-Tower-Defense/index.html' },
    { id: 'bomberman', name: 'Bomberman', desc: 'Plant bombs, blow up bricks, hunt enemies.', cover: '/game-covers/bomberman.svg', cat: 'arcade', diff: 'medium', time: '6 min', reward: '60-260', rating: 4.6, plays: '593', badge: null, bg: 'linear-gradient(135deg,#2a4a1a,#1a3010)', path: '/games-repo/87-Bomberman/index.html' },
    { id: 'galaga', name: 'Galaga', desc: 'Formation shooter with diving alien attacks.', cover: '/game-covers/galaga.svg', cat: 'arcade', diff: 'medium', time: '6 min', reward: '70-320', rating: 4.7, plays: '670', badge: 'hot', bg: 'linear-gradient(135deg,#000,#0a0518)', path: '/games-repo/88-Galaga/index.html' },
    { id: 'centipede', name: 'Centipede', desc: 'Blast the snake through mushrooms. Watch the spider.', cover: '/game-covers/centipede.svg', cat: 'arcade', diff: 'medium', time: '5 min', reward: '60-280', rating: 4.5, plays: '386', badge: null, bg: 'linear-gradient(135deg,#000,#0a040a)', path: '/games-repo/89-Centipede/index.html' },
    { id: 'lode-climber', name: 'Lode Climber', desc: 'Dig holes to trap enemies. Collect every gold.', cover: '/game-covers/lode-climber.svg', cat: 'arcade', diff: 'medium', time: '8 min', reward: '70-300', rating: 4.5, plays: '280', badge: null, bg: 'linear-gradient(135deg,#0a0810,#1a0a04)', path: '/games-repo/90-Lode-Climber/index.html' },
    { id: 'barrel-climb', name: 'Barrel Climb', desc: 'Dodge rolling barrels. Reach the top.', cover: '/game-covers/barrel-climb.svg', cat: 'arcade', diff: 'medium', time: '4 min', reward: '50-240', rating: 4.5, plays: '472', badge: 'new', bg: 'linear-gradient(135deg,#1a0a20,#000)', path: '/games-repo/91-Barrel-Climb/index.html' },
    { id: 'battleship', name: 'Battleship', desc: "Place your fleet, hunt the enemy. Don't miss.", cover: '/game-covers/battleship.svg', cat: 'puzzle', diff: 'medium', time: '12 min', reward: '60-280', rating: 4.5, plays: '463', badge: null, bg: 'linear-gradient(135deg,#0a1830,#020a18)', path: '/games-repo/92-Battleship/index.html' },
    { id: 'n-queens', name: 'N-Queens', desc: 'Place 6, 8, or 10 queens with no conflicts.', cover: '/game-covers/n-queens.svg', cat: 'puzzle', diff: 'hard', time: '8 min', reward: '60-260', rating: 4.4, plays: '194', badge: null, bg: 'linear-gradient(135deg,#1a1408,#5a3a18)', path: '/games-repo/93-N-Queens/index.html' },
    { id: '0h-h1', name: '0h h1', desc: 'Binary Sudoku. Three rules. Pure deduction.', cover: '/game-covers/0h-h1.svg', cat: 'puzzle', diff: 'medium', time: '5 min', reward: '50-220', rating: 4.5, plays: '223', badge: 'new', bg: 'linear-gradient(135deg,#0a1228,#06080f)', path: '/games-repo/94-0h-h1/index.html' },
    { id: 'reaction', name: 'Reaction Test', desc: 'Wait for green. Click. Beat your reflex record.', cover: '/game-covers/reaction.svg', cat: 'casual', diff: 'easy', time: '1 min', reward: '20-80', rating: 4.4, plays: '614', badge: null, bg: 'linear-gradient(135deg,#1ea050,#0a4020)', path: '/games-repo/95-Reaction-Test/index.html' },
    { id: 'color-mix', name: 'Color Mix', desc: 'Match the target with R-G-B sliders. Eye-train.', cover: '/game-covers/color-mix.svg', cat: 'casual', diff: 'easy', time: '3 min', reward: '30-150', rating: 4.3, plays: '263', badge: null, bg: 'linear-gradient(135deg,#0a0418,#1a0a30)', path: '/games-repo/96-Color-Mix/index.html' },
    { id: 'mancala', name: 'Mancala', desc: 'Sow your stones. Capture. Out-strategize the CPU.', cover: '/game-covers/mancala.svg', cat: 'puzzle', diff: 'medium', time: '10 min', reward: '50-220', rating: 4.5, plays: '274', badge: null, bg: 'linear-gradient(135deg,#1a0e08,#5a3a18)', path: '/games-repo/97-Mancala/index.html' },
    { id: 'word-hunt', name: 'Word Hunt', desc: 'Trace adjacent letters into words. Beat the clock.', cover: '/game-covers/word-hunt.svg', cat: 'casual', diff: 'medium', time: '4 min', reward: '60-280', rating: 4.7, plays: '534', badge: 'hot', bg: 'linear-gradient(135deg,#0a0a18,#1a1f4a)', path: '/games-repo/98-Word-Hunt/index.html' },
    { id: 'mini-rogue', name: 'Mini Rogue', desc: 'Procedural dungeon. Hunt gold. Avoid death.', cover: '/game-covers/mini-rogue.svg', cat: 'puzzle', diff: 'hard', time: '14 min', reward: '80-360', rating: 4.7, plays: '212', badge: 'new', bg: 'linear-gradient(135deg,#000,#0a0810)', path: '/games-repo/99-Mini-Rogue/index.html' },
  ];

  const FILTERS = [
    { cat: 'all', label: 'All games', count: 91 },
    { cat: 'puzzle', label: 'Puzzle', count: 30 },
    { cat: 'arcade', label: 'Arcade', count: 42 },
    { cat: 'casual', label: 'Casual', count: 19 },
  ];

  let filteredGames = $derived(
    activeFilter === 'all' ? GAMES : GAMES.filter((g) => g.cat === activeFilter)
  );

  const CONTINUE = [
    { name: 'Candy Crush', sub: 'Lvl 14 · 62%', bg: 'linear-gradient(135deg,#ff6b8a,#ff9a6e)' },
    { name: 'Pac-Man', sub: 'Lvl 6 · 38%', bg: 'linear-gradient(135deg,#ffc35a,#ff8a3d)' },
    { name: 'Sudoku', sub: 'Medium · 88%', bg: 'linear-gradient(135deg,#5fa9e8,#3675b8)' },
    { name: 'Solitaire', sub: 'Klondike · 18%', bg: 'linear-gradient(135deg,#4cc28f,#28805c)' },
    { name: 'Rock Paper Scis…', sub: 'Best of 5 · 3W-1L', bg: 'linear-gradient(135deg,#a08aff,#6c54e0)' },
  ];

  const LEADERBOARD = [
    { rank: 1, initials: 'SK', name: 'siren_kai', pts: '48,210', color: '#ff80a3' },
    { rank: 2, initials: 'MR', name: 'mike_runs', pts: '42,094', color: '#9aa0ad' },
    { rank: 3, initials: 'JA', name: 'jade_a', pts: '39,712', color: '#ffb74a' },
    { rank: 4, initials: 'RB', name: 'rb_studio', pts: '36,402', color: '#ff7a8a' },
    { rank: 5, initials: 'NX', name: 'nox.dev', pts: '34,180', color: '#7ab8ff' },
    { rank: 842, initials: 'YO', name: 'you', pts: '2,480', color: '#c7f463', me: true },
  ];

  const JUST_WON = [
    { initials: 'JA', name: 'jade_a', sub: 'Tetris · level 14', pts: '+340', color: '#ffb74a' },
    { initials: 'NX', name: 'nox.dev', sub: 'Wordle · solved in 3', pts: '+250', color: '#7ab8ff' },
    { initials: 'RB', name: 'rb_studio', sub: 'Flappy Bird · 96 score', pts: '+180', color: '#ff7a8a' },
    { initials: 'MR', name: 'mike_runs', sub: 'Solitaire · cleared', pts: '+120', color: '#9aa0ad' },
  ];

  // The hero "Today's game" card features the most recently uploaded admin game.
  // When nothing has been uploaded yet, fall back to a catalog game preview.
  const dailyPick: PlayableGame = $derived.by(() => {
    if (data.todaysGame) {
      return {
        id: data.todaysGame.id,
        name: data.todaysGame.title,
        // Served with the state-persistence layer injected (uploaded games are
        // single self-contained HTML); see $lib/server/html-inject.
        path: `/game-content/${data.todaysGame.id}`,
        thumb: data.todaysGame.thumb ?? null,
        reward: '500',
      };
    }
    const g = GAMES.find((x) => x.id === 'pac-man') ?? GAMES[0];
    return { id: g.id, name: g.name, path: g.path, reward: g.reward, thumb: null };
  });
  const dailyPickTitle = $derived(data.todaysGame ? data.todaysGame.title : "Daily Earnmaze's Pick");
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const CASHOUTS = [
    { initials: 'JK', name: 'jules_k', sub: 'Solitaire · 14s ago', pts: '+1,240', color: '#ff5f8f' },
    { initials: 'RB', name: 'rb_studio', sub: 'Pac-Man · 32s ago', pts: '+820', color: '#56a8ff' },
    { initials: 'MC', name: 'midnight_owl', sub: 'Flappy · 1m ago', pts: '+560', color: '#ff8a3d' },
  ];

  const WEEKEND_LB = [
    { rank: 1, name: 'siren_kai', pts: '48,210 points', prize: '$1,200', color: '#ffb74a' },
    { rank: 2, name: 'mike_runs', pts: '42,094 points', prize: '$600', color: '#9aa0ad' },
    { rank: 3, name: 'jade_a', pts: '39,712 points', prize: '$300', color: '#cd7f32' },
    { rank: '4-10', name: 'Top 10', pts: 'runners-up', prize: '$50 ea', color: '#5e6471' },
  ];

  const FAQ = [
    { q: 'Are these games actually free to play?', a: '100% free. No subscription, no in-game purchases. Every minute you play counts toward your points balance.' },
    { q: 'How are points calculated?', a: 'Each game has a reward range. Your score, time survived, and difficulty multiplier determine the exact points awarded.' },
    { q: 'Is there a daily limit?', a: 'No hard daily cap. We do throttle very repetitive sessions to keep the leaderboard fair, but normal play has no limit.' },
    { q: "What's the minimum to cash out?", a: 'Cash out at 1,000 pts ($10). PayPal, gift cards, or crypto — your choice. Most payouts process within 24 hours.' },
    { q: 'Can I play on mobile?', a: 'Yes. Every game is touch-optimized. Same balance and leaderboard across web, iOS, and Android.' },
  ];
</script>

<svelte:window onkeydown={onKeydown} />

<svelte:head>
  <title>Play & Earn — EarnMaze</title>
  <meta name="description" content="Play fun HTML5 games on EarnMaze and earn real rewards." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
</svelte:head>

<!--
  Global page styles are injected in the component body (not in <svelte:head>)
  on purpose: {@html} content inside <svelte:head> is unreliably retained
  across SvelteKit client navigation / hover-preload, which caused the styles
  to drop out (collapsing the layout). As a body-level component-owned node,
  Svelte adds/removes it reliably with the page.
-->
<!-- eslint-disable-next-line svelte/no-at-html-tags -->
{@html `<style>
  *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
  :root{
    --bg:#0a0c10;--bg2:#0e1117;--bg3:#141821;--line:rgba(255,255,255,.07);--line2:rgba(255,255,255,.12);
    --t1:#f1f2f5;--t2:#9aa0ad;--t3:#5e6471;
    --acc:#c7f463;--acc-d:#9bd136;--acc-soft:rgba(199,244,99,.12);--acc-text:#0a0c10;
    --warn:#ffb74a;--pos:#7eddb5;--bad:#ff7a8a;--info:#7ab8ff;--purple:#b48cff;
    --r1:8px;--r2:12px;--r3:16px;--r4:22px;--r5:999px;
    --f:'Inter','Inter Fallback',system-ui,-apple-system,sans-serif;--mono:'JetBrains Mono',ui-monospace,monospace;
    --ease:cubic-bezier(.2,.7,.2,1);--max:1280px;
  }
  html{scroll-behavior:smooth;background:var(--bg)}
  body{background:var(--bg);color:var(--t1);font-family:var(--f);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased;overflow-x:hidden}
  a{color:inherit;text-decoration:none}
  button{font:inherit;cursor:pointer;border:0;background:0;color:inherit}
  img{display:block;max-width:100%}
  ::selection{background:var(--acc);color:#000}
  @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}

  .wrap{max-width:var(--max);margin:0 auto;padding:0 28px;position:relative}
  .mono{font-family:var(--mono)}
  .i{width:18px;height:18px;display:inline-block;vertical-align:middle;flex-shrink:0}
  .i-lg{width:22px;height:22px}

  .btn{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;border-radius:var(--r5);font-weight:600;font-size:14px;transition:all .2s var(--ease);white-space:nowrap;letter-spacing:-.005em}
  .btn-pri{background:var(--acc);color:var(--acc-text)}
  .btn-pri:hover{background:var(--acc-d);transform:translateY(-1px)}
  .btn-sec{background:transparent;color:var(--t1);border:1px solid var(--line2)}
  .btn-sec:hover{border-color:rgba(255,255,255,.25);background:rgba(255,255,255,.03)}
  .btn-ghost{padding:8px 14px;color:var(--t2);font-size:13px}
  .btn-ghost:hover{color:var(--t1)}

  /* NAV */
  nav{position:fixed;top:0;left:0;right:0;z-index:100;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);background:rgba(10,12,16,.7);border-bottom:1px solid transparent;transition:.3s}
  nav.scrolled{border-bottom-color:var(--line);background:rgba(10,12,16,.85)}
  .nav-row{display:flex;flex-wrap:wrap;row-gap:8px;align-items:center;justify-content:space-between;padding:14px 0}
  .brand{display:flex;align-items:center;gap:10px;font-weight:600;font-size:17px;letter-spacing:-.02em}
  .brand-mark{width:28px;height:28px;border-radius:8px;background:var(--acc);display:grid;place-items:center;color:var(--acc-text)}
  .nav-links{display:flex;align-items:center;gap:4px}
  .nav-links a{padding:8px 14px;color:var(--t2);font-size:14px;font-weight:500;border-radius:var(--r5);transition:.2s;position:relative}
  .nav-links a:hover{color:var(--t1)}
  .nav-links a.active{color:var(--t1)}
  .nav-links a.active::after{content:"";position:absolute;left:14px;right:14px;bottom:2px;height:2px;background:var(--acc);border-radius:2px}
  .nav-actions{display:flex;align-items:center;gap:8px}
  .coin-pill{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:var(--r5);font-family:var(--mono);font-size:13px;font-weight:600;color:var(--t1)}
  .coin-pill .dot{width:6px;height:6px;border-radius:50%;background:var(--acc)}
  .bell{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.04);border:1px solid var(--line);display:grid;place-items:center;color:var(--t2);position:relative;transition:.2s}
  .bell:hover{color:var(--t1)}
  .bell .pip{position:absolute;top:7px;right:8px;width:7px;height:7px;border-radius:50%;background:var(--bad);border:2px solid var(--bg)}

  /* HERO */
  .hero{padding:120px 0 40px;position:relative;overflow:hidden}
  .hero::before{content:"";position:absolute;top:-120px;left:50%;transform:translateX(-50%);width:1100px;height:480px;background:radial-gradient(closest-side,var(--acc-soft),transparent 70%);filter:blur(60px);pointer-events:none;opacity:.55}
  .hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:start;position:relative;z-index:1}
  .hero-grid>*{min-width:0}
  .hero-eb{display:inline-flex;align-items:center;gap:12px;font-family:var(--mono);font-size:11px;color:var(--t2);letter-spacing:.18em;text-transform:uppercase;margin-bottom:24px}
  .hero-eb .dot{width:6px;height:6px;border-radius:50%;background:var(--acc);box-shadow:0 0 0 4px var(--acc-soft)}
  .hero-eb .sep{color:var(--t3)}
  .hero h1{font-size:clamp(40px,5.5vw,72px);font-weight:600;letter-spacing:-.035em;line-height:.98;margin-bottom:22px}
  .hero h1 em{font-style:normal;color:var(--acc)}
  .hero .lead{font-size:17px;color:var(--t2);max-width:480px;line-height:1.55}

  /* TODAY'S GAME card */
  .tg-card{background:linear-gradient(160deg,rgba(199,244,99,.06),var(--bg2));border:1px solid rgba(199,244,99,.45);border-radius:var(--r4);padding:22px 24px;box-shadow:0 30px 70px rgba(0,0,0,.45),0 0 0 1px rgba(199,244,99,.06);animation:tg-float 6s ease-in-out infinite,tg-glow 4.5s ease-in-out infinite;transition:transform .25s var(--ease),box-shadow .25s var(--ease);will-change:transform,box-shadow}
  .tg-card:hover{animation-play-state:paused;transform:translateY(-6px) scale(1.005);box-shadow:0 40px 90px rgba(0,0,0,.55),0 0 0 1px rgba(199,244,99,.25),0 0 48px -6px rgba(199,244,99,.32)}
  @keyframes tg-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes tg-glow{0%,100%{box-shadow:0 30px 70px rgba(0,0,0,.45),0 0 0 1px rgba(199,244,99,.06),0 0 0 0 rgba(199,244,99,0)}50%{box-shadow:0 30px 70px rgba(0,0,0,.45),0 0 0 1px rgba(199,244,99,.14),0 0 36px -4px rgba(199,244,99,.22)}}
  .tg-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase}
  .tg-h .l{color:var(--acc-d);display:inline-flex;align-items:center;gap:8px}
  .tg-h .l svg{color:var(--acc)}
  .tg-h .r{color:var(--t3);display:inline-flex;align-items:center;gap:6px}
  .tg-h .r .dot{width:6px;height:6px;border-radius:50%;background:var(--bad);animation:tg-blink 1.6s ease-in-out infinite}
  @keyframes tg-blink{0%,100%{opacity:1}50%{opacity:.35}}
  .tg-h .r em{font-style:normal;color:var(--warn);font-weight:500}
  .tg-preview{position:relative;width:100%;aspect-ratio:16/11;border-radius:var(--r2);overflow:hidden;background:#06080d;border:1px solid var(--line2);margin-bottom:18px;display:block}
  .tg-frame{width:100%;height:100%;border:0;pointer-events:none;background:#06080d;object-fit:cover;display:block}
  .tg-frame-fallback{width:100%;height:100%;display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--t2);background:linear-gradient(160deg,rgba(199,244,99,.08),var(--bg2))}
  .tg-frame-fallback span{font-size:13px;font-weight:600;color:var(--t1)}
  .tg-overlay{position:absolute;inset:0;width:100%;height:100%;background:transparent;cursor:pointer;transition:.2s}
  .tg-overlay:hover{background:rgba(199,244,99,.06)}
  .tg-live{position:absolute;top:12px;right:12px;z-index:2;font-family:var(--mono);font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--acc);display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:rgba(10,12,16,.7);border:1px solid var(--line2);border-radius:var(--r5);backdrop-filter:blur(6px)}
  .tg-live .dot{width:6px;height:6px;border-radius:50%;background:var(--acc);box-shadow:0 0 8px var(--acc);animation:tg-pulse 1.4s ease-in-out infinite}
  @keyframes tg-pulse{0%,100%{transform:scale(1);box-shadow:0 0 8px var(--acc),0 0 0 0 rgba(199,244,99,.45)}50%{transform:scale(1.25);box-shadow:0 0 12px var(--acc),0 0 0 6px rgba(199,244,99,0)}}
  .tg-corner{position:absolute;width:14px;height:14px;z-index:2;pointer-events:none;border-color:rgba(199,244,99,.55);border-style:solid;border-width:0;animation:tg-scan 3s ease-in-out infinite}
  @keyframes tg-scan{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:1;transform:scale(1.12)}}
  .tg-corner.tl{top:8px;left:8px;border-top-width:2px;border-left-width:2px;transform-origin:top left}
  .tg-corner.tr{top:8px;right:8px;border-top-width:2px;border-right-width:2px;transform-origin:top right;animation-delay:.4s}
  .tg-corner.bl{bottom:8px;left:8px;border-bottom-width:2px;border-left-width:2px;transform-origin:bottom left;animation-delay:.8s}
  .tg-corner.br{bottom:8px;right:8px;border-bottom-width:2px;border-right-width:2px;transform-origin:bottom right;animation-delay:1.2s}
  .tg-title{font-size:26px;font-weight:600;letter-spacing:-.02em;margin-bottom:8px}
  .tg-meta{font-family:var(--mono);font-size:12px;color:var(--t3);margin-bottom:20px}
  .tg-meta em{font-style:normal;color:var(--t2);font-weight:500}
  .tg-foot{display:flex;align-items:center;justify-content:space-between;padding-top:16px;border-top:1px solid var(--line);gap:12px}
  .tg-bonus{font-family:var(--mono);font-size:30px;font-weight:600;color:var(--acc);letter-spacing:-.01em}
  .tg-bonus em{font-style:normal;font-size:12px;color:var(--t3);margin-left:8px;letter-spacing:.1em;text-transform:uppercase}

  /* LATEST CASHOUTS */
  .cashouts{margin-top:28px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r3);padding:8px 8px 10px;max-width:480px}
  .cashouts-h{display:flex;justify-content:space-between;align-items:center;padding:10px 12px 8px;font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase}
  .cashouts-h .l{color:var(--acc-d);display:inline-flex;align-items:center;gap:8px}
  .cashouts-h .l .dot{width:6px;height:6px;border-radius:50%;background:var(--acc);box-shadow:0 0 0 4px var(--acc-soft)}
  .cashouts-h .r{color:var(--t3)}
  .cashout{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:var(--r2);transition:.2s}
  .cashout:hover{background:rgba(255,255,255,.03)}
  .cashout .avatar{width:36px;height:36px;border-radius:50%;flex-shrink:0;display:grid;place-items:center;font-size:12px;font-weight:700;color:#0a0c10;letter-spacing:-.01em}
  .cashout .info{flex:1;min-width:0}
  .cashout .info .n{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cashout .info .s{font-family:var(--mono);font-size:11px;color:var(--t3);margin-top:2px}
  .cashout .v{font-family:var(--mono);font-size:15px;font-weight:600;color:var(--pos)}

  /* STATS */
  .stats{padding:48px 0 0}
  .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
  .stat{background:var(--bg2);border:1px solid var(--line);border-radius:var(--r3);padding:22px}
  .stat-h{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}
  .stat-ico{width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid var(--line);display:grid;place-items:center;color:var(--t2)}
  .stat-ico.acc{background:var(--acc-soft);color:var(--acc-d);border-color:rgba(199,244,99,.2)}
  .stat-ico.warn{background:rgba(255,183,74,.12);color:var(--warn);border-color:rgba(255,183,74,.25)}
  .stat-ico.bad{background:rgba(255,122,138,.12);color:var(--bad);border-color:rgba(255,122,138,.25)}
  .stat-ico.purple{background:rgba(180,140,255,.12);color:var(--purple);border-color:rgba(180,140,255,.25)}
  .stat-sp{width:60px;height:18px}
  .stat-v{font-family:var(--f);font-size:34px;font-weight:600;letter-spacing:-.03em;line-height:1}
  .stat-l{font-family:var(--mono);font-size:11px;color:var(--t3);letter-spacing:.1em;text-transform:uppercase;margin-top:6px}
  .stat-d{font-size:12px;color:var(--t2);margin-top:14px;padding-top:14px;border-top:1px solid var(--line)}
  .stat-d.up{color:var(--pos)}
  .stat-dots{display:flex;gap:4px;margin-top:14px;padding-top:14px;border-top:1px solid var(--line)}
  .stat-dots span{flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.06)}
  .stat-dots span.on{background:var(--acc)}

  /* CONTINUE */
  .cont{padding:48px 0 24px}
  .cont-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:20px}
  .cont-head h3{font-size:22px;font-weight:600;letter-spacing:-.015em}
  .cont-head a{font-size:13px;color:var(--t2);display:inline-flex;align-items:center;gap:6px;transition:.2s}
  .cont-head a:hover{color:var(--t1)}
  .cont-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
  .cont-card{background:var(--bg2);border:1px solid var(--line);border-radius:var(--r2);padding:14px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:.2s}
  .cont-card:hover{border-color:var(--line2);background:var(--bg3)}
  .cont-ico{width:40px;height:40px;border-radius:10px;flex-shrink:0}
  .cont-info{min-width:0}
  .cont-info .n{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cont-info .s{font-family:var(--mono);font-size:10px;color:var(--t3);margin-top:2px;letter-spacing:.04em}

  /* MAIN with sidebar */
  .main{padding:24px 0 80px}
  .main-grid{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:32px;align-items:start}

  /* Toolbar */
  .toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:24px;flex-wrap:wrap}
  .tabs{display:flex;align-items:center;gap:6px;padding:5px;background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:var(--r5);overflow:auto;max-width:100%}
  .tab{padding:8px 16px;border-radius:var(--r5);font-size:13px;font-weight:500;color:var(--t2);display:inline-flex;align-items:center;gap:8px;white-space:nowrap;transition:.2s}
  .tab:hover{color:var(--t1)}
  .tab.sel{background:var(--acc);color:var(--acc-text)}
  .tab .ct{font-family:var(--mono);font-size:10px;font-weight:600;padding:2px 6px;border-radius:var(--r5);background:rgba(255,255,255,.06);color:var(--t3)}
  .tab.sel .ct{background:rgba(10,12,16,.18);color:var(--acc-text)}
  .sort{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--t3);font-family:var(--mono);letter-spacing:.06em}
  .sort-pills{display:flex;gap:6px}
  .sort-pill{padding:6px 12px;border-radius:var(--r5);font-size:12px;font-weight:500;color:var(--t2);background:rgba(255,255,255,.04);border:1px solid var(--line);transition:.2s;cursor:pointer}
  .sort-pill.sel{color:var(--t1);background:rgba(255,255,255,.08);border-color:var(--line2)}

  /* Game grid */
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
  .game-card{background:var(--bg2);border:1px solid var(--line);border-radius:var(--r3);overflow:hidden;cursor:pointer;transition:.25s var(--ease);position:relative;display:flex;flex-direction:column}
  .game-card:hover{transform:translateY(-3px);border-color:var(--line2);box-shadow:0 24px 60px rgba(0,0,0,.4)}
  .game-thumb{height:240px;position:relative;overflow:hidden;display:grid;place-items:center;padding:14px}
  .game-thumb::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 50%,rgba(10,12,16,.35));pointer-events:none}
  .game-cover{width:100%;height:100%;object-fit:contain;z-index:1;filter:drop-shadow(0 8px 24px rgba(0,0,0,.3))}
  .game-card:hover .game-cover{transform:scale(1.04);transition:transform .5s var(--ease)}
  .play-badge{position:absolute;top:14px;right:14px;backdrop-filter:blur(10px);padding:5px 11px;border-radius:var(--r5);font-family:var(--mono);font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;display:flex;align-items:center;gap:4px;z-index:2}
  .play-badge.hot{background:rgba(255,122,138,.18);color:var(--bad);border:1px solid rgba(255,122,138,.35)}
  .play-badge.new{background:rgba(122,184,255,.18);color:var(--info);border:1px solid rgba(122,184,255,.35)}
  .play-count{position:absolute;top:14px;left:14px;font-family:var(--mono);font-size:11px;color:var(--t1);background:rgba(10,12,16,.55);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.12);padding:5px 10px;border-radius:var(--r5);z-index:2;display:flex;align-items:center;gap:6px}
  .play-count::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--acc);box-shadow:0 0 8px var(--acc)}
  .game-body{padding:20px 22px}
  .game-h{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:8px}
  .game-h h4{font-size:16px;font-weight:600;letter-spacing:-.01em}
  .game-h .rt{font-family:var(--mono);font-size:11px;color:var(--warn);display:inline-flex;align-items:center;gap:4px;white-space:nowrap}
  .game-desc{font-size:13px;color:var(--t2);line-height:1.55;margin-bottom:12px}
  .game-tags{display:flex;gap:6px;flex-wrap:wrap}
  .gtag{padding:4px 10px;border-radius:var(--r5);font-family:var(--mono);font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:.06em;background:rgba(255,255,255,.04);color:var(--t2);border:1px solid var(--line)}
  .gtag.easy{background:rgba(126,221,181,.1);color:var(--pos);border-color:rgba(126,221,181,.25)}
  .gtag.medium{background:rgba(255,183,74,.1);color:var(--warn);border-color:rgba(255,183,74,.25)}
  .gtag.hard{background:rgba(255,122,138,.1);color:var(--bad);border-color:rgba(255,122,138,.25)}
  .game-foot{display:flex;justify-content:space-between;align-items:center;padding:14px 22px;border-top:1px solid var(--line);background:rgba(0,0,0,.18);gap:10px;flex-wrap:wrap}
  .game-foot .rw{font-family:var(--mono);font-size:12px;color:var(--acc);font-weight:600;display:inline-flex;align-items:center;gap:6px}
  .game-foot .rw::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--acc)}
  .play-btn{padding:7px 16px;background:var(--acc);color:var(--acc-text);border-radius:var(--r5);font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:6px;transition:.2s}
  .play-btn:hover{background:var(--acc-d)}

  /* SIDEBAR */
  .side{display:flex;flex-direction:column;gap:16px;position:sticky;top:88px}
  .side-card{background:var(--bg2);border:1px solid var(--line);border-radius:var(--r3);padding:20px}
  .side-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
  .side-h h4{font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px}
  .side-h h4 svg{color:var(--acc)}
  .side-h .l{font-family:var(--mono);font-size:10px;color:var(--t3);letter-spacing:.1em;text-transform:uppercase}
  .lb-row{display:flex;align-items:center;gap:10px;padding:8px 0;font-size:13px;border-bottom:1px solid rgba(255,255,255,.03)}
  .lb-row:last-child{border:0}
  .lb-row.me{background:var(--acc-soft);border-radius:var(--r2);padding:8px 10px;margin:4px -10px 0;border-bottom:0}
  .lb-rk{font-family:var(--mono);font-size:11px;color:var(--t3);width:32px;flex-shrink:0}
  .lb-row.me .lb-rk{color:var(--acc-d)}
  .lb-av{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-family:var(--mono);font-size:10px;font-weight:600;color:#0a0c10;flex-shrink:0}
  .lb-n{flex:1;font-weight:500;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .lb-p{font-family:var(--mono);font-size:12px;font-weight:600;color:var(--t1)}

  .jw-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.03)}
  .jw-row:last-child{border:0}
  .jw-av{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-family:var(--mono);font-size:11px;font-weight:600;color:#0a0c10;flex-shrink:0}
  .jw-i{flex:1;min-width:0}
  .jw-n{font-size:13px;font-weight:500}
  .jw-s{font-family:var(--mono);font-size:10px;color:var(--t3);margin-top:1px;letter-spacing:.02em}
  .jw-p{font-family:var(--mono);font-size:12px;font-weight:600;color:var(--acc)}

  .dl-row{display:flex;gap:6px;margin-top:6px}
  .dl-cell{flex:1;aspect-ratio:1;border-radius:8px;background:rgba(126,221,181,.1);border:1px solid rgba(126,221,181,.25);display:grid;place-items:center;color:var(--pos)}
  .dl-cell.bonus{background:rgba(255,183,74,.12);border-color:rgba(255,183,74,.3);color:var(--warn);font-family:var(--mono);font-size:10px;font-weight:600}
  .dl-foot{margin-top:14px;padding-top:14px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;font-size:13px}
  .dl-foot .l{color:var(--t2)}
  .dl-foot .v{font-family:var(--mono);font-weight:600;color:var(--acc)}

  /* WEEKEND CUP */
  .wcup{padding:48px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:linear-gradient(180deg,rgba(180,140,255,.04),transparent 60%)}
  .wcup-card{background:linear-gradient(135deg,rgba(180,140,255,.08),rgba(14,17,23,.85) 70%);border:1px solid rgba(180,140,255,.2);border-radius:var(--r4);padding:36px;display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center}
  .wcup-l .eb{font-family:var(--mono);font-size:11px;color:var(--purple);letter-spacing:.16em;text-transform:uppercase;display:inline-flex;align-items:center;gap:8px;margin-bottom:18px}
  .wcup-l .eb .dot{width:6px;height:6px;border-radius:50%;background:var(--purple);box-shadow:0 0 0 4px rgba(180,140,255,.18)}
  .wcup-l h2{font-size:clamp(34px,4vw,52px);font-weight:600;letter-spacing:-.025em;line-height:1.05;margin-bottom:18px}
  .wcup-l h2 em{font-style:normal;color:var(--purple)}
  .wcup-l p{font-size:15px;color:var(--t2);max-width:440px;margin-bottom:28px;line-height:1.6}
  .wcup-prize{display:flex;align-items:baseline;gap:14px;margin-bottom:24px}
  .wcup-prize .v{font-family:var(--mono);font-size:48px;font-weight:600;color:var(--purple);letter-spacing:-.025em}
  .wcup-prize .l{font-family:var(--mono);font-size:11px;color:var(--t3);letter-spacing:.16em;text-transform:uppercase}
  .wcup-btn{display:inline-flex;align-items:center;gap:8px;padding:13px 24px;background:var(--purple);color:#fff;border-radius:var(--r5);font-weight:600;font-size:14px;transition:.2s}
  .wcup-btn:hover{filter:brightness(1.15);transform:translateY(-1px)}
  .wcup-meta{margin-left:14px;font-family:var(--mono);font-size:12px;color:var(--t3)}
  .wcup-r{display:flex;flex-direction:column;gap:10px}
  .wcup-row{display:flex;align-items:center;gap:14px;padding:14px 18px;background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:var(--r2)}
  .wcup-rk{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;font-family:var(--mono);font-size:13px;font-weight:600;color:#0a0c10;flex-shrink:0}
  .wcup-rinfo{flex:1;min-width:0}
  .wcup-rn{font-size:14px;font-weight:600}
  .wcup-rs{font-family:var(--mono);font-size:11px;color:var(--t3);margin-top:2px}
  .wcup-rp{font-family:var(--mono);font-size:14px;font-weight:600;color:var(--purple)}

  /* HOW IT WORKS */
  .how{padding:80px 0;border-bottom:1px solid var(--line)}
  .how-head{margin-bottom:48px}
  .how-head .eb{font-family:var(--mono);font-size:11px;color:var(--acc-d);letter-spacing:.18em;text-transform:uppercase;display:inline-flex;align-items:center;gap:8px;margin-bottom:18px}
  .how-head .eb .dot{width:6px;height:6px;border-radius:50%;background:var(--acc);box-shadow:0 0 0 4px var(--acc-soft)}
  .how-head h2{font-size:clamp(34px,4vw,52px);font-weight:600;letter-spacing:-.025em;line-height:1.05}
  .how-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:32px}
  .how-step .n{font-family:var(--mono);font-size:11px;color:var(--t3);letter-spacing:.18em;margin-bottom:14px}
  .how-step .ico{width:48px;height:48px;border-radius:12px;border:1px solid var(--line);background:rgba(255,255,255,.04);color:var(--acc);display:grid;place-items:center;margin-bottom:18px}
  .how-step h3{font-size:18px;font-weight:600;letter-spacing:-.015em;margin-bottom:8px}
  .how-step p{font-size:14px;color:var(--t2);line-height:1.6}

  /* FAQ */
  .faq{padding:80px 0;border-bottom:1px solid var(--line)}
  .faq h2{text-align:center;font-size:clamp(34px,4vw,52px);font-weight:600;letter-spacing:-.025em;line-height:1.05;margin-bottom:48px}
  .faq-list{max-width:820px;margin:0 auto;border-top:1px solid var(--line)}
  .faq-item{border-bottom:1px solid var(--line)}
  .faq-q{width:100%;text-align:left;display:flex;align-items:center;justify-content:space-between;padding:24px 0;font-size:17px;font-weight:500;color:var(--t1);gap:16px}
  .faq-q:hover{color:var(--acc)}
  .faq-icon{width:32px;height:32px;border-radius:50%;border:1px solid var(--line2);display:grid;place-items:center;color:var(--t2);transition:.3s;flex-shrink:0}
  .faq-item.open .faq-icon{background:var(--acc);color:var(--acc-text);border-color:var(--acc);transform:rotate(45deg)}
  .faq-a{max-height:0;overflow:hidden;transition:max-height .35s var(--ease)}
  .faq-item.open .faq-a{max-height:240px}
  .faq-a-in{padding:0 0 24px;font-size:15px;color:var(--t2);line-height:1.7;max-width:700px}

  /* BOTTOM CTA */
  .cta{padding:120px 0;text-align:center;position:relative;overflow:hidden}
  .cta::before{content:"";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:900px;height:500px;background:radial-gradient(closest-side,var(--acc-soft),transparent 70%);filter:blur(40px);pointer-events:none;opacity:.5}
  .cta-inner{position:relative}
  .cta h2{font-size:clamp(40px,5.5vw,68px);font-weight:600;letter-spacing:-.03em;line-height:1.02;margin-bottom:18px}
  .cta p{font-size:16px;color:var(--t2);max-width:480px;margin:0 auto 32px}
  .cta-ctas{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}

  .foot-mini{padding:36px 0;border-top:1px solid var(--line);text-align:center;font-family:var(--mono);font-size:11px;color:var(--t3);letter-spacing:.16em;text-transform:uppercase}

  /* MODAL */
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:1000;display:flex;padding:0;animation:fadeIn .25s var(--ease)}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .modal{background:var(--bg2);border:none;border-radius:0;width:100%;height:100%;max-width:100%;max-height:100%;display:flex;flex-direction:column;overflow:hidden;animation:slideUp .25s var(--ease)}
  @keyframes slideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
  .modal-head{padding:12px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);background:rgba(10,12,16,.85);flex-shrink:0}
  .modal-head-l{display:flex;align-items:center;gap:12px;min-width:0}
  .modal-ic{width:36px;height:36px;border-radius:9px;background:var(--acc-soft);color:var(--acc-d);display:grid;place-items:center;flex-shrink:0}
  .modal-title{font-size:15px;font-weight:600;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .modal-sub{font-family:var(--mono);font-size:11px;color:var(--t2);margin-top:1px;letter-spacing:.1em;text-transform:uppercase}
  .modal-close{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.04);border:1px solid var(--line);display:grid;place-items:center;cursor:pointer;transition:.2s}
  .modal-close:hover{background:var(--bad);border-color:var(--bad);color:#fff}
  .modal-close svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round}
  .game-iframe{flex:1;border:none;width:100%;height:100%;background:#fff}

  @media(max-width:1180px){
    .hero-grid{grid-template-columns:1fr;gap:36px}
    .main-grid{grid-template-columns:1fr}
    .side{position:static;flex-direction:row;flex-wrap:wrap}
    .side-card{flex:1;min-width:260px}
    .stats-grid{grid-template-columns:repeat(2,1fr)}
    .cont-grid{grid-template-columns:repeat(3,1fr)}
    .grid{grid-template-columns:repeat(2,1fr)}
    .how-grid{grid-template-columns:repeat(2,1fr)}
    .wcup-card{grid-template-columns:1fr;gap:28px}
  }
  @media(max-width:680px){
    .hero{padding:100px 0 24px}
    .wrap{padding:0 20px}
    .nav-links,.coin-pill{display:none}
    .stats-grid{grid-template-columns:1fr}
    .cont-grid{grid-template-columns:1fr 1fr}
    .grid{grid-template-columns:1fr}
    .how-grid{grid-template-columns:1fr}
    .game-thumb{height:200px}
    .tg-frame-embed{display:none}
    .tg-frame-fallback{display:flex}
  }
  @media(max-width:400px){
    .btn-ghost{display:none}
  }
  </style>`}

<!--
  This standalone page injects its own GLOBAL stylesheet whose generic
  selectors (nav, .hero, .game-thumb, ...) collide with other routes' global
  CSS — notably the landing page's home.css. Preloading another route from
  here (e.g. hovering the logo, which points to "/") would inject that route's
  CSS and override this page's layout. Disabling preload on the whole page
  prevents that. display:contents keeps the wrapper layout-neutral.
-->
<div style="display:contents" data-sveltekit-preload-data="off" data-sveltekit-preload-code="off">
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <symbol id="i-bolt" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4.09 12.97a.5.5 0 0 0 .41.8H11l-1 8.23a.5.5 0 0 0 .9.34L19.91 11.03a.5.5 0 0 0-.41-.8H13l1-8.23a.5.5 0 0 0-1-0Z"/></symbol>
    <symbol id="i-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
    <symbol id="i-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></symbol>
    <symbol id="i-bell" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0"/></symbol>
    <symbol id="i-game" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M7 12h3M8.5 10.5v3M14 12h.01M17 12h.01M15.5 14h.01"/></symbol>
    <symbol id="i-coin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 9h4.5a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3H15"/></symbol>
    <symbol id="i-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c2 4 6 5.5 6 11a6 6 0 1 1-12 0c0-3 1.5-5 3-6 0 3 1 4 3 4-1-4 0-7 0-9Z"/></symbol>
    <symbol id="i-trophy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v6a5 5 0 0 1-10 0V4Z"/><path d="M17 6h2a2 2 0 0 1 2 2 4 4 0 0 1-4 4M7 6H5a2 2 0 0 0-2 2 4 4 0 0 0 4 4M9 18h6M10 22h4M12 15v3"/></symbol>
    <symbol id="i-gift" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8"/></symbol>
    <symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></symbol>
    <symbol id="i-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></symbol>
    <symbol id="i-spark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M5.6 18.4l2-2M16.4 7.6l2-2"/></symbol>
    <symbol id="i-wallet" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7H5a2 2 0 0 1 0-4h14v4ZM3 5v14a2 2 0 0 0 2 2h16V7H5a2 2 0 0 1-2-2Z"/><path d="M17 14h.01"/></symbol>
    <symbol id="i-star" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/></symbol>
  </defs>
</svg>

<nav id="nav">
  <div class="wrap nav-row">
    <a href="/" class="brand">
      <span class="brand-mark"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4.09 12.97a.5.5 0 0 0 .41.8H11l-1 8.23a.5.5 0 0 0 .9.34L19.91 11.03a.5.5 0 0 0-.41-.8H13l1-8.23a.5.5 0 0 0-1-0Z"/></svg></span>
      EarnMaze
    </a>
    <div class="nav-links">
      <a href="/#how" data-sveltekit-reload>How it works</a>
      <a href="/#earn" data-sveltekit-reload>Earn</a>
      <a href="/games" class="active">Play</a>
      <a href="/paid-surveys" data-sveltekit-reload>Surveys</a>
      <a href="/quizzes" data-sveltekit-reload>Quizzes</a>
      <a href="/artifacts" data-sveltekit-reload>Artifacts</a>
      <a href="/#faq" data-sveltekit-reload>FAQ</a>
    </div>
    <div class="nav-actions">
      <span class="coin-pill"><span class="dot"></span>2,480 pts</span>
      <button class="bell" aria-label="Notifications"><svg class="i" viewBox="0 0 24 24"><use href="#i-bell"/></svg><span class="pip"></span></button>
      <a href="/login" class="btn-ghost">Log in</a>
      <a href="/register" class="btn btn-pri">Sign up free</a>
    </div>
  </div>
</nav>

<section class="hero">
  <div class="wrap hero-grid">
    <div>
      <span class="hero-eb"><span class="dot"></span>Play &amp; Earn <span class="sep">·</span> 91 games live</span>
      <h1>Real games.<br /><em>Real rewards.</em></h1>
      <p class="lead">HTML5 games, instant load, real money on the line. Tap, play, cash out — no downloads, no nonsense.</p>

      <div class="cashouts">
        <div class="cashouts-h">
          <span class="l"><span class="dot"></span>Latest cashouts</span>
          <span class="r">just now</span>
        </div>
        {#each CASHOUTS as c (c.name)}
          <div class="cashout">
            <span class="avatar" style="background:{c.color}">{c.initials}</span>
            <div class="info">
              <div class="n">{c.name}</div>
              <div class="s">{c.sub}</div>
            </div>
            <span class="v">{c.pts}</span>
          </div>
        {/each}
      </div>
    </div>
    <div>
      <div class="tg-card">
        <div class="tg-h">
          <span class="l"><svg class="i" viewBox="0 0 24 24"><use href="#i-bolt"/></svg> Today's game</span>
          <span class="r"><span class="dot"></span>Resets in <em>{resetCountdown}</em></span>
        </div>
        <div class="tg-preview">
          <span class="tg-live"><span class="dot"></span>Live</span>
          {#if dailyPick.thumb}
            <img class="tg-frame" src={dailyPick.thumb} alt="{dailyPick.name} cover" />
          {:else}
            <iframe class="tg-frame tg-frame-embed" src={dailyPick.path} title="{dailyPick.name} preview" loading="lazy" scrolling="no" tabindex="-1"></iframe>
            <div class="tg-frame-fallback" aria-hidden="true">
              <svg class="i-lg" viewBox="0 0 24 24"><use href="#i-game"/></svg>
              <span>{dailyPick.name}</span>
            </div>
          {/if}
          <button class="tg-overlay" onclick={() => (openGame = dailyPick)} aria-label="Play {dailyPick.name}"></button>
          <span class="tg-corner tl"></span><span class="tg-corner tr"></span>
          <span class="tg-corner bl"></span><span class="tg-corner br"></span>
        </div>
        <div class="tg-title">{dailyPickTitle}</div>
        <div class="tg-meta">{todayLabel} · <em>admin-curated</em> · 3,184 players today</div>
        <div class="tg-foot">
          <div class="tg-bonus">+500<em>pts bonus</em></div>
          <button class="btn btn-pri" onclick={() => (openGame = dailyPick)}>Play <svg class="i" viewBox="0 0 24 24"><use href="#i-play"/></svg></button>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="stats">
  <div class="wrap">
    <div class="stats-grid">
      <div class="stat">
        <div class="stat-h">
          <span class="stat-ico acc"><svg class="i" viewBox="0 0 24 24"><use href="#i-game"/></svg></span>
          <svg class="stat-sp" viewBox="0 0 60 18"><path d="M0,12 L12,10 L24,11 L36,7 L48,8 L60,4" fill="none" stroke="#c7f463" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
        <div class="stat-v">91</div>
        <div class="stat-l">Games available</div>
        <div class="stat-d up">+6 added this week</div>
      </div>
      <div class="stat">
        <div class="stat-h">
          <span class="stat-ico warn"><svg class="i" viewBox="0 0 24 24"><use href="#i-coin"/></svg></span>
          <svg class="stat-sp" viewBox="0 0 60 18"><path d="M0,13 L12,12 L24,9 L36,10 L48,5 L60,3" fill="none" stroke="#ffb74a" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
        <div class="stat-v">1,840</div>
        <div class="stat-l">Points earned today</div>
        <div class="stat-d up">+340 in last hour</div>
      </div>
      <div class="stat">
        <div class="stat-h">
          <span class="stat-ico bad"><svg class="i" viewBox="0 0 24 24"><use href="#i-flame"/></svg></span>
        </div>
        <div class="stat-v">7</div>
        <div class="stat-l">Day streak</div>
        <div class="stat-dots">
          <span class="on"></span><span class="on"></span><span class="on"></span><span class="on"></span><span class="on"></span><span class="on"></span><span class="on"></span>
        </div>
      </div>
      <div class="stat">
        <div class="stat-h">
          <span class="stat-ico purple"><svg class="i" viewBox="0 0 24 24"><use href="#i-trophy"/></svg></span>
        </div>
        <div class="stat-v">#842</div>
        <div class="stat-l">Weekly rank</div>
        <div class="stat-d up">↑ 124 since yesterday</div>
      </div>
    </div>
  </div>
</section>

<section class="cont">
  <div class="wrap">
    <div class="cont-head">
      <h3>Continue playing</h3>
      <a href="/dashboard">View all history <svg class="i" viewBox="0 0 24 24"><use href="#i-arrow"/></svg></a>
    </div>
    <div class="cont-grid">
      {#each CONTINUE as c, i (i)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="cont-card" onclick={() => { const g = GAMES.find(x => x.name.startsWith(c.name.replace('…',''))); if (g) openGame = g; }}>
          <div class="cont-ico" style="background:{c.bg}"></div>
          <div class="cont-info">
            <div class="n">{c.name}</div>
            <div class="s">{c.sub}</div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<section class="main">
  <div class="wrap main-grid">
    <div>
      <div class="toolbar">
        <div class="tabs">
          {#each FILTERS as f (f.cat)}
            <button class="tab" class:sel={activeFilter === f.cat} onclick={() => (activeFilter = f.cat)}>
              <svg class="i" viewBox="0 0 24 24"><use href="#i-game"/></svg>
              {f.label} <span class="ct">{f.count}</span>
            </button>
          {/each}
        </div>
        <div class="sort">
          <span>Sort:</span>
          <div class="sort-pills">
            <button class="sort-pill" class:sel={sortBy === 'popular'} onclick={() => (sortBy = 'popular')}>Popular</button>
            <button class="sort-pill" class:sel={sortBy === 'new'} onclick={() => (sortBy = 'new')}>New</button>
            <button class="sort-pill" class:sel={sortBy === 'reward'} onclick={() => (sortBy = 'reward')}>Top reward</button>
          </div>
        </div>
      </div>

      <div class="grid">
        {#each filteredGames as game (game.id)}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="game-card" onclick={() => (openGame = game)}>
            <div class="game-thumb" style="background:{game.bg}">
              <img class="game-cover" src={game.cover} alt={game.name} />
              <span class="play-count">{game.plays} playing</span>
              {#if game.badge === 'hot'}
                <span class="play-badge hot"><svg class="i" viewBox="0 0 24 24"><use href="#i-flame"/></svg> Hot</span>
              {:else if game.badge === 'new'}
                <span class="play-badge new">New</span>
              {/if}
            </div>
            <div class="game-body">
              <div class="game-h">
                <h4>{game.name}</h4>
                <span class="rt"><svg class="i" viewBox="0 0 24 24" style="width:11px;height:11px"><use href="#i-star"/></svg> {game.rating}</span>
              </div>
              <p class="game-desc">{game.desc}</p>
              <div class="game-tags">
                <span class="gtag {game.diff}">{game.diff}</span>
                <span class="gtag">{game.cat}</span>
                <span class="gtag">{game.time}</span>
              </div>
            </div>
            <div class="game-foot">
              <span class="rw">{game.reward} pts</span>
              <button class="play-btn" onclick={(e) => { e.stopPropagation(); openGame = game; }}>Play <svg class="i" viewBox="0 0 24 24"><use href="#i-play"/></svg></button>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <aside class="side">
      <div class="side-card">
        <div class="side-h">
          <h4><svg class="i" viewBox="0 0 24 24"><use href="#i-trophy"/></svg> This week's top</h4>
          <span class="l">All ranks</span>
        </div>
        {#each LEADERBOARD as r (r.rank)}
          <div class="lb-row" class:me={r.me}>
            <span class="lb-rk">{String(r.rank).padStart(2, '0')}</span>
            <span class="lb-av" style="background:{r.color}">{r.initials}</span>
            <span class="lb-n">{r.name}</span>
            <span class="lb-p">{r.pts}</span>
          </div>
        {/each}
      </div>

      <div class="side-card">
        <div class="side-h">
          <h4><svg class="i" viewBox="0 0 24 24"><use href="#i-bolt"/></svg> Just won</h4>
          <span class="l">Live</span>
        </div>
        {#each JUST_WON as j, i (i)}
          <div class="jw-row">
            <span class="jw-av" style="background:{j.color}">{j.initials}</span>
            <div class="jw-i">
              <div class="jw-n">{j.name}</div>
              <div class="jw-s">{j.sub}</div>
            </div>
            <span class="jw-p">{j.pts}</span>
          </div>
        {/each}
      </div>

      <div class="side-card">
        <div class="side-h">
          <h4><svg class="i" viewBox="0 0 24 24"><use href="#i-gift"/></svg> Daily login</h4>
          <span class="l">Day 7 / 7</span>
        </div>
        <div class="dl-row">
          <div class="dl-cell"><svg class="i" viewBox="0 0 24 24"><use href="#i-check"/></svg></div>
          <div class="dl-cell"><svg class="i" viewBox="0 0 24 24"><use href="#i-check"/></svg></div>
          <div class="dl-cell"><svg class="i" viewBox="0 0 24 24"><use href="#i-check"/></svg></div>
          <div class="dl-cell"><svg class="i" viewBox="0 0 24 24"><use href="#i-check"/></svg></div>
          <div class="dl-cell"><svg class="i" viewBox="0 0 24 24"><use href="#i-check"/></svg></div>
          <div class="dl-cell"><svg class="i" viewBox="0 0 24 24"><use href="#i-check"/></svg></div>
          <div class="dl-cell bonus">+250</div>
        </div>
        <div class="dl-foot">
          <span class="l">Today's bonus</span>
          <span class="v">+250 pts</span>
        </div>
      </div>
    </aside>
  </div>
</section>

<section class="wcup">
  <div class="wrap">
    <div class="wcup-card">
      <div class="wcup-l">
        <span class="eb"><span class="dot"></span>Weekend cup · Live</span>
        <h2>Solitaire <em>showdown.</em></h2>
        <p>14,832 players. One prize pool. Highest score by Sunday midnight takes it all.</p>
        <div class="wcup-prize">
          <span class="v">$2,500</span>
          <span class="l">Prize pool</span>
        </div>
        <div style="display:flex;align-items:center;flex-wrap:wrap">
          <button class="wcup-btn" onclick={() => { const g = GAMES.find(x => x.id === 'solitaire'); if (g) openGame = g; }}>Enter for 500 pts <svg class="i" viewBox="0 0 24 24"><use href="#i-arrow"/></svg></button>
          <span class="wcup-meta">Ends Sunday · 2d 6h 14m</span>
        </div>
      </div>
      <div class="wcup-r">
        {#each WEEKEND_LB as w (w.rank)}
          <div class="wcup-row">
            <span class="wcup-rk" style="background:{w.color}">{w.rank}</span>
            <div class="wcup-rinfo">
              <div class="wcup-rn">{w.name}</div>
              <div class="wcup-rs">{w.pts}</div>
            </div>
            <span class="wcup-rp">{w.prize}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>

<section class="how">
  <div class="wrap">
    <div class="how-head">
      <span class="eb"><span class="dot"></span>How it works</span>
      <h2>Tap, play, cash out.</h2>
    </div>
    <div class="how-grid">
      <div class="how-step">
        <div class="n">01</div>
        <div class="ico"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-game"/></svg></div>
        <h3>Pick a game</h3>
        <p>91 HTML5 titles. Load in &lt;2s. Nothing to download or install.</p>
      </div>
      <div class="how-step">
        <div class="n">02</div>
        <div class="ico"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-play"/></svg></div>
        <h3>Play your round</h3>
        <p>Standard rules. Standard fun. The longer you survive, the bigger the reward.</p>
      </div>
      <div class="how-step">
        <div class="n">03</div>
        <div class="ico"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-coin"/></svg></div>
        <h3>Earn points live</h3>
        <p>Score updates your balance instantly. No waiting, no minimums, no caps.</p>
      </div>
      <div class="how-step">
        <div class="n">04</div>
        <div class="ico"><svg class="i-lg i" viewBox="0 0 24 24"><use href="#i-gift"/></svg></div>
        <h3>Cash out</h3>
        <p>Convert at 100 pts = $1. Gift cards, PayPal, crypto — same day, no fees.</p>
      </div>
    </div>
  </div>
</section>

<section class="faq">
  <div class="wrap">
    <h2>Common questions.</h2>
    <div class="faq-list">
      {#each FAQ as item, i (i)}
        <div class="faq-item" class:open={faqOpen === i}>
          <button class="faq-q" onclick={() => toggleFaq(i)}>{item.q}
            <span class="faq-icon"><svg class="i" viewBox="0 0 24 24"><use href="#i-plus"/></svg></span>
          </button>
          <div class="faq-a"><div class="faq-a-in">{item.a}</div></div>
        </div>
      {/each}
    </div>
  </div>
</section>

<section class="cta">
  <div class="wrap cta-inner">
    <h2>2,341 people are playing right now.</h2>
    <p>Join in. Your first game's free, your first cash-out is in 15 minutes.</p>
    <div class="cta-ctas">
      <button class="btn btn-pri" onclick={() => { activeFilter = 'all'; document.querySelector('.main')?.scrollIntoView({behavior:'smooth'}); }}>Pick a game <svg class="i" viewBox="0 0 24 24"><use href="#i-arrow"/></svg></button>
      <a href="/" class="btn btn-sec">Back to home</a>
    </div>
  </div>
</section>

<div class="foot-mini">© 2026 EarnMaze · Play &amp; Earn</div>

{#if openGame}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
    <div class="modal">
      <div class="modal-head">
        <div class="modal-head-l">
          <div class="modal-ic"><svg class="i" viewBox="0 0 24 24"><use href="#i-game"/></svg></div>
          <div>
            <div class="modal-title">{openGame.name}</div>
            <div class="modal-sub">Earn {openGame.reward} pts</div>
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
        use:persistState={`games:${openGame.id}`}
      ></iframe>
    </div>
  </div>
{/if}
</div>
