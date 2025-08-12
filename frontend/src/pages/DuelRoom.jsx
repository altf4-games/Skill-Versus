import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '@/contexts/SocketContext';
import { useUserContext } from '@/contexts/UserContext';
import { apiClient } from '@/lib/api';
import { Editor } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Copy, 
  Clock, 
  Users, 
  Send, 
  Play, 
  Trophy, 
  Check, 
  X, 
  Code, 
  Eye, 
  EyeOff,
  CheckCircle
} from 'lucide-react';

// Language templates like LeetCode
const LANGUAGE_OPTIONS = {
  71: { // Python
    name: 'Python',
    monacoId: 'python'
  },
  62: { // Java
    name: 'Java',
    monacoId: 'java'
  },
  76: { // C++
    name: 'C++',
    monacoId: 'cpp'
  },
  63: { // JavaScript
    name: 'JavaScript',
    monacoId: 'javascript'
  }
};

export default function DuelRoom() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useUserContext();

  const [room, setRoom] = useState(null);
  const [code, setCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(71); // Python default
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [hasCorrectSubmission, setHasCorrectSubmission] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [runOutput, setRunOutput] = useState(null);
  const [showOutput, setShowOutput] = useState(false);
  const [duelResult, setDuelResult] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);

  // Initialize code template when language changes or room changes
  useEffect(() => {
    if (selectedLanguage && room?.problem?.languageBoilerplate) {
      const languageMap = {
        71: 'python',
        63: 'javascript', 
        62: 'java',
        76: 'cpp'
      };
      
      const languageKey = languageMap[selectedLanguage];
      if (languageKey && room.problem.languageBoilerplate[languageKey]) {
        setCode(room.problem.languageBoilerplate[languageKey]);
      }
    }
  }, [selectedLanguage, room?.problem]);

  // Fetch available languages on mount
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch('/api/judge0/languages');
        const languages = await response.json();
        
        // Filter for common languages
        const commonLanguages = languages.filter(lang => 
          [71, 62, 76, 63].includes(lang.id)
        );
        setAvailableLanguages(commonLanguages);
      } catch (error) {
        console.error('Failed to fetch languages:', error);
      }
    };

    fetchLanguages();
  }, []);

  useEffect(() => {
    if (!socket || !roomCode) return;

    // Join room
    socket.emit('join-duel', { roomCode });

    // Socket event listeners
    const handleParticipantJoined = (data) => {
      console.log('Participant joined:', data);
      setRoom(data.room);
    };

    const handleUserReadyChanged = (data) => {
      console.log('User ready status changed:', data);
      setRoom(data.room);
    };

    const handleDuelStarted = (data) => {
      console.log('Duel started:', data);
      setRoom(data.room);
      if (data.room?.timeLimit) {
        setTimeRemaining(data.room.timeLimit * 60); // Convert minutes to seconds
        startTimer();
      }
    };

    const handleCodeSubmitted = (data) => {
      console.log('Code submitted by participant:', data);
      setRoom(data.room);
    };

    const handleDuelEnded = (data) => {
      console.log('Duel ended:', data);
      setDuelResult(data);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };

    const handleDuelFinished = (data) => {
      console.log('Duel finished:', data);
      console.log('Winner data:', data.winner);
      setDuelResult(data);
      setRoom(data.room);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };

    const handleSubmissionReceived = (data) => {
      console.log('Submission received:', data);
      // Show notification about opponent's submission
      if (data.userId !== user?.id) {
        setError(`${data.username} submitted: ${data.passed}/${data.total} test cases passed`);
        setTimeout(() => setError(null), 5000);
      }
    };

    const handleChatMessage = (data) => {
      setChatMessages(prev => [...prev, data]);
    };

    const handleError = (error) => {
      console.error('Socket error:', error);
      setError(error.message);
    };

    // Add event listeners
    socket.on('participant-joined', handleParticipantJoined);
    socket.on('user-ready-changed', handleUserReadyChanged);
    socket.on('duel-started', handleDuelStarted);
    socket.on('code-submitted', handleCodeSubmitted);
    socket.on('duel-ended', handleDuelEnded);
    socket.on('duel-finished', handleDuelFinished);
    socket.on('submission-received', handleSubmissionReceived);
    socket.on('chat-message', handleChatMessage);
    socket.on('error', handleError);

    // Cleanup
    return () => {
      socket.off('participant-joined', handleParticipantJoined);
      socket.off('user-ready-changed', handleUserReadyChanged);
      socket.off('duel-started', handleDuelStarted);
      socket.off('code-submitted', handleCodeSubmitted);
      socket.off('duel-ended', handleDuelEnded);
      socket.off('duel-finished', handleDuelFinished);
      socket.off('submission-received', handleSubmissionReceived);
      socket.off('chat-message', handleChatMessage);
      socket.off('error', handleError);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [socket, roomCode]);

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev && prev > 0) {
          return prev - 1;
        } else {
          clearInterval(timerRef.current);
          return 0;
        }
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleReady = () => {
    if (socket && roomCode) {
      socket.emit('toggle-ready', { roomCode });
      setIsReady(!isReady);
    }
  };

  const runCode = async () => {
    if (!code.trim()) {
      setError('Please write some code to run');
      return;
    }

    if (!room?.problem?._id) {
      setError('Problem information not available');
      return;
    }

    setIsRunning(true);
    setRunOutput(null);
    setError(null);

    try {
      const result = await apiClient.request('/api/judge0/run-tests', {
        method: 'POST',
        body: JSON.stringify({
          source_code: code,
          language_id: selectedLanguage,
          problem_id: room.problem._id,
        }),
      });

      setRunOutput(result);
      setShowOutput(true);
    } catch (error) {
      console.error('Failed to run code:', error);
      setError('Failed to run code: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const submitCode = async () => {
    if (!code.trim()) {
      setError('Please write some code to submit');
      return;
    }

    // Allow resubmission until correct
    if (hasCorrectSubmission) {
      setError('You have already solved this problem correctly');
      return;
    }

    if (!room?.problem?._id) {
      setError('Problem information not available');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Submit code with all test cases
      const result = await apiClient.request('/api/judge0/submit-tests', {
        method: 'POST',
        body: JSON.stringify({
          source_code: code,
          language_id: selectedLanguage,
          problem_id: room.problem._id,
        }),
      });
      
      // Submit to socket for duel processing
      if (socket && roomCode) {
        socket.emit('submit-code', {
          roomCode,
          code,
          language: selectedLanguage,
          result
        });
        
        // Only mark as "done" if submission is correct
        if (result?.passedCount === result?.totalCount && result?.totalCount > 0) {
          setHasCorrectSubmission(true);
        }
        setSubmissionResult(result);
      }
    } catch (error) {
      console.error('Failed to submit code:', error);
      setError('Failed to submit code: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    // You could add a toast notification here
  };

  const sendChatMessage = () => {
    if (chatMessage.trim() && socket && roomCode) {
      socket.emit('chat-message', {
        roomCode,
        message: chatMessage.trim()
      });
      setChatMessage('');
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading duel room...</p>
        </div>
      </div>
    );
  }

  const isLobby = room.status === 'waiting' && room.participants?.length < 2;
  const isWaitingToStart = room.status === 'waiting' && room.participants?.length === 2;
  const isDuelActive = room.status === 'active';
  const isDuelFinished = room.status === 'finished' || duelResult;

  const currentParticipant = room.participants?.find(p => p.userId._id === user?.id || p.userId === user?.id);
  const isCurrentUserReady = currentParticipant?.isReady || false;

  // Show duel result screen if finished
  if (isDuelFinished && duelResult) {
    console.log('DEBUG: Winner comparison');
    console.log('duelResult.winner?.userId:', duelResult.winner?.userId);
    console.log('user?.id:', user?.id);
    console.log('user object:', user);
    const isWinner = duelResult.winner?.userId === user?.id;
    const winnerName = duelResult.winner?.username || 'Unknown';
    console.log('isWinner:', isWinner);
    
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center p-8">
            <CardContent>
              <div className="mb-6">
                {isWinner ? (
                  <div className="text-green-600">
                    <Trophy className="h-16 w-16 mx-auto mb-4" />
                    <h1 className="text-4xl font-bold mb-2">Victory! 🎉</h1>
                    <p className="text-xl text-gray-600">Congratulations! You won the duel!</p>
                  </div>
                ) : (
                  <div className="text-red-600">
                    <X className="h-16 w-16 mx-auto mb-4" />
                    <h1 className="text-4xl font-bold mb-2">Defeat 😔</h1>
                    <p className="text-xl text-gray-600">{winnerName} won this duel!</p>
                  </div>
                )}
              </div>

              {duelResult.finalResults && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Final Results</h3>
                  <div className="space-y-2">
                    {duelResult.finalResults.map((result, index) => (
                      <div 
                        key={index}
                        className={`p-3 rounded-lg border ${
                          result.userId === user?.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{result.username}</span>
                          <div className="flex items-center space-x-4">
                            <Badge variant={result.passed === result.total ? "default" : "secondary"}>
                              {result.passed}/{result.total} passed
                            </Badge>
                            {result.submissionTime && (
                              <span className="text-sm text-gray-500">
                                {new Date(result.submissionTime).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center space-x-4">
                <Button onClick={() => navigate('/duels')} size="lg">
                  New Duel
                </Button>
                <Button onClick={() => navigate('/dashboard')} variant="outline" size="lg">
                  Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Coding Duel</h1>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="font-mono">
                  {roomCode}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyRoomCode}
                  className="p-2"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {isDuelActive && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-600" />
                  <span className="font-mono text-lg font-semibold">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <Badge variant={timeRemaining > 300 ? "default" : "destructive"}>
                  {timeRemaining > 60 ? `${Math.ceil(timeRemaining / 60)}m left` : `${timeRemaining}s left`}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Lobby Screen */}
        {isLobby && (
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
                <p className="text-gray-600">
                  Share the room code <strong>{roomCode}</strong> with someone to start the duel
                </p>
                <div className="flex justify-center">
                  <Button onClick={copyRoomCode} variant="outline">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Room Code
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Waiting to Start Screen */}
        {isWaitingToStart && (
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
                      key={participant.userId._id || participant.userId} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <img 
                            src={participant.userId.profileImage || `https://ui-avatars.com/api/?name=${participant.userId.username}`}
                            alt={participant.userId.username}
                          />
                        </Avatar>
                        <span className="font-medium">{participant.userId.username}</span>
                      </div>
                      {participant.isReady ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Ready Button */}
                <div className="text-center">
                  <Button
                    onClick={handleToggleReady}
                    size="lg"
                    variant={isCurrentUserReady ? "outline" : "default"}
                    className="w-full max-w-xs"
                  >
                    {isCurrentUserReady ? "Not Ready" : "Ready"}
                  </Button>
                </div>

                {/* Status Message */}
                {room.participants.every(p => p.isReady) && (
                  <div className="text-center">
                    <p className="text-green-600 font-semibold">All players ready! Starting in 2 seconds...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Duel */}
        {isDuelActive && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Problem & Code Editor (3/4 width) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Problem Statement */}
              {room.problem && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Code className="h-5 w-5" />
                        <span className="text-lg font-semibold">{room.problem.title}</span>
                      </div>
                      <Badge 
                        className={
                          room.problem.difficulty === 'Easy' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
                          room.problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' : 
                          'bg-red-100 text-red-800 hover:bg-red-100'
                        }
                      >
                        {room.problem.difficulty}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 whitespace-pre-line">
                        {room.problem.description}
                      </p>
                      
                      {room.problem.examples && room.problem.examples.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Examples:</h4>
                          {room.problem.examples.map((example, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg mb-3 border">
                              <div className="space-y-2">
                                <div>
                                  <strong className="text-gray-900">Input:</strong>
                                  <code className="ml-2 px-2 py-1 bg-gray-200 rounded text-sm font-mono">{example.input}</code>
                                </div>
                                <div>
                                  <strong className="text-gray-900">Output:</strong>
                                  <code className="ml-2 px-2 py-1 bg-gray-200 rounded text-sm font-mono">{example.output}</code>
                                </div>
                                {example.explanation && (
                                  <div>
                                    <strong className="text-gray-900">Explanation:</strong>
                                    <span className="ml-2 text-gray-700">{example.explanation}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {room.problem.constraints && (
                        <div className="mt-6">
                          <h4 className="font-semibold text-gray-900 mb-3">Constraints:</h4>
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <pre className="text-sm text-gray-700 whitespace-pre-line font-mono">{room.problem.constraints}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Code Editor */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Code Editor</CardTitle>
                    <div className="flex items-center space-x-2">
                      {/* Language Selector */}
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(Number(e.target.value))}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                        disabled={hasCorrectSubmission}
                      >
                        {Object.entries(LANGUAGE_OPTIONS).map(([id, lang]) => (
                          <option key={id} value={id}>{lang.name}</option>
                        ))}
                      </select>
                      
                      {/* Show/Hide Output */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowOutput(!showOutput)}
                      >
                        {showOutput ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {showOutput ? 'Hide' : 'Show'} Output
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Monaco Editor */}
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <Editor
                        height="400px"
                        language={LANGUAGE_OPTIONS[selectedLanguage]?.monacoId || 'python'}
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          fontSize: 14,
                          lineNumbers: 'on',
                          wordWrap: 'on',
                          automaticLayout: true,
                          readOnly: hasCorrectSubmission
                        }}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Button
                          onClick={runCode}
                          disabled={isRunning || !code.trim()}
                          variant="outline"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {isRunning ? 'Running...' : 'Run'}
                        </Button>
                        
                        <Button
                          onClick={submitCode}
                          disabled={isSubmitting || hasCorrectSubmission || !code.trim()}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {isSubmitting ? 'Submitting...' : hasCorrectSubmission ? 'Solved!' : 'Submit'}
                        </Button>
                      </div>

                      {submissionResult && (
                        <Badge variant="success" className="bg-green-100 text-green-800">
                          <Check className="h-4 w-4 mr-1" />
                          Submitted
                        </Badge>
                      )}
                    </div>

                    {/* Output Panel */}
                    {showOutput && (runOutput || submissionResult) && (
                      <Card className="mt-4">
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center justify-between">
                            <span>
                              {submissionResult ? 'Submission Result' : 'Test Results'}
                            </span>
                            {(runOutput || submissionResult) && (
                              <span className={`text-xs px-2 py-1 rounded ${
                                (runOutput || submissionResult).accepted || (runOutput || submissionResult).allPassed 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {(runOutput || submissionResult).verdict || 
                                 ((runOutput || submissionResult).allPassed ? 'All Tests Passed' : 
                                  `${(runOutput || submissionResult).passedCount || 0}/${(runOutput || submissionResult).totalCount || 0} Passed`)}
                              </span>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {/* Test Case Results */}
                            {(runOutput || submissionResult)?.testResults && (
                              <div className="space-y-2">
                                {(runOutput || submissionResult).testResults.map((testResult, index) => (
                                  <div key={index} className={`border rounded-lg p-3 ${
                                    testResult.isHidden 
                                      ? 'bg-gray-50' 
                                      : testResult.passed 
                                        ? 'bg-green-50 border-green-200' 
                                        : 'bg-red-50 border-red-200'
                                  }`}>
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium">
                                        {testResult.isHidden ? `Hidden Test Case ${index + 1}` : `Test Case ${index + 1}`}
                                      </span>
                                      <span className={`text-xs px-2 py-1 rounded ${
                                        testResult.passed 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {testResult.passed ? 'PASS' : 'FAIL'}
                                      </span>
                                    </div>
                                    
                                    {!testResult.isHidden && (
                                      <div className="space-y-2 text-sm">
                                        <div>
                                          <span className="font-medium text-gray-600">Input:</span>
                                          <code className="ml-2 px-2 py-1 bg-gray-100 rounded font-mono text-xs">
                                            {testResult.input}
                                          </code>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-600">Expected:</span>
                                          <code className="ml-2 px-2 py-1 bg-gray-100 rounded font-mono text-xs">
                                            {testResult.expectedOutput}
                                          </code>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-600">Your Output:</span>
                                          <code className={`ml-2 px-2 py-1 rounded font-mono text-xs ${
                                            testResult.passed 
                                              ? 'bg-green-100 text-green-800' 
                                              : 'bg-red-100 text-red-800'
                                          }`}>
                                            {testResult.actualOutput || '(no output)'}
                                          </code>
                                        </div>
                                        {testResult.error && (
                                          <div>
                                            <span className="font-medium text-red-600">Error:</span>
                                            <pre className="ml-2 text-xs text-red-600 bg-red-50 p-2 rounded font-mono">
                                              {testResult.error}
                                            </pre>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Legacy output for backward compatibility */}
                            {!(runOutput || submissionResult)?.testResults && (runOutput || submissionResult) && (
                              <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
                                <div className="space-y-1">
                                  {(runOutput || submissionResult).stdout && (
                                    <div>
                                      <div className="text-green-400 text-xs">OUTPUT:</div>
                                      <pre className="whitespace-pre-wrap">{(runOutput || submissionResult).stdout}</pre>
                                    </div>
                                  )}
                                  {(runOutput || submissionResult).stderr && (
                                    <div>
                                      <div className="text-red-400 text-xs">ERROR:</div>
                                      <pre className="whitespace-pre-wrap text-red-300">{(runOutput || submissionResult).stderr}</pre>
                                    </div>
                                  )}
                                  {(runOutput || submissionResult).compile_output && (
                                    <div>
                                      <div className="text-yellow-400 text-xs">COMPILE OUTPUT:</div>
                                      <pre className="whitespace-pre-wrap text-yellow-300">{(runOutput || submissionResult).compile_output}</pre>
                                    </div>
                                  )}
                                  <div className="text-gray-400 text-xs">
                                    Status: {(runOutput || submissionResult).status?.description || 'Unknown'}
                                    {(runOutput || submissionResult).time && ` | Time: ${(runOutput || submissionResult).time}s`}
                                    {(runOutput || submissionResult).memory && ` | Memory: ${(runOutput || submissionResult).memory} KB`}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar (1/4 width) */}
            <div className="space-y-6">
              {/* Participants Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Players</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {room.participants.map((participant) => (
                    <div key={participant.userId._id || participant.userId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <img 
                            src={participant.userId.profileImage || `https://ui-avatars.com/api/?name=${participant.userId.username}`}
                            alt={participant.userId.username}
                          />
                        </Avatar>
                        <div>
                          <p className="font-medium">{participant.userId.username}</p>
                          <p className="text-sm text-gray-500">
                            {participant.hasSubmitted ? 'Submitted' : 'Coding...'}
                          </p>
                        </div>
                      </div>
                      {participant.hasSubmitted && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Chat */}
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle className="text-sm">Chat</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-48 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                      {chatMessages.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center">No messages yet</p>
                      ) : (
                        chatMessages.map((msg, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium text-blue-600">{msg.username}:</span>
                            <span className="ml-2">{msg.message}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Input
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Type a message..."
                        onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                        className="text-sm"
                      />
                      <Button size="sm" onClick={sendChatMessage}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Duel Result */}
        {duelResult && (
          <Card className="max-w-2xl mx-auto mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <span>Duel Complete!</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {duelResult.winner ? (
                <div className="text-center">
                  <p className="text-lg font-semibold text-green-600">
                    🎉 {duelResult.finalResults?.find(r => r.userId === duelResult.winner)?.username || 'Winner'} wins!
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-lg font-semibold text-yellow-600">
                    It's a tie! Both players submitted working solutions.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-semibold">Final Results:</h4>
                {duelResult.finalResults?.map((result, index) => (
                  <div key={result.userId || index} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{result.username}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant={result.passed ? "default" : "destructive"}>
                        {result.passed ? "Passed" : "Failed"}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(result.submittedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500">No results available</p>
                )}
              </div>

              <div className="flex justify-center space-x-4 pt-4">
                <Button onClick={() => navigate('/duels')}>
                  Back to Duels
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  New Duel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
