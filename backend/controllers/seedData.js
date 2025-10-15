// seedData.js
import bcrypt from "bcryptjs";
import { queryDB } from "../config/db.js";

async function seedData() {
  try {
    console.log("🌱 Iniciando inserción de datos iniciales...");

    // === 1. MERCADOS ===
    await queryDB(`
      INSERT INTO Mercado (id, nombre) VALUES
        (NEWID(), 'NASDAQ'),
        (NEWID(), 'NYSE'),
        (NEWID(), 'LSE'),
        (NEWID(), 'TSX'),
        (NEWID(), 'JPX');
    `);
    console.log("✅ Datos insertados en Mercado");

    // Obtener los IDs de los mercados
    const mercados = await queryDB(`SELECT id, nombre FROM Mercado`);
    const id_nasdaq = mercados.find(m => m.nombre === 'NASDAQ').id;
    const id_nyse  = mercados.find(m => m.nombre === 'NYSE').id;
    const id_lse   = mercados.find(m => m.nombre === 'LSE').id;
    const id_tsx   = mercados.find(m => m.nombre === 'TSX').id;
    const id_jpx   = mercados.find(m => m.nombre === 'JPX').id;

    // === 2. EMPRESAS ===
    await queryDB(`
      INSERT INTO Empresa (id, id_mercado, nombre, ticker) VALUES
      -- NASDAQ
      (NEWID(), '${id_nasdaq}', 'Apple Inc.', 'AAPL  '),
      (NEWID(), '${id_nasdaq}', 'Microsoft Corp.', 'MSFT  '),
      (NEWID(), '${id_nasdaq}', 'Tesla Inc.', 'TSLA  '),
      (NEWID(), '${id_nasdaq}', 'Amazon.com', 'AMZN  '),
      (NEWID(), '${id_nasdaq}', 'Alphabet Inc.', 'GOOGL '),

      -- NYSE
      (NEWID(), '${id_nyse}', 'Ford Motor Co.', 'F     '),
      (NEWID(), '${id_nyse}', 'General Electric', 'GE    '),
      (NEWID(), '${id_nyse}', 'Coca-Cola', 'KO    '),
      (NEWID(), '${id_nyse}', 'IBM', 'IBM   '),
      (NEWID(), '${id_nyse}', 'PepsiCo', 'PEP   '),

      -- LSE
      (NEWID(), '${id_lse}', 'BP PLC', 'BP    '),
      (NEWID(), '${id_lse}', 'HSBC Holdings', 'HSBC  '),
      (NEWID(), '${id_lse}', 'Unilever', 'ULVR  '),
      (NEWID(), '${id_lse}', 'Barclays', 'BARC  '),
      (NEWID(), '${id_lse}', 'GlaxoSmithKline', 'GSK   '),

      -- TSX
      (NEWID(), '${id_tsx}', 'Shopify', 'SHOP  '),
      (NEWID(), '${id_tsx}', 'Royal Bank of Canada', 'RY    '),
      (NEWID(), '${id_tsx}', 'TD Bank', 'TD    '),
      (NEWID(), '${id_tsx}', 'Enbridge', 'ENB   '),
      (NEWID(), '${id_tsx}', 'BCE Inc.', 'BCE   '),

      -- JPX
      (NEWID(), '${id_jpx}', 'Toyota Motor', '7203  '),
      (NEWID(), '${id_jpx}', 'Sony Corp.', '6758  '),
      (NEWID(), '${id_jpx}', 'Nintendo', '7974  '),
      (NEWID(), '${id_jpx}', 'SoftBank', '9984  '),
      (NEWID(), '${id_jpx}', 'Mitsubishi UFJ', '8306  ');
    `);
    console.log("✅ Datos insertados en Empresa");

    // === 3. BILLETERAS ===
    await queryDB(`
      INSERT INTO Billetera (id, categoria, fondos, limite_diario, consumo) VALUES
      -- Junior
      (NEWID(), 'Junior', 1000.00, 500.00, 0.00),
      (NEWID(), 'Junior', 1200.00, 600.00, 0.00),
      (NEWID(), 'Junior', 800.00, 400.00, 0.00),

      -- Mid
      (NEWID(), 'Mid', 5000.00, 2000.00, 0.00),
      (NEWID(), 'Mid', 6000.00, 2500.00, 0.00),
      (NEWID(), 'Mid', 5500.00, 2200.00, 0.00),

      -- Senior
      (NEWID(), 'Senior', 20000.00, 10000.00, 0.00),
      (NEWID(), 'Senior', 18000.00, 9000.00, 0.00),
      (NEWID(), 'Senior', 22000.00, 11000.00, 0.00);
    `);
    console.log("✅ Datos insertados en Billetera");

    // === 4. PORTAFOLIOS ===
    await queryDB(`
      INSERT INTO Portafolio (id, id_empresa, acciones) VALUES
      -- Ejemplo para algunos usuarios
      (NEWID(), (SELECT TOP 1 id FROM Empresa WHERE nombre='Apple Inc.'), 50),
      (NEWID(), (SELECT TOP 1 id FROM Empresa WHERE nombre='Microsoft Corp.'), 30),
      (NEWID(), (SELECT TOP 1 id FROM Empresa WHERE nombre='Tesla Inc.'), 40),
      (NEWID(), (SELECT TOP 1 id FROM Empresa WHERE nombre='Ford Motor Co.'), 100),
      (NEWID(), (SELECT TOP 1 id FROM Empresa WHERE nombre='BP PLC'), 200);
    `);
    console.log("✅ Datos insertados en Portafolio");

    // === 5. USUARIOS ===
    const password1 = await bcrypt.hash("password123", 10);
    const password2 = await bcrypt.hash("password456", 10);
    const password3 = await bcrypt.hash("password789", 10);
    const password4 = await bcrypt.hash("analyst123", 10);
    const password5 = await bcrypt.hash("analyst456", 10);
    const password6 = await bcrypt.hash("admin123", 10);
    const password7 = await bcrypt.hash("admin456", 10);

    await queryDB(`
      INSERT INTO Usuario (id, id_billetera, id_portafolio, nombre, alias, habilitado, direccion, pais_origen, telefono, correo, rol, contrasena_hash) VALUES
      -- Traders
      (NEWID(), (SELECT TOP 1 id FROM Billetera WHERE categoria='Junior'), (SELECT TOP 1 id FROM Portafolio WHERE acciones=50), 'Juan Pérez', 'juanp', 1, 'San José, Costa Rica', 'Costa Rica', '+50688889999', 'juan@example.com', 'Trader', @hash1),
      (NEWID(), (SELECT TOP 1 id FROM Billetera WHERE categoria='Junior'), (SELECT TOP 1 id FROM Portafolio WHERE acciones=30), 'Ana Gómez', 'anag', 1, 'Alajuela, Costa Rica', 'Costa Rica', '+50687771122', 'ana@example.com', 'Trader', @hash2),
      (NEWID(), (SELECT TOP 1 id FROM Billetera WHERE categoria='Mid'), (SELECT TOP 1 id FROM Portafolio WHERE acciones=40), 'Luis Fernández', 'luisf', 1, 'Heredia, Costa Rica', 'Costa Rica', '+50686662233', 'luis@example.com', 'Trader', @hash3),

      -- Analistas
      (NEWID(), (SELECT TOP 1 id FROM Billetera WHERE categoria='Mid'), NULL, 'María López', 'marial', 1, 'Alajuela, Costa Rica', 'Costa Rica', '+50687776655', 'maria@example.com', 'Analista', @hash4),
      (NEWID(), (SELECT TOP 1 id FROM Billetera WHERE categoria='Mid'), NULL, 'Carlos Ruiz', 'carlosr', 1, 'Heredia, Costa Rica', 'Costa Rica', '+50686663344', 'carlos@example.com', 'Analista', @hash5),

      -- Admins
      (NEWID(), (SELECT TOP 1 id FROM Billetera WHERE categoria='Senior'), NULL, 'Carmen Soto', 'carmens', 1, 'San José, Costa Rica', 'Costa Rica', '+50685554433', 'carmen@example.com', 'Admin', @hash6),
      (NEWID(), (SELECT TOP 1 id FROM Billetera WHERE categoria='Senior'), NULL, 'Diego Vargas', 'diegov', 1, 'Alajuela, Costa Rica', 'Costa Rica', '+50684443322', 'diego@example.com', 'Admin', @hash7);
    `, {
      hash1: password1,
      hash2: password2,
      hash3: password3,
      hash4: password4,
      hash5: password5,
      hash6: password6,
      hash7: password7,
    });

    console.log("✅ Datos insertados en Usuario");

    // === 6. Mercado_Habilitado ===
    // Obtener los IDs de los usuarios
    const usuarios = await queryDB(`SELECT id, alias FROM Usuario`);
    const id_juanp = usuarios.find(u => u.alias === 'juanp').id;
    const id_marial = usuarios.find(u => u.alias === 'marial').id;
    const id_carlosr = usuarios.find(u => u.alias === 'carlosr').id;
    const id_carmens = usuarios.find(u => u.alias === 'carmens').id;
    const id_diegov = usuarios.find(u => u.alias === 'diegov').id;
    const id_luisf = usuarios.find(u => u.alias === 'luisf').id;

    await queryDB(`
      INSERT INTO Mercado_Habilitado (id_mercado, id_usuario) VALUES
        ('${id_nasdaq}', '${id_juanp}'),
        ('${id_nasdaq}', '${id_marial}'),
        ('${id_nyse}',   '${id_carlosr}'),
        ('${id_lse}',   '${id_carmens}'),
        ('${id_tsx}',   '${id_diegov}'),
        ('${id_jpx}',   '${id_luisf}');
    `);
    console.log("✅ Datos insertados en Mercado_Habilitado");

    // === 7. INVENTARIO ===
    // Obtener los IDs de las empresas
    const empresas = await queryDB(`SELECT id, nombre FROM Empresa`);
    const id_apple = empresas.find(e => e.nombre === 'Apple Inc.').id;
    const id_microsoft = empresas.find(e => e.nombre === 'Microsoft Corp.').id;
    const id_tesla = empresas.find(e => e.nombre === 'Tesla Inc.').id;
    const id_ford = empresas.find(e => e.nombre === 'Ford Motor Co.').id;
    const id_bp = empresas.find(e => e.nombre === 'BP PLC').id;

    await queryDB(`
      INSERT INTO Inventario (id_empresa, acciones_totales, acciones_disponibles, precio) VALUES
      ('${id_apple}', 1000, 500, 150.00),
      ('${id_microsoft}', 2000, 1500, 280.50),
      ('${id_tesla}', 1500, 700, 800.00),
      ('${id_ford}', 5000, 3000, 12.75),
      ('${id_bp}', 8000, 4000, 5.60)
    `);
    console.log("✅ Datos insertados en Inventario");

    console.log("\n🌟 Inserción completada con éxito.");
  } catch (error) {
    console.error("❌ Error durante la inserción de datos:", error);
  }
}

// Ejecutar directamente si se llama con `node seedData.js`
seedData();
