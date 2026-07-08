// University - Bulk Applications Page
// Full-page form (no modal wizard). Table-style student entry.
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner, Card, Button, StatusBadge, EmptyState } from '../../components/common';
import {
  universityService,
  BulkApplicationListItem,
  BulkStudentRecord,
  TemplateItem,
} from '../../services/university.service';
import { formatDate } from '../../utils/format';

type View = 'list' | 'new';

const EMPTY_STUDENT = (): BulkStudentRecord => ({
  full_name: '',
  email: '',
  registration_number: '',
  department: '',
  gpa: null,
});

export default function BulkApplicationsNewPage() {
  const [view, setView] = useState<View>('list');
  const [applications, setApplications] = useState<BulkApplicationListItem[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [requestLetter, setRequestLetter] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'csv' | 'manual'>('manual');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [students, setStudents] = useState<BulkStudentRecord[]>([EMPTY_STUDENT()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [appsData, templatesData] = await Promise.all([
        universityService.getMyUniversityBulkApplications(),
        universityService.getTemplates(),
      ]);
      setApplications(appsData);
      setTemplates(templatesData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Student table helpers ──────────────────────────────────────────────────
  const updateStudent = (index: number, field: keyof BulkStudentRecord, value: string) => {
    setStudents((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: field === 'gpa' && value === '' ? null : value };
      return next;
    });
  };

  const addRow = () => setStudents((prev) => [...prev, EMPTY_STUDENT()]);

  const removeRow = (index: number) => {
    if (students.length > 1) setStudents((prev) => prev.filter((_, i) => i !== index));
  };

  // ── CSV parse ─────────────────────────────────────────────────────────────
  const handleCSVUpload = (file: File) => {
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length < 2) { setError('CSV must have a header row and at least one student'); return; }
      const parsed: BulkStudentRecord[] = [];
      for (let i = 1; i < lines.length; i++) {
        const v = lines[i].split(',').map((x) => x.trim().replace(/^"|"$/g, ''));
        if (v.length >= 4) parsed.push({ full_name: v[0], email: v[1], registration_number: v[2], department: v[3], gpa: v[4] || null });
      }
      setStudents(parsed.length ? parsed : [EMPTY_STUDENT()]);
      setError('');
    };
    reader.readAsText(file);
  };

  const downloadCSVTemplate = () => {
    const csv = 'Full Name,Email,Registration Number,Department,GPA\nJohn Doe,john@example.com,REG001,Computer Science,3.8';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'student_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError('');
    if (!requestLetter) { setError('Please upload your request letter'); return; }
    const list = uploadMethod === 'csv' ? students : students;
    if (list.length === 0) { setError('Add at least one student'); return; }
    const hasEmpty = list.some((s) => !s.full_name || !s.email || !s.registration_number || !s.department);
    if (hasEmpty) { setError('Name, email, registration number, and department are required for every student'); return; }

    setIsSubmitting(true);
    try {
      await universityService.submitBulkApplication(requestLetter, list);
      setSuccess('Application submitted successfully');
      setView('list');
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRequestLetter(null);
    setCsvFile(null);
    setStudents([EMPTY_STUDENT()]);
    setUploadMethod('manual');
    setError('');
  };

  const inputCls = 'w-full bg-white border border-border-default rounded px-2.5 py-1.5 text-caption focus:outline-none focus:ring-1 focus:ring-mint-blue placeholder:text-text-muted/60';

  // ════════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (view === 'list') {
    return (
      <DashboardLayout title="Bulk Applications" breadcrumb={['University', 'Applications']}>
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-h2 text-text-primary">Bulk Applications</h2>
              <p className="text-body-sm text-text-muted mt-0.5">Submit internship requests for multiple students at once</p>
            </div>
            <Button variant="primary" onClick={() => { resetForm(); setView('new'); }}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Application
            </Button>
          </div>

          {/* Success banner */}
          {success && (
            <div className="flex items-center gap-3 bg-status-approved-bg border border-[#A7F3D0] text-status-approved-text px-4 py-3 rounded-lg">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-body-sm font-medium flex-1">{success}</p>
              <button onClick={() => setSuccess('')}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* List */}
          {isLoading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" text="Loading..." /></div>
          ) : applications.length === 0 ? (
            <EmptyState
              title="No applications yet"
              description="Submit your first bulk application to request internship placements for your students."
              action={<Button variant="primary" onClick={() => { resetForm(); setView('new'); }}>New Application</Button>}
            />
          ) : (
            <div className="grid gap-3">
              {applications.map((app) => (
                <Card key={app.bulk_application_id} className="hover:shadow-sm transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-body font-semibold text-text-primary truncate">{app.file_name}</h3>
                        <StatusBadge status={app.status} />
                      </div>
                      <p className="text-caption text-text-muted mt-0.5">{formatDate(app.submission_date)}</p>
                    </div>
                    <div className="flex items-center gap-4 text-caption flex-shrink-0">
                      <div className="text-center">
                        <p className="font-bold text-text-primary text-base">{app.total_records}</p>
                        <p className="text-text-muted">Total</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-status-approved-text text-base">{app.processed_records}</p>
                        <p className="text-text-muted">Done</p>
                      </div>
                      {app.failed_records > 0 && (
                        <div className="text-center">
                          <p className="font-bold text-eth-red text-base">{app.failed_records}</p>
                          <p className="text-text-muted">Failed</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {app.total_records > 0 && (
                    <div className="mt-3 h-1.5 bg-border-subtle rounded-full overflow-hidden">
                      <div
                        className="h-full bg-status-approved-text rounded-full transition-all"
                        style={{ width: `${Math.round((app.processed_records / app.total_records) * 100)}%` }}
                      />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // NEW APPLICATION VIEW (full page)
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <DashboardLayout title="New Application" breadcrumb={['University', 'Applications', 'New']}>
      <div className="max-w-5xl space-y-6">
        {/* Back */}
        <button
          onClick={() => { setView('list'); setError(''); }}
          className="flex items-center gap-1.5 text-body-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to applications
        </button>

        <div>
          <h2 className="text-h2 text-text-primary">New Bulk Application</h2>
          <p className="text-body-sm text-text-muted mt-0.5">Upload your request letter and list the students you are applying for</p>
        </div>

        {/* ── Section 1: Template (optional) ── */}
        {templates.length > 0 && (
          <Card>
            <div className="space-y-3">
              <div>
                <h3 className="text-body font-semibold text-text-primary">Request Letter Template</h3>
                <p className="text-caption text-text-muted mt-0.5">Download a template, fill it in, then upload it below</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {templates.map((t) => (
                  <button
                    key={t.template_id}
                    onClick={() => universityService.downloadTemplate(t.template_id, t.file_name)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border-default bg-surface-page hover:border-mint-blue hover:bg-mint-pale/30 transition-all text-body-sm font-medium text-text-primary"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {t.template_name}
                    <svg className="w-3.5 h-3.5 text-mint-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* ── Section 2: Request Letter upload ── */}
        <Card>
          <div className="space-y-3">
            <div>
              <h3 className="text-body font-semibold text-text-primary">
                Request Letter <span className="text-eth-red">*</span>
              </h3>
              <p className="text-caption text-text-muted mt-0.5">Upload your signed university request letter (PDF, DOC, DOCX — max 5MB)</p>
            </div>

            <label
              htmlFor="request-letter"
              className={`flex items-center gap-4 p-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                requestLetter ? 'border-mint-blue bg-mint-pale/30' : 'border-border-default hover:border-mint-blue/60'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-mint-pale flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-mint-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                {requestLetter ? (
                  <>
                    <p className="text-body-sm font-semibold text-mint-navy truncate">{requestLetter.name}</p>
                    <p className="text-caption text-text-muted">{(requestLetter.size / 1024).toFixed(0)} KB — click to change</p>
                  </>
                ) : (
                  <>
                    <p className="text-body-sm font-medium text-text-primary">Click to upload request letter</p>
                    <p className="text-caption text-text-muted">PDF, DOC, DOCX</p>
                  </>
                )}
              </div>
              <input
                id="request-letter"
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => setRequestLetter(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        </Card>

        {/* ── Section 3: Student list ── */}
        <Card>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-body font-semibold text-text-primary">
                  Student List <span className="text-eth-red">*</span>
                </h3>
                <p className="text-caption text-text-muted mt-0.5">Add students manually or upload a CSV file</p>
              </div>

              {/* Toggle */}
              <div className="flex gap-1 p-1 bg-surface-page rounded-lg self-start sm:self-auto">
                <button
                  onClick={() => setUploadMethod('manual')}
                  className={`px-3 py-1.5 rounded-md text-caption font-semibold transition-all ${uploadMethod === 'manual' ? 'bg-white text-mint-navy shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                >
                  Manual
                </button>
                <button
                  onClick={() => setUploadMethod('csv')}
                  className={`px-3 py-1.5 rounded-md text-caption font-semibold transition-all ${uploadMethod === 'csv' ? 'bg-white text-mint-navy shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                >
                  CSV Upload
                </button>
              </div>
            </div>

            {/* CSV upload */}
            {uploadMethod === 'csv' && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={downloadCSVTemplate}
                    className="inline-flex items-center gap-1.5 text-caption font-semibold text-mint-navy hover:text-mint-blue transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download CSV template
                  </button>
                </div>
                <label
                  htmlFor="csv-upload"
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                    csvFile ? 'border-mint-blue bg-mint-pale/30' : 'border-border-default hover:border-mint-blue/60'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-surface-page flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    {csvFile ? (
                      <>
                        <p className="text-body-sm font-semibold text-mint-navy truncate">{csvFile.name}</p>
                        <p className="text-caption text-text-muted">{students.length} students loaded — click to change</p>
                      </>
                    ) : (
                      <>
                        <p className="text-body-sm font-medium text-text-primary">Click to upload CSV</p>
                        <p className="text-caption text-text-muted">Columns: Full Name, Email, Registration Number, Department, GPA</p>
                      </>
                    )}
                  </div>
                  <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleCSVUpload(e.target.files[0])} />
                </label>
              </div>
            )}

            {/* Table */}
            <div className="border border-border-subtle rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-caption">
                  <thead>
                    <tr className="bg-surface-page border-b border-border-subtle">
                      <th className="text-left px-3 py-2.5 font-semibold text-text-muted w-8">#</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-text-muted min-w-[140px]">Full Name <span className="text-eth-red">*</span></th>
                      <th className="text-left px-3 py-2.5 font-semibold text-text-muted min-w-[160px]">Email <span className="text-eth-red">*</span></th>
                      <th className="text-left px-3 py-2.5 font-semibold text-text-muted min-w-[120px]">Reg. No. <span className="text-eth-red">*</span></th>
                      <th className="text-left px-3 py-2.5 font-semibold text-text-muted min-w-[120px]">Department <span className="text-eth-red">*</span></th>
                      <th className="text-left px-3 py-2.5 font-semibold text-text-muted w-20">GPA</th>
                      <th className="w-8 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={i} className={`border-b border-border-subtle last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-surface-page/40'}`}>
                        <td className="px-3 py-2 text-text-muted font-medium">{i + 1}</td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            placeholder="Full name"
                            value={s.full_name}
                            onChange={(e) => updateStudent(i, 'full_name', e.target.value)}
                            className={inputCls}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="email"
                            placeholder="email@example.com"
                            value={s.email}
                            onChange={(e) => updateStudent(i, 'email', e.target.value)}
                            className={inputCls}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            placeholder="REG/001/2024"
                            value={s.registration_number}
                            onChange={(e) => updateStudent(i, 'registration_number', e.target.value)}
                            className={inputCls}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            placeholder="e.g. Computer Science"
                            value={s.department}
                            onChange={(e) => updateStudent(i, 'department', e.target.value)}
                            className={inputCls}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            placeholder="3.8"
                            value={s.gpa ?? ''}
                            onChange={(e) => updateStudent(i, 'gpa', e.target.value)}
                            className={inputCls}
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {students.length > 1 && (
                            <button
                              onClick={() => removeRow(i)}
                              className="text-text-muted hover:text-eth-red transition-colors p-1 rounded"
                              title="Remove row"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add row */}
              <div className="border-t border-border-subtle bg-surface-page px-3 py-2">
                <button
                  onClick={addRow}
                  className="flex items-center gap-1.5 text-caption font-semibold text-mint-navy hover:text-mint-blue transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add row
                </button>
              </div>
            </div>

            <p className="text-caption text-text-muted">{students.filter((s) => s.full_name).length} student{students.filter((s) => s.full_name).length !== 1 ? 's' : ''} entered</p>
          </div>
        </Card>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 bg-status-rejected-bg border border-[#FECACA] text-status-rejected-text px-4 py-3 rounded-lg">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-body-sm">{error}</p>
          </div>
        )}

        {/* ── Submit ── */}
        <div className="flex items-center justify-between gap-4 pb-8">
          <button
            onClick={() => { setView('list'); setError(''); }}
            className="text-body-sm text-text-muted hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting}>
            Submit Application
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
