"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth/auth-card";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [username, setU] = useState("");
    const [password, setP] = useState("");
    const { login, loading, error } = useAuthStore();
    const router = useRouter();
    const { user, _hasHydrated } = useAuthStore();

    useEffect(() => {
        if (_hasHydrated && user) {
            router.push("/dashboard");
        }
    }, [_hasHydrated, user, router]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await login({ username, password });
        router.push("/dashboard");
    };

    return (
        <main className="h-screen flex items-center justify-center bg-muted px-4">
            <AuthCard
                title="Sign in to Jirouille"
                footer={
                    <span>
                        No account?{" "}
                        <Link href="/register" className="underline">
                            Create one
                        </Link>
                    </span>
                }
            >
                <form className="space-y-4" onSubmit={onSubmit}>
                    <Input
                        value={username}
                        onChange={(e) => setU(e.target.value)}
                        placeholder="Username"
                        required
                    />
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => setP(e.target.value)}
                        placeholder="Password"
                        required
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Signing in..." : "Sign in"}
                    </Button>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </form>
            </AuthCard>
        </main>
    );
}
