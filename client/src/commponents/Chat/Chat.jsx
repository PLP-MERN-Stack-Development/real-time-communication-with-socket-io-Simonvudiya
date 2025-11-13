// src/components/Chat/Chat.jsx
import { useState, useRef, useEffect } from 'react';
import MessageList from '../MessageList/MessageList';
import MessageInput from '../MessageInput/MessageInput';
import UserList from '../UserList/UserList';
import RoomList from '../RoomList/RoomList';
import './Chat.css';

const Chat = ({ 
  messages, 
  users, 
  typingUsers, 
  rooms, 
  currentRoom,
  unreadCount,
  onSendMessage, 
  onSetTyping, 
  onJoinRoom,
  onReactToMessage,
  onMarkAsRead,
  onDisconnect 
}) => {
  const [showUsers, setShowUsers] = useState(false);
  const [showRooms, setShowRooms] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Mark messages as read when component mounts or room changes
    const unreadMessageIds = messages
      .filter(msg => !msg.read && !msg.system)
      .map(msg => msg.id);
    
    if (unreadMessageIds.length > 0) {
      onMarkAsRead(unreadMessageIds);
    }
  }, [messages, currentRoom, onMarkAsRead]);

  return (
    <div className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <div className="header-left">
          <h2>#{currentRoom}</h2>
          <span className="online-count">{users.length} online</span>
        </div>
        
        <div className="header-right">
          <button 
            onClick={() => setShowRooms(!showRooms)}
            className={`icon-button ${showRooms ? 'active' : ''}`}
            title="Rooms"
          >
            🏠
          </button>
          <button 
            onClick={() => setShowUsers(!showUsers)}
            className={`icon-button ${showUsers ? 'active' : ''}`}
            title="Users"
          >
            👥 {users.length}
          </button>
          <button onClick={onDisconnect} className="disconnect-button" title="Disconnect">
            ⏏️
          </button>
        </div>
      </header>

      <div className="chat-content">
        {/* Sidebars */}
        <div className={`sidebar users-sidebar ${showUsers ? 'open' : ''}`}>
          <UserList users={users} typingUsers={typingUsers} />
        </div>

        <div className={`sidebar rooms-sidebar ${showRooms ? 'open' : ''}`}>
          <RoomList 
            rooms={rooms} 
            currentRoom={currentRoom} 
            onJoinRoom={onJoinRoom} 
          />
        </div>

        {/* Main Chat Area */}
        <div className="main-chat">
          <MessageList 
            messages={messages}
            typingUsers={typingUsers}
            onReactToMessage={onReactToMessage}
          />
          
          <MessageInput 
            onSendMessage={onSendMessage}
            onSetTyping={onSetTyping}
          />
        </div>
      </div>

      {/* Unread messages indicator */}
      {unreadCount > 0 && (
        <div className="unread-indicator">
          {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default Chat;