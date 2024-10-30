const mongoose = require("mongoose");

const ArticleCategory = {
  TECHNOLOGY: "Technology",
  HEALTH: "Health",
  EDUCATION: "Education",
  LIFESTYLE: "Lifestyle",
  FINANCE: "Finance",
  TRAVEL: "Travel",
  FOOD: "Food",
  SPORTS: "Sports",
  ENTERTAINMENT: "Entertainment",
  SCIENCE: "Science",
};

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  images: {
    type: [String],
    required: true,
  },
  tags: {
    type: [String],
    required: true,
  },
  category: {
    type: String,
    enum: Object.values(ArticleCategory),
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  likes: {
    type: [{ userId: mongoose.Schema.Types.ObjectId }],
    default: [],
  },
  dislikes: {
    type: [{ userId: mongoose.Schema.Types.ObjectId }],
    default: [],
  },
  blocks: {
    type: Number,
    default: 0,
  },
  blockedBy: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: [],
  },
});

const Article = mongoose.model("Article", articleSchema);
module.exports = { Article, ArticleCategory };
