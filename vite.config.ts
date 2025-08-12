import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths(),
    {
      name: 'ignore-chrome-devtools-json',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req?.url?.startsWith('/.well-known/appspecific/com.chrome.devtools.json')) {
            res.statusCode = 404;
            return res.end();
          }
          next();
        });
      }
    }
  ],
});
