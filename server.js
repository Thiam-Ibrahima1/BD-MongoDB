require('dotenv').config(); // Charge les variables d'environnement du fichier .env
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const connectDB = require('./db');

// Import des nouveaux services basés sur Mongoose
const userService = require('./services/userService');
const taskService = require('./services/taskService');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY;

// Connecter à la base de données
connectDB();

app.use(bodyParser.json());

// Middleware d'authentification JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ error: 'Token d\'accès requis' });    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            console.error("Erreur de vérification du token:", err);
            return res.status(403).json({ error: 'Token invalide ou expiré' });
        }
        req.user = user; 
    });
};

// Routes d'authentification
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;    
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
    }

    try {

        const existingUserByUsername = await userService.findUserByUsername(username);
        const existingUserByEmail = await userService.findUserByEmail(email);
        if (existingUserByUsername || existingUserByEmail) {
            return res.status(400).json({ error: 'Nom d\'utilisateur ou email déjà existant' });
        }

        const newUser = await userService.createUser(username, email, password);
        // Ne pas renvoyer le mot de passe haché
        res.status(201).json({ message: 'Utilisateur créé avec succès', userId: newUser._id, username: newUser.username, email: newUser.email });
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, email, password } = req.body;

    if (!email || !password) { 
        return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    try {
        const user = await userService.findUserByEmail(email); 
        if (!user) {
            return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
        }

        const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '1h' });
        res.status(200).json({ message: 'Connecté', token });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await userService.findUserById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        res.status(200).json({ id: user._id, username: user.username, email: user.email }); 
    } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération du profil' });
    }
});

// Routes des tâches
app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const tasks = await taskService.getTasksForUser(req.user.userId);
        res.status(200).json(tasks);
    } catch (error) {
        console.error('Erreur lors de la récupération des tâches:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des tâches' });
    }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
    const { title, description, priority, dueDate } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Le titre de la tâche est requis.' });
    }

    try {
        const newTask = await taskService.createTask(title, description, priority, dueDate, req.user.userId);
        res.status(201).json(newTask);
    } catch (error) {
        console.error('Erreur lors de la création de la tâche:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la création de la tâche' });
    }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
        const updatedTask = await taskService.updateTask(id, updateData);        
        if (!updatedTask) {
            return res.status(404).json({ error: 'Tâche non trouvée' });
        }
        res.status(200).json(updatedTask);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la tâche:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la mise à jour de la tâche' });
    }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await taskService.deleteTask(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Tâche non trouvée' });
        }
        res.status(200).json({ message: 'Tâche supprimée' });
    } catch (error) {
        console.error('Erreur lors de la suppression de la tâche:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la suppression de la tâche' });
    }
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});