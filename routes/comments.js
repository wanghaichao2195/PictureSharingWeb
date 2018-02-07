var express = require("express");
var router = express.Router({mergeParams:true});//because we abbreviate the route address to "/" so the id can not pass through to this file so we need to merge this 
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware")


//Comments new
router.get("/new", middleware.isLoggedIn, function(req, res) {
    //find campground by id 
    //console.log(req.params.id);
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
        }else{
            res.render("comments/new", {campground:campground});
        }
    })
    
});

// comments create
router.post("/", middleware.isLoggedIn, function(req, res){
    Campground.findById(req.params.id, function(err, campground) {
       if(err){
          console.log(err); 
          res.redirect("/campgrounds");
       } else{
           Comment.create(req.body.comment, function(err, comment){
               if(err){
                   req.flash("error", "Something went wrong");
                  console.log(err);
               }else{
                   comment.author.id = req.user._id;
                   comment.author.username = req.user.username;
                   comment.save();
                   //add user name and id to comment and save comment
                  
                  campground.comments.push(comment._id);
                  campground.save();
                  req.flash("success", "Successfully added comment")
                  res.redirect("/campgrounds/"+campground._id);
               }
           })
           
       }
    });
});

// comment edit route
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
    Comment.findById(req.params.comment_id, function(err, foundComment) {
        if(err){
            res.redirect("back");
        }else{
            res.render("comments/edit", {campground_id:req.params.id, comment:foundComment});
        }
    });
    
});

//comment update
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if(err){
            res.redirect("back");
        }else{
            res.redirect("/campgrounds/" + req.params.id)
        }
    })
});

//comment destroy route
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
   //find by id and remove
   Comment.findByIdAndRemove(req.params.comment_id, function(err){
       if(err){
           res.redirect("back");
       }else{
           req.flash("success","Comment deleted");
           res.redirect("/campgrounds/" + req.params.id);
       }
   })
});


//keep the access only to those who logged in
//middleware
// function isLoggedIn(req, res, next){
//     if(req.isAuthenticated()){
//         return next();
//     }
//     res.redirect("/login");// just put this function in the middleware other functions 
// }

// function checkCommentOwnership(req, res, next){
//      if(req.isAuthenticated()){
//         Comment.findById(req.params.comment_id, function(err, foundComment){//this req.params.id==:id
//             if(err){
//                 res.redirect("back");
//             }else{
//                 // does user own the comment?
//                 if(foundComment.author.id.equals(req.user._id)){//req.user._id stored in passport
//                     next();
//                 }else{
//                     res.redirect("back");
//                 }
                
//             }
//         });
//     }else{
//         res.redirect("back");
//     }
// }



module.exports = router;