import seedData from './controllers/seedData.js';

(async () => {
  try {
    await seedData();
    console.log('Seed ejecutado correctamente');
    process.exit(0);
  } catch (err) {
    console.error('Error ejecutando seed:', err);
    process.exit(1);
  }
})();
