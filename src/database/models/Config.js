import mongoose from 'mongoose';

const configSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
  },
  prefix: {
    type: String,
    default: '!',
    maxlength: 5,
  },
  embed_color: {
    type: String,
    default: '#0099ff',
    validate: {
      validator: function(v) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'Embed color must be a valid hex color code'
    }
  },
  xp_rate: {
    type: Number,
    default: 1,
    min: 0.1,
    max: 5,
  },
  max_list_size: {
    type: Number,
    default: 50,
    min: 10,
    max: 200,
  },
  bot_owner_role: {
    type: String,
    default: null,
  },
  user_access_role: {
    type: String,
    default: null,
  },
  ai_api_key: {
    type: String,
    default: null,
  },
  patron_role_id: {
    type: String,
    default: null,
  },
  queen_role_id: {
    type: String,
    default: null,
  },
  reminder_channel_id: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Config', configSchema);
