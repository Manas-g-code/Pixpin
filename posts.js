const mongoose = require('mongoose');

// Define the post schema
const postSchema = new mongoose.Schema({
  imageTitle: {
    type: String,
    required: true  // postText must be provided
  },
  imageDesc: {
    type: String,
    required: true
  },
  image:{
    type:String
  },
  createdAt: {
    type: Date,
    default: Date.now  // Automatically sets the current date and time
  },
  likes: {
    type: Array,
    default: []  
  },
  users:{
    type:mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  savedBy: [{
    type:mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }],
  
  comments: [{ 
    type:mongoose.Schema.Types.ObjectId,
    ref: 'comment' 
  }]
});

// Create the post model
module.exports = mongoose.model('post', postSchema);
