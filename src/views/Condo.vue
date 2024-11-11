<!-- Condo.vue -->
<template>
    <div class="container mx-auto p-6">
        <div v-if="condo" class="space-y-6">
            <!-- Header -->
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-bold">{{ condo.name }}</h1>
                    <p class="text-gray-600">
                        Unidades: {{ Object.keys(condo.units || {}).length }} / {{ condo.numberOfUnits }}
                    </p>
                </div>
                <div class="flex items-center space-x-4">
                    <label class="flex items-center space-x-2">
                        <span>Activo:</span>
                        <input type="checkbox" v-model="isActive"
                            class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                    </label>
                    <button @click="updateCondo" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        Actualizar
                    </button>
                </div>
            </div>

            <!-- Lista de unidades -->
            <div class="bg-white shadow rounded-lg overflow-hidden">
                <div class="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <h2 class="text-lg font-medium">Unidades</h2>
                    <span class="text-sm text-gray-500">
                        Total: {{ Object.keys(condo.units || {}).length }} / {{ condo.numberOfUnits }}
                    </span>
                </div>
                <div class="border-t border-gray-200">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Unidad
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Residente
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Teléfono
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr v-for="unit in sortedUnits" :key="unit.id" class="hover:bg-gray-50">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <router-link :to="`/unit/${unit.id}`"
                                            class="text-blue-600 hover:text-blue-800 font-medium">
                                            {{ unit.name }}
                                        </router-link>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        {{ unit.tenant.name }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <a :href="`mailto:${unit.tenant.email}`"
                                            class="text-gray-600 hover:text-gray-800">
                                            {{ unit.tenant.email }}
                                        </a>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <a :href="`tel:${unit.tenant.phone}`" class="text-gray-600 hover:text-gray-800">
                                            {{ unit.tenant.phone }}
                                        </a>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span :class="`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${unit.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`">
                                            {{ unit.isActive ? 'Activo' : 'Inactivo' }}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Tarjeta de Consumo Promedio -->
                <div class="bg-white p-6 rounded-lg shadow">
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Consumo Promedio</h3>
                    <div class="text-3xl font-bold text-blue-600">
                        {{ condoStats ? formatNumber(condoStats.averageConsumption) : '0' }} m³
                    </div>
                    <p class="text-sm text-gray-500 mt-1">Promedio mensual</p>
                </div>

                <!-- Tarjeta de Último Consumo -->
                <div class="bg-white p-6 rounded-lg shadow">
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Último Consumo</h3>
                    <div class="text-3xl font-bold text-green-600">
                        {{ condoStats?.lastReading ? formatNumber(condoStats.lastReading.totalConsumption) : '0' }} m³
                    </div>
                    <p class="text-sm text-gray-500 mt-1">
                        {{ condoStats?.lastReading ? formatDate(condoStats.lastReading.date) : 'Sin lecturas' }}
                    </p>
                </div>

                <!-- Tarjeta de Costo Promedio -->
                <div class="bg-white p-6 rounded-lg shadow">
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Costo Promedio</h3>
                    <div class="text-3xl font-bold text-indigo-600">
                        S/. {{ condoStats ? formatNumber(condoStats.averageCost) : '0' }}
                    </div>
                    <p class="text-sm text-gray-500 mt-1">Promedio mensual</p>
                </div>
            </div>

            <!-- Gráficos -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Gráfico de Consumo -->
                <div class="bg-white p-6 rounded-lg shadow">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Tendencia de Consumo</h3>
                    <div class="h-64">
                        <Line v-if="consumptionChartData" :data="consumptionChartData" :options="chartOptions" />
                    </div>
                </div>

                <!-- Gráfico de Costos -->
                <div class="bg-white p-6 rounded-lg shadow">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Tendencia de Costos</h3>
                    <div class="h-64">
                        <Line v-if="costChartData" :data="costChartData" :options="chartOptions" />
                    </div>
                </div>
            </div>

            <!-- Tabla de Historial -->
            <div class="bg-white shadow rounded-lg overflow-hidden">
                <div class="px-4 py-5 sm:px-6">
                    <h2 class="text-lg font-medium">Historial de Lecturas</h2>
                </div>
                <div class="border-t border-gray-200">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fecha
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Consumo Total
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Áreas Comunes
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Costo Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr v-for="reading in sortedHistoricalReadings" :key="reading.date"
                                    class="hover:bg-gray-50">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        {{ formatDate(reading.date) }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        {{ formatNumber(reading.totalConsumption) }} m³
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        {{ formatNumber(reading.commonAreaConsumption) }} m³
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        S/. {{ formatNumber(reading.totalCost) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Botón FAB -->
            <button v-if="canAddUnits" @click="goToCreateUnit"
                class="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <span class="text-2xl">+</span>
            </button>
        </div>
        <div v-else class="text-center py-8">
            <p>Cargando...</p>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { condoHistoryService } from '../services/condoHistoryService';

// Registrar Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const route = useRoute();
const router = useRouter();
const condoId = route.params.id;
const condo = ref(null);
const unitsDetails = ref({});
const isActive = ref(false);
const condoStats = ref(null);
const isLoadingStats = ref(false);

// Computed property para ordenar las unidades
const sortedUnits = computed(() => {
    if (!condo.value?.units || !unitsDetails.value) return [];

    return Object.entries(unitsDetails.value)
        .map(([id, unit]) => ({
            id,
            ...unit
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
});

const canAddUnits = computed(() => {
    return condo.value && Object.keys(condo.value.units || {}).length < condo.value.numberOfUnits;
});

const fetchCondo = async () => {
    try {
        const docRef = doc(db, 'condos', condoId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            condo.value = { id: docSnap.id, ...docSnap.data() };
            isActive.value = condo.value.isActive;

            // Si hay unidades, obtener sus detalles
            if (condo.value.units) {
                await fetchUnitsDetails();
            }
        } else {
            console.log("No se encontró el condominio.");
        }
    } catch (error) {
        console.error("Error fetching condo:", error);
    }
};

const fetchUnitsDetails = async () => {
    try {
        const unitIds = Object.keys(condo.value.units || {});
        if (unitIds.length === 0) return;

        const unitsQuery = query(
            collection(db, 'units'),
            where('condoId', '==', condoId)
        );
        const querySnapshot = await getDocs(unitsQuery);

        const unitsData = {};
        querySnapshot.forEach(doc => {
            unitsData[doc.id] = doc.data();
        });

        unitsDetails.value = unitsData;
    } catch (error) {
        console.error("Error fetching units details:", error);
    }
};

const updateCondo = async () => {
    try {
        const docRef = doc(db, 'condos', condoId);
        await updateDoc(docRef, {
            isActive: isActive.value,
            updatedAt: new Date()
        });
        alert("Condominio actualizado");
    } catch (error) {
        console.error("Error updating condo:", error);
        alert("Error al actualizar el condominio");
    }
};

const goToCreateUnit = () => {
    router.push({
        path: '/create-unit',
        query: { condoId: condoId }
    });
};

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top'
        }
    },
    scales: {
        y: {
            beginAtZero: true
        }
    }
};

// Computed properties para los gráficos
const consumptionChartData = computed(() => {
    if (!condoStats.value?.consumptionTrend) return null;

    return {
        labels: condoStats.value.consumptionTrend.map(item =>
            new Date(item.date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
        ),
        datasets: [
            {
                label: 'Consumo Total (m³)',
                data: condoStats.value.consumptionTrend.map(item => item.consumption),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true
            },
            {
                label: 'Áreas Comunes (m³)',
                data: condoStats.value.consumptionTrend.map(item => item.commonArea),
                borderColor: '#059669',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                fill: true
            }
        ]
    };
});

const costChartData = computed(() => {
    if (!condoStats.value?.consumptionTrend) return null;

    return {
        labels: condoStats.value.consumptionTrend.map(item =>
            new Date(item.date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
        ),
        datasets: [
            {
                label: 'Costo Total (S/.)',
                data: condoStats.value.consumptionTrend.map(item => item.cost),
                borderColor: '#7c3aed',
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                fill: true
            }
        ]
    };
});

const sortedHistoricalReadings = computed(() => {
    if (!condoStats.value?.consumptionTrend) return [];
    return [...condoStats.value.consumptionTrend].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
    );
});

// Funciones de utilidad
const formatNumber = (value) => {
    return value ? Number(value).toFixed(2) : '0.00';
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Función para cargar las estadísticas
const loadCondoStats = async () => {
    try {
        isLoadingStats.value = true;
        const stats = await condoHistoryService.getCondoStats(condoId);
        condoStats.value = stats;
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    } finally {
        isLoadingStats.value = false;
    }
};

// Modificamos onMounted para que sea async
onMounted(async () => {
    await fetchCondo();
    await loadCondoStats();
});
</script>