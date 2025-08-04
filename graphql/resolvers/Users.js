const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = {
  users: async () => {
    return await User.find().populate('companies');
  },

  createUser: async ({ userInput }) => {
    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) throw new Error('User already exists');
    const hashedPassword = await bcrypt.hash(userInput.password, 12);
    const user = new User({
      email: userInput.email,
      password: hashedPassword,
      role: userInput.role,
    });
    return await user.save();
  },

  login: async ({ email, password }) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) throw new Error('Incorrect password');

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      'SUPER_SECRET_KEY',
      { expiresIn: '1h' }
    );

    return {
      userId: user._id,
      token,
      tokenExpiration: 1,
      role: user.role,
    };
  },
};
