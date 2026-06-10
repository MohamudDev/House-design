const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Design = require('./models/Design');

dotenv.config();

const seedDesigns = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Find or create an engineer
    let engineer = await User.findOne({ role: 'engineer' });
    if (!engineer) {
      engineer = new User({
        name: 'John Engineer',
        email: 'john@example.com',
        password: 'password123',
        role: 'engineer',
        isApproved: true,
        specialization: 'Modern Architecture',
        experience: '5 years'
      });
      await engineer.save();
      console.log('Created test engineer');
    }

    // Check if designs exist
    const count = await Design.countDocuments();
    if (count > 0) {
      console.log(`There are already ${count} designs in the database.`);
      process.exit(0);
    }

    const designs = [
      {
        title: 'Modern Minimalist Villa',
        houseType: 'Villa',
        rooms: 4,
        budgetEstimate: 250000,
        description: 'A beautiful modern minimalist villa with lots of natural light and open spaces.',
        images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
        engineer: engineer._id,
        status: 'approved'
      },
      {
        title: 'Cozy Family Home',
        houseType: 'Single Family',
        rooms: 3,
        budgetEstimate: 150000,
        description: 'Perfect for a growing family, featuring a large backyard and spacious living areas.',
        images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
        engineer: engineer._id,
        status: 'approved'
      },
      {
        title: 'Luxury Lakefront Retreat',
        houseType: 'Mansion',
        rooms: 6,
        budgetEstimate: 850000,
        description: 'Expansive lakefront property with private dock, infinity pool, and smart home features.',
        images: ['https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
        engineer: engineer._id,
        status: 'pending'
      }
    ];

    await Design.insertMany(designs);
    console.log('Successfully seeded 3 designs!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding designs:', error);
    process.exit(1);
  }
};

seedDesigns();
