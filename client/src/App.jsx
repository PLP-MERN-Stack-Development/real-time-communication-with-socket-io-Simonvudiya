// src/App.jsx
import { useState, useEffect } from 'react';
import Login from './components/Login/Login';
import Chat from './components/Chat/Chat';
import Notifications from './components/Notifications/Notifications';
import { useSocket } from './hooks/useSocket';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const {
    isConnected,
    isConnecting,
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
    requestNotificationPermission
  } = useSocket();

  const handleLogin = async (username, room) => {
    await connect(username, room);
    setUser({ username, room });
    requestNotificationPermission();
  };

  const handleDisconnect = () => {
    disconnect();
    setUser(null);
  };

  if (!user) {
    return (
      <div className="app">
        <Login onLogin={handleLogin} />
        {error && <div className="error-banner">{error}</div>}
      </div>
    );
  }

  return (
    <div className="app">
      <Notifications 
        lastMessage={messages[messages.length - 1]}
        currentRoom={currentRoom}
        unreadCount={unreadCount}
      />
      
      <Chat
        messages={messages}
        users={users}
        typingUsers={typingUsers}
        rooms={rooms}
        currentRoom={currentRoom}
        unreadCount={unreadCount}
        onSendMessage={sendMessage}
        onSetTyping={setTyping}
        onJoinRoom={joinRoom}
        onReactToMessage={reactToMessage}
        onMarkAsRead={markAsRead}
        onDisconnect={handleDisconnect}
      />

      {/* Connection status indicator */}
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        {isConnecting && ' (Connecting...)'}
      </div>

      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}

export default App;