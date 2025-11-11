import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  goal: {
    type: Number, // e.g., number of books to read
    required: true,
  },
  type: {
    type: String,
    enum: ['book', 'manga', 'webtoon', 'comic', 'lightnovel'],
    required: true,
  },
  participants: [{
    userId: {
      type: String,
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  createdBy: {
    type: String, // userId
    required: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Challenge', challengeSchema);
