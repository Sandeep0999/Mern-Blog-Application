import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import { validationResult } from 'express-validator';
import { escapeRegex } from '../utils/validators.js';

export const getPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'recent';
    
    // Determine sort order based on filter
    let sortOption = {};
    switch (sortBy) {
      case 'liked':
        sortOption = { likesCount: -1, createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'commented':
        sortOption = { commentsCount: -1, createdAt: -1 };
        break;
      case 'recent':
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    // Filter: include published posts AND legacy posts that have no status field yet
    const statusFilter = {
      $or: [
        { status: { $in: ['published', 'flagged'] } },
        { status: { $exists: false } },
      ],
    };

    const posts = await Post.find(statusFilter)
      .populate({
        path: 'author',
        select: 'name avatar isShadowBanned status',
        // Include active users AND legacy users with no status field yet
        match: { $or: [{ status: { $in: ['active', 'shadow_banned'] } }, { status: { $exists: false } }] },
      })
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    // Filter out posts whose author populated as null (banned users)
    const filteredPosts = posts.filter(p => p.author !== null);

    const total = await Post.countDocuments(statusFilter);

    res.json({
      posts: filteredPosts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
export const getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      'author',
      'name avatar bio'
    );

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    next(error);
  }
};

// @desc    Create post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, subtitle, content, image, tags } = req.body;

    // Upload image to Cloudinary
    let imageUrl = image;
    if (image && image.startsWith('data:image')) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: 'dailypen',
        resource_type: 'auto',
      });
      imageUrl = uploadResponse.secure_url;
    }

    const post = await Post.create({
      title,
      subtitle,
      content,
      image: imageUrl,
      tags: tags || [],
      author: req.user._id,
    });

    const populatedPost = await Post.findById(post._id).populate(
      'author',
      'name avatar'
    );

    res.status(201).json(populatedPost);
  } catch (error) {
    next(error);
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
export const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: 'Not authorized to update this post' });
    }

    const { title, subtitle, content, image, tags } = req.body;

    // Upload new image if provided
    let imageUrl = post.image;
    if (image && image.startsWith('data:image')) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: 'dailypen',
        resource_type: 'auto',
      });
      imageUrl = uploadResponse.secure_url;
    }

    post.title = title || post.title;
    post.subtitle = subtitle || post.subtitle;
    post.content = content || post.content;
    post.image = imageUrl;
    post.tags = tags || post.tags;

    const updatedPost = await post.save();
    const populatedPost = await Post.findById(updatedPost._id).populate(
      'author',
      'name avatar'
    );

    res.json(populatedPost);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the author or admin
    if (
      post.author.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res
        .status(403)
        .json({ message: 'Not authorized to delete this post' });
    }

    // Delete associated comments
    await Comment.deleteMany({ post: req.params.id });

    // Remove from saved posts
    await User.updateMany(
      { savedPosts: req.params.id },
      { $pull: { savedPosts: req.params.id } }
    );

    await post.deleteOne();

    res.json({ message: 'Post removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Like/Unlike post
// @route   PUT /api/posts/:id/like
// @access  Private
export const likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isLiked = post.likes.includes(req.user._id);
    let updatedPost;

    if (isLiked) {
      // Unlike atomically
      updatedPost = await Post.findOneAndUpdate(
        { _id: req.params.id, likes: req.user._id },
        {
          $pull: { likes: req.user._id },
          $inc: { likesCount: -1 }
        },
        { new: true }
      );
    } else {
      // Like atomically
      updatedPost = await Post.findOneAndUpdate(
        { _id: req.params.id, likes: { $ne: req.user._id } },
        {
          $addToSet: { likes: req.user._id },
          $inc: { likesCount: 1 }
        },
        { new: true }
      );
    }

    // Fallback if findOneAndUpdate returned null due to race condition
    if (!updatedPost) {
      updatedPost = await Post.findById(req.params.id);
    }

    res.json({ likes: updatedPost.likes, likesCount: updatedPost.likesCount });
  } catch (error) {
    next(error);
  }
};

// @desc    Search posts
// @route   GET /api/posts/search/:query
// @access  Public
export const searchPosts = async (req, res, next) => {
  try {
    const { query } = req.params;
    const escapedQuery = escapeRegex(query);

    const posts = await Post.find({
      $or: [
        { title: { $regex: escapedQuery, $options: 'i' } },
        { subtitle: { $regex: escapedQuery, $options: 'i' } },
        { tags: { $regex: escapedQuery, $options: 'i' } },
      ],
    })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(posts);
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments for a post
// @route   GET /api/posts/:id/comments
// @access  Public
export const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to post
// @route   POST /api/posts/:id/comments
// @access  Private
export const addComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await Comment.create({
      content: req.body.content,
      author: req.user._id,
      post: req.params.id,
    });

    // Update comments count atomically
    await Post.findByIdAndUpdate(req.params.id, { $inc: { commentsCount: 1 } });

    const populatedComment = await Comment.findById(comment._id).populate(
      'author',
      'name avatar'
    );

    res.status(201).json(populatedComment);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/posts/:postId/comments/:commentId
// @access  Private
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the author or admin
    if (
      comment.author.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res
        .status(403)
        .json({ message: 'Not authorized to delete this comment' });
    }

    await comment.deleteOne();

    // Update comments count atomically
    await Post.findByIdAndUpdate(req.params.postId, { $inc: { commentsCount: -1 } });

    res.json({ message: 'Comment removed' });
  } catch (error) {
    next(error);
  }
};

export const getPostsByCategories = async (req, res, next) => {
  try {
    const posts = await Post.find().populate('author', 'name avatar').sort({ createdAt: -1 });

    // Group by tags (categories)
    const grouped = {};
    posts.forEach((post) => {
      post.tags.forEach((tag) => {
        if (!grouped[tag]) grouped[tag] = [];
        if (grouped[tag].length < 3) grouped[tag].push(post); // max 3 per category
      });
    });

    res.json(grouped);
  } catch (error) {
    next(error);
  }
};

export const getFeaturedPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .sort({ likesCount: -1, createdAt: -1 })
      .limit(3)
      .populate('author', 'name avatar');
    res.json(posts);
  } catch (error) {
    next(error);
  }
};

export const getLatestPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('author', 'name avatar');
    res.json(posts);
  } catch (error) {
    next(error);
  }
};

export const getPostsByTag = async (req, res, next) => {
  try {
    const escapedTag = escapeRegex(req.params.tag);
    const posts = await Post.find({
      tags: { $regex: escapedTag, $options: 'i' },
    })
      .sort({ createdAt: -1 })
      .populate('author', 'name avatar');

    res.json(posts);
  } catch (error) {
    next(error);
  }
};