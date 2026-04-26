import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// const userSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
//   isApproved: { type: Boolean, default: function() { return this.role === 'admin' ? true : false; } }
// }, { timestamps: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  isApproved: { type: Boolean, default: true }, // for teachers only
  level: { type: Number, default: 100, min: 100, max: 500 }, // student's current level
  requestedLevel: { type: Number, min: 100, max: 500 },
  levelRequestStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: null },
  isRestricted: { type: Boolean, default: false },
  isPeerMentor: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  try {
    this.password = await bcrypt.hash(this.password, 10);
  } catch (err) {
    throw err;
  }
});

userSchema.methods.comparePassword = async function(candidate) {
  return await bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);