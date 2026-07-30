import React from 'react';

const CATEGORIES = ['Sedan', 'SUV', 'Hatchback', 'MUV', 'EV', 'Luxury'];
const FUELS = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'];
const TRANSMISSIONS = ['Manual', 'Automatic'];

const SearchFilterBar = ({ filters, onChange, onSubmit, onReset }) => {
  const update = (field) => (e) => onChange({ ...filters, [field]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="card p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
    >
      <div>
        <label className="eyebrow" htmlFor="make">Make</label>
        <input
          id="make"
          type="text"
          placeholder="e.g. Toyota"
          className="input-field"
          value={filters.make}
          onChange={update('make')}
        />
      </div>

      <div>
        <label className="eyebrow" htmlFor="model">Model</label>
        <input
          id="model"
          type="text"
          placeholder="e.g. Corolla"
          className="input-field"
          value={filters.model}
          onChange={update('model')}
        />
      </div>

      <div>
        <label className="eyebrow" htmlFor="fuelType">Fuel</label>
        <select id="fuelType" className="input-field" value={filters.fuelType} onChange={update('fuelType')}>
          <option value="">All</option>
          {FUELS.map((fuel) => <option key={fuel} value={fuel}>{fuel}</option>)}
        </select>
      </div>

      <div>
        <label className="eyebrow" htmlFor="transmission">Transmission</label>
        <select id="transmission" className="input-field" value={filters.transmission} onChange={update('transmission')}>
          <option value="">All</option>
          {TRANSMISSIONS.map((transmission) => <option key={transmission} value={transmission}>{transmission}</option>)}
        </select>
      </div>

      <div>
        <label className="eyebrow" htmlFor="year">Year</label>
        <input id="year" type="number" min="1900" max={new Date().getFullYear() + 1} placeholder="Any" className="input-field" value={filters.year} onChange={update('year')} />
      </div>

      <div>
        <label className="eyebrow" htmlFor="category">Category</label>
        <select id="category" className="input-field" value={filters.category} onChange={update('category')}>
          <option value="">All</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="eyebrow" htmlFor="sort">Sort</label>
        <select id="sort" className="input-field" value={filters.sort} onChange={update('sort')}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="priceAsc">Price: low to high</option>
          <option value="priceDesc">Price: high to low</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
      </div>

      <div>
        <label className="eyebrow" htmlFor="minPrice">Min price</label>
        <input
          id="minPrice"
          type="number"
          min="0"
          placeholder="₹0"
          className="input-field"
          value={filters.minPrice}
          onChange={update('minPrice')}
        />
      </div>

      <div>
        <label className="eyebrow" htmlFor="maxPrice">Max price</label>
        <input
          id="maxPrice"
          type="number"
          min="0"
          placeholder="Any"
          className="input-field"
          value={filters.maxPrice}
          onChange={update('maxPrice')}
        />
      </div>

      <div className="sm:col-span-2 lg:col-span-4 flex gap-3 pt-2">
        <button type="submit" className="btn-primary">Search</button>
        <button type="button" className="btn-secondary" onClick={onReset}>Reset</button>
      </div>
    </form>
  );
};

export default SearchFilterBar;
