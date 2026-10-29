import type { PrismaClient } from '../../../src/generated/prisma/client';

/**
 * The first Super admin (hand-off doc 02, ADR-032), from SEED_SUPER_ADMIN_EMAIL and
 * SEED_SUPER_ADMIN_NAME. Created INVITED: their first Google sign-in activates it.
 * Idempotent: an existing account with that email is left as it is. Skipped when the
 * variables are not set.
 */
export async function seedSuperAdmin(
  prisma: PrismaClient,
  env: Record<string, string | undefined> = process.env,
): Promise<'created' | 'exists' | 'skipped'> {
  const email = env['SEED_SUPER_ADMIN_EMAIL']?.trim().toLowerCase();
  const name = env['SEED_SUPER_ADMIN_NAME']?.trim();
  if (!email || !name) {
    return 'skipped';
  }

  const domain = env['STAFF_GOOGLE_WORKSPACE_DOMAIN']?.toLowerCase();
  if (domain && email.split('@')[1] !== domain) {
    throw new Error(`SEED_SUPER_ADMIN_EMAIL must be on ${domain} (STAFF_GOOGLE_WORKSPACE_DOMAIN)`);
  }

  if (await prisma.staffAccount.findUnique({ where: { email } })) {
    return 'exists';
  }
  await prisma.staffAccount.create({ data: { email, name, role: 'SUPER_ADMIN', status: 'INVITED' } });
  return 'created';
}
