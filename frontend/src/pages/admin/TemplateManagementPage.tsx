// Admin - Template Management Page
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner, Card, Button, Modal, EmptyState } from '../../components/common';
import { universityService, TemplateItem } from '../../services/university.service';

export default function TemplateManagementPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await universityService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!templateName.trim()) {
      setError('Please enter a template name');
      return;
    }
    if (!templateFile) {
      setError('Please select a PDF file');
      return;
    }

    setIsUploading(true);
    setError('');
    try {
      await universityService.uploadTemplate(templateName, templateFile);
      setSuccess('Template uploaded successfully');
      setShowUploadModal(false);
      setTemplateName('');
      setTemplateFile(null);
      loadTemplates();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to upload template');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await universityService.deleteTemplate(templateId);
      setSuccess('Template deleted successfully');
      loadTemplates();
    } catch (error) {
      setError('Failed to delete template');
    }
  };

  const handleDownload = async (template: TemplateItem) => {
    try {
      await universityService.downloadTemplate(template.template_id, template.file_name);
    } catch (error) {
      setError('Failed to download template');
    }
  };

  return (
    <DashboardLayout title="Template Management" breadcrumb={['Admin', 'Templates']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-h2 text-text-primary">Request Letter Templates</h2>
            <p className="text-body-sm text-text-muted mt-1">
              Upload PDF templates that universities can download and customize for their bulk applications
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowUploadModal(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Template
          </Button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="flex items-center gap-2 bg-status-approved-bg border border-[#A7F3D0] text-status-approved-text px-4 py-3 rounded-lg">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-body-sm font-medium">{success}</p>
            <button onClick={() => setSuccess('')} className="ml-auto">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-status-rejected-bg border border-[#FECACA] text-status-rejected-text px-4 py-3 rounded-lg">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-body-sm font-medium">{error}</p>
            <button onClick={() => setError('')} className="ml-auto">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Templates List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" text="Loading templates..." />
          </div>
        ) : templates.length === 0 ? (
          <EmptyState
            title="No Templates Yet"
            description="Upload PDF templates that universities can use as a starting point for their request letters."
            action={
              <Button variant="primary" onClick={() => setShowUploadModal(true)}>
                Upload First Template
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.template_id} className="hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  {/* Template Icon */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-body font-semibold text-text-primary truncate">
                        {template.template_name}
                      </h3>
                      <p className="text-caption text-text-muted truncate">{template.file_name}</p>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="bg-surface-page rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2 text-caption text-text-muted">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{template.uploaded_by_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-caption text-text-muted">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{new Date(template.uploaded_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleDownload(template)}>
                      <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.template_id)}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setTemplateName('');
          setTemplateFile(null);
          setError('');
        }}
        title="Upload Template"
        subtitle="Upload a PDF template that universities can download and customize"
        size="md"
      >
        <div className="space-y-5">
          {/* Template Name */}
          <div className="space-y-2">
            <label className="block text-body-sm font-semibold text-text-primary">
              Template Name <span className="text-eth-red">*</span>
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Standard Request Letter 2026"
              className="w-full bg-surface-input border border-border-default rounded-lg px-4 py-2.5 text-body focus:outline-none focus:ring-2 focus:ring-mint-blue"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="block text-body-sm font-semibold text-text-primary">
              PDF Template <span className="text-eth-red">*</span>
            </label>
            <div className="border-2 border-dashed border-border-default rounded-lg p-6 text-center hover:border-mint-blue transition-colors">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                className="hidden"
                id="template-upload"
              />
              <label htmlFor="template-upload" className="cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-mint-pale flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-mint-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-body-sm font-medium text-text-primary">
                  {templateFile ? templateFile.name : 'Click to upload PDF'}
                </p>
                <p className="text-caption text-text-muted mt-1">
                  PDF, DOC, DOCX — max 10MB
                </p>
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-status-rejected-bg border border-[#FECACA] text-status-rejected-text px-4 py-3 rounded-lg text-body-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2 border-t border-border-subtle">
            <Button
              variant="secondary"
              onClick={() => {
                setShowUploadModal(false);
                setTemplateName('');
                setTemplateFile(null);
                setError('');
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpload} isLoading={isUploading}>
              Upload Template
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
