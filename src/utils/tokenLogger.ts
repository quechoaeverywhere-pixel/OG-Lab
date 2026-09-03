import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const logTokenUsage = async (action: string, characterCount: number) => {
  const user = auth.currentUser;
  if (!user) return; // Only log if user is signed in

  // Approximate token count (1 token ≈ 4 chars)
  const estimatedTokens = Math.ceil(characterCount / 4);

  try {
    await addDoc(collection(db, 'systemLogs'), {
      userId: user.uid,
      action: action,
      tokenCount: estimatedTokens,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging token usage:', error);
  }
};
