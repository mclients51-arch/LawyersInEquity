import express from 'express';
import { auth } from '../middleware/auth.mjs';  // named import, not default
import UserRead from '../models/UserRead.mjs';
import Article from '../models/Article.mjs';
import User from '../models/User.mjs';

const router = express.Router();

// Mark article as read
router.post('/read/:articleId', auth, async (req, res) => {
  try {
    const { articleId } = req.params;
    const userId = req.user.id;
    const existing = await UserRead.findOne({ user: userId, article: articleId });
    if (!existing) {
      await UserRead.create({ user: userId, article: articleId });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user stats (articles read, assignments, streak)
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const reads = await UserRead.find({ user: userId }).populate('article');
    const articlesRead = reads.length;
    // Placeholder for assignments – replace with real data later
    const assignmentsSubmitted = 3;
    const pendingAssignments = 2;
    // Streak based on consecutive days with reads
    const dates = reads.map(r => new Date(r.createdAt).toDateString());
    const uniqueDates = [...new Set(dates)].sort();
    let streak = 0;
    let current = new Date();
    for (let i = uniqueDates.length - 1; i >= 0; i--) {
      if (uniqueDates[i] === current.toDateString()) streak++;
      else if (new Date(uniqueDates[i]).getTime() === current.getTime() - 86400000) streak++;
      else break;
      current = new Date(current.setDate(current.getDate() - 1));
    }
    res.json({ articlesRead, assignmentsSubmitted, pendingAssignments, streak });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get recent activity (last 5 read articles)
router.get('/recent-activity', auth, async (req, res) => {
  try {
    const reads = await UserRead.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('article');
    const activity = reads.map(read => ({
      type: 'read',
      title: read.article.title,
      createdAt: read.createdAt,
    }));
    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;