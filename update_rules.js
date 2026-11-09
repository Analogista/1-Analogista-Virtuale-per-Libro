const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

rules = rules.replace(
  "allow update: if isOwner(userId) && isValidUser(request.resource.data) && \\n                    request.resource.data.role == resource.data.role; // Prevent self-promoting",
  "allow update: if (isOwner(userId) && isValidUser(request.resource.data) && request.resource.data.role == resource.data.role) || isAdmin();"
);

rules = rules.replace(
  "allow create: if isOwner(userId) && isValidUser(request.resource.data) && request.resource.data.role == 'user';",
  "allow create: if isOwner(userId) && isValidUser(request.resource.data) && (request.resource.data.role == 'user' || isAdmin());"
);

fs.writeFileSync('firestore.rules', rules);
