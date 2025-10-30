import { queryDB } from "../config/db.js";

export default async function createTriggers() {
  try {
    await queryDB(`
        DROP TRIGGER IF EXISTS TRG_UpdateUsuarioIdBilletera;
        DROP TRIGGER IF EXISTS TRG_UpdateUsuarioIdPortafolio;
        DROP TRIGGER IF EXISTS TRG_UpdateUsuarioAlias;
        DROP TRIGGER IF EXISTS TR_Auditoria_Billetera_Update;
        DROP TRIGGER IF EXISTS TR_Auditoria_Empresa_Delistar;
        DROP TRIGGER IF EXISTS TR_Auditoria_Usuario_Deshabilitar;
        DROP TRIGGER IF EXISTS TR_Auditoria_Precio_Carga;
        DROP TRIGGER IF EXISTS TR_Auditoria_Liquidar_Todo;
    `);

    // Actualizar Billetera
    await queryDB(`
        CREATE TRIGGER TR_Auditoria_Billetera_Update
        ON Billetera
        AFTER UPDATE
        AS
        BEGIN
            SET NOCOUNT ON;
            IF UPDATE(limite_diario) OR UPDATE(categoria)
            BEGIN
                DECLARE @usuario_ejecutor NVARCHAR(128);
                SET @usuario_ejecutor = ISNULL(CAST(SESSION_CONTEXT(N'usuario_admin') AS NVARCHAR(128)), 'ADMIN');
                
                INSERT INTO Auditoria (usuario_ejecutor, usuario_afectado, accion, detalles)
                SELECT 
                    @usuario_ejecutor,
                    u.alias,
                    'Actualizar billetera',
                    'Cat: ' + i.categoria + ', Límite: ' + CAST(i.limite_diario AS NVARCHAR(20))
                FROM inserted i
                LEFT JOIN Usuario u ON u.id_billetera = i.id;
            END
        END;
    `);
    console.log('Trigger Billetera creado');

    // Delistar Empresa
    await queryDB(`
        CREATE TRIGGER TR_Auditoria_Empresa_Delistar
        ON Empresa
        AFTER UPDATE
        AS
        BEGIN
            SET NOCOUNT ON;
            IF UPDATE(delistada)
            BEGIN
                DECLARE @usuario_ejecutor NVARCHAR(128);
                DECLARE @precio_liquidacion DECIMAL(19,4);
                
                SET @usuario_ejecutor = ISNULL(CAST(SESSION_CONTEXT(N'usuario_admin') AS NVARCHAR(128)), 'ADMIN');
                SET @precio_liquidacion = ISNULL(CAST(SESSION_CONTEXT(N'precio_liquidacion') AS DECIMAL(19,4)), 0);
                
                INSERT INTO Auditoria (usuario_ejecutor, accion, detalles)
                SELECT 
                    @usuario_ejecutor,
                    'Delistar empresa',
                    'Empresa: ' + i.ticker + ' - ' + i.nombre + 
                    ', Precio liquidación: $' + CAST(ISNULL(NULLIF(@precio_liquidacion, 0), ISNULL(inv.precio, 0)) AS NVARCHAR(20))
                FROM inserted i
                INNER JOIN deleted d ON i.id = d.id
                LEFT JOIN Inventario inv ON inv.id_empresa = i.id
                WHERE i.delistada = 1 AND d.delistada = 0;
            END
        END;
    `);
    console.log('Trigger Empresa creado');

    // Deshabilitar Usuario
    await queryDB(`
        CREATE TRIGGER TR_Auditoria_Usuario_Deshabilitar
        ON Usuario
        AFTER UPDATE
        AS
        BEGIN
            SET NOCOUNT ON;
            IF UPDATE(habilitado)
            BEGIN
                DECLARE @usuario_ejecutor NVARCHAR(128);
                SET @usuario_ejecutor = ISNULL(CAST(SESSION_CONTEXT(N'usuario_admin') AS NVARCHAR(128)), 'ADMIN');
                
                INSERT INTO Auditoria (usuario_ejecutor, usuario_afectado, accion, detalles)
                SELECT 
                    @usuario_ejecutor,
                    i.alias,
                    'Deshabilitar usuario',
                    'Justificación: ' + ISNULL(i.deshabilitado_justificacion, 'Sin justificación')
                FROM inserted i
                INNER JOIN deleted d ON i.id = d.id
                WHERE i.habilitado = 0 AND d.habilitado = 1;
            END
        END;
    `);
    console.log('Trigger Usuario creado');

    // Cargar Precio
    await queryDB(`
        CREATE TRIGGER TR_Auditoria_Precio_Carga
        ON Inventario_Historial
        AFTER INSERT
        AS
        BEGIN
            SET NOCOUNT ON;
            
            DECLARE @usuario_ejecutor NVARCHAR(128);
            SET @usuario_ejecutor = ISNULL(CAST(SESSION_CONTEXT(N'usuario_admin') AS NVARCHAR(128)), 'ADMIN');
            
            INSERT INTO Auditoria (usuario_ejecutor, accion, detalles)
            SELECT 
                @usuario_ejecutor,
                'Cargar precio',
                'Empresa: ' + e.ticker + ', Precio: $' + CAST(i.precio AS NVARCHAR(20))
            FROM inserted i
            INNER JOIN Empresa e ON e.id = i.id_empresa;
        END;
    `);
    console.log('Trigger Precio creado');

    // Triggers de cascada
    await queryDB(`
        CREATE TRIGGER TRG_UpdateUsuarioIdBilletera
        ON Usuario
        AFTER UPDATE
        AS
        BEGIN
            SET NOCOUNT ON;
            IF UPDATE(id_billetera)
            BEGIN
                UPDATE T
                SET T.id_billetera = I.id_billetera
                FROM Transaccion AS T
                INNER JOIN deleted AS D ON T.alias = D.alias
                INNER JOIN inserted AS I ON D.id = I.id;
            END
        END;
    `);

    await queryDB(`
        CREATE TRIGGER TRG_UpdateUsuarioIdPortafolio
        ON Usuario
        AFTER UPDATE
        AS
        BEGIN
            SET NOCOUNT ON;
            IF UPDATE(id_portafolio)
            BEGIN
                UPDATE T
                SET T.id_portafolio = I.id_portafolio
                FROM Transaccion AS T
                INNER JOIN deleted AS D ON T.alias = D.alias
                INNER JOIN inserted AS I ON D.id = I.id;
            END
        END;
    `);

    console.log('Todos los triggers creados exitosamente');

    await queryDB(`
        CREATE TRIGGER TR_Auditoria_Liquidar_Todo
        ON Transaccion
        AFTER INSERT
        AS
        BEGIN
            SET NOCOUNT ON;
            DECLARE @es_liquidacion NVARCHAR(10);
            SET @es_liquidacion = CAST(SESSION_CONTEXT(N'liquidacion_total') AS NVARCHAR(10));
            
            IF @es_liquidacion = 'SI'
            BEGIN
                DECLARE @alias NVARCHAR(128);
                DECLARE @total_acciones INT;
                DECLARE @total_valor DECIMAL(19,4);
                
                SELECT TOP 1
                    @alias = i.alias,
                    @total_acciones = SUM(i.cantidad),
                    @total_valor = SUM(i.cantidad * i.precio)
                FROM inserted i
                WHERE i.tipo = 'Venta'
                GROUP BY i.alias;
                IF @alias IS NOT NULL AND NOT EXISTS (
                    SELECT 1 FROM Auditoria 
                    WHERE usuario_ejecutor = @alias 
                    AND accion = 'Liquidar todo' 
                    AND fecha > DATEADD(SECOND, -5, GETDATE())
                )
                BEGIN
                    INSERT INTO Auditoria (usuario_ejecutor, usuario_afectado, accion, detalles)
                    VALUES (
                        @alias,
                        @alias,
                        'Liquidar todo',
                        'Acciones vendidas: ' + CAST(@total_acciones AS NVARCHAR(20)) + 
                        ', Valor total: $' + CAST(@total_valor AS NVARCHAR(20))
                    );
                END
            END
        END;
    `);
    console.log('Trigger Liquidar Todo creado');
    
  } catch (error) {
    console.error('Error creando triggers:', error.message);
    throw error;
  }
}