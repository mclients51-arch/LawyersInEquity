import express from 'express';
import Article from '../models/Article.mjs';

const router = express.Router();

// GET /api/articles?level=xxx
router.get('/', async (req, res) => {
  try {
    const { level, category } = req.query;
    let filter = {};
    if (level) filter.level = parseInt(level);
    if (category) filter.category = category;
    const articles = await Article.find(filter)
      .populate('author', 'name')
      .sort({ createdAt: -1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/articles/:id
// Get single article
router.get('/:id', async (req, res) => {
  try {
    // const article = await Article.findById(req.params.id).populate('author', 'name');
    const article = await Article.findById(req.params.id).populate('author', '_id name');
    if (!article) return res.status(404).json({ message: 'Article not found' });
    // Only show published articles to public, but teachers can see their own drafts? Keep simple.
    if (article.status !== 'published') {
      return res.status(404).json({ message: 'Article not available' });
    }
    article.views += 1;
    await article.save();
    res.json(article);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;