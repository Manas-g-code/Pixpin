var express = require('express');
var router = express.Router();
// const crypto = require('crypto');

// const jwt = require('jsonwebtoken');
// require('dotenv').config();
// const bcrypt = require('bcrypt');
// const nodemailer = require('nodemailer');

const userModel = require('./users');
const postModel = require('./posts');
const commentModel = require('./comments');


const passport = require("passport");
const upload=require('./multer');

const uploadP=require('./multerP');


const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index');
  res.send('hello');
});
router.get('/login', function (req, res, next) {
  res.render('login',{error:req.flash('error')});
});
router.get('/add', function (req, res, next) {
  res.render('add');
});

router.get('/showposts', isLoggedIn,async function (req, res, next) {
  const user=await userModel.findOne({username: req.session.passport.user})
  .populate("posts");     
  // console.log(user);
  res.render('showpost',{user});
});


router.get('/feed', isLoggedIn ,async function (req, res, next) {
   const user=await userModel.findOne({
    username: req.session.passport.user
  });
  const posts=await postModel.find().populate('users');     
  res.render('feed',{user,posts})
});

// here

router.post('/save/:id', isLoggedIn, async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    // Find the post by ID
    const post = await postModel.findById(postId);
    if (!post) {
      return res.status(404).send('Post not found');
    }

    // Check if the post is already saved by the user
    if (post.savedBy.includes(userId)) {
      return res.status(400).send('Post already saved');
    }

    // Add user to savedBy array in post
    post.savedBy.push(userId);
    await post.save();

    res.redirect('/feed');
  } catch (err) {
    console.error('Error saving post:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/saved', isLoggedIn, async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find posts saved by the user
    const savedPosts = await postModel.find({ savedBy: userId }).populate('users'); 

    res.render('savedpost', { savedPosts });
  } catch (err) {
    console.error('Error fetching saved posts:', err);
    res.status(500).send('Internal Server Error');
  }
});


router.post('/fileupload',isLoggedIn,uploadP.single("image"), async function(req,res){
  const user=await userModel.findOne({username:req.session.passport.user});
  user.dp=req.file.filename
  await user.save();
  res.redirect('/profile');
  // res.send("uploaded");
})

//user can upload posts

router.post('/upload',isLoggedIn,upload.single('file'),async function (req, res, next) {
  if(!req.file){
    return res.status(404).send('No such file exist.');
  }
  const user=await userModel.findOne({
    username:req.session.passport.user
  }) 
  const post= await postModel.create({
    image:req.file.filename,
    imageTitle:req.body.imageTitle,
    imageDesc:req.body.imageDesc,
    users:user._id
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/add");
});

router.get('/profile', isLoggedIn,async function (req, res, next) {
  const user=await userModel.findOne({
    username: req.session.passport.user
  })
  .populate("posts");     
  res.render('profile',{user});
});


//delete Pin
router.post('/delete/:id', isLoggedIn, async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    // Find the post by ID
    const post = await postModel.findById(postId);
    if (!post) {
      return res.status(404).send('Post not found');
    }

    

    // Remove the post from the database
    await postModel.findByIdAndDelete(postId);

    // Remove the post reference from the user's posts array
    await userModel.findByIdAndUpdate(userId, { $pull: { posts: postId } });

    res.redirect('/showposts');
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).send('Internal Server Error');
  }
});

// -----DATA ASSOCIATION--------------------------------------------------------------------
// router.get("/alluserposts",async function(req,res){
//   let user=await userModel.findOne({_id:"66608c1c9208099a62f6ea44"})
//   .populate('posts')
//   res.send(user);
// })
// router.get('/createuser',async function(req,res){
//   var createduser=await userModel.create({
//     username: "manas",
//     password: "20apr",
//     posts:[],
//     fullName: "manasGupta",
//     email: "manas123@gmail.com"
//   });
//   res.send(createduser);
// })
// router.get('/createpost',async function(req,res){
//   let createdpost=await postModel.create({
//     postText: "totally confused,but try'in hard...",
//     user: "66608c1c9208099a62f6ea44"
//   });
//   let user= await userModel.findOne({_id:"66608c1c9208099a62f6ea44"});
//   user.posts.push(createdpost._id);
//   await user.save();
//   res.send("done");
//   // res.send(createdpost);
// });------------------------------------------------------------------------------------


//for comment

// router.get('/addcomment',function(req,res,next){
//   res.render('comments')
// })

router.get('/posts/:id/comments', isLoggedIn, async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id).populate('users').populate({
      path: 'comments',
      populate: {
        path: 'users'
      }
    });

    const comments = post.comments;

    // console.log('Fetched Post:', post);
    // console.log('Fetched Comments:', comments);

    res.render('comments', { post, comments });
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Route to add a new comment
router.post('/posts/:id/comments', isLoggedIn, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    const { content } = req.body;

    // Create and save new comment
    const newComment = new commentModel({ content, post: postId, users: userId });
    await newComment.save();

    // Add comment reference to post
    const post = await postModel.findById(postId);
    post.comments.push(newComment._id);
    await post.save();

    res.redirect(`/posts/${postId}/comments`);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Delete a comment
router.post('/comments/:commentId/delete', isLoggedIn, async (req, res) => {
  try {
    // Find the comment to be deleted
    const comment = await commentModel.findById(req.params.commentId).populate('posts');
    if (!comment) {
      return res.status(404).send('Comment not found');
    }

    // Check if the user is authorized to delete the comment
    if (comment.users.toString() !== req.user._id.toString()) {
      return res.status(403).send('Unauthorized');
    }

    // Find the associated post and remove the comment reference
    // const post = await postModel.findById(comment.posts._id);
    // post.comments.pull(comment._id);
    // await post.save();

    // Delete the comment
    await commentModel.findByIdAndDelete(comment._id);

    res.redirect(`/posts/${post._id}/comments`);
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.redirect('/feed');
  }
});


//searching
// router.get('/feed/search/:key',async (req,res)=>{
//   console.log(req.params.key);
//   let data=await postModel.find({
//     "$or":[{
//       "imageTitle":{$regex:req.params.key},
//       "imageDesc":{$regex:req.params.key}
//     }]
//   })
//   res.send(data);
// })

router.get('/feed/search', isLoggedIn, async (req, res) => {
  try {
    const query = req.query.query;
    const posts = await postModel.find({
      $or: [
        { imageTitle: { $regex: query, $options: 'i' } },
        { imageDesc: { $regex: query, $options: 'i' } }
      ]
    }).populate('users');
    res.render('feed', { posts });
  } catch (err) {
    console.error('Error searching posts:', err);
    res.status(500).send('Internal Server Error');
  }
});




// router.get('/forgot-password',function(req,res,next){
//   res.render('forgot-password');
// })


// Route to handle forgot password form submission
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

// Forgot Password Route
// router.post('/forgot-password', async (req, res) => {
//   try {
//     const user = await userModel.findOne({ email: req.body.email });
//     if (!user) {
//       return res.status(404).send('No account with that email address exists.');
//     }

//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

//     const resetURL = `http://${req.headers.host}/reset/${token}`;

//     const mailOptions = {
//       to: user.email,
//       from: process.env.EMAIL_USER,
//       subject: 'Password Reset',
//       text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
//              Please click on the following link, or paste this into your browser to complete the process:\n\n
//              ${resetURL}\n\n
//              If you did not request this, please ignore this email and your password will remain unchanged.\n`
//     };

//     await transporter.sendMail(mailOptions);

//     return res.send('An email has been sent to ' + user.email + ' with further instructions.');
//   } catch (err) {
//     console.error('Error sending password reset email:', err);
//     return res.status(500).send('Internal Server Error');
//   }
// });

// router.get('/reset/:token', async (req, res) => {
//   try {
//     const token = req.params.token;
//     jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//       if (err) {
//         // return res.status(400).send('Password reset token is invalid or has expired.');
//         return res.send('Password reset token is invalid or has expired.');

//       }
//       res.render('reset-password', { token });
//     });
//   } catch (err) {
//     console.error('Error finding user with reset token:', err);
//     // return res.status(500).send('Internal Server Error');
//     return res.send('Internal Server Error');

//   }
// });
// router.get('/reset/:token', async (req, res) => {
//   try {
//     const token = req.params.token;
//     jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
//       if (err) {
//         return res.send('Password reset token is invalid or has expired.');
//       }
//       const user = await userModel.findById(decoded.id);
//       if (!user) {
//         return res.send('User not found.');
//       }
//       res.render('reset-password', { token, username: user.username });
//     });
//   } catch (err) {
//     console.error('Error finding user with reset token:', err);
//     return res.send('Internal Server Error');
//   }
// });

// router.post('/reset/:token', async (req, res) => {
//   try {
//     const token = req.params.token;
//     const newPassword = req.body.password;
//     const confirmPassword = req.body.confirmPassword;

//     if (newPassword !== confirmPassword) {
//       return res.status(400).send('Passwords do not match.');
//     }

//     jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
//       if (err) {
//         console.error('Invalid or expired token:', err);
//         return res.status(400).send('Password reset token is invalid or has expired.');
//       }

//       const userId = decoded.id;
//       const user = await userModel.findById(userId);
//       if (!user) {
//         return res.status(400).send('User not found.');
//       }

//       // const saltRounds = 10;
//       // const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
//       // Directly setting the new password will trigger the pre-save hook to hash it

//       user.password = newPassword;
//       await user.save();

//       res.send('Password has been successfully reset.');
//     });
//   } catch (err) {
//     console.error('Error resetting password:', err);
//     res.status(500).send('Internal Server Error');
//   }
// });




// router.post("/login", passport.authenticate("local", {
//   successRedirect: "/profile",
//   failureRedirect: "/login",
//   failureFlash: true
// }), async (req, res) => {
//   try {
//     const user = await userModel.findOne({ username: req.body.username });
//     if (!user) {
//       return res.status(401).send('Invalid email or password.');
//     }

//     const isMatch = await bcrypt.compare(req.body.password, user.password);
//     if (!isMatch) {
//       return res.status(401).send('Invalid email or password.');
//     }

//     // Handle successful login
//     res.redirect('/profile');
//   } catch (err) {
//     console.error('Error logging in:', err);
//     res.status(500).send('Internal Server Error');
//   }
// });


router.post("/login", passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login",
  failureFlash: true
}));



router.post("/register", function (req, res) {
  const userData = new userModel({
    username: req.body.username,
    email: req.body.email,
    fullname: req.body.fullname
  });
  userModel.register(userData, req.body.password).then(function () {
    passport.authenticate("local")(req, res, function () {
      res.redirect('/profile');
    })
  })
})


function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}


router.get('/logout', function (req, res, next) {
  console.log('Logout request received');
  req.logout(function (err) {
    if (err) {
      console.error('Error logging out:', err);
      return next(err);
    }
    console.log('User logged out');
    res.redirect('/login');
    // console.log('Redirecting to home page');
  });
});



module.exports = router;

