import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  AtomicPermission,
  ATOMIC_PERMISSIONS_CONFIG,
  AtomicPermissionMeta,
  ROLE_PERMISSIONS,
  UserRole,
  ADMIN_EMAILS
} from '../types/permissions';
import { AccessDeniedOverlay } from '../components/AccessDeniedOverlay';
import { SessionLockScreen } from '../components/SessionLockScreen';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface PermissionContextType {
  hasPermission: (permission: AtomicPermission) => boolean;
  requirePermission: (
    permission: AtomicPermission,
    onAuthorized?: () => void,
    customContext?: { title?: string; message?: string }
  ) => boolean;
  openAccessDeniedModal: (permission: AtomicPermission, customContext?: { title?: string; message?: string }) => void;
  closeAccessDeniedModal: () => void;
  isAccessDeniedOpen: boolean;
  currentDeniedPermission: AtomicPermission;
  customOverlayTitle?: string;
  customOverlayMessage?: string;
  openGuestLockModal: () => void;
  isContentEditLocked: boolean;
  setContentEditLocked: (locked: boolean) => Promise<{ success: boolean; message?: string }>;
  isOwner: boolean;
  canEditContent: boolean;
  isSessionLocked: boolean;
  unlockSession: () => void;
  lockSession: () => void;
  requireSessionLock: boolean;
  setRequireSessionLock: (enabled: boolean) => void;
}

const PermissionContext = createContext<PermissionContextType>({
  hasPermission: () => false,
  requirePermission: () => false,
  openAccessDeniedModal: () => {},
  closeAccessDeniedModal: () => {},
  isAccessDeniedOpen: false,
  currentDeniedPermission: 'compose_article',
  openGuestLockModal: () => {},
  isContentEditLocked: true,
  setContentEditLocked: async () => ({ success: false }),
  isOwner: false,
  canEditContent: false,
  isSessionLocked: false,
  unlockSession: () => {},
  lockSession: () => {},
  requireSessionLock: true,
  setRequireSessionLock: () => {}
});

export const usePermission = () => useContext(PermissionContext);

export const PermissionProvider: React.FC<{ children: React.ReactNode; theme?: 'dark' | 'light' }> = ({
  children,
  theme = 'dark'
}) => {
  const { user, role, isAdmin } = useAuth();
  const [isAccessDeniedOpen, setIsAccessDeniedOpen] = useState(false);
  const [currentDeniedPermission, setCurrentDeniedPermission] = useState<AtomicPermission>('compose_article');
  const [customOverlayTitle, setCustomOverlayTitle] = useState<string | undefined>(undefined);
  const [customOverlayMessage, setCustomOverlayMessage] = useState<string | undefined>(undefined);

  // Global Content Edit Lock state (Default: locked for safety)
  const [isContentEditLocked, setIsContentEditLockedState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('og_content_edit_locked');
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  // Session Guard: Require lock on new browser sessions/tabs
  const [requireSessionLock, setRequireSessionLockState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('og_require_session_lock');
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  const [isSessionLocked, setIsSessionLocked] = useState<boolean>(() => {
    try {
      const lockSetting = localStorage.getItem('og_require_session_lock');
      const shouldLock = lockSetting !== null ? lockSetting === 'true' : true;
      if (!shouldLock) return false;
      const sessionActive = sessionStorage.getItem('og_session_active');
      return sessionActive !== 'true';
    } catch {
      return true;
    }
  });

  const unlockSession = () => {
    try {
      sessionStorage.setItem('og_session_active', 'true');
    } catch (e) {
      console.warn(e);
    }
    setIsSessionLocked(false);
  };

  const lockSession = () => {
    try {
      sessionStorage.removeItem('og_session_active');
    } catch (e) {
      console.warn(e);
    }
    setIsSessionLocked(true);
  };

  const setRequireSessionLock = (enabled: boolean) => {
    setRequireSessionLockState(enabled);
    try {
      localStorage.setItem('og_require_session_lock', String(enabled));
    } catch (e) {}
  };

  // Determine if the current authenticated user is the designated system Owner
  const isOwner = React.useMemo(() => {
    if (!user) return false;
    if (isAdmin) return true;
    const email = (user.email || '').toLowerCase().trim();
    return ADMIN_EMAILS.some(adm => adm.toLowerCase() === email);
  }, [user, isAdmin]);

  // Sync Content Edit Lock setting from Firestore
  useEffect(() => {
    const fetchLockConfig = async () => {
      try {
        const configDoc = await getDoc(doc(db, 'settings', 'app_config'));
        if (configDoc.exists()) {
          const data = configDoc.data();
          if (data && typeof data.isContentEditLocked === 'boolean') {
            setIsContentEditLockedState(data.isContentEditLocked);
            localStorage.setItem('og_content_edit_locked', String(data.isContentEditLocked));
          }
        }
      } catch (err) {
        // Fallback to localStorage
      }
    };
    fetchLockConfig();
  }, []);

  const setContentEditLocked = async (locked: boolean): Promise<{ success: boolean; message?: string }> => {
    if (!isOwner) {
      return {
        success: false,
        message: 'Chỉ tài khoản Owner (quechoa.everywhere@gmail.com) mới có quyền Bật / Tắt Khóa Biên Tập Nội Dung.'
      };
    }

    setIsContentEditLockedState(locked);
    try {
      localStorage.setItem('og_content_edit_locked', String(locked));
      await setDoc(doc(db, 'settings', 'app_config'), { isContentEditLocked: locked, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('Could not sync lock setting to Firestore:', err);
    }

    return {
      success: true,
      message: locked ? 'Đã kích hoạt Khóa Biên Tập Toàn Cục.' : 'Đã mở khóa tính năng biên tập nội dung.'
    };
  };

  const hasPermission = (permission: AtomicPermission): boolean => {
    // 1. Unauthenticated users (guest) have ZERO mutation permissions (pure read-only)
    if (!user || role === 'guest') {
      return false;
    }

    // 2. Default logged-in users (viewer / reader) are in Read-Only Mode (cannot create/mutate records)
    if (role === 'viewer') {
      return false;
    }

    // 3. If content edit is locked and permission is 'compose_article', only Owner/Admin can proceed
    if (permission === 'compose_article' && isContentEditLocked && !isOwner) {
      return false;
    }

    // 4. Check role permissions matrix
    const allowed = ROLE_PERMISSIONS[role] || [];
    return allowed.includes(permission);
  };

  const canEditContent = React.useMemo(() => {
    if (!user) return false;
    if (isContentEditLocked) {
      return isOwner;
    }
    return role === 'admin' || role === 'author';
  }, [user, isContentEditLocked, isOwner, role]);

  const openAccessDeniedModal = (
    permission: AtomicPermission,
    customContext?: { title?: string; message?: string }
  ) => {
    setCurrentDeniedPermission(permission);
    setCustomOverlayTitle(customContext?.title);
    setCustomOverlayMessage(customContext?.message);
    setIsAccessDeniedOpen(true);
  };

  const closeAccessDeniedModal = () => {
    setIsAccessDeniedOpen(false);
    setCustomOverlayTitle(undefined);
    setCustomOverlayMessage(undefined);
  };

  const openGuestLockModal = () => {
    openAccessDeniedModal('compose_article', {
      title: 'Chế Độ Độc Giả (Chỉ Xem)',
      message: 'Bạn đang truy cập ứng dụng ở chế độ Độc Giả. Bạn có thể tự do đọc, tra cứu Sổ Từ Điển, xem các công trình 6 Trụ Cột Động. Mọi thao tác biên soạn và tạo bản ghi trên hệ thống yêu cầu quyền Tác Giả (Author) hoặc Quản Trị Viên (Admin).'
    });
  };

  const requirePermission = (
    permission: AtomicPermission,
    onAuthorized?: () => void,
    customContext?: { title?: string; message?: string }
  ): boolean => {
    if (hasPermission(permission)) {
      if (onAuthorized) {
        onAuthorized();
      }
      return true;
    }

    // If locked by system setting and user attempted editing
    if (permission === 'compose_article' && isContentEditLocked && !isOwner && !customContext) {
      openAccessDeniedModal(permission, {
        title: 'Tính Năng Sửa Nội Dung Đang Bị Khóa',
        message: 'Tính năng sửa nội dung & tiêu đề đang bị khóa toàn hệ thống để bảo vệ dữ liệu. Chỉ tài khoản Owner (quechoa.everywhere@gmail.com) mới có quyền mở khóa trong mục Cài Đặt.'
      });
      return false;
    }

    openAccessDeniedModal(permission, customContext);
    return false;
  };

  return (
    <PermissionContext.Provider
      value={{
        hasPermission,
        requirePermission,
        openAccessDeniedModal,
        closeAccessDeniedModal,
        isAccessDeniedOpen,
        currentDeniedPermission,
        customOverlayTitle,
        customOverlayMessage,
        openGuestLockModal,
        isContentEditLocked,
        setContentEditLocked,
        isOwner,
        canEditContent,
        isSessionLocked,
        unlockSession,
        lockSession,
        requireSessionLock,
        setRequireSessionLock
      }}
    >
      {children}
      <SessionLockScreen theme={theme} />
      <AccessDeniedOverlay
        isOpen={isAccessDeniedOpen}
        onClose={closeAccessDeniedModal}
        permission={currentDeniedPermission}
        customTitle={customOverlayTitle}
        customMessage={customOverlayMessage}
        theme={theme}
      />
    </PermissionContext.Provider>
  );
};

