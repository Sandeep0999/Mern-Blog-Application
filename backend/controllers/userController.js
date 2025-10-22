import User from '../models/User.js';
import Post from '../models/Post.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Get user profile
// @route   GET /api/users/profile/:id
// @access  Public
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const posts = await Post.find({ author: req.params.id })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ user, posts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, bio, avatar } = req.body;

    // Upload avatar to Cloudinary if provided
    let avatarUrl = user.avatar;
    if (avatar && avatar.startsWith('data:image')) {
      const uploadResponse = await cloudinary.uploader.upload(avatar, {
        folder: 'dailypen/avatars',
        resource_type: 'auto',
      });
      avatarUrl = uploadResponse.secure_url;
    }

    user.name = name || user.name;
    user.bio = bio !== undefined ? bio : user.bio;
    user.avatar = avatarUrl;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      bio: updatedUser.bio,
      avatar: updatedUser.avatar,
      role: updatedUser.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save post
// @route   PUT /api/users/save/:postId
// @access  Private
export const savePost = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isSaved = user.savedPosts.includes(req.params.postId);

    if (isSaved) {
      // Unsave
      user.savedPosts = user.savedPosts.filter(
        (postId) => postId.toString() !== req.params.postId
      );
    } else {
      // Save
      user.savedPosts.push(req.params.postId);
    }

    await user.save();

    res.json({ savedPosts: user.savedPosts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get saved posts
// @route   GET /api/users/saved
// @access  Private
export const getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedPosts',
      populate: { path: 'author', select: 'name avatar' },
    });

    res.json(user.savedPosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's own posts
// @route   GET /api/users/my-posts
// @access  Private
export const getMyPosts = async(req, res) => {
  try {
    const posts = await Post.find({ author: req.user._id })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};