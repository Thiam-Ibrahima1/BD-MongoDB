const Task = require('../models/Task');
const mongoose = require('mongoose');

const taskService = {
    /**
     * Créer une nouvelle tâche
     * @param {string} userId
     * @param {Object} taskData
     * @returns {Promise<Object>}
     */
    createTask: async (userId, taskData) => {
        console.log('Création d\'une nouvelle tâche pour:', userId);

        const newTask = new Task({
            ...taskData,
            userId
        });

        await newTask.save();
        console.log('Tâche créée avec ID:', newTask._id);

        return newTask;
    },

    /**
     * Récupérer toutes les tâches d'un utilisateur
     * @param {string} userId
     * @returns {Promise<Array>}
     */
    getTasksByUserId: async (userId) => {
        console.log('Récupération des tâches pour l\'utilisateur:', userId);
        const tasks = await Task.find({ userId })
            .populate('userId', 'username email')
            .sort({ createdAt: -1 });
        return tasks;
    },

    /**
     * Récupérer une tâche par ID
     * @param {string} taskId
     * @returns {Promise<Object|null>}
     */
    getTaskById: async (taskId) => {
        console.log('Recherche tâche par ID:', taskId);
        const task = await Task.findById(taskId)
            .populate('userId', 'username email');
        return task;
    },

    /**
     * Mettre à jour une tâche
     * @param {string} taskId
     * @param {string} userId
     * @param {Object} updateData
     * @returns {Promise<Object>}
     */
    updateTask: async (taskId, userId, updateData) => {
        console.log('Mise à jour tâche:', taskId);

        // Vérifier que la tâche appartient à l'utilisateur
        const task = await Task.findById(taskId);
        if (!task) {
            throw new Error('Tâche non trouvée');
        }

        if (task.userId.toString() !== userId.toString()) {
            throw new Error('Accès non autorisé - cette tâche ne vous appartient pas');
        }

        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            updateData,
            { new: true, runValidators: true }
        );

        return updatedTask;
    },

    /**
     * Supprimer une tâche
     * @param {string} taskId
     * @param {string} userId
     * @returns {Promise<void>}
     */
    deleteTask: async (taskId, userId) => {
        console.log('Suppression tâche:', taskId);

        // Vérifier que la tâche appartient à l'utilisateur
        const task = await Task.findById(taskId);
        if (!task) {
            throw new Error('Tâche non trouvée');
        }

        if (task.userId.toString() !== userId.toString()) {
            throw new Error('Accès non autorisé - cette tâche ne vous appartient pas');
        }

        await Task.findByIdAndDelete(taskId);
        console.log('Tâche supprimée');
    },

    /**
     * Marquer une tâche comme complétée
     * @param {string} taskId
     * @param {string} userId
     * @returns {Promise<Object>}
     */
    completeTask: async (taskId, userId) => {
        console.log('Marquage tâche comme complétée:', taskId);
        return taskService.updateTask(taskId, userId, { completed: true });
    },

    /**
     * Récupérer les statistiques des tâches
     * @param {string} userId
     * @returns {Promise<Object>}
     */
    getTaskStats: async (userId) => {
        console.log('Récupération statistiques pour:', userId);
        
        const total = await Task.countDocuments({ userId });
        const completed = await Task.countDocuments({ userId, completed: true });
        const pending = total - completed;

        const byPriority = await Task.aggregate([
            { $match: { userId: mongoose.Types.ObjectId.createFromHexString(userId) } },
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);

        return {
            total,
            completed,
            pending,
            completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
            byPriority: byPriority.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {})
        };
    },

    /**
     * Récupérer toutes les tâches
     * @returns {Promise<Array>}
     */
    getAllTasks: async () => {
        console.log('Récupération de toutes les tâches');
        const tasks = await Task.find()
            .populate('userId', 'username email')
            .sort({ createdAt: -1 });
        return tasks;
    }
};

module.exports = taskService;