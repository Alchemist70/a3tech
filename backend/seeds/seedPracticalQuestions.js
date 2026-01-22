/**
 * Seed Script for Titration Practical Questions
 * Populates MongoDB with WAEC-style titration questions
 * 
 * Usage: node backend/seeds/seedPracticalQuestions.js
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
} catch (e) {
  console.warn('Warning: Could not load .env file, using environment variables');
}

// Import the PracticalQuestion model
const PracticalQuestion = require('../models/PracticalQuestion');

// Import question data
const titrationQuestions = require('./titrationQuestions');

/**
 * Connect to MongoDB
 */
async function connectToDatabase() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alchemist';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

/**
 * Seed titration questions to database
 */
async function seedTitrationQuestions() {
  try {
    console.log('\n📚 Starting Titration Questions Seeding...\n');

    // Check if questions already exist
    const existingCount = await PracticalQuestion.countDocuments({
      practical_type: 'titration'
    });

    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing titration questions.`);
      console.log('🔄 Clearing existing titration questions...\n');
      
      const deleteResult = await PracticalQuestion.deleteMany({
        practical_type: 'titration'
      });
      console.log(`✅ Deleted ${deleteResult.deletedCount} existing questions\n`);
    }

    // Insert all questions
    const insertedQuestions = await PracticalQuestion.insertMany(titrationQuestions, {
      ordered: false // Continue even if some fail
    });

    console.log(`✅ Successfully seeded ${insertedQuestions.length} titration questions\n`);

    // Display summary statistics
    displaySummary();

    return insertedQuestions;

  } catch (error) {
    console.error('❌ Error seeding questions:', error.message);
    if (error.writeErrors) {
      error.writeErrors.forEach((err, idx) => {
        console.error(`  Error ${idx + 1}:`, err.err.message);
      });
    }
    throw error;
  }
}

/**
 * Display seeding statistics
 */
async function displaySummary() {
  try {
    console.log('📊 Seeding Summary:');
    console.log('─'.repeat(50));

    // Total count
    const totalCount = await PracticalQuestion.countDocuments({
      practical_type: 'titration'
    });
    console.log(`Total Titration Questions: ${totalCount}`);

    // By difficulty
    const byDifficulty = await PracticalQuestion.aggregate([
      { $match: { practical_type: 'titration' } },
      { $group: { _id: '$difficulty_level', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    console.log('\nBy Difficulty Level:');
    byDifficulty.forEach(item => {
      console.log(`  • ${item._id.toUpperCase()}: ${item.count}`);
    });

    // By mode
    const byMode = await PracticalQuestion.aggregate([
      { $match: { practical_type: 'titration' } },
      { $group: { _id: '$mode', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    console.log('\nBy Mode:');
    byMode.forEach(item => {
      console.log(`  • ${item._id}: ${item.count}`);
    });

    // By titration type
    const byType = await PracticalQuestion.aggregate([
      { $match: { practical_type: 'titration' } },
      { $group: { _id: '$titration_type', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    console.log('\nBy Titration Type:');
    byType.forEach(item => {
      console.log(`  • ${item._id}: ${item.count}`);
    });

    // Sample questions
    console.log('\n📝 Sample Questions Seeded:');
    const samples = await PracticalQuestion.find({ practical_type: 'titration' })
      .select('question_id question_text difficulty_level')
      .limit(5);
    
    samples.forEach((q, idx) => {
      const preview = q.question_text.substring(0, 60) + '...';
      console.log(`  ${idx + 1}. ${q.question_id} [${q.difficulty_level}]`);
      console.log(`     "${preview}"`);
    });

    console.log('\n' + '─'.repeat(50));
    console.log('✅ Seeding completed successfully!\n');

  } catch (error) {
    console.error('Error displaying summary:', error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Connect to database
    const isConnected = await connectToDatabase();
    if (!isConnected) {
      process.exit(1);
    }

    // Seed questions
    await seedTitrationQuestions();

    console.log('🎉 All titration questions have been seeded successfully!');
    console.log('\n💡 You can now retrieve questions using:');
    console.log('   GET /api/practical-questions/titration');
    console.log('   GET /api/practical-questions/titration?difficulty=medium');
    console.log('   GET /api/practical-questions/titration?mode=practice');
    console.log('   GET /api/practical-questions/titration?tag=stoichiometry');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the seeding script
main();
