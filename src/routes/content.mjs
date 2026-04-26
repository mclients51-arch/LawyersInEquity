import express from 'express';
import Article from '../models/Article.mjs';
import User from '../models/User.mjs';          // ✅ adjust to User.mjs or Users.mjs
import { auth, teacherOrAdmin } from '../middleware/auth.mjs';

const router = express.Router();

// All routes require authentication and teacher/admin role
router.use(auth);
router.use(teacherOrAdmin);

// Get teacher's own articles
router.get('/my-articles', async (req, res) => {
  try {
    const articles = await Article.find({ author: req.user.id })
      .populate('author', 'name email')
      .sort({ createdAt: -1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new article
router.post('/articles', async (req, res) => {
  try {
    const { title, content, excerpt, category, level, imageUrl, status } = req.body;
    if (!title || !content || !excerpt) {
      return res.status(400).json({ message: 'Title, content, and excerpt are required' });
    }
    const article = new Article({
      title,
      content,
      excerpt,
      category: category || 'article',
      level: level || 100,
      imageUrl: imageUrl || '',
      status: status || 'published',
      author: req.user.id,
    });
    await article.save();
    res.status(201).json(article);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update article (only if author matches)
router.put('/articles/:id', async (req, res) => {
  try {
    const article = await Article.findOne({ _id: req.params.id, author: req.user.id });
    if (!article) {
      return res.status(404).json({ message: 'Article not found or unauthorized' });
    }
    const { title, content, excerpt, category, level, imageUrl, status } = req.body;
    if (title !== undefined) article.title = title;
    if (content !== undefined) article.content = content;
    if (excerpt !== undefined) article.excerpt = excerpt;
    if (category !== undefined) article.category = category;
    if (level !== undefined) article.level = level;
    if (imageUrl !== undefined) article.imageUrl = imageUrl;
    if (status !== undefined) article.status = status;
    await article.save();
    res.json(article);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete article (only if author matches)
router.delete('/articles/:id', async (req, res) => {
  try {
    const article = await Article.findOneAndDelete({ _id: req.params.id, author: req.user.id });
    if (!article) {
      return res.status(404).json({ message: 'Article not found or unauthorized' });
    }
    res.json({ message: 'Article deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;