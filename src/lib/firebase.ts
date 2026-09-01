import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const customConfig = {
  ...firebaseConfig
};
const app = initializeApp(customConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');

let cachedAccessToken: string | null = null;

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error("Google sign in was cancelled or the popup was blocked. Please try again or check your popup blocker settings.");
    }
    throw error;
  }
};

export const getGoogleAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};
