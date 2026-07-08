// Admin University Management Page
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner, Card, Button, StatusBadge, Modal, Textarea, EmptyState } from '../../components/common';
import { universityService, University } from '../../services/university.service';
import { formatDate } from '../../utils/format';
import './UniversityManagement.css';

export default function AdminUniversityManagementPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedUni, setSelectedUni] = useState<University | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    loadUniversities();
  }, [filter]);

  const loadUniversities = async () => {
    setIsLoading(true);
    setActionError('');
    try {
      const data = await universityService.getAllUniversities(filter);
      setUniversities(data);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to load universities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (university: University) => {
    if (!window.confirm(`Approve ${university.name}?`)) return;

    setIsProcessing(true);
    setActionError('');
    try {
      await universityService.approveUniversity(university.university_id);
      setUniversities(universities.filter(u => u.university_id !== university.university_id));
      setSelectedUni(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to approve university');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectClick = (university: University) => {
    setSelectedUni(university);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedUni || !rejectReason.trim()) {
      setActionError('Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);
    setActionError('');
    try {
      await universityService.rejectUniversity(selectedUni.university_id, rejectReason);
      setUniversities(universities.filter(u => u.university_id !== selectedUni.university_id));
      setShowRejectModal(false);
      setSelectedUni(null);
      setRejectReason('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to reject university');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout title="University Management" breadcrumb={['Admin', 'Universities']}>
      <div className="space-y-6">
        {/* Error Message */}
        {actionError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center gap-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {actionError}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                filter === f
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" text="Loading universities..." />
          </div>
        ) : universities.length === 0 ? (
          <EmptyState
            title="No Universities"
            description={`No ${filter === 'all' ? '' : filter} universities found.`}
          />
        ) : (
          <div className="space-y-4">
            {universities.map((uni) => (
              <Card key={uni.university_id} className="um-uni-card">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                          {uni.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{uni.name}</h3>
                          <p className="text-sm text-gray-600">{uni.contact_email}</p>
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={uni.approval_status} />
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="text-xs font-medium text-gray-600">Contact Person</p>
                      <p className="text-sm font-medium text-gray-900">{uni.contact_person?.full_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Contact Email</p>
                      <p className="text-sm font-medium text-gray-900">{uni.contact_person?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Address</p>
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{uni.address}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Registered</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(uni.created_at)}</p>
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  {uni.rejected_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-red-600 mb-1">Rejection Reason</p>
                      <p className="text-sm text-red-700">{uni.rejected_reason}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {uni.approval_status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t border-gray-200">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApprove(uni)}
                        disabled={isProcessing}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRejectClick(uni)}
                        disabled={isProcessing}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        title="Reject University"
        onClose={() => setShowRejectModal(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to reject <strong>{selectedUni?.name}</strong>? Please provide a reason.
          </p>
          <Textarea
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explain why this university is being rejected..."
            rows={4}
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={isProcessing || !rejectReason.trim()}
            >
              {isProcessing ? 'Processing...' : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
