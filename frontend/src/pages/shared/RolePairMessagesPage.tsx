import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner, EmptyState } from '../../components/common';
import { MessageThread } from '../../types';
import { messageService, MessageContact } from '../../services/message.service';
import { useAuth } from '../../hooks/useAuth';

interface RolePairMessagesPageProps {
  title: string;
  subtitle: string;
  pair: 'admin-university' | 'admin-supervisor';
  emptyTitle: string;
  emptyDescription: string;
}

export default function RolePairMessagesPage({
  title,
  subtitle,
  pair,
  emptyTitle,
  emptyDescription,
}: RolePairMessagesPageProps): JSX.Element {
  const { user } = useAuth();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [contacts, setContacts] = useState<MessageContact[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
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
  }, [selectedThread?.other_user_id, pair]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThread?.messages]);

  const refreshCurrentThread = async () => {
    if (!selectedThread?.other_user_id) return;

    try {
      const updated = await messageService.getThreadWith(selectedThread.other_user_id);
      setSelectedThread(updated);
    } catch (err) {
      console.error('Failed to refresh thread:', err);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [threadsData, contactsData] = await Promise.all([
        messageService.getMyThreads(),
        messageService.getAvailableContacts(pair),
      ]);

      const allowedRoles = pair === 'admin-university'
        ? ['admin', 'university coordinator']
        : ['admin', 'supervisor'];

      const roleFilteredThreads = threadsData.filter((thread) => {
        const role = (thread.other_user_role || '').toLowerCase();
        return allowedRoles.includes(role);
      });

      setThreads(roleFilteredThreads);
      setContacts(contactsData);

      if (roleFilteredThreads.length > 0 && !selectedThread) {
        setSelectedThread(roleFilteredThreads[0]);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const openThread = async (otherUserId: string, updateList = true) => {
    try {
      const thread = await messageService.getThreadWith(otherUserId);
      setSelectedThread(thread);

      const unreadMessages = thread.messages.filter(
        (msg) => !msg.is_read && msg.sender_id !== String(user?.user_id || ''),
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
        const allowedRoles = pair === 'admin-university'
          ? ['admin', 'university coordinator']
          : ['admin', 'supervisor'];
        setThreads(updated.filter((item) => allowedRoles.includes((item.other_user_role || '').toLowerCase())));
      }
    } catch (err) {
      console.error('Failed to open thread:', err);
      setError('Failed to open conversation');
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

  const formatRoleLabel = (role?: string) => {
    const normalized = (role || '').toLowerCase();
    if (normalized === 'university coordinator' || normalized === 'university') return 'University Coordinator';
    if (normalized === 'admin') return 'Admin';
    if (normalized === 'supervisor') return 'Supervisor';
    return role || 'Contact';
  };

  const getRoleBadgeClasses = (role?: string) => {
    const normalized = (role || '').toLowerCase();
    if (normalized === 'admin') return 'bg-status-eval-bg text-status-eval-text';
    if (normalized === 'university coordinator' || normalized === 'university') return 'bg-status-approved-bg text-status-approved-text';
    if (normalized === 'supervisor') return 'bg-status-pending-bg text-status-pending-text';
    return 'bg-surface-page text-text-muted';
  };

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
                <EmptyState
                  title={emptyTitle}
                  description={emptyDescription}
                />
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
                            {thread.other_user_name}
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
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-body-lg border border-white/20">
                  {(selectedThread.other_user_name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-body-lg">{selectedThread.other_user_name}</h3>
                  <div className="mt-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${getRoleBadgeClasses(selectedThread.other_user_role)} bg-white/90`}>
                      {formatRoleLabel(selectedThread.other_user_role)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-surface-page to-white">
                {selectedThread.messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <EmptyState
                      title="No messages yet"
                      description="Start the conversation by sending a message below."
                    />
                  </div>
                ) : (
                  selectedThread.messages.map((msg) => {
                    const isOwn = msg.sender_id === String(user?.user_id || '');
                    return (
                      <div
                        key={msg.message_id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-level-1 ${
                            isOwn
                              ? 'bg-mint-navy text-white rounded-br-sm'
                              : 'bg-surface-page text-text-primary rounded-bl-sm border border-border-subtle'
                          }`}
                        >
                          <p className="text-body-sm whitespace-pre-wrap break-words">{msg.body}</p>
                          <p className={`text-caption mt-1.5 ${isOwn ? 'text-white/60' : 'text-text-hint'}`}>
                            {formatMessageTime(msg.sent_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
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
                    className="flex-1 resize-none rounded-lg border border-border-default px-4 py-2.5 text-body text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-mint-blue"
                    rows={2}
                    disabled={isSending}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || isSending}
                    className="h-[42px] px-5 rounded-lg bg-mint-navy text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-mint-blue transition-colors"
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
