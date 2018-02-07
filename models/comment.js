var mongoose = require("mongoose");

var commentSchema = mongoose.Schema({
    text: String,
    createdAt: { type: Date, default: Date.now },
    author: {
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        username: String      // can only do with a non-relational database like Mongo
    }
});

{
    
}

module.exports = mongoose.model("Comment", commentSchema);