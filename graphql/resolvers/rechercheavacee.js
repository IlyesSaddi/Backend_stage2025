const Device = require('../../models/Device');
const Company = require('../../models/Company');

module.exports = {

    searchDevices: async ({ query }) => {
    const devices = await Device.find({ $text: { $search: query } }).populate('company');
    return devices;
  },

  searchCompanies: async ({ query }) => {
    const companies = await Company.find({ $text: { $search: query } }).populate('devices');
    return companies;
  }
    
  
};
