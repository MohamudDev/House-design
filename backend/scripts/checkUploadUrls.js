require('dotenv').config();
const mongoose = require('mongoose');
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const relative = await db.collection('designs').countDocuments({ images: { $regex: '^/uploads/' } });
  const cloud = await db.collection('designs').countDocuments({ 'images.0': { $regex: '^https://res.cloudinary.com' } });
  console.log(JSON.stringify({ relativeImageDesigns: relative, cloudinaryImageDesigns: cloud }));
  await mongoose.disconnect();
})();
