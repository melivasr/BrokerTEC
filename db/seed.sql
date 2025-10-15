-- ===============================
-- Mercados
-- ===============================
INSERT INTO Mercado (id, nombre) VALUES
(NEWID(), 'NASDAQ'),
(NEWID(), 'NYSE'),
(NEWID(), 'LSE'),
(NEWID(), 'TSX'),
(NEWID(), 'JPX');

-- IDs para FK
DECLARE @id_nasdaq UNIQUEIDENTIFIER = (SELECT id FROM Mercado WHERE nombre='NASDAQ');
DECLARE @id_nyse UNIQUEIDENTIFIER   = (SELECT id FROM Mercado WHERE nombre='NYSE');
DECLARE @id_lse UNIQUEIDENTIFIER    = (SELECT id FROM Mercado WHERE nombre='LSE');
DECLARE @id_tsx UNIQUEIDENTIFIER    = (SELECT id FROM Mercado WHERE nombre='TSX');
DECLARE @id_jpx UNIQUEIDENTIFIER    = (SELECT id FROM Mercado WHERE nombre='JPX');

-- ===============================
-- Empresas
-- ===============================
INSERT INTO Empresa (id, id_mercado, nombre, ticker) VALUES
-- NASDAQ
(NEWID(), @id_nasdaq, 'Apple Inc.', 'AAPL  '),
(NEWID(), @id_nasdaq, 'Microsoft Corp.', 'MSFT  '),
(NEWID(), @id_nasdaq, 'Tesla Inc.', 'TSLA  '),
(NEWID(), @id_nasdaq, 'Amazon.com', 'AMZN  '),
(NEWID(), @id_nasdaq, 'Alphabet Inc.', 'GOOGL '),

-- NYSE
(NEWID(), @id_nyse, 'Ford Motor Co.', 'F     '),
(NEWID(), @id_nyse, 'General Electric', 'GE    '),
(NEWID(), @id_nyse, 'Coca-Cola', 'KO    '),
(NEWID(), @id_nyse, 'IBM', 'IBM   '),
(NEWID(), @id_nyse, 'PepsiCo', 'PEP   '),

-- LSE
(NEWID(), @id_lse, 'BP PLC', 'BP    '),
(NEWID(), @id_lse, 'HSBC Holdings', 'HSBC  '),
(NEWID(), @id_lse, 'Unilever', 'ULVR  '),
(NEWID(), @id_lse, 'Barclays', 'BARC  '),
(NEWID(), @id_lse, 'GlaxoSmithKline', 'GSK   '),

-- TSX
(NEWID(), @id_tsx, 'Shopify', 'SHOP  '),
(NEWID(), @id_tsx, 'Royal Bank of Canada', 'RY    '),
(NEWID(), @id_tsx, 'TD Bank', 'TD    '),
(NEWID(), @id_tsx, 'Enbridge', 'ENB   '),
(NEWID(), @id_tsx, 'BCE Inc.', 'BCE   '),

-- JPX
(NEWID(), @id_jpx, 'Toyota Motor', '7203  '),
(NEWID(), @id_jpx, 'Sony Corp.', '6758  '),
(NEWID(), @id_jpx, 'Nintendo', '7974  '),
(NEWID(), @id_jpx, 'SoftBank', '9984  '),
(NEWID(), @id_jpx, 'Mitsubishi UFJ', '8306  ');

-- ===============================
-- Billeteras
-- ===============================
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

-- ===============================
-- Portafolios (1 por empresa por usuario)
-- ===============================
INSERT INTO Portafolio (id, id_empresa, acciones) VALUES
-- Ejemplo para algunos usuarios
(NEWID(), (SELECT TOP 1 id FROM Empresa WHERE nombre='Apple Inc.'), 50),
(NEWID(), (SELECT TOP 1 id FROM Empresa WHERE nombre='Microsoft Corp.'), 30),
(NEWID(), (SELECT TOP 1 id FROM Empresa WHERE nombre='Tesla Inc.'), 40),
(NEWID(), (SELECT TOP 1 id FROM Empresa WHERE nombre='Ford Motor Co.'), 100),
(NEWID(), (SELECT TOP 1 id FROM Empresa WHERE nombre='BP PLC'), 200);

-- ===============================
-- Usuarios
-- ===============================
INSERT INTO Usuario (id, id_billetera, id_portafolio, nombre, alias, habilitado, direccion, pais_origen, telefono, correo, rol, contrasena_hash) VALUES
-- Traders
(NEWID(), (SELECT TOP 1 id FROM Billetera WHERE categoria='Junior'), (SELECT TOP 1 id FROM Portafolio WHERE acciones=50), 'Juan Pérez', 'juanp', 1, 'San José, Costa Rica', 'Costa Rica', '+50688889999', 'juan@example.com', 'Trader', 'hash1'),
(NEWID(), (SELECT TOP 1 id FROM Billetera WHERE categoria='Junior'), (SELECT TOP 1 id FROM Portafolio WHERE acciones=30), 'Ana Gómez', 'anag', 1, 'Alajuela, Costa Rica', 'Costa Rica', '+50687771122', 'ana@example.com', 'Trader', 'hash2'),
(NEWID(), (SELECT TOP 1 id FROM Billetera WHERE categoria='Mid'), (SELECT TOP 1 id FROM Portafolio WHERE acciones=40), 'Luis Fernández', 'luisf', 1, 'Heredia, Costa Rica', 'Costa Rica', '+50686662233', 'luis@example.com', 'Trader', 'hash3'),

-- Analistas
(NEWID(), (SELECT TOP 1 id FROM Billetera WHERE categoria='Mid'), NULL, 'María López', 'marial', 1, 'Alajuela, Costa Rica', 'Costa Rica', '+50687776655', 'maria@example.com', 'Analista', 'hash4'),
(NEWID(), (SELECT TOP 1 id FROM Billetera WHERE categoria='Mid'), NULL, 'Carlos Ruiz', 'carlosr', 1, 'Heredia, Costa Rica', 'Costa Rica', '+50686663344', 'carlos@example.com', 'Analista', 'hash5'),

-- Admins
(NEWID(), (SELECT TOP 1 id FROM Billetera WHERE categoria='Senior'), NULL, 'Carmen Soto', 'carmens', 1, 'San José, Costa Rica', 'Costa Rica', '+50685554433', 'carmen@example.com', 'Admin', 'hash6'),
(NEWID(), (SELECT TOP 1 id FROM Billetera WHERE categoria='Senior'), NULL, 'Diego Vargas', 'diegov', 1, 'Alajuela, Costa Rica', 'Costa Rica', '+50684443322', 'diego@example.com', 'Admin', 'hash7');

-- ===============================
-- Mercado_Habilitado
-- ===============================
-- Asignar usuarios a mercados aleatoriamente
INSERT INTO Mercado_Habilitado (id_mercado, id_usuario) VALUES
(@id_nasdaq, (SELECT id FROM Usuario WHERE alias='juanp')),
(@id_nasdaq, (SELECT id FROM Usuario WHERE alias='marial')),
(@id_nyse,   (SELECT id FROM Usuario WHERE alias='carlosr')),
(@id_lse,   (SELECT id FROM Usuario WHERE alias='carmens')),
(@id_tsx,   (SELECT id FROM Usuario WHERE alias='diegov')),
(@id_jpx,   (SELECT id FROM Usuario WHERE alias='luisf'));

-- ===============================
-- Inventario
-- ===============================
INSERT INTO Inventario (id_empresa, acciones_totales, acciones_disponibles, precio) VALUES
((SELECT id FROM Empresa WHERE nombre='Apple Inc.'), 1000, 500, 150.00),
((SELECT id FROM Empresa WHERE nombre='Microsoft Corp.'), 2000, 1500, 280.50),
((SELECT id FROM Empresa WHERE nombre='Tesla Inc.'), 1500, 700, 800.00),
((SELECT id FROM Empresa WHERE nombre='Ford Motor Co.'), 5000, 3000, 12.75),
((SELECT id FROM Empresa WHERE nombre='BP PLC'), 8000, 4000, 5.60);
-- INSERT INTO Inventario (id_empresa, acciones_totales, acciones_disponibles, precio)
-- SELECT id, 1000, 500, 150.00 FROM Empresa WHERE nombre='Apple Inc.';
-- 
-- INSERT INTO Inventario (id_empresa, acciones_totales, acciones_disponibles, precio)
-- SELECT id, 2000, 1500, 280.50 FROM Empresa WHERE nombre='Microsoft Corp.';
-- 
-- INSERT INTO Inventario (id_empresa, acciones_totales, acciones_disponibles, precio)
-- SELECT id, 1500, 700, 800.00 FROM Empresa WHERE nombre='Tesla Inc.';
-- 
-- INSERT INTO Inventario (id_empresa, acciones_totales, acciones_disponibles, precio)
-- SELECT id, 5000, 3000, 12.75 FROM Empresa WHERE nombre='Ford Motor Co.';
-- 
-- INSERT INTO Inventario (id_empresa, acciones_totales, acciones_disponibles, precio)
-- SELECT id, 8000, 4000, 5.60 FROM Empresa WHERE nombre='BP PLC';
