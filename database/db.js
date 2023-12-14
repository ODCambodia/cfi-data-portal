import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Database from 'better-sqlite3';

const db = new Database(process.env.DB_FILE);

const schemaPath = join('database', 'schema.sql');
const schema = readFileSync(schemaPath, 'utf-8');
db.exec(schema);

export default db;