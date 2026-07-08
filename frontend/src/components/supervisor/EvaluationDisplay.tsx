// Evaluation Display Component - Shows new metrics in formatted view
import React from 'react';
import { Card } from '../../components/common';
import { Evaluation } from '../../types/evaluation.types';

interface EvaluationDisplayProps {
  evaluation: Evaluation;
  showSectionTotals?: boolean;
}

const ScoreBar: React.FC<{ score: number; label: string; max?: number }> = ({ score, label, max = 5 }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className="text-sm font-bold text-gray-900">{score}/{max}</span>
    </div>
    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-blue-500 transition-all"
        style={{ width: `${(score / max) * 100}%` }}
      />
    </div>
  </div>
);

export const EvaluationDisplay: React.FC<EvaluationDisplayProps> = ({ evaluation, showSectionTotals = true }) => {
  const calculateSectionTotal = (scores: (number | undefined)[]): number => {
    const validScores = scores.filter((s): s is number => s !== undefined && s > 0);
    return validScores.length > 0 ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 5) : 0;
  };

  const generalTotal = calculateSectionTotal([
    evaluation.punctuality_score,
    evaluation.reliability_score,
    evaluation.independence_score,
    evaluation.communication_score,
    evaluation.professionalism_score,
  ]);

  const personalTotal = calculateSectionTotal([
    evaluation.speed_of_work_score,
    evaluation.accuracy_score,
    evaluation.engagement_score,
    evaluation.need_for_work_score,
    evaluation.cooperation_score,
  ]);

  const professionalTotal = calculateSectionTotal([
    evaluation.technical_skills_score,
    evaluation.organizational_skills_score,
    evaluation.project_support_score,
    evaluation.responsibility_score,
    evaluation.team_quality_score,
  ]);
  const overallScore = evaluation.total_score ?? (generalTotal + personalTotal + professionalTotal);

  return (
    <div className="space-y-6">
      {/* Header with Overall Score */}
      {(overallScore !== undefined || evaluation.grade) && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Overall Assessment</h3>
              <p className="text-sm text-gray-600 mt-1">Final performance evaluation</p>
            </div>
            <div className="text-right">
              {overallScore !== undefined && (
                <div className="mb-2">
                  <p className="text-xs text-gray-600">Total Score</p>
                  <p className="text-4xl font-bold text-indigo-600">{overallScore}/100</p>
                </div>
              )}
              {evaluation.grade && (
                <div>
                  <p className="text-xs text-gray-600">Grade</p>
                  <p className="text-3xl font-bold text-indigo-600">{evaluation.grade}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* General Performance Section */}
      {(evaluation.punctuality_score !== undefined ||
        evaluation.reliability_score !== undefined ||
        evaluation.independence_score !== undefined ||
        evaluation.communication_score !== undefined ||
        evaluation.professionalism_score !== undefined) && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">General Performance (25%)</h3>
            <p className="text-sm text-gray-600 mt-1">Overall professional attitude, reliability, and work ethic</p>
          </div>

          <div className="space-y-4">
            {evaluation.punctuality_score !== undefined && (
              <ScoreBar score={evaluation.punctuality_score} label="Punctuality" />
            )}
            {evaluation.reliability_score !== undefined && (
              <ScoreBar score={evaluation.reliability_score} label="Reliability" />
            )}
            {evaluation.independence_score !== undefined && (
              <ScoreBar score={evaluation.independence_score} label="Independence" />
            )}
            {evaluation.communication_score !== undefined && (
              <ScoreBar score={evaluation.communication_score} label="Communication" />
            )}
            {evaluation.professionalism_score !== undefined && (
              <ScoreBar score={evaluation.professionalism_score} label="Professionalism" />
            )}
          </div>

          {showSectionTotals && generalTotal > 0 && (
            <div className="mt-6 pt-6 border-t border-blue-200">
              <p className="text-sm font-bold text-gray-700">
                Section Total: <span className="text-blue-600 text-lg">{generalTotal}/25</span>
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Personal Skills Section */}
      {(evaluation.speed_of_work_score !== undefined ||
        evaluation.accuracy_score !== undefined ||
        evaluation.engagement_score !== undefined ||
        evaluation.need_for_work_score !== undefined ||
        evaluation.cooperation_score !== undefined) && (
        <Card className="bg-green-50 border-green-200">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Personal Skills (25%)</h3>
            <p className="text-sm text-gray-600 mt-1">Work efficiency, attention to detail, and personal growth</p>
          </div>

          <div className="space-y-4">
            {evaluation.speed_of_work_score !== undefined && (
              <ScoreBar score={evaluation.speed_of_work_score} label="Speed of Work" />
            )}
            {evaluation.accuracy_score !== undefined && (
              <ScoreBar score={evaluation.accuracy_score} label="Accuracy" />
            )}
            {evaluation.engagement_score !== undefined && (
              <ScoreBar score={evaluation.engagement_score} label="Engagement" />
            )}
            {evaluation.need_for_work_score !== undefined && (
              <ScoreBar score={evaluation.need_for_work_score} label="Independence" />
            )}
            {evaluation.cooperation_score !== undefined && (
              <ScoreBar score={evaluation.cooperation_score} label="Cooperation" />
            )}
          </div>

          {showSectionTotals && personalTotal > 0 && (
            <div className="mt-6 pt-6 border-t border-green-200">
              <p className="text-sm font-bold text-gray-700">
                Section Total: <span className="text-green-600 text-lg">{personalTotal}/25</span>
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Professional Skills Section */}
      {(evaluation.technical_skills_score !== undefined ||
        evaluation.organizational_skills_score !== undefined ||
        evaluation.project_support_score !== undefined ||
        evaluation.responsibility_score !== undefined ||
        evaluation.team_quality_score !== undefined) && (
        <Card className="bg-purple-50 border-purple-200">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Professional Skills (50%)</h3>
            <p className="text-sm text-gray-600 mt-1">Technical competence, organizational ability, and responsibility</p>
          </div>

          <div className="space-y-4">
            {evaluation.technical_skills_score !== undefined && (
              <ScoreBar score={evaluation.technical_skills_score} label="Technical Skills" max={10} />
            )}
            {evaluation.organizational_skills_score !== undefined && (
              <ScoreBar score={evaluation.organizational_skills_score} label="Organizational Skills" max={10} />
            )}
            {evaluation.project_support_score !== undefined && (
              <ScoreBar score={evaluation.project_support_score} label="Project Support" max={10} />
            )}
            {evaluation.responsibility_score !== undefined && (
              <ScoreBar score={evaluation.responsibility_score} label="Responsibility" max={10} />
            )}
            {evaluation.team_quality_score !== undefined && (
              <ScoreBar score={evaluation.team_quality_score} label="Team Quality" max={10} />
            )}
          </div>

          {showSectionTotals && professionalTotal > 0 && (
            <div className="mt-6 pt-6 border-t border-purple-200">
              <p className="text-sm font-bold text-gray-700">
                Section Total: <span className="text-purple-600 text-lg">{professionalTotal}/50</span>
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Attendance Section - REMOVED */}

      {/* Remarks */}
      {evaluation.remarks && (
        <Card className="bg-gray-50 border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Supervisor Comments</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{evaluation.remarks}</p>
        </Card>
      )}
    </div>
  );
};

export default EvaluationDisplay;
