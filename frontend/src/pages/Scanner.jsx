import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import api from '../api/api';

const Scanner = () => {
  const [scanResult, setScanResult] = useState('');
  const [status, setStatus] = useState('');
  const [lastAction, setLastAction] = useState('');
  const [busy, setBusy] = useState(false);

  const handleScan = async (result) => {
    if (!result || busy) return;

    const qrData = result?.text;
    if (!qrData || qrData === scanResult) return; // ignore duplicate frames of the same code

    setScanResult(qrData);
    setBusy(true);

    try {
      const res = await api.post('/api/visitors/scan', { qrData });
      setLastAction(res.data.action);
      const visitorName = res.data.visitor?.name || 'Visitor';
      setStatus(`${res.data.action} recorded for ${visitorName}.`);
    } catch (error) {
      console.error(error);
      setLastAction('');
      setStatus(error.response?.data?.error || 'Invalid or expired pass.');
    } finally {
      // Small cooldown so the same code isn't scanned twice in a row instantly.
      setTimeout(() => setBusy(false), 2000);
    }
  };

  const statusColor =
    lastAction === 'Check-In' ? 'text-green-600' : lastAction === 'Check-Out' ? 'text-orange-600' : 'text-red-600';

  return (
    <div className="p-8 max-w-md mx-auto text-center">
      <h1 className="text-2xl font-bold mb-6">Scan Visitor Pass</h1>
      <p className="text-sm text-gray-500 mb-4">
        Scanning automatically toggles between Check-In and Check-Out for that pass.
      </p>

      <div className="border-4 border-dashed border-gray-300 p-2 mb-4">
        <QrReader onResult={handleScan} constraints={{ facingMode: 'environment' }} containerStyle={{ width: '100%' }} />
      </div>

      {scanResult && <p className="text-gray-600 mb-2 break-all text-sm">Scanned Pass ID: {scanResult}</p>}
      {status && <p className={`font-bold ${statusColor}`}>{status}</p>}
    </div>
  );
};

export default Scanner;
