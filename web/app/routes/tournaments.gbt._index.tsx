import { LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "lucide-react";
import TurNavigation from "~/components/turnavigation";
import { TournamentVVB } from "./types";
import { useLoaderData } from "@remix-run/react";
import { formatDate } from "~/utils/date";
import { tur_name } from "~/utils/tur_details";
import TournamentGrid from "~/components/turgrid";

export async function loader({ request }: LoaderFunctionArgs) {
  const res = await fetch(`http://localhost:8000/dvv`);
  const data: TournamentVVB[] = await res.json();

  let tournaments = data;

  return { tournaments };
}

export default function TurPageGbt() {
  const { tournaments } = useLoaderData<typeof loader>();
  console.log(tournaments);

  return (
    <div className="">
      <TurNavigation />
      <div className="w-full mx-auto mb-16 p-6">
        <h1 className="text-3xl font-bold mb-4">Turniere</h1>
        <TournamentGrid tournaments={tournaments} basePath="vvb" />
      </div>
    </div>
  );
}
