import mongoose from 'mongoose';

const userReadSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
  createdAt: { type: Date, default: Date.now }
});
userReadSchema.index({ user: 1, article: 1 }, { unique: true });

export default mongoose.model('UserRead', userReadSchema);