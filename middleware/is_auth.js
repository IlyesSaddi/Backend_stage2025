const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  console.log('Incoming request headers:', req.headers);
  const authHeader = req.get('authorization');
  console.log('Auth Header:', authHeader);
  
  if (!authHeader) {
    req.isAuth = false;
    console.log('No auth header');
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token || token === '') {
    req.isAuth = false;
    console.log('No token found');
    return next();
  }

  try {
    const decodedToken = jwt.verify(token, 'SUPER_SECRET_KEY');
    req.isAuth = true;
    req.userId = decodedToken.userId;
    req.role = decodedToken.role;
    console.log('Token valid, userId:', req.userId, 'role:', req.role);
  } catch (err) {
    req.isAuth = false;
    console.log('Token invalid');
  }

  next();
};
