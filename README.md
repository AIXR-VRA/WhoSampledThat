# 🎵 Who Sampled That?

<div align="center">
  <img src="src/assets/who sampled that logo small.png" alt="Who Sampled That Logo" width="200"/>
  
  **The Ultimate Music Guessing Game**
  
  *Test your music knowledge by identifying original samples and the songs that use them!*

  [![Deploy to Cloudflare Workers](https://github.com/Daniel-AIXR/PersonalApps/actions/workflows/deploy.yml/badge.svg)](https://github.com/Daniel-AIXR/PersonalApps/actions/workflows/deploy.yml)
  [![License: Private](https://img.shields.io/badge/License-Private-red.svg)](https://github.com/Daniel-AIXR/PersonalApps)
</div>

## 🎮 About the Game

"Who Sampled That?" is an interactive music guessing game that challenges players to identify:
- **Original Sample**: The source track that was sampled
- **New Track**: The modern song that uses the sample
- **Artist Names**: Who performed each track

Players compete in multiple rounds, earning points for correctly guessing the artist, track name, and identifying the sample connection. The game features a beautiful retro-inspired UI with animated musical notes, YouTube integration for audio playback, and a comprehensive tutorial system for new players.

## ✨ Features

### 🎯 Core Gameplay
- **Multi-Round Competition**: Progress through multiple tracks with increasing difficulty
- **Point System**: Earn points for correctly identifying artists, tracks, and samples
- **Real-Time Scoring**: Live score updates as players make correct guesses
- **Persistent Game State**: Resume games where you left off using local storage

### 🎵 Audio Experience
- **YouTube Integration**: High-quality audio playback directly from YouTube
- **Custom Audio Controls**: Play, pause, and restart tracks with precision
- **Waveform Visualizer**: Animated waveform display during playback
- **Round Start Jingle**: Custom audio cue to begin each round (toggleable)
- **Auto-Play Feature**: Automatically start playing the original sample

### 🎨 User Interface
- **Retro-Futuristic Design**: Neon-styled UI with animated floating musical notes
- **Mobile Responsive**: Fully optimized for desktop, tablet, and mobile devices
- **Reveal System**: Hide/show track information with blur effects
- **Tutorial System**: Interactive guided tour for first-time users
- **Dark Theme**: Modern dark interface with colorful accents

### ⚙️ Customization
- **Game Settings**: Toggle jingle and auto-play features
- **Player Management**: Add/remove players dynamically
- **Round Navigation**: Jump between rounds freely
- **Score Reset**: Start fresh games while maintaining player roster

## 🚀 Live Demo

🔗 **[Play Now](http://whosampledthat.com/)** - *Live production deployment*

## 🛠️ Technology Stack

### Frontend
- **React 19.1.0** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool and development server
- **Tailwind CSS 4.1.10** - Utility-first CSS framework

### UI Components & Libraries
- **@headlessui/react** - Unstyled, accessible UI components
- **Lucide React** - Beautiful, customizable icons
- **Driver.js** - Interactive tutorial system
- **React YouTube** - YouTube player integration

### Deployment & CI/CD
- **Cloudflare Workers** - Edge computing platform for global deployment
- **GitHub Actions** - Automated CI/CD pipeline
- **Wrangler** - Cloudflare Workers CLI tool

## 📦 Installation & Setup

### Prerequisites
- **Node.js 18+** (with npm)
- **Git**

### Local Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   Navigate to `http://localhost:5173` to see the game in action!

### Available Scripts

```bash
# Development
npm run dev          # Start Vite development server
npm run preview      # Preview production build locally

# Building
npm run build        # Build for production
npm run lint         # Run ESLint for code quality

# Deployment (requires Cloudflare setup)
npx wrangler publish # Deploy to Cloudflare Workers
```

## 🎮 How to Play

### Game Setup
1. **Add Players**: Enter player names to join the game
2. **Start Game**: Begin with your roster of players
3. **Tutorial**: First-time users get an interactive tutorial

### During Each Round
1. **Listen**: Play the original sample to hear the source material
2. **Guess**: Identify the artist and track name of the original
3. **Connect**: Play the new track that samples the original
4. **Score**: Award points for correct guesses:
   - 🎤 **Artist** (1 point)
   - 🎵 **Track** (1 point) 
   - 🎼 **Sample Connection** (1 point)

### Game Controls
- **Play/Pause**: Control audio playback
- **Restart**: Reset track to beginning
- **Reveal**: Show/hide track information
- **Navigation**: Move between rounds freely

### Scoring System
- Each correct identification earns **1 point**
- Maximum **3 points per round** per player
- Scores persist across rounds and browser sessions
- Real-time score updates as points are awarded

## 🚀 Deployment

### Automatic Deployment (Recommended)

The game automatically deploys to Cloudflare Workers via GitHub Actions:

1. **Push to main/master branch** triggers automatic deployment
2. **Pull requests** trigger preview deployments
3. **Environment variables** are managed through GitHub Secrets

### Required GitHub Secrets

Set these in your repository settings:

```
CLOUDFLARE_API_TOKEN     # Your Cloudflare API token
CLOUDFLARE_ACCOUNT_ID    # Your Cloudflare account ID
```

### Manual Deployment

1. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **Authenticate with Cloudflare**
   ```bash
   wrangler auth login
   ```

3. **Build and deploy**
   ```bash
   npm run build
   npx wrangler publish
   ```

### Configuration Files

- **`wrangler.toml`** - Cloudflare Workers configuration
- **`.github/workflows/deploy.yml`** - GitHub Actions workflow
- **`vite.config.ts`** - Vite build configuration

## 📁 Project Structure

```
PersonalApps/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── InfoDropdown.tsx
│   │   ├── SettingsDropdown.tsx
│   │   └── WaveformPlayer.tsx
│   ├── contexts/           # React Context providers
│   │   └── GameContext.tsx
│   ├── data/              # Game data and track lists
│   │   └── tracklist.json
│   ├── lib/               # Utility functions and storage
│   │   ├── gameStorage.ts
│   │   └── tutorial.ts
│   ├── pages/             # Main game screens
│   │   ├── GameRound.tsx
│   │   └── GameSetup.tsx
│   └── assets/            # Static assets
├── public/                # Public static files
├── .github/workflows/     # CI/CD configurations
└── package.json          # Dependencies and scripts
```

## 🎵 Adding New Tracks

To add new tracks to the game, edit `src/data/tracklist.json`:

```json
{
  "originalSample": {
    "artist": "Original Artist Name",
    "trackName": "Original Track Name",
    "youtubeVideoId": "YouTube_Video_ID",
    "startTime": 30,
    "duration": 15
  },
  "newSong": {
    "artist": "Sampling Artist Name", 
    "trackName": "New Track Name",
    "youtubeVideoId": "YouTube_Video_ID",
    "startTime": 45,
    "duration": 20
  }
}
```

### Track Configuration
- **`youtubeVideoId`**: Extract from YouTube URL (e.g., `dQw4w9WgXcQ`)
- **`startTime`**: When to start playback (seconds)
- **`duration`**: How long to play (seconds) - optional

## 💻 Development Highlights

This project showcases modern web development practices and technologies:

### Technical Architecture
- **Component-Based Design**: Modular React components with TypeScript
- **State Management**: Context API with persistent local storage
- **Performance Optimization**: Vite for fast builds and development
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Code Quality Standards
- **TypeScript** for type safety and better developer experience
- **ESLint** for consistent code quality and style
- **Modern React Patterns**: Hooks, Context, and functional components
- **Accessibility**: ARIA-compliant components with HeadlessUI

### Production Features
- **Automated CI/CD**: GitHub Actions deployment pipeline
- **Edge Computing**: Cloudflare Workers for global performance
- **Progressive Enhancement**: Works offline with cached assets
- **Error Handling**: Graceful fallbacks for audio playback issues

## 📄 License

This is **private code** - All rights reserved. This project is for portfolio demonstration purposes.

## 🎤 Acknowledgments

- **YouTube** for providing the audio content platform
- **Cloudflare Workers** for reliable edge deployment
- **React & Vite** communities for excellent development tools
- **Music artists** whose samples make this game possible

---

<div align="center">
  <strong>Made with ❤️ for music lovers everywhere</strong>
  
  <br><br>
  
  **[🎮 Play Live Game](http://whosampledthat.com/)** | **[📱 Mobile Optimized](http://whosampledthat.com/)** | **[💼 Developer Portfolio](http://whosampledthat.com/)**
</div>
