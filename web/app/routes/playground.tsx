export default function Playground() {
  return (
    <div className="grid grid-rows-3 grid-flow-col gap-4">
      <div className="bg-blue-600 row-span-3"> 1</div>
      <div className="bg-slate-600 col-span-2"> 2</div>
      <div className="bg-red-600 row-span-2 col-span-2"> 3</div>
    </div>
  );
}
