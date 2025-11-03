const request = require('supertest');
const { app } = require('../server');
const { connectDB, disconnectDB } = require('../db');
const User = require('../models/User');

describe('Authentication Routes', () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await disconnectDB();
    });

    beforeEach(async () => {
        await User.deleteMany({});
    });

    describe('POST /api/auth/register', () => {
        it('devrait créer un nouvel utilisateur', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('userId');
            expect(response.body.username).toBe('testuser');
            expect(response.body.email).toBe('test@example.com');
        });

        it('devrait rejeter les données manquantes', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser'
                });

            expect(response.status).toBe(400);
        });

        it('devrait rejeter un email en doublon', async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'user1',
                    email: 'duplicate@example.com',
                    password: 'password123'
                });

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'user2',
                    email: 'duplicate@example.com',
                    password: 'password456'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('email');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123'
                });
        });

        it('devrait connecter l\'utilisateur', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body.token.split('.').length).toBe(3);
        });

        it('devrait rejeter un mot de passe incorrect', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(400);
        });

        it('devrait rejeter un email inexistant', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/auth/me', () => {
        let token;

        beforeEach(async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123'
                });

            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            token = loginResponse.body.token;
        });

        it('devrait retourner les données de l\'utilisateur connecté', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.username).toBe('testuser');
            expect(response.body.email).toBe('test@example.com');
        });

        it('devrait rejeter sans token', async () => {
            const response = await request(app)
                .get('/api/auth/me');

            expect(response.status).toBe(401);
        });

        it('devrait rejeter un token invalide', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalidtoken');

            expect(response.status).toBe(403);
        });
    });
});