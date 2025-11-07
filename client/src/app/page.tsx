import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
    return (
        <main className="h-screen flex items-center justify-center bg-muted">
            <Card className="max-w-md w-full mx-4">
                <CardHeader>
                    <CardTitle className="text-center text-2xl font-bold">
                        📝 Bienvenue sur Jirouille
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <p className="text-center text-muted-foreground">
                        Votre gestionnaire de tâches collaboratif simplifié.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button asChild>
                            <Link href="/login">Connexion</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/register">Inscription</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
