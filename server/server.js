// server.js - Enhanced version
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Enhanced data storage
const users = new Map(); // socket.id -> user data
const messages = new Map(); // room -> message array
const typingUsers = new Map(); // room -> Set of typing users
const rooms = new Set(['general', 'random', 'help']);
const userRooms = new Map(); // socket.id -> Set of rooms

// Initialize rooms
rooms.forEach(room => {
  messages.set(room, []);
  typingUsers.set(room, new Set());
});

// Helper functions
const getUser = (socketId) => users.get(socketId);
const getRoomMessages = (room) => messages.get(room) || [];
const addMessage = (room, message) => {
  const roomMessages = messages.get(room);
  if (roomMessages) {
    roomMessages.push(message);
    // Limit messages per room
    if (roomMessages.length > 200) {
      roomMessages.shift();
    }
  }
};

const getTypingUsers = (room) => {
  const typing = typingUsers.get(room);
  return typing ? Array.from(typing).map(socketId => users.get(socketId)?.username).filter(Boolean) : [];
};

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user joining
  socket.on('user_join', ({ username, room }) => {
    if (!rooms.has(room)) {
      socket.emit('error', 'Room does not exist');
      return;
    }

    users.set(socket.id, { 
      id: socket.id, 
      username, 
      room,
      joinedAt: new Date().toISOString()
    });

    // Join the room
    socket.join(room);
    userRooms.set(socket.id, new Set([room]));

    // Notify room
    socket.to(room).emit('user_joined', { username, id: socket.id });
    
    // Send room data to user
    const roomUsers = Array.from(users.values()).filter(user => user.room === room);
    const roomMessages = getRoomMessages(room);
    
    socket.emit('room_joined', room);
    socket.emit('user_list', roomUsers);
    socket.emit('message_history', roomMessages);
    socket.emit('room_list', Array.from(rooms));

    console.log(`${username} joined room: ${room}`);
  });

  // Handle chat messages
  socket.on('send_message', ({ message, room }) => {
    const user = getUser(socket.id);
    if (!user || !rooms.has(room)) return;

    const messageData = {
      id: Date.now() + Math.random(),
      message: message.trim(),
      sender: user.username,
      senderId: socket.id,
      room,
      timestamp: new Date().toISOString(),
      reactions: {},
      read: false
    };

    addMessage(room, messageData);
    io.to(room).emit('receive_message', messageData);

    // Stop typing indicator
    typingUsers.get(room)?.delete(socket.id);
    io.to(room).emit('typing_users', getTypingUsers(room));
  });

  // Handle typing indicator
  socket.on('typing', (isTyping) => {
    const user = getUser(socket.id);
    if (!user) return;

    const room = user.room;
    const typingSet = typingUsers.get(room);

    if (isTyping) {
      typingSet.add(socket.id);
    } else {
      typingSet.delete(socket.id);
    }

    io.to(room).emit('typing_users', getTypingUsers(room));
  });

  // Handle private messages
  socket.on('private_message', ({ to, message }) => {
    const fromUser = getUser(socket.id);
    const toUser = Array.from(users.values()).find(user => user.id === to);

    if (!fromUser || !toUser) return;

    const messageData = {
      id: Date.now() + Math.random(),
      message: message.trim(),
      sender: fromUser.username,
      senderId: socket.id,
      to: toUser.id,
      toUsername: toUser.username,
      timestamp: new Date().toISOString(),
      isPrivate: true
    };

    // Send to both users
    socket.emit('private_message', messageData);
    socket.to(to).emit('private_message', messageData);
  });

  // Handle room operations
  socket.on('join_room', (room) => {
    const user = getUser(socket.id);
    if (!user || !rooms.has(room)) return;

    // Leave current room
    socket.leave(user.room);
    typingUsers.get(user.room)?.delete(socket.id);

    // Join new room
    socket.join(room);
    user.room = room;
    userRooms.get(socket.id).add(room);

    // Send room data
    const roomUsers = Array.from(users.values()).filter(u => u.room === room);
    const roomMessages = getRoomMessages(room);

    socket.emit('room_joined', room);
    socket.emit('user_list', roomUsers);
    socket.emit('message_history', roomMessages);
    socket.to(room).emit('user_joined', { username: user.username, id: socket.id });

    console.log(`${user.username} joined room: ${room}`);
  });

  socket.on('leave_room', (room) => {
    const user = getUser(socket.id);
    if (!user) return;

    socket.leave(room);
    userRooms.get(socket.id)?.delete(room);
    typingUsers.get(room)?.delete(socket.id);

    socket.to(room).emit('user_left', { username: user.username, id: socket.id });
  });

  // Handle message reactions
  socket.on('message_reaction', ({ messageId, reaction }) => {
    const user = getUser(socket.id);
    if (!user) return;

    // Find message in all rooms
    for (const [room, roomMessages] of messages) {
      const message = roomMessages.find(msg => msg.id === messageId);
      if (message) {
        if (!message.reactions) message.reactions = {};
        message.reactions[reaction] = (message.reactions[reaction] || 0) + 1;
        
        io.to(room).emit('message_reaction', { messageId, reaction });
        break;
      }
    }
  });

  // Handle read receipts
  socket.on('mark_read', (messageIds) => {
    const user = getUser(socket.id);
    if (!user) return;

    for (const [room, roomMessages] of messages) {
      roomMessages.forEach(msg => {
        if (messageIds.includes(msg.id)) {
          msg.read = true;
        }
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    const user = getUser(socket.id);
    
    if (user) {
      // Notify all rooms user was in
      const userRoomSet = userRooms.get(socket.id);
      if (userRoomSet) {
        userRoomSet.forEach(room => {
          socket.to(room).emit('user_left', { username: user.username, id: socket.id });
          typingUsers.get(room)?.delete(socket.id);
          io.to(room).emit('typing_users', getTypingUsers(room));
        });
      }

      console.log(`${user.username} disconnected: ${reason}`);
    }

    // Clean up
    users.delete(socket.id);
    userRooms.delete(socket.id);
    
    // Update user lists in all rooms
    rooms.forEach(room => {
      const roomUsers = Array.from(users.values()).filter(u => u.room === room);
      io.to(room).emit('user_list', roomUsers);
    });
  });

  // Handle create room
  socket.on('create_room', (roomName) => {
    if (rooms.has(roomName)) {
      socket.emit('error', 'Room already exists');
      return;
    }

    rooms.add(roomName);
    messages.set(roomName, []);
    typingUsers.set(roomName, new Set());
    
    io.emit('room_list', Array.from(rooms));
    socket.emit('room_created', roomName);
  });
});

// Enhanced API routes
app.get('/api/messages/:room', (req, res) => {
  const { room } = req.params;
  const roomMessages = messages.get(room) || [];
  
  // Pagination support
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const result = {
    messages: roomMessages.slice(startIndex, endIndex),
    total: roomMessages.length,
    page,
    totalPages: Math.ceil(roomMessages.length / limit)
  };
  
  res.json(result);
});

app.get('/api/users/:room', (req, res) => {
  const { room } = req.params;
  const roomUsers = Array.from(users.values()).filter(user => user.room === room);
  res.json(roomUsers);
});

app.get('/api/rooms', (req, res) => {
  res.json(Array.from(rooms));
});

// Search messages
app.get('/api/search', (req, res) => {
  const { q, room } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query parameter required' });
  }

  const searchResults = [];
  const searchRooms = room ? [room] : Array.from(rooms);

  searchRooms.forEach(roomName => {
    const roomMessages = messages.get(roomName) || [];
    const matches = roomMessages.filter(msg => 
      msg.message.toLowerCase().includes(q.toLowerCase())
    );
    matches.forEach(match => {
      searchResults.push({
        ...match,
        room: roomName
      });
    });
  });

  res.json(searchResults);
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Available rooms: ${Array.from(rooms).join(', ')}`);
});

module.exports = { app, server, io };