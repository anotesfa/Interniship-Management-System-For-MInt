import RolePairMessagesPage from './RolePairMessagesPage';

export default function AdminSupervisorMessagesPage() {
  return (
    <RolePairMessagesPage
      title="Supervisor Messages"
      subtitle="Admin and Supervisor"
      pair="admin-supervisor"
      emptyTitle="No contacts available"
      emptyDescription="No admin or supervisor contacts found for your role."
    />
  );
}
