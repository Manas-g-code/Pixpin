const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  users:{
    type:mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'post'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('comment', commentSchema);
