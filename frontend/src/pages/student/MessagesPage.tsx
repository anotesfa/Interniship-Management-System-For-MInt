// Student - Messages Page (Modern Chat UI with Sidebar)
import { useEffect, useRef, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner, EmptyState, Card } from '../../components/common';
import { MessageThread } from '../../types';
import { messageService } from '../../services/message.service';
import { assignmentService } from '../../services/assignment.service';
import { evaluationService } from '../../services';
import { studentGroupService } from '../../services/student-group.service';
import { useAuthStore } from '../../store/auth.store';
import { format } from 'date-fns';
import { StudentGroupMemberSummary } from '../../types/student-group.types';

export default function StudentMessagesPage() {
  const { user } = useAuthStore();
  const [thread, setThread] = useState<MessageThread | null>(null);
  const [supervisorUserId, setSupervisorUserId] = useState<string | null>(null);
  const [supervisorName, setSupervisorName] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [noAssignment, setNoAssignment] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isEvaluationPublished, setIsEvaluationPublished] = useState(false);
  const [groupMembers, setGroupMembers] = useState<StudentGroupMemberSummary[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadConversation();
    const interval = setInterval(() => {
      if (supervisorUserId) {
        refreshConversation();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [supervisorUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages]);

  const refreshConversation = async () => {
    if (!supervisorUserId) return;
    try {
      const threadData = await messageService.getThreadWith(supervisorUserId);
      setThread(threadData);
      setUnreadCount(threadData.unread_count);
    } catch (err) {
      console.error('Failed to refresh:', err);
    }
  };

  const loadConversation = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [assignment, isPublished] = await Promise.all([
        assignmentService.getMyAssignment(),
        evaluationService.checkPublishedStatus(),
      ]);
      
      setIsEvaluationPublished(isPublished);
      
      if (!assignment) {
        setNoAssignment(true);
        setIsLoading(false);
        return;
      }

      const supUserId = assignment.supervisor_id;
      const supName = assignment.supervisor_name || 'Your Supervisor';
      
      setSupervisorUserId(supUserId);
      setSupervisorName(supName);

      try {
        const myGroup = await studentGroupService.getMyGroup();
        setGroupMembers(myGroup?.group?.members || []);
      } catch (groupErr) {
        console.error('Failed to load group members:', groupErr);
        setGroupMembers([]);
      }

      const threadData = await messageService.getThreadWith(supUserId);
      setThread(threadData);
      setUnreadCount(threadData.unread_count);
      
      // Mark messages as read
      await markMessagesAsRead(threadData);
    } catch (err: any) {
      console.error('Failed to load conversation:', err);
      setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const markMessagesAsRead = async (threadData: MessageThread) => {
    const unreadMessages = threadData.messages.filter(m => !m.is_read && m.sender_id !== user?.user_id);
    for (const msg of unreadMessages) {
      try {
        await messageService.markAsRead(msg.message_id);
      } catch (err) {
        console.error('Failed to mark message as read:', err);
      }
    }
    if (unreadMessages.length > 0) {
      setUnreadCount(0);
    }
  };

  const handleSend = async () => {
    if (!supervisorUserId || !newMessage.trim() || isSending) return;
    
    const messageText = newMessage.trim();
    setNewMessage('');
    setError('');
    setIsSending(true);
    
    try {
      await messageService.sendMessage({
        receiverId: supervisorUserId,
        messageText,
      });
      const updated = await messageService.getThreadWith(supervisorUserId);
      setThread(updated);
      textareaRef.current?.focus();
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, 'h:mm a');
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  const formatRoleLabel = (role?: string) => {
    const normalized = (role || '').toLowerCase();
    if (normalized === 'supervisor') return 'Supervisor';
    if (normalized === 'student') return 'Student';
    return role || 'Member';
  };

  const getMessageBadgeClasses = (role?: string) => {
    const normalized = (role || '').toLowerCase();
    if (normalized === 'supervisor') return 'bg-status-pending-bg text-status-pending-text';
    if (normalized === 'student') return 'bg-mint-pale text-mint-navy';
    return 'bg-surface-page text-text-muted';
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Messages">
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <LoadingSpinner size="lg" text="Loading conversation..." />
        </div>
      </DashboardLayout>
    );
  }

  if (noAssignment) {
    return (
      <DashboardLayout title="Messages">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <EmptyState
            title="No supervisor assigned"
            description="You'll be able to message your supervisor once assigned."
          />
        </div>
      </DashboardLayout>
    );
  }

  // Show locked message if evaluation is published
  if (isEvaluationPublished) {
    return (
      <DashboardLayout title="Messages">
        <Card>
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-status-rejected-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-status-rejected-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-h2 text-text-primary mb-2">Messaging Disabled</h2>
            <p className="text-body-sm text-text-muted">Your evaluation has been published. You can no longer send messages. If you have urgent questions, please contact your supervisor directly.</p>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Messages">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-140px)]">

        {/* Left Sidebar - Supervisor Info */}
        <div className="lg:col-span-1 flex flex-col bg-surface-white rounded-lg shadow-level-1 border border-border-default overflow-hidden">
          <div className="px-5 py-4 bg-mint-navy border-b border-mint-blue">
            <h2 className="text-white font-semibold text-body-lg">Messages</h2>
            <p className="text-white/60 text-caption mt-0.5">Your Supervisor</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-border-subtle">
              <button
                className="w-full text-left px-5 py-4 bg-mint-pale border-l-4 border-mint-steel"
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-mint-steel flex items-center justify-center text-white font-semibold shadow-level-1">
                      {supervisorName.charAt(0).toUpperCase()}
                    </div>
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-eth-red rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-surface-white">
                        {unreadCount}
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-eth-green rounded-full border-2 border-surface-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-body-sm font-semibold text-text-primary truncate">
                        {supervisorName}
                      </span>
                      {thread?.last_message_at && (
                        <span className="text-caption text-text-hint ml-2 flex-shrink-0">
                          {formatMessageTime(thread.last_message_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-caption text-text-muted truncate">
                      {thread?.messages[thread.messages.length - 1]?.body || 'No messages yet'}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Active Chat */}
        <div className="lg:col-span-3 flex flex-col bg-surface-white rounded-lg shadow-level-1 border border-border-default overflow-hidden">
          {/* Chat Header */}
          <div className="px-6 py-4 bg-mint-navy flex items-center gap-4 shadow-level-1">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-body-lg border border-white/20">
                {supervisorName.charAt(0).toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-eth-green rounded-full border-2 border-mint-navy"></div>
            </div>
            <div className="flex-1">
              <h2 className="text-white font-semibold text-body-lg">{thread?.team_name ?? supervisorName}</h2>
              <p className="text-white/60 text-caption">Supervisor • Online</p>
            </div>
          </div>

          {groupMembers.length > 0 && (
            <div className="px-6 py-3 bg-surface-page border-b border-border-default">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-caption font-semibold text-text-muted uppercase tracking-wide">Chat members</span>
                {groupMembers.map((member) => (
                  <span
                    key={member.student_id}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${member.student_user_id === String(user?.user_id || '') ? 'bg-mint-navy text-white' : 'bg-surface-white text-text-primary border border-border-default'}`}
                  >
                    {member.student_name}
                    {member.is_leader && <span className="ml-1 text-[10px] uppercase tracking-wide opacity-80">Leader</span>}
                  </span>
                ))}
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-status-pending-bg text-status-pending-text">
                  {supervisorName}
                </span>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-surface-page">
            {!thread || thread.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 rounded-full bg-mint-pale flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-mint-steel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-text-primary font-medium">No messages yet</p>
                <p className="text-text-muted text-caption mt-1">Start a conversation with your supervisor</p>
              </div>
            ) : (
              <>
                {thread.messages.map((msg, index) => {
                  const isMine = msg.sender_id === String(user?.user_id || '');
                  const showAvatar = index === 0 || thread.messages[index - 1].sender_id !== msg.sender_id;
                  const senderInitial = (msg.sender_name || 'U').charAt(0).toUpperCase();
                  
                  return (
                    <div key={msg.message_id} className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className="w-8 h-8 flex-shrink-0">
                        {!isMine && showAvatar && (
                          <div className="w-8 h-8 rounded-full bg-mint-steel flex items-center justify-center text-white text-xs font-semibold shadow-level-1">
                            {senderInitial}
                          </div>
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div className={`flex flex-col max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                        {!isMine && (
                          <div className="mb-1 flex items-center gap-2 px-1">
                            <span className="text-xs font-semibold text-text-primary">{msg.sender_name}</span>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${getMessageBadgeClasses(msg.sender_role)}`}>
                              {formatRoleLabel(msg.sender_role)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                            isMine
                              ? 'bg-mint-navy text-white rounded-br-md'
                              : 'bg-surface-white text-text-primary border border-border-default rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
                        </div>

                        {isMine && (
                          <div className="mb-1 flex items-center gap-2 px-1 justify-end">
                            <span className="text-xs font-semibold text-text-primary">You</span>
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-mint-pale text-mint-navy">
                              Student
                            </span>
                          </div>
                        )}
                        
                        {/* Time and Status */}
                        <div className={`flex items-center gap-1 mt-1 px-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span className="text-caption text-text-hint">
                            {formatMessageTime(msg.sent_at)}
                          </span>
                          {isMine && (
                            <div className="flex items-center">
                              {msg.is_read ? (
                                <svg className="w-4 h-4 text-mint-steel" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                                  <path d="M12.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-1-1a1 1 0 011.414-1.414l.293.293 7.293-7.293a1 1 0 011.414 0z"/>
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-text-hint" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                                </svg>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="px-4 py-4 bg-surface-white border-t border-border-default">
            {error && (
              <div className="mb-3 px-4 py-2 bg-status-rejected-bg border border-status-rejected-dot/30 rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-status-rejected-text flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                <p className="text-body-sm text-status-rejected-text">{error}</p>
              </div>
            )}
            
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  rows={1}
                  className="w-full px-4 py-3 pr-12 border border-border-default rounded-lg bg-surface-input focus:outline-none focus:ring-2 focus:ring-mint-blue/30 focus:border-mint-steel resize-none text-body-sm text-text-primary placeholder-text-hint transition-colors"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>
              
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || isSending}
                className={`flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  newMessage.trim() && !isSending
                    ? 'bg-mint-navy hover:bg-mint-blue text-white shadow-level-2'
                    : 'bg-surface-page text-text-hint cursor-not-allowed border border-border-default'
                }`}
              >
                {isSending ? (
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                  </svg>
                )}
              </button>
            </div>
            
            <p className="text-caption text-text-hint mt-2 text-center">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
