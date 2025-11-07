import { http } from "./client";
import type { AuthRequest, AuthResponse } from "../types";

export const AuthAPI = {
    register: (payload: AuthRequest) =>
        http.post<AuthResponse>("/auth/register", payload),
    login: (payload: AuthRequest) =>
        http.post<AuthResponse>("/auth/login", payload),
    me: (token: string) => http.get<AuthResponse>("/auth/me", token),
};
