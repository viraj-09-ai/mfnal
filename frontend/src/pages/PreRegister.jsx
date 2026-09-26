import React, { useState } from 'react';
import api, { API_BASE_URL } from '../api/api';

const PreRegister = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', purpose: '', validUntil: '' });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [status, setStatus] = useState('');
  const [statusOk, setStatusOk] = useState(true);
  const [badgeUrl, setBadgeUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhoto(file || null);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Submitting...');
    setStatusOk(true);
    setBadgeUrl('');
    setSubmitting(true);

    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => payload.append(key, value));
      if (photo) payload.append('photo', photo);

      const res = await api.post('/api/visitors/register', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setStatus('Registration successful! Pass and badge generated.');
      setStatusOk(true);
      setBadgeUrl(res.data.badgeDownloadUrl);
      setFormData({ name: '', email: '', phone: '', purpose: '', validUntil: '' });
      setPhoto(null);
      setPhotoPreview(null);
    } catch (error) {
      console.error(error);
      setStatus(error.response?.data?.error || 'Failed to register visitor.');
      setStatusOk(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Pre-Register Visitor</h1>
      <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
        <div>
          <label className="block mb-1 font-medium">Visitor Name</label>
          <input
            type="text"
            required
            className="w-full border p-2 rounded"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Visitor Email (optional)</label>
          <input
            type="email"
            className="w-full border p-2 rounded"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Phone Number</label>
          <input
            type="tel"
            required
            className="w-full border p-2 rounded"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Purpose of Visit</label>
          <input
            type="text"
            required
            className="w-full border p-2 rounded"
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Valid Until</label>
          <input
            type="datetime-local"
            required
            className="w-full border p-2 rounded"
            value={formData.validUntil}
            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Visitor Photo (optional)</label>
          <input type="file" accept="image/*" className="w-full border p-2 rounded" onChange={handlePhotoChange} />
          {photoPreview && (
            <img src={photoPreview} alt="Preview" className="mt-2 w-24 h-24 object-cover rounded border" />
          )}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Registering...' : 'Register & Generate Pass'}
        </button>
      </form>
      {status && (
        <p className={`mt-4 font-medium text-center ${statusOk ? 'text-green-700' : 'text-red-600'}`}>{status}</p>
      )}
      {badgeUrl && (
        <a
          href={`${API_BASE_URL}${badgeUrl}`}
          target="_blank"
          rel="noreferrer"
          className="block mt-3 text-center bg-green-600 text-white p-2 rounded hover:bg-green-700"
        >
          Download Visitor Badge (PDF)
        </a>
      )}
    </div>
  );
};

export default PreRegister;
