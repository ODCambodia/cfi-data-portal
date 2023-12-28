import db from './db.js';

function _getStatement(type, shouldGetPending) {
  let typeOption = '';
  let approvalOption = '';

  if (typeof shouldGetPending === 'boolean') {
    approvalOption = shouldGetPending
      ? 'AND approval_time IS NOT NULL'
      : 'AND approval_time IS NULL'
  }

  if (type === 'cfi' || type === 'cfr') {
    typeOption = 'AND type = ?';
  }

  const options = typeOption + ' ' + approvalOption;
  return options.replace('AND', '');
}

function insert(user) {
  const insert_user = db.prepare(`
    INSERT INTO users (user_id, username, firstname, lastname , type)
    VALUES ($user_id, $username, $firstname, $lastname, $type)
    RETURNING user_id, username, firstname, lastname, type, created_at;
  `);

  return insert_user.run(user);
}

function getPendingRequest(type) {
  return db.prepare(`SELECT * FROM users WHERE approval_time IS NOT NULL AND type = ?;`).all(type);
}

function getApprovedUser(type) {
  return db.prepare(`SELECT * FROM users WHERE approval_time IS NOT NULL AND type = ?;`).all(type);
}

async function get(user_id, type, shouldGetPending) {
  const params = [user_id];
  const whereOptions = _getStatement(type, shouldGetPending);

  if (type) {
    params.push(type);
  }

  // console.log({ whereOptions });
  // console.log(params);
  // console.log(`SELECT * FROM users WHERE ${whereOptions};`);
  // console.log(await db.prepare(`SELECT * FROM users WHERE user_id = ? AND ${whereOptions};`).get(...params))

  return db.prepare(`SELECT * FROM users WHERE user_id = ? AND ${whereOptions};`).get(...params);
}

async function getAll(type, shouldGetPending) {
  const whereOptions = _getStatement(type, shouldGetPending);
  console.log({ whereOptions });
  console.log({ type });
  console.log(`SELECT * FROM users WHERE ${whereOptions};`);
  console.log(await db.prepare(`SELECT * FROM users WHERE ${whereOptions};`).all(type))

  return db.prepare(`SELECT * FROM users WHERE ${whereOptions};`).all(type);
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
  getApprovedUser,
  getPendingRequest,
};

export default UserDAO;
