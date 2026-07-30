import React, { useCallback, useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext.jsx';

const currency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
const date = (value) => new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));

const PurchaseHistory = () => {
  const { isAdmin } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPurchases = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosClient.get('/purchases', { params: { page, limit: 10 } });
      setPurchases(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load purchases.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPurchases(); }, [loadPurchases]);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
      <p className="eyebrow">{isAdmin ? 'Administration' : 'Your account'}</p>
      <h1 className="font-display text-4xl mt-1">{isAdmin ? 'All Purchases' : 'My Purchases'}</h1>
      {error && <p className="mt-6 border-l-2 border-ember pl-3 text-sm text-ember-600">{error}</p>}
      <div className="card mt-8 overflow-x-auto">
        {loading ? <p className="p-8 text-steel-600">Loading purchase history…</p> : purchases.length === 0 ? <p className="p-8 text-steel-600">No purchases yet.</p> : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-steel-300 text-xs uppercase tracking-widest2 text-steel-600"><tr><th className="p-4">Vehicle</th>{isAdmin && <th className="p-4">Customer</th>}<th className="p-4">Date</th><th className="p-4">Qty</th><th className="p-4">Price</th><th className="p-4">Status</th></tr></thead>
            <tbody>{purchases.map((purchase) => {
              const vehicle = purchase.vehicle || purchase.vehicleSnapshot || {};
              return <tr className="border-b border-steel-300/60 last:border-0" key={purchase._id}><td className="p-4 font-medium">{vehicle.make} {vehicle.model}</td>{isAdmin && <td className="p-4">{purchase.customer?.name || 'Deleted customer'}</td>}<td className="p-4 text-steel-600">{date(purchase.createdAt)}</td><td className="p-4">{purchase.quantity}</td><td className="p-4">{currency(purchase.price * purchase.quantity)}</td><td className="p-4"><span className="text-xs uppercase tracking-wide text-steel-600">{purchase.status}</span></td></tr>;
            })}</tbody>
          </table>
        )}
      </div>
      {!loading && pagination.pages > 1 && <div className="mt-8 flex justify-center gap-4"><button type="button" className="btn-secondary" disabled={!pagination.hasPreviousPage} onClick={() => loadPurchases(pagination.page - 1)}>Previous</button><span className="self-center text-sm text-steel-600">Page {pagination.page} of {pagination.pages}</span><button type="button" className="btn-secondary" disabled={!pagination.hasNextPage} onClick={() => loadPurchases(pagination.page + 1)}>Next</button></div>}
    </div>
  );
};

export default PurchaseHistory;
