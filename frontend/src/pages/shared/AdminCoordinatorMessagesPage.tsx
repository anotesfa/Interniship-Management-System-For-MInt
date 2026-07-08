import MergedMessagesPage from './MergedMessagesPage';

export default function AdminCoordinatorMessagesPage() {
  return (
    <MergedMessagesPage
      title="Messages"
      subtitle="Admin, supervisor, and coordinator conversations"
      emptyTitle="No conversations yet"
      emptyDescription="Start a conversation from the contacts list on the left."
    />
  );
}
