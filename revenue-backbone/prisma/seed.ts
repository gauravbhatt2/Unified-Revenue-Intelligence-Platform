import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const color = {
    reset: '\x1b[0m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    magenta: '\x1b[35m',
  };

  console.log(`${color.cyan}Seeding clean demo dataset...${color.reset}`);

  const seedResult = await prisma.$transaction(async (tx) => {
    // 1) Tenants
    const acmeTenant = await tx.tenant.create({
      data: {
        name: 'Acme Corporation',
        slug: 'acme-corporation',
      },
    });

    const globexTenant = await tx.tenant.create({
      data: {
        name: 'Globex Inc',
        slug: 'globex-inc',
      },
    });

    // 2) Accounts
    const acmeAccount = await tx.account.create({
      data: {
        tenantId: acmeTenant.id,
        name: 'Acme Corp',
        domain: 'acme.com',
      },
    });

    const globexAccount = await tx.account.create({
      data: {
        tenantId: globexTenant.id,
        name: 'Globex Inc',
        domain: 'globex.com',
      },
    });

    // 3) Contacts
    const alice = await tx.contact.create({
      data: {
        tenantId: acmeTenant.id,
        accountId: acmeAccount.id,
        email: 'alice@acme.com',
        firstName: 'Alice',
        lastName: 'Acme',
        isOptedOut: true, // Optional strong demo addition for compliance
        optOutReason: 'demo opt-out',
        optedOutAt: new Date('2026-04-01T00:00:00.000Z'),
      },
    });

    const bob = await tx.contact.create({
      data: {
        tenantId: acmeTenant.id,
        accountId: acmeAccount.id,
        email: 'bob@acme.com',
        firstName: 'Bob',
        lastName: 'Acme',
        isOptedOut: false,
      },
    });

    const charlie = await tx.contact.create({
      data: {
        tenantId: globexTenant.id,
        accountId: globexAccount.id,
        email: 'charlie@globex.com',
        firstName: 'Charlie',
        lastName: 'Globex',
        isOptedOut: false,
      },
    });

    // 4) Interactions (Acme only)
    const interaction1 = await tx.interaction.create({
      data: {
        tenantId: acmeTenant.id,
        accountId: acmeAccount.id,
        type: 'email',
        summary: 'Pricing discussion',
        timestamp: new Date('2026-04-01T10:00:00.000Z'),
      },
    });

    const interaction2 = await tx.interaction.create({
      data: {
        tenantId: acmeTenant.id,
        accountId: acmeAccount.id,
        type: 'call',
        summary: 'Follow-up call',
        timestamp: new Date('2026-04-02T14:30:00.000Z'),
      },
    });

    // 5) InteractionParticipants (revenue graph edges)
    const edge1 = await tx.interactionParticipant.create({
      data: {
        tenantId: acmeTenant.id,
        interactionId: interaction1.id,
        contactId: alice.id,
        email: alice.email,
        role: 'sender',
      },
    });

    const edge2 = await tx.interactionParticipant.create({
      data: {
        tenantId: acmeTenant.id,
        interactionId: interaction2.id,
        contactId: bob.id,
        email: bob.email,
        role: 'attendee',
      },
    });

    await tx.complianceSetting.createMany({
      data: [
        { tenantId: acmeTenant.id, exportMode: 'EXCLUDE_INTERACTION' },
        { tenantId: globexTenant.id, exportMode: 'EXCLUDE_INTERACTION' },
      ],
      skipDuplicates: true,
    });

    return {
      tenants: { acmeTenant, globexTenant },
      accounts: { acmeAccount, globexAccount },
      contacts: { alice, bob, charlie },
      interactions: { interaction1, interaction2 },
      edges: { edge1, edge2 },
    };
  });

  console.log(`${color.green}\nSeed complete!${color.reset}`);
  console.log(`${color.magenta}\n=== Seeded Entity Summary ===${color.reset}`);
  console.log(`${color.yellow}Tenants${color.reset}`);
  console.log(`- Acme Corporation: ${seedResult.tenants.acmeTenant.id}`);
  console.log(`- Globex Inc:       ${seedResult.tenants.globexTenant.id}`);
  console.log(`${color.yellow}\nAccounts${color.reset}`);
  console.log(`- Acme Corp (acme.com):   ${seedResult.accounts.acmeAccount.id}`);
  console.log(`- Globex Inc (globex.com): ${seedResult.accounts.globexAccount.id}`);
  console.log(`${color.yellow}\nContacts${color.reset}`);
  console.log(`- alice@acme.com:     ${seedResult.contacts.alice.id} (OPTED OUT = true)`);
  console.log(`- bob@acme.com:       ${seedResult.contacts.bob.id} (OPTED OUT = false)`);
  console.log(`- charlie@globex.com: ${seedResult.contacts.charlie.id} (OPTED OUT = false)`);
  console.log(`${color.yellow}\nInteractions${color.reset}`);
  console.log(
    `- ${seedResult.interactions.interaction1.id}: email | "Pricing discussion" | tenant=Acme`,
  );
  console.log(
    `- ${seedResult.interactions.interaction2.id}: call  | "Follow-up call"    | tenant=Acme`,
  );
  console.log(`${color.yellow}\nRevenue Graph Edges (interaction_participants)${color.reset}`);
  console.log(
    `- Interaction ${seedResult.edges.edge1.interactionId} -> Contact ${seedResult.edges.edge1.contactId} (alice@acme.com)`,
  );
  console.log(
    `- Interaction ${seedResult.edges.edge2.interactionId} -> Contact ${seedResult.edges.edge2.contactId} (bob@acme.com)`,
  );
  console.log(`${color.cyan}\nCompliance demo expectation${color.reset}`);
  console.log('- Export for Acme account should include Bob interaction.');
  console.log('- Export for Acme account should exclude Alice interaction (opted out).');
  console.log('- Expected result: 1 exported interaction, 1 excluded interaction.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
