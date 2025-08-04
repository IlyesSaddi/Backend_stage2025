
const User = require('../../models/User');


module.exports = {
  updateUserRole: async ({ userId, newRole }, req) => {
  if (!req.isAuth || req.role !== 'ingenieur') {
    throw new Error('Unauthorized – only ingenieur can update roles');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.role = newRole;
  await user.save();

  return user;
}


};
