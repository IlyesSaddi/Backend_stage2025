const User = require('../../models/User');
const Company = require('../../models/Company');

module.exports = {
  // ... autres resolvers
addCompanyToUser: async ({ userId, companyId }, req) => {
  if (!req.isAuth) {
    throw new Error('Not authenticated!');
  }

  // Chercher la company
  const company = await Company.findById(companyId);
  if (!company) {
    throw new Error('Company not found');
  }

  // Si l'utilisateur connecté est un admin, il ne peut ajouter que des sociétés qu’il possède
  if (req.role === 'admin') {
    const adminUser = await User.findById(req.userId).populate('companies');

    const adminCompanyIds = adminUser.companies.map(c => c._id.toString());

    if (!adminCompanyIds.includes(companyId.toString())) {
      throw new Error('You are not authorized to assign this company');
    }
  }

  // L'utilisateur cible à modifier
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Ajouter la company si elle n’est pas déjà liée
  if (!user.companies.includes(companyId)) {
    user.companies.push(companyId);
    await user.save();
  }

  return user.populate('companies');
},
removeCompanyFromUser: async ({ userId, companyId }, req) => {
  if (!req.isAuth) {
    throw new Error('Not authenticated!');
  }

  const requester = await User.findById(req.userId);
  if (!requester) {
    throw new Error('Authenticated user not found.');
  }

  // Admin check: must own the company they're removing from
  if (requester.role === 'admin' && !requester.companies.includes(companyId)) {
    throw new Error('You are not authorized to remove users from this company.');
  }

  // Ingénieur peut retirer n'importe qui
  if (!['admin', 'ingenieur'].includes(requester.role)) {
    throw new Error('You are not authorized to perform this action.');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  user.companies = user.companies.filter(c => c.toString() !== companyId);
  await user.save();

  return user.populate('companies');
}

};
