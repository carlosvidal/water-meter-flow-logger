<!-- src/views/CreateReading.vue -->
<template>
    <div class="max-w-4xl mx-auto p-4 space-y-6">
        <h1 class="text-2xl font-bold">{{ pageTitle }}</h1>

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
        </div>

        <template v-if="selectedCondoId">
            <!-- Lectura Principal -->
            <div class="bg-white shadow rounded-lg p-6">
                <h2 class="text-xl font-semibold mb-4">
                    {{ isFirstReading ? 'Lectura Base' : 'Lectura de Medidor Principal' }}
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Fecha de Lectura</label>
                        <input type="date" v-model="mainReading.date" required
                            class="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <!-- Solo mostrar estos campos si no es la primera lectura -->
                    <template v-if="!isFirstReading">
                        <div>
                            <label class="block text-sm font-medium mb-1">Lectura (m³)</label>
                            <input type="number" v-model="mainReading.reading"
                                class="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0" step="0.001" min="0" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Costo Total</label>
                            <input type="number" v-model="mainReading.cost"
                                class="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0" step="0.01" min="0" />
                        </div>
                    </template>
                </div>
            </div>

            <!-- Lecturas Individuales -->
            <div class="bg-white shadow rounded-lg p-6">
                <h2 class="text-xl font-semibold mb-4">
                    {{ isFirstReading ? 'Lecturas Iniciales' : 'Lecturas Individuales' }}
                </h2>
                <div v-if="units.length === 0" class="text-center py-4">
                    <p class="text-gray-600">No hay unidades registradas en este condominio</p>
                </div>
                <div v-else class="space-y-4">
                    <div v-for="unit in sortedUnits" :key="unit.id"
                        class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md">
                        <div class="md:col-span-2">
                            <span class="font-medium">{{ unit.name }}</span>
                            <p class="text-sm text-gray-500">{{ unit.tenant?.name }}</p>
                            <p v-if="!isFirstReading && previousReadings[unit.id]" class="text-xs text-gray-500">
                                Lectura anterior: {{ formatReading(previousReadings[unit.id]) }} m³
                            </p>
                        </div>
                        <div>
                            <input type="number" v-model="unitReadings[unit.id]" @input="validateUnitReading(unit.id)"
                                class="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                step="0.001" min="0" :class="{ 'border-red-500': readingErrors[unit.id] }"
                                :placeholder="getUnitReadingPlaceholder(unit.id)" />
                            <p v-if="readingErrors[unit.id]" class="text-red-500 text-xs mt-1">
                                {{ readingErrors[unit.id] }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Botones de Acción -->
            <div class="flex justify-end space-x-4">
                <button @click="cancel"
                    class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500">
                    Cancelar
                </button>
                <button v-if="readingId && !isFirstReading" @click="closeReading" :disabled="!canClose || isSaving"
                    class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300">
                    {{ isSaving ? 'Cerrando...' : 'Cerrar Lectura' }}
                </button>
                <button @click="saveReading" :disabled="!canSave || isSaving"
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300">
                    {{ getSaveButtonText }}
                </button>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { readingService } from '../services/readingService';
import { db } from '../firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

const router = useRouter();
const route = useRoute();
const readingId = route.params.id;

// Estados
const loading = ref(false);
const isSaving = ref(false);
const error = ref('');
const condos = ref([]);
const units = ref([]);
const selectedCondoId = ref('');
const isFirstReading = ref(false);
const previousReadings = ref({});
const readingErrors = ref({});

// Modelo principal
const mainReading = ref({
    date: new Date().toISOString().slice(0, 10),
    reading: null,
    cost: null
});

// Lecturas individuales
const unitReadings = ref({});

// Computed properties
const sortedUnits = computed(() => {
    return [...units.value].sort((a, b) => a.name.localeCompare(b.name));
});

const canSave = computed(() => {
    if (!selectedCondoId.value || !mainReading.value.date) {
        console.log('Falta condoId o fecha');
        return false;
    }

    // Verificar que todas las unidades tengan lecturas válidas
    const allUnitsHaveValidReadings = units.value.every(unit => {
        const reading = unitReadings.value[unit.id];
        const isValid = reading && reading > 0 && !readingErrors.value[unit.id];
        if (!isValid) {
            console.log(`Lectura inválida para unidad ${unit.id}:`, reading);
        }
        return isValid;
    });

    if (!allUnitsHaveValidReadings) {
        console.log('No todas las unidades tienen lecturas válidas');
        return false;
    }

    // Para la primera lectura solo requerimos fecha y lecturas individuales
    if (isFirstReading.value) {
        return true;
    }

    // Para lecturas posteriores requerimos también lectura principal y costo
    if (!mainReading.value.reading || !mainReading.value.cost) {
        console.log('Falta lectura principal o costo');
        return false;
    }

    return true;
});

watch(unitReadings, (newValue) => {
    console.log('Lecturas actualizadas:', newValue);
}, { deep: true });

const getSaveButtonText = computed(() => {
    if (isSaving.value) return 'Guardando...';

    // Si es lectura base (primera lectura)
    if (isFirstReading.value) {
        return 'Guardar Lectura Base';
    }

    // Para lecturas normales
    return readingId.value ? 'Actualizar Lectura' : 'Crear Lectura';
});

const pageTitle = computed(() => {
    if (readingId) return 'Editar Lectura';
    return isFirstReading.value ? 'Registrar Lectura Base' : 'Nueva Lectura';
});

// Métodos
const formatReading = (value) => {
    return value ? Number(value).toFixed(3) : '0.000';
};

const getUnitReadingPlaceholder = (unitId) => {
    if (isFirstReading.value) return 'Ingrese lectura inicial';
    const prevReading = previousReadings.value[unitId];
    return prevReading ? `>${formatReading(prevReading)}` : '0.000';
};

const validateUnitReading = (unitId) => {
    const currentReading = Number(unitReadings.value[unitId]);
    const previousReading = previousReadings.value[unitId];

    readingErrors.value[unitId] = '';

    if (!currentReading || currentReading <= 0) {
        readingErrors.value[unitId] = 'La lectura debe ser mayor a 0';
        return false;
    }

    if (!isFirstReading.value && previousReading && currentReading <= previousReading) {
        readingErrors.value[unitId] = `La lectura debe ser mayor a ${formatReading(previousReading)}`;
        return false;
    }

    return true;
};

const handleCondoChange = async () => {
    if (!selectedCondoId.value) return;

    try {
        loading.value = true;
        error.value = '';

        console.log('Iniciando cambio de condominio');

        // Reiniciar estados
        unitReadings.value = {};
        readingErrors.value = {};
        previousReadings.value = {};

        // Verificar si es primera lectura
        isFirstReading.value = await readingService.isFirstReading(selectedCondoId.value);
        console.log('Es primera lectura:', isFirstReading.value);

        // Cargar unidades
        const unitsData = await loadUnits();
        console.log('Unidades cargadas:', unitsData);
        units.value = unitsData;

        // Cargar lecturas anteriores si no es primera lectura
        if (!isFirstReading.value) {
            previousReadings.value = await loadPreviousReadings();
            console.log('Lecturas anteriores:', previousReadings.value);
        }

        // Inicializar lecturas para cada unidad
        units.value.forEach(unit => {
            unitReadings.value[unit.id] = null;
        });

        console.log('Estado después de cambio de condominio:', {
            condoId: selectedCondoId.value,
            isFirstReading: isFirstReading.value,
            unitsCount: units.value.length,
            unitReadings: unitReadings.value
        });

    } catch (err) {
        error.value = err.message;
        console.error('Error al cambiar condominio:', err);
    } finally {
        loading.value = false;
    }
};

const loadUnits = async () => {
    const unitsSnapshot = await getDocs(
        query(collection(db, 'units'),
            where('condoId', '==', selectedCondoId.value),
            where('isActive', '==', true))
    );
    return unitsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

const loadPreviousReadings = async () => {
    previousReadings.value = await readingService.getPreviousReadings(selectedCondoId.value);
};

// Agregar este computed property
const canClose = computed(() => {
    // Para poder cerrar una lectura necesitamos:
    // 1. Que exista lectura principal y costo
    const hasMainData = mainReading.value.reading > 0 && mainReading.value.cost > 0;

    // 2. Que haya unidades
    if (!units.value.length) return false;

    // 3. Que todas las unidades tengan lecturas válidas
    const allUnitsHaveReadings = units.value.every(unit => {
        const reading = unitReadings.value[unit.id];
        const previousReading = previousReadings.value[unit.id] || 0;

        return reading &&
            reading > 0 &&
            !readingErrors.value[unit.id] &&
            reading > previousReading;
    });

    return hasMainData && allUnitsHaveReadings;
});
// Agregar este método
const closeReading = async () => {
    try {
        console.log('Iniciando cierre de lectura...');
        console.log('Estado canClose:', canClose.value);
        console.log('Datos principales:', {
            reading: mainReading.value.reading,
            cost: mainReading.value.cost,
            unitReadings: unitReadings.value
        });

        if (!canClose.value) {
            error.value = 'No se puede cerrar la lectura. Verifique que todos los datos estén completos.';
            console.log('No se puede cerrar la lectura:', error.value);
            return;
        }

        isSaving.value = true;
        error.value = '';

        await readingService.closeReading(readingId);
        console.log('Lectura cerrada exitosamente');
        router.push('/meter-readings');
    } catch (err) {
        error.value = err.message;
        console.error('Error al cerrar lectura:', err);
    } finally {
        isSaving.value = false;
    }
};


const saveReading = async () => {
    try {
        console.log('=== INICIO DE GUARDADO DE LECTURA ===');
        console.log('Estado inicial:', {
            isFirstReading: isFirstReading.value,
            selectedCondoId: selectedCondoId.value,
            mainReading: mainReading.value,
            unitReadings: unitReadings.value,
            units: units.value
        });

        if (!canSave.value) {
            console.log('No se puede guardar - canSave es false');
            return;
        }

        isSaving.value = true;
        error.value = '';

        if (isFirstReading.value) {
            // ... código para primera lectura ...
        } else {
            console.log('Preparando lecturas individuales...');
            const formattedUnitReadings = {};

            // Verificar que haya unidades y lecturas
            if (!units.value.length) {
                throw new Error('No hay unidades registradas');
            }

            console.log('Units:', units.value);
            console.log('Current unitReadings:', unitReadings.value);

            for (const unit of units.value) {
                const reading = unitReadings.value[unit.id];
                console.log(`Procesando unidad ${unit.id}:`, reading);

                if (!reading && reading !== 0) {
                    throw new Error(`Falta la lectura para la unidad ${unit.name}`);
                }

                const readingValue = Number(reading);
                if (isNaN(readingValue) || readingValue <= 0) {
                    throw new Error(`Lectura inválida para la unidad ${unit.name}`);
                }

                formattedUnitReadings[unit.id] = readingValue;
            }

            console.log('Lecturas formateadas:', formattedUnitReadings);

            const readingData = {
                condoId: selectedCondoId.value,
                date: mainReading.value.date,
                reading: Number(mainReading.value.reading),
                cost: Number(mainReading.value.cost),
                unitReadings: formattedUnitReadings,
                status: 'open'
            };

            // Validación adicional y logging
            console.log('readingData antes de enviar:', JSON.stringify(readingData, null, 2));

            if (!readingData.unitReadings || Object.keys(readingData.unitReadings).length === 0) {
                console.error('Lecturas faltantes:', {
                    unitReadings: readingData.unitReadings,
                    originalUnitReadings: unitReadings.value,
                    formattedReadings: formattedUnitReadings
                });
                throw new Error('No se han ingresado lecturas de unidades');
            }

            if (readingId) {
                await readingService.updateMainReading(readingId, readingData);
            } else {
                const result = await readingService.createMainReading(readingData);
                console.log('Lectura creada con ID:', result);
            }
        }

        router.push('/meter-readings');
    } catch (err) {
        error.value = err.message;
        console.error('Error al guardar lectura:', err);
    } finally {
        isSaving.value = false;
    }
};
const cancel = () => {
    router.back();
};

// Inicialización
onMounted(async () => {
    try {
        loading.value = true;

        // Cargar condominios
        const condosSnapshot = await getDocs(collection(db, 'condos'));
        condos.value = condosSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Si es edición, cargar lectura existente
        if (readingId) {
            const readingDoc = await getDoc(doc(db, 'meter-readings', readingId));
            if (!readingDoc.exists()) {
                throw new Error('Lectura no encontrada');
            }

            const readingData = readingDoc.data();
            selectedCondoId.value = readingData.condoId;
            mainReading.value = {
                date: readingData.date,
                reading: readingData.reading / 1000, // Convertir de litros a m³
                cost: readingData.cost / 100 // Convertir de centavos a soles
            };

            // Cargar lecturas individuales
            Object.entries(readingData.unitReadings || {}).forEach(([unitId, reading]) => {
                unitReadings.value[unitId] = reading.reading / 1000; // Convertir de litros a m³
            });

            await handleCondoChange();
        }
    } catch (err) {
        error.value = err.message;
        console.error('Error al inicializar:', err);
    } finally {
        loading.value = false;
    }
});
</script>