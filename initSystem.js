// const admin = require("firebase-admin");
// const { initializeSystem } = require("./functions/src/database-schema-complete"); // adjust the path

// // Initialize Firebase Admin
// admin.initializeApp({
//   credential: admin.credential.applicationDefault(), 
// });

// const db = admin.firestore();

// // Run the initialization
// initializeSystem(db)
//   .then(() => {
//     console.log("System initialization complete!");
//     process.exit(0);
//   })
//   .catch((err) => {
//     console.error("Initialization failed:", err);
//     process.exit(1);
//   });
