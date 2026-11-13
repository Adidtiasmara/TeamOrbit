"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "../../hooks/useAuth";
import { ApiError, errorMessage, register } from "../../lib/api";
import { isValidEmail, PASSWORD_MIN_LENGTH } from "../../lib/validation";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { errorId, Field, inputClassName } from "../ui/Field";

type FieldName = "name" | "email" | "password" | "password_confirmation";

type RegisterErrors = Partial<Record<FieldName, string>>;

const FIELDS: {
  name: FieldName;
  label: string;
  type: string;
  autoComplete: string;
}[] = [
  { name: "name", label: "Nama", type: "text", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  {
    name: "password",
    label: "Password",
    type: "password",
    autoComplete: "new-password",
  },
  {
    name: "password_confirmation",
    label: "Ulangi password",
    type: "password",
    autoComplete: "new-password",
  },
];

function validate(values: Record<FieldName, string>): RegisterErrors {
  const errors: RegisterErrors = {};

  if (!values.name.trim()) {
    errors.name = "Nama wajib diisi.";
  }

  if (!values.email.trim()) {
    errors.email = "Email wajib diisi.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "Format email tidak valid.";
  }

  if (values.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Password minimal ${PASSWORD_MIN_LENGTH} karakter.`;
  }

  if (values.password_confirmation !== values.password) {
    errors.password_confirmation = "Konfirmasi password tidak cocok.";
  }

  return errors;
}

export function RegisterForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [values, setValues] = useState<Record<FieldName, string>>({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate(values);

    setErrors(nextErrors);
    setFormError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      signIn(
        await register({
          ...values,
          name: values.name.trim(),
          email: values.email.trim(),
        }),
      );
      router.replace("/tasks");
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        setErrors({
          name: error.fieldError("name"),
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
        <h1 className="text-xl font-semibold text-ink">Buat akun baru</h1>
        <p className="text-sm text-muted">
          Bergabung dengan tim di orbit yang sama.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}

        {FIELDS.map((field) => {
          const error = errors[field.name];

          return (
            <Field
              key={field.name}
              id={field.name}
              label={field.label}
              error={error}
              hint={
                field.name === "password"
                  ? `Minimal ${PASSWORD_MIN_LENGTH} karakter.`
                  : undefined
              }
            >
              <input
                id={field.name}
                type={field.type}
                autoComplete={field.autoComplete}
                value={values[field.name]}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [field.name]: event.target.value,
                  }))
                }
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId(field.name) : undefined}
                className={inputClassName(Boolean(error))}
              />
            </Field>
          );
        })}

        <Button type="submit" variant="primary" block loading={submitting}>
          Daftar
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-ink underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}
