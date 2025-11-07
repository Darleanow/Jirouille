import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
    return (
        <main className="h-screen flex items-center justify-center bg-muted">
            <Card className="max-w-md w-full mx-4">
                <CardHeader>
                    <CardTitle className="text-center text-2xl font-bold">
                        📝 Welcome to Jirouille
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <p className="text-center text-muted-foreground">
                        Your simplified collaborative task manager.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button asChild>
                            <Link href="/login">Login</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/register">Register</Link>
                        </Button>
                    </div>
                    <div className="border-t pt-4 mt-2">
                        <Button
                            asChild
                            variant="ghost"
                            className="w-full text-xs"
                        >
                            <Link href="/admin/login">Admin Access</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
