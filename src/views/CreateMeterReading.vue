<!-- src/views/CreateMeterReading.vue -->
<template>
    <div class="max-w-4xl mx-auto p-4 space-y-6">
        <!-- Loading state -->
        <div v-if="loading" class="text-center py-4">
            <p class="text-gray-600">Cargando...</p>
        </div>

        <!-- Error state -->
        <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {{ error }}
        </div>

        <!-- Selector de Condominio -->
        <div class="bg-white shadow rounded-lg p-6">
            <h2 class="text-xl font-semibold mb-4">Seleccionar Condominio</h2>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1">Condominio</label>
                <select v-model="selectedCondoId" @change="handleCondoChange"
                    class="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Seleccione un condominio</option>
                    <option v-for="condo in condos" :key="condo.id" :value="condo.id">
                        {{ condo.name }}
                    </option>
                </select>
            </div>

            <div v-if="condos.length === 0" class="text-sm text-gray-500">
                No hay condominios disponibles
            </div>
        </div>

        <template v-if="selectedCondoId">
            <!-- Lectura Principal -->
            <div class="bg-white shadow rounded-lg p-6">
                <h2 class="text-xl font-semibold mb-4">Lectura de Medidor Principal</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Fecha de Lectura</label>
                        <input type="date" v-model="mainReading.date" required
                            class="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Lectura (m³)</label>
                        <input type="number" v-model="mainReading.reading"
                            class="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0" step="1" min="0" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Costo Total</label>
                        <input type="number" v-model="mainReading.cost"
                            class="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0" step="1" min="0" />
                    </div>
                </div>
                <!-- Botón para crear/actualizar lectura principal -->
                <div class="mt-4 flex justify-end">
                    <button @click="saveMainReading" :disabled="!canSaveMainReading || loading"
                        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300">
                        {{ loading ? 'Guardando...' : mainReadingId ? 'Actualizar Lectura' : 'Crear Lectura' }}
                    </button>
                </div>
            </div>

            <!-- Lecturas Individuales -->
            <div v-if="mainReadingId" class="bg-white shadow rounded-lg p-6">
                <h2 class="text-xl font-semibold mb-4">Lecturas Individuales</h2>
                <div v-if="loading" class="text-center py-4">
                    <p class="text-gray-600">Cargando unidades...</p>
                </div>
                <div v-else-if="units.length === 0" class="text-center py-4">
                    <p class="text-gray-600">No hay unidades registradas en este condominio</p>
                </div>
                <div v-else class="space-y-4">
                    <div v-for="unit in sortedUnits" :key="unit.id"
                        class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md">
                        <div class="md:col-span-2">
                            <span class="font-medium">{{ unit.name }}</span>
                            <p class="text-sm text-gray-500">{{ unit.tenant?.name }}</p>
                            <p v-if="previousReadings[unit.id]" class="text-xs text-gray-500">
                                Lectura anterior: {{ previousReadings[unit.id] }} m³
                            </p>
                        </div>
                        <div>
                            <input type="number" v-model="unitReadings[unit.id]" @change="saveUnitReading(unit.id)"
                                class="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" step="1"
                                min="0"
                                :placeholder="previousReadings[unit.id] ? `>${previousReadings[unit.id]}` : '0'" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Mensajes de Estado -->
            <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {{ error }}
            </div>
            <div v-if="success" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                {{ success }}
            </div>

            <!-- Botones de Acción -->
            <div class="flex justify-end space-x-4">
                <button @click="cancel"
                    class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500">
                    Cancelar
                </button>
                <button @click="closeReading" :disabled="!canClose || loading" :class="[
                    'px-4 py-2 text-white rounded focus:outline-none focus:ring-2',
                    canClose && !loading ? 'bg-green-600 hover:bg-green-700' : 'bg-green-300 cursor-not-allowed'
                ]">
                    {{ loading ? 'Guardando...' : 'Cerrar Lectura' }}
                </button>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { readingService } from '../services/readingService';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const router = useRouter();

// Estados
const condos = ref([]);
const selectedCondoId = ref('');
const mainReadingId = ref(null);
const previousReadings = ref({});
const success = ref('');

const mainReading = ref({
    date: new Date().toISOString().split('T')[0],
    reading: null,
    cost: null,
    status: 'open',
    condoId: ''
});

const units = ref([]);
const unitReadings = ref({});
const error = ref('');
const loading = ref(false);

// Nueva computed property para validar si se puede guardar la lectura principal
const canSaveMainReading = computed(() => {
    return selectedCondoId.value && mainReading.value.date;
});

// Computed properties
const canClose = computed(() => {
    if (!mainReadingId.value || !mainReading.value.reading || !mainReading.value.cost) return false;

    // Verificar que todas las unidades tengan lectura y sean mayores que sus lecturas anteriores
    return units.value.every(unit => {
        const currentReading = Number(unitReadings.value[unit.id]);
        const previousReading = previousReadings.value[unit.id] || 0;
        return currentReading && currentReading > previousReading;
    });
});

// Métodos nuevos y actualizados
const saveMainReading = async () => {
    if (!canSaveMainReading.value || loading.value) return;

    try {
        loading.value = true;
        error.value = '';
        success.value = '';

        const readingData = {
            date: mainReading.value.date,
            condoId: selectedCondoId.value,
            status: 'open',
            reading: mainReading.value.reading || null,
            cost: mainReading.value.cost || null
        };

        if (mainReadingId.value) {
            await readingService.updateMainReading(mainReadingId.value, readingData);
        } else {
            mainReadingId.value = await readingService.createMainReading(readingData);
            if (mainReadingId.value) {
                await loadPreviousReadings();
            }
        }

        success.value = mainReadingId.value ? 'Lectura actualizada' : 'Lectura creada';
    } catch (err) {
        console.error('Error en saveMainReading:', err);
        error.value = 'Error guardando lectura principal: ' + err.message;
        mainReadingId.value = null;
    } finally {
        loading.value = false;
    }
};

const saveUnitReading = async (unitId) => {
    if (!mainReadingId.value || !unitReadings.value[unitId]) return;

    try {
        loading.value = true;
        error.value = '';

        const reading = Math.floor(Number(unitReadings.value[unitId]));
        const previousReading = previousReadings.value[unitId] || 0;

        if (reading <= previousReading) {
            error.value = `La lectura debe ser mayor que la anterior (${previousReading})`;
            unitReadings.value[unitId] = '';
            return;
        }

        await readingService.saveUnitReading(mainReadingId.value, {
            unitId,
            reading: reading
        });

        success.value = `Lectura de ${units.value.find(u => u.id === unitId)?.name} guardada`;
    } catch (err) {
        error.value = 'Error guardando lectura de unidad: ' + err.message;
    } finally {
        loading.value = false;
    }
};

const loadPreviousReadings = async () => {
    try {
        const readings = await readingService.getPreviousReadings(selectedCondoId.value);
        previousReadings.value = readings;
    } catch (err) {
        console.error('Error cargando lecturas anteriores:', err);
    }
};

// Actualizar handleCondoChange
const handleCondoChange = async () => {
    mainReadingId.value = null;
    previousReadings.value = {};
    units.value = [];
    unitReadings.value = {};
    error.value = '';
    success.value = '';

    if (!selectedCondoId.value) {
        mainReading.value.condoId = '';
        return;
    }

    mainReading.value.condoId = selectedCondoId.value;
    await loadUnits();
};

// Computed property para ordenar unidades
const sortedUnits = computed(() => {
    return [...units.value].sort((a, b) => {
        // Asumiendo que el nombre de la unidad está en unit.name
        return a.name.localeCompare(b.name, undefined, {
            numeric: true,  // Para ordenar correctamente números en el texto
            sensitivity: 'base'  // Para ignorar mayúsculas/minúsculas
        });
    });
});

// Métodos
const loadCondos = async () => {
    try {
        loading.value = true;
        const querySnapshot = await getDocs(collection(db, 'condos'));
        condos.value = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (err) {
        error.value = 'Error cargando condominios: ' + err.message;
    } finally {
        loading.value = false;
    }
};

const loadUnits = async () => {
    try {
        loading.value = true;
        const unitsData = await readingService.getCondoUnits(selectedCondoId.value);
        units.value = unitsData;
        unitReadings.value = {}; // Reiniciar lecturas
    } catch (err) {
        error.value = 'Error cargando unidades: ' + err.message;
    } finally {
        loading.value = false;
    }
};

const calculateTotals = () => {
    const totalUnitConsumption = Object.values(unitReadings.value)
        .reduce((sum, reading) => sum + Number(reading), 0);

    const mainConsumption = Number(mainReading.value.reading);
    const commonAreaConsumption = mainConsumption - totalUnitConsumption;

    const costPerUnit = Number(mainReading.value.cost) / mainConsumption;
    const commonAreaCostPerUnit = (commonAreaConsumption * costPerUnit) / units.value.length;

    return {
        totalUnitConsumption,
        commonAreaConsumption,
        costPerUnit,
        commonAreaCostPerUnit
    };
};

const closeReading = async () => {
    if (!canClose.value || loading.value) return;

    try {
        loading.value = true;
        const calculations = calculateTotals();

        // Crear lectura principal
        const mainReadingId = await readingService.createMainReading(mainReading.value);

        // Crear lecturas individuales
        const unitReadingPromises = Object.entries(unitReadings.value).map(([unitId, reading]) =>
            readingService.createUnitReading(mainReadingId, {
                unitId,
                reading: Number(reading)
            })
        );
        await Promise.all(unitReadingPromises);

        // Cerrar lectura y calcular costos
        await readingService.closeMainReading(mainReadingId, calculations);

        router.push('/meter-readings');
    } catch (err) {
        error.value = 'Error al cerrar la lectura: ' + err.message;
    } finally {
        loading.value = false;
    }
};

const cancel = () => {
    router.back();
};

// Lifecycle hooks
onMounted(async () => {
    await loadCondos();
});
</script>