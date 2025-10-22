<<<<<<< HEAD
import { queryDB } from '../config/db.js';
import bcrypt from 'bcryptjs';
=======
import bcrypt from "bcryptjs";
import { queryDB } from "../config/db.js";
>>>>>>> develop

export default async function seedData() {
  try {
    console.log("Iniciando inserción de datos iniciales...");

    //  MERCADOS 
    await queryDB(`
      INSERT INTO Mercado (id, nombre) VALUES
        (NEWID(), 'NASDAQ'),
        (NEWID(), 'NYSE'),
        (NEWID(), 'LSE'),
        (NEWID(), 'TSX'),
        (NEWID(), 'JPX');
    `);
    console.log("Datos insertados en Mercado");

    const mercados = await queryDB(`SELECT id, nombre FROM Mercado`);
    const id_nasdaq = mercados.find(m => m.nombre === 'NASDAQ').id;
    const id_nyse  = mercados.find(m => m.nombre === 'NYSE').id;
    const id_lse   = mercados.find(m => m.nombre === 'LSE').id;
    const id_tsx   = mercados.find(m => m.nombre === 'TSX').id;
    const id_jpx   = mercados.find(m => m.nombre === 'JPX').id;

    // EMPRESAS 
    await queryDB(`
      INSERT INTO Empresa (id, id_mercado, nombre, ticker) VALUES
      (NEWID(), '${id_nasdaq}', 'Apple Inc.', 'AAPL  '),
      (NEWID(), '${id_nasdaq}', 'Microsoft Corp.', 'MSFT  '),
      (NEWID(), '${id_nasdaq}', 'Tesla Inc.', 'TSLA  '),
      (NEWID(), '${id_nasdaq}', 'Amazon.com', 'AMZN  '),
      (NEWID(), '${id_nasdaq}', 'Alphabet Inc.', 'GOOGL '),
      (NEWID(), '${id_nyse}', 'Ford Motor Co.', 'F     '),
      (NEWID(), '${id_nyse}', 'General Electric', 'GE    '),
      (NEWID(), '${id_nyse}', 'Coca-Cola', 'KO    '),
      (NEWID(), '${id_nyse}', 'IBM', 'IBM   '),
      (NEWID(), '${id_nyse}', 'PepsiCo', 'PEP   '),
      (NEWID(), '${id_lse}', 'BP PLC', 'BP    '),
      (NEWID(), '${id_lse}', 'HSBC Holdings', 'HSBC  '),
      (NEWID(), '${id_lse}', 'Unilever', 'ULVR  '),
      (NEWID(), '${id_lse}', 'Barclays', 'BARC  '),
      (NEWID(), '${id_lse}', 'GlaxoSmithKline', 'GSK   '),
      (NEWID(), '${id_tsx}', 'Shopify', 'SHOP  '),
      (NEWID(), '${id_tsx}', 'Royal Bank of Canada', 'RY    '),
      (NEWID(), '${id_tsx}', 'TD Bank', 'TD    '),
      (NEWID(), '${id_tsx}', 'Enbridge', 'ENB   '),
      (NEWID(), '${id_tsx}', 'BCE Inc.', 'BCE   '),
      (NEWID(), '${id_jpx}', 'Toyota Motor', '7203  '),
      (NEWID(), '${id_jpx}', 'Sony Corp.', '6758  '),
      (NEWID(), '${id_jpx}', 'Nintendo', '7974  '),
      (NEWID(), '${id_jpx}', 'SoftBank', '9984  '),
      (NEWID(), '${id_jpx}', 'Mitsubishi UFJ', '8306  ');
    `);
    console.log("Datos insertados en Empresa");

    //BILLETERAS
    await queryDB(`
      INSERT INTO Billetera (id, categoria, fondos, limite_diario, consumo) VALUES
      (NEWID(), 'Junior', 10000.00, 5000.00, 0.00),
      (NEWID(), 'Junior', 12000.00, 6000.00, 0.00),
      (NEWID(), 'Junior', 8000.00, 4000.00, 0.00),
      (NEWID(), 'Mid', 50000.00, 20000.00, 0.00),
      (NEWID(), 'Mid', 60000.00, 25000.00, 0.00),
      (NEWID(), 'Mid', 55000.00, 22000.00, 0.00),
      (NEWID(), 'Senior', 200000.00, 100000.00, 0.00),
      (NEWID(), 'Senior', 180000.00, 90000.00, 0.00),
      (NEWID(), 'Senior', 220000.00, 110000.00, 0.00);
    `);
    console.log("Datos insertados en Billetera");

    // PORTAFOLIOS
    const empresas = await queryDB(`SELECT id, nombre FROM Empresa`);
    const id_apple = empresas.find(e => e.nombre === 'Apple Inc.').id;
    const id_microsoft = empresas.find(e => e.nombre === 'Microsoft Corp.').id;
    const id_tesla = empresas.find(e => e.nombre === 'Tesla Inc.').id;
    const id_ford = empresas.find(e => e.nombre === 'Ford Motor Co.').id;
    const id_bp = empresas.find(e => e.nombre === 'BP PLC').id;

    await queryDB(`
      INSERT INTO Portafolio (id, id_empresa, acciones) VALUES
      (NEWID(), '${id_apple}', 50),
      (NEWID(), '${id_microsoft}', 30),
      (NEWID(), '${id_tesla}', 40),
      (NEWID(), '${id_ford}', 100),
      (NEWID(), '${id_bp}', 200);
    `);
    console.log("Datos insertados en Portafolio");

    // USUARIOS
    const password1 = await bcrypt.hash("password123", 10);
    const password2 = await bcrypt.hash("password456", 10);
    const password3 = await bcrypt.hash("password789", 10);
    const password4 = await bcrypt.hash("analyst123", 10);
    const password5 = await bcrypt.hash("analyst456", 10);
    const password6 = await bcrypt.hash("admin123", 10);
    const password7 = await bcrypt.hash("admin456", 10);

    const billeterasList = await queryDB(`SELECT id, categoria FROM Billetera ORDER BY categoria`);

    const bill_junior1 = billeterasList.find(b => b.categoria === 'Junior');
    const bill_junior2 = billeterasList.filter(b => b.categoria === 'Junior')[1];
    const bill_junior3 = billeterasList.filter(b => b.categoria === 'Junior')[2];
    const bill_mid1 = billeterasList.find(b => b.categoria === 'Mid');
    const bill_mid2 = billeterasList.filter(b => b.categoria === 'Mid')[1];
    const bill_mid3 = billeterasList.filter(b => b.categoria === 'Mid')[2];
    const bill_senior1 = billeterasList.find(b => b.categoria === 'Senior');
    const bill_senior2 = billeterasList.filter(b => b.categoria === 'Senior')[1];
    const bill_senior3 = billeterasList.filter(b => b.categoria === 'Senior')[2];


    await queryDB(`
      INSERT INTO Usuario (id, id_billetera, id_portafolio, nombre, alias, habilitado, direccion, pais_origen, telefono, correo, rol, contrasena_hash) VALUES
      (NEWID(), (SELECT TOP 1 id FROM Billetera WHERE categoria='Junior' AND fondos=10000), (SELECT TOP 1 id FROM Portafolio WHERE acciones=50), 'Juan Pérez', 'juanp', 1, 'San José, Costa Rica', 'Costa Rica', '+50688889999', 'juan@example.com', 'Trader', @hash1),
      (NEWID(), (SELECT TOP 1 id FROM Billetera WHERE categoria='Junior' AND fondos=12000), (SELECT TOP 1 id FROM Portafolio WHERE acciones=30), 'Ana Gómez', 'anag', 1, 'Alajuela, Costa Rica', 'Costa Rica', '+50687771122', 'ana@example.com', 'Trader', @hash2),
      (NEWID(), (SELECT TOP 1 id FROM Billetera WHERE categoria='Mid' AND fondos=50000), (SELECT TOP 1 id FROM Portafolio WHERE acciones=40), 'Luis Fernández', 'luisf', 1, 'Heredia, Costa Rica', 'Costa Rica', '+50686662233', 'luis@example.com', 'Trader', @hash3),
      (NEWID(), (SELECT TOP 1 id FROM Billetera WHERE categoria='Mid' AND fondos=60000), NULL, 'María López', 'marial', 1, 'Alajuela, Costa Rica', 'Costa Rica', '+50687776655', 'maria@example.com', 'Analista', @hash4),
      (NEWID(), (SELECT TOP 1 id FROM Billetera WHERE categoria='Mid' AND fondos=55000), NULL, 'Carlos Ruiz', 'carlosr', 1, 'Heredia, Costa Rica', 'Costa Rica', '+50686663344', 'carlos@example.com', 'Analista', @hash5),
      (NEWID(), (SELECT TOP 1 id FROM Billetera WHERE categoria='Senior' AND fondos=200000), NULL, 'Carmen Soto', 'carmens', 1, 'San José, Costa Rica', 'Costa Rica', '+50685554433', 'carmen@example.com', 'Admin', @hash6),
      (NEWID(), (SELECT TOP 1 id FROM Billetera WHERE categoria='Senior' AND fondos=180000), NULL, 'Diego Vargas', 'diegov', 1, 'Alajuela, Costa Rica', 'Costa Rica', '+50684443322', 'diego@example.com', 'Admin', @hash7);
    `, {
      hash1: password1,
      hash2: password2,
      hash3: password3,
      hash4: password4,
      hash5: password5,
      hash6: password6,
      hash7: password7,
    });
    console.log("Datos insertados en Usuario");

    //  Mercado_Habilitado 
    const usuarios = await queryDB(`SELECT id, alias FROM Usuario`);
    const id_juanp = usuarios.find(u => u.alias === 'juanp').id;
    const id_marial = usuarios.find(u => u.alias === 'marial').id;
    const id_carlosr = usuarios.find(u => u.alias === 'carlosr').id;
    const id_carmens = usuarios.find(u => u.alias === 'carmens').id;
    const id_diegov = usuarios.find(u => u.alias === 'diegov').id;
    const id_luisf = usuarios.find(u => u.alias === 'luisf').id;
    const id_anag = usuarios.find(u => u.alias === 'anag').id;

    await queryDB(`
      INSERT INTO Mercado_Habilitado (id_mercado, id_usuario) VALUES
        ('${id_nasdaq}', '${id_juanp}'),
        ('${id_nasdaq}', '${id_anag}'),
        ('${id_nasdaq}', '${id_marial}'),
        ('${id_nyse}', '${id_carlosr}'),
        ('${id_lse}', '${id_carmens}'),
        ('${id_tsx}', '${id_diegov}'),
        ('${id_jpx}', '${id_luisf}');
    `);
    console.log("Datos insertados en Mercado_Habilitado");

    //  INVENTARIO 
    await queryDB(`
      INSERT INTO Inventario (id_empresa, acciones_totales, acciones_disponibles, precio) VALUES
      ('${id_apple}', 1000, 920, 150.00),
      ('${id_microsoft}', 2000, 1940, 280.50),
      ('${id_tesla}', 1500, 1420, 800.00),
      ('${id_ford}', 5000, 4800, 12.75),
      ('${id_bp}', 8000, 7600, 5.60)
    `);
    console.log("Datos insertados en Inventario");

    //INVENTARIO_HISTORIAL 
    console.log("Insertando historial de precios...");
    
    // Apple - ultimos 30 dias
    await queryDB(`
      INSERT INTO Inventario_Historial (fecha, id_empresa, acciones_totales, acciones_disponibles, precio) VALUES
      (DATEADD(DAY, -30, GETDATE()), '${id_apple}', 1000, 950, 140.00),
      (DATEADD(DAY, -25, GETDATE()), '${id_apple}', 1000, 945, 142.50),
      (DATEADD(DAY, -20, GETDATE()), '${id_apple}', 1000, 940, 145.00),
      (DATEADD(DAY, -15, GETDATE()), '${id_apple}', 1000, 935, 147.00),
      (DATEADD(DAY, -10, GETDATE()), '${id_apple}', 1000, 930, 148.50),
      (DATEADD(DAY, -5, GETDATE()), '${id_apple}', 1000, 925, 149.00);
    `);

    // Microsoft
    await queryDB(`
      INSERT INTO Inventario_Historial (fecha, id_empresa, acciones_totales, acciones_disponibles, precio) VALUES
      (DATEADD(DAY, -30, GETDATE()), '${id_microsoft}', 2000, 1970, 270.00),
      (DATEADD(DAY, -25, GETDATE()), '${id_microsoft}', 2000, 1965, 272.50),
      (DATEADD(DAY, -20, GETDATE()), '${id_microsoft}', 2000, 1960, 275.00),
      (DATEADD(DAY, -15, GETDATE()), '${id_microsoft}', 2000, 1955, 277.00),
      (DATEADD(DAY, -10, GETDATE()), '${id_microsoft}', 2000, 1950, 278.50),
      (DATEADD(DAY, -5, GETDATE()), '${id_microsoft}', 2000, 1945, 279.50);
    `);

    // Tesla
    await queryDB(`
      INSERT INTO Inventario_Historial (fecha, id_empresa, acciones_totales, acciones_disponibles, precio) VALUES
      (DATEADD(DAY, -30, GETDATE()), '${id_tesla}', 1500, 1460, 750.00),
      (DATEADD(DAY, -25, GETDATE()), '${id_tesla}', 1500, 1450, 765.00),
      (DATEADD(DAY, -20, GETDATE()), '${id_tesla}', 1500, 1440, 780.00),
      (DATEADD(DAY, -15, GETDATE()), '${id_tesla}', 1500, 1435, 785.00),
      (DATEADD(DAY, -10, GETDATE()), '${id_tesla}', 1500, 1430, 790.00),
      (DATEADD(DAY, -5, GETDATE()), '${id_tesla}', 1500, 1425, 795.00);
    `);

    // Ford
    await queryDB(`
      INSERT INTO Inventario_Historial (fecha, id_empresa, acciones_totales, acciones_disponibles, precio) VALUES
      (DATEADD(DAY, -30, GETDATE()), '${id_ford}', 5000, 4900, 11.50),
      (DATEADD(DAY, -25, GETDATE()), '${id_ford}', 5000, 4870, 11.80),
      (DATEADD(DAY, -20, GETDATE()), '${id_ford}', 5000, 4850, 12.00),
      (DATEADD(DAY, -15, GETDATE()), '${id_ford}', 5000, 4830, 12.25),
      (DATEADD(DAY, -10, GETDATE()), '${id_ford}', 5000, 4820, 12.50),
      (DATEADD(DAY, -5, GETDATE()), '${id_ford}', 5000, 4810, 12.65);
    `);

    // BP
    await queryDB(`
      INSERT INTO Inventario_Historial (fecha, id_empresa, acciones_totales, acciones_disponibles, precio) VALUES
      (DATEADD(DAY, -30, GETDATE()), '${id_bp}', 8000, 7800, 5.20),
      (DATEADD(DAY, -25, GETDATE()), '${id_bp}', 8000, 7750, 5.30),
      (DATEADD(DAY, -20, GETDATE()), '${id_bp}', 8000, 7700, 5.40),
      (DATEADD(DAY, -15, GETDATE()), '${id_bp}', 8000, 7670, 5.45),
      (DATEADD(DAY, -10, GETDATE()), '${id_bp}', 8000, 7650, 5.50),
      (DATEADD(DAY, -5, GETDATE()), '${id_bp}', 8000, 7620, 5.55);
    `);

    console.log("Datos insertados en Inventario_Historial");

    // TRANSACCIONES 
    console.log("Insertando transacciones...");
    
    const portafolios = await queryDB(`SELECT id, id_empresa, acciones FROM Portafolio`);
    const billeteras = await queryDB(`SELECT id FROM Billetera`);
    
    const port_apple = portafolios.find(p => p.id_empresa === id_apple).id;
    const port_microsoft = portafolios.find(p => p.id_empresa === id_microsoft).id;
    const port_tesla = portafolios.find(p => p.id_empresa === id_tesla).id;
    const port_ford = portafolios.find(p => p.id_empresa === id_ford).id;
    const port_bp = portafolios.find(p => p.id_empresa === id_bp).id;
    
    const bill_juanp = billeteras[0].id;
    const bill_anag = billeteras[1].id;
    const bill_luisf = billeteras[2].id;

    await queryDB(`
      INSERT INTO Transaccion (id, alias, id_portafolio, id_billetera, id_empresa, tipo, precio, cantidad, fecha) VALUES
      (NEWID(), 'juanp', '${port_apple}', '${bill_juanp}', '${id_apple}', 'Compra', 140.00, 30, DATEADD(DAY, -28, GETDATE())),
      (NEWID(), 'juanp', '${port_apple}', '${bill_juanp}', '${id_apple}', 'Compra', 145.00, 20, DATEADD(DAY, -18, GETDATE())),
      (NEWID(), 'anag', '${port_microsoft}', '${bill_anag}', '${id_microsoft}', 'Compra', 270.00, 20, DATEADD(DAY, -27, GETDATE())),
      (NEWID(), 'anag', '${port_microsoft}', '${bill_anag}', '${id_microsoft}', 'Compra', 275.00, 10, DATEADD(DAY, -17, GETDATE())),
      (NEWID(), 'luisf', '${port_tesla}', '${bill_luisf}', '${id_tesla}', 'Compra', 750.00, 25, DATEADD(DAY, -26, GETDATE())),
      (NEWID(), 'luisf', '${port_tesla}', '${bill_luisf}', '${id_tesla}', 'Compra', 780.00, 15, DATEADD(DAY, -16, GETDATE())),
      (NEWID(), 'luisf', '${port_tesla}', '${bill_luisf}', '${id_tesla}', 'Venta', 790.00, 5, DATEADD(DAY, -8, GETDATE())),
      (NEWID(), 'juanp', '${port_apple}', '${bill_juanp}', '${id_apple}', 'Venta', 148.00, 10, DATEADD(DAY, -12, GETDATE())),
      (NEWID(), 'anag', '${port_microsoft}', '${bill_anag}', '${id_microsoft}', 'Venta', 278.00, 5, DATEADD(DAY, -10, GETDATE()));
    `);

    console.log("Datos insertados en Transaccion");

    console.log("\nInsercion completada con exito!");
    console.log("   Traders: juanp, anag, luisf (password: password123, password456, password789)");
    console.log("   Analistas: marial, carlosr (password: analyst123, analyst456)");
    console.log("   Admins: carmens, diegov (password: admin123, admin456)");
    
  } catch (error) {
    console.error("Error durante la insercion de datos:", error);
  }
}

