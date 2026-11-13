"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "../../hooks/useAuth";
import { ApiError, errorMessage, login } from "../../lib/api";
import { isValidEmail } from "../../lib/validation";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { errorId, Field, inputClassName } from "../ui/Field";

interface LoginErrors {
  email?: string;
  password?: string;
}

const DEMO_ACCOUNTS = [
  { label: "Isi admin", email: "admin@teamorbit.test" },
  { label: "Isi member", email: "budi@teamorbit.test" },
];

export function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: LoginErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Email wajib diisi.";
    } else if (!isValidEmail(email)) {
      nextErrors.email = "Format email tidak valid.";
    }

    if (!password) {
      nextErrors.password = "Password wajib diisi.";
    }

    setErrors(nextErrors);
    setFormError(null);

    if (nextErrors.email || nextErrors.password) {
      return;
    }

    setSubmitting(true);

    try {
      signIn(await login(email.trim(), password));
      router.replace("/tasks");
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        setErrors({
          email: error.fieldError("email"),
          password: error.fieldError("password"),
        });
      } else {
        setFormError(errorMessage(error));
      }

      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold text-ink">Masuk ke orbit tim</h1>
        <p className="text-sm text-muted">Gunakan akun TeamOrbit kamu.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}

        <Field id="email" label="Email" error={errors.email}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="nama@perusahaan.id"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? errorId("email") : undefined}
            className={inputClassName(Boolean(errors.email))}
          />
        </Field>

        <Field id="password" label="Password" error={errors.password}>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? errorId("password") : undefined
            }
            className={inputClassName(Boolean(errors.password))}
          />
        </Field>

        <Button type="submit" variant="primary" block loading={submitting}>
          Masuk
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        Belum punya akun?{" "}
        <Link href="/register" className="font-medium text-ink underline">
          Daftar
        </Link>
      </p>

      <div className="space-y-2 rounded-lg bg-surface-2 p-4 text-xs text-muted">
        <p>
          <strong className="text-ink">Akun demo</strong> (password:{" "}
          <code>password</code>)
        </p>
        <p>
          Admin: <code>admin@teamorbit.test</code> · Member:{" "}
          <code>budi@teamorbit.test</code>
        </p>
        <div className="flex gap-2 pt-1">
          {DEMO_ACCOUNTS.map((account) => (
            <Button
              key={account.email}
              className="px-3 py-1 text-xs"
              onClick={() => {
                setEmail(account.email);
                setPassword("password");
                setErrors({});
                setFormError(null);
              }}
            >
              {account.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
