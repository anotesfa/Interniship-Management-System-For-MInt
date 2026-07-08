// University - Applications page
// Redirects to the bulk applications page which is the single entry point
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function UniversityApplicationsPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/university/bulk-applications', { replace: true });
  }, [navigate]);
  return null;
}
