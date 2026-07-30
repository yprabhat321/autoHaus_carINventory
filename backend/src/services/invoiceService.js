const Invoice = require('../models/Invoice');
const InvoiceSequence = require('../models/InvoiceSequence');

const getDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

const nextInvoiceNumber = async (purchaseDate, session) => {
  const dateKey = getDateKey(purchaseDate);
  const sequence = await InvoiceSequence.findOneAndUpdate(
    { dateKey },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true, ...(session ? { session } : {}) }
  );

  return `INV-${dateKey}-${String(sequence.value).padStart(4, '0')}`;
};

const createInvoice = async ({ customer, vehicle, purchase, quantity, purchaseDate = new Date(), session }) => {
  const invoiceNumber = await nextInvoiceNumber(purchaseDate, session);
  const payload = {
    invoiceNumber,
    customer: customer._id,
    vehicle: vehicle._id,
    purchase: purchase._id,
    quantity,
    unitPrice: vehicle.price,
    totalAmount: vehicle.price * quantity,
    purchaseDate,
    customerSnapshot: { name: customer.name, email: customer.email },
    vehicleSnapshot: {
      make: vehicle.make,
      model: vehicle.model,
      category: vehicle.category || '',
      imageUrl: vehicle.imageUrl || '',
    },
  };

  if (!session) return Invoice.create(payload);
  const [invoice] = await Invoice.create([payload], { session });
  return invoice;
};

module.exports = { createInvoice, getDateKey, nextInvoiceNumber };
