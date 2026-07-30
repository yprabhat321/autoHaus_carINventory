import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useToast } from '../context/ToastContext.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';

const currency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

const VehicleDetails = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  const loadVehicle = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosClient.get(`/vehicles/${id}`);
      setVehicle(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load that vehicle.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVehicle(); }, [id]);

  const purchase = async () => {
    const response = await axiosClient.post(`/vehicles/${id}/purchase`, { quantity: 1 });
    showToast(`Purchase complete. Invoice ${response.data.invoice.invoiceNumber} generated.`);
    await loadVehicle();
  };

  if (loading) return <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 text-steel-600">Loading vehicle…</div>;
  if (error || !vehicle) return <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16"><p className="text-ember-600 border-l-2 border-ember pl-3">{error || 'Vehicle not found.'}</p><Link to="/" className="btn-secondary mt-8">Back to inventory</Link></div>;

  const outOfStock = vehicle.quantity <= 0;
  const lowStock = vehicle.quantity > 0 && vehicle.quantity < 5;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
      <Link to="/" className="btn-ghost px-0">← Back to inventory</Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="min-h-80 overflow-hidden bg-steel-300/30">
          {vehicle.imageUrl ? <img src={vehicle.imageUrl} alt={`${vehicle.make} ${vehicle.model}`} className="h-full w-full object-cover" /> : <div className="flex h-80 items-center justify-center font-display uppercase tracking-widest2 text-steel-500">{vehicle.make} {vehicle.model}</div>}
        </div>
        <div>
          <p className="eyebrow">{vehicle.category}</p>
          <h1 className="font-display text-4xl mt-1">{vehicle.make} {vehicle.model}</h1>
          <p className="font-display text-3xl mt-6">{currency(vehicle.price)}</p>
          <div className="mt-8 grid grid-cols-2 border-y border-steel-300 text-sm">
            {[
              ['Year', vehicle.year || '—'], ['Fuel', vehicle.fuelType || '—'], ['Transmission', vehicle.transmission || '—'], ['Availability', outOfStock ? 'OUT OF STOCK' : `${vehicle.quantity} in stock`],
            ].map(([label, value]) => <div key={label} className="py-4"><p className="eyebrow">{label}</p><p className={label === 'Availability' && (outOfStock || lowStock) ? 'mt-1 text-ember-600 font-medium' : 'mt-1'}>{value}</p></div>)}
          </div>
          {lowStock && <p className="mt-5 border-l-2 border-ember pl-3 text-sm text-ember-600">⚠ Low stock — only {vehicle.quantity} remaining.</p>}
          {vehicle.description && <p className="mt-6 leading-7 text-steel-600">{vehicle.description}</p>}
          <button type="button" className="btn-primary mt-8" disabled={outOfStock} onClick={() => setConfirming(true)}>{outOfStock ? 'Out of stock' : 'Purchase vehicle'}</button>
        </div>
      </div>
      {confirming && <ConfirmationModal title="Purchase this vehicle?" description={`Confirm the purchase of one ${vehicle.make} ${vehicle.model}.`} confirmLabel="Confirm purchase" onConfirm={purchase} onClose={() => setConfirming(false)} />}
    </div>
  );
};

export default VehicleDetails;
