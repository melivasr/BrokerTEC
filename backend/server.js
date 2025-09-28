import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import createAllTables from "./controllers/tablesCreation.js";

const PORT = process.env.PORT || 4000;


(async () => {
  try {
    await createAllTables();             
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Error al iniciar aplicación:", err);
    process.exit(1);
  }
})();