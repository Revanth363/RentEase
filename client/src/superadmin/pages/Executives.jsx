import React, { useState, useEffect } from 'react';
import styles from './Executives.module.css';
import { Plus, Search, AlertCircle, Edit } from 'lucide-react';
import { getExecutives, createExecutive, updateExecutive, updateExecutiveStatus, deleteExecutive } from '../../services/superadminService';

export default function Executives() {
  const [executives, setExecutives] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingExecutive, setEditingExecutive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form fields for create
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    const fetchExecutives = async () => {
      try {
        const res = await getExecutives();
        setExecutives(res.executives || []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load executives');
      } finally {
        setLoading(false);
      }
    };

    fetchExecutives();
  }, []);

  const filteredExecutives = executives.filter(exec =>
    `${exec.firstName} ${exec.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exec.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (e) => {
  e.preventDefault();

  const executiveData = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    password: formData.password,
    role: 'admin' // or let user select if you add dropdown
  };

  try {
    const res = await createExecutive(executiveData);
    setExecutives([...executives, res.executive]);
    alert(res.message || 'Executive created successfully!');
    setFormData({ firstName: '', lastName: '', email: '', password: '' });
    setShowCreateModal(false);
  } catch (err) {
    alert(err.message || 'Failed to create executive');
  }
};

  const handleToggleStatus = async (exec) => {
    const newStatus = exec.status === 'Active' ? 'Suspended' : 'Active';
    try {
      const res = await updateExecutiveStatus(exec._id, newStatus);
      setExecutives(executives.map(e => e._id === exec._id ? res.executive : e));
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteExecutive(id);
      setExecutives(executives.filter(e => e._id !== id));
      alert('Executive deleted');
    } catch (err) {
      alert(err.message || 'Failed to delete executive');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleEditClick = (exec) => {
    setEditingExecutive(exec);
    setFormData({
      firstName: exec.firstName,
      lastName: exec.lastName,
      email: exec.email,
      password: '',
    });
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();

    const updateData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
    };

    // Only include password if it's provided
    if (formData.password) {
      updateData.password = formData.password;
    }

    try {
      const res = await updateExecutive(editingExecutive._id, updateData);
      setExecutives(executives.map(e => e._id === editingExecutive._id ? res.executive : e));
      alert(res.message || 'Executive updated successfully!');
      setFormData({ firstName: '', lastName: '', email: '', password: '' });
      setShowEditModal(false);
      setEditingExecutive(null);
    } catch (err) {
      alert(err.message || 'Failed to update executive');
    }
  };

  if (loading) return <div className={styles.container}>Loading executives...</div>;
  if (error) return <div className={styles.container} style={{ color: '#dc3545' }}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Executive Management</h1>
        <div className={styles.actions}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search executives..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className={styles.createBtn}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} />
            Create Executive
          </button>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Executive Name</th>
                <th>Email</th>
                <th>Created Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExecutives.map(exec => (
                <tr key={exec._id}>
                  <td className={styles.nameCell}>{exec.firstName} {exec.lastName}</td>
                  <td className={styles.emailCell}>{exec.email}</td>
                  <td>{
                    exec.createdAt
                      ? new Date(exec.createdAt).toLocaleDateString()
                      : '—'
                  }</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        exec.status === 'Active' ? styles.statusActive : styles.statusSuspended
                      }`}
                    >
                      {exec.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.editBtn}
                        onClick={() => handleEditClick(exec)}
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        className={exec.status === 'Active' ? styles.suspendBtn : styles.activateBtn}
                        onClick={() => handleToggleStatus(exec)}
                      >
                        {exec.status === 'Active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => setDeleteConfirm(exec._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Create New Executive</h2>
            <form className={styles.form} onSubmit={handleCreate}>
              <div className={styles.formGroup}>
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Last Name</label>
                <input
                  type="text"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Initial Password</label>
                <input
                  type="password"
                  placeholder="Enter initial password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Create Executive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Edit Executive</h2>
            <form className={styles.form} onSubmit={handleEdit}>
              <div className={styles.formGroup}>
                <label>First Name</label>
                <input
                  type="text"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Last Name</label>
                <input
                  type="text"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>New Password (Leave empty to keep current password)</label>
                <input
                  type="password"
                  placeholder="Enter new password (optional)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingExecutive(null);
                    setFormData({ firstName: '', lastName: '', email: '', password: '' });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Update Executive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.deleteIcon}>
              <AlertCircle size={48} color="#dc3545" />
            </div>
            <h2 className={styles.modalTitle}>Confirm Deletion</h2>
            <p className={styles.deleteMessage}>
              Are you sure you want to delete this executive? This action cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className={styles.confirmDeleteBtn}
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}