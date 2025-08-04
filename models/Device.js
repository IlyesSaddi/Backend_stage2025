const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const deviceSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    firmware_version: {
        type: String,
        required: true
    },
    company: {
        type: Schema.Types.ObjectId, 
        ref: 'Company'
    }
}, {
    timestamps: true  // ✅ Ceci est à mettre ici, en 2e argument de Schema
});

deviceSchema.index({ name: 'text', firmware_version: 'text' });
module.exports = mongoose.model('Device', deviceSchema);
