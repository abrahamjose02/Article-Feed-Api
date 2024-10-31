const mongoose = require("mongoose");
const {Article} = require("../model/articleModal");
const User = require("../model/userModal");
const  uploadImageToS3  = require("../utils/s3Uploader");

const getArticles = async (req, res) => {
    const userId = req.user?.id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const userPreferences = user.preferences;

        const articles = await Article.find({
            $and: [
                { tags: { $in: userPreferences } },
                { blockedBy: { $ne: userId } }
            ]
        }).populate('author', 'firstName lastName');

        const userObjectId = new mongoose.Types.ObjectId(userId);
        const articlesWithLikes = articles.map(article => {
            const hasLiked = article.likes.some((like) => like.userId.equals(userObjectId));
            const hasDisliked = article.dislikes.some((dislike) => dislike.userId.equals(userObjectId));
            return {
                ...article.toObject(),
                hasLiked,
                hasDisliked,
            };
        });

        res.status(200).json({ success: true, articles: articlesWithLikes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const likeArticle = async (req, res) => {
    const { articleId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }

    try {
        const article = await Article.findById(articleId);
        if (!article) {
            res.status(404).json({ message: 'Article not found' });
            return;
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);
        if (article.blockedBy.includes(userObjectId)) {
            res.status(400).json({ message: "You cannot like a blocked article." });
            return;
        }

        const hasDisliked = article.dislikes.some(dislike => dislike.userId.equals(userObjectId));
        if (hasDisliked) {
            res.status(400).json({ message: "You must undo disliking the article before liking it." });
            return;
        }

        const hasLiked = article.likes.some(like => like.userId.equals(userObjectId));
        if (hasLiked) {
            article.likes = article.likes.filter(like => !like.userId.equals(userObjectId));
        } else {
            article.likes.push({ userId: userObjectId });
        }

        await article.save();
        res.status(200).json({ success: true, likes: article.likes.length, hasLiked: !hasLiked, articleLikes: article.likes });
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const dislikeArticle = async (req, res) => {
    const { articleId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }

    try {
        const article = await Article.findById(articleId);
        if (!article) {
            res.status(404).json({ message: 'Article not found' });
            return;
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);
        if (article.blockedBy.includes(userObjectId)) {
            res.status(400).json({ message: "You cannot dislike a blocked article." });
            return;
        }

        const hasLiked = article.likes.some(like => like.userId.equals(userObjectId));
        if (hasLiked) {
            res.status(400).json({ message: "You must unlike the article before disliking it." });
            return;
        }

        const hasDisliked = article.dislikes.some(dislike => dislike.userId.equals(userObjectId));
        if (hasDisliked) {
            article.dislikes = article.dislikes.filter(dislike => !dislike.userId.equals(userObjectId));
        } else {
            article.dislikes.push({ userId: userObjectId });
        }

        await article.save();
        res.status(200).json({ success: true, dislikes: article.dislikes.length, hasDisliked: !hasDisliked, articleDislikes: article.dislikes });
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const blockArticle = async (req, res) => {
    const { articleId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }

    try {
        const article = await Article.findById(articleId);
        if (!article) {
            res.status(404).json({ message: 'Article not found' });
            return;
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);
        if (article.blockedBy.includes(userObjectId)) {
            res.status(400).json({ message: "You have already blocked this article." });
            return;
        }

        article.blockedBy.push(userObjectId);
        article.blocks += 1;
        await article.save();

        res.status(200).json({ success: true, blocks: article.blocks });
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const createArticle = async (req, res) => {
    const { title, description, content, tags, category } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        res.status(401).json({ message: "User not authenticated" });
        return;
    }

    try {
        if (!req.file) {
            res.status(400).json({ message: "Image is required" });
            return;
        }

        const imageUrl = await uploadImageToS3(req);

        if (!imageUrl) {
            res.status(500).json({ message: "Image upload failed" });
            return;
        }

        const newArticle = new Article({
            title,
            description,
            content,
            images: [imageUrl],
            tags,
            category,
            author: userId
        });

        await newArticle.save();
        res.status(201).json({ success: true, article: newArticle });
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getUserArticles = async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
        res.status(401).json({ message: "User not authenticated" });
        return;
    }
    try {
        const articles = await Article.find({ author: userId }).exec();
        res.status(200).json({ success: true, articles });
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getArticleById = async (req, res) => {
    const { articleId } = req.params;

    try {
        const article = await Article.findById(articleId)
            .populate('author', 'firstName lastName')
            .exec();

        if (!article) {
            res.status(404).json({ success: false, message: 'Article not found' });
            return;
        }

        res.status(200).json({ success: true, article });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateArticle = async (req, res) => {
    const { articleId } = req.params;
    const { title, description, content, tags, category, removeImage } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }

    try {
        const article = await Article.findOne({ _id: articleId, author: userId });
        if (!article) {
            res.status(404).json({ message: 'Article not found or unauthorized' });
            return;
        }

        if (removeImage === 'true') {
            article.images = [];
        } else if (req.file) {
            const imageUrl = await uploadImageToS3(req);
            if (imageUrl) {
                article.images = [imageUrl];
            }
        }

        article.title = title || article.title;
        article.description = description || article.description;
        article.content = content || article.content;
        article.tags = tags ? tags.split(',').map(tag => tag.trim()) : article.tags;
        article.category = category || article.category;

        await article.save();
        res.status(200).json({ success: true, article });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const deleteArticle = async (req, res) => {
    const { articleId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        res.status(401).json({ message: "User not authenticated" });
        return;
    }

    try {
        const article = await Article.findOneAndDelete({ _id: articleId, author: userId });
        if (!article) {
            res.status(404).json({ message: "Article not found or unauthorized to delete" });
            return;
        }

        res.status(200).json({ success: true, message: "Article deleted successfully" });
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getArticles,
    likeArticle,
    dislikeArticle,
    blockArticle,
    createArticle,
    getUserArticles,
    getArticleById,
    updateArticle,
    deleteArticle
};
