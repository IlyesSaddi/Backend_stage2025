const Company = require('../../models/Company');
const Device = require('../../models/Device');
const User = require('../../models/User'); // ou le chemin correct vers ton modèle User

module.exports = {
  companies: async () => {
    return await Company.find().populate('devices');
  },

  createCompany: async ({ companyInput }) => {
    const newCompany = new Company({
      name: companyInput.name,
      description: companyInput.description,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return await newCompany.save();
  },
  deleteCompany: async ({ companyId }) => {
    try {
      const company = await Company.findById(companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      // Supprimer tous les devices liés à cette company
      await Device.deleteMany({ company: companyId });

      // Supprimer la référence à la company depuis les utilisateurs
      await User.updateMany(
        { companies: companyId },
        { $pull: { companies: companyId } }
      );

      // Supprimer la company elle-même
      await Company.findByIdAndDelete(companyId);

      return true;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
  addCompanyToUser: async ({ userId, companyId }, req) => {
    if (!req.isAuth) {
      throw new Error('Not authenticated!');
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Vérifier si la société existe
    const company = await Company.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    // Éviter les doublons
    if (user.companies.includes(companyId)) {
      throw new Error('Company already assigned to this user');
    }

    // Ajouter la société
    user.companies.push(companyId);
    await user.save();

    // Optionnel : peupler les sociétés dans la réponse
    return await user.populate('companies');
  }
};
