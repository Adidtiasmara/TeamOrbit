import type { Metadata } from "next";
import { LoginForm } from "../../components/forms/LoginForm";

export const metadata: Metadata = {
  title: "Masuk · TeamOrbit",
};

export default function LoginPage() {
  return <LoginForm />;
}
