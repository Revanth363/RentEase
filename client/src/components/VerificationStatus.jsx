import axios from 'axios';
import { useEffect, useState } from 'react';

const VerificationStatus = ({ userId, userModel }) => {
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fileInput, setFileInput] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (!userId) return; // wait until userId is available
    fetchVerification();
  }, [userId, userModel]);

  const fetchVerification = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/verification/status?userId=${userId}&userModel=${userModel}`, { withCredentials: true });
      setVerification(res.data);
    } catch {
      setVerification(null);
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    setFileInput(Array.from(e.target.files));
    setUploadError('');
    setUploadSuccess(false);
  };

  const handleUpload = async () => {
    if (!fileInput.length) { setUploadError('Please select at least one file.'); return; }
    setUploading(true);
    setUploadError('');
    const formData = new FormData();
    fileInput.forEach(f => formData.append('documents', f));
    formData.append('userId', userId);
    formData.append('userModel', userModel);
    try {
      await axios.post('/verification/upload', formData, { withCredentials: true });
      setFileInput([]);
      setUploadSuccess(true);
      fetchVerification();
    } catch (err) {
      setUploadError(err?.response?.data?.error || 'Upload failed. Please try again.');
    }
    setUploading(false);
  };

  // ── Shared upload form ──────────────────────────────────────────────────────
  const UploadForm = ({ isReupload }) => (
    <div style={{
      marginTop: 20, background: '#fff', borderRadius: 10, padding: 20,
      border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }}>
      <h4 style={{ margin: '0 0 8px', color: '#232f3e' }}>
        {isReupload ? 'Re-upload Documents' : 'Upload Identity Documents'}
      </h4>
      <p style={{ margin: '0 0 14px', color: '#555', fontSize: '14px' }}>
        Please upload a clear scan or photo of any of the following:&nbsp;
        <strong>Aadhaar, PAN Card, Driving License,</strong> or <strong>Other valid ID</strong>.
        {userModel === 'worker' && <> Skill certificates are also accepted.</>}
        &nbsp;Accepted formats: <em>JPG, PNG, PDF</em>.
      </p>

      <label style={{
        display: 'inline-block', padding: '10px 18px', background: '#f0f0f0',
        borderRadius: 8, border: '2px dashed #aaa', cursor: 'pointer', fontSize: 14,
        marginBottom: 10
      }}>
        📎 Choose Files
        <input type="file" multiple accept=".pdf,image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }} />
      </label>

      {fileInput.length > 0 && (
        <div style={{ margin: '10px 0' }}>
          <p style={{ margin: '0 0 6px', fontSize: 13, color: '#555' }}>
            {fileInput.length} file{fileInput.length > 1 ? 's' : ''} selected:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
            {fileInput.map((f, i) => <li key={i} style={{ color: '#333' }}>{f.name}</li>)}
          </ul>
        </div>
      )}

      {uploadError && (
        <p style={{ color: '#c0392b', background: '#fff5f5', padding: '8px 12px', borderRadius: 6, fontSize: 13, margin: '8px 0' }}>
          ⚠ {uploadError}
        </p>
      )}
      {uploadSuccess && (
        <p style={{ color: '#155724', background: '#d4edda', padding: '8px 12px', borderRadius: 6, fontSize: 13, margin: '8px 0' }}>
          ✓ Documents uploaded successfully! Awaiting admin review.
        </p>
      )}

      <button
        onClick={handleUpload}
        disabled={uploading || !fileInput.length}
        style={{
          marginTop: 10, padding: '10px 24px', background: '#ff9900', color: 'white',
          border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14,
          cursor: (uploading || !fileInput.length) ? 'not-allowed' : 'pointer',
          opacity: (uploading || !fileInput.length) ? 0.6 : 1,
        }}
      >
        {uploading ? 'Uploading...' : isReupload ? 'Re-upload' : 'Submit Documents'}
      </button>
    </div>
  );

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (!userId || loading) return (
    <div style={{ padding: 20, color: '#777' }}>Loading verification status...</div>
  );

  // ── No submission yet ───────────────────────────────────────────────────────
  if (!verification || !verification.status) {
    return (
      <div style={{ padding: '4px 0' }}>
        <div style={{
          background: '#fff3cd', border: '1px solid #ffecb5', borderRadius: 10,
          padding: '16px 20px', marginBottom: 10,
        }}>
          <h4 style={{ margin: '0 0 4px', color: '#856404' }}>⚠ Account Not Verified</h4>
          <p style={{ margin: 0, fontSize: 14, color: '#6b4f04' }}>
            You need to verify your identity to access all features.
          </p>
        </div>
        <UploadForm isReupload={false} />
      </div>
    );
  }

  // ── Pending ──────────────────────────────────────────────────────────────────
  if (verification.status === 'pending') {
    return (
      <div style={{ padding: '4px 0' }}>
        <div style={{
          background: '#fff3cd', border: '1px solid #ffecb5', borderRadius: 10,
          padding: '16px 20px', marginBottom: 10,
        }}>
          <h4 style={{ margin: '0 0 4px', color: '#856404' }}>🕐 Verification Pending</h4>
          <p style={{ margin: 0, fontSize: 14, color: '#6b4f04' }}>
            Your documents are under review. You will be notified once approved.
          </p>
        </div>
        <div style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', border: '1px solid #e0e0e0' }}>
          <p style={{ margin: '0 0 10px', fontWeight: 600, color: '#232f3e', fontSize: 14 }}>
            Submitted documents ({verification.documents?.length || 0}):
          </p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {(verification.documents || []).map((doc, i) => (
              <li key={i} style={{ marginBottom: 4, fontSize: 13 }}>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>
                  Document {i + 1}
                </a>
              </li>
            ))}
          </ul>
          <p style={{ margin: '12px 0 0', fontSize: 13, color: '#777' }}>
            Want to replace your documents? Upload new ones below.
          </p>
        </div>
        <UploadForm isReupload={true} />
      </div>
    );
  }

  // ── Rejected ─────────────────────────────────────────────────────────────────
  if (verification.status === 'rejected') {
    return (
      <div style={{ padding: '4px 0' }}>
        <div style={{
          background: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: 10,
          padding: '16px 20px', marginBottom: 10,
        }}>
          <h4 style={{ margin: '0 0 4px', color: '#721c24' }}>✕ Verification Rejected</h4>
          <p style={{ margin: 0, fontSize: 14, color: '#721c24' }}>
            <strong>Reason:</strong> {verification.rejectionReason || 'Not provided. Please contact support.'}
          </p>
        </div>
        <UploadForm isReupload={true} />
      </div>
    );
  }

  // ── Approved ──────────────────────────────────────────────────────────────────
  if (verification.status === 'approved') {
    return (
      <div style={{
        background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: 10,
        padding: '16px 20px',
      }}>
        <h4 style={{ margin: '0 0 4px', color: '#155724' }}>✓ Verified</h4>
        <p style={{ margin: 0, fontSize: 14, color: '#155724' }}>
          Your account has been verified. All features are now unlocked.
        </p>
      </div>
    );
  }

  return null;
};

export default VerificationStatus;
