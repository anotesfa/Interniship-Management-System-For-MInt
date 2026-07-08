// Student component for submitting milestones (FR-MIL-001 to FR-MIL-005)
import React, { useState } from 'react';
import { Milestone, MilestoneFormData } from '../../types';
import { Input, Textarea, FileUpload, Button } from '../common';
import { validateMilestoneDescription } from '../../utils/validation';
import { milestoneService } from '../../services';

interface MilestoneSubmissionFormProps {
  onSuccess: () => void;
  milestone?: Milestone; // if provided = edit/resubmit mode
}

export const MilestoneSubmissionForm: React.FC<MilestoneSubmissionFormProps> = ({ onSuccess, milestone }) => {
  const isEdit = !!milestone;

  const [formData, setFormData] = useState<MilestoneFormData>({
    title:       milestone?.title       || '',
    description: milestone?.description || '',
    attachment:  null,
  });
  const [errors, setErrors]       = useState<Partial<Record<keyof MilestoneFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError]   = useState('');

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof MilestoneFormData, string>> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!validateMilestoneDescription(formData.description)) newErrors.description = 'Description must be at least 50 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setApiError('');
    setIsLoading(true);
    try {
      if (isEdit && milestone) {
        await milestoneService.updateMilestone(milestone.milestone_id, formData);
      } else {
        await milestoneService.submitMilestone(formData);
      }
      onSuccess();
    } catch {
      setApiError(isEdit ? 'Failed to update milestone. Please try again.' : 'Failed to submit milestone. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Milestone Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        error={errors.title}
        required
        placeholder="e.g., Week 1 Progress Report"
      />
      <Textarea
        label="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        error={errors.description}
        required
        rows={5}
        helperText="Minimum 50 characters required"
        showCharCount
        maxLength={2000}
        placeholder="Describe your progress, achievements, and challenges..."
      />
      <FileUpload
        label="Attachment (Optional)"
        onChange={(file) => setFormData({ ...formData, attachment: file })}
        currentFile={formData.attachment}
        helperText="PDF or DOCX, max 10 MB"
      />
      {apiError && (
        <p className="text-body-sm text-eth-red bg-status-rejected-bg px-4 py-3 rounded-lg">{apiError}</p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {isEdit ? 'Resubmit Milestone' : 'Submit Milestone'}
        </Button>
      </div>
    </form>
  );
};