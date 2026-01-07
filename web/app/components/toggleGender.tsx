import React from "react";

export default function SingleGenderToggle({
  value,
  onChange,
}: {
  value: "F" | "M" | "";
  onChange: (v: "F" | "M" | "") => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex rounded-full border-gray-300 bg-gray-100 shadow-sm overflow-hidden">
        {["F", "M"].map((g) => (
          <button
            key={g}
            type="button"
            aria-pressed={value === g}
            onClick={() => onChange(value === g ? "" : (g as "F" | "M"))}
            className={`
              px-6 py-2 font-semibold text-sm
              ${
                value === g
                  ? g === "F"
                    ? "bg-pink-500 text-white"
                    : "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
            `}
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}
