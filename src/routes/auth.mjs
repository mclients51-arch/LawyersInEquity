import express from 'express';
import User from '../models/User.mjs';   // ✅ new
import jwt from 'jsonwebtoken';
import { auth, adminOnly } from '../middleware/auth.mjs';


const router = express.Router();

// Register (supports student & teacher registration)
router.post('/register', async (req, res) => {
  console.log('📥 Register request body:', req.body);
  try {
    const { name, email, password, role, level } = req.body;
    
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });
    
    let user;
    if (role === 'teacher') {
      user = new User({ name, email, password, role: 'teacher', isApproved: false });
    } else {
      // student (default)
      user = new User({ name, email, password, role: 'student', isApproved: true, level: level || 100 });
    }
    
    await user.save();
    console.log(`✅ ${user.role} saved:`, user._id, user.isApproved ? '(approved)' : '(pending approval)');
    
   const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, level: user.level }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ 
      token, 
      user: { 
        id: user._id, 
        name, 
        email, 
        role: user.role,
        isApproved: user.isApproved,
        level: user.level || null
      } 
    });
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Login (check teacher approval)
router.post('/login', async (req, res) => {
  console.log('📥 Login request:', req.body);
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    
    // If teacher, check approval
    if (user.role === 'teacher' && !user.isApproved) {
      return res.status(403).json({ message: 'Your account is pending admin approval. Please try again later.' });
    }
    
     const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, level: user.level }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email, 
        role: user.role,
        isApproved: user.isApproved 
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get current user (for frontend to check approval status)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;