import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: string | null;
  userStatus: string | null;
  isAdmin: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: null,
  userStatus: null,
  isAdmin: false,
  isStaff: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true); // 立刻設為 loading，防止異步讀取 Firestore 狀態時前端產生狀態閃爍
      setUser(firebaseUser);

      // 清除舊的 Firestore 監聽器
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (firebaseUser) {
        try {
          // 1. 嘗試獲取 Custom Claims (強制刷新以防瀏覽器快取舊的角色 Claims)
          const tokenResult = await firebaseUser.getIdTokenResult(true);
          const claimsRole = tokenResult.claims.role as string | undefined;

          // 2. 訂閱 Firestore 實時資料 (role + status)
          const { doc, onSnapshot } = await import('firebase/firestore');
          const { db } = await import('../firebase');

          unsubscribeDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setRole(claimsRole || data.role || 'member');
              setUserStatus(data.status || 'pending');
            } else {
              setRole(claimsRole || 'member');
              // 當前文檔尚未建立時，預設狀態為 pending 避開 race condition 直接存取系統
              setUserStatus('pending');
            }
            setLoading(false);
          }, (err) => {
            console.error('訂閱用戶文件失敗，預設為待審核:', err);
            setRole(claimsRole || 'member');
            setUserStatus('pending');
            setLoading(false);
          });
        } catch (err) {
          console.error('獲取角色/狀態失敗:', err);
          setRole('member');
          setUserStatus('pending');
          setLoading(false);
        }
      } else {
        setRole(null);
        setUserStatus(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }
    };
  }, []);

  const value = {
    user,
    loading,
    role,
    userStatus,
    isAdmin: role === 'admin',
    isStaff: role === 'staff',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
