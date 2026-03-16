import { createClient } from "@libsql/client";

const totalEmails = Number(process.argv[2] ?? 10000);
const accountCount = Number(process.argv[3] ?? 5);
const dbUrl = process.env.BENCH_DB_URL ?? process.env.TURSO_DATABASE_URL;

if (!dbUrl) {
  console.error("Missing BENCH_DB_URL or TURSO_DATABASE_URL");
  process.exit(1);
}

const client = createClient({
  url: dbUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log(`Seeding ${totalEmails} emails across ${accountCount} accounts into ${dbUrl}`);

  const accountValues = Array.from({ length: accountCount }, (_, index) => {
    const id = `seed-account-${index + 1}`;
    const email = `seed${index + 1}@example.com`;
    return `('${id}', 'gmail', '${email}', 'Seed Account ${index + 1}', 'seed-creds', unixepoch())`;
  }).join(",\n");

  await client.execute("delete from attachments where email_id like 'seed-email-%'");
  await client.execute("delete from emails where id like 'seed-email-%'");
  await client.execute("delete from accounts where id like 'seed-account-%'");
  await client.execute(
    `insert into accounts (id, provider, email, display_name, credentials, created_at) values ${accountValues}`
  );

  const sql = `
WITH RECURSIVE seq(x) AS (
  SELECT 1
  UNION ALL
  SELECT x + 1 FROM seq WHERE x < ${totalEmails}
)
INSERT INTO emails (
  id,
  account_id,
  message_id,
  subject,
  sender,
  recipients,
  snippet,
  body_text,
  body_html,
  is_read,
  is_starred,
  received_at,
  folder,
  created_at
)
SELECT
  'seed-email-' || x,
  'seed-account-' || (((x - 1) % ${accountCount}) + 1),
  '<seed-' || x || '@example.com>',
  CASE
    WHEN x % 19 = 0 THEN 'invoice payment reminder #' || x
    WHEN x % 11 = 0 THEN 'production deploy failure #' || x
    WHEN x % 7 = 0 THEN 'interview schedule #' || x
    ELSE 'weekly project update #' || x
  END,
  'sender' || (((x - 1) % 40) + 1) || '@example.com',
  '["lucius@example.com"]',
  CASE
    WHEN x % 19 = 0 THEN 'invoice overdue payment reminder for account #' || x
    WHEN x % 11 = 0 THEN 'deploy failed on production service #' || x
    WHEN x % 7 = 0 THEN 'schedule confirmation for interview #' || x
    ELSE 'weekly summary and project status #' || x
  END,
  'Benchmark body text #' || x,
  '<p>Benchmark body html #' || x || '</p>',
  CASE WHEN x % 4 = 0 THEN 1 ELSE 0 END,
  CASE WHEN x % 10 = 0 THEN 1 ELSE 0 END,
  unixepoch() - (x * 90),
  'INBOX',
  unixepoch()
FROM seq;
`;

  await client.execute(sql);

  const count = await client.execute(
    "select count(*) as total from emails where id like 'seed-email-%'"
  );
  console.log(`Seeded rows: ${count.rows[0]?.total ?? 0}`);
  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
