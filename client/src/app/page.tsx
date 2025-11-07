import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
    return (
        <>
            <SiteHeader />
            <main className="container mx-auto mt-10 px-4">
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle className="text-center">Jirouille</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-muted-foreground mb-4">
                            Une app collaborative en temps réel avec WebSocket &
                            SQLite.
                        </p>
                        <Button size="lg">Commencer ➜</Button>
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
