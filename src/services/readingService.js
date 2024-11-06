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

  async createMainReading(readingData) {
    try {
      console.log("=== Iniciando creación de lectura ===");
      console.log(
        "Datos recibidos completos:",
        JSON.stringify(readingData, null, 2)
      );

      // Validación más estricta
      const requiredFields = [
        "condoId",
        "date",
        "reading",
        "cost",
        "unitReadings",
      ];
      const missingFields = requiredFields.filter(
        (field) => !readingData[field]
      );

      if (missingFields.length > 0) {
        console.error("Campos faltantes:", missingFields);
        throw new Error(
          `Faltan campos requeridos: ${missingFields.join(", ")}`
        );
      }

      if (
        !readingData.unitReadings ||
        typeof readingData.unitReadings !== "object"
      ) {
        console.error("unitReadings inválido:", readingData.unitReadings);
        throw new Error(
          "El objeto unitReadings es requerido y debe ser un objeto"
        );
      }

      // Validar datos básicos
      if (
        !readingData.condoId ||
        !readingData.date ||
        !readingData.reading ||
        !readingData.cost
      ) {
        const missing = ["condoId", "date", "reading", "cost"].filter(
          (field) => !readingData[field]
        );
        throw new Error(`Faltan datos requeridos: ${missing.join(", ")}`);
      }

      // Validar lecturas individuales
      if (!readingData.unitReadings) {
        console.error("unitReadings es undefined o null:", readingData);
        throw new Error("El objeto unitReadings es requerido");
      }

      const unitReadingsCount = Object.keys(readingData.unitReadings).length;
      if (unitReadingsCount === 0) {
        throw new Error("No hay lecturas individuales");
      }

      console.log(
        `Encontradas ${unitReadingsCount} lecturas individuales:`,
        readingData.unitReadings
      );

      console.log(`Encontradas ${unitReadingsCount} lecturas individuales`);

      // Obtener y validar contra lectura anterior...
      const previousReading = await this.getLastClosedReading(
        readingData.condoId
      );

      // Formatear lecturas
      const formattedReadings = {};
      for (const [unitId, reading] of Object.entries(
        readingData.unitReadings
      )) {
        const previousValue =
          previousReading?.unitReadings?.[unitId]?.reading || 0;
        const currentValue = Number(reading);

        console.log(`Procesando unidad ${unitId}:`, {
          currentValue,
          previousValue,
          rawReading: reading,
        });

        if (isNaN(currentValue) || currentValue <= 0) {
          throw new Error(`Lectura inválida para unidad ${unitId}: ${reading}`);
        }

        formattedReadings[unitId] = {
          reading: currentValue,
          previousReading: previousValue,
          consumption: currentValue - previousValue,
        };
      }

      // Crear documento
      const mainReadingDoc = {
        ...readingData,
        unitReadings: formattedReadings,
        status: "open",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log("Documento final:", mainReadingDoc);

      const docRef = await addDoc(
        collection(db, "meter-readings"),
        mainReadingDoc
      );
      return docRef.id;
    } catch (error) {
      console.error("Error en createMainReading:", error);
      console.error("Stack trace:", error.stack);
      console.error(
        "Datos que causaron el error:",
        JSON.stringify(readingData, null, 2)
      );
      throw error;
    }
  },
  // Cerrar lectura
  async closeReading(readingId) {
    try {
      const docRef = doc(db, "meter-readings", readingId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Lectura no encontrada");
      }

      const readingData = docSnap.data();

      if (
        !readingData.unitReadings ||
        Object.keys(readingData.unitReadings).length === 0
      ) {
        throw new Error("La lectura debe tener lecturas individuales");
      }

      await updateDoc(docRef, {
        status: "closed",
        closedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error("Error closing reading:", error);
      throw error;
    }
  },
};
