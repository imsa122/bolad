/**
 * ============================================================
 * SET RESEND_API_KEY IN VERCEL ENVIRONMENT VARIABLES
 * ============================================================
 *
 * ⚠️  BEFORE RUNNING: Replace 're_xxxxxxxxx' below with your
 *     real Resend API key from https://resend.com/api-keys
 *
 * Then run:
 *   node set-resend-key.mjs
 * ============================================================
 */

// 🔑 REPLACE THIS WITH YOUR REAL RESEND API KEY:
const RESEND_API_KEY = 're_xxxxxxxxx';

// ── Vercel config ──
// Get your token from: https://vercel.com/account/tokens
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'YOUR_VERCEL_TOKEN_HERE';
const PROJECT_ID   = process.env.VERCEL_PROJECT_ID || 'YOUR_PROJECT_ID_HERE';

if (RESEND_API_KEY === 're_xxxxxxxxx') {
  console.error('❌ Please replace re_xxxxxxxxx with your real Resend API key!');
  console.error('   Get your key at: https://resend.com/api-keys');
  process.exit(1);
}

async function setEnvVar(key, value, target) {
  const res = await fetch(
    `https://api.vercel.com/v10/projects/${PROJECT_ID}/env`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key, value, type: 'encrypted', target }),
    }
  );
  const data = await res.json();
  if (res.ok) {
    console.log(`  ✅ ${key} set for [${target.join(', ')}]`);
  } else if (data.error?.code === 'ENV_ALREADY_EXISTS') {
    // Update existing
    const listRes = await fetch(
      `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?limit=100`,
      { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
    );
    const listData = await listRes.json();
    const existing = listData.envs?.find(e => e.key === key);
    if (existing) {
      const patchRes = await fetch(
        `https://api.vercel.com/v10/projects/${PROJECT_ID}/env/${existing.id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${VERCEL_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ value, type: 'encrypted', target }),
        }
      );
      if (patchRes.ok) {
        console.log(`  ✅ ${key} updated for [${target.join(', ')}]`);
      } else {
        console.error(`  ❌ Failed to update ${key}:`, await patchRes.json());
      }
    }
  } else {
    console.error(`  ❌ Failed to set ${key}:`, data.error?.message || JSON.stringify(data));
  }
}

async function run() {
  console.log('🔧 Setting Resend environment variables in Vercel...\n');

  const targets = ['production', 'preview', 'development'];

  // Set RESEND_API_KEY
  await setEnvVar('RESEND_API_KEY', RESEND_API_KEY, targets);

  // Set RESEND_FROM — Resend free tier requires onboarding@resend.dev
  // If you have a verified domain, change this to: noreply@yourdomain.com
  await setEnvVar('RESEND_FROM', 'onboarding@resend.dev', targets);

  console.log('\n✅ Done! Now trigger a new Vercel deployment:');
  console.log('   node git-commit.mjs');
  console.log('\n📌 Note: With Resend free tier, emails can only be sent to');
  console.log('   your verified email address (the one you signed up with).');
  console.log('   To send to any address, verify a domain at resend.com/domains');
}

run().catch(e => { console.error(e); process.exit(1); });
