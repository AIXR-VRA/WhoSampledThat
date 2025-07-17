interface Player {
  id: number;
  name: string;
  score: number;
}

interface GameSettings {
  jingleEnabled: boolean;
  autoPlayEnabled: boolean;
}

export interface PersistedGameState {
  players: Player[];
  gamePhase: 'setup' | 'playing' | 'summary';
  currentRound: number;
  settings: GameSettings;
}

interface TutorialState {
  hasCompletedTutorial: boolean;
}

const STORAGE_KEY = 'whoSampledThatGame';
const TUTORIAL_STORAGE_KEY = 'whoSampledThatTutorial';

export const defaultSettings: GameSettings = {
  jingleEnabled: true,
  autoPlayEnabled: true,
};

export const saveGameState = (state: PersistedGameState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save game state to localStorage:', error);
  }
};

export const loadGameState = (): PersistedGameState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn('Failed to load game state from localStorage:', error);
  }
  return null;
};

export const clearGameState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear game state from localStorage:', error);
  }
};

export const saveTutorialState = (completed: boolean) => {
  try {
    const tutorialState: TutorialState = { hasCompletedTutorial: completed };
    localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(tutorialState));
  } catch (error) {
    console.warn('Failed to save tutorial state to localStorage:', error);
  }
};

export const loadTutorialState = (): boolean => {
  try {
    const saved = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (saved) {
      const tutorialState: TutorialState = JSON.parse(saved);
      return tutorialState.hasCompletedTutorial;
    }
  } catch (error) {
    console.warn('Failed to load tutorial state from localStorage:', error);
  }
  return false;
}; 