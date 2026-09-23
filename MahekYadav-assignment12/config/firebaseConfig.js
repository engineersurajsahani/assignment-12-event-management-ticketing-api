const admin=require("firebase-admin");
const fs=require("fs"),path=require("path");
function init(){
  if(admin.apps.length)return admin.app();
  const {FIREBASE_PROJECT_ID,FIREBASE_CLIENT_EMAIL,FIREBASE_PRIVATE_KEY}=process.env;
  if(FIREBASE_PROJECT_ID&&FIREBASE_CLIENT_EMAIL&&FIREBASE_PRIVATE_KEY)
    return admin.initializeApp({credential:admin.credential.cert({projectId:FIREBASE_PROJECT_ID,clientEmail:FIREBASE_CLIENT_EMAIL,privateKey:FIREBASE_PRIVATE_KEY.replace(/\\n/g,"\n")})});
  const key=path.join(process.cwd(),"serviceAccountKey.json");
  if(fs.existsSync(key)) return admin.initializeApp({credential:admin.credential.cert(require(key))});
  throw new Error("Firebase credentials missing. Configure FIREBASE_* variables or serviceAccountKey.json.");
}
init();
const db=admin.firestore();
module.exports={admin,db};
