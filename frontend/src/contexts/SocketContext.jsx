import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useUserContext } from './UserContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { user: clerkUser, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { user: syncedUser, loading: userLoading, needsProfileSetup, syncUser } = useUserContext();

  useEffect(() => {
    // Only initialize socket if:
    // 1. Clerk is loaded and user is signed in
    // 2. User context is not loading
    // 3. User is synced (exists in our database)
    // 4. User doesn't need profile setup
    if (!isLoaded || !clerkUser || userLoading || !syncedUser || needsProfileSetup) {
      return;
    }

    const initializeSocket = async () => {
      try {
        // Get authentication token
        const token = await getToken();
        
        // Initialize socket connection
        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
          withCredentials: true,
          auth: {
            token: token,
          },
        });

        newSocket.on('connect', () => {
          console.log('Connected to server');
          setIsConnected(true);
          
          // Authenticate with Clerk user ID and token
          newSocket.emit('authenticate', {
            clerkUserId: clerkUser.id,
            token: token,
          });
        });

        newSocket.on('disconnect', () => {
          console.log('Disconnected from server');
          setIsConnected(false);
          setIsAuthenticated(false);
        });

        newSocket.on('authenticated', (data) => {
          console.log('Authenticated successfully:', data);
          clearTimeout(authTimeout);
          setIsAuthenticated(true);
        });

        // Set a timeout for authentication
        const authTimeout = setTimeout(() => {
          if (!isAuthenticated) {
            console.warn('Authentication timeout - retrying...');
            newSocket.emit('authenticate', {
              clerkUserId: clerkUser.id,
              token: token,
            });
          }
        }, 5000); // 5 second timeout

        newSocket.on('error', (error) => {
          console.error('Socket error:', error);
          setIsAuthenticated(false);

          // If the error is USER_NOT_SYNCED, trigger a sync
          if (error.code === 'USER_NOT_SYNCED') {
            console.log('User not synced, triggering sync...');
            syncUser();
          }
        });

        setSocket(newSocket);

        return () => {
          clearTimeout(authTimeout);
          newSocket.disconnect();
          setIsConnected(false);
          setIsAuthenticated(false);
        };
      } catch (error) {
        console.error('Failed to initialize socket:', error);
      }
    };

    initializeSocket();
  }, [clerkUser, isLoaded, getToken, syncedUser, userLoading, needsProfileSetup]);

  const value = {
    socket,
    isConnected,
    isAuthenticated,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
