/**
 * Script para insertar 10 máquinas nuevas en la base de datos
 * Completa todos los campos necesarios de la tabla 'maquinas'
 * 
 * Para ejecutar este script:
 * 1. Coloca este archivo en backend/src/scripts/
 * 2. Ejecuta: node backend/src/scripts/insertar-10-maquinas.js
 */

const db = require('../config/database');

// Función auxiliar para calcular fecha futura
const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

// Función auxiliar para formatear fecha a YYYY-MM-DD
const formatDate = (date) => {
    return date.toISOString().split('T')[0];
};

// Datos de las 10 máquinas a insertar
const maquinas = [
    {
        codigo: 'CINTA-001',
        nombre: 'Cinta de Correr ProFit 3000',
        marca: 'ProFit',
        modelo: '3000X',
        categoria: 'Cardio',
        descripcion: 'Cinta de correr profesional con inclinación automática y pantalla táctil',
        ubicacion: 'Zona Cardio - Piso 1',
        estado: 'disponible',
        fecha_adquisicion: '2024-01-15',
        costo: 25000.00,
        vida_util_anos: 10,
        frecuencia_mantenimiento_dias: 90,
        ultimo_mantenimiento: formatDate(new Date('2026-01-15')),
        proximo_mantenimiento: formatDate(addDays(new Date('2026-01-15'), 90)),
        instrucciones_uso: 'Iniciar con calentamiento, aumentar velocidad gradualmente. Presionar botón de emergencia en caso necesario.',
        notas: 'Revisar lubricación de banda mensualmente'
    },
    {
        codigo: 'BICI-001',
        nombre: 'Bicicleta Estática Spinning Pro',
        marca: 'SpinMax',
        modelo: 'SM-200',
        categoria: 'Cardio',
        descripcion: 'Bicicleta de spinning con sistema de resistencia magnética y monitor cardíaco',
        ubicacion: 'Sala de Spinning - Piso 2',
        estado: 'disponible',
        fecha_adquisicion: '2024-02-20',
        costo: 18000.00,
        vida_util_anos: 8,
        frecuencia_mantenimiento_dias: 60,
        ultimo_mantenimiento: formatDate(new Date('2026-01-10')),
        proximo_mantenimiento: formatDate(addDays(new Date('2026-01-10'), 60)),
        instrucciones_uso: 'Ajustar altura del asiento antes de usar. Mantener hidratación durante ejercicio.',
        notas: 'Apretar tornillos del manubrio cada mes'
    },
    {
        codigo: 'PRESS-001',
        nombre: 'Press de Pecho Olímpico',
        marca: 'IronGym',
        modelo: 'IG-BP500',
        categoria: 'Fuerza',
        descripcion: 'Press de banco plano olímpico con soporte de seguridad ajustable',
        ubicacion: 'Zona de Fuerza - Piso 1',
        estado: 'disponible',
        fecha_adquisicion: '2023-11-10',
        costo: 12000.00,
        vida_util_anos: 15,
        frecuencia_mantenimiento_dias: 120,
        ultimo_mantenimiento: formatDate(new Date('2025-11-15')),
        proximo_mantenimiento: formatDate(addDays(new Date('2025-11-15'), 120)),
        instrucciones_uso: 'Usar siempre con spotter. Asegurar barra correctamente. No exceder peso máximo de 200kg.',
        notas: 'Revisar soldaduras y estabilidad estructural'
    },
    {
        codigo: 'RACK-001',
        nombre: 'Rack de Sentadillas Power Rack',
        marca: 'PowerLift',
        modelo: 'PL-PR800',
        categoria: 'Fuerza',
        descripcion: 'Rack para sentadillas con sistema de seguridad y barra dominadas integrada',
        ubicacion: 'Zona de Fuerza - Piso 1',
        estado: 'disponible',
        fecha_adquisicion: '2024-03-05',
        costo: 22000.00,
        vida_util_anos: 20,
        frecuencia_mantenimiento_dias: 180,
        ultimo_mantenimiento: formatDate(new Date('2025-12-20')),
        proximo_mantenimiento: formatDate(addDays(new Date('2025-12-20'), 180)),
        instrucciones_uso: 'Ajustar barras de seguridad a altura apropiada. Verificar estabilidad antes de usar.',
        notas: 'Máquina de alta resistencia, revisar anclajes al piso'
    },
    {
        codigo: 'PESO-001',
        nombre: 'Set de Mancuernas 5-50kg',
        marca: 'HexPro',
        modelo: 'HP-DB-SET',
        categoria: 'Peso Libre',
        descripcion: 'Set completo de mancuernas hexagonales de 5kg a 50kg con rack de almacenamiento',
        ubicacion: 'Zona Peso Libre - Piso 1',
        estado: 'disponible',
        fecha_adquisicion: '2024-01-20',
        costo: 35000.00,
        vida_util_anos: 25,
        frecuencia_mantenimiento_dias: 90,
        ultimo_mantenimiento: formatDate(new Date('2026-01-01')),
        proximo_mantenimiento: formatDate(addDays(new Date('2026-01-01'), 90)),
        instrucciones_uso: 'Regresar mancuernas a su lugar después de usar. No dejar caer al suelo.',
        notas: 'Contar piezas mensualmente, reemplazar gomas desgastadas'
    },
    {
        codigo: 'ELIP-001',
        nombre: 'Elíptica Cross Trainer Elite',
        marca: 'FitPro',
        modelo: 'FP-EL300',
        categoria: 'Cardio',
        descripcion: 'Elíptica profesional con 20 niveles de resistencia y programas preestablecidos',
        ubicacion: 'Zona Cardio - Piso 1',
        estado: 'disponible',
        fecha_adquisicion: '2024-04-15',
        costo: 28000.00,
        vida_util_anos: 12,
        frecuencia_mantenimiento_dias: 75,
        ultimo_mantenimiento: formatDate(new Date('2026-02-01')),
        proximo_mantenimiento: formatDate(addDays(new Date('2026-02-01'), 75)),
        instrucciones_uso: 'Subir con cuidado. Mantener movimientos fluidos. Limpiar después de usar.',
        notas: 'Lubricar rodamientos cada 3 meses'
    },
    {
        codigo: 'LAT-001',
        nombre: 'Máquina de Jalones Lat Pulldown',
        marca: 'MuscleGear',
        modelo: 'MG-LAT400',
        categoria: 'Fuerza',
        descripcion: 'Máquina de jalones con placas de peso y agarre múltiple',
        ubicacion: 'Zona de Fuerza - Piso 1',
        estado: 'mantenimiento',
        fecha_adquisicion: '2023-08-10',
        costo: 15000.00,
        vida_util_anos: 15,
        frecuencia_mantenimiento_dias: 90,
        ultimo_mantenimiento: formatDate(new Date('2026-02-10')),
        proximo_mantenimiento: formatDate(addDays(new Date('2026-02-10'), 90)),
        instrucciones_uso: 'Ajustar almohadillas de rodilla. Seleccionar peso adecuado. Mantener postura correcta.',
        notas: 'En mantenimiento por cable desgastado - reemplazar'
    },
    {
        codigo: 'REMO-001',
        nombre: 'Máquina de Remo Concept2',
        marca: 'Concept2',
        modelo: 'Model D',
        categoria: 'Cardio',
        descripcion: 'Ergómetro de remo profesional con monitor PM5 y almacenamiento vertical',
        ubicacion: 'Zona Cardio - Piso 2',
        estado: 'disponible',
        fecha_adquisicion: '2024-05-20',
        costo: 32000.00,
        vida_util_anos: 15,
        frecuencia_mantenimiento_dias: 120,
        ultimo_mantenimiento: formatDate(new Date('2026-01-05')),
        proximo_mantenimiento: formatDate(addDays(new Date('2026-01-05'), 120)),
        instrucciones_uso: 'Ajustar reposapiés. Mantener técnica: piernas-cuerpo-brazos. No jalar excesivamente.',
        notas: 'Limpiar carril y revisar cadena regularmente'
    },
    {
        codigo: 'FUNC-001',
        nombre: 'TRX Sistema de Entrenamiento Suspensión',
        marca: 'TRX',
        modelo: 'PRO4',
        categoria: 'Funcional',
        descripcion: 'Sistema de entrenamiento en suspensión profesional con anclaje múltiple',
        ubicacion: 'Zona Funcional - Piso 2',
        estado: 'disponible',
        fecha_adquisicion: '2024-06-10',
        costo: 8000.00,
        vida_util_anos: 5,
        frecuencia_mantenimiento_dias: 60,
        ultimo_mantenimiento: formatDate(new Date('2026-01-20')),
        proximo_mantenimiento: formatDate(addDays(new Date('2026-01-20'), 60)),
        instrucciones_uso: 'Verificar anclaje antes de usar. Ajustar longitud de correas según ejercicio.',
        notas: 'Revisar desgaste de correas y mosquetones mensualmente'
    },
    {
        codigo: 'MULTI-001',
        nombre: 'Multiestación Home Gym',
        marca: 'BodySolid',
        modelo: 'BS-EXM3000',
        categoria: 'Fuerza',
        descripcion: 'Estación multigimnasio con 8 estaciones de ejercicio y 100kg de peso',
        ubicacion: 'Zona de Fuerza - Piso 2',
        estado: 'disponible',
        fecha_adquisicion: '2023-12-15',
        costo: 45000.00,
        vida_util_anos: 12,
        frecuencia_mantenimiento_dias: 90,
        ultimo_mantenimiento: formatDate(new Date('2025-12-30')),
        proximo_mantenimiento: formatDate(addDays(new Date('2025-12-30'), 90)),
        instrucciones_uso: 'Leer manual de ejercicios. Ajustar pines de peso correctamente. No sobrecargar.',
        notas: 'Máquina compleja - revisar todos los cables y poleas regularmente'
    }
];

// Función para insertar las máquinas
const insertarMaquinas = () => {
    try {
        console.log('🏋️  Iniciando inserción de 10 máquinas nuevas...\n');

        // Preparar statement de inserción
        const stmt = db.prepare(`
            INSERT INTO maquinas (
                codigo, nombre, marca, modelo, categoria, descripcion,
                ubicacion, estado, fecha_adquisicion, costo,
                vida_util_anos, frecuencia_mantenimiento_dias,
                ultimo_mantenimiento, proximo_mantenimiento,
                instrucciones_uso, notas, activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `);

        let insertadas = 0;
        let errores = 0;

        // Insertar cada máquina
        maquinas.forEach((maquina, index) => {
            try {
                stmt.run(
                    maquina.codigo,
                    maquina.nombre,
                    maquina.marca,
                    maquina.modelo,
                    maquina.categoria,
                    maquina.descripcion,
                    maquina.ubicacion,
                    maquina.estado,
                    maquina.fecha_adquisicion,
                    maquina.costo,
                    maquina.vida_util_anos,
                    maquina.frecuencia_mantenimiento_dias,
                    maquina.ultimo_mantenimiento,
                    maquina.proximo_mantenimiento,
                    maquina.instrucciones_uso,
                    maquina.notas
                );

                insertadas++;
                console.log(`✅ Máquina ${index + 1}/10 insertada: ${maquina.codigo} - ${maquina.nombre}`);
            } catch (error) {
                errores++;
                console.error(`❌ Error al insertar máquina ${index + 1}: ${error.message}`);
            }
        });

        console.log('\n' + '='.repeat(60));
        console.log(`📊 RESUMEN:`);
        console.log(`   ✅ Máquinas insertadas exitosamente: ${insertadas}`);
        console.log(`   ❌ Errores: ${errores}`);
        console.log('='.repeat(60));

        // Mostrar las máquinas insertadas
        if (insertadas > 0) {
            console.log('\n📋 MÁQUINAS EN LA BASE DE DATOS:');
            const todasLasMaquinas = db.prepare('SELECT id, codigo, nombre, categoria, estado FROM maquinas ORDER BY id DESC LIMIT 10').all();
            console.table(todasLasMaquinas);
        }

        console.log('\n✨ Script completado exitosamente!');

    } catch (error) {
        console.error('❌ Error crítico:', error);
        process.exit(1);
    }
};

// Ejecutar el script
insertarMaquinas();