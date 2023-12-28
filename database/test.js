import db from './db.js';

// DB_FILE=db.sqlite node database/test.js run this to see if db is working
const select_table = db.prepare(`SELECT * FROM users;`);
const result = select_table.all();
console.log(result);
