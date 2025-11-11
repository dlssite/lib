import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  genre: {
    type: String,
  },
  type: {
    type: String,
    enum: ['book', 'manga', 'webtoon', 'comic', 'lightnovel', 'mixed'],
  },
  members: [{
    type: String, // userId
  }],
  currentRead: {
    title: String,
    type: String,
    startDate: Date,
    endDate: Date,
  },
  schedule: {
    type: String, // e.g., "Every Monday 8PM"
  },
  channelId: {
    type: String, // Discord channel ID
  },
  createdBy: {
    type: String, // userId
    required: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Group', groupSchema);
