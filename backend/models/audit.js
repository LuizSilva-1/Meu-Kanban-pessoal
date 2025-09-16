const fs = require('fs');
const path = require('path');
const auditFile = path.join(__dirname, '../data/audit.json');

function getAudits() {
  if (!fs.existsSync(auditFile)) return [];
  return JSON.parse(fs.readFileSync(auditFile, 'utf8'));
}

function addAudit(audit) {
  const audits = getAudits();
  audits.push(audit);
  fs.writeFileSync(auditFile, JSON.stringify(audits, null, 2));
}

module.exports = {
  getAudits,
  addAudit,
};