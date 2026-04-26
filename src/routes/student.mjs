import express from 'express';
import { auth } from '../middleware/auth.mjs';
import User from '../models/User.mjs';

const router = express.Router();

// Student requests level upgrade
router.post('/request-level', auth, async (req, res) => {
  try {
    const { requestedLevel } = req.body;
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'student') return res.status(403).json({ message: 'Only students can request level upgrades' });
    if (requestedLevel <= user.level) return res.status(400).json({ message: 'You cannot request a level lower or equal to your current level' });
    user.requestedLevel = requestedLevel;
    user.levelRequestStatus = 'pending';
    await user.save();
    res.json({ message: 'Level upgrade request sent to admin' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get student's current level and request status
router.get('/level-status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('level requestedLevel levelRequestStatus');
    res.json({ currentLevel: user.level, requestedLevel: user.requestedLevel, requestStatus: user.levelRequestStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;