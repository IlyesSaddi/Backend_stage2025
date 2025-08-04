const deviceResolver = require('./Devices');
const companyResolver = require('./Companies');
const userResolver = require('./Users');
const historyResolver = require('./History');
const resetPasswordResolver = require('./resetpassword');
const devicesCountPerCompanyResolver = require('./devicesCountPerCompany ');
const rechercheavanceResolver = require('./rechercheavacee');
const companytouser = require('./companytouser');
const updateuserrole = require('./updateuserrole');

module.exports = {
  ...deviceResolver,
  ...companyResolver,
  ...userResolver,
  ...historyResolver,
  ...resetPasswordResolver,
  ...devicesCountPerCompanyResolver,
  ...rechercheavanceResolver,
  ...companytouser,
  ...updateuserrole,

};
