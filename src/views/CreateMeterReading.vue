<!-- src/views/CreateMeterReading.vue -->
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

            <div v-if="condos.length === 0" class="text-sm text-gray-500">
                No hay condominios disponibles
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
                                placeholder="0" step="1" min="0" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Costo Total</label>
                            <input type="number" v-model="mainReading.cost"
                                class="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0" step="1" min="0" />
                        </div>
                    </template>
                </div>

                <!-- Mensaje informativo para primera lectura -->
                <div v-if="isFirstReading" class="mt-4 text-sm text-gray-600">
                    Esta es la lectura base del condominio. Solo necesita ingresar la fecha y las lecturas iniciales de
                    cada unidad.
                </div>
            </div>

            <!-- Lecturas Individuales - Modificar esta sección -->
            <div class="bg-white shadow rounded-lg p-6">
                <h2 class="text-xl font-semibold mb-4">
                    {{ isFirstReading ? 'Lecturas Iniciales' : 'Lecturas Individuales' }}
                </h2>
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
                            <p v-if="!isFirstReading && previousReadings[unit.id]" class="text-xs text-gray-500">
                                Lectura anterior: {{ previousReadings[unit.id] }} m³
                            </p>
                        </div>
                        <div>
                            <input type="number" v-model="unitReadings[unit.id]"
                                class="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" step="1"
                                min="0"
                                :placeholder="isFirstReading ? 'Ingrese lectura inicial' : (previousReadings[unit.id] ? `>${previousReadings[unit.id]}` : '0')" />
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
                <button v-if="isFirstReading" @click="saveMainReading" :disabled="!canSaveMainReading || loading"
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300">
                    {{ loading ? 'Guardando...' : 'Guardar Lectura Base' }}
                </button>
                <template v-else>
                    <button @click="saveMainReading" :disabled="!canSaveMainReading || loading"
                        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300">
                        {{ loading ? 'Guardando...' : mainReadingId ? 'Actualizar Lectura' : 'Crear Lectura' }}
                    </button>
                    <button v-if="mainReadingId" @click="closeReading" :disabled="!canClose || loading" :class="[
                        'px-4 py-2 text-white rounded focus:outline-none focus:ring-2',
                        canClose && !loading ? 'bg-green-600 hover:bg-green-700' : 'bg-green-300 cursor-not-allowed'
                    ]">
                        {{ loading ? 'Guardando...' : 'Cerrar Lectura' }}
                    </button>
                </template>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { readingService } from '../services/readingService';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';

const router = useRouter();
const route = useRoute();
const readingId = route.params.id;

const isFirstReading = ref(false);

// Estados
const condos = ref([]);
const selectedCondoId = ref('');
const mainReadingId = ref(null);
const previousReadings = ref({});
const success = ref('');

const mainReading = ref({
    date: '', // Iniciar con fecha vacía
    reading: null,
    cost: null,
    status: 'open',
    condoId: ''
});

const units = ref([]);
const unitReadings = ref({});
const error = ref('');
const loading = ref(false);

const showMainReadingInputs = computed(() => !isFirstReading.value);


// Nueva computed property para validar si se puede guardar la lectura principal
const canSaveMainReading = computed(() => {
    if (!selectedCondoId.value || !mainReading.value.date) return false;

    if (isFirstReading.value) {
        // Para primera lectura, verificar que todas las unidades tengan lectura inicial
        return units.value.length > 0 && units.value.every(unit =>
            unitReadings.value[unit.id] &&
            Number(unitReadings.value[unit.id]) > 0
        );
    }

    // Para lecturas posteriores
    return true;
});

// Computed properties
const canClose = computed(() => {
    if (!mainReadingId.value || !mainReading.value.reading || !mainReading.value.cost) return false;

    // Verificar que todas las unidades tengan lectura y sean mayores que sus lecturas anteriores
    const allReadingsValid = units.value.every(unit => {
        const currentReading = Number(unitReadings.value[unit.id]);
        const previousReading = previousReadings.value[unit.id] || 0;
        return currentReading && currentReading > previousReading;
    });

    return allReadingsValid;
});

// Métodos nuevos y actualizados
const saveMainReading = async () => {
    if (!canSaveMainReading.value) {
        error.value = isFirstReading.value
            ? 'Todas las unidades deben tener una lectura inicial'
            : 'Faltan datos requeridos';
        return;
    }

    try {
        loading.value = true;
        error.value = '';
        success.value = '';

        // Validar que todas las unidades tengan lectura para primera lectura
        if (isFirstReading.value) {
            const missingUnits = units.value.filter(unit =>
                !unitReadings.value[unit.id] || Number(unitReadings.value[unit.id]) <= 0
            );

            if (missingUnits.length > 0) {
                error.value = `Faltan lecturas para las unidades: ${missingUnits.map(u => u.name).join(', ')}`;
                return;
            }

            await readingService.createFirstReading(
                selectedCondoId.value,
                mainReading.value.date,
                unitReadings.value
            );

            success.value = 'Lectura base creada correctamente';
            router.push('/meter-readings');
            return;
        }

        // Flujo para lecturas normales
        const readingData = {
            date: mainReading.value.date,
            condoId: selectedCondoId.value,
            status: 'open',
            reading: mainReading.value.reading || null,
            cost: mainReading.value.cost || null
        };

        try {
            if (mainReadingId.value) {
                await readingService.updateMainReading(mainReadingId.value, readingData);
                success.value = 'Lectura actualizada correctamente';
            } else {
                // Crear la lectura principal
                mainReadingId.value = await readingService.createMainReading(readingData);

                // Guardar las lecturas individuales existentes
                if (Object.keys(unitReadings.value).length > 0) {
                    const savePromises = Object.entries(unitReadings.value)
                        .filter(([_, reading]) => reading && Number(reading) > 0)
                        .map(([unitId, reading]) =>
                            readingService.saveUnitReading(mainReadingId.value, {
                                unitId,
                                reading: Number(reading)
                            })
                        );

                    await Promise.all(savePromises);
                }
                success.value = 'Lectura creada correctamente';
            }
        } catch (err) {
            error.value = err.message;
            if (!mainReadingId.value) {
                mainReadingId.value = null;
            }
            throw err; // Re-lanzar para que el catch exterior lo maneje
        }
    } catch (err) {
        error.value = err.message;
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
    mainReadingId.value = null; // Reset mainReadingId
    unitReadings.value = {}; // Reset unitReadings

    if (!selectedCondoId.value) return;

    try {
        loading.value = true;
        error.value = '';

        // Cargar en paralelo
        const [isFirst, units] = await Promise.all([
            readingService.isFirstReading(selectedCondoId.value),
            loadUnits(),
            loadPreviousReadings()
        ]);

        isFirstReading.value = isFirst;
        mainReading.value.condoId = selectedCondoId.value;

    } catch (err) {
        error.value = err.message;
    } finally {
        loading.value = false;
    }
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

        await readingService.closeReading(mainReadingId.value, {
            reading: mainReading.value.reading,
            cost: mainReading.value.cost
        });

        router.push('/meter-readings');
    } catch (err) {
        error.value = err.message;
    } finally {
        loading.value = false;
    }
};

const cancel = () => {
    router.back();
};

const loadExistingReading = async () => {
    try {
        loading.value = true;
        error.value = '';

        const docRef = doc(db, 'meter-readings', readingId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const readingData = docSnap.data();
            mainReading.value = {
                date: readingData.date,
                reading: readingData.reading,
                cost: readingData.cost,
                status: readingData.status,
                condoId: readingData.condoId
            };

            selectedCondoId.value = readingData.condoId;
            mainReadingId.value = readingId;

            // Cargar los datos relacionados
            await loadUnits();

            try {
                await loadPreviousReadings();
            } catch (err) {
                console.warn('Error loading previous readings, continuing without them:', err);
                // No interrumpimos la carga si falla la obtención de lecturas anteriores
            }

            // Cargar lecturas individuales existentes
            try {
                const unitReadingsSnapshot = await getDocs(
                    query(
                        collection(db, 'unit-readings'),
                        where('mainReadingId', '==', readingId)
                    )
                );

                const readings = {};
                unitReadingsSnapshot.forEach(doc => {
                    const data = doc.data();
                    readings[data.unitId] = data.reading;
                });
                unitReadings.value = readings;
            } catch (err) {
                console.error('Error loading unit readings:', err);
                error.value = 'Error cargando lecturas de unidades';
            }
        } else {
            error.value = 'Lectura no encontrada';
            router.push('/meter-readings');
        }
    } catch (err) {
        console.error('Error loading reading:', err);
        error.value = 'Error cargando la lectura: ' + err.message;
    } finally {
        loading.value = false;
    }
};

// Modificar el lifecycle hook
onMounted(async () => {
    if (readingId) {
        // Cargar lectura existente
        await loadExistingReading();
    } else {
        // Cargar condominios para nueva lectura
        await loadCondos();
    }
});

const pageTitle = computed(() =>
    mainReadingId.value ? 'Editar Lectura' : 'Nueva Lectura'
);
</script>