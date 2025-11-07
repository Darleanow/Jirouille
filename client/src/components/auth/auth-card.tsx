import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { ReactNode } from "react";

interface AuthCardProps {
    title: string;
    children: ReactNode;
    footer: ReactNode;
}

export function AuthCard({ title, children, footer }: AuthCardProps) {
    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-center">{title}</CardTitle>
            </CardHeader>
            <CardContent>{children}</CardContent>
            <CardFooter className="justify-center text-sm text-muted-foreground">
                {footer}
            </CardFooter>
        </Card>
    );
}
