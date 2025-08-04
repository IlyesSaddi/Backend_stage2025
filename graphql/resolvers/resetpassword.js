const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const nodemailer = require('nodemailer');

module.exports = {
  requestPasswordReset: async (args) => {
    const { email } = args;
    console.log('Email reçu:', email); // debug check

    const user = await User.findOne({ email });
    console.log('User trouvé:', user);

    if (!user) throw new Error("User not found.");

    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000; // 1h
    await user.save();

    // transporter email (tu peux utiliser Gmail ou Mailtrap)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      logger: true,
        debug: true
    });
    console.log('EMAIL_USER =', process.env.EMAIL_USER);
    console.log('EMAIL_PASS =', process.env.EMAIL_PASS ? '*****' : 'NOT SET');

    await transporter.sendMail({
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset',
      html: `<p>Click <a href="http://localhost:5173/reset-password/${token}">here</a> to reset your password.</p>`
    });

    return { message: 'Email sent.' };
  },

  resetPassword: async (args) => {
  const { token, newPassword } = args;  // <-- ajoute cette ligne

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() }
  });

  if (!user) throw new Error('Token invalid or expired.');

  user.password = await bcrypt.hash(newPassword, 12);
  user.resetToken = null;
  user.resetTokenExpiration = null;
  await user.save();

  return { message: 'Password reset successful.' };
}

};
