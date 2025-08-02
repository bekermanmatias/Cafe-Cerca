// controllers/etiquetasController.js
import Etiqueta from '../models/Etiqueta.js';

export const etiquetasController = {
  // GET /etiquetas - Obtener todas las etiquetas activas
  async getAll(req, res) {
    try {
      const { incluirInactivas = false } = req.query;
      
      const whereClause = incluirInactivas === 'true' 
        ? {} 
        : { activo: true };

      const etiquetas = await Etiqueta.findAll({
        where: whereClause,
        order: [['nombre', 'ASC']]
      });

      res.json(etiquetas);
    } catch (error) {
      console.error('Error al obtener etiquetas:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error.message 
      });
    }
  },

  // GET /etiquetas/:id - Obtener una etiqueta por ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      
      const etiqueta = await Etiqueta.findByPk(id);
      
      if (!etiqueta) {
        return res.status(404).json({ error: 'Etiqueta no encontrada' });
      }

      res.json(etiqueta);
    } catch (error) {
      console.error('Error al obtener etiqueta:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error.message 
      });
    }
  },

  // POST /etiquetas - Crear nueva etiqueta
  async create(req, res) {
    try {
      const { nombre, icono } = req.body;

      // Validaciones básicas
      if (!nombre || !icono) {
        return res.status(400).json({ 
          error: 'Nombre e ícono son requeridos' 
        });
      }

      // Verificar si ya existe una etiqueta con ese nombre
      const etiquetaExistente = await Etiqueta.findOne({ 
        where: { nombre: nombre.trim() } 
      });

      if (etiquetaExistente) {
        return res.status(400).json({ 
          error: 'Ya existe una etiqueta con ese nombre' 
        });
      }

      const nuevaEtiqueta = await Etiqueta.create({
        nombre: nombre.trim(),
        icono: icono.trim()
      });

      res.status(201).json(nuevaEtiqueta);
    } catch (error) {
      console.error('Error al crear etiqueta:', error);
      
      // Manejar errores de validación de Sequelize
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ 
          error: 'Datos inválidos',
          details: error.errors.map(err => err.message)
        });
      }

      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error.message 
      });
    }
  },

  // PUT /etiquetas/:id - Actualizar etiqueta
  async update(req, res) {
    try {
      const { id } = req.params;
      const { nombre, icono, activo } = req.body;

      const etiqueta = await Etiqueta.findByPk(id);
      
      if (!etiqueta) {
        return res.status(404).json({ error: 'Etiqueta no encontrada' });
      }

      // Verificar nombre duplicado (excluyendo la etiqueta actual)
      if (nombre && nombre.trim() !== etiqueta.nombre) {
        const etiquetaExistente = await Etiqueta.findOne({ 
          where: { 
            nombre: nombre.trim(),
            id: { $ne: id } // Excluir la etiqueta actual
          } 
        });

        if (etiquetaExistente) {
          return res.status(400).json({ 
            error: 'Ya existe una etiqueta con ese nombre' 
          });
        }
      }

      // Actualizar campos
      const datosActualizacion = {};
      if (nombre) datosActualizacion.nombre = nombre.trim();
      if (icono) datosActualizacion.icono = icono.trim();
      if (typeof activo === 'boolean') datosActualizacion.activo = activo;

      await etiqueta.update(datosActualizacion);

      res.json(etiqueta);
    } catch (error) {
      console.error('Error al actualizar etiqueta:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ 
          error: 'Datos inválidos',
          details: error.errors.map(err => err.message)
        });
      }

      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error.message 
      });
    }
  },

  // DELETE /etiquetas/:id - Eliminar etiqueta (soft delete)
  async delete(req, res) {
    try {
      const { id } = req.params;
      const { forzarEliminacion = false } = req.query;

      const etiqueta = await Etiqueta.findByPk(id);
      
      if (!etiqueta) {
        return res.status(404).json({ error: 'Etiqueta no encontrada' });
      }

      if (forzarEliminacion === 'true') {
        // Eliminación física (usar con cuidado)
        await etiqueta.destroy();
        res.json({ message: 'Etiqueta eliminada permanentemente' });
      } else {
        // Soft delete - solo marcar como inactiva
        await etiqueta.update({ activo: false });
        res.json({ message: 'Etiqueta desactivada exitosamente' });
      }
    } catch (error) {
      console.error('Error al eliminar etiqueta:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error.message 
      });
    }
  },

  // PUT /etiquetas/:id/restaurar - Reactivar etiqueta
  async restaurar(req, res) {
    try {
      const { id } = req.params;

      const etiqueta = await Etiqueta.findByPk(id);
      
      if (!etiqueta) {
        return res.status(404).json({ error: 'Etiqueta no encontrada' });
      }

      await etiqueta.update({ activo: true });
      res.json({ message: 'Etiqueta reactivada exitosamente', etiqueta });
    } catch (error) {
      console.error('Error al restaurar etiqueta:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error.message 
      });
    }
  }
};