import db from './db.js';

// DB_FILE=db.sqlite node database/test.js run this to see if db is working
const select_table = db.prepare(`UPDATE users
SET approval_time=DATETIME('now')
WHERE user_id = 1036562569
RETURNING user_id, username, approval_time;`);
const result = select_table.run();
console.log(result);
