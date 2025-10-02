-- ============================================================
-- SEED DATA
-- ============================================================

-- Categorías
INSERT INTO Categoria (nombre, limite_diario) VALUES
('General', 1000),
('Premium', 5000),
('Ilimitada', 999999);

-- Mercados
INSERT INTO Mercado (nombre, estado) VALUES
('NYSE', 'Activo'),
('NASDAQ', 'Activo'),
('BME', 'Activo');

-- Usuarios
INSERT INTO Usuario (alias, nombre, direccion, pais_origen, telefono, correo, contrasena_hash, rol, estado) VALUES
('admin1', N'Administrador General', N'San José', N'Costa Rica', N'8888-8888', 'admin@example.com', 'hash_admin', 'Admin', 'Activo'),
('trader1', N'Juan Pérez', N'Heredia', N'Costa Rica', N'7777-7777', 'trader1@example.com', 'hash_trader1', 'Trader', 'Activo'),
('trader2', N'Ana Rodríguez', N'Alajuela', N'Costa Rica', N'6666-6666', 'trader2@example.com', 'hash_trader2', 'Trader', 'Activo'),
('analista1', N'María Gómez', N'Cartago', N'Costa Rica', N'5555-5555', 'analista1@example.com', 'hash_analista1', 'Analista', 'Activo');

-- Wallets
INSERT INTO Wallet (usuario_id, saldo, categoria_id, consumo_diario) VALUES
(1, 50000, 3, 0),
(2, 15000, 2, 0),
(3, 8000, 1, 0),
(4, 3000, 1, 0);

-- Empresas
INSERT INTO Empresa (nombre, mercado_id, ticker, cantidad_acciones_totales, acciones_disponibles, precio_accion, capitalizacion) VALUES
(N'Apple Inc.', 2, 'AAPL', 1000000, 600000, 180.50, 180500000),
(N'Microsoft Corp.', 2, 'MSFT', 2000000, 1400000, 310.20, 620400000),
(N'Tesla Inc.', 2, 'TSLA', 1500000, 1000000, 250.10, 375150000),
(N'Coca-Cola', 1, 'KO', 1200000, 700000, 60.25, 72300000),
(N'JP Morgan', 1, 'JPM', 1800000, 1200000, 140.80, 253440000),
(N'Iberdrola', 3, 'IBE', 900000, 700000, 12.30, 11070000),
(N'Santander', 3, 'SAN', 1000000, 800000, 3.75, 3750000);

-- Sectores
INSERT INTO Sector (nombre) VALUES
('Tecnología'),
('Energía'),
('Finanzas'),
('Consumo'),
('Salud');

-- Empresa_Sector
INSERT INTO Empresa_Sector (empresa_id, sector_id) VALUES
(1, 1), -- Apple -> Tecnología
(2, 1), -- Microsoft -> Tecnología
(3, 1), -- Tesla -> Tecnología
(4, 4), -- Coca-Cola -> Consumo
(5, 3), -- JP Morgan -> Finanzas
(6, 2), -- Iberdrola -> Energía
(7, 3); -- Santander -> Finanzas

-- Usuario_Mercado
INSERT INTO Usuario_Mercado (usuario_id, mercado_id, habilitado_por) VALUES
(2, 2, 1),
(2, 1, 1),
(3, 3, 1),
(4, 2, 1);

-- Recargas
INSERT INTO Recarga (wallet_id, monto) VALUES
(2, 5000),
(3, 2000),
(4, 1000);

-- Precios históricos (ejemplo fijo de 5 días atrás)
DECLARE @i INT = 0;
WHILE @i < 5
BEGIN
  DECLARE @fecha DATETIME2(3) = DATEADD(DAY, -@i, SYSUTCDATETIME());
  INSERT INTO Precio_Historico (empresa_id, ts_utc, precio) VALUES
  (1, @fecha, 180.00 + RAND()*5),
  (2, @fecha, 310.00 + RAND()*5),
  (3, @fecha, 250.00 + RAND()*5),
  (4, @fecha, 60.00 + RAND()*2),
  (5, @fecha, 140.00 + RAND()*3),
  (6, @fecha, 12.00 + RAND()*1),
  (7, @fecha, 3.50 + RAND()*0.5);
  SET @i += 1;
END

-- Posiciones
INSERT INTO Posicion (usuario_id, empresa_id, cantidad, costo_promedio) VALUES
(2, 1, 50, 178.00),
(2, 3, 20, 240.00),
(3, 6, 100, 11.50);

-- Operaciones
INSERT INTO Operacion (usuario_id, empresa_id, lado, cantidad, precio, nota) VALUES
(2, 1, 'B', 50, 178.00, N'Compra inicial Apple'),
(2, 3, 'B', 20, 240.00, N'Compra Tesla'),
(3, 6, 'B', 100, 11.50, N'Compra Iberdrola'),
(2, 1, 'S', 10, 182.00, N'Venta parcial Apple');

-- Acciones (resumen)
INSERT INTO Acciones (id_usuario, id_empresa, acciones, valor) VALUES
(2, 1, 40, 180.50*40),
(2, 3, 20, 250.10*20),
(3, 6, 100, 12.30*100);

-- Configuración de la App
INSERT INTO App_Setting (clave, valor) VALUES
('version', N'1.0.0'),
('modo', N'desarrollo'),
('max_operaciones_diarias', N'100');

GO
