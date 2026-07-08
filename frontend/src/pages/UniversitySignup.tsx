// University Signup Page
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { universityService } from '../services/university.service';
import { Button, Input, Textarea, Card, LoadingSpinner } from '../components/common';
import './UniversitySignup.css';

const UniversitySignup: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    address: '',
    contact_person_name: '',
    contact_person_email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('University name is required');
      return false;
    }
    if (!formData.contact_email.trim()) {
      setError('Contact email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      setError('Please enter a valid contact email');
      return false;
    }
    if (!formData.address.trim()) {
      setError('University address is required');
      return false;
    }
    if (!formData.contact_person_name.trim()) {
      setError('Contact person name is required');
      return false;
    }
    if (!formData.contact_person_email.trim()) {
      setError('Contact person email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_person_email)) {
      setError('Please enter a valid contact person email');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await universityService.signupUniversity({
        name: formData.name,
        contact_email: formData.contact_email,
        address: formData.address,
        contact_person_name: formData.contact_person_name,
        contact_person_email: formData.contact_person_email,
        password: formData.password,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      let errorMsg = 'Failed to register university';
      
      if (err instanceof Error) {
        // Check if it's an axios error with response data
        const axiosError = err as any;
        
        // Check for backend error response format
        if (axiosError.response?.data) {
          const responseData = axiosError.response.data;
          
          // If there are validation field errors, format them nicely
          if (responseData.fields && Array.isArray(responseData.fields)) {
            errorMsg = responseData.fields
              .map((f: any) => f.message)
              .join('; ');
          } else if (responseData.message) {
            errorMsg = Array.isArray(responseData.message)
              ? responseData.message[0]
              : responseData.message;
          } else if (responseData.error) {
            errorMsg = responseData.error;
          }
        } else {
          errorMsg = err.message;
        }
      }
      
      setError(errorMsg);
      console.error('University signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="us-root">
        <div className="us-container">
          <Card className="us-card">
            <div className="us-success">
              <div className="us-success-icon">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="us-success-title">Registration Submitted</h2>
              <p className="us-success-message">
                Your university registration has been submitted successfully. An administrator will review your application and you will receive an email notification once your registration is approved.
              </p>
              <p className="us-success-email">
                Confirmation email sent to: <strong>{formData.contact_email}</strong>
              </p>
              <Button variant="primary" onClick={() => navigate('/login')} className="us-success-button">
                Go to Login
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="us-root">
      <div className="us-container">
        <Card className="us-card">
          <div className="us-header">
            <h1 className="us-title">University Registration</h1>
            <p className="us-subtitle">
              Register your university to manage student internship applications
            </p>
          </div>

          {error && (
            <div className="us-error">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="us-form">
            <div className="us-section">
              <h3 className="us-section-title">University Information</h3>

              <Input
                label="University Name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter university name"
                required
              />

              <Input
                label="Contact Email"
                name="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={handleChange}
                placeholder="university@example.com"
                required
              />

              <Textarea
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="University address"
                rows={3}
                required
              />
            </div>

            <div className="us-section">
              <h3 className="us-section-title">Contact Person</h3>

              <Input
                label="Contact Person Name"
                name="contact_person_name"
                type="text"
                value={formData.contact_person_name}
                onChange={handleChange}
                placeholder="Full name"
                required
              />

              <Input
                label="Contact Person Email"
                name="contact_person_email"
                type="email"
                value={formData.contact_person_email}
                onChange={handleChange}
                placeholder="contact@example.com"
                required
              />
            </div>

            <div className="us-section">
              <h3 className="us-section-title">Account Credentials</h3>

              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                required
              />

              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                required
              />
            </div>

            <div className="us-actions">
              <Button variant="secondary" onClick={() => navigate('/login')} type="button">
                Back to Login
              </Button>
              <Button variant="primary" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" /> Registering...
                  </>
                ) : (
                  'Register University'
                )}
              </Button>
            </div>
          </form>

          <p className="us-footer">
            Already registered? <a href="/login" className="us-footer-link">Go to login</a>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default UniversitySignup;
