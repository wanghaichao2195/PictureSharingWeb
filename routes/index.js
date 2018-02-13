var express = require("express");
var router = express.Router();
var passport = require("passport");
var User =require("../models/user");


// root route
router.get("/", function(req, res){
    res.render("landing");
});

//show register form
router.get("/register", function(req, res) {
    res.render("register");// render register 
});
//handle sign up logic
router.post("/register", function(req, res) {
    var newUser = new User({username: req.body.username});
    //eval(require("locus"))
    if(req.body.adminCode === "secretcode"){
        newUser.isAdmin = true;
    }
    
    User.register(newUser, req.body.password, function(err, user){//register function provided by passport-local-mongoose store the Hash
        if(err){
            req.flash("error", err.message);//err build in passport
            return res.redirect("/register"); //redirect /register
        }
        passport.authenticate("local")(req, res, function(){//local strategy
         req.flash("success", "Welcome to YelpCamp " + user.username);// could also be req.body.username
            res.redirect("/campgrounds");
        });
    });
});


//show login form
router.get("/login", function(req, res) {
    res.render("login");
});

//handling login logic
router.post("/login", passport.authenticate("local", //middleware
    {
        successRedirect:"/campgrounds",
        failureRedirect:"/login"
    }), function(req, res) {//can also leave blank if you want
});

//logout route
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/campgrounds");
});


module.exports = router;