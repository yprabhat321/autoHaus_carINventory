import React from 'react';

const Footer = () => (
  <footer className="bg-ink text-steel-400 mt-24">
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
      <span className="font-display uppercase tracking-widest2 text-sm text-white">AutoHaus</span>
      <p className="text-xs text-center sm:text-right">
        Built for the TDD Kata — Car Dealership Inventory System.
        <br className="hidden sm:block" /> Vehicle data shown is for demonstration purposes only.
      </p>
    </div>
  </footer>
);

export default Footer;
