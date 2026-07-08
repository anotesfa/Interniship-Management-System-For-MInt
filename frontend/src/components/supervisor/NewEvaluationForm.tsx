// New Evaluation Form Component with Granular Metrics (18 fields + totals)
import React, { useEffect, useState } from 'react';
import { Card, Textarea } from '../../components/common';
import { EvaluationFormData } from '../../types/evaluation.types';

interface NumericInputProps {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  description?: string;
}

const NumericInput: React.FC<NumericInputProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max,
  disabled = false,
  description,
}) => {
  const effectiveMax = max ?? 5;
  const showMaxLabel = typeof max === 'number';

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {showMaxLabel ? ` (max ${effectiveMax})` : ''}
      </label>
      {description && <p className="text-xs text-gray-500">{description}</p>}
      <input
        type="number"
        min={min}
        max={effectiveMax}
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') {
            onChange(undefined);
            return;
          }
          const parsed = parseInt(raw, 10);
          if (Number.isNaN(parsed)) {
            onChange(undefined);
            return;
          }
          const clamped = Math.max(min, Math.min(effectiveMax, parsed));
          onChange(clamped);
        }}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>
  );
};

interface EvaluationFormProps {
  data: EvaluationFormData;
  onChange: (data: EvaluationFormData) => void;
  isReadOnly?: boolean;
  showTotals?: boolean;
  activeSection?: 'general'|'personal'|'professional'|'attendance'|'overall';
}

export const NewEvaluationForm: React.FC<EvaluationFormProps> = ({
  data,
  onChange,
  isReadOnly = false,
  showTotals = false,
  activeSection,
}) => {
  const determineGrade = (score: number): string => {
    if (score > 90) return 'A+';
    if (score > 80) return 'A';
    if (score > 70) return 'B';
    if (score > 60) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  };

  const [totals, setTotals] = useState({
    general: 0,
    personal: 0,
    professional: 0,
    total: 0,
  });

  useEffect(() => {
    const generalTotal =
      ((data.punctuality_score || 0) +
        (data.reliability_score || 0) +
        (data.independence_score || 0) +
        (data.communication_score || 0) +
        (data.professionalism_score || 0)) / 5;

    const personalTotal =
      ((data.speed_of_work_score || 0) +
        (data.accuracy_score || 0) +
        (data.engagement_score || 0) +
        (data.need_for_work_score || 0) +
        (data.cooperation_score || 0)) / 5;

    const professionalTotal =
      ((data.technical_skills_score || 0) +
        (data.organizational_skills_score || 0) +
        (data.project_support_score || 0) +
        (data.responsibility_score || 0) +
        (data.team_quality_score || 0)) / 5;

    const total = Math.round((generalTotal * 5) + (personalTotal * 5) + (professionalTotal * 5));

    setTotals({
      general: Math.round(generalTotal * 5),
      personal: Math.round(personalTotal * 5),
      professional: Math.round(professionalTotal * 5),
      total,
    });
  }, [data]);

  const calculatedGrade = determineGrade(totals.total);

  const updateField = (field: keyof EvaluationFormData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const showSection = (section: 'general'|'personal'|'professional'|'attendance'|'overall') =>
    !activeSection || activeSection === section;

  return (
    <div className="space-y-6">
      {showSection('general') && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">General Performance (25%)</h3>
            <p className="text-sm text-gray-600">Overall professional attitude, reliability, and work ethic</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NumericInput
              label="Punctuality"
              value={data.punctuality_score}
              onChange={(v) => updateField('punctuality_score', v)}
              max={5}
              disabled={isReadOnly}
              description="Arrives on time, meets deadlines"
              min={1}
            />
            <NumericInput
              label="Reliability"
              value={data.reliability_score}
              onChange={(v) => updateField('reliability_score', v)}
              max={5}
              disabled={isReadOnly}
              description="Consistent, dependable, follows through"
              min={1}
            />
            <NumericInput
              label="Independence"
              value={data.independence_score}
              onChange={(v) => updateField('independence_score', v)}
              max={5}
              disabled={isReadOnly}
              description="Works without supervision, takes initiative"
              min={1}
            />
            <NumericInput
              label="Communication"
              value={data.communication_score}
              onChange={(v) => updateField('communication_score', v)}
              max={5}
              disabled={isReadOnly}
              description="Clear, professional communication"
              min={1}
            />
            <NumericInput
              label="Professionalism"
              value={data.professionalism_score}
              onChange={(v) => updateField('professionalism_score', v)}
              max={5}
              disabled={isReadOnly}
              description="Professional behavior and conduct"
              min={1}
            />
          </div>
          {showTotals && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="text-sm font-semibold text-gray-700">
                Section Total: <span className="text-blue-600 text-lg">{totals.general}/25</span>
              </p>
            </div>
          )}
        </Card>
      )}

      {showSection('personal') && (
        <Card className="bg-green-50 border-green-200">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Skills (25%)</h3>
            <p className="text-sm text-gray-600">Work efficiency, attention to detail, and personal growth</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NumericInput
              label="Speed of Work"
              value={data.speed_of_work_score}
              onChange={(v) => updateField('speed_of_work_score', v)}
              max={5}
              disabled={isReadOnly}
              description="Completes tasks efficiently and promptly"
              min={1}
            />
            <NumericInput
              label="Accuracy"
              value={data.accuracy_score}
              onChange={(v) => updateField('accuracy_score', v)}
              max={5}
              disabled={isReadOnly}
              description="Attention to detail, minimal errors"
              min={1}
            />
            <NumericInput
              label="Engagement"
              value={data.engagement_score}
              onChange={(v) => updateField('engagement_score', v)}
              max={5}
              disabled={isReadOnly}
              description="Active participation, shows interest"
              min={1}
            />
            <NumericInput
              label="Need for Supervision"
              value={data.need_for_work_score}
              onChange={(v) => updateField('need_for_work_score', v)}
              max={5}
              disabled={isReadOnly}
              description="Requires minimal supervision"
              min={1}
            />
            <NumericInput
              label="Cooperation"
              value={data.cooperation_score}
              onChange={(v) => updateField('cooperation_score', v)}
              max={5}
              disabled={isReadOnly}
              description="Receptive to feedback, collaborative"
              min={1}
            />
          </div>
          {showTotals && (
            <div className="mt-4 pt-4 border-t border-green-200">
              <p className="text-sm font-semibold text-gray-700">
                Section Total: <span className="text-green-600 text-lg">{totals.personal}/25</span>
              </p>
            </div>
          )}
        </Card>
      )}

      {showSection('professional') && (
        <Card className="bg-purple-50 border-purple-200">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Skills (50%)</h3>
            <p className="text-sm text-gray-600">Technical competence, organizational ability, and responsibility</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NumericInput
              label="Technical Skills"
              value={data.technical_skills_score}
              onChange={(v) => updateField('technical_skills_score', v)}
              max={10}
              disabled={isReadOnly}
              description="Proficiency in job-related technical areas"
              min={1}
            />
            <NumericInput
              label="Organizational Skills"
              value={data.organizational_skills_score}
              onChange={(v) => updateField('organizational_skills_score', v)}
              max={10}
              disabled={isReadOnly}
              description="Plans, organizes, manages time effectively"
              min={1}
            />
            <NumericInput
              label="Project Support"
              value={data.project_support_score}
              onChange={(v) => updateField('project_support_score', v)}
              max={10}
              disabled={isReadOnly}
              description="Contributes meaningfully to projects"
              min={1}
            />
            <NumericInput
              label="Responsibility"
              value={data.responsibility_score}
              onChange={(v) => updateField('responsibility_score', v)}
              max={10}
              disabled={isReadOnly}
              description="Accountable for work, meets obligations"
              min={1}
            />
            <NumericInput
              label="Team Quality"
              value={data.team_quality_score}
              onChange={(v) => updateField('team_quality_score', v)}
              max={10}
              disabled={isReadOnly}
              description="Contributes to positive team dynamics"
              min={1}
            />
          </div>
          {showTotals && (
            <div className="mt-4 pt-4 border-t border-purple-200">
              <p className="text-sm font-semibold text-gray-700">
                Section Total: <span className="text-purple-600 text-lg">{totals.professional}/50</span>
              </p>
            </div>
          )}
        </Card>
      )}

      {showSection('attendance') && (
        <Card className="bg-orange-50/50 border-orange-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Attendance Record</h3>
            <p className="text-xs text-gray-500">Automatically tracked and synchronized with student group schedule</p>
          </div>
          {(() => {
            const totalAbsent = data.total_absent_days;
            const percentage = data.attendance_percentage;
            
            let totalWeeksVal = 8;
            let scheduledDaysPerWeek = 5;
            if (data.group_start_date && data.group_end_date) {
              const start = new Date(data.group_start_date);
              const end = new Date(data.group_end_date);
              const diffTime = end.getTime() - start.getTime();
              if (diffTime > 0) {
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                totalWeeksVal = Math.max(1, Math.ceil(diffDays / 7));
              }
            }
            if (data.group_attendance_days) {
              scheduledDaysPerWeek = data.group_attendance_days.split(',').length;
            }
            const totalExpectedDays = totalWeeksVal * scheduledDaysPerWeek;
            const presentDays = typeof totalAbsent === 'number'
              ? Math.max(0, totalExpectedDays - totalAbsent)
              : null;

            return (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-orange-100 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xl font-bold flex-shrink-0">
                    {typeof percentage === 'number' && percentage >= 100 ? '✅' : '📋'}
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-900">
                      {typeof percentage === 'number' ? `${percentage}% present` : 'Attendance not available'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {typeof presentDays === 'number'
                        ? `${presentDays} present day${presentDays !== 1 ? 's' : ''} out of ${totalExpectedDays} total expected days`
                        : 'Saved attendance data will appear here once the record exists.'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 self-end sm:self-center border-t sm:border-t-0 sm:border-l border-orange-100 pt-3 sm:pt-0 sm:pl-4">
                  <div className="text-right">
                    <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Absences</span>
                    <span className="text-lg font-bold text-red-600">
                      {typeof totalAbsent === 'number'
                        ? `${totalAbsent} day${totalAbsent !== 1 ? 's' : ''} absent`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </Card>
      )}

      {showSection('overall') && (
        <Card className="bg-gray-50 border-gray-200">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Overall Assessment</h3>
            {showTotals && (
              <p className="text-lg font-bold text-gray-900 mb-4">
                Total Score: <span className="text-green-600">{totals.total}/100</span>
              </p>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Letter Grade</label>
              <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 font-semibold">
                {calculatedGrade}
              </div>
              <p className="mt-1 text-xs text-gray-500">Calculated automatically from the total score.</p>
            </div>
            <Textarea
              label="Remarks & Comments"
              value={data.remarks || ''}
              onChange={(e) => updateField('remarks', e.target.value)}
              placeholder="Provide any additional comments or feedback about the intern's performance"
              rows={5}
              disabled={isReadOnly}
            />
          </div>
        </Card>
      )}
    </div>
  );
};

export default NewEvaluationForm;
