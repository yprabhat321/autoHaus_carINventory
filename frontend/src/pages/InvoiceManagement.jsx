import React, { useCallback, useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import InvoicePreviewModal from '../components/InvoicePreviewModal.jsx';

const currency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
const date = (value) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value));
const emptyFilters = { search: '', period: '', paymentStatus: '', invoiceStatus: '', sort: 'latest' };

const InvoiceManagement = () => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [filters, setFilters] = useState(emptyFilters);
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const loadInvoices = useCallback(async (page = 1, nextFilters = filters) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 12 };
      Object.entries(nextFilters).forEach(([key, value]) => { if (value) params[key] = value; });
      const response = await axiosClient.get(isAdmin ? '/admin/invoices' : '/invoices', { params });
      setInvoices(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load invoices.');
    } finally {
      setLoading(false);
    }
  }, [filters, isAdmin]);

  useEffect(() => { loadInvoices(1); }, [isAdmin]); // User-driven filters do not refetch until applied.

  const updateFilter = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  const applyFilters = (event) => { event.preventDefault(); loadInvoices(1); };
  const resetFilters = () => { setFilters(emptyFilters); loadInvoices(1, emptyFilters); };

  const viewInvoice = async (id) => {
    try {
      const response = await axiosClient.get(`/invoices/${id}`);
      setSelected(response.data.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not open invoice.', 'error');
    }
  };

  const downloadInvoice = async (invoice) => {
    try {
      const response = await axiosClient.get(`/invoices/${invoice._id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast(`Invoice ${invoice.invoiceNumber} downloaded.`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not download the invoice.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 lg:px-10">
      <p className="eyebrow">{isAdmin ? 'Administration' : 'Your account'}</p>
      <h1 className="font-display mt-1 text-4xl">{isAdmin ? 'Invoice Management' : 'My Invoices'}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-steel-600">{isAdmin ? 'Search, review and download every active dealership invoice.' : 'Your completed vehicle purchases, ready to review or download.'}</p>

      <form className="card mt-8 grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-5" onSubmit={applyFilters}>
        <label className="lg:col-span-2"><span className="eyebrow">Search</span><input className="input-field mt-1" name="search" value={filters.search} onChange={updateFilter} placeholder={isAdmin ? 'Invoice, customer, email or vehicle' : 'Invoice number or vehicle'} /></label>
        <label><span className="eyebrow">Date range</span><select className="input-field mt-1" name="period" value={filters.period} onChange={updateFilter}><option value="">All time</option><option value="today">Today</option><option value="last7">Last 7 days</option><option value="last30">Last 30 days</option></select></label>
        <label><span className="eyebrow">Payment</span><select className="input-field mt-1" name="paymentStatus" value={filters.paymentStatus} onChange={updateFilter}><option value="">All statuses</option><option value="paid">Paid</option><option value="pending">Pending</option></select></label>
        <label><span className="eyebrow">Invoice status</span><select className="input-field mt-1" name="invoiceStatus" value={filters.invoiceStatus} onChange={updateFilter}><option value="">All statuses</option><option value="issued">Issued</option><option value="cancelled">Cancelled</option></select></label>
        <label><span className="eyebrow">Sort by</span><select className="input-field mt-1" name="sort" value={filters.sort} onChange={updateFilter}><option value="latest">Newest first</option><option value="oldest">Oldest first</option><option value="totalHigh">Total: high to low</option><option value="totalLow">Total: low to high</option></select></label>
        <div className="flex items-end gap-3 md:col-span-2"><button type="submit" className="btn-primary">Apply</button><button type="button" className="btn-secondary" onClick={resetFilters}>Reset</button></div>
      </form>

      {error && <p className="mt-6 border-l-2 border-ember pl-3 text-sm text-ember-600">{error}</p>}
      <div className="card mt-8 overflow-x-auto">
        {loading ? <p className="p-8 text-steel-600">Loading invoices...</p> : invoices.length === 0 ? <p className="p-8 text-steel-600">No invoices match those filters.</p> : (
          <table className="w-full min-w-[820px] text-left text-sm"><thead className="border-b border-steel-300 text-[10px] uppercase tracking-widest2 text-steel-600"><tr><th className="p-4">Invoice</th>{isAdmin && <th className="p-4">Customer</th>}<th className="p-4">Vehicle</th><th className="p-4">Purchase date</th><th className="p-4 text-right">Total</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr></thead><tbody>{invoices.map((invoice) => {
            const vehicle = invoice.vehicle || invoice.vehicleSnapshot || {};
            const customer = invoice.customer || invoice.customerSnapshot || {};
            return <tr key={invoice._id} className="border-b border-steel-300/60 last:border-0"><td className="p-4 font-medium">{invoice.invoiceNumber}</td>{isAdmin && <td className="p-4"><span>{customer.name}</span><span className="block text-xs text-steel-600">{customer.email}</span></td>}<td className="p-4">{vehicle.make} {vehicle.model}</td><td className="p-4 text-steel-600">{date(invoice.purchaseDate)}</td><td className="p-4 text-right font-medium">{currency(invoice.totalAmount)}</td><td className="p-4"><span className="text-[10px] uppercase tracking-wide text-steel-600">{invoice.paymentStatus} / {invoice.invoiceStatus}</span></td><td className="p-4"><div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => viewInvoice(invoice._id)}>View</button><button type="button" className="btn-ghost" onClick={() => downloadInvoice(invoice)}>PDF</button></div></td></tr>;
          })}</tbody></table>
        )}
      </div>
      {!loading && pagination.pages > 1 && <div className="mt-8 flex justify-center gap-4"><button type="button" className="btn-secondary" disabled={!pagination.hasPreviousPage} onClick={() => loadInvoices(pagination.page - 1)}>Previous</button><span className="self-center text-sm text-steel-600">Page {pagination.page} of {pagination.pages}</span><button type="button" className="btn-secondary" disabled={!pagination.hasNextPage} onClick={() => loadInvoices(pagination.page + 1)}>Next</button></div>}
      {selected && <InvoicePreviewModal invoice={selected} onClose={() => setSelected(null)} onDownload={downloadInvoice} />}
    </div>
  );
};

export default InvoiceManagement;
