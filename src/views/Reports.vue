<template>
    <div>
        <h1>Reportes de Consumo de Agua</h1>
        <table>
            <thead>
                <tr>
                    <th>Unidad</th>
                    <th>Residente</th>
                    <th>Consumo Total (m³)</th>
                    <th>Costo Total</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="report in reports" :key="report.unitId">
                    <td>{{ report.unitName }}</td>
                    <td>{{ report.tenantName }}</td>
                    <td>{{ report.totalConsumption }}</td>
                    <td>{{ report.totalCost | currency }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const reports = ref([]);

const fetchReports = async () => {
    const unitsSnapshot = await getDocs(collection(db, 'units'));
    const readingsSnapshot = await getDocs(collection(db, 'meter-readings'));

    const units = unitsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    const readings = readingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    const unitReports = units.map(unit => {
        const unitReadings = readings.filter(reading => reading.unit === unit.name);
        const totalConsumption = unitReadings.reduce((sum, reading) => sum + reading.value, 0);
        const totalCost = totalConsumption * 2; // Assuming 2 currency units per m³

        return {
            unitId: unit.id,
            unitName: unit.name,
            tenantName: unit.tenant.name,
            totalConsumption,
            totalCost
        };
    });

    reports.value = unitReports;
};

onMounted(() => {
    fetchReports();
});
</script>
