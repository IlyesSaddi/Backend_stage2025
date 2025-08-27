const Device = require('../../models/Device');
const Company = require('../../models/Company');
const User = require('../../models/User');

module.exports = {
  // Créer un device
  createDevice: async ({ deviceInput }, req) => {
    if (!req.isAuth) throw new Error('Not authenticated!');

    const { name, firmware_version, company_name } = deviceInput;

    const company = await Company.findOne({ name: company_name });
    if (!company) throw new Error('Company not found');

    const device = new Device({
      name,
      firmware_version,
      company: company._id,
    });

    await device.save();
    return device.populate('company');
  },

  // Mettre à jour un device
  updateDevice: async ({ deviceId, deviceInput }, req) => {
    if (!req.isAuth) throw new Error('Not authenticated!');

    const device = await Device.findById(deviceId);
    if (!device) throw new Error('Device not found');

    const user = await User.findById(req.userId).populate('companies');
    const allowedCompanies = user ? user.companies.map(c => c._id.toString()) : [];

    // Vérification d'autorisation
    if (!allowedCompanies.includes(device.company.toString()) && req.role !== 'ingenieur') {
      throw new Error('Not authorized to update this device');
    }

    if (deviceInput.name) device.name = deviceInput.name;
    if (deviceInput.firmware_version) device.firmware_version = deviceInput.firmware_version;
    if (deviceInput.company_id) device.company = deviceInput.company_id;

    await device.save();
    return device.populate('company');
  },

  // Supprimer un device par son nom
  deleteDeviceByName: async ({ name }, req) => {
    if (!req.isAuth) throw new Error('Not authenticated!');

    const cleanName = name.trim();
    const device = await Device.findOne({ name: new RegExp(`^${cleanName}$`, 'i') });
    if (!device) throw new Error('Device not found');

    // Retirer le device de la company
    const company = await Company.findById(device.company);
    if (company) {
      company.devices = company.devices.filter(dId => dId.toString() !== device._id.toString());
      await company.save();
    }

    await Device.findByIdAndDelete(device._id);
    return true;
  },

  // Récupérer les devices en fonction du rôle
  devices: async (_, req) => {
    if (!req.isAuth) throw new Error('Not authenticated!');

    const user = await User.findById(req.userId).populate('companies');

    // Ingénieur → tous les devices
    if (req.role === 'ingenieur') {
      return Device.find().populate('company');
    }

    // Utilisateur normal → devices de ses companies
    if (!user || !user.companies || user.companies.length === 0) return [];

    const companyIds = user.companies.map(c => c._id);
    return Device.find({ company: { $in: companyIds } }).populate('company');
  }
};
