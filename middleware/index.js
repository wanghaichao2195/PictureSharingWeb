var middlewareObj={};// or you can put those two functions directly into this{}
var Campground = require("../models/campground");
var Comment = require("../models/comment");

middlewareObj.checkCampgroundOwnership = function(req, res, next){
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, function(err, foundCampground){//this req.params.id==:id
            if(err){
                res.redirect("back");
            }else{
                // does user own the campground?
                //foundCampground.author.id is a mongoose object but req.user._id is a string
                if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){
                    next();
                }else{
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
                
            }
        });
    }else{
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
}

middlewareObj.checkCommentOwnership = function(req, res, next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){//this req.params.id==:id
            if(err){
                req.flash("error", "Campground not found");
                res.redirect("back");
            }else{
                // does user own the comment?
                if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){//req.user._id stored in passport
                    next();
                }else{
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
                
            }
        });
    }else{
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
}


middlewareObj.isLoggedIn = function (req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to do that");  // for the next request key=error, value=Pl.....
    res.redirect("/login");// just put this function in the middleware other functions 
}


module.exports = middlewareObj;//or ={...} where functions inside