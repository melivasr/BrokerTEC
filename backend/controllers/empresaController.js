import { queryDB } from '../config/db.js';

export async function getEmpresas(req, res) {
  const empresas = await queryDB('SELECT * FROM Empresa');
  res.json(empresas);
}

export async function createEmpresa(req, res) {
  const { nombre, mercado_id, cantidad_acciones_totales, capitalizacion, estado } = req.body;
  await queryDB(
    'INSERT INTO Empresa (nombre, mercado_id, cantidad_acciones_totales, capitalizacion, estado) VALUES (@nombre, @mercado_id, @cantidad_acciones_totales, @capitalizacion, @estado)',
    { nombre, mercado_id, cantidad_acciones_totales, capitalizacion, estado }
  );
  res.json({ message: 'Empresa creada' });
}