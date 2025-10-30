import { queryDB } from "../config/db.js";

export default async function createAllTables() {
  try {
    // === CREACIÓN DE TABLAS ===
    await queryDB(`
      CREATE TABLE Mercado (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        nombre NVARCHAR(100) NOT NULL UNIQUE
      );
    `);

    await queryDB(`
      CREATE TABLE Empresa (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        id_mercado UNIQUEIDENTIFIER NOT NULL,
        nombre NVARCHAR(160) NOT NULL,
        ticker CHAR(6) NOT NULL,
        delistada BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_Empresa_Mercado
          FOREIGN KEY (id_mercado) REFERENCES Mercado(id)
      );
      CREATE UNIQUE INDEX UQ_Empresa_Ticker
        ON Empresa(id_mercado, ticker);
    `);

    await queryDB(`
      CREATE TABLE Billetera (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        categoria NVARCHAR(20) NOT NULL CHECK (categoria IN ('Junior','Mid','Senior')),
        fondos DECIMAL(19,4) NOT NULL DEFAULT 0,
        limite_diario DECIMAL(19,4) NOT NULL DEFAULT 0,
        consumo DECIMAL(19,4) NOT NULL DEFAULT 0,
        bloqueo_hasta DATETIME2(3) NULL
      );
    `);

    await queryDB(`
      CREATE TABLE Portafolio (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        id_empresa UNIQUEIDENTIFIER NOT NULL,
        acciones INT NOT NULL CHECK (acciones >= 0),
        CONSTRAINT FK_Portafolio_Empresa
          FOREIGN KEY (id_empresa) REFERENCES Empresa(id)
      );
    `);

    await queryDB(`
      CREATE TABLE Usuario (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        id_billetera UNIQUEIDENTIFIER NULL UNIQUE,
        id_portafolio UNIQUEIDENTIFIER NULL,
        nombre NVARCHAR(120) NOT NULL,
        alias NVARCHAR(40) NOT NULL UNIQUE,
        habilitado BIT NOT NULL DEFAULT 1,
        deshabilitado_justificacion NVARCHAR(255) NULL,
        direccion NVARCHAR(255) NULL,
        pais_origen NVARCHAR(80) NULL,
        telefono NVARCHAR(30) NULL,
        correo NVARCHAR(120) NOT NULL UNIQUE,
        rol NVARCHAR(20) NOT NULL CHECK (rol IN ('Admin','Trader','Analista')),
        contrasena_hash VARCHAR(255) NOT NULL,
        ultimo_acceso_seguridad DATETIME NULL,
        CONSTRAINT FK_Usuario_Billetera
          FOREIGN KEY (id_billetera) REFERENCES Billetera(id)
          ON DELETE SET NULL,
        CONSTRAINT FK_Usuario_Portafolio
          FOREIGN KEY (id_portafolio) REFERENCES Portafolio(id)
          ON DELETE SET NULL
      );
    `);

    await queryDB(`
      CREATE TABLE Mercado_Habilitado (
        id_mercado UNIQUEIDENTIFIER NOT NULL,
        id_usuario UNIQUEIDENTIFIER NOT NULL,
        PRIMARY KEY (id_mercado, id_usuario),
        CONSTRAINT FK_MH_Mercado
          FOREIGN KEY (id_mercado) REFERENCES Mercado(id)
          ON DELETE CASCADE,
        CONSTRAINT FK_MH_Usuario
          FOREIGN KEY (id_usuario) REFERENCES Usuario(id)
          ON DELETE CASCADE
      );
    `);

    await queryDB(`
      CREATE TABLE Inventario (
        id_empresa UNIQUEIDENTIFIER PRIMARY KEY,
        acciones_totales INT NOT NULL CHECK (acciones_totales >= 0),
        acciones_disponibles INT NOT NULL CHECK (acciones_disponibles >= 0),
        precio DECIMAL(19,4) NOT NULL CHECK (precio > 0),
        capitalizacion AS (acciones_disponibles * precio),
        CONSTRAINT FK_Inventario_Empresa
          FOREIGN KEY (id_empresa) REFERENCES Empresa(id)
          ON DELETE CASCADE
      );
    `);

    await queryDB(`
      CREATE TABLE Transaccion (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        alias NVARCHAR(40) NOT NULL,
        id_portafolio UNIQUEIDENTIFIER NOT NULL,
        id_billetera UNIQUEIDENTIFIER NOT NULL,
        id_empresa UNIQUEIDENTIFIER NOT NULL,
        tipo NVARCHAR(10) NOT NULL CHECK (tipo IN ('Compra','Venta')),
        precio DECIMAL(19,4) NOT NULL CHECK (precio > 0),
        cantidad INT NOT NULL CHECK (cantidad > 0),
        fecha DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Transaccion_Usuario 
          FOREIGN KEY (alias) REFERENCES Usuario(alias)
          ON UPDATE CASCADE,
        CONSTRAINT FK_Transaccion_Portafolio FOREIGN KEY (id_portafolio) REFERENCES Portafolio(id),
        CONSTRAINT FK_Transaccion_Billetera FOREIGN KEY (id_billetera) REFERENCES Billetera(id),
        CONSTRAINT FK_Transaccion_Empresa FOREIGN KEY (id_empresa) REFERENCES Empresa(id)
      );
    `);

    await queryDB(`
      CREATE TABLE Inventario_Historial (
        fecha DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
        id_empresa UNIQUEIDENTIFIER NOT NULL,
        acciones_totales INT NOT NULL,
        acciones_disponibles INT NOT NULL,
        precio DECIMAL(19,4) NOT NULL,
        capitalizacion AS (acciones_disponibles * precio),
        PRIMARY KEY (fecha, id_empresa),
        CONSTRAINT FK_IH_Empresa
          FOREIGN KEY (id_empresa) REFERENCES Empresa(id)
          ON DELETE CASCADE
      );
    `);

    await queryDB(`
      CREATE TABLE Billetera_Historial (
        fecha DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
        id_billetera UNIQUEIDENTIFIER NOT NULL,
        categoria NVARCHAR(20) NOT NULL,
        fondos DECIMAL(19,4) NOT NULL,
        limite_diario DECIMAL(19,4) NOT NULL,
        consumo DECIMAL(19,4) NOT NULL,
        bloqueo_hasta DATETIME2(3) NULL,
        recarga_monto DECIMAL(19,4) NULL,
        PRIMARY KEY (fecha, id_billetera),
        CONSTRAINT FK_BH_Billetera
          FOREIGN KEY (id_billetera) REFERENCES Billetera(id)
          ON DELETE CASCADE
      );
    `);

    await queryDB(`
      CREATE TABLE Portafolio_Historial (
        fecha DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
        id_portafolio UNIQUEIDENTIFIER NOT NULL,
        id_empresa UNIQUEIDENTIFIER NOT NULL,
        acciones INT NOT NULL CHECK (acciones >= 0),
        PRIMARY KEY (fecha, id_portafolio, id_empresa),
        CONSTRAINT FK_PH_Portafolio
          FOREIGN KEY (id_portafolio) REFERENCES Portafolio(id)
          ON DELETE CASCADE,
        CONSTRAINT FK_PH_Empresa
          FOREIGN KEY (id_empresa) REFERENCES Empresa(id)
          ON DELETE CASCADE
      );
    `);

    await queryDB(`
      CREATE TABLE Empresa_Favorita (
        id_empresa UNIQUEIDENTIFIER NOT NULL,
        id_usuario UNIQUEIDENTIFIER NOT NULL,
        PRIMARY KEY (id_empresa, id_usuario),
        CONSTRAINT FK_EF_Empresa
          FOREIGN KEY (id_empresa) REFERENCES Empresa(id)
          ON DELETE CASCADE,
        CONSTRAINT FK_EF_Usuario
          FOREIGN KEY (id_usuario) REFERENCES Usuario(id)
          ON DELETE CASCADE
      );
    `);

    await queryDB(`
      CREATE TABLE Auditoria (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        fecha DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
        usuario_ejecutor NVARCHAR(40) NOT NULL,
        usuario_afectado NVARCHAR(40) NULL,
        accion NVARCHAR(255) NOT NULL,
        detalles NVARCHAR(500) NULL
      );
    `);

    console.log("Tablas creadas correctamente.");

  } catch (err) {
    console.error("Error creando tablas:", err);
    throw err;
  }
}
