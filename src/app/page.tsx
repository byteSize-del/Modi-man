'use client'

import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Volume2, VolumeX, Share2, ChevronRight, ChevronLeft, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Home, RotateCcw, Github, Star, Trophy, X, MessageSquare, Copy } from "lucide-react";

// ============== CONSTANTS ==============
const INITIAL_MAZE = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 3, 1, 1, 0, 1, 2, 1, 0, 1, 1, 3, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 2, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 0, 1, 4, 1, 0, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 2, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 3, 1, 1, 0, 1, 0, 1, 0, 1, 1, 3, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const GRID = { cols: 13, rows: 13 };
const CELL = 60;

type Screen = 'menu' | 'playing' | 'gameover';
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Character = 'modi' | 'rahul';

interface GhostState {
  x: number;
  y: number;
  dir: Direction;
}

// ============== SOUND ENGINE ==============
class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  setMuted(m: boolean) { this.muted = m; }

  play(type: 'dot' | 'power' | 'ghost' | 'death' | 'win') {
    if (this.muted) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      switch (type) {
        case 'dot':
          osc.type = 'square';
          osc.frequency.setValueAtTime(600, now);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.start(now); osc.stop(now + 0.1);
          break;
        case 'power':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.start(now); osc.stop(now + 0.35);
          break;
        case 'ghost':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(900, now + 0.2);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now); osc.stop(now + 0.25);
          break;
        case 'death':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(500, now);
          osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
          osc.start(now); osc.stop(now + 0.55);
          break;
        case 'win':
          osc.type = 'square';
          osc.frequency.setValueAtTime(523, now);
          osc.frequency.setValueAtTime(659, now + 0.15);
          osc.frequency.setValueAtTime(784, now + 0.3);
          osc.frequency.setValueAtTime(1047, now + 0.45);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
          osc.start(now); osc.stop(now + 0.6);
          break;
      }
    } catch { /* ignore audio errors */ }
  }
}

const sound = new SoundEngine();

// ============== CHARACTER DATA ==============
const CHARACTERS: { id: Character; name: string; img: string; color: string; glowColor: string }[] = [
  { id: 'modi', name: 'MODI', img: '/characters/modi/5.png', color: '#FF6B00', glowColor: 'rgba(255,107,0,0.6)' },
  { id: 'rahul', name: 'RAHUL', img: '/characters/rahul/3.png', color: '#00E5FF', glowColor: 'rgba(0,229,255,0.6)' },
];

const GHOST_DATA = [
  { img: '/characters/rahul/1.png', color: '#FF0044' },
  { img: '/characters/modi/7.png', color: '#00FF88' },
  { img: '/characters/rahul/2.png', color: '#FF69B4' },
];

// ============== MAIN COMPONENT ==============
export default function ModimanGame() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [character, setCharacter] = useState<Character>('modi');
  const [isMuted, setIsMuted] = useState(false);
  const [score, setScore] = useState(0);
  const [hiScore, setHiScore] = useState(() => {
    if (typeof window !== 'undefined') return parseInt(localStorage.getItem('modiman_hi') || '0');
    return 0;
  });
  const [lives, setLives] = useState(3);
  const [won, setWon] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Audio refs
  const charAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const gameOverAudioRef = useRef<HTMLAudioElement | null>(null);
  const crashAudioRef = useRef<HTMLAudioElement | null>(null);
  const isMutedRef = useRef(isMuted);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // Game refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mazeRef = useRef<number[][]>(INITIAL_MAZE.map(r => [...r]));
  const playerRef = useRef({ x: 6, y: 10, nextDir: null as Direction | null, currentDir: null as Direction | null });
  const ghostsRef = useRef<GhostState[]>([
    { x: 5, y: 5, dir: 'LEFT' as Direction },
    { x: 6, y: 5, dir: 'UP' as Direction },
    { x: 7, y: 5, dir: 'RIGHT' as Direction },
  ]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const loopRef = useRef<NodeJS.Timeout | null>(null);
  const animRef = useRef<number>(0);
  const [canvasScale, setCanvasScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const scoreBarRef = useRef<HTMLDivElement>(null);
  const dpadRef = useRef<HTMLDivElement>(null);

  // Preload images
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    const paths: string[] = [
      '/characters/modi/5.png', '/characters/modi/6.png', '/characters/modi/7.png',
      '/characters/rahul/1.png', '/characters/rahul/2.png', '/characters/rahul/3.png',
      '/characters/8.png', '/favicon.png', '/win/winmodi.png', '/win/winrahul.png',
    ];
    let loaded = 0;
    paths.forEach(p => {
      const img = new Image();
      img.onload = img.onerror = () => { loaded++; if (loaded === paths.length) setImagesLoaded(true); };
      img.src = p;
      imagesRef.current[p] = img;
    });
  }, []);

  useEffect(() => { sound.setMuted(isMuted); }, [isMuted]);

  useEffect(() => {
    if (score > hiScore) {
      setHiScore(score);
      localStorage.setItem('modiman_hi', score.toString());
    }
  }, [score, hiScore]);

  // ============== BACKGROUND MUSIC ==============
  useEffect(() => {
    if (screen === 'playing') {
      // Create bg music if not already created
      if (!bgMusicRef.current) {
        const audio = new Audio('/audio/bg_music.mp3');
        audio.loop = true;
        audio.volume = 0.7;
        bgMusicRef.current = audio;
      }
      // Play or pause based on mute
      if (!isMuted) {
        bgMusicRef.current.play().catch(() => {});
      } else {
        bgMusicRef.current.pause();
      }
    }

    // Stop bg music when leaving game screen
    if (screen !== 'playing' && bgMusicRef.current) {
      bgMusicRef.current.pause();
      bgMusicRef.current.currentTime = 0;
      bgMusicRef.current = null;
    }

    // Stop crash audio when leaving game screen
    if (screen !== 'playing' && crashAudioRef.current) {
      crashAudioRef.current.pause();
      crashAudioRef.current.currentTime = 0;
      crashAudioRef.current = null;
    }
  }, [screen]);

  // Toggle bg music on mute/unmute
  useEffect(() => {
    if (screen !== 'playing') return;
    if (isMuted && bgMusicRef.current) {
      bgMusicRef.current.pause();
    } else if (!isMuted && bgMusicRef.current) {
      bgMusicRef.current.play().catch(() => {});
    }
  }, [isMuted, screen]);

  // ============== GAME OVER AUDIO ==============
  useEffect(() => {
    if (screen === 'gameover') {
      // Stop bg music first
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current.currentTime = 0;
        bgMusicRef.current = null;
      }

      // Stop crash audio if still playing
      if (crashAudioRef.current) {
        crashAudioRef.current.pause();
        crashAudioRef.current.currentTime = 0;
        crashAudioRef.current = null;
      }

      // Cleanup game over audio ref
      if (gameOverAudioRef.current) {
        gameOverAudioRef.current.pause();
        gameOverAudioRef.current = null;
      }
      // No audio file playback on game over screen
    }

    // Cleanup game over audio when leaving
    if (screen !== 'gameover' && gameOverAudioRef.current) {
      gameOverAudioRef.current.pause();
      gameOverAudioRef.current.currentTime = 0;
      gameOverAudioRef.current = null;
    }
  }, [screen, isMuted]);

  // ============== GAME LOGIC ==============
  const moveEntity = useCallback((x: number, y: number, dir: Direction | null) => {
    if (!dir) return { x, y };
    let nx = x, ny = y;
    if (dir === 'UP') ny--;
    if (dir === 'DOWN') ny++;
    if (dir === 'LEFT') nx--;
    if (dir === 'RIGHT') nx++;
    if (nx < 0) nx = GRID.cols - 1;
    if (nx >= GRID.cols) nx = 0;
    const maze = mazeRef.current;
    if (maze[ny] && maze[ny][nx] !== 1 && maze[ny][nx] !== 4) return { x: nx, y: ny };
    return { x, y };
  }, []);

  const resetGame = useCallback(() => {
    mazeRef.current = INITIAL_MAZE.map(r => [...r]);
    playerRef.current = { x: 6, y: 10, nextDir: null, currentDir: null };
    ghostsRef.current = [
      { x: 5, y: 5, dir: 'LEFT' },
      { x: 6, y: 5, dir: 'UP' },
      { x: 7, y: 5, dir: 'RIGHT' },
    ];
    scoreRef.current = 0;
    livesRef.current = 3;
    setScore(0);
    setLives(3);
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    setScreen('playing');
    setWon(false);
  }, [resetGame]);

  const handleDirection = useCallback((dir: Direction) => {
    playerRef.current.nextDir = dir;
  }, []);

  // Game loop
  useEffect(() => {
    if (screen !== 'playing') return;

    const opposites: Record<Direction, Direction> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
    const allDirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

    const loop = setInterval(() => {
      const p = playerRef.current;

      // Move player
      let nextPos = p.nextDir ? moveEntity(p.x, p.y, p.nextDir) : { x: p.x, y: p.y };
      if (nextPos.x !== p.x || nextPos.y !== p.y) {
        p.currentDir = p.nextDir;
        p.nextDir = null;
        p.x = nextPos.x;
        p.y = nextPos.y;
      } else if (p.currentDir) {
        nextPos = moveEntity(p.x, p.y, p.currentDir);
        p.x = nextPos.x;
        p.y = nextPos.y;
      }

      // Check dot / power pellet
      const cell = mazeRef.current[p.y]?.[p.x];
      if (cell === 0) {
        mazeRef.current[p.y][p.x] = 2;
        scoreRef.current += 10;
        sound.play('dot');
        setScore(scoreRef.current);
      } else if (cell === 3) {
        mazeRef.current[p.y][p.x] = 2;
        scoreRef.current += 50;
        sound.play('power');
        setScore(scoreRef.current);
      }

      // Move ghosts
      const gList = ghostsRef.current;
      gList.forEach(g => {
        let bestDir: Direction | null = null;
        let minDist = Infinity;
        allDirs.forEach(d => {
          if (d === opposites[g.dir]) return;
          const test = moveEntity(g.x, g.y, d);
          if (test.x !== g.x || test.y !== g.y) {
            const dist = Math.abs(test.x - p.x) + Math.abs(test.y - p.y);
            if (dist < minDist) { minDist = dist; bestDir = d; }
          }
        });
        if (!bestDir) {
          const revTest = moveEntity(g.x, g.y, opposites[g.dir]);
          if (revTest.x !== g.x || revTest.y !== g.y) bestDir = opposites[g.dir];
        }
        if (bestDir) {
          const nPos = moveEntity(g.x, g.y, bestDir);
          g.x = nPos.x; g.y = nPos.y; g.dir = bestDir;
        }
      });

      // Collision
      const hit = gList.find(g => g.x === p.x && g.y === p.y);
      if (hit) {
        // Play character-specific crash audio
        if (!isMutedRef.current) {
          // Stop previous crash audio if still playing
          if (crashAudioRef.current) {
            crashAudioRef.current.pause();
            crashAudioRef.current.currentTime = 0;
          }
          const crashSrc = character === 'modi' ? '/audio/khatam.mp3' : '/audio/laure-na-bhujjam-x-modi.mp3';
          const crashAudio = new Audio(crashSrc);
          crashAudio.volume = 0.7;
          crashAudioRef.current = crashAudio;
          crashAudio.play().catch(() => {});
        }
        sound.play('death');
        if (livesRef.current > 1) {
          livesRef.current--;
          setLives(livesRef.current);
          p.x = 6; p.y = 10; p.currentDir = null; p.nextDir = null;
          gList[0] = { x: 5, y: 5, dir: 'LEFT' };
          gList[1] = { x: 6, y: 5, dir: 'UP' };
          gList[2] = { x: 7, y: 5, dir: 'RIGHT' };
        } else {
          setLives(0);
          setWon(false);
          setScreen('gameover');
          clearInterval(loop);
        }
      }

      // Win check
      if (!mazeRef.current.some(row => row.includes(0) || row.includes(3))) {
        sound.play('win');
        setWon(true);
        setScreen('gameover');
        clearInterval(loop);
      }
    }, 280);

    loopRef.current = loop;
    return () => { clearInterval(loop); loopRef.current = null; };
  }, [screen, moveEntity]);

  // ============== CANVAS RENDERING ==============
  useEffect(() => {
    if (screen !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = GRID.cols * CELL;
    const H = GRID.rows * CELL;
    canvas.width = W;
    canvas.height = H;

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, W, H);

      const maze = mazeRef.current;
      const p = playerRef.current;
      const ghosts = ghostsRef.current;

      // Draw maze
      for (let y = 0; y < GRID.rows; y++) {
        for (let x = 0; x < GRID.cols; x++) {
          const cell = maze[y]?.[x];
          const cx = x * CELL;
          const cy = y * CELL;

          if (cell === 1) {
            ctx.fillStyle = '#0d1b2a';
            ctx.fillRect(cx + 4, cy + 4, CELL - 8, CELL - 8);
            ctx.strokeStyle = '#1b3a5c';
            ctx.lineWidth = 2;
            ctx.strokeRect(cx + 4, cy + 4, CELL - 8, CELL - 8);

            const hasPathNeighbor = (nx: number, ny: number) => {
              if (nx < 0 || nx >= GRID.cols || ny < 0 || ny >= GRID.rows) return false;
              return maze[ny][nx] !== 1;
            };
            if (hasPathNeighbor(x, y - 1)) { ctx.fillStyle = 'rgba(0,229,255,0.15)'; ctx.fillRect(cx + 4, cy + 4, CELL - 8, 2); }
            if (hasPathNeighbor(x, y + 1)) { ctx.fillStyle = 'rgba(0,229,255,0.15)'; ctx.fillRect(cx + 4, cy + CELL - 6, CELL - 8, 2); }
            if (hasPathNeighbor(x - 1, y)) { ctx.fillStyle = 'rgba(0,229,255,0.15)'; ctx.fillRect(cx + 4, cy + 4, 2, CELL - 8); }
            if (hasPathNeighbor(x + 1, y)) { ctx.fillStyle = 'rgba(0,229,255,0.15)'; ctx.fillRect(cx + CELL - 6, cy + 4, 2, CELL - 8); }
          }

          if (cell === 4) {
            ctx.fillStyle = '#1a0a0a';
            ctx.fillRect(cx + 4, cy + 4, CELL - 8, CELL - 8);
            ctx.strokeStyle = 'rgba(255,0,68,0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(cx + 4, cy + 4, CELL - 8, CELL - 8);
          }

          if (cell === 0) {
            ctx.beginPath();
            ctx.arc(cx + CELL / 2, cy + CELL / 2, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#FFD700';
            ctx.fill();
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0;
          }

          if (cell === 3) {
            const pulse = 0.6 + 0.4 * Math.sin(frame * 0.08);
            ctx.beginPath();
            ctx.arc(cx + CELL / 2, cy + CELL / 2, 14 * pulse + 6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0,229,255,${0.3 + 0.3 * pulse})`;
            ctx.fill();
            ctx.shadowColor = '#00E5FF';
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.shadowBlur = 0;

            const bImg = imagesRef.current['/characters/8.png'];
            if (bImg?.complete && bImg.naturalWidth > 0) {
              ctx.drawImage(bImg, cx + 6, cy + 6, CELL - 12, CELL - 12);
            }
          }
        }
      }

      // Draw ghosts
      ghosts.forEach((g, i) => {
        const gx = g.x * CELL;
        const gy = g.y * CELL;
        const gImg = character === 'modi'
          ? imagesRef.current[`/characters/rahul/${i === 0 ? 1 : i === 1 ? 2 : 3}.png`]
          : imagesRef.current[`/characters/modi/${i === 0 ? 5 : i === 1 ? 6 : 7}.png`];

        ctx.shadowColor = GHOST_DATA[i].color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(gx + CELL / 2, gy + CELL / 2, 24, 0, Math.PI * 2);
        ctx.fillStyle = `${GHOST_DATA[i].color}22`;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (gImg?.complete && gImg.naturalWidth > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(gx + CELL / 2, gy + CELL / 2, 26, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(gImg, gx + 4, gy + 4, CELL - 8, CELL - 8);
          ctx.restore();
        }

        ctx.fillStyle = GHOST_DATA[i].color;
        ctx.shadowColor = GHOST_DATA[i].color;
        ctx.shadowBlur = 4;
        const arrOff = 28;
        const arrSize = 5;
        let ax = gx + CELL / 2, ay = gy + CELL / 2;
        if (g.dir === 'UP') { ay -= arrOff; ctx.beginPath(); ctx.moveTo(ax, ay - arrSize); ctx.lineTo(ax - arrSize, ay + arrSize); ctx.lineTo(ax + arrSize, ay + arrSize); ctx.fill(); }
        if (g.dir === 'DOWN') { ay += arrOff; ctx.beginPath(); ctx.moveTo(ax, ay + arrSize); ctx.lineTo(ax - arrSize, ay - arrSize); ctx.lineTo(ax + arrSize, ay - arrSize); ctx.fill(); }
        if (g.dir === 'LEFT') { ax -= arrOff; ctx.beginPath(); ctx.moveTo(ax - arrSize, ay); ctx.lineTo(ax + arrSize, ay - arrSize); ctx.lineTo(ax + arrSize, ay + arrSize); ctx.fill(); }
        if (g.dir === 'RIGHT') { ax += arrOff; ctx.beginPath(); ctx.moveTo(ax + arrSize, ay); ctx.lineTo(ax - arrSize, ay - arrSize); ctx.lineTo(ax - arrSize, ay + arrSize); ctx.fill(); }
        ctx.shadowBlur = 0;
      });

      // Draw player
      const px = p.x * CELL;
      const py = p.y * CELL;
      const pImg = character === 'modi'
        ? imagesRef.current['/characters/modi/5.png']
        : imagesRef.current['/characters/rahul/3.png'];
      const pColor = character === 'modi' ? '#FF6B00' : '#00E5FF';

      ctx.shadowColor = pColor;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(px + CELL / 2, py + CELL / 2, 26, 0, Math.PI * 2);
      ctx.fillStyle = `${pColor}33`;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (pImg?.complete && pImg.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(px + CELL / 2, py + CELL / 2, 26, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(pImg, px + 4, py + 4, CELL - 8, CELL - 8);
        ctx.restore();
      }

      ctx.beginPath();
      ctx.arc(px + CELL / 2, py + CELL / 2, 28, 0, Math.PI * 2);
      ctx.strokeStyle = pColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = pColor;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(animRef.current); };
  }, [screen, character]);

  // ============== DYNAMIC SCALING ==============
  useLayoutEffect(() => {
    if (screen !== 'playing') return;
    const updateScale = () => {
      const headerH = headerRef.current?.offsetHeight || 0;
      const scoreH = scoreBarRef.current?.offsetHeight || 0;
      const dpadH = dpadRef.current?.offsetHeight || 0;
      const availW = window.innerWidth - 16;
      const availH = window.innerHeight - headerH - scoreH - dpadH - 16;
      const s = Math.min(1, availW / (GRID.cols * CELL), availH / (GRID.rows * CELL));
      setCanvasScale(Math.max(0.15, s));
    };
    updateScale();
    const onResize = () => updateScale();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [screen]);

  // ============== KEYBOARD ==============
  useEffect(() => {
    if (screen !== 'playing') return;
    const dirs: Record<string, Direction> = { ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT', w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT' };
    const onKey = (e: KeyboardEvent) => {
      if (dirs[e.key]) { e.preventDefault(); handleDirection(dirs[e.key]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, handleDirection]);

  // ============== SHARE ==============
  const handleShare = useCallback(async () => {
    const shareText = `I scored ${score} in MODIMAN! Can you beat me? Play here: `;
    if (navigator.share) {
      try { await navigator.share({ title: 'MODIMAN', text: shareText, url: '' }); } catch { setShareOpen(true); }
    } else { setShareOpen(true); }
  }, [score]);

  // ============== RENDER ==============
  const charColor = character === 'modi' ? '#FF6B00' : '#00E5FF';
  const charGlow = character === 'modi' ? 'rgba(255,107,0,0.6)' : 'rgba(0,229,255,0.6)';

  return (
    <div className="fixed inset-0 h-[100dvh] bg-[#0a0a0a] text-white overflow-hidden select-none" style={{ fontFamily: 'var(--font-bungee), var(--font-geist-mono), sans-serif' }}>

      {/* ============== MENU SCREEN ============== */}
      <AnimatePresence>
        {screen === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col items-center retro-grid scanline-overlay"
          >
            {/* Background */}
            <div
              className="absolute inset-0 z-0"
              style={{
                backgroundImage: 'url(/startbg.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                imageRendering: 'pixelated',
              }}
            />
            <div className="absolute inset-0 z-0 bg-black/70" />

            {/* Top bar */}
            <div className="absolute top-4 right-4 z-20 flex gap-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="neon-btn p-3 bg-black/80 border-2 border-[#1a1a2e] rounded-lg text-gray-400 hover:text-[#FFD700] hover:border-[#FFD700] hover:shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <button
                onClick={handleShare}
                className="neon-btn p-3 bg-black/80 border-2 border-[#1a1a2e] rounded-lg text-gray-400 hover:text-[#FFD700] hover:border-[#FFD700] hover:shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all"
              >
                <Share2 size={20} />
              </button>
            </div>

            {/* Main content */}
            <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center p-6 text-center">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mb-8 flex flex-col items-center gap-5"
              >
                {/* Logo */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden border-2 border-[#FFD700]/30 shadow-[0_0_30px_rgba(255,215,0,0.2)]"
                >
                  <img src="/favicon.png" alt="MODIMAN" className="w-full h-full object-contain" />
                </motion.div>

                {/* Title */}
                <div className="flex flex-col items-center">
                  <h1 className="glitch" data-text="MODIMAN">MODIMAN</h1>
                  <p className="chunky-text text-sm md:text-lg tracking-[8px] md:tracking-[12px] text-[#FF6B00]/80 mt-3" style={{ textShadow: '0 0 10px rgba(255,107,0,0.5)' }}>
                    KHELA HOBE
                  </p>
                </div>
              </motion.div>

              {/* Character Selection */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex flex-col md:flex-row gap-4 mb-6 w-full max-w-lg"
              >
                {CHARACTERS.map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setCharacter(ch.id);
                      // Play character selection audio
                      if (charAudioRef.current) {
                        charAudioRef.current.pause();
                        charAudioRef.current.currentTime = 0;
                      }
                      if (!isMuted) {
                        const audio = new Audio(ch.id === 'modi' ? '/audio/wah-modiji-wah.mp3' : '/audio/maja-aaya.mp3');
                        charAudioRef.current = audio;
                        audio.play().catch(() => {});
                      }
                    }}
                    className={`neon-btn relative flex-1 py-4 px-4 rounded-xl border-2 transition-all duration-200 gap-3 ${
                      character === ch.id
                        ? 'bg-black/80 scale-[1.03]'
                        : 'bg-black/50 border-[#1a1a2e] opacity-60 hover:opacity-80'
                    }`}
                    style={character === ch.id ? {
                      borderColor: ch.color,
                      boxShadow: `0 0 15px ${ch.glowColor}, inset 0 0 15px ${ch.glowColor}`,
                    } : {}}
                  >
                    {character === ch.id && <ChevronRight size={18} style={{ color: ch.color }} />}
                    <span className="chunky-text text-xs md:text-sm tracking-wider" style={character === ch.id ? { color: ch.color } : { color: '#999' }}>
                      {ch.name}
                    </span>
                    <div
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full overflow-hidden border-2"
                      style={{ borderColor: ch.color, boxShadow: `0 0 8px ${ch.glowColor}` }}
                    >
                      <img src={ch.img} alt={ch.name} className="w-full h-full object-contain" />
                    </div>
                  </button>
                ))}
              </motion.div>

              {/* Start Button */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={startGame}
                className="neon-btn px-8 py-4 md:py-5 rounded-xl border-2 bg-black text-[#FFD700] text-sm md:text-lg tracking-widest gap-3"
                style={{
                  borderColor: charColor,
                  boxShadow: `0 0 15px ${charGlow}, inset 0 0 15px ${charGlow}`,
                  animation: `neon-pulse 2s ease-in-out infinite`,
                  ['--neon-color' as string]: charColor,
                }}
              >
                <ChevronRight size={22} className="opacity-60 group-hover:opacity-100" />
                START GAME
                <ChevronLeft size={22} className="opacity-60 group-hover:opacity-100" />
              </motion.button>
            </div>

            {/* Footer */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 w-full p-2">
              <p className="text-[9px] md:text-[10px] text-white/50 text-center" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                Developed by <a href="https://github.com/byteSize-del" target="_blank" rel="noopener noreferrer" className="text-[#FFD700]/70 hover:text-[#FFD700] hover:underline">byteSize-del</a>
              </p>
              <a
                href=""
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] md:text-[10px] text-[#FFD700]/50 hover:text-[#FFD700] transition-colors flex items-center gap-1.5" style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                <Github size={12} /> Star on GitHub <Star size={12} className="animate-pulse" />
              </a>
              <p className="text-[8px] text-white/25 italic text-center mt-1" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                This game is for just fun. Not related to any political party or person.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============== GAME SCREEN ============== */}
      <AnimatePresence>
        {screen === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex flex-col bg-[#0a0a0a] overflow-hidden"
          >
            {/* Header */}
            <div ref={headerRef} className="flex items-center justify-between px-4 py-2 flex-shrink-0 z-50">
              <button
                onClick={() => setScreen('menu')}
                className="chunky-text text-gray-500 hover:text-[#FFD700] transition-colors text-xs tracking-wider"
              >
                &lt; BACK
              </button>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-gray-500 hover:text-[#FFD700] transition-colors"
              >
                {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
              </button>
            </div>

            {/* Score bar */}
            <div ref={scoreBarRef} className="flex flex-col items-center flex-shrink-0 px-4 py-1 z-50">
              <div className="flex w-full max-w-[600px] items-center justify-between">
                <div className="flex flex-col items-center">
                  <span className="chunky-text text-[8px] text-[#FF6B00]/70 tracking-wider">SCORE</span>
                  <span className="chunky-text text-sm text-white tabular-nums">{score.toString().padStart(6, '0')}</span>
                </div>
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <Heart
                      key={i}
                      size={14}
                      className={i < lives ? 'text-[#FF0044] fill-[#FF0044] drop-shadow-[0_0_6px_#FF0044]' : 'text-gray-800'}
                    />
                  ))}
                </div>
                <div className="flex flex-col items-center">
                  <span className="chunky-text text-[8px] text-[#00E5FF]/70 tracking-wider">HI-SCORE</span>
                  <span className="chunky-text text-sm text-white tabular-nums">{hiScore.toString().padStart(6, '0')}</span>
                </div>
              </div>
            </div>

            {/* Canvas container */}
            <div ref={containerRef} className="flex-1 relative flex items-center justify-center w-full min-h-0 px-2 py-2 overflow-hidden">
              <div className="canvas-glow relative">
                <canvas
                  ref={canvasRef}
                  style={{
                    width: GRID.cols * CELL * canvasScale,
                    height: GRID.rows * CELL * canvasScale,
                    imageRendering: 'auto',
                  }}
                />
              </div>
            </div>

            {/* D-Pad (mobile only) */}
            <div ref={dpadRef} className="md:hidden flex w-full items-center justify-center p-2 flex-shrink-0 z-50 bg-black/40 backdrop-blur-sm">
              <div className="grid grid-cols-3 grid-rows-3 gap-2">
                <div className="col-start-2">
                  <button
                    onClick={() => handleDirection('UP')}
                    className="flex h-14 w-14 items-center justify-center rounded-xl border-2 bg-black/80 transition-all active:scale-90"
                    style={{ borderColor: charColor, color: charColor, boxShadow: `0 0 8px ${charGlow}` }}
                  >
                    <ArrowUp size={28} />
                  </button>
                </div>
                <div className="col-start-1 row-start-2">
                  <button
                    onClick={() => handleDirection('LEFT')}
                    className="flex h-14 w-14 items-center justify-center rounded-xl border-2 bg-black/80 transition-all active:scale-90"
                    style={{ borderColor: charColor, color: charColor, boxShadow: `0 0 8px ${charGlow}` }}
                  >
                    <ArrowLeft size={28} />
                  </button>
                </div>
                <div className="col-start-2 row-start-2 flex items-center justify-center">
                  <div className="h-5 w-5 rounded-full" style={{ backgroundColor: `${charColor}33`, boxShadow: `0 0 8px ${charGlow}` }} />
                </div>
                <div className="col-start-3 row-start-2">
                  <button
                    onClick={() => handleDirection('RIGHT')}
                    className="flex h-14 w-14 items-center justify-center rounded-xl border-2 bg-black/80 transition-all active:scale-90"
                    style={{ borderColor: charColor, color: charColor, boxShadow: `0 0 8px ${charGlow}` }}
                  >
                    <ArrowRight size={28} />
                  </button>
                </div>
                <div className="col-start-2 row-start-3">
                  <button
                    onClick={() => handleDirection('DOWN')}
                    className="flex h-14 w-14 items-center justify-center rounded-xl border-2 bg-black/80 transition-all active:scale-90"
                    style={{ borderColor: charColor, color: charColor, boxShadow: `0 0 8px ${charGlow}` }}
                  >
                    <ArrowDown size={28} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============== GAME OVER / WIN SCREEN ============== */}
      <AnimatePresence>
        {screen === 'gameover' && (() => {
          // Determine which video & image to show
          const winnerIsModi = (character === 'modi' && won) || (character === 'rahul' && !won);
          const videoSrc = winnerIsModi ? '/win/modiwin.mp4' : '/win/rahulwin.mp4';
          const imageSrc = winnerIsModi ? '/win/winmodi.png' : '/win/winrahul.png';
          const resultColor = won ? '#FFD700' : '#FF0044';
          const resultGlow = won ? 'rgba(255,215,0,0.4)' : 'rgba(255,0,68,0.4)';

          return (
            <motion.div
              key="gameover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] retro-grid scanline-overlay p-4 md:p-6"
            >
              {/* Radial glow */}
              <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                  background: won
                    ? 'radial-gradient(circle at center, rgba(255,215,0,0.08) 0%, transparent 60%)'
                    : 'radial-gradient(circle at center, rgba(255,0,68,0.08) 0%, transparent 60%)',
                }}
              />

              {/* ── MOBILE layout: stacked ── */}
              <div className="md:hidden relative z-10 flex flex-col items-center gap-4 w-full max-w-sm">
                {/* Result text */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
                  className="flex flex-col items-center gap-1"
                >
                  <h1
                    className="chunky-text text-3xl tracking-wider text-center"
                    style={{
                      color: resultColor,
                      textShadow: `0 0 20px ${resultColor}99, 0 0 40px ${resultColor}44`,
                      animation: won ? 'none' : 'gameover-glitch 0.3s infinite',
                    }}
                  >
                    {won ? 'YOU WIN!' : 'GAME OVER'}
                  </h1>
                  <p className="chunky-text text-xs tracking-[4px] text-center" style={{ color: resultColor, opacity: 0.8 }}>
                    {(character === 'modi' ? 'MODI' : 'RAHUL')} {won ? 'WINS' : 'LOST'}
                  </p>
                </motion.div>

                {/* Video 9:16 + Win PNG side by side on mobile */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="flex gap-3 w-full items-center justify-center"
                >
                  {/* Video on LEFT */}
                  <div
                    className="relative w-[45%] max-w-[180px] rounded-2xl border-2 overflow-hidden flex-shrink-0"
                    style={{ borderColor: charColor, boxShadow: `0 0 20px ${charGlow}` }}
                  >
                    <div className="relative w-full" style={{ aspectRatio: '9/16' }}>
                      <video src={videoSrc} autoPlay loop playsInline className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                  </div>
                  {/* Win PNG on RIGHT */}
                  <div
                    className="relative w-[45%] max-w-[180px] rounded-2xl border-2 overflow-hidden flex-shrink-0"
                    style={{ borderColor: resultColor, boxShadow: `0 0 15px ${resultGlow}` }}
                  >
                    <div className="relative w-full" style={{ aspectRatio: '9/16' }}>
                      <img src={imageSrc} alt="Result" className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                    {won && (
                      <div className="absolute bottom-2 right-2 z-20">
                        <Trophy size={16} className="text-[#FFD700] drop-shadow-[0_0_5px_#000]" />
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Score */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="flex flex-col items-center gap-1"
                >
                  <span className="chunky-text text-[9px] tracking-[4px] text-[#FF6B00]/60 animate-pulse text-center">FINAL SCORE</span>
                  <span className="chunky-text text-3xl text-white tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] text-center">
                    {score.toString().padStart(6, '0')}
                  </span>
                </motion.div>

                {/* Buttons */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  className="flex flex-col gap-2.5 w-full"
                >
                  <button
                    onClick={startGame}
                    className="neon-btn w-full py-3.5 rounded-xl border-2 bg-black text-[#FFD700] text-xs tracking-wider gap-2"
                    style={{ borderColor: charColor, boxShadow: `0 0 12px ${charGlow}, inset 0 0 12px ${charGlow}` }}
                  >
                    <RotateCcw size={16} /> PLAY AGAIN
                  </button>
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => { resetGame(); setScreen('menu'); }}
                      className="neon-btn flex-1 py-3 rounded-xl border-2 border-[#1a1a2e] bg-black/80 text-gray-400 text-[10px] tracking-wider gap-1.5 hover:border-[#FFD700]/50 hover:text-[#FFD700]"
                    >
                      <Home size={14} /> MENU
                    </button>
                    <button
                      onClick={handleShare}
                      className="neon-btn flex-1 py-3 rounded-xl border-2 border-[#1a1a2e] bg-black/80 text-gray-400 text-[10px] tracking-wider gap-1.5 hover:border-[#FFD700]/50 hover:text-[#FFD700]"
                    >
                      <Share2 size={14} /> SHARE
                    </button>
                  </div>
                </motion.div>
              </div>

              {/* ── DESKTOP layout: video LEFT (9:16), win PNG RIGHT ── */}
              <div className="hidden md:flex relative z-10 w-full max-w-5xl items-stretch gap-8">
                {/* LEFT — 9:16 Video */}
                <motion.div
                  initial={{ x: -40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="w-[280px] lg:w-[320px] flex-shrink-0"
                >
                  <div
                    className="relative w-full rounded-2xl border-2 overflow-hidden"
                    style={{ borderColor: charColor, boxShadow: `0 0 25px ${charGlow}` }}
                  >
                    <div className="relative w-full" style={{ aspectRatio: '9/16' }}>
                      <video src={videoSrc} autoPlay loop playsInline className="absolute inset-0 w-full h-full object-cover z-10" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none z-20" />
                      {won && (
                        <div className="absolute bottom-3 right-3 z-30">
                          <Trophy size={22} className="text-[#FFD700] drop-shadow-[0_0_8px_#000]" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* RIGHT — Win PNG + Info + Buttons */}
                <motion.div
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="flex-1 flex flex-col items-start justify-between gap-5 py-2"
                >
                  {/* Result header */}
                  <div className="flex flex-col items-start gap-2">
                    <h1
                      className="chunky-text text-4xl lg:text-5xl tracking-wider text-left"
                      style={{
                        color: resultColor,
                        textShadow: `0 0 20px ${resultColor}99, 0 0 40px ${resultColor}44`,
                        animation: won ? 'none' : 'gameover-glitch 0.3s infinite',
                      }}
                    >
                      {won ? 'YOU WIN!' : 'GAME OVER'}
                    </h1>
                    <p className="chunky-text text-sm tracking-[4px] text-left" style={{ color: resultColor, opacity: 0.8 }}>
                      {won
                        ? (character === 'modi' ? 'MODI' : 'RAHUL')
                        : (character === 'modi' ? 'RAHUL' : 'MODI')
                      } {won ? 'WINS' : 'WINS'}
                    </p>
                  </div>

                  {/* Win image + Score side by side */}
                  <div className="flex flex-row items-end gap-6">
                    <motion.div
                      initial={{ rotate: -5, opacity: 0 }}
                      animate={{ rotate: 3, opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                      className="relative w-32 h-32 lg:w-40 lg:h-40 rounded-2xl border-2 overflow-hidden flex-shrink-0"
                      style={{ borderColor: resultColor, boxShadow: `0 0 20px ${resultGlow}` }}
                    >
                      <img src={imageSrc} alt="Winner" className="w-full h-full object-cover" />
                      {won && (
                        <div className="absolute bottom-1 right-1">
                          <Trophy size={18} className="text-[#FFD700] drop-shadow-[0_0_5px_#000]" />
                        </div>
                      )}
                    </motion.div>
                    <div className="flex flex-col items-start gap-2">
                      <span className="chunky-text text-[9px] tracking-[4px] text-[#FF6B00]/60 animate-pulse text-left">FINAL SCORE</span>
                      <span className="chunky-text text-4xl lg:text-5xl text-white tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] text-left">
                        {score.toString().padStart(6, '0')}
                      </span>
                    </div>
                  </div>

                  <div className="w-full border-t border-white/10" />

                  {/* Buttons */}
                  <div className="flex flex-row gap-3 w-full">
                    <button
                      onClick={startGame}
                      className="neon-btn flex-1 py-4 rounded-xl border-2 bg-black text-[#FFD700] text-xs tracking-wider gap-2"
                      style={{ borderColor: charColor, boxShadow: `0 0 12px ${charGlow}, inset 0 0 12px ${charGlow}` }}
                    >
                      <RotateCcw size={16} /> PLAY AGAIN
                    </button>
                    <button
                      onClick={handleShare}
                      className="neon-btn flex-1 py-4 rounded-xl border-2 border-[#1a1a2e] bg-black/80 text-gray-400 text-xs tracking-wider gap-2 hover:border-[#FFD700]/50 hover:text-[#FFD700]"
                    >
                      <Share2 size={16} /> SHARE
                    </button>
                    <button
                      onClick={() => { resetGame(); setScreen('menu'); }}
                      className="neon-btn py-4 px-4 rounded-xl border-2 border-[#1a1a2e] bg-black/80 text-gray-400 hover:border-[#FFD700]/50 hover:text-[#FFD700]"
                    >
                      <Home size={20} />
                    </button>
                  </div>

                  <p className="text-[8px] text-white/20 tracking-widest" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                    modiman-xi.vercel.app · code.itzpa1
                  </p>
                </motion.div>
              </div>

              {/* Disclaimer */}
              <p className="absolute bottom-2 text-[7px] text-white/20 italic text-center z-10" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                This game is for just fun. Not related to any political party or person.
              </p>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ============== SHARE SHEET ============== */}
      <AnimatePresence>
        {shareOpen && (
          <motion.div
            key="share"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShareOpen(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.2 }}
              className="w-full max-w-sm rounded-2xl border-2 bg-[#0d0d0d] p-6"
              style={{ borderColor: charColor, boxShadow: `0 0 20px ${charGlow}` }}
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="chunky-text text-base text-[#FFD700] tracking-wider" style={{ textShadow: '0 0 8px rgba(255,215,0,0.5)' }}>
                  SHARE SCORE
                </h2>
                <button onClick={() => setShareOpen(false)} className="text-gray-500 hover:text-[#FFD700] transition-colors">
                  <X size={22} />
                </button>
              </div>

              <div className="mb-4 text-center chunky-text text-sm text-white/80">
                I SCORED <span className="text-[#FFD700]">{score}</span> POINTS!
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4">
                {[
                  { name: 'WhatsApp', icon: <MessageSquare size={20} />, href: `https://wa.me/?text=${encodeURIComponent(`I scored ${score} in MODIMAN! Play: https://modiman-xi.vercel.app/`)}` },
                  { name: 'X', icon: <Share2 size={20} />, href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I scored ${score} in MODIMAN! Can you beat me? Play: https://modiman-xi.vercel.app/`)}` },
                  { name: 'Copy', icon: <Copy size={20} />, action: () => { navigator.clipboard.writeText('https://modiman-xi.vercel.app/'); alert('Link copied!'); } },
                ].map(item => (
                  <button
                    key={item.name}
                    onClick={() => item.action?.()}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => { if (item.action) e.preventDefault(); }}
                      className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#1a1a2e] bg-black group-hover:border-[#FFD700] group-hover:text-[#FFD700] group-hover:shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all text-gray-400"
                    >
                      {item.icon}
                    </a>
                    <span className="text-[8px] text-gray-500 group-hover:text-[#FFD700]" style={{ fontFamily: 'var(--font-geist-mono)' }}>{item.name}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShareOpen(false)}
                className="neon-btn w-full py-3 rounded-xl border-2 border-[#1a1a2e] bg-black text-gray-400 text-xs tracking-wider hover:border-[#FFD700]/50 hover:text-[#FFD700] transition-all"
              >
                CANCEL
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
