import React from 'react';

const currency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
const date = (value) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value));

const statusClass = (value) => value === 'paid' || value === 'issued'
  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
  : value === 'cancelled' ? 'bg-ember-50 text-ember-700 border-ember-200' : 'bg-amber-50 text-amber-700 border-amber-200';

const InvoicePreviewModal = ({ invoice, onClose, onDownload }) => {
  const customer = invoice.customer || invoice.customerSnapshot || {};
  const vehicle = invoice.vehicle || invoice.vehicleSnapshot || {};

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/70 p-4 sm:p-8" role="dialog" aria-modal="true" aria-labelledby="invoice-title">
      <div className="mx-auto w-full max-w-2xl bg-paper shadow-2xl">
        <div className="bg-ink px-6 py-6 text-white sm:px-8">
          <div className="flex items-start justify-between gap-5">
            <div><p className="font-display text-2xl tracking-widest2">AUTOHAUS</p><p className="mt-1 text-[10px] uppercase tracking-widest2 text-steel-400">Car Dealership Inventory</p></div>
            <button type="button" onClick={onClose} className="text-2xl leading-none text-white/70 hover:text-white" aria-label="Close invoice">&times;</button>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 border-b border-steel-300 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="eyebrow">Invoice</p><h2 id="invoice-title" className="font-display mt-1 text-3xl">{invoice.invoiceNumber}</h2></div>
            <div className="text-left text-sm sm:text-right"><p className="text-steel-600">Issued {date(invoice.purchaseDate)}</p><div className="mt-2 flex gap-2 sm:justify-end"><span className={`border px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${statusClass(invoice.paymentStatus)}`}>{invoice.paymentStatus}</span><span className={`border px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${statusClass(invoice.invoiceStatus)}`}>{invoice.invoiceStatus}</span></div></div>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div><p className="eyebrow">Bill to</p><p className="mt-2 font-medium">{customer.name}</p><p className="text-sm text-steel-600">{customer.email}</p></div>
            <div><p className="eyebrow">Vehicle</p><p className="mt-2 font-medium">{vehicle.make} {vehicle.model}</p><p className="text-sm text-steel-600">{vehicle.category || 'Vehicle'}</p></div>
          </div>
          <div className="mt-8 overflow-x-auto border border-steel-300/70">
            <table className="w-full min-w-[440px] text-left text-sm"><thead className="bg-ink text-[10px] uppercase tracking-widest2 text-white"><tr><th className="p-3">Description</th><th className="p-3 text-right">Unit price</th><th className="p-3 text-right">Qty</th><th className="p-3 text-right">Total</th></tr></thead><tbody><tr><td className="p-4"><span className="font-medium">{vehicle.make} {vehicle.model}</span><span className="block text-xs text-steel-600">{vehicle.category || 'Vehicle'}</span></td><td className="p-4 text-right">{currency(invoice.unitPrice)}</td><td className="p-4 text-right">{invoice.quantity}</td><td className="p-4 text-right font-medium">{currency(invoice.totalAmount)}</td></tr></tbody></table>
          </div>
          <div className="mt-6 flex items-end justify-between"><p className="text-sm text-steel-600">Thank you for choosing AutoHaus.</p><div className="text-right"><p className="eyebrow">Grand total</p><p className="font-display mt-1 text-2xl text-ember">{currency(invoice.totalAmount)}</p></div></div>
          <div className="mt-8 flex flex-wrap gap-3 border-t border-steel-300 pt-6"><button type="button" className="btn-primary" onClick={() => onDownload(invoice)}>Download PDF</button><button type="button" className="btn-secondary" onClick={onClose}>Close</button></div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;
