import { getDb, closeDb } from '../db';

/** Runs the same migrations the server runs at boot, without starting the server. */
getDb()
  .then(() => console.log('✅ Migrations are up to date'))
  .catch((error: unknown) => {
    console.error('🔴 Migration failed:', error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
