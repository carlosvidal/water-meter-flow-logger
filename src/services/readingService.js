// src/services/readingService.js
import { db } from "../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  setDoc,
  doc,
  query,
  where,
  orderBy,
  getDoc,
  getDocs,
  runTransaction,
  limit,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { unitHistoryService } from "./unitHistoryService";
import { condoHistoryService } from "./condoHistoryService";

export const readingService = {
  // Obtener unidades de un condominio
  async getCondoUnits(condoId) {
    try {
      const q = query(
        collection(db, "units"),
        where("condoId", "==", condoId),
        where("isActive", "==", true)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting condo units:", error);
      throw error;
    }
  },

  // Verificar si es primera lectura
  async isFirstReading(condoId) {
    try {
      const q = query(
        collection(db, "meter-readings"),
        where("condoId", "==", condoId),
        orderBy("date", "desc"),
        limit(1)
      );
      const snapshot = await getDocs(q);
      return snapshot.empty;
    } catch (error) {
      console.error("Error checking first reading:", error);
      throw error;
    }
  },

  // Obtener última lectura cerrada
  async getLastClosedReading(condoId) {
    try {
      const q = query(
        collection(db, "meter-readings"),
        where("condoId", "==", condoId),
        where("status", "==", "closed"),
        orderBy("date", "desc"),
        limit(1)
      );
      const snapshot = await getDocs(q);
      return snapshot.empty
        ? null
        : {
            id: snapshot.docs[0].id,
            ...snapshot.docs[0].data(),
          };
    } catch (error) {
      console.error("Error getting last reading:", error);
      throw error;
    }
  },

  // Obtener lecturas anteriores
  async getPreviousReadings(condoId) {
    try {
      const lastReading = await this.getLastClosedReading(condoId);
      if (!lastReading) return {};

      const readings = {};
      for (const [unitId, data] of Object.entries(lastReading.unitReadings)) {
        readings[unitId] = data.reading;
      }
      return readings;
    } catch (error) {
      console.error("Error getting previous readings:", error);
      throw error;
    }
  },

  // Crear primera lectura (lectura base)
  async createFirstReading(condoId, date, unitReadings) {
    try {
      if (!unitReadings || Object.keys(unitReadings).length === 0) {
        throw new Error("Se requieren las lecturas de todas las unidades");
      }

      const formattedReadings = {};
      for (const [unitId, reading] of Object.entries(unitReadings)) {
        formattedReadings[unitId] = {
          reading: Number(reading),
          previousReading: 0,
          consumption: 0,
        };
      }

      const mainReadingDoc = {
        condoId,
        date,
        isFirstReading: true,
        unitReadings: formattedReadings,
        status: "closed",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(db, "meter-readings"),
        mainReadingDoc
      );
      return docRef.id;
    } catch (error) {
      console.error("Error creating first reading:", error);
      throw error;
    }
  },

  // Crear lectura normal

  // Actualizar lectura
  async updateMainReading(readingId, readingData) {
    try {
      const docRef = doc(db, "meter-readings", readingId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Lectura no encontrada");
      }

      const updateData = {
        ...readingData,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, updateData);
      return readingId;
    } catch (error) {
      console.error("Error updating reading:", error);
      throw error;
    }
  },

  async createMainReading(readingData) {
    try {
      console.log("=== INICIO DE CREACIÓN DE LECTURA ===");
      console.log("Datos recibidos:", JSON.stringify(readingData, null, 2));

      // Validaciones
      if (!readingData) {
        throw new Error("No se recibieron datos de lectura");
      }

      // Validar estructura básica
      const requiredFields = [
        "condoId",
        "date",
        "reading",
        "cost",
        "unitReadings",
        "status",
      ];
      const missingFields = requiredFields.filter(
        (field) => !readingData[field]
      );

      if (missingFields.length > 0) {
        console.error("Faltan campos:", missingFields);
        console.error("Datos recibidos:", readingData);
        throw new Error(
          `Faltan campos requeridos: ${missingFields.join(", ")}`
        );
      }

      // Validar lecturas individuales
      if (
        !readingData.unitReadings ||
        Object.keys(readingData.unitReadings).length === 0
      ) {
        throw new Error("No hay lecturas individuales registradas");
      }

      // Crear el documento de lectura
      const docRef = await addDoc(collection(db, "meter-readings"), {
        ...readingData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Crear/actualizar documentos de historial usando mapas
      const batch = writeBatch(db);
      const unitIds = Object.keys(readingData.unitReadings);

      for (const unitId of unitIds) {
        const unitHistoryRef = doc(db, "unit-history", unitId);
        batch.set(
          unitHistoryRef,
          {
            [`readings.${docRef.id}`]: {
              status: "pending",
              createdAt: serverTimestamp(),
            },
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      await batch.commit();
      console.log("Lectura y historiales creados exitosamente");

      return docRef.id;
    } catch (error) {
      console.error("Error en createMainReading:", error);
      throw error;
    }
  },

  async closeReading(readingId) {
    console.log("====== INICIANDO CIERRE DE LECTURA ======");

    try {
      const readingRef = doc(db, "meter-readings", readingId);
      const readingSnapshot = await getDoc(readingRef);

      if (!readingSnapshot.exists()) {
        throw new Error("Lectura no encontrada");
      }

      const readingData = readingSnapshot.data();
      console.log("Datos actuales de lectura:", readingData);

      if (readingData.status === "closed") {
        throw new Error("La lectura ya está cerrada");
      }

      // Obtener lecturas anteriores
      const previousReadings = await this.getPreviousReadings(
        readingData.condoId
      );
      console.log("Lecturas anteriores:", previousReadings);

      // Preparar todos los cálculos
      const processedReadings = {};
      let totalUnitConsumption = 0;

      // Calcular consumos
      for (const [unitId, unitData] of Object.entries(
        readingData.unitReadings
      )) {
        const currentReading = Number(unitData.reading || unitData);
        const previousReading = Number(previousReadings[unitId] || 0);
        const consumption = currentReading - previousReading;

        totalUnitConsumption += consumption;
        processedReadings[unitId] = {
          reading: currentReading,
          previousReading: previousReading,
          consumption: consumption,
        };
      }

      // Calcular costos
      const totalReading = Number(readingData.reading);
      const totalCost = Number(readingData.cost);
      const commonAreaConsumption = Math.max(
        0,
        totalReading - totalUnitConsumption
      );
      const costPerUnit = totalCost / totalReading;
      const commonAreaCostPerUnit =
        (commonAreaConsumption * costPerUnit) /
        Object.keys(processedReadings).length;

      // Preparar las actualizaciones
      const batch = writeBatch(db);

      // Actualizar los documentos de historial de cada unidad
      for (const [unitId, unitData] of Object.entries(processedReadings)) {
        const individualCost = Number(
          (unitData.consumption * costPerUnit).toFixed(2)
        );
        const commonAreaCost = Number(commonAreaCostPerUnit.toFixed(2));
        const totalUnitCost = Number(
          (individualCost + commonAreaCost).toFixed(2)
        );

        // Actualizar datos en processedReadings para la lectura principal
        processedReadings[unitId] = {
          ...unitData,
          individualCost,
          commonAreaCost,
          totalCost: totalUnitCost,
        };

        // Actualizar historial usando el mapa
        const unitHistoryRef = doc(db, "unit-history", unitId);
        batch.update(unitHistoryRef, {
          [`readings.${readingId}`]: {
            date: readingData.date,
            reading: unitData.reading,
            previousReading: unitData.previousReading,
            consumption: unitData.consumption,
            individualCost,
            commonAreaCost,
            totalCost: totalUnitCost,
            updatedAt: serverTimestamp(),
            status: "completed",
          },
          updatedAt: serverTimestamp(),
        });
      }

      // Preparar datos actualizados de la lectura principal
      const updatedReadingData = {
        unitReadings: processedReadings,
        commonAreaConsumption,
        commonAreaCostPerUnit,
        costPerUnit,
        totalUnitConsumption,
        status: "closed",
        closedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        calculations: {
          completed: true,
          timestamp: serverTimestamp(),
        },
      };

      // Actualizar la lectura principal
      batch.update(readingRef, updatedReadingData);

      // Actualizar el historial del condominio
      await condoHistoryService.updateHistoryFromReading(readingId, {
        ...readingData,
        ...updatedReadingData,
        unitReadings: processedReadings,
      });

      // Ejecutar todas las actualizaciones
      await batch.commit();

      console.log("====== CIERRE DE LECTURA COMPLETADO CON ÉXITO ======");
      return { success: true, readingId };
    } catch (error) {
      console.error("Error en closeReading:", error);
      // Revertir estado
      try {
        await setDoc(
          doc(db, "meter-readings", readingId),
          {
            status: "open",
            error: error.message,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (rollbackError) {
        console.error("Error en rollback:", rollbackError);
      }
      throw error;
    }
  },

  // En readingService.js
  async getReading(readingId) {
    try {
      const docRef = doc(db, "meter-readings", readingId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Lectura no encontrada");
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    } catch (error) {
      console.error("Error getting reading:", error);
      throw error;
    }
  },

  // Método de utilidad para verificar el estado del historial
  async verifyUnitHistory(readingId) {
    try {
      const reading = await getDoc(doc(db, "meter-readings", readingId));
      if (!reading.exists()) {
        throw new Error("Lectura no encontrada");
      }

      const readingData = reading.data();
      console.log("Datos de lectura principal:", readingData);

      for (const unitId of Object.keys(readingData.unitReadings)) {
        const historyPath = `unit-history/${unitId}/readings/${readingId}`;
        const historyDoc = await getDoc(doc(db, historyPath));

        console.log(`Estado del historial para unidad ${unitId}:`, {
          path: historyPath,
          exists: historyDoc.exists(),
          data: historyDoc.data(),
        });
      }
    } catch (error) {
      console.error("Error en verificación:", error);
      throw error;
    }
  },

  async verifyReadingStructure(readingId) {
    try {
      console.log("=== INICIANDO VERIFICACIÓN DE ESTRUCTURA ===");

      // Obtener la lectura principal
      const mainReadingRef = doc(db, "meter-readings", readingId);
      const mainReadingDoc = await getDoc(mainReadingRef);

      if (!mainReadingDoc.exists()) {
        throw new Error(`Lectura ${readingId} no encontrada`);
      }

      const mainReading = mainReadingDoc.data();
      console.log("Lectura principal:", {
        id: readingId,
        data: mainReading,
      });

      // Verificar cada unidad
      const unitIds = Object.keys(mainReading.unitReadings || {});
      console.log(`Verificando ${unitIds.length} unidades...`);

      for (const unitId of unitIds) {
        const path = `unit-history/${unitId}/readings/${readingId}`;
        const historyDoc = await getDoc(doc(db, path));

        console.log(`\nUnidad ${unitId}:`);
        console.log("Ruta:", path);
        console.log("Existe:", historyDoc.exists());

        if (historyDoc.exists()) {
          const data = historyDoc.data();
          console.log("Datos:", {
            date: data.date,
            reading: data.reading,
            previousReading: data.previousReading,
            consumption: data.consumption,
            individualCost: data.individualCost,
            commonAreaCost: data.commonAreaCost,
            totalCost: data.totalCost,
            createdAt: data.createdAt,
          });

          // Verificar campos requeridos
          const requiredFields = [
            "date",
            "reading",
            "previousReading",
            "consumption",
            "individualCost",
            "commonAreaCost",
            "totalCost",
            "createdAt",
          ];

          const missingFields = requiredFields.filter((field) => !data[field]);
          if (missingFields.length > 0) {
            console.error("⚠️ Campos faltantes:", missingFields.join(", "));
          } else {
            console.log("✅ Todos los campos requeridos están presentes");
          }
        } else {
          console.error("❌ Documento de historial no encontrado");
        }
      }

      console.log("\n=== VERIFICACIÓN COMPLETADA ===");
    } catch (error) {
      console.error("Error en verificación:", error);
      throw error;
    }
  },
};
