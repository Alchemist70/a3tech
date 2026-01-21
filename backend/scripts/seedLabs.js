/**
 * Script to seed Labs data into MongoDB
 * Run with: node backend/scripts/seedLabs.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Lab = require('../models/Lab');
const sampleLabs = require('./sampleLabs');

dotenv.config();

const seedLabs = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alchemist';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Clear existing labs
    await Lab.deleteMany({});
    console.log('Cleared existing labs');

    // Insert sample labs
    const insertedLabs = await Lab.insertMany(sampleLabs);
    console.log(`Inserted ${insertedLabs.length} labs successfully`);

    // Verify insertion
    const count = await Lab.countDocuments();
    console.log(`Total labs in database: ${count}`);

    // Display summary
    const bySubject = {};
    insertedLabs.forEach((lab) => {
      bySubject[lab.subject] = (bySubject[lab.subject] || 0) + 1;
    });

    console.log('\nLabs by subject:');
    Object.entries(bySubject).forEach(([subject, count]) => {
      console.log(`  ${subject}: ${count}`);
    });

    await mongoose.disconnect();
    console.log('\nSeeding complete! Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding labs:', error);
    process.exit(1);
  }
};

// Run if this is the main module
if (require.main === module) {
  seedLabs();
}

module.exports = seedLabs;
