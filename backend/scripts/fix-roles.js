// One-off script to normalize role names in the database.
// Usage: from repo root run `cd backend && node scripts/fix-roles.js`

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const WRONG = 'university_coordinator';
  const CORRECT = 'University Coordinator';

  const wrongRole = await prisma.role.findUnique({
    where: { role_name: WRONG },
  });
  const correctRole = await prisma.role.findUnique({
    where: { role_name: CORRECT },
  });

  if (!wrongRole) {
    console.log(`No role with name "${WRONG}" found. Nothing to do.`);
    return;
  }

  if (correctRole) {
    // Move users pointing to wrongRole to correctRole, then delete wrongRole
    console.log(
      `Found both wrong role (id=${wrongRole.role_id}) and correct role (id=${correctRole.role_id}).`,
    );
    const updated = await prisma.user.updateMany({
      where: { role_id: wrongRole.role_id },
      data: { role_id: correctRole.role_id },
    });
    console.log(`Reassigned ${updated.count} users to role '${CORRECT}'.`);

    await prisma.role.delete({ where: { role_id: wrongRole.role_id } });
    console.log(`Deleted duplicate role '${WRONG}'.`);
  } else {
    // Rename the wrong role to the correct canonical name
    await prisma.role.update({
      where: { role_id: wrongRole.role_id },
      data: { role_name: CORRECT },
    });
    console.log(
      `Renamed role '${WRONG}' (id=${wrongRole.role_id}) to '${CORRECT}'.`,
    );
  }
}

main()
  .catch((e) => {
    console.error('Error running fix-roles script:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
