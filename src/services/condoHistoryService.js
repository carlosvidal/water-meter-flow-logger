// src/services/condoHistoryService.js
import { db } from "../firebase";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

export const condoHistoryService = {
  // Asegura que existe la estructura base del historial para un condominio
  async ensureCondoHistoryStructure(condoId) {
    try {
      const condoHistoryRef = doc(db, "condo-history", condoId);
      const condoHistoryDoc = await getDoc(condoHistoryRef);

      if (!condoHistoryDoc.exists()) {
        await setDoc(condoHistoryRef, {
          createdAt: serverTimestamp(),
          condoId,
          readings: {},
        });
      }
    } catch (error) {
      console.error(
        `Error asegurando estructura para condominio ${condoId}:`,
        error
      );
      throw error;
    }
  },

  // Actualiza el historial con una nueva lectura
  async updateHistoryFromReading(readingId, readingData) {
    try {
      const { condoId, date, reading, cost, unitReadings, status } =
        readingData;

      if (!condoId || !date || !reading || !cost || !unitReadings) {
        throw new Error("Faltan datos requeridos para actualizar el historial");
      }

      // Asegurar que existe la estructura base
      await this.ensureCondoHistoryStructure(condoId);

      // Calcular totales y promedios
      const totalUnits = Object.keys(unitReadings).length;
      let totalConsumption = 0;
      let totalIndividualCost = 0;
      let totalCommonAreaCost = 0;

      Object.values(unitReadings).forEach((unit) => {
        totalConsumption += Number(unit.consumption || 0);
        totalIndividualCost += Number(unit.individualCost || 0);
        totalCommonAreaCost += Number(unit.commonAreaCost || 0);
      });

      // Preparar datos del historial
      const historyData = {
        date,
        mainReading: Number(reading),
        totalCost: Number(cost),
        unitCount: totalUnits,
        totalConsumption,
        averageConsumption: totalConsumption / totalUnits,
        totalIndividualCost,
        totalCommonAreaCost,
        commonAreaConsumption: Number(reading) - totalConsumption,
        status,
        updatedAt: serverTimestamp(),
      };

      // Actualizar el documento de historial
      const condoHistoryRef = doc(db, "condo-history", condoId);
      await setDoc(
        condoHistoryRef,
        {
          readings: {
            [readingId]: historyData,
          },
        },
        { merge: true }
      );

      return historyData;
    } catch (error) {
      console.error("Error actualizando historial del condominio:", error);
      throw error;
    }
  },

  // Obtiene estadísticas del condominio
  async getCondoStats(condoId) {
    try {
      const condoHistoryRef = doc(db, "condo-history", condoId);
      const condoHistoryDoc = await getDoc(condoHistoryRef);

      if (!condoHistoryDoc.exists()) {
        throw new Error("No hay historial disponible para este condominio");
      }

      const historyData = condoHistoryDoc.data();
      const readings = historyData.readings || {};

      // Convertir el mapa de lecturas en array y ordenar por fecha
      const readingsArray = Object.entries(readings)
        .map(([readingId, data]) => ({
          id: readingId,
          ...data,
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      // Calcular estadísticas
      const consumptions = readingsArray.map((r) => r.totalConsumption || 0);
      const costs = readingsArray.map((r) => r.totalCost || 0);

      return {
        consumptionTrend: readingsArray.map((reading) => ({
          date: reading.date,
          consumption: reading.totalConsumption || 0,
          commonArea: reading.commonAreaConsumption || 0,
          cost: reading.totalCost || 0,
        })),
        averageConsumption: consumptions.length
          ? consumptions.reduce((a, b) => a + b, 0) / consumptions.length
          : 0,
        averageCost: costs.length
          ? costs.reduce((a, b) => a + b, 0) / costs.length
          : 0,
        minConsumption: consumptions.length ? Math.min(...consumptions) : 0,
        maxConsumption: consumptions.length ? Math.max(...consumptions) : 0,
        minCost: costs.length ? Math.min(...costs) : 0,
        maxCost: costs.length ? Math.max(...costs) : 0,
        lastReading: readingsArray[0] || null,
      };
    } catch (error) {
      console.error("Error obteniendo estadísticas del condominio:", error);
      throw error;
    }
  },
};
