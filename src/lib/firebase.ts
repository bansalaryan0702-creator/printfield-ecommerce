import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
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
    
    // 35-second safety timeout so popup never hangs indefinitely
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Google sign-in timed out. Please try again or use direct redirect."));
      }, 35000);
    });

    const result = await Promise.race([
      signInWithPopup(auth, provider),
      timeoutPromise
    ]);

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
      throw new Error("Google sign-in popup was closed before completing. Please try again.");
    }
    if (error.code === 'auth/popup-blocked') {
      throw new Error("Google sign-in popup was blocked by your browser. Please allow popups or use direct redirect.");
    }
    if (error.code === 'auth/unauthorized-domain') {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'your current domain';
      throw new Error(`Domain not authorized: "${host}". Please add "${host}" to Firebase Console → Authentication → Settings → Authorized domains.`);
    }
    throw error;
  }
};

export const signInWithGoogleRedirect = async (options?: { withGmailScope?: boolean }) => {
  const provider = options?.withGmailScope ? gmailGoogleProvider : standardGoogleProvider;
  await signInWithRedirect(auth, provider);
};

export const checkGoogleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (!result || !result.user) return null;
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
    console.error("Error getting redirect result:", error);
    throw error;
  }
};

export const getGoogleAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};
