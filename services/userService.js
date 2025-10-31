const User = require('../models/User');
const bcrypt = require('bcryptjs'); 

// Fonction pour trouver un utilisateur par son nom d'utilisateur
async function findUserByUsername(username) {
    return await User.findOne({ username });
}

// Fonction pour trouver un utilisateur par son email
async function findUserByEmail(email) {
    return await User.findOne({ email });
}

async function findUserById(id) {
    return await User.findById(id);
}

async function createUser(username, email, password) {
    try {
        // Créer l'utilisateur avec le mot de passe
        const newUser = new User({ 
            username, 
            email, 
            password  
        });
        
        await newUser.save();
        return newUser;
    } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur:', error);
        throw error;
    }
}

module.exports = {
    findUserByUsername,
    findUserByEmail,
    findUserById,
    createUser
};