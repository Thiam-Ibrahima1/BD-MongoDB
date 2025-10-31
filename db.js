const mongoose = require('mongoose');

// Récupère l'URL de connexion depuis les variables d'environnement
const DB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log('Connexion à MongoDB réussie !');
    } catch (error) {
        console.error('Échec de la connexion à MongoDB:', error);
        process.exit(1); // Arrête l'application en cas d'échec de connexion
    }
};

module.exports = connectDB;