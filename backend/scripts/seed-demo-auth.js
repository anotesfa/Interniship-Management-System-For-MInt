/**
 * Seeds the four demo accounts shown on the login page.
 * Run: node scripts/seed-demo-auth.js
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

function normalizePasswordPart(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function buildStudentPassword(fatherName, registrationNumber) {
  return `${normalizePasswordPart(fatherName)}${normalizePasswordPart(registrationNumber)}`;
}

const DEMO_USERS = [
  {
    email: 'admin@mint.gov',
    password: 'admin123',
    full_name: 'System Admin',
    role: 'Admin',
  },
  {
    email: 'coordinator.aau@aau.edu.et',
    password: 'uni123',
    full_name: 'AAU Coordinator',
    role: 'University Coordinator',
  },
  {
    email: 'kidus.kebede@mint.gov',
    password: 'super123',
    full_name: 'Kidus Kebede',
    role: 'Supervisor',
  },
  {
    email: 'abebe.alemu@aau.edu.et',
    password: 'student123',
    full_name: 'Abebe Alemu',
    role: 'Student',
  },
];

const DOCUMENT_TYPES = [
  'transcript',
  'request_letter',
  'recommendation_letter',
];

async function ensureRole(roleName) {
  return prisma.role.upsert({
    where: { role_name: roleName },
    update: {},
    create: { role_name: roleName },
  });
}

async function main() {
  console.log('Seeding demo login accounts...');

  const usersByEmail = {};

  for (const demo of DEMO_USERS) {
    const role = await ensureRole(demo.role);
    const password_hash = await bcrypt.hash(demo.password, 12);

    const user = await prisma.user.upsert({
      where: { email: demo.email },
      update: {
        password_hash,
        account_status: 'active',
        role_id: role.role_id,
      },
      create: {
        email: demo.email,
        full_name: demo.full_name,
        password_hash,
        role_id: role.role_id,
        account_status: 'active',
      },
    });

    usersByEmail[demo.email] = user;
    console.log(`  ✓ ${demo.email}`);
  }

  console.log('Seeding university and role profiles...');

  let university = await prisma.university.findFirst({
    where: { name: 'Addis Ababa University' },
  });

  if (!university) {
    university = await prisma.university.create({
      data: {
        name: 'Addis Ababa University',
        contact_email: 'info@aau.edu.et',
        address: 'Addis Ababa, Ethiopia',
        created_by: usersByEmail['admin@mint.gov'].user_id,
      },
    });
  }

  const coordinator = usersByEmail['coordinator.aau@aau.edu.et'];
  await prisma.universityUser.upsert({
    where: {
      user_id_university_id: {
        user_id: coordinator.user_id,
        university_id: university.university_id,
      },
    },
    update: {},
    create: {
      user_id: coordinator.user_id,
      university_id: university.university_id,
      role_title: 'Coordinator',
    },
  });
  console.log('  ✓ University coordinator linked to AAU');

  const supervisor = usersByEmail['kidus.kebede@mint.gov'];
  const existingSupervisor = await prisma.supervisor.findFirst({
    where: { user_id: supervisor.user_id },
  });
  if (!existingSupervisor) {
    await prisma.supervisor.create({
      data: {
        user_id: supervisor.user_id,
        department: 'Software Engineering',
        position: 'Senior Engineer',
        max_students: 10,
      },
    });
  }
  console.log('  ✓ Supervisor profile');

  const studentUser = usersByEmail['abebe.alemu@aau.edu.et'];
  const existingStudent = await prisma.student.findFirst({
    where: { email: studentUser.email },
  });
  if (!existingStudent) {
    await prisma.student.create({
      data: {
        user_id: studentUser.user_id,
        university_id: university.university_id,
        full_name: 'Abebe Alemu',
        registration_number: 'UGR/2026/001',
        email: studentUser.email,
        department: 'Software Engineering',
        gpa: 3.5,
        status: 'active',
      },
    });

    await prisma.user.update({
      where: { user_id: studentUser.user_id },
      data: {
        password_hash: await bcrypt.hash(
          buildStudentPassword('Alemu', 'UGR/2026/001'),
          12,
        ),
      },
    });
  }
  console.log('  ✓ Student profile');

  for (const typeName of DOCUMENT_TYPES) {
    await prisma.documentType.upsert({
      where: { type_name: typeName },
      update: {},
      create: { type_name: typeName },
    });
  }
  console.log('  ✓ Document types');

  console.log('Done. Demo accounts are ready for login.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
