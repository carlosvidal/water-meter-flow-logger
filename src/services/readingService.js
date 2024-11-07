// src/services/readingService.js
import { db } from "../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  getDoc,
  getDocs,
  limit,
  serverTimestamp,
} from "firebase/firestore";

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

  // readingService.js
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

      // Crear el documento
      const docRef = await addDoc(collection(db, "meter-readings"), {
        ...readingData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("Lectura creada exitosamente con ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error en createMainReading:", error);
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

  // Cerrar lectura
  // En readingService.js

  async closeReading(readingId) {
    try {
      const docRef = doc(db, "meter-readings", readingId);
      const readingSnap = await getDoc(docRef);

      if (!readingSnap.exists()) {
        throw new Error("Lectura no encontrada");
      }

      const readingData = readingSnap.data();

      // Validaciones
      if (readingData.status === "closed") {
        throw new Error("La lectura ya está cerrada");
      }

      if (
        !readingData.reading ||
        !readingData.cost ||
        !readingData.unitReadings
      ) {
        throw new Error("Faltan datos requeridos para cerrar la lectura");
      }

      // Procesar lecturas individuales
      const processedReadings = {};
      let totalUnitConsumption = 0;

      // Primero obtenemos las lecturas anteriores
      const previousReadings = await this.getPreviousReadings(
        readingData.condoId
      );

      // Procesamos cada lectura
      for (const [unitId, unitData] of Object.entries(
        readingData.unitReadings
      )) {
        const currentReading = Number(unitData.reading || unitData);
        const previousReading = Number(previousReadings[unitId] || 0);
        const consumption = currentReading - previousReading;

        if (isNaN(currentReading) || isNaN(previousReading)) {
          throw new Error(`Lecturas inválidas para la unidad ${unitId}`);
        }

        totalUnitConsumption += consumption;

        processedReadings[unitId] = {
          reading: currentReading,
          previousReading: previousReading,
          consumption: consumption,
        };
      }

      const totalReading = Number(readingData.reading);
      const totalCost = Number(readingData.cost);

      if (isNaN(totalReading) || isNaN(totalCost)) {
        throw new Error("Lectura total o costo total inválidos");
      }

      // Calcular áreas comunes
      const commonAreaConsumption = Math.max(
        0,
        totalReading - totalUnitConsumption
      );
      const costPerUnit = totalCost / totalReading;
      const commonAreaCostPerUnit =
        (commonAreaConsumption * costPerUnit) /
        Object.keys(processedReadings).length;

      // Calcular costos individuales
      for (const unitId in processedReadings) {
        const unitData = processedReadings[unitId];
        unitData.individualCost = Number(
          (unitData.consumption * costPerUnit).toFixed(2)
        );
        unitData.commonAreaCost = Number(commonAreaCostPerUnit.toFixed(2));
        unitData.totalCost = Number(
          (unitData.individualCost + unitData.commonAreaCost).toFixed(2)
        );
      }

      const summary = {
        totalReading,
        totalCost,
        totalUnitConsumption,
        commonAreaConsumption,
        commonAreaCostPerUnit: Number(commonAreaCostPerUnit.toFixed(2)),
        costPerUnit: Number(costPerUnit.toFixed(2)),
      };

      // Actualizar documento
      await updateDoc(docRef, {
        status: "closed",
        unitReadings: processedReadings,
        commonAreaConsumption,
        commonAreaCostPerUnit,
        costPerUnit,
        totalUnitConsumption,
        closedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        summary,
      });

      return {
        id: readingId,
        processedReadings,
        summary,
      };
    } catch (error) {
      console.error("Error closing reading:", error);
      throw error;
    }
  },
};
