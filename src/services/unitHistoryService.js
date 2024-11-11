// src/services/unitHistoryService.js
import { db } from "../firebase";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

export const unitHistoryService = {
  // Verifica y crea la estructura base del historial si no existe
  async ensureUnitHistoryStructure(unitId) {
    try {
      const unitHistoryRef = doc(db, "unit-history", unitId);
      const unitHistoryDoc = await getDoc(unitHistoryRef);

      if (!unitHistoryDoc.exists()) {
        await setDoc(unitHistoryRef, {
          createdAt: serverTimestamp(),
          unitId,
        });
      }
    } catch (error) {
      console.error(
        `Error asegurando estructura para unidad ${unitId}:`,
        error
      );
      throw error;
    }
  },

  // Añade una nueva lectura al historial
  async addReadingToHistory(unitId, readingData) {
    try {
      console.log("Iniciando guardado de lectura en historial:", {
        unitId,
        readingData,
      });

      // Validar datos requeridos
      const requiredFields = ["mainReadingId", "date", "reading"];
      const missingFields = requiredFields.filter(
        (field) => !readingData[field]
      );

      if (missingFields.length > 0) {
        throw new Error(
          `Faltan campos requeridos: ${missingFields.join(", ")}`
        );
      }

      // Asegurar que existe la estructura base
      await this.ensureUnitHistoryStructure(unitId);

      // Preparar datos normalizados
      const historyData = {
        date: readingData.date,
        reading: Number(readingData.reading),
        previousReading: Number(readingData.previousReading || 0),
        consumption: Number(readingData.consumption || 0),
        individualCost: Number(readingData.individualCost || 0),
        commonAreaCost: Number(readingData.commonAreaCost || 0),
        totalCost: Number(readingData.totalCost || 0),
        createdAt: serverTimestamp(),
      };

      // Guardar en la subcolección readings
      const readingRef = doc(
        db,
        `unit-history/${unitId}/readings/${readingData.mainReadingId}`
      );

      await setDoc(readingRef, historyData);

      // Verificar la escritura
      const verification = await getDoc(readingRef);
      if (!verification.exists()) {
        throw new Error("Fallo en la verificación de escritura");
      }

      console.log("Lectura guardada exitosamente en el historial");
      return true;
    } catch (error) {
      console.error("Error guardando lectura en historial:", error);
      throw error;
    }
  },

  // Obtiene el historial de lecturas de una unidad
  async getUnitHistory(unitId) {
    try {
      const readingsRef = collection(db, `unit-history/${unitId}/readings`);
      const q = query(readingsRef, orderBy("date", "desc"));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error obteniendo historial de unidad:", error);
      throw error;
    }
  },

  // Actualiza el historial desde una lectura principal
  async updateHistoryFromMainReading(mainReading) {
    try {
      const batch = writeBatch(db);
      const updates = [];

      for (const [unitId, reading] of Object.entries(
        mainReading.unitReadings
      )) {
        // Asegurar estructura base primero
        await this.ensureUnitHistoryStructure(unitId);

        const readingRef = doc(
          db,
          `unit-history/${unitId}/readings/${mainReading.id}`
        );

        const historyData = {
          date: mainReading.date,
          reading: Number(reading.reading),
          previousReading: Number(reading.previousReading || 0),
          consumption: Number(reading.consumption || 0),
          individualCost: Number(reading.individualCost || 0),
          commonAreaCost: Number(reading.commonAreaCost || 0),
          totalCost: Number(reading.totalCost || 0),
          createdAt: serverTimestamp(),
        };

        batch.set(readingRef, historyData);
        updates.push({ unitId, data: historyData });
      }

      await batch.commit();

      // Verificar actualizaciones
      for (const update of updates) {
        const verificationRef = doc(
          db,
          `unit-history/${update.unitId}/readings/${mainReading.id}`
        );
        const verificationDoc = await getDoc(verificationRef);
        if (!verificationDoc.exists()) {
          throw new Error(
            `Fallo en la verificación para unidad ${update.unitId}`
          );
        }
      }

      return updates;
    } catch (error) {
      console.error(
        "Error actualizando historial desde lectura principal:",
        error
      );
      throw error;
    }
  },

  // unitHistoryService.js
  async getUnitConsumptionStats(unitId) {
    try {
      // Obtener el documento de la unidad con su mapa de lecturas
      const unitHistoryRef = doc(db, "unit-history", unitId);
      const unitHistoryDoc = await getDoc(unitHistoryRef);

      if (!unitHistoryDoc.exists()) {
        throw new Error("No hay historial disponible para esta unidad");
      }

      const historyData = unitHistoryDoc.data();
      const readings = historyData.readings || {};

      // Convertir el mapa de lecturas en un array y ordenarlo por fecha
      const readingsArray = Object.entries(readings)
        .map(([readingId, data]) => ({
          id: readingId,
          ...data,
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      // Calcular estadísticas
      const consumptions = readingsArray.map((r) => r.consumption || 0);

      return {
        consumptionTrend: readingsArray.map((reading) => ({
          date: reading.date,
          consumption: reading.consumption || 0,
        })),
        averageConsumption: consumptions.length
          ? consumptions.reduce((a, b) => a + b, 0) / consumptions.length
          : 0,
        minConsumption: consumptions.length ? Math.min(...consumptions) : 0,
        maxConsumption: consumptions.length ? Math.max(...consumptions) : 0,
      };
    } catch (error) {
      console.error("Error obteniendo estadísticas de consumo:", error);
      throw error;
    }
  },
};
