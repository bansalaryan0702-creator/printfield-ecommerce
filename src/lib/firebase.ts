import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const customConfig = {
  ...firebaseConfig
};
const app = initializeApp(customConfig);

export const auth = getAuth(app);

// Standard Google provider for user login (profile & email only)
export const standardGoogleProvider = new GoogleAuthProvider();
standardGoogleProvider.setCustomParameters({ prompt: 'select_account' });

// Special Google provider for admin email sending (with gmail.send scope)
export const gmailGoogleProvider = new GoogleAuthProvider();
gmailGoogleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
gmailGoogleProvider.setCustomParameters({ prompt: 'select_account' });

// Default exported provider is the standard customer login provider
export const googleProvider = standardGoogleProvider;

let cachedAccessToken: string | null = null;

export const signInWithGoogle = async (options?: { withGmailScope?: boolean }) => {
  try {
    const provider = options?.withGmailScope ? gmailGoogleProvider : standardGoogleProvider;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    const idToken = await result.user.getIdToken();
    return Object.assign(result.user, {
      idToken,
      googleAccessToken: credential?.accessToken || null
    });
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      throw new Error("Google sign-in was cancelled. Please try again.");
    }
    if (error.code === 'auth/popup-blocked') {
      throw new Error("Google sign-in popup was blocked by your browser. Please allow popups for this site.");
    }
    if (error.code === 'auth/unauthorized-domain') {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'your current domain';
      throw new Error(`Domain not authorized: "${host}". Please add "${host}" to Firebase Console → Authentication → Settings → Authorized domains.`);
    }
    throw error;
  }
};

export const getGoogleAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};
