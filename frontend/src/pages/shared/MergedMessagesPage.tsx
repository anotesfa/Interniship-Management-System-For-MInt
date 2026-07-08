import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner, EmptyState } from '../../components/common';
import { MessageThread } from '../../types';
import { messageService, MessageContact } from '../../services/message.service';
import { useAuth } from '../../hooks/useAuth';
import { studentGroupService } from '../../services';
import { StudentGroupMemberSummary, StudentGroupSummary } from '../../types/student-group.types';

interface MergedMessagesPageProps {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
}

export default function MergedMessagesPage({
  title,
  subtitle,
  emptyTitle,
  emptyDescription,
}: MergedMessagesPageProps): JSX.Element {
  const { user } = useAuth();
  const location = useLocation();
  const preselectedUserId = (location.state as { studentUserId?: string; userId?: string } | null)?.studentUserId
    || (location.state as { studentUserId?: string; userId?: string } | null)?.userId;
  const currentRole = (user?.role || '').toLowerCase();

  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [contacts, setContacts] = useState<MessageContact[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [threadMembers, setThreadMembers] = useState<StudentGroupMemberSummary[] | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (selectedThread?.other_user_id) {
        refreshCurrentThread();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedThread?.other_user_id, preselectedUserId, currentRole]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThread?.messages]);

  const formatRoleLabel = (role?: string) => {
    const normalized = (role || '').toLowerCase();
    if (normalized === 'university coordinator' || normalized === 'university') return 'University Coordinator';
    if (normalized === 'admin') return 'Admin';
    if (normalized === 'supervisor') return 'Supervisor';
    if (normalized === 'student') return 'Student';
    return role || 'Contact';
  };

  const getRoleBadgeClasses = (role?: string) => {
    const normalized = (role || '').toLowerCase();
    if (normalized === 'admin') return 'bg-status-eval-bg text-status-eval-text';
    if (normalized === 'university coordinator' || normalized === 'university') return 'bg-status-approved-bg text-status-approved-text';
    if (normalized === 'supervisor') return 'bg-status-pending-bg text-status-pending-text';
    if (normalized === 'student') return 'bg-mint-pale text-mint-navy';
    return 'bg-surface-page text-text-muted';
  };

  const getVisibleRoles = () => {
    if (currentRole === 'supervisor') return ['student', 'admin'];
    if (currentRole === 'admin') return ['supervisor', 'university coordinator'];
    if (currentRole === 'university coordinator' || currentRole === 'university') return ['admin'];
    if (currentRole === 'student') return ['supervisor'];
    return [];
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [threadsData, baseContacts] = await Promise.all([
        messageService.getMyThreads(),
        messageService.getAvailableContacts('merged'),
      ]);

      const visibleRoles = getVisibleRoles();
      const filteredThreads = threadsData.filter((thread) => {
        const role = (thread.other_user_role || '').toLowerCase();
        return visibleRoles.length === 0 || visibleRoles.includes(role);
      });

      const seen = new Set<string>();
      const dedupedContacts = baseContacts.filter((contact) => {
        if (contact.user_id === String(user?.user_id || '')) return false;
        if (seen.has(contact.user_id)) return false;
        seen.add(contact.user_id);
        return true;
      });

      setThreads(filteredThreads);
      setContacts(dedupedContacts);

      if (preselectedUserId) {
        const existing = filteredThreads.find((thread) => thread.other_user_id === preselectedUserId);
        if (existing) {
          setSelectedThread(existing);
        } else {
          await openThread(preselectedUserId, false);
        }
      } else if (filteredThreads.length > 0 && !selectedThread) {
        setSelectedThread(filteredThreads[0]);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCurrentThread = async () => {
    if (!selectedThread?.other_user_id) return;

    try {
      const updated = await messageService.getThreadWith(selectedThread.other_user_id);
      await loadThreadMembers(updated);
      setSelectedThread(updated);
    } catch (err) {
      console.error('Failed to refresh thread:', err);
    }
  };

  const openThread = async (otherUserId: string, updateList = true) => {
    try {
      const thread = await messageService.getThreadWith(otherUserId);
      await loadThreadMembers(thread);
      setSelectedThread(thread);

      const unreadMessages = thread.messages.filter(
        (msg) => !msg.is_read && msg.sender_role !== currentRole,
      );

      for (const msg of unreadMessages) {
        try {
          await messageService.markAsRead(msg.message_id);
        } catch (err) {
          console.error('Failed to mark message as read:', err);
        }
      }

      if (updateList) {
        const updated = await messageService.getMyThreads();
        const visibleRoles = getVisibleRoles();
        setThreads(updated.filter((item) => {
          const role = (item.other_user_role || '').toLowerCase();
          return visibleRoles.length === 0 || visibleRoles.includes(role);
        }));
      }
    } catch (err) {
      console.error('Failed to open thread:', err);
      setError('Failed to open conversation');
    }
  };

  const loadThreadMembers = async (thread: MessageThread) => {
    // reset
    setThreadMembers(null);
    try {
      if (!thread?.assignment_id) return;
      if (thread.assignment_id.startsWith('group-')) {
        const groupId = Number(thread.assignment_id.replace('group-', ''));
        const role = (user?.role || '').toLowerCase();

        if (role === 'supervisor') {
          const groups = await studentGroupService.getMySupervisorGroups();
          const matched = groups.find((g: StudentGroupSummary) => Number(g.group_id) === groupId);
          if (matched) setThreadMembers(matched.members as StudentGroupMemberSummary[]);
        } else {
          const myGroup = await studentGroupService.getMyGroup();
          if (myGroup?.group && Number(myGroup.group.group_id) === groupId) setThreadMembers(myGroup.group.members as StudentGroupMemberSummary[]);
        }
      }
    } catch (err) {
      console.error('Failed to load group members for thread', err);
    }
  };

  const handleSend = async () => {
    if (!selectedThread?.other_user_id || !newMessage.trim() || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setError('');
    setIsSending(true);

    try {
      await messageService.sendMessage({
        receiverId: selectedThread.other_user_id,
        messageText,
      });
      await openThread(selectedThread.other_user_id);
      textareaRef.current?.focus();
    } catch (err) {
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

    if (diffInHours < 24) return format(date, 'h:mm a');
    if (diffInHours < 48) return 'Yesterday';
    return format(date, 'MMM d');
  };

  const contactsWithoutThread = contacts.filter((contact) => !threads.some((thread) => thread.other_user_id === contact.user_id));

  return (
    <DashboardLayout title={title}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-140px)]">
        <div className="lg:col-span-1 flex flex-col bg-surface-white rounded-lg shadow-level-1 border border-border-default overflow-hidden">
          <div className="px-5 py-4 bg-mint-navy border-b border-mint-blue">
            <h2 className="text-white font-semibold text-body-lg">Messages</h2>
            <p className="text-white/60 text-caption mt-0.5">{subtitle}</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 flex justify-center">
                <LoadingSpinner size="sm" />
              </div>
            ) : threads.length === 0 && contactsWithoutThread.length === 0 ? (
              <div className="p-6">
                <EmptyState title={emptyTitle} description={emptyDescription} />
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {threads.map((thread) => (
                  <button
                    key={thread.other_user_id}
                    onClick={() => thread.other_user_id && openThread(thread.other_user_id)}
                    className={`w-full text-left px-5 py-4 transition-all hover:bg-surface-page ${
                      selectedThread?.other_user_id === thread.other_user_id
                        ? 'bg-mint-pale border-l-4 border-mint-steel'
                        : 'border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-mint-steel flex items-center justify-center text-white font-semibold shadow-level-1">
                          {(thread.other_user_name || 'U').charAt(0).toUpperCase()}
                        </div>
                                {thread.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-eth-red rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-surface-white">
                            {thread.unread_count}
                          </div>
                        )}
                      </div>
                          <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-body-sm font-semibold text-text-primary truncate">
                            {thread.team_name ?? thread.other_user_name}
                          </span>
                          {thread.last_message_at && (
                            <span className="text-caption text-text-hint ml-2 flex-shrink-0">
                              {formatMessageTime(thread.last_message_at)}
                            </span>
                          )}
                        </div>
                        <div className="mb-1">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${getRoleBadgeClasses(thread.other_user_role)}`}>
                            {formatRoleLabel(thread.other_user_role)}
                          </span>
                        </div>
                        <p className="text-caption text-text-muted truncate">
                          {thread.messages[thread.messages.length - 1]?.body || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}

                {contactsWithoutThread.map((contact) => (
                  <button
                    key={`contact-${contact.user_id}`}
                    onClick={() => openThread(contact.user_id, false)}
                    className="w-full text-left px-5 py-4 transition-all hover:bg-surface-page border-l-4 border-transparent"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-border-default flex items-center justify-center text-text-muted font-semibold">
                        {contact.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-body-sm font-semibold text-text-primary truncate">{contact.full_name}</p>
                        <div className="mt-1">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${getRoleBadgeClasses(contact.role)}`}>
                            {formatRoleLabel(contact.role)}
                          </span>
                        </div>
                        <p className="text-caption text-text-muted">Start conversation</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col bg-surface-white rounded-lg shadow-level-1 border border-border-default overflow-hidden">
          {selectedThread ? (
            <>
              <div className="px-6 py-4 bg-mint-navy flex items-center gap-4 shadow-level-1">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-body-lg border border-white/20">
                    {(selectedThread.other_user_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-eth-green rounded-full border-2 border-mint-navy"></div>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-body-lg">{selectedThread.team_name ?? selectedThread.other_user_name}</h3>
                  <p className="text-white/60 text-caption">{formatRoleLabel(selectedThread.other_user_role)} • Online</p>
                </div>
              </div>

              {threadMembers && threadMembers.length > 0 && (
                <div className="px-6 py-3 bg-surface-page border-b border-border-default">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-caption font-semibold text-text-muted uppercase tracking-wide">Chat members</span>
                    {threadMembers.map((member) => (
                      <span
                        key={member.student_id}
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${member.student_user_id === String(user?.user_id || '') ? 'bg-mint-navy text-white' : 'bg-surface-white text-text-primary border border-border-default'}`}
                      >
                        {member.student_name}
                        {member.is_leader && <span className="ml-1 text-[10px] uppercase tracking-wide opacity-80">Leader</span>}
                      </span>
                    ))}
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-status-pending-bg text-status-pending-text">
                      {selectedThread.team_name ?? selectedThread.other_user_name}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-surface-page">
                {selectedThread.messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <EmptyState
                      title="No messages yet"
                      description="Start the conversation by sending a message below."
                    />
                  </div>
                ) : (
                  <>
                    {selectedThread.messages.map((msg, index) => {
                      const isOwn = msg.sender_id === String(user?.user_id || '');
                      const showAvatar = index === 0 || selectedThread.messages[index - 1].sender_id !== msg.sender_id;

                      return (
                        <div key={msg.message_id} className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className="w-8 h-8 flex-shrink-0">
                            {!isOwn && showAvatar && (
                              <div className="w-8 h-8 rounded-full bg-mint-steel flex items-center justify-center text-white text-xs font-semibold shadow-level-1">
                                {(msg.sender_name || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                            {!isOwn && (
                              <div className="mb-1 flex items-center gap-2 px-1">
                                <span className="text-xs font-semibold text-text-primary">{msg.sender_name}</span>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${getRoleBadgeClasses(msg.sender_role)}`}>
                                  {formatRoleLabel(msg.sender_role)}
                                </span>
                              </div>
                            )}

                            <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${isOwn ? 'bg-mint-navy text-white rounded-br-md' : 'bg-surface-white text-text-primary border border-border-default rounded-bl-md'}`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
                            </div>

                            {isOwn && (
                              <div className="mb-1 flex items-center gap-2 px-1 justify-end">
                                <span className="text-xs font-semibold text-text-primary">You</span>
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-mint-pale text-mint-navy">
                                  {formatRoleLabel(currentRole)}
                                </span>
                              </div>
                            )}

                            <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                              <span className="text-caption text-text-hint">{formatMessageTime(msg.sent_at)}</span>
                              {isOwn && (
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
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-border-subtle bg-white">
                {error && <p className="text-caption text-status-rejected-text mb-2">{error}</p>}
                <div className="flex gap-3 items-end">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 resize-none rounded-lg border border-border-default px-4 py-3 text-body-sm text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-mint-blue/30 focus:border-mint-steel bg-surface-input"
                    rows={2}
                    disabled={isSending}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || isSending}
                    className="h-[44px] px-5 rounded-lg bg-mint-navy text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-mint-blue transition-colors shadow-level-1"
                  >
                    {isSending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <EmptyState
                title="Select a conversation"
                description="Choose an existing thread or start a new one from the left panel."
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
