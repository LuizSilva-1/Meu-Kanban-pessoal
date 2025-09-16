const fs = require('fs');
const path = require('path');
const usersFile = path.join(__dirname, '../data/users.json');

function getUsers() {
  if (!fs.existsSync(usersFile)) return [];
  return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
}

function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

function findUserByUsername(username) {
  return getUsers().find(u => u.username === username);
}

function addUser(user) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
}

module.exports = {
  getUsers,
  saveUsers,
  findUserByUsername,
  addUser,
};