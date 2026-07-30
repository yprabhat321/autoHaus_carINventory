const PDFDocument = require('pdfkit');

const currency = (value) => `INR ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value || 0)}`;
const date = (value) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value));

const createInvoicePdfBuffer = (invoice) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: invoice.invoiceNumber, Author: 'AutoHaus' } });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  const customer = invoice.customer || invoice.customerSnapshot;
  const vehicle = invoice.vehicle || invoice.vehicleSnapshot;

  doc.rect(0, 0, 595.28, 115).fill('#13151A');
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(25).text('AUTOHAUS', 50, 42, { characterSpacing: 2 });
  doc.font('Helvetica').fontSize(9).fillColor('#D6D9DF').text('CAR DEALERSHIP INVENTORY', 51, 74, { characterSpacing: 1.5 });
  doc.fillColor('#B08D57').circle(520, 58, 22).fill();
  doc.fillColor('#13151A').font('Helvetica-Bold').fontSize(15).text('AH', 507, 53);

  doc.fillColor('#13151A').font('Helvetica-Bold').fontSize(26).text('INVOICE', 50, 150);
  doc.font('Helvetica').fontSize(10).fillColor('#5C6470').text(invoice.invoiceNumber, 50, 184);
  doc.text(`Issued ${date(invoice.purchaseDate)}`, 405, 160, { align: 'right' });
  doc.text(`Status: ${invoice.invoiceStatus.toUpperCase()}`, 405, 179, { align: 'right' });

  doc.fillColor('#13151A').font('Helvetica-Bold').fontSize(10).text('BILL TO', 50, 235, { characterSpacing: 1.5 });
  doc.font('Helvetica').fontSize(11).text(customer.name, 50, 254);
  doc.fillColor('#5C6470').fontSize(10).text(customer.email, 50, 272);
  doc.fillColor('#13151A').font('Helvetica-Bold').fontSize(10).text('DEALERSHIP', 335, 235, { characterSpacing: 1.5 });
  doc.font('Helvetica').fontSize(11).text('AutoHaus', 335, 254);
  doc.fillColor('#5C6470').fontSize(10).text('India Vehicle Inventory', 335, 272);

  const y = 330;
  doc.fillColor('#13151A').rect(50, y, 495, 30).fill();
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
  doc.text('VEHICLE', 62, y + 10);
  doc.text('UNIT PRICE', 285, y + 10, { width: 105, align: 'right' });
  doc.text('QTY', 400, y + 10, { width: 40, align: 'right' });
  doc.text('TOTAL', 450, y + 10, { width: 82, align: 'right' });
  doc.fillColor('#F7F4ED').rect(50, y + 30, 495, 65).fill();
  doc.fillColor('#13151A').font('Helvetica-Bold').fontSize(11).text(`${vehicle.make} ${vehicle.model}`, 62, y + 48);
  doc.fillColor('#5C6470').font('Helvetica').fontSize(9).text(vehicle.category || 'Vehicle', 62, y + 66);
  doc.fillColor('#13151A').fontSize(10).text(currency(invoice.unitPrice), 285, y + 55, { width: 105, align: 'right' });
  doc.text(String(invoice.quantity), 400, y + 55, { width: 40, align: 'right' });
  doc.font('Helvetica-Bold').text(currency(invoice.totalAmount), 450, y + 55, { width: 82, align: 'right' });

  doc.strokeColor('#C7CAD1').moveTo(330, 460).lineTo(545, 460).stroke();
  doc.fillColor('#5C6470').font('Helvetica').fontSize(10).text('Payment status', 330, 474);
  doc.fillColor('#13151A').text(invoice.paymentStatus.toUpperCase(), 445, 474, { width: 100, align: 'right' });
  doc.fillColor('#13151A').font('Helvetica-Bold').fontSize(14).text('GRAND TOTAL', 330, 505, { width: 100, lineBreak: false });
  doc.fillColor('#9A2B1F').fontSize(16).text(currency(invoice.totalAmount), 440, 504, { width: 105, align: 'right', lineBreak: false });

  doc.strokeColor('#C7CAD1').moveTo(50, 650).lineTo(545, 650).stroke();
  doc.fillColor('#5C6470').font('Helvetica').fontSize(9).text('Thank you for choosing AutoHaus. We look forward to the road ahead.', 50, 668);
  doc.text('This is a system-generated invoice.', 50, 686);
  doc.text('AutoHaus | India Vehicle Inventory', 385, 686, { width: 160, align: 'right' });
  doc.end();
});

module.exports = { createInvoicePdfBuffer };
