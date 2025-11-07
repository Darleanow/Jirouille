import { http } from "./client";

export type Task = {
    id: string;
    userId: string;
    title: string;
    description?: string;
    status: "todo" | "in_progress" | "done";
    createdAt: string;
    updatedAt: string;
};

export type CreateTaskInput = {
    title: string;
    description?: string;
    status?: "todo" | "in_progress" | "done";
};

export type UpdateTaskInput = Partial<CreateTaskInput>;

export const TasksAPI = {
    list: (token: string) => http.get<Task[]>("/tasks", token),
    create: (data: CreateTaskInput, token: string) =>
        http.post<Task>("/tasks", data, token),
    update: (id: string, data: UpdateTaskInput, token: string) =>
        http.put<Task>(`/tasks/${id}`, data, token),
    delete: (id: string, token: string) => http.delete(`/tasks/${id}`, token),
};
