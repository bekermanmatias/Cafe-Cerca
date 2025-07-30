import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'tu_clave_secreta';

export const autenticarJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token no proporcionado.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Formato de token inválido.' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    console.error('Error en token JWT:', error.message);
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};
