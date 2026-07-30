// Mongoose models don't auto-mock cleanly (their internal schema/virtual
// machinery confuses jest's automocker), so we provide an explicit,
// minimal factory exposing only the static methods the controller uses.
jest.mock('../../src/models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../../src/utils/generateToken');

const User = require('../../src/models/User');
const generateToken = require('../../src/utils/generateToken');
const { register, login } = require('../../src/controllers/authController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authController (unit, mocked model)', () => {
  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('creates a user and returns 201 with a token', async () => {
      const req = { body: { name: 'Jane', email: 'jane@example.com', password: 'secret123' } };
      const res = mockRes();
      const next = jest.fn();

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ _id: '1', email: 'jane@example.com', role: 'user' });
      generateToken.mockReturnValue('signed.jwt.token');

      await register(req, res, next);

      expect(User.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ token: 'signed.jwt.token' }) })
      );
    });

    it('rejects registration when a field is missing', async () => {
      const next = jest.fn();

      await register({ body: { email: 'a@a.com' } }, mockRes(), next);

      expect(User.create).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('rejects registration for a duplicate email', async () => {
      User.findOne.mockResolvedValue({ _id: 'existing' });
      const next = jest.fn();

      await register(
        { body: { name: 'Jane', email: 'jane@example.com', password: 'secret123' } },
        mockRes(),
        next
      );

      expect(User.create).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409 }));
    });

    it('never accepts an admin role from public registration', async () => {
      const req = { body: { name: 'Jane', email: 'jane@example.com', password: 'secret123' } };
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ _id: '1' });
      generateToken.mockReturnValue('token');

      await register(req, mockRes(), jest.fn());

      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'customer' }));
    });
  });

  describe('login', () => {
    it('logs in successfully with correct credentials', async () => {
      const comparePassword = jest.fn().mockResolvedValue(true);
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ comparePassword, role: 'user' }) });
      generateToken.mockReturnValue('signed.jwt.token');

      const res = mockRes();
      await login({ body: { email: 'jane@example.com', password: 'secret123' } }, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('rejects login for a non-existent user', async () => {
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      const next = jest.fn();

      await login({ body: { email: 'nobody@example.com', password: 'x' } }, mockRes(), next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('rejects login for an incorrect password', async () => {
      const comparePassword = jest.fn().mockResolvedValue(false);
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ comparePassword }) });
      const next = jest.fn();

      await login({ body: { email: 'jane@example.com', password: 'wrong' } }, mockRes(), next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });
});
