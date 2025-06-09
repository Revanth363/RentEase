import React, { useEffect, useState } from 'react';
import axios from 'axios';

const VerificationStatus = ({ userId, userModel }) => {
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [fileInput, setFileInput] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [skillTypes, setSkillTypes] = useState([]);

  useEffect(() => {
    fetchVerification();
  }, [userId, userModel]);

  const fetchVerification = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/verification/status?userId=${userId}&userModel=${userModel}`);
      setVerification(res.data);
      setDocuments(res.data.documents || []);
    } catch (err) {
      setVerification(null);
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFileInput(files);
    setDocumentTypes(Array(files.length).fill(''));
    setSkillTypes(Array(files.length).fill(''));
  };

  const handleUpload = async () => {
    if (!fileInput || fileInput.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < fileInput.length; i++) {
      formData.append('documents', fileInput[i]);
    }
    formData.append('userId', userId);
    formData.append('userModel', userModel);
    documentTypes.forEach((type, i) => formData.append('documentTypes', type));
    skillTypes.forEach((type, i) => formData.append('skillTypes', type));
    try {
      await axios.post('/api/verification/upload', formData);
      fetchVerification();
    } catch (err) {
      // handle error
    }
    setUploading(false);
  };

  if (loading) return <div>Loading verification status...</div>;

  if (!verification || verification.status === 'pending') {
    return (
      <div>
        <h4>Verification Status: Pending</h4>
        <p>Your documents are under review. You will be notified once approved.</p>
        <div>
          <input type="file" multiple accept=".pdf,image/*" onChange={handleFileChange} />
          {fileInput.length > 0 && fileInput.map((file, idx) => (
            <div key={idx} style={{ marginBottom: 8 }}>
              <label>Document Type:&nbsp;
                <select value={documentTypes[idx]} onChange={e => {
                  const arr = [...documentTypes];
                  arr[idx] = e.target.value;
                  setDocumentTypes(arr);
                }} required>
                  <option value="">Select</option>
                  {userModel === 'tenant' && <>
                    <option value="aadhaar">Aadhaar</option>
                    <option value="pan">PAN</option>
                    <option value="driving_license">Driving License</option>
                    <option value="college_id">College ID</option>
                    <option value="other_proof">Other Proof</option>
                  </>}
                  {userModel === 'worker' && <>
                    <option value="aadhaar">Aadhaar</option>
                    <option value="pan">PAN</option>
                    <option value="driving_license">Driving License</option>
                    <option value="skill_certificate">Skill Certificate</option>
                  </>}
                  {userModel === 'owner' && <>
                    <option value="aadhaar">Aadhaar</option>
                    <option value="pan">PAN</option>
                    <option value="driving_license">Driving License</option>
                    <option value="property_proof">Property Proof</option>
                  </>}
                </select>
              </label>
              {documentTypes[idx] === 'skill_certificate' && userModel === 'worker' && (
                <label>&nbsp;Skill Type:&nbsp;
                  <select value={skillTypes[idx]} onChange={e => {
                    const arr = [...skillTypes];
                    arr[idx] = e.target.value;
                    setSkillTypes(arr);
                  }} required>
                    <option value="">Select</option>
                    <option value="cook">Cook</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="gardening">Gardening</option>
                    <option value="caretaker">Caretaker</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              )}
            </div>
          ))}
          <button onClick={handleUpload} disabled={uploading}>Upload Documents</button>
        </div>
      </div>
    );
  }
  if (verification.status === 'rejected') {
    return (
      <div>
        <h4>Verification Status: Rejected</h4>
        <p>Reason: {verification.rejectionReason || 'Not provided'}</p>
        <div>
          <input type="file" multiple accept=".pdf,image/*" onChange={handleFileChange} />
          {fileInput.length > 0 && fileInput.map((file, idx) => (
            <div key={idx} style={{ marginBottom: 8 }}>
              <label>Document Type:&nbsp;
                <select value={documentTypes[idx]} onChange={e => {
                  const arr = [...documentTypes];
                  arr[idx] = e.target.value;
                  setDocumentTypes(arr);
                }} required>
                  <option value="">Select</option>
                  {userModel === 'tenant' && <>
                    <option value="aadhaar">Aadhaar</option>
                    <option value="pan">PAN</option>
                    <option value="driving_license">Driving License</option>
                    <option value="college_id">College ID</option>
                    <option value="other_proof">Other Proof</option>
                  </>}
                  {userModel === 'worker' && <>
                    <option value="aadhaar">Aadhaar</option>
                    <option value="pan">PAN</option>
                    <option value="driving_license">Driving License</option>
                    <option value="skill_certificate">Skill Certificate</option>
                  </>}
                  {userModel === 'owner' && <>
                    <option value="aadhaar">Aadhaar</option>
                    <option value="pan">PAN</option>
                    <option value="driving_license">Driving License</option>
                    <option value="property_proof">Property Proof</option>
                  </>}
                </select>
              </label>
              {documentTypes[idx] === 'skill_certificate' && userModel === 'worker' && (
                <label>&nbsp;Skill Type:&nbsp;
                  <select value={skillTypes[idx]} onChange={e => {
                    const arr = [...skillTypes];
                    arr[idx] = e.target.value;
                    setSkillTypes(arr);
                  }} required>
                    <option value="">Select</option>
                    <option value="cook">Cook</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="gardening">Gardening</option>
                    <option value="caretaker">Caretaker</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              )}
            </div>
          ))}
          <button onClick={handleUpload} disabled={uploading}>Re-upload Documents</button>
        </div>
      </div>
    );
  }
  if (verification.status === 'approved') {
    return (
      <div>
        <h4>Verification Status: Approved</h4>
        <ul>
          {documents.map((doc, idx) => (
            <li key={idx}><a href={doc.url} target="_blank" rel="noopener noreferrer">Document {idx + 1}</a></li>
          ))}
        </ul>
      </div>
    );
  }
  return null;
};

export default VerificationStatus;
