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

  // Crear lectura principal
  async createMainReading(readingData) {
    try {
      // Validar que al menos tenga fecha y condoId
      if (!readingData.date || !readingData.condoId) {
        throw new Error("La fecha y el condominio son requeridos");
      }

      const docRef = await addDoc(collection(db, "meter-readings"), {
        ...readingData,
        reading: readingData.reading
          ? Math.floor(Number(readingData.reading))
          : null,
        cost: readingData.cost ? Math.floor(Number(readingData.cost)) : null,
        status: "open",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating main reading:", error);
      throw error;
    }
  },

  // Crear lectura individual
  async createUnitReading(mainReadingId, unitReadingData) {
    try {
      // Obtener última lectura de la unidad
      const lastReading = await this.getLastUnitReading(unitReadingData.unitId);

      // Calcular consumo
      const consumption = lastReading
        ? Number(unitReadingData.reading) - lastReading.reading
        : Number(unitReadingData.reading);

      const docRef = await addDoc(collection(db, "unit-readings"), {
        ...unitReadingData,
        mainReadingId,
        reading: Number(unitReadingData.reading),
        consumption,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating unit reading:", error);
      throw error;
    }
  },

  // Obtener última lectura de una unidad
  async getLastUnitReading(unitId) {
    try {
      const q = query(
        collection(db, "unit-readings"),
        where("unitId", "==", unitId),
        orderBy("createdAt", "desc"),
        limit(1)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data(),
      };
    } catch (error) {
      console.error("Error getting last unit reading:", error);
      throw error;
    }
  },

  // Cerrar lectura y calcular costos
  async closeMainReading(mainReadingId, calculations) {
    try {
      // Actualizar lectura principal
      await updateDoc(doc(db, "meter-readings", mainReadingId), {
        status: "closed",
        ...calculations,
        updatedAt: serverTimestamp(),
      });

      // Obtener todas las lecturas individuales
      const q = query(
        collection(db, "unit-readings"),
        where("mainReadingId", "==", mainReadingId)
      );
      const snapshot = await getDocs(q);

      // Actualizar cada lectura individual con sus costos
      const updatePromises = snapshot.docs.map((doc) => {
        const unitReading = doc.data();
        const individualCost =
          unitReading.consumption * calculations.costPerUnit;

        return updateDoc(doc.ref, {
          individualCost,
          commonAreaCost: calculations.commonAreaCostPerUnit,
          totalCost: individualCost + calculations.commonAreaCostPerUnit,
          updatedAt: serverTimestamp(),
        });
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error closing main reading:", error);
      throw error;
    }
  },

  // Actualizar lectura principal
  async updateMainReading(readingId, readingData) {
    try {
      const docRef = doc(db, "meter-readings", readingId);
      const updateData = {
        ...readingData,
        reading: readingData.reading
          ? Math.floor(Number(readingData.reading))
          : null,
        cost: readingData.cost ? Math.floor(Number(readingData.cost)) : null,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, updateData);
      return readingId;
    } catch (error) {
      console.error("Error updating main reading:", error);
      throw error;
    }
  },

  // Obtener lecturas anteriores
  async getPreviousReadings(condoId) {
    try {
      const q = query(
        collection(db, "unit-readings"),
        where("condoId", "==", condoId),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const readings = {};

      if (snapshot.empty) {
        console.log("No previous readings found");
        return readings; // Retorna objeto vacío si no hay lecturas
      }

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        // Solo guardamos la lectura más reciente para cada unidad
        if (!readings[data.unitId]) {
          readings[data.unitId] = data.reading;
        }
      });

      return readings;
    } catch (error) {
      // Si el error es por falta de índice, retornamos un objeto vacío
      if (error.code === "failed-precondition") {
        console.warn("Index not found, returning empty readings");
        return {};
      }
      console.error("Error getting previous readings:", error);
      throw error;
    }
  },

  // Guardar lectura de unidad
  async saveUnitReading(mainReadingId, unitReadingData) {
    try {
      // Obtener lectura principal para obtener el condoId
      const mainReadingDoc = await getDoc(
        doc(db, "meter-readings", mainReadingId)
      );
      if (!mainReadingDoc.exists()) {
        throw new Error("Lectura principal no encontrada");
      }
      const mainReading = mainReadingDoc.data();

      // Obtener última lectura de la unidad
      const lastReading = await this.getLastUnitReading(unitReadingData.unitId);
      const consumption = lastReading
        ? Number(unitReadingData.reading) - lastReading.reading
        : Number(unitReadingData.reading);

      const q = query(
        collection(db, "unit-readings"),
        where("mainReadingId", "==", mainReadingId),
        where("unitId", "==", unitReadingData.unitId)
      );

      const snapshot = await getDocs(q);

      const readingData = {
        ...unitReadingData,
        mainReadingId,
        reading: Math.floor(Number(unitReadingData.reading)),
        consumption,
        condoId: mainReading.condoId, // Agregar condoId
        updatedAt: serverTimestamp(),
      };

      if (snapshot.empty) {
        // Crear nueva lectura
        readingData.createdAt = serverTimestamp();
        await addDoc(collection(db, "unit-readings"), readingData);
      } else {
        // Actualizar lectura existente
        await updateDoc(
          doc(db, "unit-readings", snapshot.docs[0].id),
          readingData
        );
      }
    } catch (error) {
      console.error("Error saving unit reading:", error);
      throw error;
    }
  },
  async getCompleteReading(readingId) {
    try {
      // Obtener lectura principal
      const docRef = doc(db, "meter-readings", readingId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Lectura no encontrada");
      }

      const mainReading = {
        id: docSnap.id,
        ...docSnap.data(),
      };

      // Obtener lecturas individuales
      const unitReadingsSnapshot = await getDocs(
        query(
          collection(db, "unit-readings"),
          where("mainReadingId", "==", readingId)
        )
      );

      const unitReadings = unitReadingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        mainReading,
        unitReadings,
      };
    } catch (error) {
      console.error("Error getting complete reading:", error);
      throw error;
    }
  },

  // Método para verificar si es la primera lectura del condominio
  async isFirstReading(condoId) {
    try {
      const q = query(
        collection(db, "meter-readings"),
        where("condoId", "==", condoId),
        where("status", "==", "closed")
      );
      const snapshot = await getDocs(q);
      return snapshot.empty; // true si no hay lecturas cerradas
    } catch (error) {
      console.error("Error checking first reading:", error);
      throw error;
    }
  },

  // Método específico para crear primera lectura
  async createFirstReading(condoId, date, unitReadings) {
    try {
      // Validar que todas las unidades tengan lectura
      if (!unitReadings || Object.keys(unitReadings).length === 0) {
        throw new Error("Se requieren las lecturas de todas las unidades");
      }

      // 1. Crear lectura principal básica
      const mainReadingRef = await addDoc(collection(db, "meter-readings"), {
        condoId,
        date,
        status: "open",
        isFirstReading: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. Crear lecturas individuales
      const unitReadingPromises = Object.entries(unitReadings).map(
        ([unitId, reading]) => {
          if (!reading) {
            throw new Error(`Falta la lectura para la unidad ${unitId}`);
          }

          return addDoc(collection(db, "unit-readings"), {
            mainReadingId: mainReadingRef.id,
            unitId,
            reading: Number(reading),
            consumption: 0, // La primera lectura no tiene consumo
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      );

      await Promise.all(unitReadingPromises);

      // 3. Cerrar la lectura solo si todas las unidades tienen lectura
      await updateDoc(doc(db, "meter-readings", mainReadingRef.id), {
        status: "closed",
        updatedAt: serverTimestamp(),
      });

      return mainReadingRef.id;
    } catch (error) {
      console.error("Error creating first reading:", error);
      throw error;
    }
  },
  // Método modificado para cerrar lectura
  // En readingService.js, eliminar el método closeMainReading antiguo y mantener solo el nuevo
  async closeReading(readingId, readingData) {
    try {
      // 1. Verificar que la lectura existe y está abierta
      const readingRef = doc(db, "meter-readings", readingId);
      const readingDoc = await getDoc(readingRef);

      if (!readingDoc.exists()) {
        throw new Error("Lectura no encontrada");
      }

      if (readingDoc.data().status === "closed") {
        throw new Error("La lectura ya está cerrada");
      }

      // 2. Obtener todas las lecturas individuales
      const unitReadingsQuery = query(
        collection(db, "unit-readings"),
        where("mainReadingId", "==", readingId)
      );
      const unitReadingsSnapshot = await getDocs(unitReadingsQuery);
      const unitReadings = unitReadingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Verificar que existen todas las lecturas individuales
      const unitsQuery = query(
        collection(db, "units"),
        where("condoId", "==", readingDoc.data().condoId),
        where("isActive", "==", true)
      );
      const unitsSnapshot = await getDocs(unitsQuery);

      if (unitReadings.length < unitsSnapshot.docs.length) {
        throw new Error("Faltan lecturas individuales por registrar");
      }

      // 3. Calcular totales
      const totalUnitConsumption = unitReadings.reduce(
        (sum, reading) => sum + Number(reading.consumption || 0),
        0
      );

      const mainConsumption = Number(readingData.reading);
      const commonAreaConsumption = mainConsumption - totalUnitConsumption;
      const costPerUnit = Number(readingData.cost) / mainConsumption;
      const commonAreaCostPerUnit =
        (commonAreaConsumption * costPerUnit) / unitReadings.length;

      // 4. Actualizar la lectura principal
      await updateDoc(readingRef, {
        ...readingData,
        status: "closed",
        totalConsumption: mainConsumption,
        unitConsumption: totalUnitConsumption,
        commonAreaConsumption,
        costPerUnit,
        commonAreaCostPerUnit,
        updatedAt: serverTimestamp(),
      });

      // 5. Actualizar lecturas individuales con los costos
      const updatePromises = unitReadings.map((unitReading) => {
        const consumption = unitReading.consumption || 0;
        const individualCost = consumption * costPerUnit;

        return updateDoc(doc(db, "unit-readings", unitReading.id), {
          individualCost,
          commonAreaCost: commonAreaCostPerUnit,
          totalCost: individualCost + commonAreaCostPerUnit,
          updatedAt: serverTimestamp(),
        });
      });

      await Promise.all(updatePromises);

      return readingId;
    } catch (error) {
      console.error("Error closing reading:", error);
      throw error;
    }
  },
};
