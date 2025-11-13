// src/components/Notifications/Notifications.jsx
import { useEffect, useRef } from 'react';
import './Notifications.css';

const Notifications = ({ lastMessage, currentRoom, unreadCount }) => {
  const audioRef = useRef(null);
  const prevUnreadCountRef = useRef(0);

  useEffect(() => {
    // Play sound for new messages
    if (lastMessage && 
        lastMessage.room !== currentRoom && 
        unreadCount > prevUnreadCountRef.current) {
      playNotificationSound();
      showBrowserNotification(lastMessage);
    }

    prevUnreadCountRef.current = unreadCount;
  }, [lastMessage, currentRoom, unreadCount]);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Silent fail if audio can't play
      });
    }
  };

  const showBrowserNotification = (message) => {
    if ('Notification' in window && 
        Notification.permission === 'granted' &&
        document.hidden) {
      
      const notification = new Notification(`New message in ${message.room}`, {
        body: `${message.sender}: ${message.message}`,
        icon: '/favicon.ico',
        tag: 'chat-message'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => notification.close(), 5000);
    }
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted');
        }
      });
    }
  };

  // Request permission on component mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <>
      <audio 
        ref={audioRef} 
        src="/notification.mp3" 
        preload="auto" 
      />
      
      {/* In-app notifications could be added here */}
    </>
  );
};

export default Notifications;