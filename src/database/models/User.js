import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
  },
  xp: {
    type: Number,
    default: 0,
  },
  badges: [{
    type: String,
  }],
  readingList: [{
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['book', 'manga', 'webtoon', 'comic', 'lightnovel'],
      required: true,
    },
    status: {
      type: String,
      enum: ['reading', 'completed', 'paused'],
      default: 'reading',
    },
    progress: {
      type: Number,
      default: 0,
    },
    chapters: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      min: 1,
      max: 10,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

export default mongoose.model('User', userSchema);
