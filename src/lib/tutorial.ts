import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

// Utility function to check if we're on mobile
const isMobileView = () => window.innerWidth < 768; // md breakpoint is 768px

export const createTutorial = (_onSkip: () => void, onComplete: () => void, onStepChange?: (step: number) => void) => {
  const isMobile = isMobileView();
  
  const driverInstance = driver({
    showProgress: true,
    allowClose: true,
    showButtons: ['next', 'previous'],
    disableActiveInteraction: false,
    popoverClass: 'custom-popover-width',
    overlayClickBehavior: 'close',
    steps: [
      {
        element: '.tutorial-welcome',
        popover: {
          title: '🎵 Welcome to Who Sampled That!',
          description: 'This is your first game! Who Sampled that is best played with a group of friends who can discuss their guesses out loud. Pro tip: connect yor phone to a speaker to hear the music together!',
          side: 'bottom',
          align: 'start',
          showButtons: ['next']
        }
      },
      {
        element: isMobile ? '.tutorial-original-sample-mobile' : '.tutorial-original-sample-desktop',
        popover: {
          title: '🎼 Original Sample Player',
          description: 'This is the original sample. It will auto-play so you can hear what to listen for! Notice this track says it will play for 15 seconds.',
          side: isMobile ? 'top' : 'bottom',
          align: 'center'
        }
      },
      {
        element: isMobile ? '.tutorial-play-restart-buttons-mobile' : '.tutorial-play-restart-buttons-desktop',
        popover: {
          title: '▶️ Play Controls',
          description: 'Use these buttons to control playback and restart to hear the sample again. Listen carefully to this original sample!',
          side: 'top',
          align: 'center'
        }
      },
      {
        popover: {
          title: '🤔 WHO SAMPLED THAT?',
          description: 'Now discuss with your team: WHO SAMPLED THAT original track? <br/>• Which NEW artist used this sample?<br/>• What is the NEW song title?<br/>• Bonus: What is the original track name and artist?<br/><br/>Make your guesses out loud before moving on!',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: isMobile ? '.tutorial-new-song-mobile' : '.tutorial-new-song-desktop',
        popover: {
          title: '🎤 Check Your Guesses!',
          description: 'After making your guesses about WHO SAMPLED THAT, play the new song to see if you were right! Listen for where the sample appears.',
          side: isMobile ? 'top' : 'bottom',
          align: 'center'
        }
      },
      {
        element: isMobile ? '.tutorial-reveal-buttons-container-mobile' : '.tutorial-reveal-buttons-container-desktop',
        popover: {
          title: '👁️ Reveal the Answers',
          description: 'Once you\'ve made your guesses and heard both tracks, click the eye buttons to reveal the answers. Did you guess who sampled that correctly?',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '.tutorial-players-section',
        popover: {
          title: '👥 Players & Scoring',
          description: 'Here you can award points to players for correct guesses! Click the buttons to award points for Artist, Track, and Sample. Each category is worth 1 point.',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: isMobile ? '.tutorial-next-round-mobile' : '.tutorial-next-round-desktop',
        popover: {
          title: '➡️ Next Round',
          description: 'When you\'re ready, click "Next Round" to move to the next track. Points are saved automatically! This completes the tutorial.',
          side: 'top',
          align: 'center',
          showButtons: ['previous', 'next']
        }
      }
    ],
    onHighlightStarted: (_element, _step, options) => {
      if (onStepChange) {
        onStepChange(options.state.activeIndex || 0);
      }
    },
    onDestroyStarted: () => {
      // This is called when the user tries to exit the tour
      // Show confirmation and only destroy if user confirms
      if (!driverInstance.hasNextStep() || confirm("Are you sure you want to exit the tutorial? You can restart it anytime from the settings.")) {
        driverInstance.destroy();
      }
    },
    onDestroyed: () => {
      onComplete();
    }
  });
  
  // Handle window resize events to recalculate positions
  const handleResize = () => {
    if (driverInstance.isActive()) {
      // Small delay to allow layout changes to complete
      setTimeout(() => {
        driverInstance.refresh();
      }, 100);
    }
  };
  
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  
  // Clean up event listeners when tutorial is destroyed
  const originalDestroy = driverInstance.destroy.bind(driverInstance);
  driverInstance.destroy = () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
    originalDestroy();
  };
  
  return driverInstance;
};

export const tutorialStyles = `
  .driver-popover {
    background: linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%);
    border: 1px solid #4f46e5;
    border-radius: 12px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    max-width: 90vw !important;
  }
  
  /* Desktop width adjustments - make boxes smaller */
  @media (min-width: 769px) {
    .driver-popover.custom-popover-width {
      max-width: 320px !important;
      width: 320px !important;
    }
  }
  
  /* Mobile-specific adjustments */
  @media (max-width: 768px) {
    .driver-popover {
      max-width: 95vw !important;
      margin: 10px !important;
    }
    
    .driver-popover-title {
      font-size: 1.1rem !important;
    }
    
    .driver-popover-description {
      font-size: 0.9rem !important;
    }
    
    .driver-popover-next-btn,
    .driver-popover-prev-btn {
      padding: 8px 16px !important;
      font-size: 0.9rem !important;
    }
  }
  
  .driver-popover::before {
    border-color: #4f46e5 !important;
  }
  
  .driver-popover::after {
    border-color: #1e1b4b !important;
  }
  
  .driver-popover-title {
    color: #ffffff;
    font-size: 1.2rem;
    font-weight: 700;
    margin-bottom: 8px;
  }
  
  .driver-popover-description {
    color: #e2e8f0;
    font-size: 1rem;
    line-height: 1.5;
  }
  
  .driver-popover-next-btn {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .driver-popover-next-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }
  
  .driver-popover-prev-btn {
    background: transparent;
    color: #94a3b8;
    border: 1px solid #475569;
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .driver-popover-prev-btn:hover {
    color: #ffffff;
    border-color: #64748b;
  }
  
  /* Hide the close button completely since we only want backdrop click to close */
  .driver-popover-close-btn {
    display: none !important;
  }
  
  .driver-popover-progress-text {
    color: #94a3b8;
    font-size: 0.875rem;
  }
`; 