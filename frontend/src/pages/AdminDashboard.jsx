import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import axiosClient from '../api/axiosClient';

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0, notation: 'compact' }).format(value || 0);
const number = (value) => new Intl.NumberFormat('en-IN').format(value || 0);

const ChartPanel = ({ title, children }) => <section className="card p-5"><p className="eyebrow">Analytics</p><h2 className="font-display text-xl mt-1">{title}</h2><div className="mt-5 h-64">{children}</div></section>;

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosClient.get('/analytics/inventory')
      .then((response) => setData(response.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load analytics.'));
  }, []);

  if (error) return <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12"><p className="border-l-2 border-ember pl-3 text-ember-600">{error}</p></div>;
  if (!data) return <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 text-steel-600">Loading dashboard…</div>;

  const categoryData = data.vehicleCountByCategory.map((item) => ({ name: item._id, stock: item.stock, value: item.value }));
  const brandData = data.vehicleCountByBrand.slice(0, 8).map((item) => ({ name: item._id, stock: item.stock }));
  const invoiceStats = data.invoiceStats || { totalSales: 0, todaySales: 0, monthlySales: 0, averageInvoiceValue: 0, invoiceCount: 0, recentInvoices: [], topSellingVehicles: [], topCustomers: [] };
  const highlights = [
    ['Total vehicles', number(data.totalVehicles)], ['Total stock', number(data.totalStock)], ['Out of stock', number(data.outOfStockVehicles)], ['Low stock', number(data.lowStockVehicles)], ['Inventory value', money(data.inventoryValue)], ['Avg. vehicle price', money(data.averageVehiclePrice)],
  ];
  const invoiceHighlights = [
    ['Total sales', money(invoiceStats.totalSales)], ['Today’s sales', money(invoiceStats.todaySales)], ['Monthly sales', money(invoiceStats.monthlySales)], ['Avg. invoice', money(invoiceStats.averageInvoiceValue)], ['Invoices issued', number(invoiceStats.invoiceCount)], ['Highest invoice', invoiceStats.highestInvoice ? money(invoiceStats.highestInvoice.totalAmount) : '—'],
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
      <p className="eyebrow">Administration</p>
      <h1 className="font-display text-4xl mt-1">Inventory Overview</h1>
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">{highlights.map(([label, value]) => <div className="card p-5" key={label}><p className="eyebrow">{label}</p><p className="font-display mt-2 text-2xl">{value}</p></div>)}</div>
      <section className="mt-10">
        <p className="eyebrow">Revenue intelligence</p>
        <h2 className="font-display mt-1 text-3xl">Invoice Overview</h2>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-3">{invoiceHighlights.map(([label, value]) => <div className="card p-5" key={label}><p className="eyebrow">{label}</p><p className="font-display mt-2 text-2xl">{value}</p></div>)}</div>
      </section>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ChartPanel title="Stock by category"><ResponsiveContainer width="100%" height="100%"><BarChart data={categoryData}><CartesianGrid vertical={false} stroke="#C7CAD1" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="stock" fill="#9A2B1F" /></BarChart></ResponsiveContainer></ChartPanel>
        <ChartPanel title="Stock by brand"><ResponsiveContainer width="100%" height="100%"><BarChart data={brandData}><CartesianGrid vertical={false} stroke="#C7CAD1" /><XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="stock" fill="#B08D57" /></BarChart></ResponsiveContainer></ChartPanel>
        <ChartPanel title="Inventory value by category"><ResponsiveContainer width="100%" height="100%"><BarChart data={categoryData}><CartesianGrid vertical={false} stroke="#C7CAD1" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tickFormatter={money} /><Tooltip formatter={(value) => money(value)} /><Bar dataKey="value" fill="#13151A" /></BarChart></ResponsiveContainer></ChartPanel>
        <ChartPanel title="Monthly purchases"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.monthlyPurchases}><CartesianGrid vertical={false} stroke="#C7CAD1" /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="purchases" stroke="#9A2B1F" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></ChartPanel>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="card p-5"><p className="eyebrow">Latest additions</p><h2 className="font-display text-xl mt-1">New inventory</h2><ul className="mt-4 divide-y divide-steel-300/60">{data.latestVehicles.map((vehicle) => <li key={vehicle._id} className="py-3 text-sm"><span className="font-medium">{vehicle.make} {vehicle.model}</span><span className="float-right text-steel-600">{vehicle.quantity} units</span></li>)}</ul></section>
        <section className="card p-5"><p className="eyebrow">Recent purchases</p><h2 className="font-display text-xl mt-1">Latest orders</h2><ul className="mt-4 divide-y divide-steel-300/60">{data.recentPurchases.map((purchase) => <li key={purchase._id} className="py-3 text-sm"><span className="font-medium">{purchase.vehicle?.make || purchase.vehicleSnapshot?.make} {purchase.vehicle?.model || purchase.vehicleSnapshot?.model}</span><span className="block text-xs text-steel-600">{purchase.customer?.name || 'Customer'} · {purchase.quantity} unit(s)</span></li>)}</ul></section>
        <section className="card p-5"><p className="eyebrow">Recent activity</p><h2 className="font-display text-xl mt-1">Inventory log</h2><ul className="mt-4 divide-y divide-steel-300/60">{data.recentActivity.map((activity) => <li key={activity._id} className="py-3 text-sm"><span>{activity.message}</span><span className="block text-xs text-steel-600">{activity.actor?.name || 'System'}</span></li>)}</ul></section>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="card p-5"><p className="eyebrow">Recent invoices</p><h2 className="font-display text-xl mt-1">Latest sales</h2><ul className="mt-4 divide-y divide-steel-300/60">{invoiceStats.recentInvoices.length ? invoiceStats.recentInvoices.map((invoice) => <li key={invoice._id} className="py-3 text-sm"><span className="font-medium">{invoice.invoiceNumber}</span><span className="float-right">{money(invoice.totalAmount)}</span><span className="block text-xs text-steel-600">{invoice.customer?.name || invoice.customerSnapshot?.name || 'Customer'}</span></li>) : <li className="py-3 text-sm text-steel-600">No invoices yet.</li>}</ul></section>
        <section className="card p-5"><p className="eyebrow">Top selling vehicles</p><h2 className="font-display text-xl mt-1">Most units sold</h2><ul className="mt-4 divide-y divide-steel-300/60">{invoiceStats.topSellingVehicles.length ? invoiceStats.topSellingVehicles.map((vehicle) => <li key={vehicle._id} className="py-3 text-sm"><span className="font-medium">{vehicle.make || 'Vehicle'} {vehicle.model || ''}</span><span className="float-right">{vehicle.quantity} units</span><span className="block text-xs text-steel-600">{money(vehicle.sales)}</span></li>) : <li className="py-3 text-sm text-steel-600">No sales yet.</li>}</ul></section>
        <section className="card p-5"><p className="eyebrow">Top customers</p><h2 className="font-display text-xl mt-1">Highest spend</h2><ul className="mt-4 divide-y divide-steel-300/60">{invoiceStats.topCustomers.length ? invoiceStats.topCustomers.map((customer) => <li key={customer._id} className="py-3 text-sm"><span className="font-medium">{customer.name || 'Customer'}</span><span className="float-right">{money(customer.sales)}</span><span className="block text-xs text-steel-600">{customer.invoices} invoice(s)</span></li>) : <li className="py-3 text-sm text-steel-600">No customer sales yet.</li>}</ul></section>
      </div>
    </div>
  );
};

export default AdminDashboard;
