// src/hooks/useSocket.js
import { useEffect, useState, useRef, useCallback } from 'react';
import { socketService } from '../socket/socket';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Connect to socket server
  const connect = useCallback(async (username, room = 'general') => {
    try {
      setIsConnecting(true);
      setError(null);
      
      const socket = socketService.connect();
      socketRef.current = socket;

      if (username) {
        socket.emit('user_join', { username, room });
        setCurrentRoom(room);
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect from socket server
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketService.disconnect();
    }
  }, []);

  // Send a message
  const sendMessage = useCallback((message, room = null) => {
    if (socketRef.current && message.trim()) {
      const targetRoom = room || currentRoom;
      socketRef.current.emit('send_message', { 
        message: message.trim(), 
        room: targetRoom 
      });
    }
  }, [currentRoom]);

  // Send a private message
  const sendPrivateMessage = useCallback((to, message) => {
    if (socketRef.current && message.trim()) {
      socketRef.current.emit('private_message', { 
        to, 
        message: message.trim() 
      });
    }
  }, []);

  // Set typing status
  const setTyping = useCallback((isTyping) => {
    if (socketRef.current) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      socketRef.current.emit('typing', isTyping);

      // Auto stop typing after 3 seconds
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          socketRef.current.emit('typing', false);
        }, 3000);
      }
    }
  }, []);

  // Join a room
  const joinRoom = useCallback((room) => {
    if (socketRef.current) {
      socketRef.current.emit('join_room', room);
      setCurrentRoom(room);
      setUnreadCount(0);
    }
  }, []);

  // Leave a room
  const leaveRoom = useCallback((room) => {
    if (socketRef.current) {
      socketRef.current.emit('leave_room', room);
    }
  }, []);

  // React to a message
  const reactToMessage = useCallback((messageId, reaction) => {
    if (socketRef.current) {
      socketRef.current.emit('message_reaction', { 
        messageId, 
        reaction 
      });
    }
  }, []);

  // Mark messages as read
  const markAsRead = useCallback((messageIds) => {
    if (socketRef.current) {
      socketRef.current.emit('mark_read', messageIds);
      setUnreadCount(0);
    }
  }, []);

  // Socket event listeners
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // Connection events
    const onConnect = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onConnectError = (error) => {
      setError('Connection failed. Please try again.');
      setIsConnecting(false);
      console.error('Socket connection error:', error);
    };

    // Message events
    const onReceiveMessage = (message) => {
      setLastMessage(message);
      setMessages(prev => [...prev, message]);
      
      // Increase unread count if not in current room or tab is not active
      if (message.room !== currentRoom || document.hidden) {
        setUnreadCount(prev => prev + 1);
        
        // Play notification sound
        playNotificationSound();
        
        // Show browser notification
        if (document.hidden && Notification.permission === 'granted') {
          showBrowserNotification(message);
        }
      }
    };

    const onPrivateMessage = (message) => {
      setLastMessage(message);
      setMessages(prev => [...prev, message]);
      setUnreadCount(prev => prev + 1);
      playNotificationSound();
    };

    // User events
    const onUserList = (userList) => {
      setUsers(userList);
    };

    const onUserJoined = (data) => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `${data.username} joined the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    const onUserLeft = (data) => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `${data.username} left the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    // Typing events
    const onTypingUsers = (users) => {
      setTypingUsers(users);
    };

    // Room events
    const onRoomList = (roomList) => {
      setRooms(roomList);
    };

    const onRoomJoined = (room) => {
      setCurrentRoom(room);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `You joined room: ${room}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    // Message reaction event
    const onMessageReaction = (data) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === data.messageId
            ? { ...msg, reactions: { ...msg.reactions, [data.reaction]: (msg.reactions?.[data.reaction] || 0) + 1 } }
            : msg
        )
      );
    };

    // Register event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('receive_message', onReceiveMessage);
    socket.on('private_message', onPrivateMessage);
    socket.on('user_list', onUserList);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('typing_users', onTypingUsers);
    socket.on('room_list', onRoomList);
    socket.on('room_joined', onRoomJoined);
    socket.on('message_reaction', onMessageReaction);

    // Clean up event listeners
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('receive_message', onReceiveMessage);
      socket.off('private_message', onPrivateMessage);
      socket.off('user_list', onUserList);
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('typing_users', onTypingUsers);
      socket.off('room_list', onRoomList);
      socket.off('room_joined', onRoomJoined);
      socket.off('message_reaction', onMessageReaction);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [currentRoom]);

  // Helper functions for notifications
  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(() => {
      // Silent fail if audio can't play
    });
  };

  const showBrowserNotification = (message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`New message from ${message.sender}`, {
        body: message.message,
        icon: '/favicon.ico',
      });
    }
  };

  // Request notification permission
  const requestNotificationPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    lastMessage,
    messages,
    users,
    typingUsers,
    rooms,
    currentRoom,
    error,
    unreadCount,
    connect,
    disconnect,
    sendMessage,
    sendPrivateMessage,
    setTyping,
    joinRoom,
    leaveRoom,
    reactToMessage,
    markAsRead,
    requestNotificationPermission,
  };
};