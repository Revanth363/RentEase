import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Button, Modal, Form, Spinner } from 'react-bootstrap';
import styles from "../assets/css/AdminDashboard.module.css";

const AdminUserVerifications = () => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/verifications/pending');
      setVerifications(res.data);
    } catch (err) {
      // handle error
    }
    setLoading(false);
  };

  const handleApprove = async (id) => {
    await axios.post(`/api/admin/verifications/${id}/approve`);
    fetchVerifications();
  };

  const handleReject = async () => {
    if (!selectedVerification) return;
    await axios.post(`/api/admin/verifications/${selectedVerification._id}/reject`, { reason: rejectionReason });
    setShowModal(false);
    setRejectionReason('');
    setSelectedVerification(null);
    fetchVerifications();
  };

  if (loading) return <Spinner animation="border" />;

  return (
    <div className="admin-dashboard-container">
      <h2>User Verifications</h2>
      {verifications.length === 0 ? (
        <p>No pending verifications.</p>
      ) : (
        verifications.map(v => (
          <Card key={v._id} className="mb-3">
            <Card.Body>
              <Card.Title>{v.user?.firstName} {v.user?.lastName} ({v.userModel})</Card.Title>
              <Card.Text>Status: {v.status}</Card.Text>
              <Card.Text>Uploaded Documents:</Card.Text>
              <ul>
                {v.documents.map((doc, idx) => (
                  <li key={idx}>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">Document {idx + 1}</a>
                    {doc.type && <span> &mdash; <strong>Type:</strong> {doc.type.replace('_', ' ')}</span>}
                    {doc.skillType && <span> &mdash; <strong>Skill:</strong> {doc.skillType}</span>}
                  </li>
                ))}
              </ul>
              <Button variant="success" onClick={() => handleApprove(v._id)}>Approve</Button>{' '}
              <Button variant="danger" onClick={() => { setSelectedVerification(v); setShowModal(true); }}>Reject</Button>
            </Card.Body>
          </Card>
        ))
      )}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reject Verification</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Rejection Reason</Form.Label>
              <Form.Control type="text" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleReject}>Reject</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminUserVerifications;
