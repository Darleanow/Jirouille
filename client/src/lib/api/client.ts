const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function parseErrorMessage(errorText: string): string {
    try {
        const parsed = JSON.parse(errorText);

        if (parsed.error) {
            try {
                const zodErrors = JSON.parse(parsed.error);
                if (Array.isArray(zodErrors) && zodErrors.length > 0) {
                    return zodErrors[0].message || "Validation error";
                }
            } catch {
                return parsed.error;
            }
        }

        if (parsed.message) {
            return parsed.message;
        }

        return errorText;
    } catch {
        return errorText;
    }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, init);
    if (!res.ok) {
        const errorText = await res.text();
        const cleanMessage = parseErrorMessage(errorText);
        throw new Error(cleanMessage);
    }
    return res.json() as Promise<T>;
}

export const http = {
    get: <T>(path: string, token?: string) =>
        request<T>(path, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        }),
    post: <T>(path: string, body?: unknown, token?: string) => {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const init: RequestInit = {
            method: "POST",
            headers,
        };

        if (body !== undefined) {
            init.body = JSON.stringify(body);
        }

        return request<T>(path, init);
    },
    put: <T>(path: string, body?: unknown, token?: string) => {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const init: RequestInit = {
            method: "PUT",
            headers,
        };

        if (body !== undefined) {
            init.body = JSON.stringify(body);
        }

        return request<T>(path, init);
    },
    delete: <T>(path: string, token?: string) =>
        request<T>(path, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        }),
};
