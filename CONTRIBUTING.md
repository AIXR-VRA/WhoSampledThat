# Contributing to Who Sampled That? 🎵

We love your input! We want to make contributing to "Who Sampled That?" as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Adding new tracks to the game
- Becoming a maintainer

## 🚀 Quick Start for Contributors

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/PersonalApps.git
   cd PersonalApps
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start development server**:
   ```bash
   npm run dev
   ```
5. **Make your changes** and test them locally
6. **Submit a pull request**

## 🎮 Ways to Contribute

### 🐛 Bug Reports
Use GitHub Issues to report bugs. Great bug reports include:
- Quick summary of the issue
- Steps to reproduce (be specific!)
- What you expected to happen
- What actually happened
- Screenshots or videos if applicable
- Browser/device information

### 🎵 Adding New Tracks
One of the easiest ways to contribute! To add tracks:

1. Edit `src/data/tracklist.json`
2. Add your track pair following this format:
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

**Track Selection Guidelines:**
- Choose clear, recognizable samples
- Ensure both tracks are available on YouTube
- Test timing and duration for optimal gameplay
- Verify the sample connection is obvious to players
- Consider difficulty level (mix easy and challenging samples)

### 🔧 Code Contributions

#### Development Workflow
1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Make your changes
3. Run linter: `npm run lint`
4. Test your changes: `npm run dev`
5. Commit with clear message: `git commit -m "Add amazing feature"`
6. Push to your fork: `git push origin feature/amazing-feature`
7. Open a Pull Request

#### Code Style
- We use **ESLint** for code quality
- Follow **TypeScript** best practices
- Use **functional components** and **hooks**
- Keep components **small and focused**
- Add **type annotations** for better maintainability

#### Testing Your Changes
Before submitting:
- [ ] Game loads without errors
- [ ] Audio playback works correctly
- [ ] UI is responsive on mobile/desktop
- [ ] Linter passes: `npm run lint`
- [ ] Build succeeds: `npm run build`

### 🎨 UI/UX Improvements
- Maintain the retro-futuristic design aesthetic
- Ensure mobile responsiveness
- Follow accessibility best practices
- Use Tailwind CSS for styling consistency

### 📝 Documentation
Help improve our docs:
- Fix typos or unclear instructions
- Add code examples
- Improve setup guides
- Translate documentation

## 🏗️ Technical Architecture

### Key Technologies
- **React 19** with TypeScript
- **Vite** for building and development
- **Tailwind CSS** for styling
- **Cloudflare Workers** for deployment
- **YouTube API** for audio playback

### Project Structure
```
src/
├── components/     # Reusable UI components
├── contexts/       # React Context providers  
├── data/          # Game data (tracks, etc.)
├── lib/           # Utility functions
├── pages/         # Main game screens
└── assets/        # Static assets
```

### State Management
- **GameContext** manages global game state
- **localStorage** for persistence
- React hooks for component state

## 🔄 Pull Request Process

1. **Fill out the PR template** completely
2. **Link related issues** using "Fixes #123"
3. **Keep PRs focused** - one feature/fix per PR
4. **Add screenshots** for UI changes
5. **Update documentation** if needed
6. **Be responsive** to code review feedback

### PR Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated (if applicable)
- [ ] Changes tested locally
- [ ] No breaking changes (unless discussed)

## 🎯 Feature Requests

We love new ideas! For major features:
1. **Open an issue** first to discuss the feature
2. **Explain the use case** and user benefit
3. **Consider implementation complexity**
4. **Get maintainer feedback** before starting work

### Priority Features We'd Love Help With
- [ ] Spotify integration for wider music catalog
- [ ] Multiplayer online sessions
- [ ] Custom playlist creation
- [ ] Advanced scoring systems
- [ ] Social sharing improvements
- [ ] Accessibility enhancements
- [ ] Mobile app version
- [ ] Offline mode support

## 🤝 Community Guidelines

### Be Respectful
- Use welcoming and inclusive language
- Respect different viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what's best for the community

### Be Collaborative
- Help newcomers get started
- Share knowledge and resources
- Celebrate others' contributions
- Give credit where it's due

## 🔧 Development Environment Setup

### Prerequisites
- **Node.js 18+** (recommend using [nvm](https://github.com/nvm-sh/nvm))
- **Git**
- **Modern browser** for testing

### Optional Tools
- **VS Code** with recommended extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ESLint
  - Prettier



## 📞 Getting Help

- **GitHub Discussions** for questions and ideas
- **GitHub Issues** for bugs and feature requests
- **Code reviews** for learning and improvement

## 🎉 Recognition

Contributors get:
- Recognition in our README
- Mention in release notes for significant contributions
- Our eternal gratitude! 🙏

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Who Sampled That?** 🎵

Your contributions help make this game better for music lovers everywhere! 