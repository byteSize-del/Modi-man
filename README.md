# 🎮 PAC-MAN

> A modern, fast-paced maze chase arcade game inspired by the classic Pac-Man. Built with Next.js, TypeScript, and Canvas rendering.

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-pacman--xi.vercel.app-FFFF00?style=for-the-badge&labelColor=000000)](https://pacman-xi.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-byteSize--del/Modi--man-000000?style=for-the-badge&logo=github)](https://github.com/byteSize-del/Modi-man)
[![Built with Next.js](https://img.shields.io/badge/Next.js-16.x-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## 🕹️ About

**PAC-MAN** is a retro arcade game reimagined for the modern web. Navigate through mazes, collect dots, and avoid ghosts while trying to beat your high score. Choose to play as **Pac-Man** or **Ghosts** and experience dynamic gameplay with immersive audio and smooth animations.

### Features

✨ **Core Gameplay**
- 🟡 Two playable characters: **Pac-Man** & **Ghosts**
- 🌀 Intelligent ghost AI with pathfinding
- 💛 Collectible dots and power pellets
- 👻 Dynamic collision detection and scoring
- 🎯 High score tracking (localStorage)

🎨 **Visual Polish**
- Retro arcade aesthetic with modern design
- Smooth canvas-based rendering
- Glowing neon effects
- Scanline overlay for authenticity
- Responsive design (mobile & desktop)
- Character selection with live preview

🔊 **Audio**
- Background maze music
- Sound effects for collectibles and collisions
- Character selection audio
- Mute toggle for accessibility
- Synth-based game event sounds

📱 **User Experience**
- Keyboard & D-Pad controls
- Share score functionality (WhatsApp, Twitter)
- Game statistics display
- Smooth animations with Framer Motion
- PWA-ready for offline play

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ or **Bun** runtime
- **npm**, **yarn**, **bun**, or **pnpm** (package managers)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/byteSize-del/Modi-man.git
   cd Modi-man
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env.local
   ```

4. **Start development server**
   ```bash
   bun run dev
   # or
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

---

## 🎮 How to Play

### Objective
Collect all dots on the maze to win. Avoid ghosts or lose a life!

### Characters
| Character | Goal | Color |
|-----------|------|-------|
| **Pac-Man** | Collect all dots, avoid ghosts | 🟡 Yellow |
| **Ghosts** | Chase Pac-Man and eliminate | 👻 Red, Cyan, Orange |

### Controls

**Keyboard:**
- ⬆️ Arrow Up / `W` - Move Up
- ⬇️ Arrow Down / `S` - Move Down
- ⬅️ Arrow Left / `A` - Move Left
- ➡️ Arrow Right / `D` - Move Right

**Mobile:**
- Use on-screen D-Pad controls

### Game Mechanics
- 🟡 **Small Dots** - 10 points each
- 💛 **Power Pellets** - 50 points each
- 👻 **Collision** - Lose 1 life
- 💀 **Game Over** - When all lives lost
- 🏆 **Victory** - Collect all dots

---

## 📊 Game Stats

- **Grid Size:** 13x13 maze cells
- **Lives:** 3 per game
- **Ghosts:** 3 opponents with independent AI
- **Score Display:** Real-time tracking
- **Difficulty:** Progressive (fixed for classic experience)

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js 16.x
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS + Custom CSS
- **Rendering:** HTML5 Canvas (60 FPS)
- **Animations:** Framer Motion
- **UI Components:** Radix UI, Lucide Icons

### Backend (Minimal)
- **Database:** Prisma + SQLite
- **API:** Next.js API Routes

### Tools
- **Package Manager:** Bun
- **Build Tool:** Turbopack
- **Linting:** ESLint
- **Post-processing:** PostCSS + Tailwind

---

## 📝 Available Scripts

```bash
# Development
bun run dev          # Start dev server on :3000

# Production
bun run build        # Build optimized bundle
bun start            # Start production server

# Maintenance
bun run lint         # Run ESLint
bun db:push          # Push Prisma schema
bun db:generate      # Generate Prisma client
bun db:migrate       # Run database migrations
bun db:reset         # Reset database
```

---

## 📂 Project Structure

```
Modi-man/
├── src/
│   ├── app/
│   │   ├── page.tsx         # Main game component
│   │   └── layout.tsx       # App layout
│   ├── components/          # Reusable components
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Utilities
├── public/
│   ├── audio/              # Game sounds
│   ├── characters/         # Character sprites
│   └── win/                # Victory videos
├── prisma/
│   └── schema.prisma       # Database schema
├── .env.example            # Environment template
├── next.config.ts          # Next.js config
├── tailwind.config.ts      # Tailwind config
└── README.md               # This file
```

---

## 🎯 Game Development Details

### Game Loop
- **Tick Rate:** 280ms per game cycle
- **Render Rate:** 60 FPS (requestAnimationFrame)
- **Collision Detection:** Grid-based
- **Ghost AI:** Manhattan distance pathfinding

### Audio Engine
- **Dot Collection:** Square wave (600Hz)
- **Power Pellet:** Rising sine wave (400-800Hz)
- **Collision:** Sawtooth sweep (300-900Hz)
- **Death:** Falling frequency (500-100Hz)
- **Victory:** Ascending notes (523-1047Hz)

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Connect your GitHub repo to Vercel
# Auto-deploys on push to main branch
# Visit: https://pacman-xi.vercel.app
```

### Self-Hosted
```bash
bun run build
bun start
# Runs on default port :3000
```

### Environment Variables
```env
DATABASE_URL=file:./db/custom.db
# Add your custom variables here
```

---

## 🎨 Customization

### Change Colors
Edit character colors in `src/app/page.tsx`:
```typescript
const CHARACTERS = [
  { id: 'modi', name: 'PAC-MAN', color: '#FFFF00', ... },
  { id: 'rahul', name: 'GHOSTS', color: '#FF1493', ... },
];
```

### Adjust Difficulty
Modify game loop interval in `useEffect` (line ~360):
```typescript
setInterval(() => { ... }, 280); // Change 280 to speed up/down
```

### Custom Maze
Edit `INITIAL_MAZE` constant:
```typescript
const INITIAL_MAZE = [
  [1, 1, 1, ...],  // 1 = wall, 0 = dot, 3 = power, 4 = ghost zone
  ...
];
```

---

## 🐛 Known Issues

- None reported yet! 🎉

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the **MIT License** - see [LICENSE](LICENSE) file for details.

---

## ✨ Credits

- **Developer:** [byteSize-del](https://github.com/byteSize-del)
- **Inspired by:** Classic Pac-Man arcade game
- **Built with:** Next.js, TypeScript, Tailwind CSS, Framer Motion

---

## 🔗 Links

- **Live Demo:** [pacman-xi.vercel.app](https://pacman-xi.vercel.app/)
- **GitHub:** [byteSize-del/Modi-man](https://github.com/byteSize-del/Modi-man)
- **Report Issues:** [GitHub Issues](https://github.com/byteSize-del/Modi-man/issues)

---

## 📞 Support

Have questions or feedback? 

- 💬 Open an issue on GitHub
- 📧 Reach out via email: [Your Email]
- 🌐 Connect on [Your Social]

---

<div align="center">

**Made with ❤️ for retro gaming enthusiasts**

*A classic arcade game, reimagined for the web.*

</div>
