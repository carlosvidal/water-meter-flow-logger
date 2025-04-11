<!-- Condo.vue -->
<template>
    <div class="container mx-auto p-6">
        <div v-if="condo" class="space-y-6">
            <!-- Header -->
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-bold">{{ condo.name }}</h1>
                </div>
                <div class="flex items-center space-x-4">
                    <router-link v-if="userStore.isSuperAdmin" :to="`/condo/${condo.id}/edit`"
                        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Editar Condominio
                    </router-link>
                </div>
            </div>

            <div class="bg-white shadow rounded-lg p-6 mb-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Información básica -->
                    <div>
                        <h3 class="text-lg font-medium text-gray-900 mb-4">Información General</h3>
                        <dl class="space-y-2">
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Estado</dt>
                                <dd class="mt-1">
                                    <span :class="`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${condo.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`">
                                        {{ condo.isActive ? 'Activo' : 'Inactivo' }}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Total de Unidades</dt>
                                <dd class="mt-1 text-sm text-gray-900">
                                    {{ Object.keys(condo.units || {}).length }} / {{ condo.numberOfUnits }}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <!-- Dirección -->
                    <div>
                        <h3 class="text-lg font-medium text-gray-900 mb-4">Ubicación</h3>
                        <dl class="space-y-2" v-if="condo.address">
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Dirección</dt>
                                <dd class="mt-1 text-sm text-gray-900">
                                    {{ condo.address.street }}
                                </dd>
                            </div>
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Ciudad</dt>
                                <dd class="mt-1 text-sm text-gray-900">
                                    {{ condo.address.city }}, {{ condo.address.state }}
                                </dd>
                            </div>
                            <div>
                                <dt class="text-sm font-medium text-gray-500">País</dt>
                                <dd class="mt-1 text-sm text-gray-900">
                                    {{ getCountryName(condo.address.country) }}
                                </dd>
                            </div>
                            <div v-if="condo.address.postalCode">
                                <dt class="text-sm font-medium text-gray-500">Código Postal</dt>
                                <dd class="mt-1 text-sm text-gray-900">
                                    {{ condo.address.postalCode }}
                                </dd>
                            </div>
                        </dl>
                    </div>
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

            <!-- Tarjetas de estadísticas -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Consumo Promedio -->
                <div class="bg-white p-6 rounded-lg shadow">
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Consumo Promedio</h3>
                    <div class="text-3xl font-bold text-blue-600">
                        {{ formatStatsNumber(condoStats?.averageConsumption) }}
                    </div>
                    <p class="text-sm text-gray-500 mt-1">Promedio mensual</p>
                </div>

                <!-- Último Consumo -->
                <div class="bg-white p-6 rounded-lg shadow">
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Último Consumo</h3>
                    <div class="text-3xl font-bold text-green-600">
                        {{ formatStatsNumber(condoStats?.lastReading?.totalConsumption) }}
                    </div>
                    <p class="text-sm text-gray-500 mt-1">
                        {{ condoStats?.lastReading ? formatDate(condoStats.lastReading.date) : 'Sin lecturas' }}
                    </p>
                </div>

                <!-- Costo Promedio -->
                <div class="bg-white p-6 rounded-lg shadow">
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Costo Promedio</h3>
                    <div class="text-3xl font-bold text-indigo-600">
                        {{ formatStatsNumber(condoStats?.averageCost, 'currency') }}
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
                        <template v-if="consumptionChartData">
                            <Line :data="consumptionChartData" :options="consumptionChartOptions" />
                        </template>
                        <div v-else class="flex items-center justify-center h-full text-gray-500">
                            No hay datos disponibles
                        </div>
                    </div>
                </div>

                <!-- Gráfico de Costos -->
                <div class="bg-white p-6 rounded-lg shadow">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Tendencia de Costos</h3>
                    <div class="h-64">
                        <template v-if="costChartData">
                            <Line :data="costChartData" :options="costChartOptions" />
                        </template>
                        <div v-else class="flex items-center justify-center h-full text-gray-500">
                            No hay datos disponibles
                        </div>
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
                                        class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Consumo Total
                                    </th>
                                    <th
                                        class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Áreas Comunes
                                    </th>
                                    <th
                                        class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                                    <td class="px-6 py-4 whitespace-nowrap text-right">
                                        {{ formatStatsNumber(reading.consumption) }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right">
                                        {{ formatStatsNumber(reading.commonArea) }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right">
                                        {{ formatStatsNumber(reading.cost, 'currency') }}
                                    </td>
                                </tr>
                                <tr v-if="sortedHistoricalReadings.length === 0">
                                    <td colspan="4" class="px-6 py-4 text-center text-gray-500">
                                        No hay lecturas registradas
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
import { useUserStore } from '../store/user'; // Asegúrate de agregar esta importación
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { condoHistoryService } from '../services/condoHistoryService';

// Registrar Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const condoId = route.params.id;
const condo = ref(null);
const unitsDetails = ref({});
const isActive = ref(false);
const condoStats = ref(null);
const isLoadingStats = ref(false);

const chartData = ref(null);
const consumptionChartData = ref(null);
const costChartData = ref(null);

// Formatear moneda según la configuración del condominio
const formatCurrency = (value) => {
    if (!value || !condo.value?.address?.currency) return '0.00';

    return new Intl.NumberFormat(condo.value.address.language, {
        style: 'currency',
        currency: condo.value.address.currency
    }).format(value);
};

// Formatear fecha según la zona horaria del condominio
const formatDate = (dateString) => {
    if (!dateString || !condo.value?.address?.timezone) return '';

    return new Date(dateString).toLocaleString(condo.value.address.language, {
        timeZone: condo.value.address.timezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Obtener nombre del país
const getCountryName = (countryCode) => {
    return new Intl.DisplayNames([condo.value?.address?.language || 'es'], {
        type: 'region'
    }).of(countryCode);
};

// Actualizar las tarjetas de estadísticas para usar el nuevo formato de moneda
const formatStatsNumber = (value, type = 'number') => {
    if (!value) return type === 'currency' ? formatCurrency(0) : '0.00';

    if (type === 'currency') {
        return formatCurrency(value);
    }

    return `${Number(value).toFixed(2)} m³`;
};

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

const updateChartData = () => {
    if (!condoStats.value?.consumptionTrend) {
        consumptionChartData.value = null;
        costChartData.value = null;
        return;
    }

    // Datos para el gráfico de consumo
    consumptionChartData.value = {
        labels: condoStats.value.consumptionTrend.map(item =>
            new Date(item.date).toLocaleDateString(condo.value?.address?.language || 'es-ES', {
                month: 'short',
                year: 'numeric'
            })
        ),
        datasets: [
            {
                label: 'Consumo Total (m³)',
                data: condoStats.value.consumptionTrend.map(item => item.consumption),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Áreas Comunes (m³)',
                data: condoStats.value.consumptionTrend.map(item => item.commonArea),
                borderColor: '#059669',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    // Datos para el gráfico de costos
    costChartData.value = {
        labels: condoStats.value.consumptionTrend.map(item =>
            new Date(item.date).toLocaleDateString(condo.value?.address?.language || 'es-ES', {
                month: 'short',
                year: 'numeric'
            })
        ),
        datasets: [
            {
                label: 'Costo Total',
                data: condoStats.value.consumptionTrend.map(item => item.cost),
                borderColor: '#7c3aed',
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };
};
// Opciones de los gráficos como computed properties
const baseChartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top'
        },
        filler: {
            propagate: true
        }
    },
    interaction: {
        intersect: false,
        mode: 'index'
    },
    elements: {
        line: {
            borderWidth: 2
        },
        point: {
            radius: 3,
            hoverRadius: 5
        }
    }
}));

const consumptionChartOptions = computed(() => ({
    ...baseChartOptions.value,
    plugins: {
        ...baseChartOptions.value.plugins,
        tooltip: {
            callbacks: {
                label: (context) => {
                    return `${context.dataset.label}: ${context.raw.toFixed(2)} m³`;
                }
            }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                callback: (value) => `${value.toFixed(2)} m³`
            }
        }
    }
}));

const costChartOptions = computed(() => ({
    ...baseChartOptions.value,
    plugins: {
        ...baseChartOptions.value.plugins,
        tooltip: {
            callbacks: {
                label: (context) => {
                    return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                }
            }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                callback: (value) => formatCurrency(value)
            }
        }
    }
}));

const sortedHistoricalReadings = computed(() => {
    if (!condoStats.value?.consumptionTrend) return [];
    console.log('Datos históricos:', condoStats.value.consumptionTrend);
    return [...condoStats.value.consumptionTrend].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
    );
});


// Función para cargar las estadísticas
const loadCondoStats = async () => {
    try {
        isLoadingStats.value = true;
        const stats = await condoHistoryService.getCondoStats(condoId);
        condoStats.value = stats;
        updateChartData(); // Actualizar los datos de los gráficos
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