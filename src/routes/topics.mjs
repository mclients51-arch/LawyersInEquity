import express from 'express';
import { auth } from '../middleware/auth.mjs';
import Topic from '../models/Topic.mjs';

const router = express.Router();

// Get all approved topics (any authenticated user)
router.get('/', auth, async (req, res) => {
  try {
    const topics = await Topic.find({ isApproved: true });
    res.json(topics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;