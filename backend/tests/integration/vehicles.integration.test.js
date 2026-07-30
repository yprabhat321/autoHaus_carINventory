const request = require('supertest');
process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

const createApp = require('../../src/app');
const User = require('../../src/models/User');
const { connect, closeDatabase, clearDatabase } = require('../setup/mongoMemoryServer');

const app = createApp();
let customerToken;
let adminToken;

const customer = { name: 'Test Customer', email: 'customer@example.com', password: 'password123' };
const sampleVehicle = {
  make: 'Toyota', model: 'Corolla', category: 'Sedan', year: 2023,
  fuelType: 'Petrol', transmission: 'Automatic', price: 22000, quantity: 5,
};

const createVehicle = (payload = sampleVehicle) => request(app)
  .post('/api/vehicles')
  .set('Authorization', `Bearer ${adminToken}`)
  .send(payload);

beforeAll(async () => connect());
afterAll(async () => closeDatabase());

beforeEach(async () => {
  await clearDatabase();
  const customerResponse = await request(app).post('/api/auth/register').send(customer);
  customerToken = customerResponse.body.data.token;
  await User.create({ name: 'Test Admin', email: 'admin@example.com', password: 'Admin@123', role: 'admin' });
  const adminResponse = await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'Admin@123' });
  adminToken = adminResponse.body.data.token;
});

describe('Vehicle API with role-based access', () => {
  it('rejects anonymous requests and lets customers browse inventory', async () => {
    const anonymous = await request(app).get('/api/vehicles');
    expect(anonymous.statusCode).toBe(401);

    await createVehicle();
    const listed = await request(app).get('/api/vehicles').set('Authorization', `Bearer ${customerToken}`);
    expect(listed.statusCode).toBe(200);
    expect(listed.body.data).toHaveLength(1);
    expect(listed.body.pagination).toEqual(expect.objectContaining({ total: 1, page: 1 }));
  });

  it('forbids customers from all inventory management actions', async () => {
    const created = await createVehicle();
    const id = created.body.data._id;
    const customerRequests = await Promise.all([
      request(app).post('/api/vehicles').set('Authorization', `Bearer ${customerToken}`).send(sampleVehicle),
      request(app).put(`/api/vehicles/${id}`).set('Authorization', `Bearer ${customerToken}`).send({ price: 100 }),
      request(app).delete(`/api/vehicles/${id}`).set('Authorization', `Bearer ${customerToken}`),
      request(app).post(`/api/vehicles/${id}/restock`).set('Authorization', `Bearer ${customerToken}`).send({ quantity: 1 }),
    ]);
    customerRequests.forEach((response) => expect(response.statusCode).toBe(403));
  });

  it('lets an admin add, update, restock, and delete a vehicle', async () => {
    const created = await createVehicle();
    expect(created.statusCode).toBe(201);
    const id = created.body.data._id;

    const updated = await request(app).put(`/api/vehicles/${id}`).set('Authorization', `Bearer ${adminToken}`).send({ price: 25000 });
    const restocked = await request(app).post(`/api/vehicles/${id}/restock`).set('Authorization', `Bearer ${adminToken}`).send({ quantity: 3 });
    const deleted = await request(app).delete(`/api/vehicles/${id}`).set('Authorization', `Bearer ${adminToken}`);

    expect(updated.body.data.price).toBe(25000);
    expect(restocked.body.data.quantity).toBe(8);
    expect(deleted.statusCode).toBe(200);
  });

  it('supports advanced filters, sorting, and pagination', async () => {
    await createVehicle({ ...sampleVehicle, make: 'Toyota', model: 'Corolla', price: 22000 });
    await createVehicle({ ...sampleVehicle, make: 'Ford', model: 'Mustang', category: 'Coupe', fuelType: 'Petrol', transmission: 'Manual', year: 2024, price: 55000 });
    await createVehicle({ ...sampleVehicle, make: 'Tesla', model: 'Model 3', category: 'Sedan', fuelType: 'Electric', transmission: 'Automatic', year: 2025, price: 41000 });

    const response = await request(app)
      .get('/api/vehicles/search?fuelType=Petrol&transmission=Manual&sort=priceDesc&page=1&limit=1')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].make).toBe('Ford');
    expect(response.body.pagination).toEqual(expect.objectContaining({ total: 1, limit: 1 }));
  });

  it('records a purchase and only exposes a customer purchase history to that customer', async () => {
    const created = await createVehicle({ ...sampleVehicle, quantity: 2 });
    const purchase = await request(app)
      .post(`/api/vehicles/${created.body.data._id}/purchase`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ quantity: 1 });
    expect(purchase.statusCode).toBe(200);
    expect(purchase.body.data.quantity).toBe(1);
    expect(purchase.body.purchase).toEqual(expect.objectContaining({ quantity: 1, price: 22000, status: 'completed' }));
    expect(purchase.body.invoice).toEqual(expect.objectContaining({
      invoiceNumber: expect.stringMatching(/^INV-\d{8}-\d{4}$/),
      quantity: 1,
      totalAmount: 22000,
      paymentStatus: 'paid',
      invoiceStatus: 'issued',
    }));

    const customerHistory = await request(app).get('/api/purchases').set('Authorization', `Bearer ${customerToken}`);
    const adminHistory = await request(app).get('/api/purchases').set('Authorization', `Bearer ${adminToken}`);
    expect(customerHistory.body.data).toHaveLength(1);
    expect(adminHistory.body.data).toHaveLength(1);
  });

  it('protects invoice access, generates a PDF, and lets only an admin archive it', async () => {
    const created = await createVehicle({ ...sampleVehicle, quantity: 2 });
    const purchase = await request(app)
      .post(`/api/vehicles/${created.body.data._id}/purchase`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ quantity: 1 });
    const invoiceId = purchase.body.invoice._id;

    const mine = await request(app).get('/api/invoices').set('Authorization', `Bearer ${customerToken}`);
    const all = await request(app).get('/api/admin/invoices').set('Authorization', `Bearer ${adminToken}`);
    const details = await request(app).get(`/api/invoices/${invoiceId}`).set('Authorization', `Bearer ${customerToken}`);
    const pdf = await request(app).get(`/api/invoices/${invoiceId}/download`).set('Authorization', `Bearer ${customerToken}`);
    const forbiddenAdminList = await request(app).get('/api/admin/invoices').set('Authorization', `Bearer ${customerToken}`);
    const otherCustomer = await request(app).post('/api/auth/register').send({ name: 'Other Customer', email: 'other@example.com', password: 'password123' });
    const forbiddenInvoice = await request(app).get(`/api/invoices/${invoiceId}`).set('Authorization', `Bearer ${otherCustomer.body.data.token}`);

    expect(mine.body.data).toHaveLength(1);
    expect(all.body.data).toHaveLength(1);
    expect(details.body.data.invoiceNumber).toMatch(/^INV-\d{8}-\d{4}$/);
    expect(pdf.statusCode).toBe(200);
    expect(pdf.headers['content-type']).toContain('application/pdf');
    expect(pdf.body.subarray(0, 4).toString()).toBe('%PDF');
    expect(forbiddenAdminList.statusCode).toBe(403);
    expect(forbiddenInvoice.statusCode).toBe(403);

    const archived = await request(app).delete(`/api/admin/invoices/${invoiceId}`).set('Authorization', `Bearer ${adminToken}`);
    const unavailable = await request(app).get(`/api/invoices/${invoiceId}`).set('Authorization', `Bearer ${customerToken}`);
    expect(archived.statusCode).toBe(200);
    expect(unavailable.statusCode).toBe(404);
  });

  it('allocates consecutive unique invoice numbers for purchases on the same day', async () => {
    const created = await createVehicle({ ...sampleVehicle, quantity: 2 });
    const first = await request(app).post(`/api/vehicles/${created.body.data._id}/purchase`).set('Authorization', `Bearer ${customerToken}`).send({ quantity: 1 });
    const second = await request(app).post(`/api/vehicles/${created.body.data._id}/purchase`).set('Authorization', `Bearer ${customerToken}`).send({ quantity: 1 });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(first.body.invoice.invoiceNumber).toMatch(/^INV-\d{8}-0001$/);
    expect(second.body.invoice.invoiceNumber).toMatch(/^INV-\d{8}-0002$/);
    expect(second.body.invoice.invoiceNumber).not.toBe(first.body.invoice.invoiceNumber);
  });

  it('prevents overselling and provides admin analytics', async () => {
    const created = await createVehicle({ ...sampleVehicle, quantity: 1 });
    const id = created.body.data._id;
    await request(app).post(`/api/vehicles/${id}/purchase`).set('Authorization', `Bearer ${customerToken}`).send({ quantity: 1 });
    const oversell = await request(app).post(`/api/vehicles/${id}/purchase`).set('Authorization', `Bearer ${customerToken}`).send({ quantity: 1 });
    const analytics = await request(app).get('/api/analytics/inventory').set('Authorization', `Bearer ${adminToken}`);

    expect(oversell.statusCode).toBe(409);
    expect(analytics.statusCode).toBe(200);
    expect(analytics.body.data).toEqual(expect.objectContaining({ totalVehicles: 1, totalStock: 0, outOfStockVehicles: 1 }));
    expect(analytics.body.data.recentActivity.length).toBeGreaterThan(0);
  });
});
