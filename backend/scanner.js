const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const scan = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const User = require('./models/User');
    const Design = require('./models/Design');
    const users = await User.find({ role: 'engineer' });
    console.log('--- ENGINEER DATA SCAN ---');
    users.forEach(u => {
      console.log(`User ID: ${u._id} | Name: ${u.name} | Bio: "${u.bio}"`);
    });

    const designs = await Design.find().populate('engineer', 'name bio');
    console.log('\n--- DESIGN DATA SCAN ---');
    designs.forEach(d => {
      console.log(`Design: ${d.title}`);
      console.log(`- Engineer Field in DB: ${d.engineer?._id || d.engineer}`);
      console.log(`- Populated Bio: "${d.engineer?.bio}"`);
      console.log('---------------------------');
    });

    await mongoose.connection.close();
  } catch (err) {
    console.error('Scan Error:', err.message);
  }
};

scan();
