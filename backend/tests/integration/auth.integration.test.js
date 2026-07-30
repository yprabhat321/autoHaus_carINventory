const request = require('supertest');
process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

const createApp = require('../../src/app');
const { connect, closeDatabase, clearDatabase } = require('../setup/mongoMemoryServer');

const app = createApp();

beforeAll(async () => connect());
afterEach(async () => clearDatabase());
afterAll(async () => closeDatabase());

describe('Auth API', () => {
  const validUser = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'password123',
  };

  describe('POST /api/auth/register', () => {
    it('registers a new user and returns a token', async () => {
      const res = await request(app).post('/api/auth/register').send(validUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toEqual(expect.any(String));
      expect(res.body.data.user.email).toBe(validUser.email);
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.user.role).toBe('customer');
    });

    it('rejects registration when required fields are missing', async () => {
      const res = await request(app).post('/api/auth/register').send({ email: 'a@a.com' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects duplicate email registration', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      const res = await request(app).post('/api/auth/register').send(validUser);

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('does not allow public registration to claim the admin role', async () => {
      const res = await request(app).post('/api/auth/register').send({ ...validUser, email: 'role@example.com', role: 'admin' });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.user.role).toBe('customer');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validUser);
    });

    it('logs in with correct credentials and returns a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.token).toEqual(expect.any(String));
    });

    it('rejects an incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'wrongpassword' });

      expect(res.statusCode).toBe(401);
    });

    it('rejects a login for an email that does not exist', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' });

      expect(res.statusCode).toBe(401);
    });
  });
});
