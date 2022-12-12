//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const app = express();
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
  const user = new User({
    email:req.body.username,
    password:req.body.password
  });
  user.save();
  res.render("secrets",{});
});
app.post("/login",function(req,res){
  User.findOne({email:req.body.username},function(err,user){
    if(err){
      console.log(err);
    }
    else{
      if(user&&user.password===req.body.password){
        res.render("secrets",{});
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
