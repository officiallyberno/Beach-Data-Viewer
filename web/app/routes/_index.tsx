// web/app/routes/_index.tsx
import type { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useSearchParams } from "@remix-run/react";
import React, { useState } from "react";

// Komponente
export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8 mb-12">
      <header className="text-center">
        <h1 className="text-4xl font-bold mb-4">Willkommen!</h1>
        <p className="text-lg text-gray-600 leading-relaxed">
          Hier findest du alles rund um Beachvolleyball in Deutschland und der
          Welt! Aktuell gibt es die DVV-Turniere und die DVV-Rangliste mit allen
          Spieler:innen-Details. Ziel ist es, alle wichtigen Informationen der
          Beachvolleyball-Szene an einem Ort zusammenzubringen.
        </p>
      </header>

      <section>
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">
          Offizielle Turnierseiten
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          <li>
            <a
              href="https://beach.volleyball-verband.de"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl bg-blue-600 px-6 py-4 text-white text-center font-medium shadow hover:bg-blue-700 transition"
            >
              DVV
            </a>
          </li>
          <li>
            <a
              href="https://en.volleyballworld.com/beachvolleyball/competitions/beach-pro-tour/2025/?#activetab=yearly-tab&yearseason=2025"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl bg-pink-600 px-6 py-4 text-white text-center font-medium shadow hover:bg-pink-700 transition"
            >
              World Tour 2025
            </a>
          </li>
        </ul>
      </section>
      <section>
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">
          Landesverbände
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          <li>
            <a
              href="https://www.beachvolleybb.de"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl bg-red-600 px-6 py-4 text-white text-center font-medium shadow hover:bg-red-700 transition"
            >
              VVB
            </a>
          </li>
          <li>
            <a
              href="https://www.vmv24.de"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl bg-yellow-600 px-6 py-4 text-white text-center font-medium shadow hover:bg-yellow-700 transition"
            >
              VMV
            </a>
          </li>
          <li>
            <a
              href="https://vvsa.sams-server.de/cms/home/beach/vvsa_beach_tour/beach_turnierkalender_DVV.xhtml"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl bg-green-600 px-6 py-4 text-white text-center font-medium shadow hover:bg-green-700 transition"
            >
              VVSA
            </a>
          </li>
          <li>
            <a
              href="https://www.ssvb.org/cms/home/beach/beachtour/alle_S.xhtml"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl bg-lime-600 px-6 py-4 text-white text-center font-medium shadow hover:bg-lime-700 transition"
            >
              SSVB
            </a>
          </li>
          <li>
            <a
              href="https://www.shvv.de/"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl bg-pink-600 px-6 py-4 text-white text-center font-medium shadow hover:bg-pink-700 transition"
            >
              SHVV
            </a>
          </li>
        </ul>
      </section>
      <section>
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">
          Hallenvolleyball
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          <li>
            <a
              href="https://www.volleyball-bundesliga.de/"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl bg-blue-600 px-6 py-4 text-white text-center font-medium shadow hover:bg-blue-700 transition"
            >
              Bundesliga
            </a>
          </li>
          <li>
            <a
              href="https://www.dvv-ligen.de/"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl bg-red-600 px-6 py-4 text-white text-center font-medium shadow hover:bg-red-700 transition"
            >
              3.Liga + Regionalliga
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
