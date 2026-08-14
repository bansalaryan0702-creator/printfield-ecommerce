const { initializeApp } = require('firebase/app');
const { getFirestore, doc, deleteDoc } = require('firebase/firestore');
const fs = require('fs');

async function run() {
  let firebaseConfig = {};
  if (fs.existsSync('./firebase-applet-config.json')) {
    firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  } else {
    console.log("No Firebase config found. Skipping Firestore purge.");
    return;
  }
  
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  const deletedFile = fs.readFileSync('./data/deleted_products.json', 'utf8');
  const deletedIds = JSON.parse(deletedFile);
  console.log(`Found ${deletedIds.length} deleted product IDs for Firestore purge.`);
  
  for (const rawId of deletedIds) {
    if (!rawId) continue;
    try {
      await deleteDoc(doc(db, 'products', rawId));
      const decodedId = decodeURIComponent(rawId);
      if (decodedId !== rawId) {
        await deleteDoc(doc(db, 'products', decodedId));
      }
    } catch(e) {
      // ignore
    }
  }
  console.log('Finished Firestore purge.');
}
run().catch(console.log);
