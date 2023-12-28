import UserDAO from '../database/user.js';

async function handleGetAllUsers(req, res) {
  let shouldGetApproved = false;

  // man this is terrible code
  if (req.query.approved === 'true' || req.query.approved === '1') {
    shouldGetApproved = true;
  } else if (req.query.approved === undefined || req.query.approved === null || req.query.approved === '') {
    shouldGetApproved = null;
  }

  const server = req.params.server;

  if (!server) {
    return res.status(400).json({ error: 'Missing server' });
  }

  try {
    const users = await UserDAO.getAll(server, shouldGetApproved);
    return res.status(200).json(users);
  } catch (e) {
    console.error(e);
  }

  return res.status(500).json({ error: 'Something went wrong when trying to get users!' });
}

async function handleDeleteUser(req, res) {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ error: 'Missing user id' });
  }

  try {
    const users = await UserDAO.remove(userId);
    return res.status(200).json(users);
  } catch (e) {
    console.error(e);
  }

  return res.status(500).json({ error: 'Something went wrong when trying to get users!' });
}

async function handleApproveUser(req, res) {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ error: 'Missing user id' });
  }

  try {
    const user = await UserDAO.approve(userId);
    return res.status(200).json({ message: 'approved', user });
  } catch (e) {
    console.error(e);
  }

  return res.status(500).json({ error: 'Something went wrong!' });
}

const User = {
  handleGetAllUsers,
  handleApproveUser,
  handleDeleteUser,
};

export default User;