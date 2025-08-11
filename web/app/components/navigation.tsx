import { Link } from "@remix-run/react";

export default function Navigation() {
  return (
    <nav className="bg-blue-600 p-4 text-white flex gap-4">
      <Link to="/" className="hover:underline" prefetch="intent">
        Turniere
      </Link>
      <Link to="/rankings" className="hover:underline" prefetch="intent">
        Rangliste
      </Link>
    </nav>
  );
}
