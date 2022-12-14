//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const app = express();
const session =require("express-session");
const passport = require("passport");
const passpoerLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findorCreate = require("mongoose-findorcreate");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set("view engine","ejs");
mongoose.set("strictQuery",true);
app.use(session({
  secret:process.env.SECRET,resave:false,saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://localhost:27017/UsersDB");
const userSchema = new mongoose.Schema({
  username:String,
  password:String,
  googleId:String,
  facebookId:String,
  secret:String
});
userSchema.plugin(passpoerLocalMongoose);
userSchema.plugin(findorCreate);
// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});
const User = mongoose.model("User",userSchema);
passport.use(User.createStrategy());
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    // userProfileURL: "https://www.googleapis.com/oauth2/v/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, done) {
    done(null, user.id);
});
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});
app.get("/",function(req,res){
  if(req.isAuthenticated()){
    res.redirect("/secrets");
  }
  else{
    res.render("home",{});
  }
});
app.get("/register",function(req,res){
  res.render("register",{});
});
// app.get("/logout",function(req,res){
//   res.redirect("/");
// });

app.get("/logout",function(req,res,next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});
app.get('/auth/google',passport.authenticate('google', { scope: ['profile'] }));
app.get('/auth/google/secrets',passport.authenticate('google', { failureRedirect: '/login' }),function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/secrets');
});
app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });
app.get("/login",function(req,res){
  res.render("login",{});
});
app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit",{});
  }
  else{
    res.redirect("/login");
  }
});
app.post("/submit",function(req,res){
  User.findById(req.user.id,function(err,foundUser){
    if(err){
      console.log(err);
      res.redirect("/submit");
    }
    else if(foundUser){
      foundUser.secret=req.body.secret;
      foundUser.save();
      res.redirect("/secrets");
    }
  })
});
// app.post("/register",function(req,res){
//   bcrypt.hash(req.body.password,saltRounds,function(err,hash){
//     if(err){
//       console.log(err);
//       }else{
//         const user = new User({
//           email:req.body.username,
//           password:hash
//         });
//         user.save();
//         res.render("secrets",{});
//       }
//   });
// });
app.get("/secrets",function(req,res){
  if(req.isAuthenticated()){
    User.find({"secret":{$ne:null}},function(err,foundUsers){
      if(err){
        console.log(err);
        res.redirect("/");
      }
      else{
          res.render("secrets",{foundUsers:foundUsers});
      }
    });
  }
  else{
    res.redirect("/login");
  }
});

app.post("/register",function(req,res){
  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
      console.log(err);
    }
    else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });
});

// app.post("/login",function(req,res){
//   User.findOne({email:req.body.username},function(err,user){
//     if(err){
//       console.log(err);
//     }
//     else{
//       if(user){
//         bcrypt.compare(req.body.password,user.password,function(err,result){
//           if(err){
//             console.log(err);
//           }
//           else{
//             if(result===true){
//               res.render("secrets",{});
//             }
//             else{
//               res.render("login",{});
//             }
//           }
//         });
//       }
//       else{
//         res.render("login",{});
//       }
//     }
//   });
// });

app.post("/login",function(req,res){
  const user = new User({
    username:req.body.username,
    password:req.body.password
  });
  req.login(user,function(err){
    if(err){
      console.login(err);
    }else{
      passport.authenticate("local");
      res.redirect("/secrets");
    }
  });
});

app.listen(3000,function(){
  console.log("Server is running on port 3000");
});



// <script>
//   window.fbAsyncInit = function() {
//     FB.init({
//       appId      : '{your-app-id}',
//       cookie     : true,
//       xfbml      : true,
//       version    : '{api-version}'
//     });
//
//     FB.AppEvents.logPageView();
//
//   };
//
//   (function(d, s, id){
//      var js, fjs = d.getElementsByTagName(s)[0];
//      if (d.getElementById(id)) {return;}
//      js = d.createElement(s); js.id = id;
//      js.src = "https://connect.facebook.net/en_US/sdk.js";
//      fjs.parentNode.insertBefore(js, fjs);
//    }(document, 'script', 'facebook-jssdk'));
// </script>
