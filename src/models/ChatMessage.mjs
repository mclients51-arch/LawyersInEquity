import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  room: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true },
  message: { type: String, required: true },
  parentMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage', default: null },
  isPinned: { type: Boolean, default: false },
  fileUrl: { type: String, default: null },
  fileType: { type: String, enum: ['audio', 'pdf', 'image'], default: null },
  fileName: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('ChatMessage', chatMessageSchema);