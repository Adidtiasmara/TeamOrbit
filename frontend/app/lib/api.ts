import { clearToken, getToken } from "./auth";
import type {
  AuthPayload,
  FieldErrors,
  Role,
  Tag,
  Task,
  TaskStatus,
  User,
  UserSummary,
} from "./types";

// Semua panggilan ke REST API backend lewat file ini (design/API_SPEC.md).
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"
).replace(/\/+$/, "");

/** Dikirim saat server menolak token (401); didengar AuthProvider. */
export const UNAUTHORIZED_EVENT = "teamorbit:unauthorized";

const GENERIC_ERROR = "Terjadi kesalahan. Coba lagi.";

export class ApiError extends Error {
  readonly status: number;
  readonly errors: FieldErrors;

  constructor(status: number, message: string, errors: FieldErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }

  /** Pesan pertama untuk satu field, untuk ditampilkan di bawah input. */
  fieldError(field: string): string | undefined {
    return this.errors[field]?.[0];
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : GENERIC_ERROR;
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface ErrorBody {
  message?: string;
  errors?: FieldErrors;
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { Accept: "application/json" };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      0,
      "Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.",
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (payload ?? {}) as ErrorBody;

    if (response.status === 401 && token) {
      // Token kedaluwarsa atau sudah dicabut: hapus, lalu kembali ke login.
      clearToken();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    throw new ApiError(
      response.status,
      error.message ?? GENERIC_ERROR,
      error.errors ?? {},
    );
  }

  return payload as T;
}

async function requestData<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<T> {
  const payload = await request<{ data: T }>(method, path, body);

  return payload.data;
}

function taskPath(taskId: number | string): string {
  return `/tasks/${encodeURIComponent(String(taskId))}`;
}

// Auth

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export function login(email: string, password: string): Promise<AuthPayload> {
  return requestData<AuthPayload>("POST", "/login", { email, password });
}

export function register(input: RegisterInput): Promise<AuthPayload> {
  return requestData<AuthPayload>("POST", "/register", input);
}

export function logout(): Promise<void> {
  return request<void>("POST", "/logout");
}

export function getMe(): Promise<User> {
  return requestData<User>("GET", "/me");
}

// Tasks

export interface CreateTaskInput {
  title: string;
  description: string | null;
}

/** Update parsial: cukup kirim field yang berubah, mis. { status }. */
export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
}

export function listTasks(status?: TaskStatus): Promise<Task[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";

  return requestData<Task[]>("GET", `/tasks${query}`);
}

export function createTask(input: CreateTaskInput): Promise<Task> {
  return requestData<Task>("POST", "/tasks", input);
}

export function getTask(taskId: number | string): Promise<Task> {
  return requestData<Task>("GET", taskPath(taskId));
}

export function updateTask(
  taskId: number | string,
  input: UpdateTaskInput,
): Promise<Task> {
  return requestData<Task>("PUT", taskPath(taskId), input);
}

export function deleteTask(taskId: number | string): Promise<void> {
  return request<void>("DELETE", taskPath(taskId));
}

// Assignees

export function addAssignee(
  taskId: number | string,
  userId: number,
): Promise<Task> {
  return requestData<Task>("POST", `${taskPath(taskId)}/assignees`, {
    user_id: userId,
  });
}

export function removeAssignee(
  taskId: number | string,
  userId: number,
): Promise<void> {
  return request<void>(
    "DELETE",
    `${taskPath(taskId)}/assignees/${encodeURIComponent(String(userId))}`,
  );
}

export function listAssignableUsers(): Promise<UserSummary[]> {
  return requestData<UserSummary[]>("GET", "/assignable-users");
}

// Tags

export function listTags(): Promise<Tag[]> {
  return requestData<Tag[]>("GET", "/tags");
}

export function createTag(name: string): Promise<Tag> {
  return requestData<Tag>("POST", "/tags", { name });
}

export function addTaskTag(
  taskId: number | string,
  tagId: number,
): Promise<Task> {
  return requestData<Task>(
    "POST",
    `${taskPath(taskId)}/tags/${encodeURIComponent(String(tagId))}`,
  );
}

export function removeTaskTag(
  taskId: number | string,
  tagId: number,
): Promise<void> {
  return request<void>(
    "DELETE",
    `${taskPath(taskId)}/tags/${encodeURIComponent(String(tagId))}`,
  );
}

// Users (khusus Admin)

export function listUsers(): Promise<User[]> {
  return requestData<User[]>("GET", "/users");
}

export function updateUserRole(userId: number, role: Role): Promise<User> {
  return requestData<User>(
    "PUT",
    `/users/${encodeURIComponent(String(userId))}/role`,
    { role },
  );
}
