const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Le nom d\'utilisateur est requis'],
        unique: true,
        trim: true,
        minlength: [3, 'Le nom doit contenir au moins 3 caractères'],
        maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
    },
    email: {
        type: String,
        required: [true, 'L\'email est requis'],
        unique: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Veuillez fournir un email valide'
        ]
    },
    password: {
        type: String,
        required: [true, 'Le mot de passe est requis'],
        minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
        select: false 
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

/**
 * Hacher le mot de passe AVANT de sauvegarder
 */
userSchema.pre('save', async function (next) {
    // Ne hacher que si le password a été modifié
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        console.log('Mot de passe haché avec succès');
        next();
    } catch (error) {
        console.error('Erreur lors du hachage:', error.message);
        next(error);
    }
});

/**
 * Mettre à jour updatedAt
 */
userSchema.pre('findByIdAndUpdate', function (next) {
    this.set({ updatedAt: Date.now() });
    next();
});

/**
 * Relation avec les tâches
 */
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'userId'
});

const User = mongoose.model('User', userSchema);

module.exports = User;