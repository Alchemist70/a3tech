const mongoose = require('mongoose');

const CodeSnippetSchema = new mongoose.Schema({
  code: String,
  language: String
}, { _id: false });

const ResourceSchema = new mongoose.Schema({
  title: String,
  url: String,
  type: { type: String, enum: ['video', 'article', 'code'], default: 'article' }
}, { _id: false });

const QuizSchema = new mongoose.Schema({
  question: String,
  options: [String],
  answer: Number,
  explanations: [String]
}, { _id: false });

const ContentBlockSchema = new mongoose.Schema({
  type: { type: String, enum: ['text', 'image', 'diagram', 'video'], default: 'text' },
  value: String
}, { _id: false });

const LessonSchema = new mongoose.Schema({
  title: String,
  content: String,
  images: [String],
  videos: [String],
  diagrams: [String],
  codeSnippets: [CodeSnippetSchema],
  contentBlocks: [ContentBlockSchema],
  resources: [ResourceSchema],
  quizzes: [QuizSchema]
}, { _id: false });

const TopicDetailSchema = new mongoose.Schema({
  topicUUID: { type: String, index: true },
  subjectId: String,
  slug: String,
  description: String,
  content: String,
  images: [String],
  videos: [String],
  diagrams: [String],
  codeSnippets: [CodeSnippetSchema],
  lessons: [LessonSchema],
  contentBlocks: [ContentBlockSchema],
  resources: [ResourceSchema],
  quizzes: [QuizSchema],
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('TopicDetail', TopicDetailSchema);
