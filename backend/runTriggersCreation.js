import createTriggers from './controllers/triggersCreation.js';

createTriggers()
  .then(() => {
    console.log('Proceso completado');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });