import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// O site é servido na RAIZ do domínio próprio (www.pokehax.com), então a base é
// "/" — igual em dev e no build. O CNAME do GitHub Pages fica em public/CNAME.
// (Histórico: quando morava em lofz.github.io/pokeHax/, a base do build era
// "/pokeHax/". Se algum dia voltar a um subcaminho, reintroduzir a base.)
export default defineConfig({
  plugins: [react()],
  base: "/",
  // Respeita a env PORT (ferramentas de preview/CI atribuem porta por ela);
  // sem PORT, cai no padrão do Vite (5173).
  server: process.env.PORT ? { port: Number(process.env.PORT) } : undefined,
});
