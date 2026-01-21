import { LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";

export default function RankingPage() {
  return (
    <div className="max-w-3xl mx-auto mb-10 p-6">
      <h1 className="text-3xl font-bold mb-4">Rangliste 2026</h1>
      <div className="grid row-span-4">
        <Link to={"/ranking_dvv"}>DVV Einzelrangliste</Link>
        <Link to={"/ranking_dvv"}>DVV Teamrangliste</Link>
        <Link to={"/ranking_dvv"}>DVV Einzelrangliste</Link>
        <Link to={"/ranking_dvv"}>DVV Einzelrangliste</Link>
      </div>
    </div>
  );
}
