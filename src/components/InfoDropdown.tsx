import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Info, HelpCircle, Play } from 'lucide-react';
import { useGame } from '../contexts/GameContext';

export default function InfoDropdown() {
  const { restartTutorial, gamePhase } = useGame();

  const handleStartTutorial = () => {
    // Reset tutorial state to show it again
    restartTutorial();
    
    // If we're not in the playing phase, navigate to the game
    if (gamePhase !== 'playing') {
      // Refresh the page to start fresh and trigger tutorial on round 1
      window.location.reload();
    }
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="modern-button p-3 flex items-center justify-center">
          <Info className="h-5 w-5" aria-hidden="true" />
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="fixed left-1/2 -translate-x-1/2 mt-3 w-[calc(100vw-2rem)] max-w-80 md:!absolute md:left-auto md:right-0 md:translate-x-0 md:w-96 md:max-w-none origin-top md:origin-top-right dropdown-menu focus:outline-none z-[100]">
          <div className="p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <Info className="h-5 w-5 md:h-6 md:w-6 text-blue-400" />
              <h3 className="eb-garamond-title text-lg md:text-xl text-white">About the Game</h3>
            </div>
            
            <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
              <div className="text-gray-300 leading-relaxed">
                <p className="mb-2 md:mb-3 text-sm md:text-base">
                  <strong className="text-white">🎵 Who Sampled That</strong> is the ultimate music guessing game!
                </p>
                <p className="mb-2 md:mb-3 text-sm md:text-base">
                  Listen to an <strong>original sample</strong> and a <strong>new song</strong> that uses it. 
                  Your goal is to identify the artist, track name, and sample details.
                </p>
                <p className="text-xs md:text-sm text-gray-400">
                  Perfect for music lovers, DJs, and anyone who loves discovering how songs are connected! 🎼
                </p>
              </div>
              
              <div className="border-t border-gray-700/50 pt-3 md:pt-4">
                <h4 className="text-white font-bold mb-2 flex items-center gap-2 text-sm md:text-base">
                  <HelpCircle className="w-4 h-4 text-green-400" />
                  How to Play:
                </h4>
                <ul className="text-xs md:text-sm text-gray-300 space-y-1 ml-4 md:ml-6">
                  <li>• Listen to both audio tracks carefully</li>
                  <li>• Guess the artist, track, and sample details</li>
                  <li>• Award points to players for correct answers</li>
                  <li>• Use the reveal buttons to see the answers</li>
                </ul>
              </div>
            </div>

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleStartTutorial}
                  disabled={gamePhase !== 'playing'}
                  className={`w-full player-card p-3 md:p-4 ${
                    gamePhase !== 'playing' 
                      ? 'opacity-50 cursor-not-allowed' 
                      : active ? 'scale-[1.02]' : ''
                  } transition-transform`}
                >
                  <div className="flex items-center justify-center gap-2 md:gap-3">
                    <div className={`w-8 h-8 md:w-10 md:h-10 ${
                      gamePhase !== 'playing' 
                        ? 'bg-gray-600' 
                        : 'bg-gradient-to-r from-green-400 to-blue-500'
                    } rounded-full flex items-center justify-center`}>
                      <Play className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <div className="text-center">
                      <span className={`font-bold text-base md:text-lg ${
                        gamePhase !== 'playing' ? 'text-gray-400' : 'text-white'
                      }`}>Start Tutorial</span>
                      <p className="text-gray-400 text-xs md:text-sm font-medium">
                        {gamePhase !== 'playing' 
                          ? 'Start a game first to use tutorial' 
                          : 'Interactive guide to learn the game'
                        }
                      </p>
                    </div>
                  </div>
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
} 