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

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        // Solo guardamos la lectura más reciente para cada unidad
        if (!readings[data.unitId]) {
          readings[data.unitId] = data.reading;
        }
      });

      return readings;
    } catch (error) {
      console.error("Error getting previous readings:", error);
      throw error;
    }
  },

  // Guardar lectura de unidad
  async saveUnitReading(mainReadingId, unitReadingData) {
    try {
      const q = query(
        collection(db, "unit-readings"),
        where("mainReadingId", "==", mainReadingId),
        where("unitId", "==", unitReadingData.unitId)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Crear nueva lectura
        await addDoc(collection(db, "unit-readings"), {
          ...unitReadingData,
          mainReadingId,
          reading: Math.floor(Number(unitReadingData.reading)),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Actualizar lectura existente
        const docRef = doc(db, "unit-readings", snapshot.docs[0].id);
        await updateDoc(docRef, {
          reading: Math.floor(Number(unitReadingData.reading)),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error saving unit reading:", error);
      throw error;
    }
  },
};
