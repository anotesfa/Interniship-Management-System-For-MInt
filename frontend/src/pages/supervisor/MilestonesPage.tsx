// Supervisor - Milestones Review Page (FR-MIL-006 to FR-MIL-009)
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { MilestoneReviewCard } from '../../components/supervisor';
import { LoadingSpinner, EmptyState } from '../../components/common';
import { Milestone } from '../../types';
import { milestoneService } from '../../services';

type Filter = 'all' | 'pending_review' | 'accepted' | 'pending_revision';

const FILTER_TABS: { value: Filter; label: string }[] = [
  { value: 'all',              label: 'All'            },
  { value: 'pending_review',   label: 'Pending Review' },
  { value: 'accepted',         label: 'Accepted'       },
  { value: 'pending_revision', label: 'Needs Revision' },
];

export default function SupervisorMilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [filter, setFilter]         = useState<Filter>('pending_review');

  useEffect(() => { loadMilestones(); }, []);

  const loadMilestones = async () => {
    setIsLoading(true);
    try {
      const data = await milestoneService.getMilestonesForMyStudents();
      setMilestones(data);
    } catch (error) { console.error('Failed to load milestones:', error); }
    finally { setIsLoading(false); }
  };

  const filtered = milestones.filter((m) => filter === 'all' || m.status === filter);
  const countFor = (f: Filter) => f === 'all' ? milestones.length : milestones.filter(m => m.status === f).length;

  return (
    <DashboardLayout title="Student Milestones" breadcrumb={['Supervisor', 'Milestones']}>
      <div className="space-y-6">
        <div className="flex gap-1 border-b border-border-default overflow-x-auto">
          {FILTER_TABS.map((tab) => {
            const count = countFor(tab.value);
            const isActive = filter === tab.value;
            return (
              <button key={tab.value} onClick={() => setFilter(tab.value)}
                className={`flex items-center gap-2 px-4 py-3 text-body-sm font-semibold border-b-2 whitespace-nowrap transition-all ${isActive ? 'border-mint-navy text-mint-navy' : 'border-transparent text-text-muted hover:text-text-primary hover:border-border-default'}`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-mint-navy text-white' : 'bg-surface-page text-text-muted'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" text="Loading milestones..." /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No milestones found"
            description={filter === 'pending_review' ? 'No milestones are waiting for your review right now.' : `No ${filter.replace('_', ' ')} milestones at this time.`}
          />
        ) : (
          <div className="grid gap-4">
            {filtered.map((milestone) => (
              <MilestoneReviewCard key={milestone.milestone_id} milestone={milestone} onUpdate={loadMilestones} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}