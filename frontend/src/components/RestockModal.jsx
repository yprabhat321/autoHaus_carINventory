import React, { useState } from 'react';

const RestockModal = ({ vehicle, onClose, onSubmit }) => {
  const [amount, setAmount] = useState(1);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (Number(amount) <= 0) {
      setError('Enter a quantity greater than zero.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit(Number(amount));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not restock this vehicle.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4">
      <div className="bg-paper w-full max-w-sm p-8 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-steel-600 hover:text-ink text-2xl leading-none"
          aria-label="Close"
        >
          &times;
        </button>

        <p className="eyebrow">Restock</p>
        <h2 className="font-display text-2xl mt-1 mb-1">{vehicle.make} {vehicle.model}</h2>
        <p className="text-sm text-steel-600 mb-6">Currently {vehicle.quantity} in stock.</p>

        {error && <p className="text-ember-600 text-sm mb-4 border-l-2 border-ember pl-3">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="eyebrow" htmlFor="restock-amount">Units to add</label>
            <input
              id="restock-amount"
              type="number"
              min="1"
              className="input-field"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Updating…' : 'Confirm restock'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestockModal;
