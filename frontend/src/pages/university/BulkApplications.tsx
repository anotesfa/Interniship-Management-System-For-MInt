// University Dashboard for Bulk Applications
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
  LoadingSpinner,
  Card,
  Button,
  StatusBadge,
  Modal,
  FileUpload,
  EmptyState,
} from '../../components/common';
import {
  universityService,
  BulkApplicationListItem,
  BulkApplicationStatus,
  BulkStudentRecord,
} from '../../services/university.service';
import { formatDate } from '../../utils/format';
import './UniversityDashboard.css';

interface StudentDraft {
  full_name: string;
  email: string;
  registration_number: string;
  department: string;
  gpa: string;
}

const EMPTY_STUDENT: StudentDraft = {
  full_name: '',
  email: '',
  registration_number: '',
  department: '',
  gpa: '',
};

export default function UniversityDashboardPage() {
  const [applications, setApplications] = useState<BulkApplicationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [requestLetter, setRequestLetter] = useState<File | null>(null);
  const [studentRows, setStudentRows] = useState<StudentDraft[]>([EMPTY_STUDENT]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [appDetails, setAppDetails] = useState<BulkApplicationStatus | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const data = await universityService.getMyUniversityBulkApplications();
      setApplications(data);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openSubmitModal = () => {
    setShowSubmitModal(true);
    setSubmitError('');
    setRequestLetter(null);
    setStudentRows([EMPTY_STUDENT]);
  };

  const closeSubmitModal = () => {
    setShowSubmitModal(false);
    setSubmitError('');
    setRequestLetter(null);
    setStudentRows([EMPTY_STUDENT]);
  };

  const updateStudentRow = (index: number, field: keyof StudentDraft, value: string) => {
    setStudentRows((rows) =>
      rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    );
  };

  const addStudentRow = () => {
    setStudentRows((rows) => [...rows, { ...EMPTY_STUDENT }]);
  };

  const removeStudentRow = (index: number) => {
    setStudentRows((rows) => {
      if (rows.length === 1) {
        return [{ ...EMPTY_STUDENT }];
      }
      return rows.filter((_, rowIndex) => rowIndex !== index);
    });
  };

  const handleSubmit = async () => {
    if (!requestLetter) {
      setSubmitError('Please upload the university request letter.');
      return;
    }

    const normalizedStudents: BulkStudentRecord[] = studentRows.map((row) => ({
      full_name: row.full_name.trim(),
      email: row.email.trim(),
      registration_number: row.registration_number.trim(),
      department: row.department.trim(),
      gpa: row.gpa.trim() ? row.gpa.trim() : null,
    }));

    if (normalizedStudents.length === 0) {
      setSubmitError('Add at least one student.');
      return;
    }

    const hasEmptyFields = normalizedStudents.some(
      (student) =>
        !student.full_name ||
        !student.email ||
        !student.registration_number ||
        !student.department,
    );

    if (hasEmptyFields) {
      setSubmitError('Each student row must include name, email, registration number, and department.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await universityService.submitBulkApplication(requestLetter, normalizedStudents);
      closeSubmitModal();
      await loadApplications();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit bulk application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = async (app: BulkApplicationListItem) => {
    setIsLoadingDetails(true);
    try {
      const details = await universityService.getBulkApplicationStatus(app.bulk_application_id);
      setAppDetails(details);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Failed to load details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const renderRequiredLabel = (label: string) => (
    <span className="text-sm font-semibold text-gray-700">
      {label} <span className="text-eth-red">*</span>
    </span>
  );

  const downloadErrorLog = (app: BulkApplicationStatus) => {
    if (!app.errors || app.errors.length === 0) return;

    const errorContent = [
      'Index,Email,Error',
      ...app.errors.map((e) => `${e.index},"${e.email}","${e.error}"`),
    ].join('\n');

    const blob = new Blob([errorContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `errors_${app.bulk_application_id}.csv`;
    a.click();
  };

  const downloadRequestLetter = (app: BulkApplicationStatus) => {
    const requestLetter = app.documents?.find((document) => document.document_type === 'request_letter');
    if (!requestLetter) return;
    universityService.downloadDocument(requestLetter.document_id, requestLetter.file_name);
  };

  return (
    <DashboardLayout title="Bulk Applications" breadcrumb={['University', 'Applications']}>
      <div className="space-y-6">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Bulk Student Applications</h2>
            <p className="text-sm text-gray-600 mt-1">
              {applications.length} submission{applications.length !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-gray-500 mt-2 max-w-2xl">
              Submit one university request letter together with a structured list of students. CSV uploads are no longer used for bulk submissions.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" onClick={openSubmitModal} size="sm">
              New Bulk Request
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" text="Loading applications..." />
          </div>
        ) : applications.length === 0 ? (
          <EmptyState
            title="No Bulk Requests Yet"
            description="Create a request letter and add the student list to submit your first bulk application."
            action={<Button variant="primary" onClick={openSubmitModal}>New Bulk Request</Button>}
          />
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <Card key={app.bulk_application_id} className="ud-app-card">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{app.file_name}</h3>
                          <p className="text-sm text-gray-600">{formatDate(app.submission_date)}</p>
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>

                  <div className="grid grid-cols-4 gap-3 bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Total Records</p>
                      <p className="text-lg font-bold text-gray-900">{app.total_records}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Processed</p>
                      <p className="text-lg font-bold text-green-600">{app.processed_records}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Failed</p>
                      <p className={`text-lg font-bold ${app.failed_records > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {app.failed_records}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Success Rate</p>
                      <p className="text-lg font-bold text-gray-900">
                        {app.total_records > 0 ? ((app.processed_records / app.total_records) * 100).toFixed(0) : 0}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{
                          width: `${app.total_records > 0 ? (app.processed_records / app.total_records) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-200">
                    <Button variant="secondary" size="sm" onClick={() => handleViewDetails(app)}>
                      View Details
                    </Button>
                    {app.failed_records > 0 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => appDetails && downloadErrorLog(appDetails)}
                      >
                        Download Error Log
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showSubmitModal}
        title="Submit Bulk Request"
        subtitle="Upload one request letter and enter the students who should be included in the approval request."
        onClose={closeSubmitModal}
        size="xl"
      >
        <div className="space-y-6">
          <FileUpload
            label="University Request Letter"
            accept=".pdf,.doc,.docx"
            onChange={setRequestLetter}
            currentFile={requestLetter}
            helperText="Upload the signed request letter from your university."
            required
          />

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {submitError}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-body font-semibold text-text-primary">Student List</h3>
                <p className="text-caption text-text-muted">Add one row per student included in this request.</p>
              </div>
              <Button variant="secondary" size="sm" onClick={addStudentRow}>
                Add Student
              </Button>
            </div>

            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {studentRows.map((row, index) => (
                <div key={index} className="rounded-xl border border-border-default bg-surface-page p-4 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Student {index + 1}</p>
                      <p className="text-caption text-text-muted">Enter the student details exactly as they should appear in the system.</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeStudentRow(index)}>
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="space-y-1">
                      {renderRequiredLabel('Full name')}
                      <input
                        type="text"
                        value={row.full_name}
                        onChange={(e) => updateStudentRow(index, 'full_name', e.target.value)}
                        placeholder="Full name"
                        required
                        className="w-full bg-white border border-border-default rounded-lg px-4 py-2.5 text-body focus:outline-none focus:ring-2 focus:ring-mint-blue"
                      />
                    </label>
                    <label className="space-y-1">
                      {renderRequiredLabel('Email')}
                      <input
                        type="email"
                        value={row.email}
                        onChange={(e) => updateStudentRow(index, 'email', e.target.value)}
                        placeholder="Email"
                        required
                        className="w-full bg-white border border-border-default rounded-lg px-4 py-2.5 text-body focus:outline-none focus:ring-2 focus:ring-mint-blue"
                      />
                    </label>
                    <label className="space-y-1">
                      {renderRequiredLabel('Registration number')}
                      <input
                        type="text"
                        value={row.registration_number}
                        onChange={(e) => updateStudentRow(index, 'registration_number', e.target.value)}
                        placeholder="Registration number"
                        required
                        className="w-full bg-white border border-border-default rounded-lg px-4 py-2.5 text-body focus:outline-none focus:ring-2 focus:ring-mint-blue"
                      />
                    </label>
                    <label className="space-y-1">
                      {renderRequiredLabel('Department')}
                      <input
                        type="text"
                        value={row.department}
                        onChange={(e) => updateStudentRow(index, 'department', e.target.value)}
                        placeholder="Department"
                        required
                        className="w-full bg-white border border-border-default rounded-lg px-4 py-2.5 text-body focus:outline-none focus:ring-2 focus:ring-mint-blue"
                      />
                    </label>
                    <label className="space-y-1 md:col-span-2">
                      <span className="text-sm font-semibold text-gray-700">GPA (optional)</span>
                      <input
                        type="text"
                        value={row.gpa}
                        onChange={(e) => updateStudentRow(index, 'gpa', e.target.value)}
                        placeholder="GPA (optional)"
                        className="w-full bg-white border border-border-default rounded-lg px-4 py-2.5 text-body focus:outline-none focus:ring-2 focus:ring-mint-blue"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 space-y-1">
            <p className="font-semibold text-gray-700">Submission Notes</p>
            <p>• Attach one university request letter.</p>
            <p>• Add every student in the request using the form above.</p>
            <p>• CSV uploads are no longer part of the bulk application flow.</p>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-border-subtle">
            <Button variant="secondary" onClick={closeSubmitModal}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting}>
              Submit Request
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDetailsModal && appDetails !== null}
        title="Bulk Application Details"
        onClose={() => {
          setShowDetailsModal(false);
          setAppDetails(null);
        }}
      >
        {isLoadingDetails ? (
          <LoadingSpinner size="md" text="Loading details..." />
        ) : appDetails ? (
          <div className="space-y-6 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-4 gap-3 bg-gray-50 rounded-lg p-3">
              <div>
                <p className="text-xs text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{appDetails.total_records}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Processed</p>
                <p className="text-2xl font-bold text-green-600">{appDetails.processed_records}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Failed</p>
                <p className={`text-2xl font-bold ${appDetails.failed_records > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {appDetails.failed_records}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Date</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(appDetails.submission_date)}</p>
              </div>
            </div>

            {appDetails.errors && appDetails.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-red-600">Failed Records ({appDetails.errors.length})</h4>
                  <Button variant="secondary" size="sm" onClick={() => downloadErrorLog(appDetails)}>
                    Download Log
                  </Button>
                </div>
                <div className="max-h-40 overflow-y-auto border border-red-200 rounded-lg divide-y">
                  {appDetails.errors.map((err, idx) => (
                    <div key={idx} className="p-2 text-sm bg-red-50">
                      <p className="font-mono text-red-600">{err.email}</p>
                      <p className="text-red-700 text-xs mt-1">{err.error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {appDetails.students && appDetails.students.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">Successfully Added Students ({appDetails.students.length})</h4>
                <div className="max-h-40 overflow-y-auto border border-green-200 rounded-lg divide-y">
                  {appDetails.students.map((student, idx) => (
                    <div key={idx} className="p-2 text-sm bg-green-50">
                      <p className="font-medium text-gray-900">{student.full_name}</p>
                      <p className="text-gray-600 text-xs">{student.email} • {student.registration_number}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {appDetails.documents && appDetails.documents.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-semibold text-gray-900">Uploaded Request Letter</h4>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => downloadRequestLetter(appDetails)}
                    disabled={!appDetails.documents.some((document) => document.document_type === 'request_letter')}
                  >
                    Download Letter
                  </Button>
                </div>
                <div className="rounded-lg border border-border-default bg-surface-page p-3 space-y-2">
                  {appDetails.documents.map((document) => (
                    <div key={document.document_id} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 border border-border-subtle">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{document.file_name}</p>
                        <p className="text-caption text-text-muted capitalize">{document.document_type.replace('_', ' ')}</p>
                      </div>
                      <p className="text-caption text-text-muted">{document.uploaded_by_name || 'Unknown uploader'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </DashboardLayout>
  );
}
