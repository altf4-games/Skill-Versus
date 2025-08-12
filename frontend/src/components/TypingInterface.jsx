import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Clock, 
  Users, 
  Trophy, 
  RotateCcw,
  Target,
  Zap,
  CheckCircle2,
  XCircle,
  Copy
} from 'lucide-react';

export default function TypingInterface({ 
  room, 
  socket, 
  user, 
  timeRemaining, 
  isReady, 
  setIsReady,
  formatTime 
}) {
  const [typedText, setTypedText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isFinished, setIsFinished] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const inputRef = useRef(null);

  const words = room?.typingContent?.words || [];
  const totalWords = room?.typingContent?.totalWords || 0;
  const text = room?.typingContent?.text || '';

  // Calculate current typed word and remaining text
  const getCurrentWord = () => words[currentWordIndex] || '';
  const getDisplayText = () => {
    return words.slice(currentWordIndex, currentWordIndex + 10).join(' '); // Show next 10 words
  };

  // Focus input when component mounts or duel starts
  useEffect(() => {
    if (room?.status === 'active' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [room?.status]);

  // Handle typing input
  const handleInputChange = (e) => {
    const value = e.target.value;
    
    if (room?.status !== 'active') return;

    // Get the current word and expected text so far
    const currentWord = getCurrentWord();
    const typedWords = value.split(' ');
    const currentTypedWord = typedWords[typedWords.length - 1];
    
    // Check if the current typed word is a prefix of the expected word
    if (currentTypedWord && !currentWord.startsWith(currentTypedWord)) {
      // User made a mistake - don't update the input
      return;
    }
    
    // Start timer on first character
    if (!startTime && value.length > 0) {
      setStartTime(new Date());
    }

    setTypedText(value);

    // Check if current word is completed correctly
    const currentWord2 = getCurrentWord(); // Get again after potential state update

    // If user typed a space, check if the previous word matches
    if (value.endsWith(' ') && typedWords.length > 1) {
      const lastCompletedWord = typedWords[typedWords.length - 2]; // The word before the space
      if (lastCompletedWord === currentWord2) {
        const newWordIndex = currentWordIndex + 1;
        setCurrentWordIndex(newWordIndex);
        setTypedText(''); // Clear input for next word
        
        // Check if completed all words
        if (newWordIndex >= totalWords) {
          handleCompletion();
          return;
        }
      }
    }

    // Calculate stats and emit progress
    const timeElapsed = startTime ? (new Date() - startTime) / 1000 : 0;
    const wordsTyped = typedWords.length - 1 + (currentTypedWord === currentWord ? 1 : 0);
    const currentWpm = timeElapsed > 0 ? (wordsTyped / timeElapsed) * 60 : 0;
    
    // Calculate accuracy (character-level)
    const expectedText = words.slice(0, Math.floor(typedWords.length - 1)).join(' ') + 
                        (typedWords.length > 1 ? ' ' : '') + currentWord.substring(0, currentTypedWord.length);
    const typedForComparison = value.substring(0, expectedText.length);
    let correct = 0;
    for (let i = 0; i < Math.min(typedForComparison.length, expectedText.length); i++) {
      if (typedForComparison[i] === expectedText[i]) correct++;
    }
    const currentAccuracy = expectedText.length > 0 ? (correct / expectedText.length) * 100 : 100;

    setWpm(Math.round(currentWpm));
    setAccuracy(Math.round(currentAccuracy * 100) / 100);

    // Check for mistakes (accuracy below 100%)
    if (currentAccuracy < 100) {
      setMistakes(prev => prev + 1);
    }

    // Emit progress to other players
    if (socket) {
      socket.emit('typing-progress', {
        roomCode: room.roomCode,
        typedText: value,
        currentWordIndex: newWordIndex || currentWordIndex,
      });
    }
  };

  const handleCompletion = () => {
    setIsFinished(true);
    const finishTime = new Date();
    const totalTime = startTime ? (finishTime - startTime) / 1000 : 0;
    const finalWpm = totalTime > 0 ? (totalWords / totalTime) * 60 : 0;
    
    setWpm(Math.round(finalWpm));
    
    console.log(`Typing completed in ${totalTime}s with ${accuracy}% accuracy`);
    
    // Notify server about completion
    if (socket) {
      socket.emit('typing-completion', {
        roomCode: room.roomCode,
        finishTime: finishTime,
        totalTime: totalTime,
        wpm: Math.round(finalWpm),
        accuracy: accuracy,
        totalWords: totalWords
      });
    }
  };

  const handleRestart = () => {
    if (accuracy < 100) {
      setTypedText('');
      setCurrentWordIndex(0);
      setStartTime(null);
      setWpm(0);
      setAccuracy(100);
      setMistakes(0);
      setIsFinished(false);
      
      if (socket) {
        socket.emit('restart-typing', {
          roomCode: room.roomCode,
        });
      }
      
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const toggleReady = () => {
    if (socket) {
      socket.emit('toggle-ready', { roomCode: room.roomCode });
    }
    setIsReady(!isReady);
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(room.roomCode);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000); // Hide feedback after 2 seconds
      console.log('Room code copied to clipboard');
    } catch (err) {
      console.error('Failed to copy room code:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = room.roomCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const getParticipantProgress = (participant) => {
    return participant.typingProgress ? 
      (participant.typingProgress.currentWordIndex / totalWords) * 100 : 0;
  };

  const renderTextDisplay = () => {
    const displayWords = words.slice(currentWordIndex, currentWordIndex + 15);
    const currentWord = getCurrentWord();
    const typedWords = typedText.split(' ');
    const currentTypedWord = typedWords[typedWords.length - 1] || '';

    return (
      <div className="text-base sm:text-lg leading-relaxed font-mono p-4 sm:p-6 bg-muted/50 rounded-lg min-h-[150px] sm:min-h-[200px] max-h-[250px] sm:max-h-[300px] overflow-y-auto">
        <div className="flex flex-wrap gap-x-1 sm:gap-x-2 gap-y-1">
          {displayWords.map((word, index) => {
            const isCurrentWord = index === 0;
            const isCorrect = isCurrentWord ? currentTypedWord === word.substring(0, currentTypedWord.length) : false;
            
            return (
              <span key={index} className="inline-block">
                {isCurrentWord ? (
                  <span className={`${isCorrect ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'} px-1 sm:px-2 py-1 rounded border-2 relative text-sm sm:text-base`}>
                    {word}
                    {isCorrect && currentTypedWord.length === word.length && (
                      <span className="absolute -top-1 -right-1">
                        <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-muted-foreground px-1 text-sm sm:text-base">{word}</span>
                )}
              </span>
            );
          })}
        </div>
        
        {/* Progress indicator */}
        <div className="mt-4 pt-4 border-t border-muted-foreground/20">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Progress: {currentWordIndex} / {totalWords} words</span>
            <span>{Math.round((currentWordIndex / totalWords) * 100)}% complete</span>
          </div>
        </div>
      </div>
    );
  };

  if (!room) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with room info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Typing Duel</h1>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="font-mono">
              {room.roomCode}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={copyRoomCode}
              className="h-8 w-8 p-0"
              title="Copy room code"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {room.status === 'active' && (
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4" />
              <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Copy feedback */}
      {copyFeedback && (
        <div className="mb-4 p-2 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded-lg text-center text-sm">
          Room code copied to clipboard!
        </div>
      )}

      {/* Text content info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Text Challenge</CardTitle>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>{totalWords} words</span>
              <Badge variant="secondary">{room.typingContent?.difficulty || 'medium'}</Badge>
              <Badge variant="outline">{room.typingContent?.category || 'general'}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {room.status === 'waiting' ? (
            <div className="text-center py-8 space-y-4">
              <div className="text-6xl">⌨️</div>
              <h3 className="text-xl font-semibold">Get Ready to Type!</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You'll need to type the text below with 100% accuracy. 
                First player to complete the entire text wins!
              </p>
              <div className="bg-muted/50 rounded-lg p-4 max-w-2xl mx-auto">
                <p className="text-sm text-muted-foreground mb-2">Preview (first 50 words):</p>
                <div className="text-sm font-mono text-left line-clamp-3">
                  {words.slice(0, 50).join(' ')}
                  {words.length > 50 && '...'}
                </div>
              </div>
              <div className="flex items-center justify-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>{totalWords} words</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4" />
                  <span>100% accuracy required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>First to finish wins</span>
                </div>
              </div>
            </div>
          ) : (
            renderTextDisplay()
          )}
        </CardContent>
      </Card>

      {/* Typing input */}
      {room.status === 'active' && !isFinished && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Type the words exactly as shown above</span>
                <span className="text-red-600 font-medium">100% accuracy required</span>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={typedText}
                onChange={handleInputChange}
                className="w-full p-4 text-lg font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Start typing..."
                disabled={room.status !== 'active'}
                autoComplete="off"
                spellCheck="false"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span>{wpm} WPM</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <span>{accuracy}% accuracy</span>
                  </div>
                  <div className="text-muted-foreground">
                    Word {currentWordIndex + 1} of {totalWords}
                  </div>
                </div>
                {accuracy < 100 && (
                  <Button onClick={handleRestart} size="sm" variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restart
                  </Button>
                )}
              </div>
              <Progress value={(currentWordIndex / totalWords) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion screen */}
      {room.status === 'active' && isFinished && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Trophy className="h-16 w-16 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-800 dark:text-green-200">
                  🎉 Congratulations!
                </h3>
                <p className="text-green-700 dark:text-green-300 mt-2">
                  You completed the typing challenge!
                </p>
              </div>
              <div className="flex items-center justify-center space-x-6 text-sm bg-white dark:bg-gray-800 rounded-lg p-4">
                <div className="text-center">
                  <div className="font-bold text-lg">{wpm}</div>
                  <div className="text-muted-foreground">WPM</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg">{accuracy}%</div>
                  <div className="text-muted-foreground">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg">{totalWords}</div>
                  <div className="text-muted-foreground">Words</div>
                </div>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400">
                Waiting for final results...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Participants - Only show during active gameplay */}
      {room.status === 'active' && (
        <div className="grid md:grid-cols-2 gap-6">
          {room.participants?.map((participant, index) => (
          <Card key={participant.userId} className={`border-2 ${participant.userId === user?.id ? 'border-primary' : 'border-border'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={participant.profileImage} />
                    <AvatarFallback>
                      {participant.username?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{participant.username}</div>
                    <div className="text-sm text-muted-foreground">
                      {participant.userId === room.host ? 'Host' : 'Player'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {participant.isReady && room.status === 'waiting' && (
                    <Badge variant="default">Ready</Badge>
                  )}
                  {room.status === 'active' && participant.typingProgress && (
                    <div className="text-sm text-muted-foreground">
                      {participant.typingProgress.wpm} WPM
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {room.status === 'active' ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(getParticipantProgress(participant))}%</span>
                  </div>
                  <Progress value={getParticipantProgress(participant)} />
                  {participant.typingProgress && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{participant.typingProgress.accuracy}% accuracy</span>
                      <span>Word {participant.typingProgress.currentWordIndex + 1}/{totalWords}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  {participant.isReady ? 'Ready to type!' : 'Getting ready...'}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {/* Ready button for waiting state */}
      {room.status === 'waiting' && (
        <>
          {/* Lobby Screen - Waiting for Players */}
          {room.participants?.length < 2 && (
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-center">Waiting for Players</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="animate-pulse">
                      <Users className="h-16 w-16 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Share the room code <strong>{room.roomCode}</strong> with someone to start the typing duel
                  </p>
                  <div className="flex justify-center">
                    <Button onClick={copyRoomCode} variant="outline">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Room Code
                    </Button>
                  </div>
                  
                  {/* Tips for typing */}
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      💡 Typing Duel Rules
                    </h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 text-left max-w-md mx-auto">
                      <li>• 100% accuracy required to progress</li>
                      <li>• First to complete all words wins</li>
                      <li>• Type each word followed by a space</li>
                      <li>• Focus on accuracy over speed</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Waiting to Start Screen - Both Players Joined */}
          {room.participants?.length === 2 && (
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-center">Ready to Start?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Players */}
                  <div className="grid grid-cols-2 gap-4">
                    {room.participants.map((participant) => (
                      <div 
                        key={participant.userId}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(participant.username || 'User')}&background=6366f1&color=fff&size=40`}
                              alt={participant.username}
                            />
                            <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                              {participant.username ? 
                                participant.username.substring(0, 2).toUpperCase() : 
                                'U'
                              }
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{participant.username}</span>
                        </div>
                        {participant.isReady ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <div className="h-5 w-5 border-2 border-border rounded-full" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Ready Button */}
                  <div className="text-center">
                    <Button
                      onClick={toggleReady}
                      size="lg"
                      variant={isReady ? "outline" : "default"}
                      className="w-full max-w-xs"
                    >
                      {isReady ? "Not Ready" : "Ready"}
                    </Button>
                  </div>

                  {/* Status Message */}
                  {room.participants.every(p => p.isReady) && (
                    <div className="text-center">
                      <p className="text-green-600 dark:text-green-400 font-semibold">All players ready! Starting in 2 seconds...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
