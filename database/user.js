import db from './db.js';

function insert(user) {
  const insert_user = db.prepare(`
    INSERT INTO users (user_id, username)
    VALUES ($user_id, $username)
    RETURNING user_id, username created_at;
  `);

  return insert_user.get(user);
}

function getAll(shouldGetApproved) {
  if (shouldGetApproved === undefined) {
    return db.prepare(`SELECT * FROM users;`).get();
  }

  return shouldGetApproved
    ? db.prepare(`SELECT * FROM users WHERE approval_time IS NOT NULL;`).get()
    : db.prepare(`SELECT * FROM users WHERE approval_time IS NULL;`).get();
}

function get(user_id) {
  const get_user = db.prepare(`
    SELECT * FROM users WHERE user_id = ?;
  `);

  return get_user.get(user_id);
}

function approve(user_id) {
  const update_user = db.prepare(/*sql*/ `
  UPDATE users
  SET approval_time=DATETIME('now')
  WHERE user_id = ?
  RETURNING user_id, username, approval_time;
`);

  return update_user.get(user_id);
}

function remove(user_id) {
  const update_user = db.prepare(`DELETE FROM users WHERE user_id = ?`);

  return update_user.run(user_id);
}

const UserDAO = {
  insert,
  remove,
  get,
  getAll,
  approve,
};

export default UserDAO;
