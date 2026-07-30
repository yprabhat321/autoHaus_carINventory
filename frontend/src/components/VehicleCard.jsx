import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const currency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const VehicleCard = ({ vehicle, onPurchase, onEdit, onDelete, onRestock }) => {
  const { isAdmin } = useAuth();
  const outOfStock = vehicle.quantity <= 0;
  const lowStock = vehicle.quantity > 0 && vehicle.quantity < 5;

  return (
    <article className={`card group flex flex-col ${lowStock ? 'border-ember border-2' : ''}`}>
      <div className="relative h-48 bg-steel-300/30 overflow-hidden">
        {vehicle.imageUrl ? (
          <img
            src={vehicle.imageUrl}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-display uppercase tracking-widest2 text-steel-500 text-sm">
              {vehicle.make} {vehicle.model}
            </span>
          </div>
        )}

        <span className="absolute top-3 left-3 bg-ink text-white text-[10px] font-display uppercase tracking-widest2 px-3 py-1">
          {vehicle.category}
        </span>

        {outOfStock && (
          <span className="absolute top-3 right-3 bg-ember text-white text-[10px] font-display uppercase tracking-widest2 px-3 py-1">
            Out of stock
          </span>
        )}
        {lowStock && (
          <span className="absolute top-3 right-3 bg-ember text-white text-[10px] font-display uppercase tracking-widest2 px-3 py-1">
            ⚠ Low stock
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <Link to={`/vehicles/${vehicle._id}`} className="font-display text-xl leading-tight hover:text-ember transition-colors">
          {vehicle.make} {vehicle.model}
        </Link>
        {vehicle.year && <p className="text-xs text-steel-600 mt-1">{vehicle.year} model year</p>}
        <p className="text-xs text-steel-600 mt-2">{[vehicle.fuelType, vehicle.transmission].filter(Boolean).join(' · ')}</p>

        <div className="flex items-baseline justify-between mt-4">
          <span className="font-display text-2xl">{currency(vehicle.price)}</span>
          <span className="text-xs text-steel-600">
            {vehicle.quantity} in stock
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            className="btn-primary"
            disabled={outOfStock}
            onClick={() => onPurchase(vehicle)}
          >
            {outOfStock ? 'Out of stock' : 'Purchase'}
          </button>

          <Link to={`/vehicles/${vehicle._id}`} className="btn-ghost border border-steel-300">View details</Link>

          {isAdmin && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button type="button" className="btn-ghost border border-steel-300" onClick={() => onEdit(vehicle)}>
                Edit
              </button>
              <button
                type="button"
                className="btn-ghost border border-steel-300"
                onClick={() => onRestock(vehicle)}
              >
                Restock
              </button>
              <button
                type="button"
                className="btn-ghost border border-steel-300 hover:text-ember"
                onClick={() => onDelete(vehicle)}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default VehicleCard;
