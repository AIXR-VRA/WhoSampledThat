import { useState } from 'react';
import { Button, Field, Input, Label } from '@headlessui/react';
import { useGame } from '../contexts/GameContext';
import { UserPlus, Users, Play, Trash2, Music2, Disc3, Radio } from 'lucide-react';

function GameSetup() {
  const { players, addPlayer, removePlayer, startGame } = useGame();
  const [playerName, setPlayerName] = useState('');

  const handleAddPlayer = () => {
    if (playerName.trim()) {
      addPlayer(playerName);
      setPlayerName('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPlayer();
    }
  };

  return (
    <div className="max-w-lg md:max-w-2xl mx-auto relative px-1 sm:px-0">
      {/* Floating retro musical notes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-5 text-4xl retro-note-neon-pink animate-float-1">♪</div>
        <div className="absolute top-32 right-8 text-3xl retro-note-neon-cyan animate-float-2">♫</div>
        <div className="absolute top-64 left-12 text-5xl retro-note-neon-yellow animate-float-3">♬</div>
        <div className="absolute top-96 right-16 text-2xl retro-note-neon-purple animate-float-4">♩</div>
        <div className="absolute bottom-32 left-8 text-4xl retro-note-neon-green animate-float-5">♪</div>
        <div className="absolute bottom-64 right-4 text-3xl retro-note-neon-orange animate-float-6">♫</div>
      </div>

      <div className="modern-card p-4 sm:p-6 md:p-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <h2 className="shrikhand-regular text-2xl sm:text-3xl text-white">The Ultimate Music Guessing Game</h2>
          </div>
          <p className="text-gray-400 text-base sm:text-lg">Who's ready to guess some samples? 🎵</p>
        </div>
        
        {/* Add Player Form with jukebox styling */}
        <div className="mb-6 sm:mb-8">
          <Field className="space-y-3 sm:space-y-4">
            <Label className="block text-base sm:text-lg font-semibold text-white">Player Name</Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={handleKeyPress}
                                placeholder="Enter a cool name..."
                className="modern-input flex-1 text-base sm:text-lg py-3 sm:py-2"
              />
              <Button 
                onClick={handleAddPlayer}
                disabled={!playerName.trim()}
                className="modern-button primary px-4 sm:px-6 py-3 flex items-center justify-center gap-2 text-base sm:text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                Add Player
              </Button>
            </div>
          </Field>
        </div>
        
        {/* Players List with enhanced retro styling */}
        {players.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              Players Ready ({players.length})
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {players.map((player, index) => (
                <div key={player.id} className="player-card p-3 sm:p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-white font-semibold text-base sm:text-lg truncate">{player.name}</span>
                  </div>
                  <Button 
                    onClick={() => removePlayer(player.id)}
                    className="modern-button danger px-3 sm:px-4 py-2 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold ml-2 flex-shrink-0"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Eject</span>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Start Game Button with enhanced jukebox styling */}
        <div className="relative">
          {players.length === 0 && (
            <div className="text-center mb-4 sm:mb-6">
              <p className="text-gray-400 text-base sm:text-lg">Add at least one player to start the game! 🎮</p>
            </div>
          )}
          
          <Button 
            onClick={startGame} 
            disabled={players.length === 0}
            className="modern-button success w-full py-3 sm:py-4 text-lg sm:text-xl font-black flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-center">
              {players.length === 0 ? 'Add Players First' : `Start Game with ${players.length} Player${players.length > 1 ? 's' : ''}`}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default GameSetup; 