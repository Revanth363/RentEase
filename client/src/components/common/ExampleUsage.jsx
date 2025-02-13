// Example usage of reusable components with CSS Modules

import React, { useState } from 'react';
import Input from './components/common/Input';
import Button from './components/common/Button';
import Select from './components/common/Select';
import Alert from './components/common/Alert';

export default function ExampleForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const userTypeOptions = [
    { value: 'tenant', label: 'Tenant' },
    { value: 'owner', label: 'Owner' },
    { value: 'worker', label: 'Worker' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setAlert({ type: 'success', message: 'Form submitted successfully!' });
    }, 2000);
  };

  return (
    <div>
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
          duration={5000}
        />
      )}

      <form onSubmit={handleSubmit}>
        <Select
          id="userType"
          label="User Type"
          value={formData.userType}
          onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
          options={userTypeOptions}
          error={errors.userType}
          required
        />

        <Input
          id="email"
          type="email"
          label="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Enter your email"
          error={errors.email}
          required
        />

        <Input
          id="password"
          type="password"
          label="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Enter your password"
          error={errors.password}
          required
        />

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          fullWidth
        >
          Submit
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={() => console.log('Secondary action')}
          fullWidth={false}
        >
          Cancel
        </Button>
      </form>
    </div>
  );
}
