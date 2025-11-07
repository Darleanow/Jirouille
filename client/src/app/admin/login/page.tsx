"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const credentials = btoa(`${username}:${password}`);

        try {
            const res = await fetch(
                `${
                    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
                }/monitoring/stats`,
                {
                    headers: {
                        Authorization: `Basic ${credentials}`,
                    },
                }
            );

            if (res.ok) {
                // Store in both sessionStorage and cookie
                sessionStorage.setItem("admin_auth", credentials);
                document.cookie = `admin_auth=${credentials}; path=/; max-age=86400; SameSite=Strict`;

                router.push("/admin/monitoring");
            } else {
                setError("Invalid credentials");
                sessionStorage.removeItem("admin_auth");
                document.cookie = "admin_auth=; path=/; max-age=0";
            }
        } catch {
            setError("Connection error");
            sessionStorage.removeItem("admin_auth");
            document.cookie = "admin_auth=; path=/; max-age=0";
        }
    };

    return (
        <main className="h-screen flex items-center justify-center bg-muted px-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Admin Login</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Access monitoring dashboard
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                            required
                            autoComplete="username"
                        />
                    </div>
                    <div>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    <Button type="submit" className="w-full">
                        Login
                    </Button>
                    {error && (
                        <p className="text-sm text-red-600 text-center">
                            {error}
                        </p>
                    )}
                </form>
            </div>
        </main>
    );
}
