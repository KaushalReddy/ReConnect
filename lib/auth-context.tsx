"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "@/firebase/config";
import { createUserDoc, getUserDoc } from "@/lib/firestore/users";
import type { UserDoc, UserRole } from "@/types";

interface AuthContextValue {
  /** Raw Firebase Auth user, or null if signed out. */
  firebaseUser: User | null;
  /** The matching Firestore users/{uid} document, or null if not loaded yet. */
  userDoc: UserDoc | null;
  /** True while the initial auth state / user doc is being resolved. */
  loading: boolean;
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    verification?: {
      phoneNumber?: string;
      isEmailVerified?: boolean;
      isPhoneVerified?: boolean;
      verificationMethod?: "EMAIL" | "PHONE" | "BOTH";
    }
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithPhoneUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserDoc: () => Promise<void>;
  sendNativeVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUserDoc(uid: string) {
    const doc = await getUserDoc(uid);
    setUserDoc(doc);
    return doc;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await loadUserDoc(user.uid);
      } else {
        setUserDoc(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function refreshUserDoc() {
    if (auth.currentUser) {
      await loadUserDoc(auth.currentUser.uid);
    }
  }

  async function register(
    name: string,
    email: string,
    password: string,
    role: UserRole,
    verification?: {
      phoneNumber?: string;
      isEmailVerified?: boolean;
      isPhoneVerified?: boolean;
      verificationMethod?: "EMAIL" | "PHONE" | "BOTH";
    }
  ) {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    await updateProfile(credential.user, { displayName: name });
    await createUserDoc(credential.user.uid, name, email, role, verification);
    const doc = await getUserDoc(credential.user.uid);
    setUserDoc(doc);
  }

  async function loginWithPhoneUser(user: User) {
    setFirebaseUser(user);
    let doc = await getUserDoc(user.uid);
    if (!doc) {
      // If signed in via phone and doc doesn't exist yet, bootstrap student profile
      await createUserDoc(
        user.uid,
        user.displayName || user.phoneNumber || "Verified User",
        user.email || `${user.phoneNumber?.replace(/[^0-9]/g, "") || "user"}@reconnect.phone`,
        "STUDENT",
        {
          phoneNumber: user.phoneNumber || undefined,
          isPhoneVerified: true,
          verificationMethod: "PHONE",
        }
      );
      doc = await getUserDoc(user.uid);
    }
    setUserDoc(doc);
  }

  async function login(identifier: string, password: string) {
    const isSpecialAdmin =
      identifier.trim().toLowerCase() === "admin" ||
      identifier.trim().toLowerCase() === "admin@reconnect.edu";

    const resolvedEmail = isSpecialAdmin ? "admin@reconnect.edu" : identifier.trim();

    try {
      await signInWithEmailAndPassword(auth, resolvedEmail, password);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      // If the designated single admin account has not been created in Firebase Auth yet,
      // bootstrap it automatically on first valid login with admin@123.
      if (isSpecialAdmin && password === "admin@123" && (code === "auth/user-not-found" || code === "auth/invalid-credential")) {
        const credential = await createUserWithEmailAndPassword(
          auth,
          resolvedEmail,
          password
        );
        await updateProfile(credential.user, { displayName: "Administrator" });
        await createUserDoc(credential.user.uid, "Administrator", resolvedEmail, "ADMIN");
        const doc = await getUserDoc(credential.user.uid);
        setUserDoc(doc);
        return;
      }
      throw err;
    }
  }

  async function sendNativeVerificationEmail() {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userDoc,
        loading,
        register,
        login,
        loginWithPhoneUser,
        logout,
        refreshUserDoc,
        sendNativeVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
