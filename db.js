const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('ERREUR: MONGODB_URI n\'est pas défini dans .env');
    process.exit(1);
}

const connectDB = async () => {
    try {
        console.log('Connexion à MongoDB Atlas en cours...');
        
        // Connexion sans les options deprecated
        await mongoose.connect(MONGODB_URI);
        
        console.log('Connecté à MongoDB Atlas');
        
        
        const dbName = mongoose.connection.name;
        console.log(`Base de données: ${dbName}`);
        console.log('Base de données connectée');
        
        return mongoose.connection;
    } catch (error) {
        console.error('Erreur connexion MongoDB:', error.message);
        process.exit(1);
    }
};

const disconnectDB = async () => {
    try {
        await mongoose.disconnect();
        console.log('Déconnecté de MongoDB');
    } catch (error) {
        console.error('Erreur déconnexion:', error.message);
        process.exit(1);
    }
};

module.exports = { connectDB, disconnectDB };