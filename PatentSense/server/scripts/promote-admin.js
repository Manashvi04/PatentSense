const path = require('path');

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(path.join(__dirname, '..', '..', '.env'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: npm run admin:promote -- user@example.com');
  process.exit(2);
}

const { dbInitializedPromise, get, run, db } = require('../db/database');

async function promoteAdmin() {
  try {
    await dbInitializedPromise;
    const user = await get('SELECT id, email, role FROM users WHERE email = ?', [email]);
    if (!user) throw new Error(`No account found for ${email}. Register the account first.`);
    await run("UPDATE users SET role = 'admin' WHERE id = ?", [user.id]);
    console.log(`${user.email} is now an administrator. Restart their session to refresh their permissions.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

promoteAdmin();
