const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET_KEY = process.env.SECRET_KEY;

/**
 * Middleware : Vérifier le token JWT
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ 
            error: 'Token d\'accès requis',
            message: 'Veuillez fournir un token JWT'
        });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({ 
                error: 'Token expiré',
                message: 'Veuillez vous reconnecter'
            });
        }
        res.status(403).json({ 
            error: 'Token invalide',
            message: error.message 
        });
    }
};

module.exports = { authenticateToken };