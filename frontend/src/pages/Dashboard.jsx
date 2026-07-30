import React, { useCallback, useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import SearchFilterBar from '../components/SearchFilterBar.jsx';
import VehicleCard from '../components/VehicleCard.jsx';
import VehicleCardSkeleton from '../components/VehicleCardSkeleton.jsx';
import VehicleFormModal from '../components/VehicleFormModal.jsx';
import RestockModal from '../components/RestockModal.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';

const emptyFilters = {
  make: '', model: '', category: '', fuelType: '', transmission: '', year: '', minPrice: '', maxPrice: '', sort: 'newest',
};

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(emptyFilters);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, pages: 1, total: 0 });
  const [formVehicle, setFormVehicle] = useState(undefined);
  const [restockVehicle, setRestockVehicle] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const loadVehicles = useCallback(async (params, searchMode) => {
    setLoading(true);
    setError('');
    try {
      const endpoint = searchMode ? '/vehicles/search' : '/vehicles';
      const res = await axiosClient.get(endpoint, { params });
      setVehicles(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load vehicles. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAll = useCallback((page = 1, limit = pagination.limit) => {
    setIsSearchMode(false);
    return loadVehicles({ page, limit, sort: 'newest' }, false);
  }, [loadVehicles, pagination.limit]);

  useEffect(() => {
    fetchAll(1, 12);
    // Initial inventory load only; later loads are driven by user actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSearch = (page = 1, limit = pagination.limit) => {
    const params = { page, limit };
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '') params[key] = value;
    });
    setIsSearchMode(true);
    return loadVehicles(params, true);
  };

  const resetSearch = () => {
    setFilters(emptyFilters);
    fetchAll(1);
  };

  const refresh = () => (isSearchMode ? runSearch(pagination.page) : fetchAll(pagination.page));

  const handleFormSubmit = async (payload) => {
    if (formVehicle?._id) {
      await axiosClient.put(`/vehicles/${formVehicle._id}`, payload);
      showToast('Vehicle updated.');
    } else {
      await axiosClient.post('/vehicles', payload);
      showToast('Vehicle added to inventory.');
    }
    setFormVehicle(undefined);
    await refresh();
  };

  const handleRestockSubmit = async (amount) => {
    await axiosClient.post(`/vehicles/${restockVehicle._id}/restock`, { quantity: amount });
    showToast(`Restocked ${restockVehicle.make} ${restockVehicle.model}.`);
    setRestockVehicle(null);
    await refresh();
  };

  const confirmAction = async () => {
    const { type, vehicle } = pendingAction;
    if (type === 'purchase') {
      const response = await axiosClient.post(`/vehicles/${vehicle._id}/purchase`, { quantity: 1 });
      showToast(`Purchase complete. Invoice ${response.data.invoice.invoiceNumber} generated.`);
    } else {
      await axiosClient.delete(`/vehicles/${vehicle._id}`);
      showToast('Vehicle deleted.');
    }
    await refresh();
  };

  const changePage = (page) => {
    if (isSearchMode) runSearch(page);
    else fetchAll(page);
  };

  const changePageSize = (event) => {
    const limit = Number(event.target.value);
    if (isSearchMode) runSearch(1, limit);
    else fetchAll(1, limit);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
        <div>
          <p className="eyebrow">Showroom floor</p>
          <h1 className="font-display text-4xl mt-1">Available Inventory</h1>
        </div>
        {isAdmin && <button type="button" className="btn-primary" onClick={() => setFormVehicle(null)}>+ Add vehicle</button>}
      </div>

      <SearchFilterBar filters={filters} onChange={setFilters} onSubmit={() => runSearch(1)} onReset={resetSearch} />

      {error && <p className="mt-6 text-ember-600 text-sm border-l-2 border-ember pl-3">{error}</p>}

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-steel-600">{loading ? 'Loading inventory…' : `${pagination.total} vehicle${pagination.total === 1 ? '' : 's'} found`}</p>
        <label className="flex items-center gap-3 text-sm text-steel-600">Show
          <select className="input-field w-20" value={pagination.limit} onChange={changePageSize} disabled={loading}>
            {[6, 12, 24, 48].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 6 }, (_, index) => <VehicleCardSkeleton key={index} />)}</div>
        ) : vehicles.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="font-display text-xl">No vehicles match your search.</p>
            <p className="text-steel-600 text-sm mt-2">Try adjusting or resetting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle._id}
                vehicle={vehicle}
                onPurchase={(item) => setPendingAction({ type: 'purchase', vehicle: item })}
                onEdit={setFormVehicle}
                onDelete={(item) => setPendingAction({ type: 'delete', vehicle: item })}
                onRestock={setRestockVehicle}
              />
            ))}
          </div>
        )}
      </div>

      {!loading && pagination.pages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <button type="button" className="btn-secondary" onClick={() => changePage(pagination.page - 1)} disabled={!pagination.hasPreviousPage}>Previous</button>
          <span className="text-sm text-steel-600">Page {pagination.page} of {pagination.pages}</span>
          <button type="button" className="btn-secondary" onClick={() => changePage(pagination.page + 1)} disabled={!pagination.hasNextPage}>Next</button>
        </div>
      )}

      {formVehicle !== undefined && <VehicleFormModal vehicle={formVehicle} onClose={() => setFormVehicle(undefined)} onSubmit={handleFormSubmit} />}
      {restockVehicle && <RestockModal vehicle={restockVehicle} onClose={() => setRestockVehicle(null)} onSubmit={handleRestockSubmit} />}
      {pendingAction && (
        <ConfirmationModal
          title={pendingAction.type === 'purchase' ? 'Purchase this vehicle?' : 'Delete this vehicle?'}
          description={pendingAction.type === 'purchase'
            ? `Confirm the purchase of one ${pendingAction.vehicle.make} ${pendingAction.vehicle.model}. Inventory will be reduced immediately.`
            : `${pendingAction.vehicle.make} ${pendingAction.vehicle.model} will be removed from the active inventory.`}
          confirmLabel={pendingAction.type === 'purchase' ? 'Confirm purchase' : 'Delete vehicle'}
          onConfirm={confirmAction}
          onClose={() => setPendingAction(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
