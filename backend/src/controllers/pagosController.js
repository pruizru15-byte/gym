const db = require('../config/database');
const nodemailer = require('nodemailer');

const pagosController = {
    // 1. Obtener historial de pagos
    getHistorialPagos: async (req, res) => {
        try {
            const { fecha, tipo, cliente_id, referencia_id, limit = 50, offset = 0 } = req.query;

            let queryStr = `
        SELECT 
            p.*,
            c.nombre as cliente_nombre,
            c.apellido as cliente_apellido,
            c.codigo as cliente_codigo,
            u.nombre as usuario_nombre
        FROM pagos p
        LEFT JOIN clientes c ON p.cliente_id = c.id
        LEFT JOIN usuarios u ON p.usuario_id = u.id
        WHERE 1=1
      `;
            const params = [];

            // Filtro por fecha (día específico)
            if (fecha) {
                queryStr += ` AND date(p.fecha_hora) = date(?)`;
                params.push(fecha);
            }

            // Filtro por tipo (membresia, venta)
            if (tipo && tipo !== 'all') {
                queryStr += ` AND p.tipo = ?`;
                params.push(tipo);
            }

            // Filtro por cliente
            if (cliente_id) {
                queryStr += ` AND p.cliente_id = ?`;
                params.push(cliente_id);
            }

            // Filtro por referencia (membresia_id, etc)
            if (referencia_id) {
                queryStr += ` AND p.referencia_id = ?`;
                params.push(referencia_id);
            }

            queryStr += ` ORDER BY p.fecha_hora DESC LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), parseInt(offset));

            const pagosList = db.prepare(queryStr).all(...params);

            // Total counts for pagination
            let countQuery = `SELECT COUNT(*) as total FROM pagos p WHERE 1=1`;
            const countParams = [];

            if (fecha) {
                countQuery += ` AND date(p.fecha_hora) = date(?)`;
                countParams.push(fecha);
            }
            if (tipo && tipo !== 'all') {
                countQuery += ` AND p.tipo = ?`;
                countParams.push(tipo);
            }
            if (cliente_id) {
                countQuery += ` AND p.cliente_id = ?`;
                countParams.push(cliente_id);
            }
            if (referencia_id) {
                countQuery += ` AND p.referencia_id = ?`;
                countParams.push(referencia_id);
            }

            const { total } = db.prepare(countQuery).get(...countParams);

            // Calcular resumen del día consultado (o del día actual si no hay fecha)
            const targetDate = fecha || new Date().toISOString().split('T')[0];
            const resumenRaw = db.prepare(`
         SELECT 
            SUM(monto) as total,
            SUM(CASE WHEN metodo_pago = 'efectivo' THEN monto ELSE 0 END) as efectivo,
            SUM(CASE WHEN metodo_pago = 'tarjeta' THEN monto ELSE 0 END) as tarjeta,
            SUM(CASE WHEN metodo_pago = 'transferencia' THEN monto ELSE 0 END) as transferencia
         FROM pagos
         WHERE date(fecha_hora) = date(?)
      `).get(targetDate);

            // Format response
            const formattedPagos = pagosList.map(p => ({
                id: p.id,
                cliente_id: p.cliente_id,
                cliente: p.cliente_id ? {
                    nombre: p.cliente_nombre,
                    apellido: p.cliente_apellido,
                    codigo: p.cliente_codigo
                } : null,
                tipo: p.tipo,
                concepto: p.concepto,
                monto: p.monto,
                metodo_pago: p.metodo_pago,
                fecha_hora: p.fecha_hora,
                usuario: p.usuario_nombre
            }));

            res.json({
                success: true,
                data: {
                    pagos: formattedPagos,
                    resumenDia: {
                        total: resumenRaw.total || 0,
                        efectivo: resumenRaw.efectivo || 0,
                        tarjeta: resumenRaw.tarjeta || 0,
                        transferencia: resumenRaw.transferencia || 0
                    },
                    pagination: {
                        total,
                        limit: parseInt(limit),
                        offset: parseInt(offset)
                    }
                }
            });
        } catch (error) {
            console.error('Error en getHistorialPagos:', error);
            res.status(500).json({ success: false, error: 'Error al obtener historial de pagos' });
        }
    },

    // 2. Obtener recibo individual (por ID)
    getRecibo: async (req, res) => {
        try {
            const { id } = req.params;

            const pago = db.prepare(`
             SELECT 
                p.*,
                c.nombre as cliente_nombre,
                c.apellido as cliente_apellido,
                c.codigo as cliente_codigo,
                c.email as cliente_email,
                u.nombre as usuario_nombre,
                cm.precio_pagado as abonado_total,
                m.precio as precio_total
             FROM pagos p
             LEFT JOIN clientes c ON p.cliente_id = c.id
             LEFT JOIN usuarios u ON p.usuario_id = u.id
             LEFT JOIN clientes_membresias cm ON p.tipo = 'membresia' AND p.referencia_id = cm.id
             LEFT JOIN membresias m ON cm.membresia_id = m.id
             WHERE p.id = ?
          `).get(id);

            if (!pago) {
                return res.status(404).json({ success: false, error: 'Pago no encontrado' });
            }

            res.json({
                success: true,
                data: {
                    id: pago.id,
                    cliente: pago.cliente_id ? {
                        nombre: pago.cliente_nombre,
                        apellido: pago.cliente_apellido,
                        codigo: pago.cliente_codigo,
                        email: pago.cliente_email
                    } : null,
                    tipo: pago.tipo,
                    concepto: pago.concepto,
                    monto: pago.monto,
                    metodo_pago: pago.metodo_pago,
                    fecha_hora: pago.fecha_hora,
                    usuario: pago.usuario_nombre,
                    abonado_total: pago.abonado_total,
                    precio_total: pago.precio_total
                }
            });

        } catch (error) {
            console.error('Error en getRecibo:', error);
            res.status(500).json({ success: false, error: 'Error al obtener recibo de pago' });
        }
    },

    // 3. Obtener Estado de Caja
    getEstadoCaja: async (req, res) => {
        try {
            // Get the MOST RECENT entry in caja
            const lastCaja = db.prepare(`
                SELECT c.*, u.nombre as cajero
                FROM caja c
                LEFT JOIN usuarios u ON c.usuario_id = u.id
                ORDER BY c.fecha_hora DESC
                LIMIT 1
            `).get();

            if (!lastCaja || lastCaja.tipo === 'cierre') {
                return res.json({
                    success: true,
                    data: {
                        estado: 'cerrada',
                        ultimo_movimiento: lastCaja || null
                    }
                });
            }

            // Si es 'apertura', then it's currently open
            res.json({
                success: true,
                data: {
                    estado: 'abierta',
                    apertura: lastCaja
                }
            });
        } catch (error) {
            console.error('Error en getEstadoCaja:', error);
            res.status(500).json({ success: false, error: 'Error al obtener estado de caja' });
        }
    },

    // 4. Abrir Caja
    abrirCaja: async (req, res) => {
        try {
            const { monto_inicial, notas } = req.body;
            const usuarioId = req.user.id;

            // Check if already open
            const lastCaja = db.prepare(`SELECT tipo FROM caja ORDER BY fecha_hora DESC LIMIT 1`).get();
            if (lastCaja && lastCaja.tipo === 'apertura') {
                return res.status(400).json({ success: false, error: 'La caja ya se encuentra abierta' });
            }

            const fechaStr = new Date().toISOString().split('T')[0];

            const result = db.prepare(`
             INSERT INTO caja (fecha, tipo, monto_inicial, notas, usuario_id) 
             VALUES (?, 'apertura', ?, ?, ?)
            `).run(fechaStr, monto_inicial || 0, notas || '', usuarioId);

            res.status(201).json({
                success: true,
                message: 'Caja abierta exitosamente',
                data: { id: result.lastInsertRowid }
            });

        } catch (error) {
            console.error('Error en abrirCaja:', error);
            res.status(500).json({ success: false, error: 'Error al abrir la caja' });
        }
    },

    // 5. Registrar Corte de Caja (Cerrar)
    registrarCorteCaja: async (req, res) => {
        try {
            const { notas } = req.body;
            const usuarioId = req.user.id;

            // Find the last OPEN event
            const lastCaja = db.prepare(`
                SELECT * FROM caja ORDER BY fecha_hora DESC LIMIT 1
            `).get();

            if (!lastCaja || lastCaja.tipo === 'cierre') {
                return res.status(400).json({ success: false, error: 'La caja ya está cerrada. No hay un turno abierto para cortar.' });
            }

            const fechaAperturaExacta = lastCaja.fecha_hora;
            const montoInicial = lastCaja.monto_inicial || 0;

            // Gather totals for the day SINCE opening
            const totales = db.prepare(`
            SELECT 
                SUM(monto) as total_ingresos,
                SUM(CASE WHEN metodo_pago = 'efectivo' THEN monto ELSE 0 END) as efectivo,
                SUM(CASE WHEN metodo_pago = 'tarjeta' THEN monto ELSE 0 END) as tarjeta,
                SUM(CASE WHEN metodo_pago = 'transferencia' THEN monto ELSE 0 END) as transferencia
            FROM pagos
            WHERE fecha_hora >= ?
          `).get(fechaAperturaExacta);

            // Egresos para el dia SINCE opening
            const egresos = db.prepare(`
             SELECT SUM(monto) as total_egresos
             FROM egresos
             WHERE fecha_hora >= ?
          `).get(fechaAperturaExacta);

            const ingresosEfectivo = totales.efectivo || 0;
            const ingresosTarjeta = totales.tarjeta || 0;
            const ingresosTransferencia = totales.transferencia || 0;
            const totalEgresos = egresos.total_egresos || 0;

            const montoFinal = montoInicial + ingresosEfectivo + ingresosTarjeta + ingresosTransferencia - totalEgresos;
            const fechaActual = new Date().toISOString().split('T')[0];

            const stmt = db.prepare(`
             INSERT INTO caja (
                 fecha, tipo, monto_inicial, ingresos_efectivo, ingresos_tarjeta, ingresos_transferencia, 
                 egresos, monto_final, diferencia, notas, usuario_id
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

            const result = stmt.run(
                fechaActual, // O use date from actual datetime if preferred
                'cierre',
                montoInicial,
                ingresosEfectivo,
                ingresosTarjeta,
                ingresosTransferencia,
                totalEgresos,
                montoFinal,
                0, // Diferencia can be implemented later with actual input
                notas || '',
                usuarioId
            );

            res.status(201).json({
                success: true,
                message: 'Corte de caja registrado y caja cerrada exitosamente',
                data: {
                    id: result.lastInsertRowid,
                    resumen: {
                        ingresos: {
                            efectivo: ingresosEfectivo,
                            tarjeta: ingresosTarjeta,
                            transferencia: ingresosTransferencia,
                            total: ingresosEfectivo + ingresosTarjeta + ingresosTransferencia
                        },
                        egresos: totalEgresos,
                        saldo_final: montoFinal,
                        monto_inicial: montoInicial
                    }
                }
            });

        } catch (error) {
            console.error('Error en registrarCorteCaja:', error);
            res.status(500).json({ success: false, error: 'Error al registrar corte de caja' });
        }
    },

    // 6. Obtener pagos pendientes
    getPagosPendientes: async (req, res) => {
        try {
            // Find memberships where price paid is less than the plan price, and it's active
            const asignaciones = db.prepare(`
                SELECT 
                    cm.id as asignacion_id,
                    cm.fecha_inicio,
                    cm.fecha_vencimiento,
                    cm.precio_pagado as abonado,
                    m.precio as total,
                    (m.precio - cm.precio_pagado) as deuda,
                    m.nombre as plan_nombre,
                    c.id as cliente_id,
                    c.nombre as cliente_nombre,
                    c.apellido as cliente_apellido,
                    c.codigo as cliente_codigo,
                    c.telefono,
                    c.email
                FROM clientes_membresias cm
                JOIN membresias m ON cm.membresia_id = m.id
                JOIN clientes c ON cm.cliente_id = c.id
                WHERE cm.activo = 1 
                  AND cm.precio_pagado < m.precio
                ORDER BY cm.fecha_inicio ASC
            `).all();

            const stmtCuotas = db.prepare(`
                SELECT id as cuota_id, numero_cuota, monto, fecha_vencimiento, estado 
                FROM cuotas 
                WHERE asignacion_id = ? AND estado = 'pendiente'
                ORDER BY numero_cuota ASC
            `);

            const pendientes = asignaciones.map(a => {
                const cuotas = stmtCuotas.all(a.asignacion_id);
                return {
                    ...a,
                    cuotas
                };
            });

            res.json({
                success: true,
                data: pendientes
            });
        } catch (error) {
            console.error('Error en getPagosPendientes:', error);
            res.status(500).json({ success: false, error: 'Error al obtener pagos pendientes' });
        }
    },

    // 7. Registrar un pago pendiente (Either generic debt or specific Cuota)
    registrarPagoPendiente: async (req, res) => {
        try {
            const asignacionId = req.params.id;
            const { monto, metodo_pago, notas, cuota_id } = req.body;
            const usuarioId = req.user.id;

            if (!monto || monto <= 0) {
                return res.status(400).json({ success: false, error: 'El monto debe ser mayor a 0' });
            }

            // Check box state first strictly
            const lastCaja = db.prepare(`SELECT tipo FROM caja ORDER BY fecha_hora DESC LIMIT 1`).get();
            if (!lastCaja || lastCaja.tipo !== 'apertura') {
                return res.status(400).json({
                    success: false,
                    error: 'La caja está cerrada. Debe aperturar la caja antes de registrar un pago.'
                });
            }

            // Verify assignment
            const asignacion = db.prepare(`
                SELECT cm.*, m.precio as precio_total, m.nombre as plan_nombre
                FROM clientes_membresias cm
                JOIN membresias m ON cm.membresia_id = m.id
                WHERE cm.id = ? AND cm.activo = 1
            `).get(asignacionId);

            if (!asignacion) return res.status(404).json({ success: false, error: 'Asignación no encontrada o inactiva' });

            // Begin transaction
            const transaction = db.transaction(() => {
                const montoPago = parseFloat(monto);
                const nuevoAbonado = asignacion.precio_pagado + montoPago;

                let conceptoPago = `Abono a Membresía ${asignacion.plan_nombre} (Deuda parcial)`;

                if (cuota_id) {
                    const cuota = db.prepare('SELECT * FROM cuotas WHERE id = ? AND asignacion_id = ?').get(cuota_id, asignacionId);
                    if (!cuota || cuota.estado !== 'pendiente') {
                        throw new Error('La cuota especificada no existe o ya está pagada.');
                    }
                    if (montoPago !== cuota.monto) {
                        throw new Error(`El monto debe coincidir exactamente con el valor de la cuota (${cuota.monto}).`);
                    }
                    conceptoPago = `Pago de Cuota ${cuota.numero_cuota} - Membresía ${asignacion.plan_nombre}`;
                }

                // Update assignment paid amount
                db.prepare(`
                    UPDATE clientes_membresias 
                    SET precio_pagado = ?
                    WHERE id = ?
                `).run(nuevoAbonado, asignacionId);

                // Insert into pagos history
                const result = db.prepare(`
                    INSERT INTO pagos (
                        cliente_id, tipo, referencia_id, concepto, monto,
                        metodo_pago, usuario_id
                    ) VALUES (?, 'membresia', ?, ?, ?, ?, ?)
                `).run(
                    asignacion.cliente_id, asignacionId,
                    conceptoPago,
                    montoPago, metodo_pago || 'efectivo', usuarioId
                );

                if (cuota_id) {
                    // Update the specific cuota
                    db.prepare(`
                        UPDATE cuotas
                        SET estado = 'pagado', fecha_pago = ?, pago_id = ?
                        WHERE id = ?
                    `).run(new Date().toISOString(), result.lastInsertRowid, cuota_id);
                }

                return result;
            });

            let result;
            try {
                result = transaction();
            } catch (txError) {
                return res.status(400).json({ success: false, error: txError.message });
            }

            res.status(200).json({
                success: true,
                message: 'Pago registrado exitosamente',
                data: { pago_id: result.lastInsertRowid }
            });

        } catch (error) {
            console.error('Error en registrarPagoPendiente:', error);
            res.status(500).json({ success: false, error: 'Error al procesar el pago' });
        }
    },

    // 8. Obtener clientes inactivos
    getInactivos: async (req, res) => {
        try {
            // Find clients that DO NOT have an active membership assignment
            const inactivos = db.prepare(`
                SELECT 
                    c.id as cliente_id,
                    c.nombre as cliente_nombre,
                    c.apellido as cliente_apellido,
                    c.codigo as cliente_codigo,
                    c.telefono,
                    c.email,
                    MAX(cm.fecha_vencimiento) as ultimo_vencimiento,
                    m.nombre as ultimo_plan
                FROM clientes c
                LEFT JOIN clientes_membresias cm ON c.id = cm.cliente_id
                LEFT JOIN membresias m ON cm.membresia_id = m.id
                WHERE c.id NOT IN (
                    SELECT cliente_id 
                    FROM clientes_membresias 
                    WHERE activo = 1 AND fecha_vencimiento >= date('now')
                )
                GROUP BY c.id
                ORDER BY ultimo_vencimiento DESC NULLS LAST
            `).all();

            res.json({
                success: true,
                data: inactivos
            });
        } catch (error) {
            console.error('Error en getInactivos:', error);
            res.status(500).json({ success: false, error: 'Error al obtener clientes inactivos' });
        }
    },

    // 9. Enviar correo de "Te Extrañamos"
    sendWinBackEmail: async (req, res) => {
        try {
            const { id } = req.params; // ID of the inactive client

            const cliente = db.prepare('SELECT nombre, email FROM clientes WHERE id = ?').get(id);

            if (!cliente) {
                return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
            }

            if (!cliente.email) {
                return res.status(400).json({ success: false, error: 'El cliente no tiene un email registrado' });
            }

            // Create reusable transporter object using the default SMTP transport
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            // HTML message
            const htmlMessage = `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="background-color: #ef4444; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">¡Te echamos de menos en GET FIT! 💪</h1>
                    </div>
                    <div style="padding: 30px; background-color: #ffffff;">
                        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                            Hola <strong>${cliente.nombre}</strong>,
                        </p>
                        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                            Hemos notado que hace tiempo no nos visitas y queremos saber cómo estás. 
                            Tu membresía ha caducado, pero sabemos que dar el primer paso para volver a entrenar es el más difícil.
                        </p>
                        <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #ef4444; margin-bottom: 20px;">
                            <p style="margin: 0; font-weight: bold; color: #1f2937;">
                                "El éxito es la suma de pequeños esfuerzos repetidos día tras día."
                            </p>
                        </div>
                        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                            No dejes que el progreso que ya lograste se pierda. ¡Vuelve hoy mismo y renueva tu energía con nosotros! Tenemos nuevas clases y las mejores instalaciones esperándote.
                        </p>
                        <div style="text-align: center;">
                            <p style="font-size: 18px; font-weight: bold; color: #1f2937;">
                                ¡Te esperamos pronto en tu gimnasio de siempre!
                            </p>
                        </div>
                    </div>
                    <div style="background-color: #1f2937; padding: 15px; text-align: center; color: #9ca3af; font-size: 12px;">
                        <p style="margin: 0;">© ${new Date().getFullYear()} Gimnasio GET FIT. Todos los derechos reservados.</p>
                        <p style="margin: 5px 0 0 0;">Por favor no respondas a este correo generado automáticamente.</p>
                    </div>
                </div>
            `;

            const mailOptions = {
                from: `"Gimnasio GET FIT" <${process.env.EMAIL_USER}>`,
                to: cliente.email,
                subject: '¡Te extrañamos en GET FIT! 🏋️‍♂️',
                text: `Hola ${cliente.nombre}, hemos notado que hace tiempo no nos visitas. Tu membresía ha caducado. ¡Vuelve hoy mismo y renueva tu energía con nosotros!`,
                html: htmlMessage
            };

            await transporter.sendMail(mailOptions);

            res.json({ success: true, message: 'Correo enviado exitosamente a ' + cliente.email });

        } catch (error) {
            console.error('Error al enviar correo (sendWinBackEmail):', error);
            res.status(500).json({ success: false, error: 'Hubo un error al enviar el correo. Verifique las credenciales SMTP o el servidor.' });
        }
    },

    // 10. Enviar recordatorio de Cuota
    enviarRecordatorioCuota: async (req, res) => {
        try {
            const cuotaId = req.params.cuota_id;

            const cuota = db.prepare(`
                SELECT cu.*, c.nombre, c.email, m.nombre as plan_nombre
                FROM cuotas cu
                JOIN clientes_membresias cm ON cu.asignacion_id = cm.id
                JOIN clientes c ON cm.cliente_id = c.id
                JOIN membresias m ON cm.membresia_id = m.id
                WHERE cu.id = ? AND cu.estado = 'pendiente'
            `).get(cuotaId);

            if (!cuota) {
                return res.status(404).json({ success: false, error: 'Cuota no encontrada o ya se encuentra pagada' });
            }
            if (!cuota.email) {
                return res.status(400).json({ success: false, error: 'El cliente no tiene un email registrado' });
            }

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });

            const htmlMessage = `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="background-color: #f59e0b; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">Recordatorio de Vencimiento 📅</h1>
                    </div>
                    <div style="padding: 30px; background-color: #ffffff;">
                        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                            Hola <strong>${cuota.nombre}</strong>,
                        </p>
                        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                            Te escribimos para recordarte amablemente que el pago de la <strong>Cuota ${cuota.numero_cuota}</strong> por tu membresía <strong>${cuota.plan_nombre}</strong> está próximo a vencer (o acaba de vencer).
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="display: inline-block; background-color: #fef3c7; border: 1px solid #fde68a; color: #b45309; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 18px;">
                                Monto a Pagar: S/ ${cuota.monto} <br/>
                                <span style="font-size: 14px; font-weight: normal;">Vencimiento: ${cuota.fecha_vencimiento}</span>
                            </div>
                        </div>
                        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                            Por favor acércate a la recepción de nuestro gimnasio para regularizar tu cuota y asegurar que tu acceso no sea interrumpido.
                        </p>
                    </div>
                    <div style="background-color: #1f2937; padding: 15px; text-align: center; color: #9ca3af; font-size: 12px;">
                        <p style="margin: 0;">© ${new Date().getFullYear()} Gimnasio GET FIT. Todos los derechos reservados.</p>
                    </div>
                </div>
            `;

            await transporter.sendMail({
                from: `"Gimnasio GET FIT" <${process.env.EMAIL_USER}>`,
                to: cuota.email,
                subject: `Aviso: Vencimiento de Cuota ${cuota.numero_cuota} - GET FIT`,
                html: htmlMessage
            });

            res.json({ success: true, message: 'Recordatorio enviado exitosamente a ' + cuota.email });
        } catch (error) {
            console.error('Error al enviar recordatorio:', error);
            res.status(500).json({ success: false, error: 'Hubo un error al enviar el correo.' });
        }
    },

    // 11. Enviar recibo por correo
    enviarReciboCorreo: async (req, res) => {
        try {
            const { id } = req.params;
            const targetEmail = req.body.email; // The email requested by the user

            if (!targetEmail) {
                return res.status(400).json({ success: false, error: 'Se requiere una dirección de correo electrónico.' });
            }

            const pago = db.prepare(`
                SELECT 
                    p.*,
                c.nombre as cliente_nombre,
                c.apellido as cliente_apellido,
                c.codigo as cliente_codigo,
                c.email as cliente_email,
                u.nombre as usuario_nombre,
                cm.precio_pagado as abonado_total,
                m.precio as precio_total
                FROM pagos p
                LEFT JOIN clientes c ON p.cliente_id = c.id
                LEFT JOIN usuarios u ON p.usuario_id = u.id
                LEFT JOIN clientes_membresias cm ON p.tipo = 'membresia' AND p.referencia_id = cm.id
                LEFT JOIN membresias m ON cm.membresia_id = m.id
                WHERE p.id = ?
                `).get(id);

            if (!pago) {
                return res.status(404).json({ success: false, error: 'Pago no encontrado.' });
            }

            const isMembresia = pago.concepto && (pago.concepto.toLowerCase().includes('membres') || pago.tipo === 'membresia');
            const isCuotaPago = pago.concepto && pago.concepto.toLowerCase().includes('cuota');

            let extraInfo = '';
            if (isMembresia && !isCuotaPago) {
                extraInfo = '<p style="color: #666; font-size: 12px; margin: 4px 0;">Renovación de Plan</p>';
            }

            let cuotasHtml = '';
            if (isCuotaPago && pago.abonado_total !== undefined && pago.precio_total !== undefined) {
                const saldoPendiente = pago.precio_total - pago.abonado_total;
                cuotasHtml = `
                < div style = "margin-top: 15px; padding: 10px; background-color: #f9f9f9; border: 1px dashed #ccc; border-radius: 5px; font-size: 12px;" >
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span style="color: #555;">Total del Plan:</span>
                            <span>S/ ${pago.precio_total.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span style="color: #555;">Total Abonado:</span>
                            <span>S/ ${pago.abonado_total.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #ddd; padding-top: 5px; margin-top: 5px;">
                            <span>Saldo Pendiente:</span>
                            <span>S/ ${saldoPendiente.toFixed(2)}</span>
                        </div>
                    </div >
    `;
            }

            const clienteNombreCompleto = pago.cliente_nombre ? `${pago.cliente_nombre} ${pago.cliente_apellido || ''} ` : 'Público General';
            const codigoHtml = pago.cliente_codigo ? `
    < div style = "display: flex; justify-content: space-between;" >
                            <strong>CÓDIGO:</strong>
                            <span>${pago.cliente_codigo}</span>
                        </div > ` : '';

            const htmlMessage = `
    < div style = "font-family: monospace; max-width: 400px; margin: 0 auto; color: #333; border: 1px solid #ddd; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); background-color: #fff;" >
                    <div style="text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 15px; margin-bottom: 15px;">
                        <h2 style="margin: 0 0 5px 0; font-size: 20px; letter-spacing: 2px;">GET FIT</h2>
                        <p style="margin: 2px 0; font-size: 12px;">Calle Principal 123, Ciudad</p>
                        <p style="margin: 2px 0; font-size: 12px;">Tel: (555) 123-4567</p>
                        <p style="margin: 5px 0 0 0; font-size: 10px;">RFC: GYM123456XYZ</p>
                    </div>

                    <div style="margin-bottom: 15px; font-size: 13px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <strong>RECIBO:</strong>
                            <span>#${pago.id.toString().padStart(6, '0')}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <strong>FECHA:</strong>
                            <span>${new Date(pago.fecha_hora).toLocaleString('es-PE')}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <strong>CAJERO:</strong>
                            <span>${pago.usuario_nombre || 'Administrador'}</span>
                        </div>
                    </div>

                    <div style="border-top: 2px dashed #ccc; margin: 15px 0;"></div>

                    <div style="margin-bottom: 15px; font-size: 13px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <strong>CLIENTE:</strong>
                            <span style="text-align: right;">${clienteNombreCompleto}</span>
                        </div>
                        ${codigoHtml}
                    </div>

                    <div style="border-top: 2px dashed #ccc; margin: 15px 0;"></div>

                    <div style="margin-bottom: 15px;">
                        <strong style="display: block; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; font-size: 13px;">CONCEPTO</strong>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="padding-right: 15px;">
                                <span style="font-weight: 500; font-size: 13px;">${pago.concepto}</span>
                                ${extraInfo}
                            </div>
                            <span style="font-weight: 500; font-size: 14px;">S/ ${pago.monto.toFixed(2)}</span>
                        </div>
                        ${cuotasHtml}
                    </div>

                    <div style="border-top: 2px solid #333; margin: 15px 0;"></div>

                    <div style="background-color: #f9f9f9; padding: 10px; border-radius: 4px; font-size: 13px;">
                        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 15px; margin-bottom: 8px;">
                            <span>TOTAL:</span>
                            <span>S/ ${pago.monto.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; color: #555; margin-bottom: 4px; font-size: 11px;">
                            <span>MÉTODO DE PAGO:</span>
                            <span style="text-transform: uppercase;">${pago.metodo_pago}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; color: #555; margin-bottom: 4px; font-size: 11px;">
                            <span>RECIBIDO:</span>
                            <span>S/ ${pago.monto.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; color: #555; font-size: 11px;">
                            <span>CAMBIO:</span>
                            <span>S/ 0.00</span>
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: 20px; border-top: 2px dashed #ccc; padding-top: 15px; font-size: 11px; color: #666;">
                        <p style="font-weight: bold; color: #333; margin: 0 0 5px 0;">¡GRACIAS POR SU PREFERENCIA!</p>
                        <p style="margin: 0 0 8px 0;">Conserve este ticket para cualquier aclaración.</p>
                        <p style="font-style: italic; margin: 0;">¡Buen entrenamiento!</p>
                    </div>
                </div >
    `;

            const mailTransporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });

            await mailTransporter.sendMail({
                from: `"Gimnasio GET FIT" < ${process.env.EMAIL_USER}> `,
                to: targetEmail,
                subject: `Recibo de Pago #${pago.id.toString().padStart(6, '0')} - GET FIT`,
                html: htmlMessage
            });

            res.json({ success: true, message: 'Recibo enviado exitosamente por correo.' });

        } catch (error) {
            console.error('Error al enviar recibo por correo:', error);
            res.status(500).json({ success: false, error: 'Hubo un error al enviar el correo con el recibo.' });
        }
    }

};

module.exports = pagosController;
