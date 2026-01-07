import { Link } from "@remix-run/react";

export default function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-gray-800 text-white p-4">
      {/* <Link to="/" className="hover:underline" prefetch="intent">
        Turniere
      </Link>
      <Link to="/rankings" className="hover:underline" prefetch="intent">
        Rangliste
      </Link>
      <Link to="/search" className="hover:underline" prefetch="intent">
        Spielersuche
      </Link> */}
      <div className="flex justify-around">
        <Link to="/" className="hover:underline" prefetch="intent">
          <span className="">Home</span>
        </Link>
        <Link to="/tournaments" className="hover:underline" prefetch="intent">
          <span className="">Turniere</span>
        </Link>
        <Link to="/rankings" className="hover:underline" prefetch="intent">
          <span className="">Ranked</span>
        </Link>
        <Link to="/search" className="hover:underline" prefetch="intent">
          <span className="">Suche</span>
        </Link>
      </div>
    </nav>
  );
}
