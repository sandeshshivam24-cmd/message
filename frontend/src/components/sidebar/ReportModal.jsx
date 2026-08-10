import React, { useState } from 'react';
import { privacyApi } from '../../api/client';
import { X, AlertTriangle, Check } from 'lucide-react';

export const ReportModal = ({ targetUser, isOpen, onClose }) => {
  const [reason, setReason] = useState('Harassment or Bullying');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !targetUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await privacyApi.reportUser({
        reportedUserId: targetUser.id,
        reason,
        details
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Report submission failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px', padding: '24px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} color="#f43f5e" />
            <h3 className="modal-title">Report User</h3>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Submit a report regarding <strong style={{ color: 'white' }}>{targetUser.displayName || targetUser.username}</strong>. Reports are handled confidentially.
        </p>

        {submitted ? (
          <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600 }}>
            <Check size={20} /> Report submitted successfully.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>
                Reason for report
              </label>
              <select
                className="search-input"
                style={{ cursor: 'pointer' }}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="Harassment or Bullying">Harassment or Bullying</option>
                <option value="Spam or Scam">Spam or Scam</option>
                <option value="Inappropriate Content">Inappropriate Content</option>
                <option value="Impersonation">Impersonation</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>
                Additional Details (Optional)
              </label>
              <textarea
                className="search-input"
                style={{ height: '80px', resize: 'none' }}
                placeholder="Provide context..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '10px',
                padding: '12px',
                borderRadius: '12px',
                background: '#f43f5e',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
