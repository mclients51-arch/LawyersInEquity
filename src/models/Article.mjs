import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  excerpt: { type: String, required: true },
  category: { type: String, enum: ['article', 'past_question', 'news'], default: 'article' },
  level: { type: Number, required: true, min: 100, max: 500 },
  imageUrl: { type: String, default: '' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'published'], default: 'published' },
  views: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Article', articleSchema);