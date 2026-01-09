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

const TableSchema = new mongoose.Schema({
  title: String,
  headers: [String],
  rows: [[String]],
  description: String,
  rowExplanations: [String]
}, { _id: false });

const ChartSchema = new mongoose.Schema({
  title: String,
  type: { type: String, enum: ['bar', 'pie', 'histogram', 'line'], default: 'bar' },
  labels: [String],
  labelExplanations: [String],
  datasets: [{
    label: String,
    data: [Number],
    backgroundColor: String,
    borderColor: String
  }],
  description: String
}, { _id: false });

const ImageSchema = new mongoose.Schema({
  type: { type: String, enum: ['url', 'blob'], default: 'url' },
  data: mongoose.Schema.Types.Mixed, // string URL or binary data for BLOB
  mimeType: String,
  size: Number,
}, { _id: false });

const QuizSchema = new mongoose.Schema({
  question: String,
  options: [String],
  answer: Number,
  explanations: [String],
  tables: [TableSchema],
  charts: [ChartSchema]
  ,
  images: [ImageSchema]
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

const WaecTopicDetailSchema = new mongoose.Schema({
  topicUUID: { type: String, index: true },
  sectionId: String,
  slug: String,
  description: String,
  content: String,
  images: [String],
  videos: [String],
  diagrams: [String],
  codeSnippets: [CodeSnippetSchema],
  lessons: [LessonSchema],
  contentBlocks: [ContentBlockSchema],
  tables: [TableSchema],
  charts: [ChartSchema],
  resources: [ResourceSchema],
  quizzes: [QuizSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WaecTopicDetail', WaecTopicDetailSchema);
