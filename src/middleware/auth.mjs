import jwt from 'jsonwebtoken';

export const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
};


// Add to your auth.js / auth.mjs
export const teacherOrAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Teacher or admin access required' });
  }
  // For teachers, also check approval status (optional but recommended)
  if (req.user.role === 'teacher') {
    // You may want to check isApproved here, but you already do that in the frontend.
    // To be safe, you can add a DB check:
    // const user = await User.findById(req.user.id);
    // if (!user.isApproved) return res.status(403).json({ message: 'Account not approved' });
  }
  next();
};