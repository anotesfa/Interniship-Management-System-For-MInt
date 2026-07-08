// Admin University Approval Page with Sidebar
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner, Card, Button, StatusBadge, Modal, Textarea, EmptyState } from '../../components/common';
import { universityService, University } from '../../services/university.service';
import { formatDate } from '../../utils/format';
import './UniversityApprovalPage.css';

type ActionType = 'approve' | 'reject' | null;

export default function UniversityApprovalPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUni, setSelectedUni] = useState<University | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultTitle, setResultTitle] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    loadPendingUniversities();
  }, []);

  const loadPendingUniversities = async () => {
    setIsLoading(true);
    setActionError('');
    try {
      const data = await universityService.getPendingUniversities();
      setUniversities(data);
      if (data.length > 0 && !selectedUni) {
        setSelectedUni(data[0]);
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to load universities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedUni) return;

    setIsProcessing(true);
    setActionError('');
    try {
      await universityService.approveUniversity(selectedUni.university_id);
      setResultTitle('University Approved');
      setResultMessage(`${selectedUni.name} has been approved successfully.`);
      setShowResultModal(true);
      
      setUniversities(prev => {
        const remaining = prev.filter(u => u.university_id !== selectedUni.university_id);
        setSelectedUni(remaining.length > 0 ? remaining[0] : null);
        return remaining;
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to approve university');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectClick = () => {
    if (!selectedUni) return;
    setActionType('reject');
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleApproveClick = () => {
    if (!selectedUni) return;
    setActionType('approve');
    setResultTitle('Confirm Approval');
    setResultMessage(`Approve ${selectedUni.name}? This will grant access to bulk applications.`);
    setShowResultModal(true);
  };

  const handleResultConfirm = async () => {
    if (!selectedUni || !actionType) return;

    setShowResultModal(false);
    setActionType(null);

    if (actionType === 'approve') {
      await handleApprove();
    }
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
      setActionType(null);
      setShowRejectModal(false);
      setResultTitle('University Rejected');
      setResultMessage(`${selectedUni.name} has been rejected.`);
      setShowResultModal(true);
      
      setUniversities(prev => {
        const remaining = prev.filter(u => u.university_id !== selectedUni.university_id);
        setSelectedUni(remaining.length > 0 ? remaining[0] : null);
        return remaining;
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to reject university');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout title="University Approvals" breadcrumb={['Admin', 'University Approvals']}>
      <div className="uap-container">
        {/* Sidebar */}
        <div className="uap-sidebar">
          <div className="uap-sidebar-header">
            <h2>Pending Universities</h2>
            <span className="uap-count">{universities.length}</span>
          </div>

          {isLoading ? (
            <div className="uap-sidebar-loading">
              <LoadingSpinner />
            </div>
          ) : universities.length === 0 ? (
            <div className="uap-sidebar-empty">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No pending universities</p>
              <span className="text-sm">All universities have been reviewed</span>
            </div>
          ) : (
            <div className="uap-sidebar-list">
              {universities.map(uni => (
                <button
                  key={uni.university_id}
                  className={`uap-sidebar-item ${selectedUni?.university_id === uni.university_id ? 'active' : ''}`}
                  onClick={() => setSelectedUni(uni)}
                >
                  <div className="uap-sidebar-item-icon">
                    {uni.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="uap-sidebar-item-content">
                    <div className="uap-sidebar-item-name">{uni.name}</div>
                    <div className="uap-sidebar-item-email">{uni.contact_email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="uap-main">
          {actionError && (
            <div className="uap-error">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{actionError}</span>
            </div>
          )}

          {selectedUni ? (
            <div className="uap-detail">
              {/* Header */}
              <div className="uap-detail-header">
                <div className="uap-detail-avatar">
                  {selectedUni.name.charAt(0).toUpperCase()}
                </div>
                <div className="uap-detail-title">
                  <h1>{selectedUni.name}</h1>
                  <p className="uap-detail-date">Registered {formatDate(selectedUni.created_at)}</p>
                </div>
              </div>

              {/* Content */}
              <div className="uap-detail-content">
                {/* University Section */}
                <Card className="uap-section">
                  <h3 className="uap-section-title">University Details</h3>
                  <div className="uap-grid">
                    <div className="uap-grid-item">
                      <label>University Name</label>
                      <p>{selectedUni.name}</p>
                    </div>
                    <div className="uap-grid-item">
                      <label>Contact Email</label>
                      <p>{selectedUni.contact_email}</p>
                    </div>
                    <div className="uap-grid-item full-width">
                      <label>Address</label>
                      <p>{selectedUni.address}</p>
                    </div>
                  </div>
                </Card>

                {/* Contact Person Section */}
                {selectedUni.contact_person && (
                  <Card className="uap-section">
                    <h3 className="uap-section-title">Contact Person</h3>
                    <div className="uap-grid">
                      <div className="uap-grid-item">
                        <label>Name</label>
                        <p>{selectedUni.contact_person.full_name}</p>
                      </div>
                      <div className="uap-grid-item">
                        <label>Email</label>
                        <p>{selectedUni.contact_person.email}</p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Status Section */}
                <Card className="uap-section">
                  <h3 className="uap-section-title">Application Status</h3>
                  <div className="uap-status-display">
                    <StatusBadge status={selectedUni.approval_status} />
                    <p className="uap-status-desc">
                      {selectedUni.approval_status === 'pending' && 'Awaiting admin review and approval'}
                      {selectedUni.approval_status === 'approved' && 'This university has been approved'}
                      {selectedUni.approval_status === 'rejected' && 'This university application was rejected'}
                    </p>
                  </div>
                </Card>
              </div>

              {/* Actions */}
              {selectedUni.approval_status === 'pending' && (
                <div className="uap-actions">
                  <Button
                    variant="primary"
                    onClick={handleApproveClick}
                    disabled={isProcessing}
                    className="uap-btn-approve"
                  >
                    {isProcessing ? 'Processing...' : '✓ Approve University'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleRejectClick}
                    disabled={isProcessing}
                    className="uap-btn-reject"
                  >
                    {isProcessing ? 'Processing...' : '✕ Reject University'}
                  </Button>
                </div>
              )}

              {selectedUni.approval_status === 'rejected' && selectedUni.rejected_reason && (
                <Card className="uap-rejection-reason">
                  <h4>Rejection Reason</h4>
                  <p>{selectedUni.rejected_reason}</p>
                </Card>
              )}
            </div>
          ) : (
            <EmptyState
              title="No University Selected"
              description="Select a university from the list to review and approve or reject"
            />
          )}
        </div>
      </div>

      {/* Rejection Reason Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject University"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Please provide a reason for rejecting <strong>{selectedUni?.name}</strong>
          </p>
          <Textarea
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter the reason for rejection..."
            rows={5}
          />
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowRejectModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={!rejectReason.trim() || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Action Result / Confirmation Modal */}
      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title={actionType === 'approve' ? 'Confirm Approval' : resultTitle}
        subtitle={actionType === 'approve' ? 'Review the university before confirming' : undefined}
      >
        <div className="space-y-4">
          <p className="text-gray-600">{resultMessage}</p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowResultModal(false)}
              disabled={isProcessing}
            >
              {actionType === 'approve' ? 'Cancel' : 'Close'}
            </Button>
            {actionType === 'approve' ? (
              <Button
                variant="primary"
                onClick={handleResultConfirm}
                disabled={isProcessing}
                className="uap-btn-approve"
              >
                {isProcessing ? 'Processing...' : 'Confirm Approval'}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => setShowResultModal(false)}
              >
                OK
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
