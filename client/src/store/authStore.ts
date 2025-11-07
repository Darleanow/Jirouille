"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthAPI } from "@/lib/api/auth";
import type { AuthRequest, AuthResponse } from "@/lib/types";

type AuthState = {
    user: AuthResponse | null;
    loading: boolean;
    error?: string;
    _hasHydrated: boolean;
};

type AuthActions = {
    register: (payload: AuthRequest) => Promise<void>;
    login: (payload: AuthRequest) => Promise<void>;
    logout: () => void;
    me: () => Promise<void>;
    setHasHydrated: (state: boolean) => void;
};

export const useAuthStore = create<AuthState & AuthActions>()(
    persist(
        (set, get) => ({
            user: null,
            loading: false,
            _hasHydrated: false,

            setHasHydrated: (state) => {
                set({ _hasHydrated: state });
            },

            async register(payload) {
                try {
                    set({ loading: true, error: undefined });
                    const user = await AuthAPI.register(payload);
                    set({ user });
                } catch (error) {
                    if (error instanceof Error) {
                        set({ error: error.message });
                    } else {
                        set({ error: "Unknown error during registration" });
                    }
                    throw error;
                } finally {
                    set({ loading: false });
                }
            },

            async login(payload) {
                try {
                    set({ loading: true, error: undefined });
                    const user = await AuthAPI.login(payload);
                    set({ user });
                } catch (error) {
                    if (error instanceof Error) {
                        set({ error: error.message });
                    } else {
                        set({ error: "Unknown error during login" });
                    }
                    throw error;
                } finally {
                    set({ loading: false });
                }
            },

            logout() {
                set({ user: null });
            },

            async me() {
                const currentUser = get().user;
                if (!currentUser) return;

                try {
                    const fresh = await AuthAPI.me(currentUser.token);
                    set({ user: fresh });
                } catch {
                    set({ user: null });
                }
            },
        }),
        {
            name: "jirouille-auth",
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
