const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Ethiopian names from mock-data.service.ts
const ethiopianFirstNames = [
  'Abebe',
  'Almaz',
  'Bekele',
  'Chaltu',
  'Dawit',
  'Eleni',
  'Fikadu',
  'Genet',
  'Haile',
  'Hiwot',
  'Kidus',
  'Liya',
  'Meron',
  'Nigist',
  'Samuel',
  'Sara',
  'Tadesse',
  'Tigist',
  'Yonas',
  'Zewdu',
  'Biruk',
  'Meseret',
  'Tesfaye',
  'Rahel',
];

const ethiopianLastNames = [
  'Alemu',
  'Bekele',
  'Gemechu',
  'Girma',
  'Hailu',
  'Kebede',
  'Mekonnen',
  'Mengistu',
  'Mulugeta',
  'Tadesse',
  'Tamiru',
  'Tesfaye',
  'Wolde',
  'Yilma',
  'Abera',
  'Desta',
];

const universities = [
  { code: 'hu', name: 'Haramaya University', email: 'hu' },
  { code: 'aau', name: 'Addis Ababa University', email: 'aau' },
  { code: 'ju', name: 'Jimma University', email: 'ju' },
  { code: 'bdu', name: 'Bahir Dar University', email: 'bdu' },
  { code: 'mu', name: 'Mekelle University', email: 'mu' },
  { code: 'uog', name: 'University of Gondar', email: 'uog' },
  {
    code: 'astu',
    name: 'Adama Science and Technology University',
    email: 'astu',
  },
  { code: 'wku', name: 'Wolkite University', email: 'wku' },
];

const majorUniversitySupervisors = [
  {
    fullName: 'Dr. Abebe Kebede',
    email: 'abebe.kebede@aau.edu.et',
    department: 'Computer Science',
  },
  {
    fullName: 'Dr. Almaz Hailu',
    email: 'almaz.hailu@ju.edu.et',
    department: 'Information Technology',
  },
  {
    fullName: 'Dr. Bekele Mulugeta',
    email: 'bekele.mulugeta@bdu.edu.et',
    department: 'Software Engineering',
  },
  {
    fullName: 'Dr. Chaltu Desta',
    email: 'chaltu.desta@mu.edu.et',
    department: 'Electrical Engineering',
  },
  {
    fullName: 'Dr. Dawit Girma',
    email: 'dawit.girma@uog.edu.et',
    department: 'Network Engineering',
  },
  {
    fullName: 'Dr. Eleni Mekonnen',
    email: 'eleni.mekonnen@astu.edu.et',
    department: 'Data Science',
  },
  {
    fullName: 'Dr. Fikadu Tamiru',
    email: 'fikadu.tamiru@wku.edu.et',
    department: 'Cyber Security',
  },
  {
    fullName: 'Dr. Genet Wolde',
    email: 'genet.wolde@hu.edu.et',
    department: 'Management Information Systems',
  },
];

const mintSupervisors = [
  {
    fullName: 'Dr. Kidus Kebede',
    email: 'kidus.kebede@mint.gov',
    department: 'Software Engineering',
  },
  {
    fullName: 'Dr. Liya Abera',
    email: 'liya.abera@mint.gov',
    department: 'Information Technology',
  },
  {
    fullName: 'Dr. Meron Tadesse',
    email: 'meron.tadesse@mint.gov',
    department: 'Computer Science',
  },
  {
    fullName: 'Dr. Nigist Yilma',
    email: 'nigist.yilma@mint.gov',
    department: 'Data Science',
  },
  {
    fullName: 'Dr. Samuel Tesfaye',
    email: 'samuel.tesfaye@mint.gov',
    department: 'Network Engineering',
  },
  {
    fullName: 'Dr. Sara Mengistu',
    email: 'sara.mengistu@mint.gov',
    department: 'Management Information Systems',
  },
  {
    fullName: 'Dr. Tadesse Hailu',
    email: 'tadesse.hailu@mint.gov',
    department: 'Cyber Security',
  },
];

const departments = [
  'Software Engineering',
  'Information Technology',
  'Computer Science',
  'Management Information Systems',
  'Electrical Engineering',
  'Data Science',
  'Cyber Security',
  'Network Engineering',
];

function normalizePasswordPart(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function buildStudentPassword(fatherName, registrationNumber) {
  return `${normalizePasswordPart(fatherName)}${normalizePasswordPart(registrationNumber)}`;
}

async function main() {
  console.log('🌱 Seeding Database with Mock Users and Test Data...');

  console.log('🧹 Clearing previous seed data...');
  await prisma.$transaction([
    prisma.applicationStudent.deleteMany(),
    prisma.submissionReview.deleteMany(),
    prisma.submission.deleteMany(),
    prisma.milestone.deleteMany(),
    prisma.assignment.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.monthlyReport.deleteMany(),
    prisma.evaluation.deleteMany(),
    prisma.internship.deleteMany(),
    prisma.supervisor.deleteMany(),
    prisma.student.deleteMany(),
    prisma.universityUser.deleteMany(),
    prisma.message.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.document.deleteMany(),
    prisma.loginLog.deleteMany(),
    prisma.activityLog.deleteMany(),
    prisma.statusHistory.deleteMany(),
    prisma.application.deleteMany(),
    prisma.documentType.deleteMany(),
    prisma.university.deleteMany(),
    prisma.user.deleteMany(),
    prisma.role.deleteMany(),
  ]);

  // 1. Create Roles
  console.log('📝 Creating roles...');
  const adminRole = await prisma.role.upsert({
    where: { role_name: 'Admin' },
    update: {},
    create: { role_name: 'Admin' },
  });

  const coordinatorRole = await prisma.role.upsert({
    where: { role_name: 'University Coordinator' },
    update: {},
    create: { role_name: 'University Coordinator' },
  });

  const supervisorRole = await prisma.role.upsert({
    where: { role_name: 'Supervisor' },
    update: {},
    create: { role_name: 'Supervisor' },
  });

  const studentRole = await prisma.role.upsert({
    where: { role_name: 'Student' },
    update: {},
    create: { role_name: 'Student' },
  });

  // Password hashes for each role (mock passwords from mock-data.service)
  const adminPassword = await bcrypt.hash('admin123', 12);
  const supervisorPassword = await bcrypt.hash('super123', 12);
  const uniPassword = await bcrypt.hash('uni123', 12);

  console.log('👤 Creating admin users (2)...');
  // 2. Create Admins (2) — must exist before universities (created_by FK)
  const admins = [];
  const adminEmails = ['abebe.kebede@mint.gov', 'tigist.mengistu@mint.gov'];
  const adminNames = ['Abebe Kebede', 'Tigist Mengistu'];

  for (let i = 0; i < 2; i++) {
    const admin = await prisma.user.upsert({
      where: { email: adminEmails[i] },
      update: {},
      create: {
        full_name: adminNames[i],
        email: adminEmails[i],
        password_hash: adminPassword,
        role_id: adminRole.role_id,
        account_status: 'active',
      },
    });
    admins.push(admin);
  }

  console.log('🏛️  Creating universities...');
  // 3. Create Universities
  const createdUniversities = [];
  for (const uni of universities) {
    let university = await prisma.university.findFirst({
      where: { name: uni.name },
    });
    if (!university) {
      university = await prisma.university.create({
        data: {
          name: uni.name,
          contact_email: `info@${uni.code}.edu.et`,
          address: `${uni.name}, Ethiopia`,
          created_by: admins[0].user_id,
        },
      });
    }
    createdUniversities.push(university);
  }

  console.log('👨‍🎓 Creating student users (31)...');
  // 4. Create Students (31)
  const students = [];

  const atinafUser = await prisma.user.create({
    data: {
      full_name: 'Atinaf Bedasa',
      email: 'atinaf.bedasa@hu.edu.et',
      password_hash: await bcrypt.hash(
        buildStudentPassword('Bedasa', 'UGR 22/15'),
        12,
      ),
      role_id: studentRole.role_id,
      account_status: 'active',
    },
  });

  const atinafStudent = await prisma.student.create({
    data: {
      user_id: atinafUser.user_id,
      university_id: createdUniversities[0].university_id,
      full_name: 'Atinaf Bedasa',
      registration_number: 'UGR 22/15',
      email: atinafUser.email,
      department: 'Software Engineering',
      gpa: 3.6,
      status: 'active',
    },
  });

  students.push({ user: atinafUser, student: atinafStudent });

  for (let i = 0; i < 30; i++) {
    const firstName = ethiopianFirstNames[i % ethiopianFirstNames.length];
    const lastName =
      ethiopianLastNames[
        Math.floor(i / ethiopianFirstNames.length) % ethiopianLastNames.length
      ];
    const university = createdUniversities[0]; // Always Haramaya
    const dept = departments[i % departments.length];

    const studentUser = await prisma.user.create({
      data: {
        full_name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@hu.edu.et`,
        password_hash: await bcrypt.hash(
          buildStudentPassword(lastName, `UGR/${1000 + i}/15`),
          12,
        ),
        role_id: studentRole.role_id,
        account_status: 'active',
      },
    });

    const student = await prisma.student.create({
      data: {
        user_id: studentUser.user_id,
        university_id: university.university_id,
        full_name: `${firstName} ${lastName}`,
        registration_number: `UGR/${1000 + i}/15`,
        email: studentUser.email,
        department: dept,
        gpa: Math.random() * 4.0,
        status: 'active',
      },
    });

    students.push({ user: studentUser, student });
  }

  console.log(
    '  ✓ Student passwords are generated from father name + registration number',
  );

  console.log('👨‍💼 Creating supervisor users (15)...');
  // 5. Create Supervisors (15)
  const supervisors = [];
  const supervisorSeedData = [
    ...majorUniversitySupervisors,
    ...mintSupervisors,
  ];

  for (let i = 0; i < supervisorSeedData.length; i++) {
    const seed = supervisorSeedData[i];
    const supervisorUser = await prisma.user.create({
      data: {
        full_name: seed.fullName,
        email: seed.email,
        password_hash: supervisorPassword,
        role_id: supervisorRole.role_id,
        account_status: 'active',
      },
    });

    const supervisor = await prisma.supervisor.create({
      data: {
        user_id: supervisorUser.user_id,
        department: seed.department,
        position: 'Senior Engineer',
        max_students: 10,
      },
    });

    supervisors.push({ user: supervisorUser, supervisor });
  }

  console.log('🏫 Creating university coordinator users (1)...');
  // 6. Create University Coordinators (1 for Haramaya)
  const coordinators = [];
  const coordFirstName = ethiopianFirstNames[15 % ethiopianFirstNames.length];
  const coordLastName = ethiopianLastNames[8 % ethiopianLastNames.length];

  const coordUser = await prisma.user.create({
    data: {
      full_name: `${coordFirstName} ${coordLastName}`,
      email: `coordinator@hu.edu.et`,
      password_hash: uniPassword,
      role_id: coordinatorRole.role_id,
      account_status: 'active',
    },
  });

  await prisma.universityUser.create({
    data: {
      user_id: coordUser.user_id,
      university_id: createdUniversities[0].university_id,
      role_title: 'Coordinator',
    },
  });

  coordinators.push({ user: coordUser });

  console.log('📋 Creating applications (30)...');
  // 7. Create Applications (one per student, mixed statuses)
  const applications = [];
  const statuses = ['approved', 'pending', 'rejected', 'approved', 'pending'];

  for (let i = 0; i < students.length; i++) {
    const application = await prisma.application.create({
      data: {
        university_id: students[i].student.university_id,
        submitted_by: students[i].user.user_id,
        status: statuses[i % statuses.length],
        submission_date: new Date(2024, 0, 1 + i),
        reviewed_by:
          statuses[i % statuses.length] !== 'pending'
            ? admins[0].user_id
            : null,
        reviewed_at:
          statuses[i % statuses.length] !== 'pending'
            ? new Date(2024, 0, 5 + i)
            : null,
        remarks:
          statuses[i % statuses.length] === 'rejected'
            ? 'GPA below minimum requirement'
            : null,
      },
    });

    await prisma.applicationStudent.create({
      data: {
        application_id: application.application_id,
        student_id: students[i].student.student_id,
        status: statuses[i % statuses.length],
      },
    });

    if (statuses[i % statuses.length] === 'approved') {
      applications.push(application);
    }
  }

  console.log('🤝 Creating internship assignments (~22)...');
  // 8. Create Internships and Assignments for approved applications (~22)
  const internships = [];
  for (let i = 0; i < applications.length; i++) {
    const studentIndex = students.findIndex(
      (s) => s.student.user_id === applications[i].submitted_by,
    );

    const internship = await prisma.internship.create({
      data: {
        student_id: students[studentIndex].student.student_id,
        application_id: applications[i].application_id,
        start_date: new Date(2026, 4, 1), // May 2026
        end_date: new Date(2026, 7, 31), // August 2026
        status: 'active',
      },
    });

    const assignment = await prisma.assignment.create({
      data: {
        internship_id: internship.internship_id,
        supervisor_id:
          supervisors[i % supervisors.length].supervisor.supervisor_id,
        assigned_by: admins[0].user_id,
        start_date: new Date(2026, 4, 1),
        end_date: new Date(2026, 7, 31),
        status: 'active',
      },
    });

    internships.push({ internship, assignment, studentIndex });
  }

  console.log('🎯 Creating milestones (8 per assignment)...');
  // 9. Create Milestones (8 per assignment)
  const milestones = [];
  const milestoneTemplates = [
    {
      title: 'Orientation & Setup',
      description: 'Initial orientation and environment setup',
    },
    {
      title: 'System Analysis Report',
      description: 'Complete system analysis',
    },
    { title: 'Database Design', description: 'Design database schema' },
    { title: 'Backend API Development', description: 'Develop backend APIs' },
    {
      title: 'Frontend Integration',
      description: 'Integrate frontend components',
    },
    {
      title: 'Testing & QA',
      description: 'Complete testing and quality assurance',
    },
    { title: 'Documentation', description: 'Write technical documentation' },
    {
      title: 'Final Presentation',
      description: 'Prepare and deliver final presentation',
    },
  ];

  for (const { internship, assignment, studentIndex } of internships) {
    for (let i = 0; i < milestoneTemplates.length; i++) {
      const milestone = await prisma.milestone.create({
        data: {
          internship_id: internship.internship_id,
          title: milestoneTemplates[i].title,
          description: milestoneTemplates[i].description,
          due_date: new Date(2026, 4 + Math.floor(i / 2), 15 + (i % 2) * 15),
          status:
            i < 5
              ? 'accepted'
              : i === 5
                ? 'pending_review'
                : 'pending_revision',
          created_by:
            supervisors[assignment.supervisor_id % supervisors.length].user
              .user_id,
        },
      });

      if (i < 7) {
        // Create submission for most milestones
        const submission = await prisma.submission.create({
          data: {
            milestone_id: milestone.milestone_id,
            student_id: students[studentIndex].student.student_id,
            content: `Milestone submission: ${milestoneTemplates[i].title}`,
            status: i < 5 ? 'reviewed' : 'submitted',
          },
        });

        // Create review for reviewed submissions
        if (i < 5) {
          await prisma.submissionReview.create({
            data: {
              submission_id: submission.submission_id,
              reviewer_id:
                supervisors[assignment.supervisor_id % supervisors.length].user
                  .user_id,
              feedback: 'Good work, approved',
              status: 'approved',
            },
          });
        }
      }
    }
  }

  console.log('📊 Creating attendance records...');
  // 10. Create Attendance Records
  for (const { internship, studentIndex } of internships) {
    await prisma.attendance.create({
      data: {
        internship_id: internship.internship_id,
        student_id: students[studentIndex].student.student_id,
        month: 5,
        year: 2026,
        percentage: 75 + Math.random() * 25, // 75-100%
        marked_by:
          supervisors[Math.floor(Math.random() * supervisors.length)].user
            .user_id,
      },
    });
  }

  console.log('📈 Creating monthly reports (3 per internship)...');
  // 11. Create Monthly Reports (3 per internship for May, June, July)
  for (let internIdx = 0; internIdx < internships.length; internIdx++) {
    const { internship, studentIndex } = internships[internIdx];

    for (let month = 5; month <= 7; month++) {
      await prisma.monthlyReport.create({
        data: {
          internship_id: internship.internship_id,
          student_id: students[studentIndex].student.student_id,
          month: month,
          year: 2026,
          summary: `Summary for month ${month}`,
          status: month === 5 ? 'approved' : 'submitted',
        },
      });
    }
  }

  console.log('⭐ Creating evaluations...');
  // 12. Create Evaluations for all internships
  const grades = ['A', 'A', 'B', 'B', 'C'];
  for (let i = 0; i < internships.length; i++) {
    const { internship, assignment, studentIndex } = internships[i];

    const generalPerformance = (5 + Math.random() * 5) * 5; // 25% max
    const personalSkills = (5 + Math.random() * 5) * 5; // 25% max
    const professionalSkills = (10 + Math.random() * 10) * 5; // 50% max
    const totalScore = Math.round(
      generalPerformance + personalSkills + professionalSkills,
    );

    await prisma.evaluation.create({
      data: {
        internship_id: internship.internship_id,
        student_id: students[studentIndex].student.student_id,
        supervisor_id: assignment.supervisor_id,

        // General Performance (25%)
        punctuality_score: 4 + Math.random() * 1,
        reliability_score: 4 + Math.random() * 1,
        independence_score: 3.5 + Math.random() * 1.5,
        communication_score: 4 + Math.random() * 1,
        professionalism_score: 4 + Math.random() * 1,
        general_performance_total: generalPerformance,

        // Personal Skills (25%)
        speed_of_work_score: 3.5 + Math.random() * 1.5,
        accuracy_score: 4 + Math.random() * 1,
        engagement_score: 3.5 + Math.random() * 1.5,
        need_for_work_score: 3 + Math.random() * 2,
        cooperation_score: 4 + Math.random() * 1,
        personal_skills_total: personalSkills,

        // Professional Skills (50%)
        technical_skills_score: 3.5 + Math.random() * 1.5,
        organizational_skills_score: 3.5 + Math.random() * 1.5,
        project_support_score: 3.5 + Math.random() * 1.5,
        responsibility_score: 4 + Math.random() * 1,
        team_quality_score: 4 + Math.random() * 1,
        professional_skills_total: professionalSkills,

        // Attendance
        attendance_percentage: 80 + Math.random() * 20,
        total_absent_days: Math.floor(Math.random() * 3),

        total_score: totalScore,
        grade: grades[i % grades.length],
        remarks: 'Good performance during internship',
        status: i < 12 ? 'published' : 'draft',
      },
    });
  }

  console.log('✅ Seeding completed successfully!');
  console.log(`
📊 Summary:
  - Admins: 2
  - Students: 30
  - Supervisors: 15
  - University Coordinators: 6
  - Universities: 6
  - Total Users: 59
  - Applications: 30 (22 approved)
  - Internships: 22
  - Assignments: 22
  - Milestones: 176 (8 per assignment)
  - Monthly Reports: 66 (3 per internship)
  - Evaluations: 22

🔐 Test Credentials:
  - Admin: abebe.kebede@hu.edu.et / admin123
  - Student: abebe.alemu@hu.edu.et / student123
  - Supervisor: dr.kidus.kebede@hu.edu.et / super123
  - University: coordinator@hu.edu.et / uni123
  - Any other student email created by the seed uses / student123
  - Any other supervisor email created by the seed uses / super123
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
