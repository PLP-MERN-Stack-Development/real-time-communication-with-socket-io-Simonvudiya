// src/components/Login/Login.jsx
import { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('general');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username.trim() && room.trim()) {
      setIsLoading(true);
      await onLogin(username.trim(), room.trim());
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Join Chat</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              minLength={2}
              maxLength={20}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="room">Room</label>
            <select
              id="room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            >
              <option value="general">General</option>
              <option value="random">Random</option>
              <option value="help">Help</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={!username.trim() || isLoading}
            className="login-button"
          >
            {isLoading ? 'Connecting...' : 'Join Chat'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
