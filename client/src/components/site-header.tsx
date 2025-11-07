import Link from "next/link";
import { Button } from "./ui/button";

export function SiteHeader() {
    return (
        <header className="border-b">
            <div className="container flex h-16 items-center justify-between px-4">
                <Link href="/" className="text-xl font-semibold">
                    📝 Jirouille
                </Link>
                <nav>
                    <Button variant="ghost" asChild>
                        <Link href="/about">À propos</Link>
                    </Button>
                </nav>
            </div>
        </header>
    );
}
