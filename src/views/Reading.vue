<template>
    <div class="container mx-auto p-6">
        <div v-if="loading" class="text-center py-8">
            <p class="text-gray-600">Cargando lectura...</p>
        </div>

        <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {{ error }}
        </div>

        <div v-else class="space-y-6">
            <!-- Header principal -->
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-bold text-gray-900">
                    Detalles de Lectura
                </h1>
                <div class="flex items-center space-x-3">
                    <button @click="exportReadingDetails" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 
                       focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                        Exportar a CSV
                    </button>
                    <span
                        :class="`px-2 py-1 text-sm font-semibold rounded-full 
                      ${mainReading?.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`">
                        {{ mainReading?.status === 'open' ? 'Abierta' : 'Cerrada' }}
                    </span>
                </div>
            </div>

            <!-- Contenedor principal para Lectura Principal y Distribución -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Lectura Principal - ocupa 2/3 del espacio -->
                <div class="bg-white shadow rounded-lg p-6 lg:col-span-2">
                    <div class="mb-6">
                        <p class="text-sm text-gray-500">{{ condoName }}</p>
                        <p class="text-sm text-gray-600">
                            Fecha: {{ formatDate(mainReading?.date) }}
                        </p>
                    </div>

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

                    <!-- Detalle de Consumos -->
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

                <!-- Gráfico de distribución de consumos -->
                <div class="bg-white shadow rounded-lg p-6">
                    <h2 class="text-lg font-semibold mb-4 text-center">Distribución de Consumos</h2>
                    <PieChart :data="chartData" class="w-full" />
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
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Lectura Anterior (m³)
                                </th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Lectura Actual (m³)
                                </th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Consumo (m³)
                                </th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Costo Individual (S/)
                                </th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Áreas Comunes (S/)
                                </th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Total (S/)
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
                                <td class="px-6 py-4 whitespace-nowrap text-right font-mono tabular-nums">
                                    {{ formatReading(getPreviousReading(reading.unitId)) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right font-mono tabular-nums">
                                    {{ formatReading(reading.reading) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right font-mono tabular-nums">
                                    {{ formatReading(calculateConsumption(reading)) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right font-mono tabular-nums">
                                    {{ formatNumberOnly(reading.individualCost) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right font-mono tabular-nums">
                                    {{ formatNumberOnly(reading.commonAreaCost) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right font-mono tabular-nums font-medium">
                                    {{ formatNumberOnly(reading.totalCost) }}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot class="bg-gray-50">
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap font-medium">Totales</td>
                                <td class="px-6 py-4 whitespace-nowrap text-right font-mono tabular-nums">-</td>
                                <td class="px-6 py-4 whitespace-nowrap text-right font-mono tabular-nums">-</td>
                                <td class="px-6 py-4 whitespace-nowrap text-right font-mono tabular-nums">
                                    {{ formatReading(calculateTotalConsumption()) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right font-mono tabular-nums">
                                    {{ formatNumberOnly(calculateTotalIndividualCost()) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right font-mono tabular-nums">
                                    {{ formatNumberOnly(calculateTotalCommonAreaAmount()) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right font-mono tabular-nums font-medium">
                                    {{ formatNumberOnly(mainReading?.cost) }}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { exportToCSV } from '../utils/csvExport';
import PieChart from '@/components/PieChart.vue';


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
    // Asegurarse de que estamos trabajando con números
    const numValue = Number(value);
    return isNaN(numValue) ? '-' : numValue.toFixed(3);
};

const getAdjustedReading = (value) => {
    if (value === null || value === undefined) return 0;
    return value / 1000;
};

const getPreviousReading = (unitId) => {
    // Buscar la lectura unitaria correspondiente
    const unitReading = unitReadings.value.find(reading => reading.unitId === unitId);
    // Obtener el valor de previousReading de la lectura unitaria
    return unitReading?.previousReading || null;
};

watch(units, (newUnits) => {
    console.log('Unidades actualizadas:', newUnits);
}, { deep: true });

watch(unitReadings, (newReadings) => {
    console.log('Lecturas actualizadas:', newReadings);
}, { deep: true });


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
    const unit = units.value[unitId];
    if (!unit) {
        console.warn(`Unidad no encontrada para el ID: ${unitId}`); // Para debug
        return 'Unidad no encontrada';
    }
    return unit.name;
};

const calculateConsumption = (reading) => {
    if (!reading.previousReading) return 0;
    // La diferencia entre la lectura actual y la anterior
    return reading.reading - reading.previousReading;
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
    return unitReadings.value.reduce((sum, reading) => {
        const consumption = reading.reading - (reading.previousReading || 0);
        return sum + consumption;
    }, 0);
};


const calculateTotalIndividualCost = () => {
    return unitReadings.value.reduce((sum, reading) => {
        const individualCost = Number(reading.individualCost);
        return isNaN(individualCost) ? sum : sum + individualCost;
    }, 0);
};

const calculateTotalCommonAreaCost = () => {
    if (!mainReading.value?.cost || unitReadings.value.length === 0) return 0;
    const totalIndividualCost = calculateTotalIndividualCost();
    const remainingCost = mainReading.value.cost - totalIndividualCost;
    return remainingCost / unitReadings.value.length; // Costo por unidad
};


const calculateTotalCommonAreaAmount = () => {
    return unitReadings.value.reduce((sum, reading) => {
        return sum + (reading.commonAreaCost || 0);
    }, 0);
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

        // Obtener la lectura actual
        const readingDoc = await getDoc(doc(db, 'meter-readings', readingId));
        if (!readingDoc.exists()) {
            throw new Error('Lectura no encontrada');
        }

        const readingData = readingDoc.data();
        mainReading.value = { id: readingDoc.id, ...readingData };

        // Cargar información de unidades primero
        const unitsSnapshot = await getDocs(
            query(
                collection(db, 'units'),
                where('condoId', '==', readingData.condoId)
            )
        );

        // Crear un mapa de unidades para acceso rápido
        units.value = {};
        unitsSnapshot.docs.forEach(doc => {
            units.value[doc.id] = {
                id: doc.id,
                ...doc.data()
            };
        });

        console.log('Unidades cargadas:', units.value); // Para debug

        // Convertir el mapa de lecturas a un array después de cargar las unidades
        unitReadings.value = Object.entries(readingData.unitReadings || {}).map(
            ([unitId, reading]) => ({
                unitId,
                ...reading
            })
        );

        console.log('Lecturas unitarias:', unitReadings.value); // Para debug

        // Cargar nombre del condominio
        const condoDoc = await getDoc(doc(db, 'condos', readingData.condoId));
        if (condoDoc.exists()) {
            condoName.value = condoDoc.data().name;
        }

    } catch (err) {
        console.error('Error loading reading:', err);
        error.value = err.message;
    } finally {
        loading.value = false;
    }
};
// Función para preparar y exportar los datos
const exportReadingDetails = () => {
    // Definir los encabezados y getters para el CSV
    const headers = [
        { label: 'Unidad', getter: item => item.isTotal ? 'Totales' : getUnitName(item.unitId) },
        { label: 'Lectura Anterior (m³)', getter: item => item.isTotal ? '-' : formatReading(getPreviousReading(item.unitId)) },
        { label: 'Lectura Actual (m³)', getter: item => item.isTotal ? '-' : formatReading(item.reading) },
        {
            label: 'Consumo (m³)', getter: item => {
                if (item.isTotal) {
                    return formatReading(calculateTotalConsumption());
                }
                return formatReading(calculateConsumption(item));
            }
        },
        {
            label: 'Costo Individual', getter: item => {
                if (item.isTotal) {
                    return formatCurrencyRaw(calculateTotalIndividualCost());
                }
                return formatCurrencyRaw(item.individualCost);
            }
        },
        {
            label: 'Costo Áreas Comunes', getter: item => {
                if (item.isTotal) {
                    return formatCurrencyRaw(calculateTotalCommonAreaAmount());
                }
                return formatCurrencyRaw(item.commonAreaCost);
            }
        },
        {
            label: 'Costo Total', getter: item => {
                if (item.isTotal) {
                    return formatCurrencyRaw(calculateTotalCost());
                }
                return formatCurrencyRaw(item.totalCost);
            }
        }
    ];

    // Preparar datos adicionales del resumen
    const summaryData = [{
        isTotal: true,
        unitId: 'TOTAL',
        reading: calculateTotalReading(),
        consumption: calculateTotalConsumption(),
        individualCost: calculateTotalIndividualCost(),
        commonAreaCost: calculateTotalCommonAreaCost(),
        totalCost: calculateTotalCost()
    }];

    // Combinar las lecturas individuales con el resumen
    const exportData = [...unitReadings.value, ...summaryData];

    // Generar nombre del archivo
    const filename = `lectura_${condoName.value}_${formatDate(mainReading.value?.date)}.csv`;

    // Exportar a CSV
    exportToCSV(exportData, headers, filename);
};

// Agregar función auxiliar para formatear moneda sin el símbolo
const formatCurrencyRaw = (amount) => {
    if (!amount) return '0.00';
    return amount.toFixed(2);
};

const formatNumberOnly = (amount) => {
    if (amount === null || amount === undefined) return '0.00';
    const numValue = Number(amount);
    return isNaN(numValue) ? '0.00' : numValue.toFixed(2);
};

const chartData = computed(() => {
    if (!mainReading.value || unitReadings.value.length === 0) return [];

    // Consumo total (ya está en litros)
    const totalConsumption = mainReading.value.reading * 1000;

    // Preparar datos de unidades
    const unitData = sortedUnitReadings.value.map(reading => ({
        name: getUnitName(reading.unitId),
        value: calculateConsumption(reading) / 1000 // Convertir a m³
    }));

    // Calcular áreas comunes como la diferencia entre el total y la suma de unidades
    const individualTotal = sortedUnitReadings.value.reduce(
        (sum, reading) => sum + calculateConsumption(reading),
        0
    );

    const commonArea = {
        name: 'Áreas Comunes',
        value: (totalConsumption - individualTotal) / 1000 // Convertir a m³
    };

    return [...unitData, commonArea];
});

const consumptionChartData = computed(() => {
    if (!mainReading.value || unitReadings.value.length === 0) return [];

    // Datos de consumos individuales
    const individualData = sortedUnitReadings.value.map(reading => ({
        name: getUnitName(reading.unitId),
        value: calculateConsumption(reading) / 1000 // Convertir a m³
    }));

    // Agregar consumo de áreas comunes
    const commonAreaConsumption = calculateCommonAreaConsumption() / 1000; // Convertir a m³
    if (commonAreaConsumption > 0) {
        individualData.push({
            name: 'Áreas Comunes',
            value: commonAreaConsumption
        });
    }

    return individualData;
});

onMounted(() => {
    loadReading();
});
</script>
