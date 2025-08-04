const Device = require('../../models/Device');
const Company = require('../../models/Company');
const User = require('../../models/User');

module.exports = {
    createDevice: async ({ deviceInput }, req) => {
  if (!req.isAuth) {
    throw new Error('Not authenticated!');
  }

  const { name, firmware_version, company_name } = deviceInput;

  // Chercher la company par son nom
  const company = await Company.findOne({ name: company_name });
  if (!company) {
    throw new Error('Company not found with name: ' + company_name);
  }

  // Créer le device avec la référence company._id
  const device = new Device({
    name,
    firmware_version,
    company: company._id,
  });

  const createdDevice = await device.save();

  // Peupler la company dans le device avant de retourner
  return createdDevice.populate('company');
},
updateDevice: async (args, req) => {
    if (!req.isAuth) {
      throw new Error('Unauthorized');
    }

    const { deviceId, deviceInput } = args;

    const device = await Device.findById(deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    const user = await User.findById(req.userId).populate('companies');
    if (!user) {
      throw new Error('User not found');
    }

    const allowedCompanies = user.companies.map(c => c._id.toString());

    if (!allowedCompanies.includes(device.company.toString())) {
      throw new Error('Not authorized to update this device');
    }

    if (deviceInput.name) device.name = deviceInput.name;
    if (deviceInput.firmware_version) device.firmware_version = deviceInput.firmware_version;

    if (deviceInput.company_id) {
      const newCompany = await Company.findById(deviceInput.company_id);
      if (!newCompany) {
        throw new Error('New company not found');
      }

      if (!allowedCompanies.includes(deviceInput.company_id)) {
        throw new Error('Not authorized to assign device to this company');
      }

      device.company = deviceInput.company_id;
    }

    await device.save();
    return device.populate('company');
  },

      devices: async (args, req) => {
  console.log("==== NOUVELLE REQUÊTE DEVICE ====");
  console.log("isAuth:", req.isAuth);
  console.log("userId:", req.userId);
  console.log("role:", req.role);

  if (!req.isAuth) {
    throw new Error('Not authenticated!');
  }

  const user = await User.findById(req.userId).populate('companies');
  console.log("USER:", user);

  if (req.role === 'ingenieur') {
    const allDevices = await Device.find().populate('company');
    console.log("Devices (ingenieur):", allDevices.length);
    return allDevices;
  }

  if (!user || !user.companies || user.companies.length === 0) {
    console.log("User has no companies");
    return [];
  }

  const companyIds = user.companies.map(c => c._id);
  const devices = await Device.find({ company: { $in: companyIds } }).populate('company');
  console.log("Devices returned:", devices.length);

  return devices;
},


  createDevice: async ({ deviceInput }, req) => {
    if (!req.isAuth) throw new Error('Not authenticated!');

    const company = await Company.findOne({ name: deviceInput.company_name });
    if (!company) throw new Error('Company not found');

    const device = new Device({
      name: deviceInput.name,
      firmware_version: deviceInput.firmware_version,
      company: company._id,
    });

    await device.save();
    return device.populate('company');
  },

  updateDevice: async ({ deviceId, deviceInput }, req) => {
    if (!req.isAuth) throw new Error('Not authenticated!');

    const user = await User.findById(req.userId).populate('companies');
    const allowedCompanies = user.companies.map(c => c._id.toString());

    const device = await Device.findById(deviceId);
    if (!device) throw new Error('Device not found');

    if (!allowedCompanies.includes(device.company.toString()) && req.role !== 'ingenieur') {
      throw new Error('Not authorized to update this device');
    }

    if (deviceInput.name) device.name = deviceInput.name;
    if (deviceInput.firmware_version) device.firmware_version = deviceInput.firmware_version;
    if (deviceInput.company_id) device.company = deviceInput.company_id;

    await device.save();
    return device.populate('company');
  },

  deleteDeviceByName: async ({ name }, req) => {
    if (!req.isAuth) throw new Error('Not authenticated!');

    const device = await Device.findOne({ name });
    if (!device) throw new Error('Device not found');

    await Device.findByIdAndDelete(device._id);
    return true;
  },

  deleteDeviceByName: async ({ name }, req) => {
  if (!req.isAuth) {
    throw new Error('Not authenticated!');
  }

  // Nettoyer le nom (trim pour enlever espaces)
  const cleanName = name.trim();

  // Recherche insensible à la casse avec RegExp
  const device = await Device.findOne({ name: new RegExp(`^${cleanName}$`, 'i') });
  if (!device) {
    throw new Error('Device not found');
  }

  // Suppression dans Company
  const company = await Company.findById(device.company);
  if (company) {
    company.devices = company.devices.filter(dId => dId.toString() !== device._id.toString());
    await company.save();
  }

  await Device.findByIdAndDelete(device._id);

  return true;
}


};
