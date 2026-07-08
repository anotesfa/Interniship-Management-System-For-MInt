import MergedMessagesPage from '../shared/MergedMessagesPage';

export default function SupervisorMessagesPage() {
  return (
    <MergedMessagesPage
      title="Messages"
      subtitle="Students and admin conversations"
      emptyTitle="No conversations yet"
      emptyDescription="You have no available message threads yet."
    />
  );
}
