import { redirect } from "next/navigation";

// Halaman utama langsung ke dashboard; layout dashboard yang mengarahkan
// ke /login kalau belum login.
export default function Home() {
  redirect("/tasks");
}
