import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from 'react';
import tracklist from '../data/tracklist.json';
import {
  saveGameState,
  loadGameState,
  clearGameState,
  saveTutorialState,
  loadTutorialState,
  defaultSettings,
  type PersistedGameState
} from '../lib/gameStorage';

interface Player {
  id: number;
  name: string;
  score: number;
}

interface Track {
  originalSample: {
    artist: string;
    trackName: string;
    youtubeVideoId: string;
    startTime?: number;
    duration?: number;
  };
  newSong: {
    artist: string;
    trackName: string;
    youtubeVideoId: string;
    startTime?: number;
    duration?: number;
  };
}

interface GameSettings {
  jingleEnabled: boolean;
  autoPlayEnabled: boolean;
}

interface GameContextType {
  players: Player[];
  addPlayer: (name: string) => void;
  removePlayer: (id: number) => void;
  awardPoints: (playerId: number, points: number) => void;
  resetScores: () => void;
  gamePhase: 'setup' | 'playing' | 'summary';
  startGame: () => void;
  endGame: () => void;
  currentRound: number;
  currentTrack: Track | null;
  nextRound: () => void;
  previousRound: () => void;
  settings: GameSettings;
  updateSettings: (settings: Partial<GameSettings>) => void;
  resetGame: () => void;
  isFirstTimeUser: boolean;
  skipTutorial: () => void;
  tutorialCompleted: boolean;
  markTutorialCompleted: () => void;
  restartTutorial: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from localStorage or defaults
  const [players, setPlayers] = useState<Player[]>([]);
  const [gamePhase, setGamePhase] = useState<'setup' | 'playing' | 'summary'>('setup');
  const [currentRound, setCurrentRound] = useState(0);
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);

  // Load persisted state on mount
  useEffect(() => {
    const savedState = loadGameState();
    if (savedState) {
      setPlayers(savedState.players);
      setGamePhase(savedState.gamePhase);
      setCurrentRound(savedState.currentRound);
      setSettings(savedState.settings);
    }
    
    // Load tutorial state
    const hasCompletedTutorial = loadTutorialState();
    setTutorialCompleted(hasCompletedTutorial);
    
    setTracks(tracklist);
    setIsInitialized(true);
  }, []);

  // Save state to localStorage whenever it changes (but only after initialization)
  useEffect(() => {
    if (isInitialized) {
      const stateToSave: PersistedGameState = {
        players,
        gamePhase,
        currentRound,
        settings,
      };
      saveGameState(stateToSave);
    }
  }, [players, gamePhase, currentRound, settings, isInitialized]);

  const addPlayer = (name: string) => {
    if (name.trim() !== '') {
      const newPlayer = { id: Date.now(), name: name.trim(), score: 0 };
      setPlayers(prevPlayers => [...prevPlayers, newPlayer]);
    }
  };

  const removePlayer = (id: number) => {
    setPlayers(prevPlayers => prevPlayers.filter(player => player.id !== id));
  };

  const awardPoints = (playerId: number, points: number) => {
    setPlayers(prevPlayers =>
      prevPlayers.map(player =>
        player.id === playerId ? { ...player, score: player.score + points } : player
      )
    );
  };

  const resetScores = () => {
    setPlayers(prevPlayers =>
      prevPlayers.map(player => ({ ...player, score: 0 }))
    );
  };

  const startGame = () => {
    if (players.length > 0) {
      setCurrentRound(1);
      setGamePhase('playing');
    }
  };

  const endGame = () => {
    setGamePhase('summary');
  };

  const nextRound = () => {
    if (currentRound < tracks.length) {
      setCurrentRound(prevRound => prevRound + 1);
    } else {
      endGame();
    }
  };

  const previousRound = () => {
    if (currentRound > 1) {
      setCurrentRound(prevRound => prevRound - 1);
    }
  };

  const updateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings(prevSettings => ({ ...prevSettings, ...newSettings }));
  };

  const resetGame = () => {
    setPlayers([]);
    setGamePhase('setup');
    setCurrentRound(0);
    setSettings(defaultSettings);
    clearGameState();
  };

  const skipTutorial = useCallback(() => {
    setTutorialCompleted(true);
    saveTutorialState(true);
  }, []);

  const markTutorialCompleted = useCallback(() => {
    setTutorialCompleted(true);
    saveTutorialState(true);
  }, []);

  const restartTutorial = useCallback(() => {
    setTutorialCompleted(false);
    saveTutorialState(false);
  }, []);

  const value = {
    players,
    addPlayer,
    removePlayer,
    awardPoints,
    resetScores,
    gamePhase,
    startGame,
    endGame,
    currentRound,
    currentTrack: tracks[currentRound - 1] || null,
    nextRound,
    previousRound,
    settings,
    updateSettings,
    resetGame,
    isFirstTimeUser: !tutorialCompleted,
    skipTutorial,
    tutorialCompleted,
    markTutorialCompleted,
    restartTutorial,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}; 