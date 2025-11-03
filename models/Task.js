const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Le titre de la tâche est requis'],
        trim: true,
        maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
    },
    description: {
        type: String,
        maxlength: [500, 'La description ne peut pas dépasser 500 caractères'],
        default: ''
    },
    priority: {
        type: String,
        enum: {
            values: ['low', 'medium', 'high'],
            message: 'La priorité doit être : low, medium ou high'
        },
        default: 'medium'
    },
    completed: {
        type: Boolean,
        default: false
    },
    dueDate: {
        type: Date,
        default: null
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'L\'ID utilisateur est requis']
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

// Index pour améliorer les performances
taskSchema.index({ completed: 1 });
taskSchema.index({ createdAt: -1 });

/**
 * Middleware : Mettre à jour updatedAt
 */
taskSchema.pre('findByIdAndUpdate', function (next) {
    this.set({ updatedAt: Date.now() });
    next();
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;