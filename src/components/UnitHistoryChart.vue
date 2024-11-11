<!-- src/components/UnitHistoryChart.vue -->
<template>
    <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">Historial de Consumo</h3>

        <!-- Loading state -->
        <div v-if="loading" class="flex items-center justify-center h-64">
            <p class="text-gray-600">Cargando...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-red-50 p-4 rounded-md text-red-700">
            Error: {{ error }}
        </div>

        <!-- No data state -->
        <div v-else-if="!historyData?.consumptionTrend?.length" class="bg-gray-50 p-4 rounded-md text-gray-600">
            No hay datos históricos disponibles
        </div>

        <!-- Data visualization -->
        <template v-else>
            <!-- Stats cards -->
            <div class="grid grid-cols-3 gap-4 mb-6">
                <div class="bg-blue-50 p-4 rounded">
                    <p class="text-sm text-gray-600">Consumo Promedio</p>
                    <p class="text-xl font-semibold">
                        {{ formatNumber(historyData.averageConsumption) }} m³
                    </p>
                </div>
                <div class="bg-green-50 p-4 rounded">
                    <p class="text-sm text-gray-600">Consumo Mínimo</p>
                    <p class="text-xl font-semibold">
                        {{ formatNumber(historyData.minConsumption) }} m³
                    </p>
                </div>
                <div class="bg-red-50 p-4 rounded">
                    <p class="text-sm text-gray-600">Consumo Máximo</p>
                    <p class="text-xl font-semibold">
                        {{ formatNumber(historyData.maxConsumption) }} m³
                    </p>
                </div>
            </div>

            <!-- Chart -->
            <div class="h-64">
                <Bar v-if="chartData" :data="chartData" :options="chartOptions" />
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'vue-chartjs';
import { unitHistoryService } from '../services/unitHistoryService';

// Registrar componentes de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

// Props
const props = defineProps({
    unitId: {
        type: String,
        required: true
    }
});

// Refs
const loading = ref(true);
const error = ref(null);
const historyData = ref(null);

// Computed
const chartData = computed(() => {
    if (!historyData.value?.consumptionTrend) return null;

    return {
        labels: historyData.value.consumptionTrend.map(item =>
            new Date(item.date).toLocaleDateString('es-ES', {
                month: 'short',
                year: 'numeric'
            })
        ),
        datasets: [
            {
                label: 'Consumo (m³)',
                data: historyData.value.consumptionTrend.map(item => item.consumption),
                backgroundColor: 'rgba(37, 99, 235, 0.5)',
                borderColor: '#2563eb',
                borderWidth: 1
            }
        ]
    };
});

const chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top'
        },
        tooltip: {
            callbacks: {
                label: (context) => `${context.raw.toFixed(2)} m³`
            }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            title: {
                display: true,
                text: 'Consumo (m³)'
            }
        }
    }
}));

// Methods
const formatNumber = (value) => {
    return value ? value.toFixed(2) : '0.00';
};

const loadHistory = async () => {
    try {
        loading.value = true;
        error.value = null;
        const stats = await unitHistoryService.getUnitConsumptionStats(props.unitId);
        historyData.value = stats;
    } catch (err) {
        console.error('Error loading unit history:', err);
        error.value = err.message;
    } finally {
        loading.value = false;
    }
};

// Lifecycle hooks
onMounted(loadHistory);
</script>