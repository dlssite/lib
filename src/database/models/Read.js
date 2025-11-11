import mongoose from 'mongoose';

const readSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['book', 'manga', 'webtoon', 'comic', 'lightnovel'],
    required: true,
  },
  author: {
    type: String,
  },
  description: {
    type: String,
  },
  cover: {
    type: String, // URL to cover image
  },
  totalChapters: {
    type: Number,
    default: 0,
  },
  releaseDate: {
    type: Date,
  },
  genres: [{
    type: String,
  }],
  apiId: {
    type: String, // ID from external API
  },
}, {
  timestamps: true,
});

export default mongoose.model('Read', readSchema);
