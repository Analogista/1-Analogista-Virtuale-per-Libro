const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const feedbackRule = `
    // Feedback
    match /feedback/{feedbackId} {
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow read: if isAdmin();
    }
`;

rules = rules.replace(
  "// Users",
  feedbackRule + "\n    // Users"
);

fs.writeFileSync('firestore.rules', rules);
