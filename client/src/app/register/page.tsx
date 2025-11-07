"use client";
import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth/auth-card";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const [username, setU] = useState("");
    const [password, setP] = useState("");
    const { register, loading, error } = useAuthStore();
    const router = useRouter();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await register({ username, password });
        router.push("/");
    };

    return (
        <main className="h-screen flex items-center justify-center bg-muted px-4">
            <AuthCard
                title="Create your Jirouille account"
                footer={
                    <span>
                        Already have one?{" "}
                        <Link href="/login" className="underline">
                            Sign in
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
                        {loading ? "Creating..." : "Create account"}
                    </Button>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </form>
            </AuthCard>
        </main>
    );
}
