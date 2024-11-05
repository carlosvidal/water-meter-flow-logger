<template>
    <div class="container mx-auto p-6">
        <div v-if="loading" class="text-center py-8">
            <p class="text-gray-600">Cargando lectura...</p>
        </div>

        <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {{ error }}
        </div>

        <div v-else class="space-y-6">
            <!-- Header -->
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">
                        Detalles de Lectura
                        <span class="text-sm font-normal text-gray-500">
                            ({{ condoName }})
                        </span>
                    </h1>
                    <p class="mt-1 text-sm text-gray-600">
                        Fecha: {{ formatDate(mainReading?.date) }}
                    </p>
                </div>
                <div class="flex items-center space-x-3">
                    <span
                        :class="`px-2 py-1 text-sm font-semibold rounded-full ${mainReading?.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`">
                        {{ mainReading?.status === 'open' ? 'Abierta' : 'Cerrada' }}
                    </span>
                </div>
            </div>

            <!-- Lectura Principal -->
            <div class="bg-white shadow rounded-lg p-6">
                <h2 class="text-lg font-semibold mb-4">Lectura Principal</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-600">Lectura Total</label>
                        <p class="mt-1 text-lg">{{ mainReading?.reading }} m³</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-600">Costo Total</label>
                        <p class="mt-1 text-lg">{{ formatCurrency(mainReading?.cost) }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-600">Costo por m³</label>
                        <p class="mt-1 text-lg">{{ formatCurrency(calculateRate()) }} / m³</p>
                    </div>
                </div>

                <!-- Agregar sección de consumos -->
                <div class="mt-6 border-t pt-4">
                    <h3 class="text-sm font-medium text-gray-600 mb-3">Detalle de Consumos</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-500">Consumo Individual Total</label>
                            <p class="mt-1 text-lg">{{ formatReading(calculateTotalConsumption()) }} m³</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500">Consumo Áreas Comunes</label>
                            <p class="mt-1 text-lg">{{ formatReading(calculateCommonAreaConsumption()) }} m³</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500">Porcentaje Áreas Comunes</label>
                            <p class="mt-1 text-lg">{{ calculateCommonAreaPercentage() }}%</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Lecturas Individuales -->
            <div class="bg-white shadow rounded-lg overflow-hidden">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h2 class="text-lg font-semibold">Lecturas por Unidad</h2>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Unidad
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Lectura Anterior (m³)
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Lectura Actual (m³)
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Consumo (m³)
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Costo Individual
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Áreas Comunes
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Total
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="reading in sortedUnitReadings" :key="reading.id" class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <router-link :to="`/unit/${reading.unitId}`"
                                        class="text-blue-600 hover:text-blue-800">
                                        {{ getUnitName(reading.unitId) }}
                                    </router-link>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    {{ formatReading(getPreviousReading(reading.unitId)) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    {{ formatReading(reading.reading) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    {{ formatReading(calculateConsumption(reading)) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    {{ formatCurrency(reading.individualCost) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    {{ formatCurrency(reading.commonAreaCost) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap font-medium">
                                    {{ formatCurrency(reading.totalCost) }}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot class="bg-gray-50">
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap font-medium">Totales</td>
                                <td class="px-6 py-4 whitespace-nowrap">-</td>
                                <td class="px-6 py-4 whitespace-nowrap">{{ formatReading(calculateTotalReading()) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">{{ formatReading(calculateTotalConsumption()) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    {{ formatCurrency(calculateTotalIndividualCost()) }}</td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    {{ formatCurrency(calculateTotalCommonAreaCost()) }}</td>
                                <td class="px-6 py-4 whitespace-nowrap font-medium">
                                    {{ formatCurrency(calculateTotalCost()) }}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const route = useRoute();
const readingId = route.params.id;
const previousReadings = ref({});


// Estado
const loading = ref(true);
const error = ref(null);
const mainReading = ref(null);
const unitReadings = ref([]);
const condoName = ref('');
const units = ref({}); // Cache para nombres de unidades

// Computed
const sortedUnitReadings = computed(() => {
    return [...unitReadings.value].sort((a, b) => {
        const unitA = getUnitName(a.unitId);
        const unitB = getUnitName(b.unitId);
        return unitA.localeCompare(unitB);
    });
});

// Métodos

const formatReading = (value) => {
    if (value === null || value === undefined) return '-';
    return (value / 1000).toFixed(3);
};

const getAdjustedReading = (value) => {
    if (value === null || value === undefined) return 0;
    return value / 1000;
};

const getPreviousReading = (unitId) => {
    return previousReadings.value[unitId] || null;
};


const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
};

const formatCurrency = (amount) => {
    if (!amount) return 'S/. 0.00';
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(amount);
};

const calculateRate = () => {
    if (!mainReading.value?.reading || !mainReading.value?.cost) return 0;
    // Ajustamos tanto la lectura como el costo
    return (mainReading.value.cost / 1000) / getAdjustedReading(mainReading.value.reading);
};

const getUnitName = (unitId) => {
    return units.value[unitId]?.name || 'Unidad no encontrada';
};

const calculateConsumption = (reading) => {
    const previousReading = getPreviousReading(reading.unitId);
    if (previousReading === null) {
        // Si no hay lectura anterior, usar la lectura actual sin ajustes
        return reading.reading;
    }
    // Calcular la diferencia con valores originales
    return reading.reading - previousReading;
};
const calculateIndividualCost = (reading) => {
    const consumption = calculateConsumption(reading);
    const rate = calculateRate();
    return (consumption / 1000) * rate; // Ajustamos el consumo para el cálculo del costo
};

// Totales
const calculateTotalReading = () => {
    return unitReadings.value.reduce((sum, reading) =>
        sum + getAdjustedReading(reading.reading), 0);
};

const calculateTotalConsumption = () => {
    return unitReadings.value.reduce((sum, reading) =>
        sum + calculateConsumption(reading),
        0
    );
};

const calculateTotalIndividualCost = () => {
    return unitReadings.value.reduce((sum, reading) =>
        sum + calculateIndividualCost(reading), 0);
};

const calculateTotalCommonAreaCost = () => {
    if (!mainReading.value?.cost || unitReadings.value.length === 0) return 0;
    const totalIndividualCost = calculateTotalIndividualCost();
    const remainingCost = mainReading.value.cost - totalIndividualCost;
    return remainingCost / unitReadings.value.length; // Dividir el costo restante entre todas las unidades
};

const calculateTotalCost = () => {
    const totalIndividual = calculateTotalIndividualCost();
    const totalCommon = unitReadings.value.length * calculateTotalCommonAreaCost();
    return totalIndividual + totalCommon;
};

const calculateCommonAreaConsumption = () => {
    if (!mainReading.value?.reading) return 0;

    // La lectura total está en m³, multiplicamos por 1000 para convertir a litros
    const lecturaTotalEnLitros = mainReading.value.reading * 1000;
    const consumoIndividual = calculateTotalConsumption();

    console.log('Lectura Total (litros):', lecturaTotalEnLitros);
    console.log('Consumo Individual (litros):', consumoIndividual);

    const consumoAreasComunes = lecturaTotalEnLitros - consumoIndividual;
    console.log('Consumo Áreas Comunes (litros):', consumoAreasComunes);

    return consumoAreasComunes;
};

const calculateCommonAreaPercentage = () => {
    if (!mainReading.value?.reading) return 0;

    // Convertir el área común a m³ para tener las mismas unidades
    const commonArea = calculateCommonAreaConsumption() / 1000; // convertir de litros a m³
    const total = mainReading.value.reading; // ya está en m³

    if (total === 0) return 0;

    // Calculamos el porcentaje
    return ((commonArea / total) * 100).toFixed(1);
};
// Cargar datos
const loadReading = async () => {
    try {
        loading.value = true;
        error.value = null;

        // Cargar lectura principal
        const readingDoc = await getDoc(doc(db, 'meter-readings', readingId));
        if (!readingDoc.exists()) {
            throw new Error('Lectura no encontrada');
        }
        mainReading.value = { id: readingDoc.id, ...readingDoc.data() };

        // Cargar nombre del condominio
        const condoDoc = await getDoc(doc(db, 'condos', mainReading.value.condoId));
        if (condoDoc.exists()) {
            condoName.value = condoDoc.data().name;
        }

        // Cargar lecturas individuales
        const unitReadingsQuery = query(
            collection(db, 'unit-readings'),
            where('mainReadingId', '==', readingId)
        );
        const unitReadingsSnapshot = await getDocs(unitReadingsQuery);
        unitReadings.value = unitReadingsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Cargar información de unidades
        const unitIds = unitReadings.value.map(r => r.unitId);
        for (const unitId of unitIds) {
            const unitDoc = await getDoc(doc(db, 'units', unitId));
            if (unitDoc.exists()) {
                units.value[unitId] = unitDoc.data();
            }

            // Cargar lectura anterior para cada unidad
            const previousReadingQuery = query(
                collection(db, 'unit-readings'),
                where('unitId', '==', unitId),
                where('createdAt', '<', mainReading.value.createdAt),
                orderBy('createdAt', 'desc'),
                limit(1)
            );

            const previousReadingSnapshot = await getDocs(previousReadingQuery);
            if (!previousReadingSnapshot.empty) {
                previousReadings.value[unitId] = previousReadingSnapshot.docs[0].data().reading;
            }
        }

        // Calcular y actualizar los costos para cada lectura
        unitReadings.value = unitReadings.value.map(reading => ({
            ...reading,
            individualCost: calculateIndividualCost(reading),
            commonAreaCost: calculateTotalCommonAreaCost(),
            totalCost: calculateIndividualCost(reading) + calculateTotalCommonAreaCost()
        }));

    } catch (err) {
        console.error('Error loading reading:', err);
        error.value = err.message;
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    loadReading();
});
</script>