<template>
    <div class="container mx-auto p-6">
        <!-- Debug info -->
        <div class="text-sm text-gray-500 mb-4">
            <p>Unit ID: {{ unitId }}</p>
            <p>Loading: {{ loading }}</p>
            <p>Has Error: {{ !!error }}</p>
            <p>Has Unit: {{ !!unit }}</p>
        </div>

        <div v-if="loading" class="text-center py-8">
            <p class="text-gray-600">Cargando...</p>
        </div>

        <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {{ error }}
        </div>

        <div v-else-if="unit" class="space-y-6">
            <!-- Header -->
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">
                        {{ unit.name }}
                        <span class="ml-2 text-sm text-gray-500">
                            (Condominio: {{ condoName }})
                        </span>
                    </h1>
                </div>
                <div class="flex items-center space-x-3">
                    <router-link :to="`/unit/${unitId}/edit`"
                        class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        Editar
                    </router-link>
                </div>
            </div>

            <!-- Vista de detalles -->
            <div class="bg-white shadow rounded-lg divide-y divide-gray-200">
                <!-- Información de la unidad -->
                <div class="px-6 py-5">
                    <h3 class="text-lg font-medium text-gray-900">Información de la Unidad</h3>
                    <dl class="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Nombre</dt>
                            <dd class="mt-1 text-sm text-gray-900">{{ unit.name }}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Estado</dt>
                            <dd class="mt-1">
                                <span :class="[
                                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                                    unit.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                ]">
                                    {{ unit.isActive ? 'Activo' : 'Inactivo' }}
                                </span>
                            </dd>
                        </div>
                    </dl>
                </div>

                <!-- Información del residente -->
                <div class="px-6 py-5" v-if="unit.tenant">
                    <h3 class="text-lg font-medium text-gray-900">Información del Residente</h3>
                    <dl class="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Nombre</dt>
                            <dd class="mt-1 text-sm text-gray-900">{{ unit.tenant.name }}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Email</dt>
                            <dd class="mt-1 text-sm text-gray-900">
                                <a :href="`mailto:${unit.tenant.email}`" class="text-blue-600 hover:text-blue-800">
                                    {{ unit.tenant.email }}
                                </a>
                            </dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Teléfono</dt>
                            <dd class="mt-1 text-sm text-gray-900">
                                <a :href="`tel:${unit.tenant.phone}`" class="text-blue-600 hover:text-blue-800">
                                    {{ unit.tenant.phone }}
                                </a>
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            <!-- Historial -->
            <div class="mt-8" v-if="unit.id">
                <UnitHistoryChart :unit-id="unit.id" />
            </div>

            <div class="bg-white shadow rounded-lg overflow-hidden">
                <div class="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <h2 class="text-lg font-medium">Últimas Lecturas</h2>
                    <span class="text-sm text-gray-500">
                        Mostrando últimas {{ Math.min(unitReadings.length, 12) }} lecturas
                    </span>
                </div>

                <div class="border-t border-gray-200">
                    <div v-if="loadingReadings" class="text-center py-8">
                        <p class="text-gray-600">Cargando lecturas...</p>
                    </div>

                    <div v-else-if="unitReadings.length === 0" class="text-center py-8">
                        <p class="text-gray-600">No hay lecturas registradas</p>
                    </div>

                    <div v-else class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fecha
                                    </th>
                                    <th
                                        class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Lectura (m³)
                                    </th>
                                    <th
                                        class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Consumo (m³)
                                    </th>
                                    <th
                                        class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Costo Individual
                                    </th>
                                    <th
                                        class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Áreas Comunes
                                    </th>
                                    <th
                                        class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total (S/.)
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr v-for="reading in limitedReadings" :key="reading.date" class="hover:bg-gray-50">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                                        {{ formatDate(reading.date) }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                                        {{ formatNumber(reading.reading) }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                                        {{ formatNumber(reading.consumption) }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                                        {{ formatCurrency(reading.individualCost) }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                                        {{ formatCurrency(reading.commonAreaCost) }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-medium">
                                        {{ formatCurrency(reading.totalCost) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
        <div v-else class="text-center py-8">
            <p class="text-gray-600">No se encontró la unidad solicitada</p>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import UnitHistoryChart from '@/components/UnitHistoryChart.vue';

const route = useRoute();
const router = useRouter();

// State
const unitId = ref(route.params.id);
const unit = ref(null);
const condoName = ref('');
const loading = ref(true);
const error = ref(null);
const unitReadings = ref([]);
const loadingReadings = ref(false);

// Computed para limitar a las últimas 12 lecturas
const limitedReadings = computed(() => {
    return [...unitReadings.value]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 12);
});

// Función para cargar las lecturas
const loadReadings = async () => {
    if (!unit.value?.id) return;

    try {
        loadingReadings.value = true;
        const unitHistoryRef = doc(db, 'unit-history', unit.value.id);
        const historySnap = await getDoc(unitHistoryRef);

        if (historySnap.exists()) {
            const readings = historySnap.data().readings || {};
            unitReadings.value = Object.entries(readings)
                .map(([readingId, reading]) => ({
                    id: readingId,
                    ...reading
                }))
                .filter(reading => reading.status === 'completed'); // Solo mostrar lecturas completadas
        }
    } catch (err) {
        console.error('Error loading readings:', err);
    } finally {
        loadingReadings.value = false;
    }
};

// Funciones de formato
const formatNumber = (value) => {
    if (value === undefined || value === null) return '-';
    return Number(value).toFixed(3);
};

const formatCurrency = (value) => {
    if (value === undefined || value === null) return '-';
    return `S/. ${Number(value).toFixed(2)}`;
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const fetchUnit = async () => {
    console.log('Starting fetchUnit with ID:', unitId.value);

    try {
        loading.value = true;
        error.value = null;

        if (!unitId.value) {
            throw new Error('ID de unidad no proporcionado');
        }

        // Obtener documento de unidad
        const unitRef = doc(db, 'units', unitId.value);
        const unitSnap = await getDoc(unitRef);

        console.log('Unit document exists:', unitSnap.exists());

        if (!unitSnap.exists()) {
            throw new Error('Unidad no encontrada');
        }

        // Obtener datos de la unidad
        const unitData = unitSnap.data();
        console.log('Unit data:', unitData);

        // Verificar datos requeridos
        if (!unitData.condoId) {
            throw new Error('Datos de unidad incompletos');
        }

        // Obtener datos del condominio
        const condoRef = doc(db, 'condos', unitData.condoId);
        const condoSnap = await getDoc(condoRef);

        if (condoSnap.exists()) {
            condoName.value = condoSnap.data().name;
        } else {
            condoName.value = 'Condominio no encontrado';
        }

        // Asignar datos a la referencia
        unit.value = {
            id: unitSnap.id,
            ...unitData
        };

        if (unit.value) {
            await loadReadings();
        }

        console.log('Unit data loaded successfully:', unit.value);

    } catch (err) {
        console.error('Error fetching unit:', err);
        error.value = err.message;
        if (err.message.includes('no encontrada')) {
            router.push('/units');
        }
    } finally {
        loading.value = false;
    }
};

// Lifecycle hooks
onMounted(() => {
    console.log('Component mounted, unitId:', unitId.value);
    fetchUnit();
});

// Watch route changes
watch(() => route.params.id, (newId) => {
    console.log('Route ID changed:', newId);
    if (newId && newId !== unitId.value) {
        unitId.value = newId;
        fetchUnit();
    }
});
</script>