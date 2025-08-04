

const mongoose = require('mongoose');

const Schema = mongoose.Schema; // schema mt3 bdd


const HistorySchema = new Schema({
    device: {
        type: Schema.Types.ObjectId, 
        ref: 'Device'
    },
    adress: {
        type: String,
        required: true
    },
    vehicule_status: {
        type: String,
        required: true
    },
    gprs_signal: {
        type: String,
        required: true
    },
    data_time: {
        type: Date,
        required: true
    },
    hourmetre: {
        type: String,
        required: true
    }

      
});

module.exports=mongoose.model('History', HistorySchema);