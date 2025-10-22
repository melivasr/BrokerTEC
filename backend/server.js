import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";

const PORT = process.env.PORT || 4000;


(async () => {
  try {         
    // Escucha en todas las interfaces por lo que es alcanzable desde otros dispositivos en la LAN
    const HOST = process.env.HOST || '0.0.0.0';
    app.listen(PORT, HOST, () => {
      console.log(`Servidor corriendo en http://${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error("Error al iniciar aplicación:", err);
    process.exit(1);
  }
})();