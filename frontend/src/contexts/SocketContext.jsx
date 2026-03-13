import { createContext, useContext, useEffect, useRef, useState } from 'react';
import Pusher from 'pusher-js';
import { useAuth } from '@clerk/clerk-react';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};

export const SocketProvider = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const pusherRef = useRef(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    if (!import.meta.env.VITE_PUSHER_KEY) {
      console.warn('[Pusher] VITE_PUSHER_KEY not set, real-time features disabled');
      setIsConnected(false);
      return;
    }

    Pusher.logToConsole = import.meta.env.DEV;

    const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER || 'ap2',
    });

    pusherRef.current = pusher;

    pusher.connection.bind('connected', () => {
      console.log('[Pusher] Connected');
      setIsConnected(true);
    });

    pusher.connection.bind('error', (err) => {
      console.error('[Pusher] Connection error:', err);
      setIsConnected(false);
    });

    pusher.connection.bind('disconnected', () => {
      console.warn('[Pusher] Disconnected');
      setIsConnected(false);
    });

    return () => {
      pusher.disconnect();
      pusherRef.current = null;
      setIsConnected(false);
    };
  }, [isLoaded, isSignedIn]);

  const subscribeToRoom = (roomCode) => {
    if (!pusherRef.current) return null;
    const channelName = `room-${roomCode}`;
    return pusherRef.current.subscribe(channelName);
  };

  const unsubscribeFromRoom = (roomCode) => {
    if (!pusherRef.current) return;
    pusherRef.current.unsubscribe(`room-${roomCode}`);
  };

  const value = {
    pusher: pusherRef.current,
    isConnected,
    // Expose as "isAuthenticated" for backward compatibility checks in DuelsPage
    isAuthenticated: isConnected,
    // Legacy: socket = null (nothing emits anymore)
    socket: null,
    subscribeToRoom,
    unsubscribeFromRoom,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};