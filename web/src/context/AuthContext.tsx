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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          // 1. 嘗試獲取 Custom Claims
          const tokenResult = await firebaseUser.getIdTokenResult();
          const claimsRole = tokenResult.claims.role as string | undefined;

          // 2. 從 Firestore 讀取完整資料 (role + status)
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

          if (userDoc.exists()) {
            const data = userDoc.data();
            setRole(claimsRole || data.role || 'member');
            setUserStatus(data.status || 'active');
          } else {
            setRole(claimsRole || 'member');
            setUserStatus('active');
          }
        } catch (err) {
          console.error('獲取角色/狀態失敗:', err);
          setRole('member');
          setUserStatus('active');
        }
      } else {
        setRole(null);
        setUserStatus(null);
      }

      setLoading(false);
    });

    return unsubscribe;
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
