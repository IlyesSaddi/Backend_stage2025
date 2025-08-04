const History = require('../../models/history');
const Device = require('../../models/Device');

module.exports = {
  histories: async (args, req) => {
    if (!req.isAuth) {
      throw new Error('Not authenticated!');
    }
    // ici tu peux ajouter filtre selon rôle / user/company
    return await History.find().populate('device');
  },

 createHistory: async ({ historyInput }, req) => {
  if (!req.isAuth) {
    throw new Error('Not authenticated!');
  }

  // Allow only admin or engineer to add history
  if (req.role !== 'admin' && req.role !== 'ingenieur') {
    throw new Error('Not authorized!');
  }

  const device = await Device.findById(historyInput.device_id);
  if (!device) {
    throw new Error('Device not found');
  }

  // Optionally: Check if admin's company matches device's company
  if (req.role === 'admin') {
    const company = await Company.findById(device.company);
    if (!company || company._id.toString() !== req.companyId) {
      throw new Error('Not authorized to add history for this device');
    }
  }

  const newHistory = new History({
    device: device._id,
    adress: historyInput.adress,
    vehicule_status: historyInput.vehicule_status,
    gprs_signal: historyInput.gprs_signal,
    data_time: new Date(historyInput.data_time),
    hourmetre: historyInput.hourmetre,
  });

  const savedHistory = await newHistory.save();
  return savedHistory.populate('device');
}
};
