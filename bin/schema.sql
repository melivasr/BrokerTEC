-- ============================================================
-- SCHEMA: Tablas
-- ============================================================

CREATE TABLE Categoria (
  categoria_id   INT IDENTITY(1,1) PRIMARY KEY,
  nombre         VARCHAR(40) NOT NULL UNIQUE,
  limite_diario  DECIMAL(19,4) NOT NULL CHECK (limite_diario >= 0)
);

CREATE TABLE Mercado (
  mercado_id INT IDENTITY(1,1) PRIMARY KEY,
  nombre     VARCHAR(100) NOT NULL UNIQUE,
  estado     VARCHAR(20) NOT NULL DEFAULT 'Activo'
);

CREATE TABLE Usuario (
  usuario_id       INT IDENTITY(1,1) PRIMARY KEY,
  alias            VARCHAR(40) NOT NULL UNIQUE,
  nombre           NVARCHAR(120) NOT NULL,
  direccion        NVARCHAR(200),
  pais_origen      NVARCHAR(80),
  telefono         NVARCHAR(40),
  correo           VARCHAR(120) NOT NULL UNIQUE,
  contrasena_hash  VARCHAR(255) NOT NULL,
  rol              VARCHAR(20) NOT NULL CHECK (rol IN ('Admin','Trader','Analista')),
  estado           VARCHAR(20) NOT NULL DEFAULT 'Activo'
);

CREATE TABLE Empresa (
  empresa_id                 INT IDENTITY(1,1) PRIMARY KEY,
  nombre                     NVARCHAR(160) NOT NULL,
  mercado_id                 INT NOT NULL,
  ticker                     VARCHAR(16) NOT NULL,
  cantidad_acciones_totales  INT NOT NULL CHECK (cantidad_acciones_totales >= 0),
  acciones_disponibles       INT,
  precio_accion              DECIMAL(19,4),
  capitalizacion             DECIMAL(19,4),
  estado                     VARCHAR(20) NOT NULL DEFAULT 'Activa',
  CONSTRAINT FK_Empresa_Mercado FOREIGN KEY (mercado_id) REFERENCES Mercado(mercado_id),
  CONSTRAINT UQ_Empresa_Mercado_Nombre UNIQUE (mercado_id, nombre),
  CONSTRAINT UQ_Empresa_Mercado_Ticker UNIQUE (mercado_id, ticker)
);

CREATE TABLE Wallet (
  wallet_id      INT IDENTITY(1,1) PRIMARY KEY,
  usuario_id     INT NOT NULL,
  saldo          DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
  categoria_id   INT NOT NULL,
  consumo_diario DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
  CONSTRAINT FK_Wallet_Usuario FOREIGN KEY (usuario_id) REFERENCES Usuario(usuario_id),
  CONSTRAINT FK_Wallet_Categoria FOREIGN KEY (categoria_id) REFERENCES Categoria(categoria_id),
  CONSTRAINT UQ_Wallet UNIQUE (usuario_id, categoria_id)
);

CREATE TABLE Recarga (
  recarga_id INT IDENTITY(1,1) PRIMARY KEY,
  wallet_id  INT NOT NULL,
  monto      DECIMAL(19,4) NOT NULL CHECK (monto > 0),
  fecha_hora DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Recarga_Wallet FOREIGN KEY (wallet_id) REFERENCES Wallet(wallet_id)
);

CREATE TABLE Precio_Historico (
  empresa_id INT NOT NULL,
  ts_utc     DATETIME2(3) NOT NULL,
  precio     DECIMAL(19,4) NOT NULL CHECK (precio > 0),
  PRIMARY KEY (empresa_id, ts_utc),
  CONSTRAINT FK_Precio_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(empresa_id)
);

CREATE TABLE Posicion (
  usuario_id      INT NOT NULL,
  empresa_id      INT NOT NULL,
  cantidad        INT NOT NULL CHECK (cantidad >= 0),
  costo_promedio  DECIMAL(19,6) NOT NULL CHECK (costo_promedio >= 0),
  PRIMARY KEY (usuario_id, empresa_id),
  CONSTRAINT FK_Posicion_Usuario FOREIGN KEY (usuario_id) REFERENCES Usuario(usuario_id),
  CONSTRAINT FK_Posicion_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(empresa_id)
);

CREATE TABLE Operacion (
  operacion_id INT IDENTITY(1,1) PRIMARY KEY,
  usuario_id   INT NOT NULL,
  empresa_id   INT NOT NULL,
  ts_utc       DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  lado         CHAR(1) NOT NULL CHECK (lado IN ('B','S')),
  cantidad     INT NOT NULL CHECK (cantidad > 0),
  precio       DECIMAL(19,4) NOT NULL CHECK (precio > 0),
  nota         NVARCHAR(200),
  CONSTRAINT FK_Operacion_Usuario FOREIGN KEY (usuario_id) REFERENCES Usuario(usuario_id),
  CONSTRAINT FK_Operacion_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(empresa_id)
);

CREATE TABLE Usuario_Mercado (
  usuario_id     INT NOT NULL,
  mercado_id     INT NOT NULL,
  habilitado_por INT NOT NULL,
  habilitado_en  DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY (usuario_id, mercado_id),
  CONSTRAINT FK_UM_Usuario FOREIGN KEY (usuario_id) REFERENCES Usuario(usuario_id),
  CONSTRAINT FK_UM_Mercado FOREIGN KEY (mercado_id) REFERENCES Mercado(mercado_id),
  CONSTRAINT FK_UM_Admin FOREIGN KEY (habilitado_por) REFERENCES Usuario(usuario_id)
);

CREATE TABLE Sector (
  sector_id INT IDENTITY(1,1) PRIMARY KEY,
  nombre    VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE Empresa_Sector (
  empresa_id INT NOT NULL,
  sector_id  INT NOT NULL,
  PRIMARY KEY (empresa_id, sector_id),
  CONSTRAINT FK_ES_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(empresa_id),
  CONSTRAINT FK_ES_Sector FOREIGN KEY (sector_id) REFERENCES Sector(sector_id)
);

CREATE TABLE App_Setting (
  clave VARCHAR(64) PRIMARY KEY,
  valor NVARCHAR(200) NOT NULL
);

CREATE TABLE Acciones (
  id_usuario INT NOT NULL,
  id_empresa INT NOT NULL,
  acciones   INT NOT NULL CHECK (acciones >= 0),
  valor      DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
  PRIMARY KEY (id_usuario, id_empresa),
  CONSTRAINT FK_Acciones_Usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(usuario_id),
  CONSTRAINT FK_Acciones_Empresa FOREIGN KEY (id_empresa) REFERENCES Empresa(empresa_id)
);

GO
