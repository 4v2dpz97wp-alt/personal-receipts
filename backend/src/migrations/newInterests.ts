import db from '../database';

export function migrateNewInterests(): void {
  const columns = db.prepare("PRAGMA table_info(contacts)").all() as any[];
  const existing = columns.map(c => c.name);

  const newInterests = [
    'interest_race_play',
    'interest_piggy',
    'interest_role_play',
    'interest_age_play',
    'interest_cum_dump',
    'interest_younger',
    'interest_older',
    'interest_hairy',
    'interest_smooth',
    'interest_muscular',
    'interest_jocks',
  ];

  for (const col of newInterests) {
    if (!existing.includes(col)) {
      db.exec(`ALTER TABLE contacts ADD COLUMN ${col} INTEGER NOT NULL DEFAULT 0`);
      console.log(`✅ Added column: ${col}`);
    }
  }
}