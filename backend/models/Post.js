import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    subtitle: {
      type: String,
      required: [true, 'Please provide a subtitle'],
      trim: true,
      maxlength: [300, 'Subtitle cannot be more than 300 characters'],
    },
    content: {
      type: String,
      required: [true, 'Please provide content'],
    },
    image: {
      type: String,
      required: [true, 'Please provide an image'],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance and scalability
postSchema.index({ author: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ likesCount: -1 });
postSchema.index({ title: 'text', subtitle: 'text', tags: 'text' });

const Post = mongoose.model('Post', postSchema);

export default Post;