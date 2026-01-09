require('dotenv').config();
const mongoose = require('mongoose');

const WaecTopicDetail = require('../models/WaecTopicDetail');
const JambTopicDetail = require('../models/JambTopicDetail');

const MONGO = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/alchemist-research';

async function backfillModel(Model, name) {
  console.log(`Backfilling quizzes for ${name}...`);
  const docs = await Model.find({}).lean();
  let modified = 0;
  for (const doc of docs) {
    let needsSave = false;
    const toUpdate = await Model.findById(doc._id);
    if (!toUpdate) continue;

    if (Array.isArray(toUpdate.quizzes)) {
      toUpdate.quizzes = toUpdate.quizzes.map(q => {
        if (!q.images) {
          q.images = [];
          needsSave = true;
        }
        return q;
      });
    }

    if (Array.isArray(toUpdate.lessons)) {
      toUpdate.lessons = toUpdate.lessons.map(lesson => {
        if (Array.isArray(lesson.quizzes)) {
          lesson.quizzes = lesson.quizzes.map(q => {
            if (!q.images) {
              q.images = [];
              needsSave = true;
            }
            return q;
          });
        }
        return lesson;
      });
    }

    if (needsSave) {
      await toUpdate.save();
      modified++;
    }
  }
  console.log(`${name}: modified ${modified} documents`);
  return modified;
}

async function run() {
  try {
    await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB for migration');

    await backfillModel(WaecTopicDetail, 'WaecTopicDetail');
    await backfillModel(JambTopicDetail, 'JambTopicDetail');

    console.log('Backfill complete');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed', err);
    process.exit(1);
  }
}

run();
