import { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useContext(AuthContext);

  const fetchUnreadCount = async () => {
    if (!user || !user.token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/messages/unread-count`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    if (user && user.token) {
      fetchUnreadCount();
      
      const socketUrl = import.meta.env.VITE_API_URL || '';
      const newSocket = io(socketUrl.replace('/api', '')); // Strip /api if it's there
      
      setSocket(newSocket);

      newSocket.on('connect', () => {
        setIsConnected(true);
        newSocket.emit('setup', user._id);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('message received', () => {
        // Increment unread count globally when a new message arrives.
        // If the user is currently viewing the messages, the MessagesView component will call fetchUnreadCount to reset it.
        setUnreadCount((prev) => prev + 1);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, unreadCount, fetchUnreadCount }}>
      {children}
    </SocketContext.Provider>
  );
};
