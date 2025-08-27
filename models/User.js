const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true, // chaque email doit être unique
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
        {     
            type: Schema.Types.ObjectId,
            ref: 'Company'
        }
    ],
    resetToken: String,
    resetTokenExpiration: Date,

    // Nouveaux champs pour confirmation email
    isConfirmed: {
        type: Boolean,
        default: false
    },
    confirmationToken: {
        type: String
    }
});

module.exports = mongoose.model('User', userSchema);
