const mongoose = require('mongoose');

const Schema = mongoose.Schema; // schema mt3 bdd


const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role:{
        type: String,
        required: true
    },
    companies: [
    {     // here we aded ids not objects. these object ids from Event model 
        type: Schema.Types.ObjectId,
        ref: 'Company'

    }
    ],

    resetToken: String,
    resetTokenExpiration: Date,

      
});

module.exports=mongoose.model('User', userSchema);