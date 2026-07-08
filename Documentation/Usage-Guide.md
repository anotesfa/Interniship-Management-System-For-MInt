# MInT Internship Management System Usage Guide

## 1. Purpose

This guide explains how the MInT Internship Management System is used from end to end. It covers the four user roles, the full internship workflow, what each user can do, what each user cannot do, and how the system behaves after a student has been evaluated.

The system is role-based and access-controlled. Each user only sees the screens and actions that match their role, and important actions are recorded in the system audit trail.

## 2. Who Uses the System

The system is built around four user types:

1. Admin
2. University Coordinator
3. Supervisor
4. Student

These roles work together in a fixed internship lifecycle. Universities register and are approved first. Students are then managed through applications and assignments. Supervisors monitor the internship, submit attendance and evaluation data, and admins approve the final evaluation result.

## 3. Common Concepts

### Authentication

Every user logs in with an email and password. After login, the system routes the user to the correct dashboard based on the assigned role.

### Role-based access

Pages, buttons, and API actions are protected by role checks. If a user tries to open a page that does not belong to their role, the action is denied.

### Notifications and messages

The system supports internal messaging and notifications. These are used to keep users informed about application reviews, assignments, evaluation status changes, and other workflow events.

### Documents and templates

Admins can manage templates. Users can upload or view documents depending on the module they are working in, such as applications, reports, or evaluation-related files.

### Audit and login records

The system records logins and important actions so admins can review who changed what, when it happened, and which entity was affected.

## 4. End-to-End Workflow

The typical system flow is:

1. A university creates an account or submits a registration request.
2. An admin reviews the request and approves or rejects it.
3. The university submits student applications, often in bulk.
4. The admin reviews applications and creates internship assignments.
5. A supervisor is attached to each internship.
6. The student submits milestones and monthly reports while the internship is active.
7. The supervisor records attendance and prepares the evaluation.
8. The supervisor saves a draft or submits the evaluation.
9. The admin reviews the submitted evaluation and either publishes it or returns it for correction.
10. After publication, the student can view the result and the student-facing workflow becomes restricted.

## 5. Admin Usage

Admins are the highest-privilege users in the system. They manage the overall internship process, verify data quality, and approve final results.

### What Admins can do

- Review and approve or reject university registration requests.
- View and manage student internship applications.
- Create, review, and update internship assignments.
- Review all evaluations by status, including draft, submitted, returned, and published states.
- Publish a supervisor-submitted evaluation.
- Return an evaluation to the supervisor for correction with a reason.
- View reports across users, departments, and cohorts.
- View and filter the system audit trail.
- View activity statistics and entity-specific history.
- Manage users, including account lock and unlock actions.
- Manage templates used by the system.
- Read internal messages and respond when needed.

### Admin workflow in practice

The admin normally works from the applications, assignments, evaluations, reports, users, and audit sections of the dashboard. A common admin sequence is:

1. Open the university requests list and approve a valid institution.
2. Review student applications and confirm that the information is complete.
3. Assign students to supervisors.
4. Monitor submitted evaluations.
5. Publish final results once the evaluation is correct.
6. Return incomplete or incorrect evaluations to the supervisor with feedback.

### What Admins cannot do

- Admins do not submit student milestones or monthly reports as part of normal student workflow.
- Admins do not act as the student’s supervisor inside the evaluation form.
- Admins cannot bypass the role-based access model to use another user’s private dashboard.

## 6. University Coordinator Usage

University users coordinate the institutional side of the internship program. They submit and track student requests, manage their own university records, and follow up on reports and final results.

### What University Coordinators can do

- Submit or manage internship applications for their university.
- Upload applications in bulk when multiple students are involved.
- Track the status of student requests and university submissions.
- View approved students and follow the internship progress.
- Review reports related to students from their institution.
- Download grade reports for students once the evaluation is available to them.
- Exchange messages with the relevant system users.
- View published evaluation results for students from their university.

### University workflow in practice

The university usually works in this order:

1. Register the university account.
2. Wait for admin approval before using the full workflow.
3. Submit student applications or upload a bulk file.
4. Monitor the approval result of each request.
5. Review student progress reports and internship outcomes.
6. Download the final evaluation report after publication.

### What University Coordinators cannot do

- They cannot approve their own university registration.
- They cannot assign supervisors.
- They cannot publish evaluations.
- They cannot change a supervisor’s submitted evaluation directly.
- They cannot access admin-only audit and user-management functions.

## 7. Supervisor Usage

Supervisors handle the day-to-day internship monitoring and the evaluation process. They are responsible for supervision, attendance, milestone review, monthly report review, and final scoring.

### What Supervisors can do

- View the list of students assigned to them.
- Track milestones submitted by their students.
- Record or review attendance.
- Review monthly reports.
- Send and receive messages related to their assigned students.
- Save an evaluation as a draft.
- Submit the final evaluation once all required sections are complete.
- Review their own past evaluations.
- Open a specific student’s evaluation record.

### Supervisor evaluation workflow

The supervisor evaluation form is not a quick text-only form. It contains several scoring sections:

- General performance
- Personal skills
- Professional skills
- Attendance information

The supervisor can save progress as a draft while working through the form. Drafts can be edited later as long as the evaluation is not published.

To submit the evaluation, the supervisor must complete the required scoring fields and attendance data. The system rejects submission if the required sections are incomplete.

### What Supervisors cannot do

- They cannot publish their own evaluation.
- They cannot mark an evaluation as final-published.
- They cannot edit a published evaluation.
- They cannot create supervisor assignments for students.
- They cannot access admin-only audit data.

### Important supervisor rule

Once an evaluation has been submitted and later published by the admin, the supervisor can no longer edit that published record. If the admin returns the evaluation, the supervisor can correct the record only while it remains in a non-published state.

## 8. Student Usage

Students use the system to follow their internship progress, submit milestones and monthly reports, communicate with their supervisor, and view the final evaluation result.

### Student dashboard experience

The student dashboard shows:

- Assigned supervisor details
- Internship dates
- Group or team information when applicable
- Milestone progress summary
- Evaluation status and details
- Quick actions for student tasks

Students may be routed to different views depending on whether they are a team leader or a team member.

### What Students can do before evaluation publication

- View internship assignment details.
- Submit new milestones.
- Browse milestone progress.
- Submit monthly progress reports.
- Send messages to the supervisor.
- View submitted evaluation data while it is still in progress or pending publication.
- Follow notification updates about their internship.

### What Students can do after evaluation publication

Once the evaluation is published, the student can still open the system and review the final outcome, but the workflow becomes restricted.

After publication, the student can:

- View the final published evaluation.
- See the published grade and score.
- Read the feedback and outcome information that was published.
- Receive notification and email updates about the published result.

After publication, the student can no longer:

- Submit new monthly reports from the student reports page.
- Submit new milestones from the student dashboard.
- Use the supervisor messaging workflow from the student messaging page.
- Use the student quick actions that are marked as locked after publication.

### Student team mode

If a student belongs to a group, the system may route them to a member dashboard rather than the leader dashboard. The member experience is narrower, but the same evaluation-locking rule still applies after publication.

### What Students cannot do

- They cannot edit the supervisor’s evaluation.
- They cannot publish their own result.
- They cannot reopen a published evaluation.
- They cannot act as supervisor or admin.

## 9. What Happens After a Student Is Evaluated

This is the most important post-evaluation rule in the system.

When the evaluation is published:

1. The evaluation status becomes published.
2. The student receives a notification.
3. The student may also receive an email if SMTP is configured.
4. The student record is marked as evaluated.
5. The student-facing workflow is locked for the main progress actions.

### Post-evaluation restrictions

The system prevents the student from continuing the normal active-internship workflow. In practice, the UI disables or replaces actions such as:

- Submitting new milestones
- Submitting monthly reports
- Sending new messages through the student messaging screen

The student can still review the final result, but the system treats the internship as complete from the student workflow perspective.

### Why the lock exists

The lock protects the integrity of the final result. Once the supervisor and admin have finalized the evaluation, the student cannot keep changing the internship record in ways that would conflict with the published outcome.

## 10. Logging and Audit Trail

The system includes a structured audit trail for accountability.

### What is logged

- Login events
- Password changes
- Create, update, and delete actions
- Evaluation submission and publication-related actions
- Admin review actions
- Entity-level history for important records

### What admins can inspect

The audit page allows admins to:

- Filter logs by action
- Filter logs by user name
- Filter logs by date range
- Review the role associated with the action
- Inspect the affected entity type and ID
- Page through older log entries
- Clear logs when necessary

### Why the log matters

The log makes it possible to answer questions like:

- Who approved this university?
- Who published this evaluation?
- When was the student marked as evaluated?
- Which user changed this record?
- What happened during a specific date range?

## 11. Notifications and Email

The system uses notifications and email to keep users informed without requiring them to constantly refresh the app.

### Typical notification events

- Evaluation published
- Evaluation returned for correction
- Application or university approval updates
- Other important workflow transitions

### Email behavior

Evaluation publication can trigger an email to the student if email delivery is configured. The email includes the final grade, score, and supervisor name when available.

## 12. Reports and Data Export

Reporting is a major part of the system’s usage.

### Admin reports

- Consolidated cohort reports
- Evaluation status reports
- Activity statistics
- Audit history reports

### University reports

- Student grade reports
- University-level progress tracking
- Submission status review

### Supervisor reports

- Student evaluation histories
- Attendance-related tracking
- Monthly report review workflow

## 13. Practical Limits by Role

### Admin

- Cannot submit student internship work as a student.
- Cannot override the need for proper data in evaluations.

### University Coordinator

- Cannot approve its own registration.
- Cannot finalize evaluations.

### Supervisor

- Cannot publish the final evaluation.
- Cannot edit a published evaluation.

### Student

- Cannot change the final grade.
- Cannot add new internship progress items after evaluation publication.

## 14. Suggested Day-to-Day Usage

### For Admins

Start with application and university approvals, move to assignments, then review evaluations and publish only when the record is complete.

### For University Coordinators

Keep applications current, monitor student progress, and use reports to follow the internship cycle from submission through final result.

### For Supervisors

Update attendance and milestone reviews during the internship, then complete and submit evaluation data only after the required information is ready.

### For Students

Stay active during the internship period, submit milestones and reports on time, and use messaging while the evaluation is still in progress. After publication, focus on reviewing the final result.

## 15. Summary

The MInT Internship Management System is designed to support the full internship lifecycle from university approval to final evaluation. Admins control the system, university coordinators manage institutional submissions, supervisors handle evaluation and attendance, and students track progress until the final result is published.

The key rule to remember is that student activity becomes restricted after the evaluation is published. At that point, the final record is treated as read-only from the student workflow perspective, and the system logs the change for audit purposes.