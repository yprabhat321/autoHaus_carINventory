import React, { useEffect, useState } from 'react';

const CATEGORIES = ['Sedan', 'SUV', 'Hatchback', 'MUV', 'EV', 'Luxury'];
const FUELS = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'];
const TRANSMISSIONS = ['Manual', 'Automatic'];

const emptyForm = {
  make: '',
  model: '',
  category: 'Sedan',
  year: new Date().getFullYear(),
  fuelType: 'Petrol',
  transmission: 'Automatic',
  price: '',
  quantity: 0,
  imageUrl: '',
  description: '',
};

/**
 * A single modal reused for both "add vehicle" (vehicle === null)
 * and "edit vehicle" (vehicle populated) to avoid duplicating the form.
 */
const VehicleFormModal = ({ vehicle, onClose, onSubmit }) => {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setForm({
        make: vehicle.make || '',
        model: vehicle.model || '',
        category: vehicle.category || 'Sedan',
        year: vehicle.year || new Date().getFullYear(),
        fuelType: vehicle.fuelType || 'Petrol',
        transmission: vehicle.transmission || 'Automatic',
        price: vehicle.price ?? '',
        quantity: vehicle.quantity ?? 0,
        imageUrl: vehicle.imageUrl || '',
        description: vehicle.description || '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [vehicle]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.make || !form.model || !form.category || form.price === '') {
      setError('Make, model, category and price are required.');
      return;
    }
    if (Number(form.price) < 0 || Number(form.quantity) < 0) {
      setError('Price and quantity cannot be negative.');
      return;
    }
    if (form.year && (Number(form.year) < 1900 || Number(form.year) > new Date().getFullYear() + 1)) {
      setError(`Year must be between 1900 and ${new Date().getFullYear() + 1}.`);
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        ...form,
        price: Number(form.price),
        quantity: Number(form.quantity),
        year: form.year ? Number(form.year) : undefined,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4">
      <div className="bg-paper w-full max-w-xl max-h-[90vh] overflow-y-auto p-8 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-steel-600 hover:text-ink text-2xl leading-none"
          aria-label="Close"
        >
          &times;
        </button>

        <p className="eyebrow">{vehicle ? 'Edit vehicle' : 'Add vehicle'}</p>
        <h2 className="font-display text-2xl mt-1 mb-6">
          {vehicle ? `${vehicle.make} ${vehicle.model}` : 'New inventory item'}
        </h2>

        {error && (
          <p className="text-ember-600 text-sm mb-4 border-l-2 border-ember pl-3">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="eyebrow" htmlFor="v-make">Make</label>
            <input id="v-make" className="input-field" value={form.make} onChange={update('make')} required />
          </div>
          <div>
            <label className="eyebrow" htmlFor="v-fuel">Fuel type</label>
            <select id="v-fuel" className="input-field" value={form.fuelType} onChange={update('fuelType')}>
              {FUELS.map((fuel) => <option key={fuel} value={fuel}>{fuel}</option>)}
            </select>
          </div>
          <div>
            <label className="eyebrow" htmlFor="v-transmission">Transmission</label>
            <select id="v-transmission" className="input-field" value={form.transmission} onChange={update('transmission')}>
              {TRANSMISSIONS.map((transmission) => <option key={transmission} value={transmission}>{transmission}</option>)}
            </select>
          </div>
          <div>
            <label className="eyebrow" htmlFor="v-model">Model</label>
            <input id="v-model" className="input-field" value={form.model} onChange={update('model')} required />
          </div>
          <div>
            <label className="eyebrow" htmlFor="v-category">Category</label>
            <select id="v-category" className="input-field" value={form.category} onChange={update('category')}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="eyebrow" htmlFor="v-year">Year</label>
            <input id="v-year" type="number" min="1900" max={new Date().getFullYear() + 1} className="input-field" value={form.year} onChange={update('year')} />
          </div>
          <div>
            <label className="eyebrow" htmlFor="v-price">Price (INR)</label>
            <input
              id="v-price"
              type="number"
              min="0"
              className="input-field"
              value={form.price}
              onChange={update('price')}
              required
            />
          </div>
          <div>
            <label className="eyebrow" htmlFor="v-quantity">Quantity in stock</label>
            <input
              id="v-quantity"
              type="number"
              min="0"
              className="input-field"
              value={form.quantity}
              onChange={update('quantity')}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="eyebrow" htmlFor="v-image">Image URL (optional)</label>
            <input id="v-image" className="input-field" value={form.imageUrl} onChange={update('imageUrl')} />
          </div>
          <div className="sm:col-span-2">
            <label className="eyebrow" htmlFor="v-description">Description (optional)</label>
            <textarea
              id="v-description"
              rows={3}
              className="input-field resize-none"
              value={form.description}
              onChange={update('description')}
            />
          </div>

          <div className="sm:col-span-2 flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : vehicle ? 'Save changes' : 'Add vehicle'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleFormModal;
