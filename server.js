const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { connectDB } = require('./db');
const userService = require('./services/userService');
const taskService = require('./services/taskService');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY;

// ========== MIDDLEWARE ==========

app.use(express.json());

// ========== CONNEXION À MONGODB ==========

let dbConnected = false;

connectDB().then(() => {
    dbConnected = true;
}).catch(error => {
    console.error('Erreur connexion DB:', error);
    process.exit(1);
});

// ========== ROUTES D'AUTHENTIFICATION ==========

/**
 * POST /api/auth/register - Enregistrer un nouvel utilisateur
 */
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            error: 'Données manquantes',
            message: 'Username, email et password sont requis'
        });
    }

    try {
        const result = await userService.createUser(username, email, password);
        res.status(201).json({
            message: 'Utilisateur créé avec succès',
            ...result
        });
    } catch (error) {
        console.error('Erreur enregistrement:', error.message);
        res.status(400).json({ 
            error: 'Erreur enregistrement',
            message: error.message 
        });
    }
});

/**
 * POST /api/auth/login - Connecter un utilisateur
 */
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            error: 'Email et mot de passe requis' 
        });
    }

    try {
        const user = await userService.findUserByEmail(email);

        if (!user) {
            return res.status(400).json({ 
                error: 'Email ou mot de passe incorrect' 
            });
        }

        const isPasswordCorrect = await userService.verifyPassword(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(400).json({ 
                error: 'Email ou mot de passe incorrect' 
            });
        }

        const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '24h' });

        res.status(200).json({
            message: 'Connecté avec succès',
            token,
            userId: user._id,
            username: user.username,
            email: user.email
        });
    } catch (error) {
        console.error('Erreur login:', error.message);
        res.status(500).json({ 
            error: 'Erreur serveur lors de la connexion' 
        });
    }
});

/**
 * GET /api/auth/me - Récupérer le profil de l'utilisateur connecté
 */
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await userService.findUserById(req.userId);

        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        res.status(200).json({
            id: user._id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    } catch (error) {
        console.error('Erreur récupération profil:', error.message);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ========== ROUTES DES TÂCHES ==========

/**
 * POST /api/tasks - Créer une nouvelle tâche
 */
app.post('/api/tasks', authenticateToken, async (req, res) => {
    const { title, description, priority, dueDate } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Le titre est requis' });
    }

    try {
        const taskData = {
            title,
            description: description || '',
            priority: priority || 'medium',
            dueDate: dueDate || null
        };

        const task = await taskService.createTask(req.userId, taskData);
        res.status(201).json(task);
    } catch (error) {
        console.error('Erreur création tâche:', error.message);
        res.status(400).json({ error: error.message });
    }
});

/**
 * GET /api/tasks - Récupérer toutes les tâches de l'utilisateur
 */
app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const tasks = await taskService.getTasksByUserId(req.userId);
        res.status(200).json({
            count: tasks.length,
            tasks
        });
    } catch (error) {
        console.error('Erreur récupération tâches:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/tasks/:id - Récupérer une tâche par ID
 */
app.get('/api/tasks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const task = await taskService.getTaskById(id);

        if (!task) {
            return res.status(404).json({ error: 'Tâche non trouvée' });
        }

        if (task.userId._id.toString() !== req.userId) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }

        res.status(200).json(task);
    } catch (error) {
        console.error('Erreur récupération tâche:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/tasks/:id - Mettre à jour une tâche
 */
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, description, priority, completed, dueDate } = req.body;

    try {
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (priority !== undefined) updateData.priority = priority;
        if (completed !== undefined) updateData.completed = completed;
        if (dueDate !== undefined) updateData.dueDate = dueDate;

        const task = await taskService.updateTask(id, req.userId, updateData);
        res.status(200).json(task);
    } catch (error) {
        console.error('Erreur mise à jour tâche:', error.message);

        if (error.message.includes('non trouvée')) {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('non autorisé')) {
            return res.status(403).json({ error: error.message });
        }

        res.status(400).json({ error: error.message });
    }
});

/**
 * DELETE /api/tasks/:id - Supprimer une tâche
 */
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        await taskService.deleteTask(id, req.userId);
        res.status(200).json({ message: 'Tâche supprimée avec succès' });
    } catch (error) {
        console.error('Erreur suppression tâche:', error.message);

        if (error.message.includes('non trouvée')) {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('non autorisé')) {
            return res.status(403).json({ error: error.message });
        }

        res.status(400).json({ error: error.message });
    }
});

/**
 * GET /api/tasks/stats/overview - Récupérer les statistiques
 */
app.get('/api/tasks/stats/overview', authenticateToken, async (req, res) => {
    try {
        const stats = await taskService.getTaskStats(req.userId);
        res.status(200).json(stats);
    } catch (error) {
        console.error('Erreur statistiques:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ========== ROUTES DE SANTÉ ==========

/**
 * GET /health - Vérifier l'état du serveur
 */
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Serveur en bon état',
        database: dbConnected ? 'Connectée' : 'Déconnectée',
        timestamp: new Date().toISOString()
    });
});

/**
 * GET / - Route racine
 */
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Bienvenue sur l\'API Feveo',
        version: '1.0.0',
        endpoints: {
            auth: [
                'POST /api/auth/register',
                'POST /api/auth/login',
                'GET /api/auth/me'
            ],
            tasks: [
                'GET /api/tasks',
                'POST /api/tasks',
                'GET /api/tasks/:id',
                'PUT /api/tasks/:id',
                'DELETE /api/tasks/:id',
                'GET /api/tasks/stats/overview'
            ]
        }
    });
});

// ========== GESTION DES ERREURS ==========

/**
 * Route non trouvée (404)
 */
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Route non trouvée',
        path: req.originalUrl,
        method: req.method
    });
});

/**
 * Gestionnaire d'erreurs global
 */
app.use((error, req, res, next) => {
    console.error('Erreur serveur:', error);
    res.status(500).json({ 
        error: 'Erreur serveur interne',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
    });
});

// ========== DÉMARRAGE DU SERVEUR ==========

const server = app.listen(PORT, () => {
    console.log(`
    Serveur en écoute sur http://localhost:${PORT}`);
    console.log(`GET http://localhost:${PORT}/health - État du serveur`);
    console.log(`GET http://localhost:${PORT}/ - Documentation de l'API
`);
});

module.exports = { app, server };