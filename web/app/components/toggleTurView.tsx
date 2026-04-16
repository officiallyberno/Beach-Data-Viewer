type ToggleTurViewProps = {
  setActiveView: React.Dispatch<React.SetStateAction<boolean>>;
  activeView: boolean;
};

export default function ToggleTurView({
  setActiveView,
  activeView,
}: ToggleTurViewProps) {
  return (
    <div className="flex justify-end">
      <div className="mt-4 p-1 rounded-lg bg-gray-800">
        <button onClick={() => setActiveView(true)}>
          {activeView ? (
            <h2 className="font-bold p-1 bg-slate-500 mr-1 rounded-md">Grid</h2>
          ) : (
            <h2 className="font-bold p-1 mr-1 rounded-md">Grid</h2>
          )}
        </button>
        <button onClick={() => setActiveView(false)}>
          {!activeView ? (
            <h2 className="font-bold bg-slate-500 p-1 rounded-md">Table</h2>
          ) : (
            <h2 className="font-bold p-1 rounded-md">Table</h2>
          )}
        </button>
      </div>
    </div>
  );
}
