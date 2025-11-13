// src/components/MessageInput/MessageInput.jsx
import { useState } from 'react';
import './MessageInput.css';

const MessageInput = ({ onSendMessage, onSetTyping }) => {
  const [text, setText] = useState('');

  const handleChange = (e) => {
    setText(e.target.value);
    onSetTyping(true);
    // small debounce could be added in real app
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
    onSetTyping(false);
  };

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <input
        type="text"
        value={text}
        onChange={handleChange}
        placeholder="Type a message..."
      />
      <button type="submit">Send</button>
    </form>
  );
};

export default MessageInput;
