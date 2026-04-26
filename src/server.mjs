import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

import authRoutes from './routes/auth.mjs';
import adminRoutes from './routes/admin.mjs';
import articleRoutes from './routes/articles.mjs';
import uploadRoutes from './routes/upload.mjs';
import contentRoutes from './routes/content.mjs';
import userRoutes from './routes/user.mjs';
import studentRoutes from './routes/student.mjs';
import topicRoutes from './routes/topics.mjs';
import Topic from './models/Topic.mjs';

import path from 'path';
import { fileURLToPath } from 'url';
import ChatMessage from './models/ChatMessage.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());


// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/content', contentRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/user', userRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/topics', topicRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  res.status(500).json({ message: err.message });
});

// ──────────────────────────────────────────────────────────
// Socket.IO setup
// ──────────────────────────────────────────────────────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error: no token'));
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Invalid token'));
    socket.user = decoded; // { id, role, name, level }
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.id} (${socket.user.role})`);

  // Join a chat room with permission checks
  socket.on('join-room', async ({ room }) => {
  if (socket.user.role === 'student') {
    let allowed = false;
    if (room.startsWith('level_')) {
      const requestedLevel = parseInt(room.split('_')[1]);
      allowed = requestedLevel <= socket.user.level;
    } else {
      // For custom topics, fetch the topic's level from DB
      const topic = await Topic.findOne({ name: room });
      if (topic && topic.level <= socket.user.level) {
        allowed = true;
      }
    }
    if (!allowed) {
      socket.emit('error', 'You cannot join this room.');
      return;
    }
  }
    // Teacher/admin: any room allowed
    socket.join(room);
    console.log(`${socket.user.id} joined room: ${room}`);

    // Send last 50 messages (including pinned, with populated sender info)
    try {
      const messages = await ChatMessage.find({ room })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('sender', 'name role isPeerMentor');
      socket.emit('chat-history', messages.reverse());
    } catch (err) {
      console.error('Error fetching chat history:', err);
      socket.emit('error', 'Could not load chat history');
    }
  });


  

  // Send a new message (supports threaded replies)
 socket.on('send-message', async ({ room, message, parentMessageId = null, fileUrl = null, fileType = null, fileName = null }) => {
  if (!message && !fileUrl) return;
  try {
    const newMsg = new ChatMessage({
      room,
      sender: socket.user.id,
      senderName: socket.user.name || 'Unknown',
      senderRole: socket.user.role,
      message: message || '',
      parentMessageId,
      fileUrl,
      fileType,
      fileName
    });
    await newMsg.save();
    const populated = await newMsg.populate('sender', 'name role isPeerMentor');
    io.to(room).emit('new-message', populated);
  } catch (err) {
    console.error('Error saving message:', err);
    socket.emit('error', 'Message could not be sent');
  }
});

  socket.on('delete-message', async ({ messageId, room }) => {
  if (socket.user.role !== 'admin') {
    socket.emit('error', 'Only admins can delete messages');
    return;
  }
  try {
    const message = await ChatMessage.findByIdAndDelete(messageId);
    if (!message) return;
    io.to(room).emit('message-deleted', { messageId });
  } catch (err) {
    console.error('Delete message error:', err);
  }
});

  // Toggle pin status (teachers/admins only)
  socket.on('toggle-pin', async ({ messageId, room }) => {
    if (socket.user.role !== 'admin' && socket.user.role !== 'teacher') {
      socket.emit('error', 'Only teachers can pin messages');
      return;
    }
    try {
      const msg = await ChatMessage.findById(messageId);
      if (!msg || msg.room !== room) return;
      msg.isPinned = !msg.isPinned;
      await msg.save();
      io.to(room).emit('pin-updated', { messageId, isPinned: msg.isPinned });
    } catch (err) {
      console.error('Error toggling pin:', err);
      socket.emit('error', 'Could not pin message');
    }
  });

  

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));