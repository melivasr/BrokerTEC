import createAllTables from './controllers/tablesCreation.js';

createAllTables()
  .then(() => {
    console.log('¡Tablas creadas!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error al crear tablas:', err);
    process.exit(1);
  });