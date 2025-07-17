import { useState, useEffect, useRef } from 'react';
import { Button } from '@headlessui/react';
import { Eye, EyeOff, Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Music, Users, Award, Star, X } from 'lucide-react';
import YouTube from 'react-youtube';
import { useGame } from '../contexts/GameContext';
import WaveformPlayer from '../components/WaveformPlayer';
import roundStartSound from '../assets/who sample that jingle.mp3';
import { createTutorial, tutorialStyles } from '../lib/tutorial';

type ScoreCategory = 'artist' | 'track' | 'sample';

const ROUND_SCORES_STORAGE_KEY = 'whoSampledThatRoundScores';

function GameRound() {
  const { players, currentRound, currentTrack, nextRound, previousRound, awardPoints, settings, isFirstTimeUser, skipTutorial, markTutorialCompleted } = useGame();
  const [roundScores, setRoundScores] = useState<Record<number, Record<ScoreCategory, boolean>>>({});
  const [persistentRoundScores, setPersistentRoundScores] = useState<Record<number, Record<number, Record<ScoreCategory, boolean>>>>({});
  const [canPlayVideos, setCanPlayVideos] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<'original' | 'new' | null>(null);
  const [playersReady, setPlayersReady] = useState<{ [key: string]: boolean }>({});
  const [originalRevealed, setOriginalRevealed] = useState(false);
  const [newSongRevealed, setNewSongRevealed] = useState(false);
  const [jinglePlaying, setJinglePlaying] = useState(false);
  const [showTutorialBanner, setShowTutorialBanner] = useState(false);
  const [, setTutorialStep] = useState(0);
  const [tutorialActive, setTutorialActive] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<{ [key: string]: YT.Player }>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tutorialRef = useRef<any>(null);

  // Load persistent round scores from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ROUND_SCORES_STORAGE_KEY);
      if (saved) {
        setPersistentRoundScores(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Failed to load round scores from localStorage:', error);
    }
  }, []);

  // Save persistent round scores to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(ROUND_SCORES_STORAGE_KEY, JSON.stringify(persistentRoundScores));
    } catch (error) {
      console.warn('Failed to save round scores to localStorage:', error);
    }
  }, [persistentRoundScores]);

  // Clear round scores when game starts fresh (round 1 from setup)
  useEffect(() => {
    if (currentRound === 1 && Object.keys(persistentRoundScores).length > 0) {
      // Check if this is a fresh start by seeing if we have any scores for round 1
      const hasRound1Scores = persistentRoundScores[1] && 
        Object.values(persistentRoundScores[1]).some(playerScores => 
          Object.values(playerScores).some(Boolean)
        );
      
      if (!hasRound1Scores) {
        // This is a fresh game start, clear all round scores
        setPersistentRoundScores({});
        try {
          localStorage.removeItem(ROUND_SCORES_STORAGE_KEY);
        } catch (error) {
          console.warn('Failed to clear round scores from localStorage:', error);
        }
      }
    }
  }, [currentRound, persistentRoundScores]);

  // Initialize states for the round (but not scores)
  useEffect(() => {
    setCanPlayVideos(false);
    setPlayingVideo(null);
    setPlayersReady({});
    setOriginalRevealed(false);
    setNewSongRevealed(false);
    setJinglePlaying(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current);
    }
  }, [currentRound]);

  // Load scores for the current round (separate from round initialization)
  useEffect(() => {
    // Load existing scores for this round if they exist, otherwise initialize
    const existingScores = persistentRoundScores[currentRound];
    const initialScores: Record<number, Record<ScoreCategory, boolean>> = {};
    
    players.forEach(player => {
      if (existingScores && existingScores[player.id]) {
        // Load existing scores for this round
        initialScores[player.id] = { ...existingScores[player.id] };
      } else {
        // Initialize with default values
        initialScores[player.id] = { artist: false, track: false, sample: false };
      }
    });
    
    setRoundScores(initialScores);
  }, [currentRound, persistentRoundScores, players]);

  // Handle when players are added/removed (should only happen during setup)
  useEffect(() => {
    setRoundScores(prevScores => {
      const newScores = { ...prevScores };
      players.forEach(player => {
        if (!newScores[player.id]) {
          newScores[player.id] = { artist: false, track: false, sample: false };
        }
      });
      // Remove scores for players that no longer exist
      Object.keys(newScores).forEach(playerIdStr => {
        const playerId = parseInt(playerIdStr, 10);
        if (!players.find(p => p.id === playerId)) {
          delete newScores[playerId];
        }
      });
      return newScores;
    });
  }, [players]);

  useEffect(() => {
    if (currentRound > 0) {
      if (settings.jingleEnabled) {
        setJinglePlaying(true);
        audioRef.current?.play();
      } else {
        // If jingle is disabled, allow videos to play immediately
        setCanPlayVideos(true);
        // Auto-play will be handled by the playersReady effect
      }
    }
  }, [currentRound, settings.jingleEnabled, settings.autoPlayEnabled]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
      }
      if (tutorialRef.current) {
        tutorialRef.current.destroy();
      }
    };
  }, []);

  // Tutorial initialization and styling
  useEffect(() => {
    // Inject tutorial styles
    const styleElement = document.createElement('style');
    styleElement.textContent = tutorialStyles;
    document.head.appendChild(styleElement);

    // Show tutorial for first-time users on round 1
    if (isFirstTimeUser && currentRound === 1 && currentTrack) {
      setShowTutorialBanner(true);
      setTutorialActive(true);
      
      // Start tutorial immediately after elements are rendered
      const startTutorial = () => {
        tutorialRef.current = createTutorial(
          () => {
            // On skip
            skipTutorial();
            setShowTutorialBanner(false);
            setTutorialActive(false);
          },
          () => {
            // On complete
            markTutorialCompleted();
            setShowTutorialBanner(false);
            setTutorialActive(false);
          },
          (step) => {
            // On step change
            setTutorialStep(step);
          }
        );
        
        if (tutorialRef.current) {
          (window as any).driverObj = tutorialRef.current;
          tutorialRef.current.drive();
        }
      };

      // Small delay to ensure elements are rendered, but much shorter
      setTimeout(startTutorial, 200);
    }

    return () => {
      document.head.removeChild(styleElement);
    };
  }, [isFirstTimeUser, currentRound, currentTrack, skipTutorial, markTutorialCompleted]);

  // Auto-play when original sample player is ready (if jingle is disabled)
  useEffect(() => {
    if (
      currentTrack && 
      settings.autoPlayEnabled && 
      !settings.jingleEnabled && 
      !jinglePlaying &&
      canPlayVideos &&
      playersReady[currentTrack.originalSample.youtubeVideoId] &&
      currentRound > 0
    ) {
      // Small delay to ensure everything is properly initialized
      setTimeout(() => playVideo('original'), 100);
    }
  }, [playersReady, currentTrack, settings.autoPlayEnabled, settings.jingleEnabled, jinglePlaying, canPlayVideos, currentRound]);

  const fadeOutJingle = () => {
    if (audioRef.current && jinglePlaying) {
      const audio = audioRef.current;
      const fadeOut = () => {
        if (audio.volume > 0.1) {
          audio.volume = Math.max(0, audio.volume - 0.1);
          setTimeout(fadeOut, 50);
        } else {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 1;
          setJinglePlaying(false);
        }
      };
      fadeOut();
    }
  };

  const togglePoint = (playerId: number, category: ScoreCategory) => {
    setRoundScores(prevScores => {
      const currentlySelected = prevScores[playerId][category];
      const newState = !currentlySelected;
      
      // Update the player's total score in real time
      if (newState) {
        // Point was turned ON - award 1 point
        awardPoints(playerId, 1);
      } else {
        // Point was turned OFF - deduct 1 point
        awardPoints(playerId, -1);
      }
      
      const newScores = {
        ...prevScores,
        [playerId]: {
          ...prevScores[playerId],
          [category]: newState,
        },
      };
      
      // Update persistent storage for this round
      setPersistentRoundScores(prevPersistent => ({
        ...prevPersistent,
        [currentRound]: {
          ...prevPersistent[currentRound],
          [playerId]: {
            ...prevPersistent[currentRound]?.[playerId],
            [category]: newState,
          },
        },
      }));
      
      return newScores;
    });
  };

  const handleNextRound = () => {
    // Stop tutorial if active
    if (tutorialActive && tutorialRef.current) {
      tutorialRef.current.destroy();
      markTutorialCompleted();
      setShowTutorialBanner(false);
      setTutorialActive(false);
    }
    
    // Fade out jingle if it's still playing
    if (jinglePlaying) {
      fadeOutJingle();
    }
    
    // Points are already awarded in real time via togglePoint()
    // No need to award them again here
    
    // Move to the next round
    nextRound();
    
    // Scroll to top to show the new round's content
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviousRound = () => {
    // Fade out jingle if it's still playing
    if (jinglePlaying) {
      fadeOutJingle();
    }
    
    // Move to the previous round
    previousRound();
    
    // Scroll to top to show the new round's content
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const opts = {
    height: '400',
    width: '400',
    playerVars: {
      autoplay: 0,
      controls: 0,
      showinfo: 0,
      rel: 0,
      modestbranding: 1,
      title: 0,
      iv_load_policy: 3,
    },
  };

  const onReady = (event: { target: YT.Player }, videoId: string) => {
    playerRef.current[videoId] = event.target;
    setPlayersReady(prev => ({ ...prev, [videoId]: true }));
  };

  const onStateChange = (event: { data: number }, videoType: 'original' | 'new') => {
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }

    if (event.data === YT.PlayerState.PLAYING) {
        // Stop the other video if it's playing
        const otherVideoType = videoType === 'original' ? 'new' : 'original';
        if (playingVideo === otherVideoType) {
          const otherTrackDetails = otherVideoType === 'original' ? currentTrack!.originalSample : currentTrack!.newSong;
          const otherPlayer = playerRef.current[otherTrackDetails.youtubeVideoId];
          if (otherPlayer) {
            otherPlayer.pauseVideo();
          }
        }
        
        setPlayingVideo(videoType);
        const trackDetails = videoType === 'original' ? currentTrack!.originalSample : currentTrack!.newSong;
        if (trackDetails.duration) {
            timeoutRef.current = setTimeout(() => {
                const player = playerRef.current[trackDetails.youtubeVideoId];
                if (player) {
                    player.pauseVideo();
                }
            }, trackDetails.duration * 1000);
        }
    } else {
        setPlayingVideo(null);
    }
  };

  const playVideo = (videoType: 'original' | 'new') => {
    if (!canPlayVideos) {
      setCanPlayVideos(true);
    }
    
    // Fade out jingle if it's playing
    if (jinglePlaying) {
      fadeOutJingle();
    }
    
    // First pause the other video if it's playing
    const otherVideoType = videoType === 'original' ? 'new' : 'original';
    if (playingVideo === otherVideoType) {
      const otherTrackDetails = otherVideoType === 'original' ? currentTrack!.originalSample : currentTrack!.newSong;
      const otherPlayer = playerRef.current[otherTrackDetails.youtubeVideoId];
      if (otherPlayer) {
        otherPlayer.pauseVideo();
      }
    }
    
    // Then play the requested video
    const trackDetails = videoType === 'original' ? currentTrack!.originalSample : currentTrack!.newSong;
    const player = playerRef.current[trackDetails.youtubeVideoId];
    if (player) {
      player.playVideo();
    }
  };

  const pauseVideo = (videoType: 'original' | 'new') => {
    const trackDetails = videoType === 'original' ? currentTrack!.originalSample : currentTrack!.newSong;
    const player = playerRef.current[trackDetails.youtubeVideoId];
    if (player) {
      player.pauseVideo();
    }
  };

  const restartVideo = (videoType: 'original' | 'new') => {
    if (!canPlayVideos) {
      setCanPlayVideos(true);
    }
    
    // Fade out jingle if it's playing
    if (jinglePlaying) {
      fadeOutJingle();
    }
    
    // First pause the other video if it's playing
    const otherVideoType = videoType === 'original' ? 'new' : 'original';
    if (playingVideo === otherVideoType) {
      const otherTrackDetails = otherVideoType === 'original' ? currentTrack!.originalSample : currentTrack!.newSong;
      const otherPlayer = playerRef.current[otherTrackDetails.youtubeVideoId];
      if (otherPlayer) {
        otherPlayer.pauseVideo();
      }
    }
    
    // Then restart the requested video
    const trackDetails = videoType === 'original' ? currentTrack!.originalSample : currentTrack!.newSong;
    const player = playerRef.current[trackDetails.youtubeVideoId];
    if (player) {
      player.seekTo(trackDetails.startTime || 0, true);
      player.playVideo();
    }
  };

  // Helper function to safely auto-play the original sample
  const tryAutoPlayOriginal = () => {
    if (!settings.autoPlayEnabled || !currentTrack) return;
    
    const checkAndPlay = () => {
      const player = playerRef.current[currentTrack.originalSample.youtubeVideoId];
      if (player && playersReady[currentTrack.originalSample.youtubeVideoId]) {
        playVideo('original');
      } else {
        // Retry after a short delay if player isn't ready yet
        autoPlayTimeoutRef.current = setTimeout(checkAndPlay, 200);
      }
    };
    
    checkAndPlay();
  };

  if (!currentTrack) {
    return (
      <div className="flex items-center justify-center h-64 modern-card max-w-md mx-auto p-8">
        <div className="text-center">
          <Music className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-pulse" />
          <div className="text-2xl text-white font-bold">Loading track...</div>
          <div className="text-gray-400 mt-2">Getting ready to test your music knowledge! 🎵</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto relative">
      {/* Floating retro musical notes for atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-20 left-10 text-5xl retro-note-neon-pink animate-float-1">♪</div>
        <div className="absolute top-40 right-16 text-4xl retro-note-neon-cyan animate-float-2">♫</div>
        <div className="absolute top-80 left-20 text-3xl retro-note-neon-yellow animate-float-3">♬</div>
        <div className="absolute top-96 right-8 text-6xl retro-note-neon-purple animate-float-4">♩</div>
        <div className="absolute bottom-40 left-16 text-4xl retro-note-neon-green animate-float-5">♪</div>
        <div className="absolute bottom-20 right-20 text-5xl retro-note-neon-orange animate-float-6">♫</div>
        <div className="absolute top-60 left-5 text-3xl retro-note-neon-cyan animate-float-1" style={{animationDelay: '2s'}}>♬</div>
        <div className="absolute bottom-60 right-5 text-4xl retro-note-neon-pink animate-float-3" style={{animationDelay: '3s'}}>♩</div>
      </div>

      <audio 
        ref={audioRef} 
        src={roundStartSound} 
        preload="auto"
        onEnded={() => {
          setCanPlayVideos(true);
          setJinglePlaying(false);
          // Auto-play original sample if enabled
          setTimeout(() => tryAutoPlayOriginal(), 100);
        }}
        onError={() => {
          setCanPlayVideos(true);
          setJinglePlaying(false);
          // Auto-play original sample if enabled even if jingle fails
          setTimeout(() => tryAutoPlayOriginal(), 100);
        }}
      />

      {/* Tutorial Banner */}
      {showTutorialBanner && (
        <div className="tutorial-welcome fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md mx-auto">
          <div className="modern-card p-4 bg-gradient-to-r from-blue-600 to-purple-600 border-2 border-blue-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm">Tutorial Active</div>
                  <div className="text-blue-100 text-xs">Learning how to play!</div>
                </div>
              </div>
              <Button
                onClick={() => {
                  if (tutorialRef.current) {
                    tutorialRef.current.destroy();
                  }
                  skipTutorial();
                  setShowTutorialBanner(false);
                }}
                className="text-white/70 hover:text-white hover:bg-white/10 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Game Round Container */}
      <div className="relative">
        {/* Round Header - positioned to connect with border */}
        <div className="absolute top-0 left-4 z-10 -mt-3">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-2 rounded-lg text-sm font-bold text-white shadow-lg">
            Round {currentRound}
          </div>
        </div>
        
        <div className="border border-gray-700/30 rounded-lg p-8 pt-12 relative">

      {/* Video Players */}
      <div className="tutorial-reveal-buttons-container-desktop relative z-10 mb-12">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-center gap-8 mb-10">
          {/* Original Sample Player */}
          <div className="tutorial-original-sample-desktop video-container relative">
            <div className="relative w-[400px] h-[400px]">
              <YouTube
                videoId={currentTrack.originalSample.youtubeVideoId}
                opts={{ ...opts, playerVars: { ...opts.playerVars, start: currentTrack.originalSample.startTime } }}
                onReady={(e) => onReady(e, currentTrack.originalSample.youtubeVideoId)}
                onStateChange={(e) => onStateChange(e, 'original')}
                className="absolute top-0 left-0 pointer-events-none rounded-t-24"
              />
              
              {/* Thumbnail Overlay */}
              {(playingVideo !== 'original' || !playersReady[currentTrack.originalSample.youtubeVideoId]) && (
                <div className="absolute inset-0 z-20 bg-black rounded-t-24">
                  <img 
                    src={`https://img.youtube.com/vi/${currentTrack.originalSample.youtubeVideoId}/maxresdefault.jpg`}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover rounded-t-24"
                    onError={(e) => {
                      e.currentTarget.src = `https://img.youtube.com/vi/${currentTrack.originalSample.youtubeVideoId}/hqdefault.jpg`;
                    }}
                  />
                </div>
              )}
              
              {/* Blur Overlay */}
              {!originalRevealed && (
                <div className="absolute inset-0 z-25 bg-black/60 backdrop-blur-xl rounded-t-24"></div>
              )}
              
              {/* Control Buttons */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 flex gap-3">
                <div className="tutorial-play-restart-buttons-desktop flex gap-3">
                  <Button
                    onClick={() => playingVideo === 'original' ? pauseVideo('original') : playVideo('original')}
                    className="modern-button primary w-16 h-16 rounded-full flex items-center justify-center"
                  >
                    {playingVideo === 'original' ? <Pause size={24} /> : <Play size={24} />}
                  </Button>
                  <Button
                    onClick={() => restartVideo('original')}
                    className="modern-button w-16 h-16 rounded-full flex items-center justify-center"
                  >
                    <RotateCcw size={20} />
                  </Button>
                </div>
                <Button
                  onClick={() => setOriginalRevealed(!originalRevealed)}
                  className="tutorial-reveal-button modern-button w-16 h-16 rounded-full flex items-center justify-center"
                >
                  {originalRevealed ? <EyeOff size={20} /> : <Eye size={20} />}
                </Button>
              </div>
              
              {/* Label */}
              <div className="absolute top-4 left-4 z-30">
                <div className="modern-button px-4 py-2 text-sm retro-tech font-bold chrome-border">
                  🎵 ORIGINAL SAMPLE
                </div>
              </div>
              
              {/* Waveform Player */}
              <div className="tutorial-waveform absolute top-4 right-8 z-30">
                <WaveformPlayer
                  isPlaying={playingVideo === 'original'}
                  duration={currentTrack.originalSample.duration}
                />
              </div>
              
              {/* Song Details */}
              {originalRevealed && (
                <div className="absolute bottom-4 right-8 z-30 max-w-[250px]">
                  <div className="track-details px-6 py-2">
                    <div className="font-black text-white text-lg">{currentTrack.originalSample.artist}</div>
                    <div className="text-gray-300 text-sm font-medium">{currentTrack.originalSample.trackName}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* New Song Player */}
          <div className="tutorial-new-song-desktop video-container relative">
            <div className="relative w-[400px] h-[400px]">
              <YouTube
                videoId={currentTrack.newSong.youtubeVideoId}
                opts={{ ...opts, playerVars: { ...opts.playerVars, start: currentTrack.newSong.startTime } }}
                onReady={(e) => onReady(e, currentTrack.newSong.youtubeVideoId)}
                onStateChange={(e) => onStateChange(e, 'new')}
                className="absolute top-0 left-0 pointer-events-none rounded-t-24"
              />
              
              {/* Thumbnail Overlay */}
              {(playingVideo !== 'new' || !playersReady[currentTrack.newSong.youtubeVideoId]) && (
                <div className="absolute inset-0 z-20 bg-black rounded-t-24">
                  <img 
                    src={`https://img.youtube.com/vi/${currentTrack.newSong.youtubeVideoId}/maxresdefault.jpg`}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover rounded-t-24"
                    onError={(e) => {
                      e.currentTarget.src = `https://img.youtube.com/vi/${currentTrack.newSong.youtubeVideoId}/hqdefault.jpg`;
                    }}
                  />
                </div>
              )}
              
              {/* Blur Overlay */}
              {!newSongRevealed && (
                <div className="absolute inset-0 z-25 bg-black/60 backdrop-blur-xl rounded-t-24"></div>
              )}
              
              {/* Control Buttons */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 flex gap-3">
                <div className="flex gap-3">
                  <Button
                    onClick={() => playingVideo === 'new' ? pauseVideo('new') : playVideo('new')}
                    className="modern-button primary w-16 h-16 rounded-full flex items-center justify-center"
                  >
                    {playingVideo === 'new' ? <Pause size={24} /> : <Play size={24} />}
                  </Button>
                  <Button
                    onClick={() => restartVideo('new')}
                    className="modern-button w-16 h-16 rounded-full flex items-center justify-center"
                  >
                    <RotateCcw size={20} />
                  </Button>
                </div>
                <Button
                  onClick={() => setNewSongRevealed(!newSongRevealed)}
                  className="tutorial-reveal-button modern-button w-16 h-16 rounded-full flex items-center justify-center"
                >
                  {newSongRevealed ? <EyeOff size={20} /> : <Eye size={20} />}
                </Button>
              </div>
              
              {/* Label */}
              <div className="absolute top-4 left-4 z-30">
                <div className="modern-button px-4 py-2 text-sm retro-tech font-bold chrome-border">
                  🎤 NEW TRACK
                </div>
              </div>
              
              {/* Waveform Player */}
              <div className="absolute top-4 right-8 z-30">
                <WaveformPlayer
                  isPlaying={playingVideo === 'new'}
                  duration={currentTrack.newSong.duration}
                />
              </div>
              
              {/* Song Details */}
              {newSongRevealed && (
                <div className="absolute bottom-4 right-8 z-30 max-w-[250px]">
                  <div className="track-details px-6 py-2">
                    <div className="font-black text-white text-lg">{currentTrack.newSong.artist}</div>
                    <div className="text-gray-300 text-sm font-medium">{currentTrack.newSong.trackName}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Mobile Layout - Stacked */}
        <div className="tutorial-reveal-buttons-container-mobile md:hidden space-y-8">
          {/* Original Sample Player */}
          <div className="tutorial-original-sample-mobile video-container relative mx-auto max-w-sm">
            <div className="relative w-full aspect-square max-w-[350px] mx-auto">
              <YouTube
                videoId={currentTrack.originalSample.youtubeVideoId}
                opts={{ ...opts, playerVars: { ...opts.playerVars, start: currentTrack.originalSample.startTime }, width: '350', height: '350' }}
                onReady={(e) => onReady(e, currentTrack.originalSample.youtubeVideoId)}
                onStateChange={(e) => onStateChange(e, 'original')}
                className="absolute top-0 left-0 pointer-events-none rounded-t-24 w-full h-full"
              />
              
              {/* Thumbnail Overlay */}
              {(playingVideo !== 'original' || !playersReady[currentTrack.originalSample.youtubeVideoId]) && (
                <div className="absolute inset-0 z-20 bg-black rounded-t-24">
                  <img 
                    src={`https://img.youtube.com/vi/${currentTrack.originalSample.youtubeVideoId}/maxresdefault.jpg`}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover rounded-t-24"
                    onError={(e) => {
                      e.currentTarget.src = `https://img.youtube.com/vi/${currentTrack.originalSample.youtubeVideoId}/hqdefault.jpg`;
                    }}
                  />
                </div>
              )}
              
              {/* Blur Overlay */}
              {!originalRevealed && (
                <div className="absolute inset-0 z-25 bg-black/60 backdrop-blur-xl rounded-t-24"></div>
              )}
              
              {/* Control Buttons */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 flex gap-2">
                <div className="tutorial-play-restart-buttons-mobile flex gap-2">
                  <Button
                    onClick={() => playingVideo === 'original' ? pauseVideo('original') : playVideo('original')}
                    className="modern-button primary w-12 h-12 rounded-full flex items-center justify-center"
                  >
                    {playingVideo === 'original' ? <Pause size={20} /> : <Play size={20} />}
                  </Button>
                  <Button
                    onClick={() => restartVideo('original')}
                    className="modern-button w-12 h-12 rounded-full flex items-center justify-center"
                  >
                    <RotateCcw size={16} />
                  </Button>
                </div>
                <Button
                  onClick={() => setOriginalRevealed(!originalRevealed)}
                  className="tutorial-reveal-button modern-button w-12 h-12 rounded-full flex items-center justify-center"
                >
                  {originalRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              
              {/* Label */}
              <div className="absolute top-3 left-3 z-30">
                <div className="modern-button px-3 py-1 text-xs retro-tech font-bold chrome-border">
                  🎵 ORIGINAL
                </div>
              </div>
              
              {/* Waveform Player */}
              <div className="tutorial-waveform absolute top-3 right-3 z-30">
                <WaveformPlayer
                  isPlaying={playingVideo === 'original'}
                  duration={currentTrack.originalSample.duration}
                />
              </div>
              
              {/* Song Details */}
              {originalRevealed && (
                <div className="absolute bottom-3 right-3 z-30 max-w-[200px]">
                  <div className="track-details px-3 py-2">
                    <div className="font-black text-white text-sm">{currentTrack.originalSample.artist}</div>
                    <div className="text-gray-300 text-xs font-medium">{currentTrack.originalSample.trackName}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* New Song Player */}
          <div className="tutorial-new-song-mobile video-container relative mx-auto max-w-sm">
            <div className="relative w-full aspect-square max-w-[350px] mx-auto">
              <YouTube
                videoId={currentTrack.newSong.youtubeVideoId}
                opts={{ ...opts, playerVars: { ...opts.playerVars, start: currentTrack.newSong.startTime }, width: '350', height: '350' }}
                onReady={(e) => onReady(e, currentTrack.newSong.youtubeVideoId)}
                onStateChange={(e) => onStateChange(e, 'new')}
                className="absolute top-0 left-0 pointer-events-none rounded-t-24 w-full h-full"
              />
              
              {/* Thumbnail Overlay */}
              {(playingVideo !== 'new' || !playersReady[currentTrack.newSong.youtubeVideoId]) && (
                <div className="absolute inset-0 z-20 bg-black rounded-t-24">
                  <img 
                    src={`https://img.youtube.com/vi/${currentTrack.newSong.youtubeVideoId}/maxresdefault.jpg`}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover rounded-t-24"
                    onError={(e) => {
                      e.currentTarget.src = `https://img.youtube.com/vi/${currentTrack.newSong.youtubeVideoId}/hqdefault.jpg`;
                    }}
                  />
                </div>
              )}
              
              {/* Blur Overlay */}
              {!newSongRevealed && (
                <div className="absolute inset-0 z-25 bg-black/60 backdrop-blur-xl rounded-t-24"></div>
              )}
              
              {/* Control Buttons */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 flex gap-2">
                <div className="flex gap-2">
                  <Button
                    onClick={() => playingVideo === 'new' ? pauseVideo('new') : playVideo('new')}
                    className="modern-button primary w-12 h-12 rounded-full flex items-center justify-center"
                  >
                    {playingVideo === 'new' ? <Pause size={20} /> : <Play size={20} />}
                  </Button>
                  <Button
                    onClick={() => restartVideo('new')}
                    className="modern-button w-12 h-12 rounded-full flex items-center justify-center"
                  >
                    <RotateCcw size={16} />
                  </Button>
                </div>
                <Button
                  onClick={() => setNewSongRevealed(!newSongRevealed)}
                  className="tutorial-reveal-button modern-button w-12 h-12 rounded-full flex items-center justify-center"
                >
                  {newSongRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              
              {/* Label */}
              <div className="absolute top-3 left-3 z-30">
                <div className="modern-button px-3 py-1 text-xs retro-tech font-bold chrome-border">
                  🎤 NEW TRACK
                </div>
              </div>
              
              {/* Waveform Player */}
              <div className="absolute top-3 right-3 z-30">
                <WaveformPlayer
                  isPlaying={playingVideo === 'new'}
                  duration={currentTrack.newSong.duration}
                />
              </div>
              
              {/* Song Details */}
              {newSongRevealed && (
                <div className="absolute bottom-3 right-3 z-30 max-w-[200px]">
                  <div className="track-details px-3 py-2">
                    <div className="font-black text-white text-sm">{currentTrack.newSong.artist}</div>
                    <div className="text-gray-300 text-xs font-medium">{currentTrack.newSong.trackName}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Players & Scoring */}
      <div className="tutorial-players-section relative z-10">
        <div className="text-center mb-6 md:mb-8">
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-3 md:mb-4">
            <Users className="w-6 h-6 md:w-8 md:h-8 text-green-400" />
            <h3 className="shrikhand-regular text-xl md:text-3xl text-white">Players & Scoring</h3>
            <Award className="w-6 h-6 md:w-8 md:h-8 text-yellow-400" />
          </div>
          <p className="text-gray-400 text-sm md:text-lg">Award points for correct guesses! ⭐</p>
        </div>
        
        <div className="space-y-4 md:space-y-6">
          {players.map((player, index) => (
            <div key={player.id} className="player-card p-4 md:p-6 relative overflow-hidden">
              
              {/* Desktop Layout */}
              <div className="hidden md:flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-black text-lg">
                    {index + 1}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-white font-black text-2xl">{player.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-medium">Total Score:</span>
                      <div className="score-badge">{player.score} pts</div>
                    </div>
                  </div>
                </div>
                <div className="tutorial-scoring-buttons flex gap-3">
                  <Button 
                    onClick={() => togglePoint(player.id, 'artist')}
                    className={`modern-button px-4 py-3 text-sm retro-tech font-bold flex items-center gap-2 chrome-border ${
                      roundScores[player.id]?.artist ? 'success' : ''
                    }`}
                  >
                    {roundScores[player.id]?.artist && '✅'}
                    🎤 ARTIST
                  </Button>
                  <Button 
                    onClick={() => togglePoint(player.id, 'track')}
                    className={`modern-button px-4 py-3 text-sm retro-tech font-bold flex items-center gap-2 chrome-border ${
                      roundScores[player.id]?.track ? 'success' : ''
                    }`}
                  >
                    {roundScores[player.id]?.track && '✅'}
                    🎵 TRACK
                  </Button>
                  <Button 
                    onClick={() => togglePoint(player.id, 'sample')}
                    className={`modern-button px-4 py-3 text-sm retro-tech font-bold flex items-center gap-2 chrome-border ${
                      roundScores[player.id]?.sample ? 'success' : ''
                    }`}
                  >
                    {roundScores[player.id]?.sample && '✅'}
                    🎼 SAMPLE
                  </Button>
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="md:hidden relative z-10">
                {/* Player Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-black text-sm">
                    {index + 1}
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="text-white font-black text-lg">{player.name}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm font-medium">Score:</span>
                      <div className="score-badge text-sm">{player.score} pts</div>
                    </div>
                  </div>
                </div>
                
                {/* Scoring Buttons */}
                <div className="tutorial-scoring-buttons grid grid-cols-3 gap-2">
                  <Button 
                    onClick={() => togglePoint(player.id, 'artist')}
                    className={`modern-button px-2 py-3 text-xs retro-tech font-bold flex flex-col items-center gap-1 chrome-border ${
                      roundScores[player.id]?.artist ? 'success' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {roundScores[player.id]?.artist && <span className="text-xs">✅</span>}
                      <span>🎤</span>
                    </div>
                    <span>ARTIST</span>
                  </Button>
                  <Button 
                    onClick={() => togglePoint(player.id, 'track')}
                    className={`modern-button px-2 py-3 text-xs retro-tech font-bold flex flex-col items-center gap-1 chrome-border ${
                      roundScores[player.id]?.track ? 'success' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {roundScores[player.id]?.track && <span className="text-xs">✅</span>}
                      <span>🎵</span>
                    </div>
                    <span>TRACK</span>
                  </Button>
                  <Button 
                    onClick={() => togglePoint(player.id, 'sample')}
                    className={`modern-button px-2 py-3 text-xs retro-tech font-bold flex flex-col items-center gap-1 chrome-border ${
                      roundScores[player.id]?.sample ? 'success' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {roundScores[player.id]?.sample && <span className="text-xs">✅</span>}
                      <span>🎼</span>
                    </div>
                    <span>SAMPLE</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons - Bottom */}
      <div className="relative z-10 mt-8 pt-6 border-t border-gray-700/30">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-between">
          <Button 
            onClick={handlePreviousRound}
            disabled={currentRound <= 1}
            className="modern-button px-6 py-4 text-lg retro-tech font-bold flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed chrome-border"
          >
            <ChevronLeft className="w-5 h-5" />
            PREVIOUS
          </Button>
          <div className="text-center">
            <div className="retro-tech text-cyan-300 text-sm font-medium tracking-wider">JUKEBOX NAVIGATION</div>
            <div className="retro-display text-white text-lg font-bold">ROUND {currentRound}</div>
          </div>
          <Button 
            onClick={handleNextRound}
            className="tutorial-next-round-desktop modern-button primary px-6 py-4 text-lg retro-tech font-bold flex items-center gap-3 chrome-border"
          >
            NEXT ROUND
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="text-center mb-4">
            <div className="retro-tech text-cyan-300 text-sm font-medium tracking-wider">ROUND {currentRound}</div>
          </div>
          <div className="flex justify-between items-center gap-4">
            <Button 
              onClick={handlePreviousRound}
              disabled={currentRound <= 1}
              className="modern-button px-4 py-3 text-sm retro-tech font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed flex-1 chrome-border"
            >
              <ChevronLeft className="w-4 h-4" />
              PREV
            </Button>
            <Button 
              onClick={handleNextRound}
              className="tutorial-next-round-mobile modern-button primary px-4 py-3 text-sm retro-tech font-bold flex items-center gap-2 flex-1 chrome-border"
            >
              NEXT
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}

export default GameRound; 