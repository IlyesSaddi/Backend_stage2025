const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

module.exports = {
  users: async () => {
    return await User.find().populate('companies');
  },

  createUser: async ({ userInput }) => {
    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) throw new Error('User already exists');

    const hashedPassword = await bcrypt.hash(userInput.password, 12);

    // Générer un token de confirmation aléatoire
    const confirmationToken = crypto.randomBytes(32).toString('hex');

    const user = new User({
      email: userInput.email,
      password: hashedPassword,
      role: userInput.role,
      isConfirmed: false,
      confirmationToken
    });

    await user.save();

    // Configurer un transporteur mail (exemple Gmail)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,   // ⚠️ remplace
        pass: process.env.EMAIL_PASS         // ⚠️ remplace (ou app password Gmail)
      }
    });

    // Lien de confirmation
    const confirmUrl = `http://localhost:8000/confirm/${confirmationToken}`;

    await transporter.sendMail({
      from: '"Device Speak" <tonemail@gmail.com>',
      to: user.email,
      subject: 'Confirmation de compte',
      html: `<p>Bienvenue ! Cliquez sur ce lien pour confirmer votre compte :</p>
             <a href="${confirmUrl}">${confirmUrl}</a>`
    });

    return { ...user._doc, password: null }; // retourne l’utilisateur sans mdp
  },

  // Nouvelle mutation : confirmation
  confirmUser: async ({ token }) => {
    const user = await User.findOne({ confirmationToken: token });
    if (!user) throw new Error('Invalid token');

    user.isConfirmed = true;
    user.confirmationToken = null;
    await user.save();

    return { message: "Compte confirmé avec succès !" };
  },

  login: async ({ email, password }) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isConfirmed) {
      // Throwing inside try/catch ensures GraphQL can format the error properly
      throw new Error("Veuillez confirmer votre compte par email avant de vous connecter.");
    }

    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      throw new Error('Incorrect password');
    }

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
  } catch (err) {
    console.error("Login error:", err); // log it for debugging
    // Throw a GraphQL-friendly error
    throw new Error(err.message || "Internal server error");
  }
},
  resendConfirmationEmail: async ({ email }) => {
  try {
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found");
    if (user.isConfirmed) throw new Error("User already confirmed");

    const confirmationToken = crypto.randomBytes(32).toString('hex');
    user.confirmationToken = confirmationToken;
    await user.save();

    console.log("Sending email to:", user.email);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const confirmUrl = `http://localhost:8000/confirm/${confirmationToken}`;

    await transporter.sendMail({
      from: `"Device Speak" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Confirmation de compte - Nouveau lien',
      html: `<p>Voici votre nouveau lien pour confirmer votre compte :</p>
             <a href="${confirmUrl}">${confirmUrl}</a>`
    });

    console.log("Email sent successfully");

    return { message: "✅ Nouveau mail de confirmation envoyé !" };
  } catch (err) {
    console.error("resendConfirmationEmail error:", err);
    throw new Error(err.message);
  }
}


};
