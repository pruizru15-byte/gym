const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { exec } = require('child_process');
const { promisify } = require('util');
const db = require('../config/database');
const { formatDate } = require('../utils/dateUtils');

const execPromise = promisify(exec);

/**
 * Servicio de Backup
 * Gestiona respaldos de la base de datos y archivos
 * - Crear backups manuales
 * - Programar backups automáticos
 * - Gestión de retención (eliminar backups antiguos)
 * - Listar backups disponibles
 * - Restaurar desde backup
 */

class BackupService {
  constructor() {
    this.cronJob = null;
    this.backupDir = path.join(__dirname, '../../../backups');
    this.dbPath = path.join(__dirname, '../../../database/gym.db');
    this.uploadsPath = path.join(__dirname, '../../../uploads');
    
    // Crear directorio de backups si no existe
    this._ensureBackupDirectory();
  }

  /**
   * Asegura que existe el directorio de backups
   */
  _ensureBackupDirectory() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
        console.log('[Backup] Directorio de backups creado:', this.backupDir);
      }
    } catch (error) {
      console.error('[Backup] Error al crear directorio de backups:', error);
    }
  }

  /**
   * Genera un nombre de archivo para el backup
   */
  _generarNombreBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `backup_${timestamp}`;
  }

  /**
   * Copia un archivo de forma recursiva (para directorios)
   */
  async _copiarRecursivo(origen, destino) {
    try {
      const stats = fs.statSync(origen);

      if (stats.isDirectory()) {
        // Crear directorio destino
        if (!fs.existsSync(destino)) {
          fs.mkdirSync(destino, { recursive: true });
        }

        // Copiar contenido
        const archivos = fs.readdirSync(origen);
        for (const archivo of archivos) {
          const origenPath = path.join(origen, archivo);
          const destinoPath = path.join(destino, archivo);
          await this._copiarRecursivo(origenPath, destinoPath);
        }
      } else {
        // Copiar archivo
        fs.copyFileSync(origen, destino);
      }
    } catch (error) {
      console.error(`Error al copiar ${origen}:`, error);
      throw error;
    }
  }

  /**
   * Crea un backup manual de la base de datos y archivos
   * @returns {Object} Información del backup creado
   */
  async crearBackup() {
    const nombreBackup = this._generarNombreBackup();
    const backupPath = path.join(this.backupDir, nombreBackup);

    try {
      console.log('[Backup] Iniciando backup...');

      // Crear directorio para este backup
      fs.mkdirSync(backupPath, { recursive: true });

      // 1. Respaldar base de datos
      const dbBackupPath = path.join(backupPath, 'gym.db');
      if (fs.existsSync(this.dbPath)) {
        fs.copyFileSync(this.dbPath, dbBackupPath);
        console.log('[Backup] Base de datos respaldada');
      } else {
        console.warn('[Backup] No se encontró la base de datos en:', this.dbPath);
      }

      // 2. Respaldar carpeta uploads (si existe)
      const uploadsBackupPath = path.join(backupPath, 'uploads');
      if (fs.existsSync(this.uploadsPath)) {
        await this._copiarRecursivo(this.uploadsPath, uploadsBackupPath);
        console.log('[Backup] Archivos uploads respaldados');
      }

      // 3. Crear archivo de metadatos
      const metadata = {
        fecha: new Date().toISOString(),
        nombreBackup,
        archivos: {
          database: fs.existsSync(dbBackupPath),
          uploads: fs.existsSync(uploadsBackupPath)
        },
        tamaño: this._calcularTamañoDirectorio(backupPath)
      };

      fs.writeFileSync(
        path.join(backupPath, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      console.log(`[Backup] Backup completado: ${nombreBackup}`);
      console.log(`[Backup] Tamaño: ${(metadata.tamaño / 1024 / 1024).toFixed(2)} MB`);

      return {
        success: true,
        nombre: nombreBackup,
        path: backupPath,
        metadata
      };
    } catch (error) {
      console.error('[Backup] Error al crear backup:', error);
      
      // Limpiar backup incompleto
      if (fs.existsSync(backupPath)) {
        fs.rmSync(backupPath, { recursive: true, force: true });
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calcula el tamaño total de un directorio en bytes
   */
  _calcularTamañoDirectorio(dirPath) {
    let totalSize = 0;

    try {
      if (!fs.existsSync(dirPath)) {
        return 0;
      }

      const archivos = fs.readdirSync(dirPath);
      
      for (const archivo of archivos) {
        const archivoPath = path.join(dirPath, archivo);
        const stats = fs.statSync(archivoPath);

        if (stats.isDirectory()) {
          totalSize += this._calcularTamañoDirectorio(archivoPath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      console.error('Error al calcular tamaño:', error);
    }

    return totalSize;
  }

  /**
   * Lista todos los backups disponibles
   * @returns {Array} Lista de backups con sus metadatos
   */
  listarBackups() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return [];
      }

      const backups = [];
      const archivos = fs.readdirSync(this.backupDir);

      for (const archivo of archivos) {
        const backupPath = path.join(this.backupDir, archivo);
        const stats = fs.statSync(backupPath);

        if (stats.isDirectory()) {
          const metadataPath = path.join(backupPath, 'metadata.json');
          let metadata = {
            nombre: archivo,
            fecha: stats.mtime.toISOString(),
            tamaño: this._calcularTamañoDirectorio(backupPath)
          };

          // Leer metadata si existe
          if (fs.existsSync(metadataPath)) {
            const metadataContent = fs.readFileSync(metadataPath, 'utf8');
            metadata = { ...metadata, ...JSON.parse(metadataContent) };
          }

          backups.push(metadata);
        }
      }

      // Ordenar por fecha (más reciente primero)
      backups.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      return backups;
    } catch (error) {
      console.error('[Backup] Error al listar backups:', error);
      return [];
    }
  }

  /**
   * Elimina un backup específico
   * @param {string} nombreBackup - Nombre del backup a eliminar
   */
  eliminarBackup(nombreBackup) {
    try {
      const backupPath = path.join(this.backupDir, nombreBackup);

      if (!fs.existsSync(backupPath)) {
        return { success: false, error: 'Backup no encontrado' };
      }

      fs.rmSync(backupPath, { recursive: true, force: true });
      console.log(`[Backup] Backup eliminado: ${nombreBackup}`);

      return { success: true, mensaje: 'Backup eliminado correctamente' };
    } catch (error) {
      console.error('[Backup] Error al eliminar backup:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gestiona la retención de backups (elimina los más antiguos)
   * @param {number} diasRetencion - Días de retención (default: 30)
   * @param {number} maxBackups - Número máximo de backups a mantener (default: 10)
   */
  gestionarRetencion(diasRetencion = 30, maxBackups = 10) {
    try {
      const backups = this.listarBackups();
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasRetencion);
      
      let eliminados = 0;

      // Eliminar backups por antigüedad
      backups.forEach((backup, index) => {
        const fechaBackup = new Date(backup.fecha);
        const esAntiguo = fechaBackup < fechaLimite;
        const excedeLimite = index >= maxBackups;

        if (esAntiguo || excedeLimite) {
          const resultado = this.eliminarBackup(backup.nombre || backup.nombreBackup);
          if (resultado.success) {
            eliminados++;
          }
        }
      });

      console.log(`[Backup] Retención aplicada: ${eliminados} backups eliminados`);
      return { success: true, eliminados };
    } catch (error) {
      console.error('[Backup] Error en gestión de retención:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Restaura la base de datos desde un backup
   * @param {string} nombreBackup - Nombre del backup a restaurar
   * NOTA: Requiere reiniciar el servidor después de la restauración
   */
  async restaurarBackup(nombreBackup) {
    const backupPath = path.join(this.backupDir, nombreBackup);

    try {
      if (!fs.existsSync(backupPath)) {
        return { success: false, error: 'Backup no encontrado' };
      }

      console.log('[Backup] Iniciando restauración...');

      // 1. Crear backup de seguridad antes de restaurar
      const backupSeguridad = await this.crearBackup();
      if (!backupSeguridad.success) {
        return { 
          success: false, 
          error: 'No se pudo crear backup de seguridad' 
        };
      }

      // 2. Restaurar base de datos
      // NOTA: La base de datos debe estar cerrada para poder copiarla
      // En SQLite, esto requiere que no haya conexiones activas
      // Por eso se debe reiniciar el servidor después de la restauración
      const dbBackupPath = path.join(backupPath, 'gym.db');
      if (fs.existsSync(dbBackupPath)) {
        fs.copyFileSync(dbBackupPath, this.dbPath);
        console.log('[Backup] Base de datos restaurada');
      }

      // 3. Restaurar uploads
      const uploadsBackupPath = path.join(backupPath, 'uploads');
      if (fs.existsSync(uploadsBackupPath)) {
        // Limpiar uploads actual
        if (fs.existsSync(this.uploadsPath)) {
          fs.rmSync(this.uploadsPath, { recursive: true, force: true });
        }
        await this._copiarRecursivo(uploadsBackupPath, this.uploadsPath);
        console.log('[Backup] Archivos uploads restaurados');
      }

      console.log('[Backup] Restauración completada');
      console.log('[Backup] ⚠️  IMPORTANTE: Reinicie el servidor para aplicar los cambios');

      return {
        success: true,
        mensaje: 'Backup restaurado correctamente. REINICIE EL SERVIDOR para aplicar los cambios.',
        backupSeguridad: backupSeguridad.nombre,
        requiereReinicio: true
      };
    } catch (error) {
      console.error('[Backup] Error al restaurar backup:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Inicia el trabajo cron para backups automáticos
   * @param {string} cronExpression - Expresión cron (default: diario a las 2 AM)
   */
  iniciarBackupsAutomaticos(cronExpression = '0 2 * * *') {
    if (this.cronJob) {
      console.log('[Backup] Cron job de backups ya está en ejecución');
      return;
    }

    try {
      this.cronJob = cron.schedule(cronExpression, async () => {
        console.log('[Backup] Ejecutando backup automático...');
        const resultado = await this.crearBackup();
        
        if (resultado.success) {
          // Aplicar política de retención después de cada backup
          this.gestionarRetencion(30, 10);
        }
      });

      console.log(`[Backup] Backups automáticos iniciados con expresión: ${cronExpression}`);
    } catch (error) {
      console.error('[Backup] Error al iniciar backups automáticos:', error);
    }
  }

  /**
   * Detiene el trabajo cron de backups automáticos
   */
  detenerBackupsAutomaticos() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('[Backup] Backups automáticos detenidos');
    }
  }

  /**
   * Obtiene estadísticas de los backups
   */
  obtenerEstadisticas() {
    try {
      const backups = this.listarBackups();
      const tamañoTotal = backups.reduce((sum, backup) => sum + (backup.tamaño || 0), 0);

      return {
        totalBackups: backups.length,
        tamañoTotal: tamañoTotal,
        tamañoTotalMB: (tamañoTotal / 1024 / 1024).toFixed(2),
        backupMasReciente: backups[0] || null,
        backupMasAntiguo: backups[backups.length - 1] || null
      };
    } catch (error) {
      console.error('[Backup] Error al obtener estadísticas:', error);
      return null;
    }
  }
}

// Exportar instancia única del servicio (Singleton)
const backupService = new BackupService();
module.exports = backupService;
