const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
const plm=require("passport-local-mongoose");



mongoose.connect("mongodb://127.0.0.1:27017/backend3");

// Define the user schema
const userSchema = new mongoose.Schema({
  username: {
    type: [String],
    required: true,
    unique: true
  },
  password: {
    type: String
  },

  dp : String,

  fullname: {
    type: String
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'post'
  }],
  comments: [{ 
    type:mongoose.Schema.Types.ObjectId,
    ref: 'comment' 
  }]
});

// userSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) {
//     return next();
//   }
//   try {
//     const salt = await bcrypt.genSalt(10);
//     // user.password = await bcrypt.hash(user.password, salt);
//     const hashedPassword = await bcrypt.hash(this.password, salt);
//     this.password = hashedPassword;
//     next();
//   } catch (err) {
//     next(err);
//   }
// });

// userSchema.methods.comparePassword = async function (candidatePassword) {
//   return bcrypt.compare(candidatePassword, this.password);
// };


userSchema.plugin(plm);
module.exports = mongoose.model('user', userSchema);


