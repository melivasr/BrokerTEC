import { queryDB } from '../config/db.js';

export default async function seedData() {
  try {
    
    // 1. Categorías
    await queryDB(`
      INSERT INTO Categoria (nombre, limite_diario) VALUES
      ('General', 1000),
      ('Premium', 5000),
      ('Ilimitada', 999999);
    `);

    
    // 2. Mercados
    await queryDB(`
      INSERT INTO Mercado (nombre, estado) VALUES
      ('NYSE', 'Activo'),
      ('NASDAQ', 'Activo'),
      ('BME', 'Activo');
    `);

    
    // 3. Usuarios
    await queryDB(`
      INSERT INTO Usuario (alias, nombre, direccion, pais_origen, telefono, correo, contrasena_hash, rol, estado) VALUES
      ('admin1', N'Administrador General', N'San José', N'Costa Rica', N'8888-8888', 'admin@example.com', 'hash_admin', 'Admin', 'Activo'),
      ('trader1', N'Juan Pérez', N'Heredia', N'Costa Rica', N'7777-7777', 'trader1@example.com', 'hash_trader1', 'Trader', 'Activo'),
      ('trader2', N'Ana Rodríguez', N'Alajuela', N'Costa Rica', N'6666-6666', 'trader2@example.com', 'hash_trader2', 'Trader', 'Activo'),
      ('analista1', N'María Gómez', N'Cartago', N'Costa Rica', N'5555-5555', 'analista1@example.com', 'hash_analista1', 'Analista', 'Activo');
    `);

    
    // 4. Wallets
    await queryDB(`
      INSERT INTO Wallet (usuario_id, saldo, categoria_id, consumo_diario) VALUES
      (1, 50000, 3, 0), -- Admin
      (2, 15000, 2, 0), -- Trader1
      (3, 8000, 1, 0),  -- Trader2
      (4, 3000, 1, 0);  -- Analista
    `);

    
    // 5. Empresas
    await queryDB(`
      INSERT INTO Empresa (nombre, mercado_id, ticker, cantidad_acciones_totales, acciones_disponibles, precio_accion, capitalizacion) VALUES
      (N'Apple Inc.', 2, 'AAPL', 1000000, 600000, 180.50, 180500000),
      (N'Microsoft Corp.', 2, 'MSFT', 2000000, 1400000, 310.20, 620400000),
      (N'Tesla Inc.', 2, 'TSLA', 1500000, 1000000, 250.10, 375150000),
      (N'Coca-Cola', 1, 'KO', 1200000, 700000, 60.25, 72300000),
      (N'JP Morgan', 1, 'JPM', 1800000, 1200000, 140.80, 253440000),
      (N'Iberdrola', 3, 'IBE', 900000, 700000, 12.30, 11070000),
      (N'Santander', 3, 'SAN', 1000000, 800000, 3.75, 3750000);
    `);

    
    // 6. Sectores
    await queryDB(`
      INSERT INTO Sector (nombre) VALUES
      ('Tecnología'),
      ('Energía'),
      ('Finanzas'),
      ('Consumo'),
      ('Salud');
    `);

    
    // 7. Empresa_Sector
    await queryDB(`
      INSERT INTO Empresa_Sector (empresa_id, sector_id) VALUES
      (1, 1), -- Apple -> Tecnología
      (2, 1), -- Microsoft -> Tecnología
      (3, 1), -- Tesla -> Tecnología
      (4, 4), -- Coca-Cola -> Consumo
      (5, 3), -- JP Morgan -> Finanzas
      (6, 2), -- Iberdrola -> Energía
      (7, 3); -- Santander -> Finanzas
    `);

    
    // 8. Usuario_Mercado
    await queryDB(`
      INSERT INTO Usuario_Mercado (usuario_id, mercado_id, habilitado_por) VALUES
      (2, 2, 1), -- Trader1 habilitado en NASDAQ
      (2, 1, 1), -- Trader1 habilitado en NYSE
      (3, 3, 1), -- Trader2 habilitado en BME
      (4, 2, 1); -- Analista en NASDAQ
    `);

    
    // 9. Recargas
    await queryDB(`
      INSERT INTO Recarga (wallet_id, monto) VALUES
      (2, 5000),
      (3, 2000),
      (4, 1000);
    `);

    
    // 10. Precios Históricos (últimos 5 días)
    const precios = [
      { empresa_id: 1, base: 180.5 }, // Apple
      { empresa_id: 2, base: 310.2 }, // Microsoft
      { empresa_id: 3, base: 250.1 }, // Tesla
      { empresa_id: 4, base: 60.25 }, // Coca-Cola
      { empresa_id: 5, base: 140.8 }, // JP Morgan
      { empresa_id: 6, base: 12.3 }, // Iberdrola
      { empresa_id: 7, base: 3.75 }  // Santander
    ];

    const today = new Date();
    for (let d = 0; d < 5; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      const ts = date.toISOString().slice(0, 19).replace('T', ' ');

      for (const p of precios) {
        const variacion = (Math.random() - 0.5) * 0.05 * p.base;
        const precio = (p.base + variacion).toFixed(2);
        await queryDB(`
          INSERT INTO Precio_Historico (empresa_id, ts_utc, precio)
          VALUES (${p.empresa_id}, '${ts}', ${precio});
        `);
      }
    }

    // 11. Posiciones iniciales
    await queryDB(`
      INSERT INTO Posicion (usuario_id, empresa_id, cantidad, costo_promedio) VALUES
      (2, 1, 50, 178.00), -- Trader1 tiene 50 Apple
      (2, 3, 20, 240.00), -- Trader1 tiene 20 Tesla
      (3, 6, 100, 11.50); -- Trader2 tiene 100 Iberdrola
    `);

    // 12. Operaciones recientes
    await queryDB(`
      INSERT INTO Operacion (usuario_id, empresa_id, lado, cantidad, precio, nota) VALUES
      (2, 1, 'B', 50, 178.00, N'Compra inicial Apple'),
      (2, 3, 'B', 20, 240.00, N'Compra Tesla'),
      (3, 6, 'B', 100, 11.50, N'Compra Iberdrola'),
      (2, 1, 'S', 10, 182.00, N'Venta parcial Apple');
    `);

    // 13. Acciones (resumen)
    await queryDB(`
      INSERT INTO Acciones (id_usuario, id_empresa, acciones, valor) VALUES
      (2, 1, 40, 180.50*40), -- Trader1 mantiene 40 Apple
      (2, 3, 20, 250.10*20), -- Trader1 Tesla
      (3, 6, 100, 12.30*100); -- Trader2 Iberdrola
    `);

    // 14. Configuración App
    await queryDB(`
      INSERT INTO App_Setting (clave, valor) VALUES
      ('version', N'1.0.0'),
      ('modo', N'desarrollo'),
      ('max_operaciones_diarias', N'100');
    `);

    console.log('Datos semilla insertados');
  } catch (err) {
    console.error('Error insertando datos semilla:', err);
    throw err;
  }
}
(async () => {
  await seedData();
  console.log("Datos de prueba insertados");
  process.exit(0);
})();