import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { UserProfile } from "../backend.d";
import { AppUserRole } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

// ─── Context Interface ────────────────────────────────────────────────────────

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  /** True when the user is authenticated via II but has no backend profile yet */
  needsRegistration: boolean;
  login: () => void;
  logout: () => void;
  userProfile: UserProfile | null;
  userRole: AppUserRole | null;
  isAdmin: boolean;
  refetchProfile: () => Promise<void>;
  principalText: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const { identity, login, clear, isInitializing, isLoggingIn } =
    useInternetIdentity();

  const { actor, isFetching: actorFetching } = useActor();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileFetched, setProfileFetched] = useState(false);

  // Track the last principal we fetched for to avoid redundant fetches
  const lastFetchedPrincipal = useRef<string | null>(null);

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const isLoading =
    isInitializing || isLoggingIn || actorFetching || profileLoading;
  const userRole = userProfile?.role ?? null;
  const isAdmin = userRole === AppUserRole.admin;
  const principalText = identity?.getPrincipal().toString() ?? null;

  // needsRegistration: authenticated but no profile found after fetch
  const needsRegistration =
    isAuthenticated && profileFetched && userProfile === null;

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated || !actor || actorFetching) {
      if (!isAuthenticated) {
        setUserProfile(null);
        setProfileFetched(false);
      }
      return;
    }
    const currentPrincipal = identity?.getPrincipal().toString() ?? null;
    setProfileLoading(true);
    try {
      const profile = await actor.getMyProfile();
      setUserProfile(profile ?? null);
      setProfileFetched(true);
      lastFetchedPrincipal.current = currentPrincipal;
    } catch {
      setUserProfile(null);
      setProfileFetched(true);
      lastFetchedPrincipal.current = currentPrincipal;
    } finally {
      setProfileLoading(false);
    }
  }, [isAuthenticated, actor, actorFetching, identity]);

  // Fetch profile when actor becomes available or principal changes
  useEffect(() => {
    const currentPrincipal = identity?.getPrincipal().toString() ?? null;
    if (actor && !actorFetching && isAuthenticated) {
      // Only re-fetch if principal changed (avoids duplicate fetches)
      if (lastFetchedPrincipal.current !== currentPrincipal) {
        fetchProfile();
      }
    } else if (!isAuthenticated) {
      setUserProfile(null);
      setProfileFetched(false);
      lastFetchedPrincipal.current = null;
    }
  }, [actor, actorFetching, isAuthenticated, fetchProfile, identity]);

  const refetchProfile = useCallback(async () => {
    lastFetchedPrincipal.current = null; // force re-fetch
    await fetchProfile();
  }, [fetchProfile]);

  const logout = useCallback(() => {
    setUserProfile(null);
    setProfileFetched(false);
    lastFetchedPrincipal.current = null;
    clear();
  }, [clear]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        needsRegistration,
        login,
        logout,
        userProfile,
        userRole,
        isAdmin,
        refetchProfile,
        principalText,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
