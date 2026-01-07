import TurNavigation from "~/components/turnavigation";

export default function IndexTournaments() {
  return (
    <div>
      <TurNavigation />
      <header className="text-center">
        <h1 className="text-4xl font-bold mb-4">Servus!</h1>
        <p className="text-lg text-gray-600 leading-relaxed">
          Hier können sie Kategorisiert nach verschiedenen Landesverbänden nach
          Turnieren suchen.
        </p>
      </header>
    </div>
  );
}
