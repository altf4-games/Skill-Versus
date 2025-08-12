import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useUser, useAuth } from '@clerk/clerk-react';

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
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    if (!isLoaded || !user) return;

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
            clerkUserId: user.id,
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
          setIsAuthenticated(true);
        });

        newSocket.on('error', (error) => {
          console.error('Socket error:', error);
          setIsAuthenticated(false);
        });

        setSocket(newSocket);

        return () => {
          newSocket.disconnect();
          setIsConnected(false);
          setIsAuthenticated(false);
        };
      } catch (error) {
        console.error('Failed to initialize socket:', error);
      }
    };

    initializeSocket();
  }, [user, isLoaded, getToken]);

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
