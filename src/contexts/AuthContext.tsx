import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider, db } from '../lib/firebase';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  UserRole,
  UserProfile,
  ADMIN_EMAILS,
  AUTHOR_ACTIVATION_PASSCODES
} from '../types/permissions';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  activateAuthorRole: (passcode: string) => Promise<{ success: boolean; message: string }>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; message: string }>;
  setUserRoleManually: (newRole: UserRole) => Promise<void>;
  isAdmin: boolean;
  isAuthor: boolean;
  isViewer: boolean;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  role: 'guest',
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
  activateAuthorRole: async () => ({ success: false, message: '' }),
  updateUserProfile: async () => ({ success: false, message: '' }),
  setUserRoleManually: async () => {},
  isAdmin: false,
  isAuthor: false,
  isViewer: false,
  isGuest: true
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('guest');
  const [loading, setLoading] = useState(true);

  // Sync user profile from Firestore or initialize with default role
  const syncUserProfile = async (currentUser: User) => {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userDocRef);

      const userEmail = currentUser.email?.toLowerCase().trim() || '';
      const isSystemAdmin = ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === userEmail);

      // Check if user entered a valid passcode at the landing gate before signing in
      let pendingAuthorUpgrade = false;
      try {
        const pendingPasscode = typeof window !== 'undefined' ? sessionStorage.getItem('og_pending_author_passcode') : null;
        if (pendingPasscode && AUTHOR_ACTIVATION_PASSCODES.includes(pendingPasscode.trim().toUpperCase())) {
          pendingAuthorUpgrade = true;
          sessionStorage.removeItem('og_pending_author_passcode');
        }
      } catch (e) {
        console.warn('Could not read pending passcode:', e);
      }

      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        let determinedRole: UserRole = isSystemAdmin ? 'admin' : (data.role || 'viewer');
        if (pendingAuthorUpgrade && determinedRole === 'viewer') {
          determinedRole = 'author';
        }
        
        const profile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || data.displayName || 'Học Giả Độc Giả',
          photoURL: currentUser.photoURL || data.photoURL || null,
          role: determinedRole,
          createdAt: data.createdAt || new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          bio: data.bio || '',
          affiliation: data.affiliation || ''
        };

        // Update last login & role
        await setDoc(userDocRef, { ...profile, lastLoginAt: new Date().toISOString() }, { merge: true });
        setUserProfile(profile);
        setRole(determinedRole);
      } else {
        // New user! Default to 'viewer' (Read-Only) unless they are the system admin or activated with passcode
        let initialRole: UserRole = isSystemAdmin ? 'admin' : (pendingAuthorUpgrade ? 'author' : 'viewer');
        const newProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || 'Học Giả Độc Giả',
          photoURL: currentUser.photoURL || null,
          role: initialRole,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          bio: 'Độc giả nghiên cứu Oneness Governance',
          affiliation: 'Học Giả Tự Do'
        };

        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
        setRole(initialRole);
      }
    } catch (err) {
      console.warn('Could not sync user profile from Firestore, using default viewer fallback:', err);
      const isSystemAdmin = ADMIN_EMAILS.some(
        adminEmail => adminEmail.toLowerCase() === (currentUser.email || '').toLowerCase()
      );
      const fallbackRole: UserRole = isSystemAdmin ? 'admin' : 'viewer';
      const fallbackProfile: UserProfile = {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || 'Học Giả',
        photoURL: currentUser.photoURL || null,
        role: fallbackRole,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      setUserProfile(fallbackProfile);
      setRole(fallbackRole);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserProfile(currentUser);
      } else {
        setUserProfile(null);
        setRole('guest');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncUserProfile(result.user);
      }
    } catch (error) {
      console.error('Lỗi đăng nhập Google:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setRole('guest');
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    }
  };

  const activateAuthorRole = async (passcode: string): Promise<{ success: boolean; message: string }> => {
    const cleanPasscode = passcode.trim().toUpperCase();
    if (!AUTHOR_ACTIVATION_PASSCODES.includes(cleanPasscode)) {
      return { success: false, message: 'Mã ủy quyền tác giả không hợp lệ. Vui lòng kiểm tra lại.' };
    }

    if (!user) {
      // If user not signed in yet, store in sessionStorage so upon login it elevates them
      try {
        sessionStorage.setItem('og_pending_author_passcode', cleanPasscode);
      } catch (e) {}
      return { success: true, message: 'Mã hợp lệ! Vui lòng đăng nhập tài khoản Google để tự động nâng cấp quyền Tác Giả.' };
    }

    try {
      const updatedProfile: UserProfile = {
        ...(userProfile || {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Học Giả',
          photoURL: user.photoURL || null,
          role: 'author'
        }),
        role: 'author'
      };
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { role: 'author' }, { merge: true });
      setUserProfile(updatedProfile);
      setRole('author');
      return { success: true, message: 'Kích hoạt quyền Tác Giả (Author) thành công! Bạn có thể biên soạn và tạo bản ghi lên hệ thống.' };
    } catch (err: any) {
      console.error('Lỗi lưu quyền Tác giả lên Firestore:', err);
      setUserProfile(prev => prev ? { ...prev, role: 'author' } : null);
      setRole('author');
      return { success: true, message: 'Đã kích hoạt quyền Tác Giả cho phiên làm việc hiện tại!' };
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'Chưa đăng nhập tài khoản.' };
    }
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const safeUpdates: Partial<UserProfile> = {
        displayName: updates.displayName,
        bio: updates.bio,
        affiliation: updates.affiliation,
        lastLoginAt: new Date().toISOString()
      };
      await setDoc(userDocRef, safeUpdates, { merge: true });
      setUserProfile(prev => prev ? { ...prev, ...safeUpdates } : null);
      return { success: true, message: 'Đã lưu thay đổi hồ sơ học giả thành công!' };
    } catch (err: any) {
      console.error('Lỗi cập nhật hồ sơ:', err);
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
      return { success: true, message: 'Đã cập nhật hồ sơ cho phiên làm việc!' };
    }
  };

  const setUserRoleManually = async (newRole: UserRole) => {
    if (!user || !userProfile) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { role: newRole }, { merge: true });
      setUserProfile(prev => prev ? { ...prev, role: newRole } : null);
      setRole(newRole);
    } catch (err) {
      console.error('Lỗi cập nhật vai trò:', err);
      setUserProfile(prev => prev ? { ...prev, role: newRole } : null);
      setRole(newRole);
    }
  };

  const isAdmin = role === 'admin';
  const isAuthor = role === 'author' || role === 'admin';
  const isViewer = role === 'viewer';
  const isGuest = role === 'guest';

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        role,
        loading,
        signInWithGoogle,
        logout,
        activateAuthorRole,
        updateUserProfile,
        setUserRoleManually,
        isAdmin,
        isAuthor,
        isViewer,
        isGuest
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

