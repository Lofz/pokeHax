import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Em produção o site vive num subcaminho do GitHub Pages (lofz.github.io/pokeHax/),
// então o build usa base "/pokeHax/". Em dev continua na raiz ("/").
// Os assets de public/ devem ser referenciados via import.meta.env.BASE_URL.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/pokeHax/" : "/",
}));
