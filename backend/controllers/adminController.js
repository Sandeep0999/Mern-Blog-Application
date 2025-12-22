import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';


export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }


    await Post.deleteMany({ author: req.params.id });


    await Comment.deleteMany({ author: req.params.id });

    await User.updateMany(
      { savedPosts: { $exists: true } },
      { $pull: { savedPosts: { $in: await Post.find({ author: req.params.id }).distinct('_id') } } }
    );

    await user.deleteOne();

    res.json({ message: 'User and associated data removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalComments = await Comment.countDocuments();

    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentPosts = await Post.find()
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalUsers,
      totalPosts,
      totalComments,
      recentUsers,
      recentPosts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};