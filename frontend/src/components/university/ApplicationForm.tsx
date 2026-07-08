// University User component for submitting applications (FR-APP-001 to FR-APP-008)
import React, { useState } from 'react';
import { ApplicationFormData } from '../../types';
import { Input, FileUpload, Button, Card } from '../common';
import { validateEmail, validateGPA } from '../../utils/validation';
import { applicationService } from '../../services';
import { getAuthErrorMessage } from '../../services';

interface ApplicationFormProps {
  onSuccess: () => void;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<ApplicationFormData>({
    student_name: '',
    department: '',
    gpa: 0,
    institutional_email: '',
    transcript: null,
    request_letter: null,
    recommendation_letter: null,
    internship_start_date: '',
    internship_end_date: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ApplicationFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ApplicationFormData, string>> = {};

    if (!formData.student_name.trim()) {
      newErrors.student_name = 'Student name is required';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }

    if (formData.gpa > 0 && !validateGPA(formData.gpa)) {
      newErrors.gpa = 'GPA must be between 0 and 4.0';
    }

    if (!formData.institutional_email.trim()) {
      newErrors.institutional_email = 'Personal email is required';
    } else if (!validateEmail(formData.institutional_email)) {
      newErrors.institutional_email = 'Enter a valid email address';
    }

    if (!formData.request_letter) {
      newErrors.request_letter = 'Request letter is required';
    }

    if (formData.internship_start_date && formData.internship_end_date) {
      const startDate = new Date(formData.internship_start_date);
      const endDate = new Date(formData.internship_end_date);
      if (endDate <= startDate) {
        newErrors.internship_end_date = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      await applicationService.submitApplication(formData);
      setShowSuccess(true);
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center text-center py-8 space-y-5">
        <div className="w-16 h-16 rounded-full bg-status-approved-bg flex items-center justify-center">
          <svg className="w-8 h-8 text-eth-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3 className="text-h3 text-text-primary font-semibold">Application Submitted!</h3>
          <p className="text-body-sm text-text-muted mt-1">
            Your application has been received and is under review. You'll be notified of any updates.
          </p>
        </div>
        <Button variant="primary" onClick={onSuccess}>Back to Applications</Button>
      </div>
    );
  }

  return (
    <Card title="New Internship Application" className="w-full max-w-none">
      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <Input
            label="Student Full Name"
            value={formData.student_name}
            onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
            error={errors.student_name}
            required
          />

          <Input
            label="Department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            error={errors.department}
            required
          />

          <Input
            label="GPA (optional)"
            type="number"
            step="0.01"
            min="0"
            max="4.0"
            value={formData.gpa || ''}
            onChange={(e) => setFormData({ ...formData, gpa: parseFloat(e.target.value) || 0 })}
            error={errors.gpa}
          />

          <Input
            label="Personal Email"
            type="email"
            value={formData.institutional_email}
            onChange={(e) => setFormData({ ...formData, institutional_email: e.target.value })}
            error={errors.institutional_email}
            className="sm:col-span-2"
            required
          />
        </div>

        <div className="space-y-4 border-t pt-5 md:pt-6">
          <h4 className="font-medium text-text-primary">Internship Period</h4>
          <p className="text-sm text-text-muted">
            Specify the expected start and end dates for the internship (optional).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <Input
              label="Start Date (optional)"
              type="date"
              value={formData.internship_start_date || ''}
              onChange={(e) => setFormData({ ...formData, internship_start_date: e.target.value })}
              error={errors.internship_start_date}
            />

            <Input
              label="End Date (optional)"
              type="date"
              value={formData.internship_end_date || ''}
              onChange={(e) => setFormData({ ...formData, internship_end_date: e.target.value })}
              error={errors.internship_end_date}
            />
          </div>
        </div>

        <div className="space-y-4 border-t pt-5 md:pt-6">
          <h4 className="font-medium text-text-primary">Documents</h4>
          <p className="text-sm text-text-muted">
            University request letter is required. Transcript and recommendation letter are optional.
            PDF or DOCX only, max 10 MB per file.
          </p>

          <FileUpload
            label="Academic Transcript (optional)"
            onChange={(file) => setFormData({ ...formData, transcript: file })}
            error={errors.transcript}
            currentFile={formData.transcript}
          />

          <FileUpload
            label="University Request Letter"
            onChange={(file) => setFormData({ ...formData, request_letter: file })}
            error={errors.request_letter}
            currentFile={formData.request_letter}
            required
          />

          <FileUpload
            label="Recommendation Letter (optional)"
            onChange={(file) => setFormData({ ...formData, recommendation_letter: file })}
            error={errors.recommendation_letter}
            currentFile={formData.recommendation_letter}
          />
        </div>

        <div className="space-y-4 pt-5 md:pt-6 border-t">
          {submitError && (
            <div className="flex items-center gap-2 bg-status-rejected-bg border border-[#FECACA] text-status-rejected-text px-4 py-3 rounded-lg text-body-sm font-medium">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {submitError}
            </div>
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="submit" variant="primary" isLoading={isLoading} fullWidth className="sm:w-auto">
              Submit Application
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
};
