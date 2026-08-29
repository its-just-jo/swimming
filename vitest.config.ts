import { defineConfig } from 'vitest/config';

// Bewusst getrennt von vite.config.ts: der Rechenkern ist reines TypeScript
// ohne DOM und braucht weder das React-Plugin noch eine Browserumgebung.
// Die Trennung haelt den Testlauf schnell — Voraussetzung dafuer, dass die
// Tests waehrend der Entwicklung des Rechenkerns dauerhaft mitlaufen.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
