import GameSetup from './pages/GameSetup';
import { GameProvider, useGame } from './contexts/GameContext';
import GameRound from './pages/GameRound';
import SettingsDropdown from './components/SettingsDropdown';
import InfoDropdown from './components/InfoDropdown';
import PrivacyPolicy from './components/PrivacyPolicy';
import { Button, Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { LogOut, AlertTriangle, Trophy, Sparkles } from 'lucide-react';
import { useState, memo, useMemo } from 'react';
import logoImage from './assets/who sampled that logo small.png';

// Background component with floating musical notes and gradient
const AnimatedBackground = memo(() => {
  // Optimize for mobile - reduce number of floating elements
  const musicalNotes = useMemo(() => [
    // Essential notes for all screen sizes
    { id: 1, symbol: '♪', className: 'absolute top-20 left-10 text-8xl opacity-12 animate-float-1 y2k-note-purple', delay: '0s' },
    { id: 2, symbol: '♫', className: 'absolute top-1/4 right-16 text-9xl opacity-10 animate-float-2 y2k-note-cyan', delay: '0s' },
    { id: 3, symbol: '♬', className: 'absolute bottom-32 left-1/4 text-7xl opacity-15 animate-float-3 y2k-note-pink', delay: '0s' },
    { id: 4, symbol: '♩', className: 'absolute top-1/3 left-1/2 text-6xl opacity-13 animate-float-4 y2k-note-lime', delay: '0s' },
    
    // Additional notes for larger screens
    { id: 5, symbol: '♯', className: 'absolute bottom-20 right-32 text-8xl opacity-11 animate-float-5 y2k-note-orange hidden sm:block', delay: '0s' },
    { id: 6, symbol: '♭', className: 'absolute top-16 right-1/4 text-7xl opacity-14 animate-float-6 y2k-note-blue hidden sm:block', delay: '0s' },
    { id: 7, symbol: '♮', className: 'absolute bottom-1/3 right-1/3 text-6xl opacity-12 animate-float-1 y2k-note-magenta hidden md:block', delay: '2s' },
    { id: 8, symbol: '𝄞', className: 'absolute top-1/2 left-16 text-9xl opacity-8 animate-float-2 y2k-note-gold hidden md:block', delay: '4s' },
    { id: 9, symbol: '𝄢', className: 'absolute bottom-16 left-1/2 text-8xl opacity-13 animate-float-3 y2k-note-teal hidden lg:block', delay: '1s' },
    { id: 10, symbol: '𝄪', className: 'absolute top-2/3 right-20 text-5xl opacity-16 animate-float-4 y2k-note-lavender hidden lg:block', delay: '3s' },
  ], []);

  return (
    <>
      {/* Dark blurred changing gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 animate-gradient-shift"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-slate-900/40 via-gray-900/30 to-black/60 animate-gradient-shift-reverse"></div>
        <div className="absolute inset-0 backdrop-blur-xl bg-black/70"></div>
      </div>
      
      {/* Optimized floating musical notes */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {musicalNotes.map((note) => (
          <div 
            key={note.id}
            className={note.className}
            style={{ animationDelay: note.delay }}
          >
            {note.symbol}
          </div>
        ))}
      </div>
    </>
  );
});

function FinalScoresLeaderboard() {
  const { players, resetScores, startGame, resetGame } = useGame();
  
  // Sort players by score in descending order
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  
  // Calculate positions accounting for ties (dense ranking)
  const playersWithPositions = sortedPlayers.map((player) => {
    // Count how many DISTINCT scores are higher than the current player's score
    const distinctHigherScores = new Set(sortedPlayers.filter(p => p.score > player.score).map(p => p.score));
    const position = distinctHigherScores.size + 1;
    return { ...player, position };
  });

  // Find the highest score to determine winners
  const highestScore = sortedPlayers.length > 0 ? sortedPlayers[0].score : 0;
  const winners = sortedPlayers.filter(player => player.score === highestScore);
  const isWinner = (playerId: number) => winners.some(winner => winner.id === playerId);
  
  const handlePlayAgain = () => {
    resetScores();
    startGame();
  };

  const handleNewGame = () => {
    resetGame();
  };

  const getPositionDisplay = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${position}`;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-12 relative z-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Trophy className="w-12 h-12 text-yellow-400" />
          <h2 className="shrikhand-regular text-5xl text-white tracking-tight">Final Scores</h2>
          <Sparkles className="w-8 h-8 text-purple-400" />
        </div>
        <p className="text-xl text-gray-300 font-medium">Amazing job everyone! 🎉</p>
      </div>
      
      <div className="modern-card p-8 shadow-2xl relative z-10">
        <div className="space-y-6">
          {playersWithPositions.map((player) => (
            <div 
              key={player.id} 
              className={`player-card p-6 relative overflow-hidden ${
                isWinner(player.id) ? 'ring-2 ring-yellow-400' : ''
              }`}
            >
              {/* Winner glow effect */}
              {isWinner(player.id) && (
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 rounded-20"></div>
              )}
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-6">
                  <div className="text-4xl font-black min-w-[60px]">
                    {getPositionDisplay(player.position)}
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-black text-white">{player.name}</h3>
                    {isWinner(player.id) && <p className="text-yellow-400 font-bold text-sm">🎊 WINNER! 🎊</p>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-white">{player.score}</div>
                  <div className="text-sm text-gray-400 font-semibold">points</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-10 flex justify-center gap-6">
          <Button 
            onClick={handlePlayAgain}
            className="modern-button success px-8 py-4 text-lg font-bold"
          >
            🎵 Play Again
          </Button>
          <Button 
            onClick={handleNewGame}
            className="modern-button px-8 py-4 text-lg font-bold"
          >
            🎮 New Game
          </Button>
        </div>
      </div>
    </div>
  );
}

function GameContent() {
  const { gamePhase } = useGame();

  switch (gamePhase) {
    case 'setup':
      return <GameSetup />;
    case 'playing':
      return <GameRound />;
    case 'summary':
      return <FinalScoresLeaderboard />;
    default:
      return <GameSetup />;
  }
}

function AppHeader() {
  const { gamePhase, endGame } = useGame();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  
  const handleEndGameClick = () => {
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmEndGame = () => {
    setIsConfirmDialogOpen(false);
    endGame();
  };

  const handleCancelEndGame = () => {
    setIsConfirmDialogOpen(false);
  };
  
  // Determine logo size based on game phase
  const isHomePage = gamePhase === 'setup';
  const logoClasses = isHomePage 
    ? "h-32 md:h-40 w-auto mb-4" // Much bigger on home page
    : "h-20 md:h-24 w-auto mb-2"; // Bigger during game
  
  return (
    <>
      <div className="relative flex flex-col md:flex-row md:items-center justify-center mb-6 z-50">
        <div className="text-center relative z-10 md:flex-1">
          <div className="flex items-center justify-center">
            <img 
              src={logoImage} 
              alt="Who Sampled That - The Ultimate Music Guessing Game" 
              className={logoClasses}
            />
          </div>
        </div>
        
        <div className="flex justify-center md:justify-end items-center gap-3 mt-4 md:mt-0 md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 z-50">
          <InfoDropdown />
          <SettingsDropdown />
          {gamePhase === 'playing' && (
            <Button
              onClick={handleEndGameClick}
              className="modern-button danger p-3"
              title="End Game"
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onClose={handleCancelEndGame} className="relative z-50">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="modern-card max-w-md p-8 relative">
            <div className="flex items-center gap-4 mb-6">
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
              <DialogTitle className="text-2xl font-bold text-white">End Game?</DialogTitle>
            </div>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              Are you sure you want to end the current game? All progress will be lost and you'll return to the game setup.
            </p>
            <div className="flex gap-4">
              <Button
                onClick={handleConfirmEndGame}
                className="modern-button danger flex-1 py-3 text-lg font-bold"
              >
                Yes, End Game
              </Button>
              <Button
                onClick={handleCancelEndGame}
                className="modern-button flex-1 py-3 text-lg font-bold"
              >
                Cancel
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}

function Footer() {
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <>
      <div className="text-center py-6 text-gray-400 text-sm">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <span>Made with ❤️ by Ryza © {currentYear}</span>
          <span className="hidden sm:inline">•</span>
          <button
            onClick={() => setIsPrivacyPolicyOpen(true)}
            className="text-gray-400 hover:text-white transition-colors underline"
          >
            Privacy & Terms
          </button>
        </div>
      </div>
      
      <PrivacyPolicy 
        isOpen={isPrivacyPolicyOpen} 
        onClose={() => setIsPrivacyPolicyOpen(false)} 
      />
    </>
  );
}

function App() {
  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <div className="container mx-auto px-2 sm:px-6 py-8 relative z-10">
        <GameProvider>
          <AppHeader />
          <GameContent />
          <Footer />
        </GameProvider>
      </div>
    </div>
  );
}

export default App;
