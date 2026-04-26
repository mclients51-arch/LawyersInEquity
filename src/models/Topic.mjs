import mongoose from 'mongoose';
const topicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  level: { type: Number, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isApproved: { type: Boolean, default: false },
  name: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('Topic', topicSchema);