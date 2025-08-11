// app/routes/tournaments/$id.tsx (Remix Beispiel)

import { useLoaderData } from "@remix-run/react";
import { json, LoaderFunctionArgs } from "@remix-run/node";

type Tournament = {
  id: number;
  start_datum: string;
  end_datum: string;
  ort: string;
  geschlecht: string;
  kategorie: string;
  veranstalter: string;
};

export async function loader({ params, request }: LoaderFunctionArgs) {
  const id = params.id;

  const res = await fetch(`http://localhost:8000/tournaments/${id}`);
  const tournament: Tournament = await res.json();

  if (!tournament) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ tournament });
}

export default function TournamentDetail() {
  const { tournament } = useLoaderData<{ tournament: Tournament }>();
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{tournament.ort}</h1>
      <p>
        Datum: {tournament.start_datum} – {tournament.end_datum}
      </p>
      <p>Kategorie: {tournament.kategorie}</p>
      <p>Veranstalter: {tournament.veranstalter}</p>
      <p>Geschlecht: {tournament.geschlecht}</p>
      {/* weitere Details */}
    </div>
  );
}
