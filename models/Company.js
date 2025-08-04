

const mongoose = require('mongoose');

const Schema = mongoose.Schema; // schema mt3 bdd


const companySchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  devices: [{
    type: Schema.Types.ObjectId,
    ref: 'Device'
  }]
}, {
  timestamps: true  // ✅ ici en dehors du bloc des champs, c’est une option !
});

companySchema.index({ name: 'text', description: 'text' });


module.exports=mongoose.model('Company', companySchema);