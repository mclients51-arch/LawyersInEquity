import mongoose from 'mongoose';
import User from './src/models/User.mjs';
import Article from './src/models/Article.mjs';
import 'dotenv/config';

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Get or create a dummy author (e.g., admin)
  let author = await User.findOne({ email: 'admin@lawplatform.com' });
  if (!author) {
    author = new User({
      name: 'Admin',
      email: 'admin@lawplatform.com',
      password: 'admin123',
      role: 'admin',
      isApproved: true
    });
    await author.save();
  }
  
  const sampleArticles = [
    { title: "Introduction to Legal Research", excerpt: "Learn basics of legal research.", level: 100, category: "article", imageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop" },
    { title: "Contract Law Fundamentals", excerpt: "Key elements of a valid contract.", level: 100, category: "article", imageUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=400&fit=crop" },
    { title: "Torts: Negligence", excerpt: "Duty, breach, causation, damages.", level: 200, category: "article", imageUrl: "https://images.unsplash.com/photo-1589391886645-9b01b6f7b4a1?w=800&h=400&fit=crop" },
    { title: "Criminal Procedure", excerpt: "Search and seizure rules.", level: 200, category: "article", imageUrl: "https://images.unsplash.com/photo-1505664194779-8be65e2f2f6b?w=800&h=400&fit=crop" },
    { title: "Evidence Law", excerpt: "Hearsay and exceptions.", level: 300, category: "article", imageUrl: "https://images.unsplash.com/photo-1505664194779-8be65e2f2f6b?w=800&h=400&fit=crop" },
    { title: "Evidence Law", excerpt: "Hearsays and exceptions.", level: 300, category: "article", imageUrl: "https://images.unsplash.com/photo-1505664194779-8be65e2f2f6b?w=800&h=400&fit=crop" },
    { title: "Corporate Law", excerpt: "Shareholder rights and duties.", level: 300, category: "article", imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=400&fit=crop" },
    { title: "Constitutional Law", excerpt: "Equal protection analysis.", level: 400, category: "article", imageUrl: "https://images.unsplash.com/photo-1505664194779-8be65e2f2f6b?w=800&h=400&fit=crop" },
    { title: "Legal Ethics", excerpt: "Professional responsibility.", level: 400, category: "article", imageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop" },
    { title: "Bar Exam Prep", excerpt: "Multistate strategies.", level: 500, category: "article", imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop" },
    { title: "Appellate Advocacy", excerpt: "Writing persuasive briefs.", level: 500, category: "article", imageUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=400&fit=crop" }
  ];
  
  for (const art of sampleArticles) {
    await Article.findOneAndUpdate(
      { title: art.title },
      { ...art, author: author._id, content: `<p>${art.excerpt} Full content here...</p>` },
      { upsert: true }
    );
  }
  console.log('Sample articles added/updated');
  process.exit();
};

seed();