// services/waterService.js
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";

export const waterService = {
  async calculateConsumption(unitId, currentReading, readingDate) {
    try {
      // Validar parámetros
      if (!unitId || !currentReading || !readingDate) {
        throw new Error("Todos los parámetros son requeridos");
      }

      // Obtener la lectura anterior
      const readingsRef = collection(db, "meter-readings");
      const q = query(
        readingsRef,
        where("unitId", "==", unitId),
        where("readingDate", "<", readingDate),
        orderBy("readingDate", "desc"),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      const previousReading = querySnapshot.docs[0]?.data()?.value || 0;

      // Validar que la lectura actual sea mayor que la anterior
      if (currentReading < previousReading) {
        throw new Error("La lectura actual no puede ser menor que la anterior");
      }

      return currentReading - previousReading;
    } catch (error) {
      console.error("Error calculando consumo:", error);
      throw error;
    }
  },

  async calculateCosts(condoId, readingDate, totalBill) {
    try {
      // Validar parámetros
      if (!condoId || !readingDate || !totalBill) {
        throw new Error("Todos los parámetros son requeridos");
      }

      if (totalBill <= 0) {
        throw new Error("El monto total de la factura debe ser mayor a 0");
      }

      // Obtener todas las lecturas del mes para el condominio
      const readingsRef = collection(db, "meter-readings");
      const q = query(
        readingsRef,
        where("condoId", "==", condoId),
        where("readingDate", "==", readingDate)
      );

      const querySnapshot = await getDocs(q);
      const readings = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Validar que haya lecturas
      if (readings.length === 0) {
        throw new Error("No hay lecturas registradas para este período");
      }

      // Calcular consumo total
      const totalConsumption = readings.reduce(
        (sum, reading) => sum + reading.consumption,
        0
      );

      if (totalConsumption <= 0) {
        throw new Error("El consumo total debe ser mayor a 0");
      }

      // Calcular costo por metro cúbico
      const waterRate = totalBill / totalConsumption;

      // Calcular costos individuales y áreas comunes
      const individualCosts = readings.map((reading) => ({
        readingId: reading.id,
        individualCost: reading.consumption * waterRate,
      }));

      const commonAreaCost = totalBill / readings.length;

      return {
        waterRate,
        individualCosts,
        commonAreaCost,
      };
    } catch (error) {
      console.error("Error calculando costos:", error);
      throw error;
    }
  },

  // Nuevo método para validar si es la última lectura del mes
  async isLastReadingOfMonth(condoId, readingDate) {
    try {
      // Obtener todas las unidades del condominio
      const unitsRef = collection(db, "units");
      const unitsQuery = query(unitsRef, where("condoId", "==", condoId));
      const unitsSnapshot = await getDocs(unitsQuery);
      const totalUnits = unitsSnapshot.docs.length;

      // Obtener lecturas del mes
      const readingsRef = collection(db, "meter-readings");
      const readingsQuery = query(
        readingsRef,
        where("condoId", "==", condoId),
        where("readingDate", "==", readingDate)
      );
      const readingsSnapshot = await getDocs(readingsQuery);
      const totalReadings = readingsSnapshot.docs.length;

      // Si el número de lecturas es igual al número de unidades, es la última lectura
      return totalReadings === totalUnits - 1;
    } catch (error) {
      console.error("Error verificando última lectura:", error);
      throw error;
    }
  },
};
