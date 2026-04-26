import express from 'express';
import User from '../models/User.mjs';   // ✅ new
import { auth, adminOnly } from '../middleware/auth.mjs';
import Topic from '../models/Topic.mjs';

const router = express.Router();

// All routes require admin authentication
router.use(auth);
router.use(adminOnly);

// Get all pending teachers (isApproved = false)
router.get('/pending-teachers', async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher', isApproved: false }).select('-password');
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve a teacher
router.put('/approve-teacher/:id', async (req, res) => {
  try {
    const teacher = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).select('-password');
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    res.json(teacher);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reject/delete a teacher
router.delete('/teacher/:id', async (req, res) => {
  try {
    const teacher = await User.findByIdAndDelete(req.params.id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    res.json({ message: 'Teacher removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



// Get all pending level upgrade requests
router.get('/level-requests', auth, adminOnly, async (req, res) => {
  try {
    const requests = await User.find({ role: 'student', levelRequestStatus: 'pending' }).select('name email level requestedLevel');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve or reject level request
router.put('/level-request/:userId', auth, adminOnly, async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const user = await User.findById(req.params.userId);
    if (!user || user.role !== 'student') return res.status(404).json({ message: 'Student not found' });
    if (action === 'approve') {
      user.level = user.requestedLevel;
      user.levelRequestStatus = 'approved';
    } else if (action === 'reject') {
      user.levelRequestStatus = 'rejected';
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }
    await user.save();
    res.json({ message: `Level request ${action}d`, user: { level: user.level, requestStatus: user.levelRequestStatus } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Get all users (admin only)
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete any user
router.delete('/user/:id', auth, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Promote user (change role or set isPeerMentor)
router.put('/user/:id/promote', auth, adminOnly, async (req, res) => {
  try {
    const { role, isPeerMentor } = req.body;
    const updates = {};
    if (role) updates.role = role;
    if (isPeerMentor !== undefined) updates.isPeerMentor = isPeerMentor;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Restrict user (add isRestricted field to User model)
router.put('/user/:id/restrict', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.isRestricted = !user.isRestricted;
    await user.save();
    res.json({ isRestricted: user.isRestricted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all approved topics (for chat room listing)
router.get('/topics', auth, async (req, res) => {
  try {
    const topics = await Topic.find({ isApproved: true });
    res.json(topics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Request new topic (teachers only)
router.post('/topics/request', auth, async (req, res) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only teachers can request topics' });
  }
  try {
    const { name, level } = req.body;
    const topic = new Topic({ name, level, createdBy: req.user.id, isApproved: false });
    await topic.save();
    res.json(topic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get pending topics (admin only)
router.get('/topics/pending', auth, adminOnly, async (req, res) => {
  try {
    const topics = await Topic.find({ isApproved: false }).populate('createdBy', 'name');
    res.json(topics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve topic (admin only)
router.put('/topics/:id/approve', auth, adminOnly, async (req, res) => {
  try {
    const topic = await Topic.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    res.json(topic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin creates topic directly (approved)
router.post('/topics', auth, adminOnly, async (req, res) => {
  try {
    const { name, level } = req.body;
    const topic = new Topic({ name, level, createdBy: req.user.id, isApproved: true });
    await topic.save();
    res.json(topic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all topics (including pending) for admin dropdown
router.get('/topics/all', auth, adminOnly, async (req, res) => {
  try {
    const topics = await Topic.find().populate('createdBy', 'name');
    res.json(topics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



router.delete('/topics/:id', auth, adminOnly, async (req, res) => {
  try {
    const topic = await Topic.findByIdAndDelete(req.params.id);
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    // Delete all messages in that room (topic name)
    await ChatMessage.deleteMany({ room: topic.name });
    res.json({ message: 'Topic and associated messages deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete any chat message (admin only)
router.delete('/message/:messageId', auth, adminOnly, async (req, res) => {
  try {
    const message = await ChatMessage.findByIdAndDelete(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    // Get io instance from app
    const io = req.app.get('io');
    io.to(message.room).emit('message-deleted', { messageId: req.params.messageId });
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;