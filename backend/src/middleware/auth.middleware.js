import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'supersecreto';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('🔐 Auth header:', authHeader);
  
  if (!authHeader) {
    console.log('❌ No se proporcionó header de autorización');
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];
  console.log('🔐 Token extraído:', token ? `${token.substring(0, 20)}...` : 'null');

  if (!token) {
    console.log('❌ No se pudo extraer el token del header');
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    console.log('✅ Token verificado correctamente, usuario ID:', decoded.id);
    req.user = decoded; // { id: userId }
    next();
  } catch (error) {
    console.error('❌ Error verificando token:', error);
    return res.status(401).json({ error: 'Token inválido' });
  }
}; 