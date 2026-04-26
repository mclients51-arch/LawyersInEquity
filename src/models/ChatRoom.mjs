// models/ChatRoom.mjs
import mongoose from 'mongoose';
const chatRoomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'active'], default: 'pending' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  suggestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('ChatRoom', chatRoomSchema);