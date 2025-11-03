const User = require('../models/User');
const bcrypt = require('bcryptjs');

const userService = {
    /**
     * Créer un nouvel utilisateur
     * @param {string} username
     * @param {string} email
     * @param {string} password
     * @returns {Promise<Object>}
     */
    createUser: async (username, email, password) => {
        console.log('Création d\'un nouvel utilisateur:', username);

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            if (existingUser.email === email) {
                throw new Error('Cet email est déjà utilisé');
            }
            if (existingUser.username === username) {
                throw new Error('Nom d\'utilisateur déjà pris');
            }
        }

        // Créer et sauvegarder le nouvel utilisateur
        const newUser = new User({
            username,
            email,
            password
        });

        await newUser.save();
        console.log('Utilisateur créé avec ID:', newUser._id);

        return {
            userId: newUser._id,
            username: newUser.username,
            email: newUser.email,
            createdAt: newUser.createdAt
        };
    },

    /**
     * Trouver un utilisateur par email
     * @param {string} email
     * @returns {Promise<Object|null>}
     */
    findUserByEmail: async (email) => {
        console.log('Recherche utilisateur par email:', email);
        const user = await User.findOne({ email }).select('+password');
        return user;
    },

    /**
     * Trouver un utilisateur par ID
     * @param {string} userId
     * @returns {Promise<Object|null>}
     */
    findUserById: async (userId) => {
        console.log('Recherche utilisateur par ID:', userId);
        const user = await User.findById(userId);
        return user;
    },

    /**
     * Vérifier le mot de passe
     * @param {string} passwordPlain - Mot de passe en clair
     * @param {string} passwordHashed - Mot de passe haché
     * @returns {Promise<boolean>}
     */
    verifyPassword: async (passwordPlain, passwordHashed) => {
        const isMatch = await bcrypt.compare(passwordPlain, passwordHashed);
        return isMatch;
    },

    /**
     * Mettre à jour un utilisateur
     * @param {string} userId
     * @param {Object} updateData
     * @returns {Promise<Object>}
     */
    updateUser: async (userId, updateData) => {
        console.log('Mise à jour utilisateur:', userId);
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        );
        return updatedUser;
    },

    /**
     * Supprimer un utilisateur
     * @param {string} userId
     * @returns {Promise<void>}
     */
    deleteUser: async (userId) => {
        console.log('Suppression utilisateur:', userId);
        await User.findByIdAndDelete(userId);
        console.log('Utilisateur supprimé');
    },

    /**
     * Récupérer tous les utilisateurs
     * @returns {Promise<Array>}
     */
    getAllUsers: async () => {
        console.log('Récupération de tous les utilisateurs');
        const users = await User.find().select('-password');
        return users;
    }
};

module.exports = userService;