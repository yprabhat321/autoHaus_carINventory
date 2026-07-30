import React, { useState } from 'react';

const ConfirmationModal = ({ title, description, confirmLabel, onConfirm, onClose }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'That action could not be completed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
      <div className="w-full max-w-sm bg-paper p-8">
        <p className="eyebrow">Confirmation required</p>
        <h2 id="confirmation-title" className="font-display text-2xl mt-1">{title}</h2>
        <p className="mt-4 text-sm leading-6 text-steel-600">{description}</p>
        {error && <p className="mt-4 border-l-2 border-ember pl-3 text-sm text-ember-600">{error}</p>}
        <div className="mt-7 flex gap-3">
          <button type="button" className="btn-primary" onClick={confirm} disabled={busy}>{busy ? 'Working…' : confirmLabel}</button>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
