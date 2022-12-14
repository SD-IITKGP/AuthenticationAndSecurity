//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const app = express();
const bcrypt = require("bcrypt");
const saltRounds = 10;
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set("view engine","ejs");
mongoose.set("strictQuery",true);
mongoose.connect("mongodb://localhost:27017/UsersDB");
const userSchema = new mongoose.Schema({
  email:String,
  password:String,
});
userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});
const User = mongoose.model("User",userSchema);
app.get("/",function(req,res){
  res.render("home",{});
});
app.get("/register",function(req,res){
  res.render("register",{});
});
app.get("/logout",function(req,res){
  res.redirect("/");
});
app.get("/login",function(req,res){
  res.render("login",{});
});
app.get("/submit",function(req,res){
  res.render("submit",{});
});
app.post("/register",function(req,res){
  bcrypt.hash(req.body.password,saltRounds,function(err,hash){
    if(err){
      console.log(err);
      }else{
        const user = new User({
          email:req.body.username,
          password:hash
        });
        user.save();
        res.render("secrets",{});
      }
  });
});
app.post("/login",function(req,res){
  User.findOne({email:req.body.username},function(err,user){
    if(err){
      console.log(err);
    }
    else{
      if(user){
        bcrypt.compare(req.body.password,user.password,function(err,result){
          if(err){
            console.log(err);
          }
          else{
            if(result===true){
              res.render("secrets",{});
            }
            else{
              res.render("login",{});
            }
          }
        });
      }
      else{
        res.render("login",{});
      }
    }
  });
});
app.listen(3000,function(){
  console.log("Server is running on port 3000");
})
