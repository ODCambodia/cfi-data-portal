import UserDAO from '../database/user.js';

async function handleGetAllUsers(req, res) {
  const shouldGetApproved = req.query.approved;

  try {
    const users = UserDAO.getAll(shouldGetApproved);
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
    const users = UserDAO.remove(userId);
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
    const user = UserDAO.approve(userId);
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