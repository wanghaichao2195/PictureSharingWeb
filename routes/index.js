var express = require("express");
var router = express.Router();
var passport = require("passport");
var User =require("../models/user");
var Campground =require("../models/campground");
var nodemailer = require("nodemailer");
var async = require("async");
var crypto = require("crypto");//no need to install, already in express

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
    var newUser = new User(
        {
            username: req.body.username, 
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            avatar: req.body.avatar
            
        });
    //eval(require("locus"))
    if(req.body.adminCode === process.env.ADMIN){
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
    res.render("login/login");
});
router.get("/login/failure_login",function(req,res){
     res.render("login/failure_login")
});

//handling login logic
router.post("/login", passport.authenticate("local", //middleware
    {
        successRedirect:"/campgrounds",
        failureRedirect:"/login/failure_login"
    }), function(req, res) {//can also leave blank if you want
});

//logout route
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/campgrounds");
});

//forgot password
router.get("/forgot", function(req, res) {
    res.render("forgot");
});

router.post("/forgot", function(req, res, next){
   async.waterfall([
       function(done){
          crypto.randomBytes(20, function(err, buf) {
              var token = buf.toString("hex");//this means the unique token used to send to certain e-mail address when user need to reset their password
              done(err,token);
          });    
       },
       function(token, done){
           User.findOne({email: req.body.email}, function(err, user){
               if(!user){
                   req.flash("error", "No account with that email address exists.");
                   return res.redirect("/forgot");
               }
               
               user.resetPasswordToken = token;
               user.resetPasswordExpires = Date.now() + 1800000;//half an hour
               
               user.save(function(err){
                   done(err, token, user);
               });
            });
        },
        function(token, user, done){
            var smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth:{
                    user: "wanghaichao2195@gmail.com",
                    pass: process.env.GMAILPW
                    //export GMAILPW=yourpassword
                }
            });
            var mailOptions ={
                to: user.email,
                form:"wanghaichao2195@gmail.com",
                subject: "YelpCamp Password Reset",
                text: "You arte receiving this because you (or someone else) have requested the reset of the password"+
                    "Please click on the following link or paste this into your browser to complete the process"+
                    "http://" + req.headers.host + "/reset/" + token + "\n\n" +
                    "If you did not request this, please ignore this email and your password will remain unchanged"
            };
            smtpTransport.sendMail(mailOptions, function(err){
                console.log("mail sent");
                req.flash("success", "An email has been sent to "+ user.email + "with further instructions.");
                done(err, "done");
            });
        }
    ], function(err){
        if(err) return next(err);
        res.redirect("/forgot");
    });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([//to avoid call backs, just functions to get called in sequences
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'wanghaichao2195@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'wanghaichao2195@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/campgrounds');
  });
});




//user profile
router.get("/users/:id", function(req, res) {
    User.findById(req.params.id, function(err, foundUser){
        if(err){
            req.flash("error","Error");
            res.redirect("/");
        }
        Campground.find().where("author.id").equals(foundUser._id).exec(function(err, campgrounds){
            if(err){
            req.flash("error","Error");
            res.redirect("/");
        }
        res.render("users/show", {user: foundUser, campgrounds: campgrounds});
        });
    });
});


module.exports = router;