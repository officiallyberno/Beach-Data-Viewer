import { Link, useLocation } from "@remix-run/react";
import { motion } from "framer-motion";
import { Volleyball } from "lucide-react";
export default function TurNavigation() {
  const location = useLocation();

  const links = [
    { label: "DVV", path: "/tournaments/dvv", color: "bg-red-500" },
    { label: "VVB", path: "/tournaments/vvb", color: "bg-blue-500" },
    { label: "VMV", path: "/tournaments/vmv", color: "bg-green-500" },
    { label: "SAVV", path: "/tournaments/savv", color: "bg-yellow-500" },
    { label: "VVSA", path: "/tournaments/vvsa", color: "bg-purple-500" },
    { label: "TVV", path: "/tournaments/tvv", color: "bg-pink-500" },
    { label: "GBT", path: "/tournaments/gbt", color: "bg-blue-500" },
  ];
  return (
    <div className="flex justify-center">
      <nav className="flex flex-col md:flex-row items-center w-full max-w-4xl justify-between shadow-md px-6 py-3 rounded-2xl mb-6">
        <div className="flex items-center gap-3">
          <Volleyball className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold tracking-tight">
            Beach Tour Übersicht
          </h1>
        </div>

        <div className="flex flex-wrap gap-3 mt-3 md:mt-0">
          {links.map((link) => {
            const active = location.pathname === link.path;
            return (
              <motion.div
                key={link.path}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-200 border ${
                    active
                      ? `${link.color} text-white border-transparent shadow`
                      : `border-gray-300 text-gray-700 hover:${link.color} hover:text-white`
                  }`}
                >
                  <span>{link.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
