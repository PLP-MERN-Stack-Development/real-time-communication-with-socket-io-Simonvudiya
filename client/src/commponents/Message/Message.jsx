// src/components/Message/Message.jsx
import { useState } from 'react';
import './Message.css';

const Message = ({ message, onReact }) => {
  const [showReactions, setShowReactions] = useState(false);
  const isSystem = message.system;

  const handleReact = (reaction) => {
    onReact(message.id, reaction);
    setShowReactions(false);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isSystem) {
    return (
      <div className="message system-message">
        <span className="system-text">{message.message}</span>
      </div>
    );
  }

  return (
    <div className="message">
      <div className="message-header">
        <span className="sender">{message.sender}</span>
        <span className="timestamp">{formatTime(message.timestamp)}</span>
      </div>
      
      <div className="message-content">
        <p>{message.message}</p>
        
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="message-reactions">
            {Object.entries(message.reactions).map(([reaction, count]) => (
              <span key={reaction} className="reaction">
                {reaction} {count}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="message-actions">
        <button 
          onClick={() => setShowReactions(!showReactions)}
          className="react-button"
        >
          🙂
        </button>
        
        {showReactions && (
          <div className="reaction-picker">
            {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(reaction => (
              <button
                key={reaction}
                onClick={() => handleReact(reaction)}
                className="reaction-option"
              >
                {reaction}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;