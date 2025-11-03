const request = require('supertest');
const { app } = require('../server');
const { connectDB, disconnectDB } = require('../db');
const User = require('../models/User');
const Task = require('../models/Task');

let token;
let userId;

describe('Tasks Routes', () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await disconnectDB();
    });

    beforeEach(async () => {
        await User.deleteMany({});
        await Task.deleteMany({});

        // Créer un utilisateur et obtenir un token
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });

        userId = registerResponse.body.userId;

        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });

        token = loginResponse.body.token;
    });

    describe('POST /api/tasks', () => {
        it('devrait créer une nouvelle tâche', async () => {
            const response = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: 'Ma première tâche',
                    description: 'Tester MongoDB',
                    priority: 'high'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('_id');
            expect(response.body.title).toBe('Ma première tâche');
            expect(response.body.priority).toBe('high');
            expect(response.body.completed).toBe(false);
        });

        it('devrait rejeter une tâche sans titre', async () => {
            const response = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    description: 'Pas de titre'
                });

            expect(response.status).toBe(400);
        });

        it('devrait rejeter sans authentification', async () => {
            const response = await request(app)
                .post('/api/tasks')
                .send({
                    title: 'Tâche sans auth'
                });

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/tasks', () => {
        it('devrait récupérer toutes les tâches', async () => {
            await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Tâche 1' });

            await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Tâche 2' });

            const response = await request(app)
                .get('/api/tasks')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.count).toBe(2);
            expect(response.body.tasks.length).toBe(2);
        });
    });

    describe('PUT /api/tasks/:id', () => {
        it('devrait mettre à jour une tâche', async () => {
            const createResponse = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Tâche à modifier' });

            const taskId = createResponse.body._id;

            const response = await request(app)
                .put(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ 
                    title: 'Tâche modifiée',
                    completed: true 
                });

            expect(response.status).toBe(200);
            expect(response.body.title).toBe('Tâche modifiée');
            expect(response.body.completed).toBe(true);
        });
    });

    describe('DELETE /api/tasks/:id', () => {
        it('devrait supprimer une tâche', async () => {
            const createResponse = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Tâche à supprimer' });

            const taskId = createResponse.body._id;

            const response = await request(app)
                .delete(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);

            // Vérifier que la tâche est bien supprimée
            const getResponse = await request(app)
                .get(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(getResponse.status).toBe(404);
        });
    });

    describe('GET /api/tasks/stats/overview', () => {
        it('devrait retourner les statistiques', async () => {
            await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Tâche complétée', completed: true });

            await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Tâche en cours' });

            const response = await request(app)
                .get('/api/tasks/stats/overview')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.total).toBe(2);
            expect(response.body.completed).toBe(1);
            expect(response.body.pending).toBe(1);
        });
    });
});