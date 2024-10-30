const express = require("express");
const {
  getArticles,
  createArticle,
  getUserArticles,
  updateArticle,
  deleteArticle,
  likeArticle,
  dislikeArticle,
  blockArticle,
  getArticleById,
} = require("../controller/articleController");
const { isAuthenticated } = require("../middleware/authMiddleware");
const upload = require("../utils/multer");

const articleRouter = express.Router();

articleRouter.get("/", isAuthenticated, getArticles);

articleRouter.post("/create", isAuthenticated, upload.single("image"), createArticle);

articleRouter.get("/user", isAuthenticated, getUserArticles);

articleRouter.get("/:articleId", isAuthenticated, getArticleById);

articleRouter.put("/:articleId", isAuthenticated, upload.single("image"), updateArticle);

articleRouter.delete("/:articleId", isAuthenticated, deleteArticle);

articleRouter.post("/like", isAuthenticated, likeArticle);

articleRouter.post("/dislike", isAuthenticated, dislikeArticle);

articleRouter.post("/block", isAuthenticated, blockArticle);

module.exports = articleRouter;
