import { auth } from './firebase';
import { signOut } from 'firebase/auth';

let timeoutId: NodeJS.Timeout;
const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export const resetSessionTimeout = () => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  
  timeoutId = setTimeout(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, TIMEOUT_DURATION);
};

export const clearSessionTimeout = () => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
};

// Event listeners for user activity
if (typeof window !== 'undefined') {
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetSessionTimeout);
  });
} 