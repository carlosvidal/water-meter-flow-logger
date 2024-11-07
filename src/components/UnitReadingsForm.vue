<!-- src/components/UnitReadingsForm.vue -->
<template>
    <div class="max-w-4xl mx-auto p-6">
        <h1 class="text-2xl font-bold mb-6">
            {{ isFirstReading ? 'Lecturas Base' : 'Lecturas Individuales' }}
        </h1>

        <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {{ error }}
        </div>

        <div class="bg-white shadow rounded-lg p-6">
            <div class="space-y-4">
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
                        <input type="number" v-model="readings[unit.id]" @input="validateReading(unit.id)"
                            class="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            :class="{ 'border-red-500': errors[unit.id] }" step="0.001" min="0"
                            :placeholder="getPlaceholder(unit.id)" />
                        <p v-if="errors[unit.id]" class="text-red-500 text-xs mt-1">
                            {{ errors[unit.id] }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Botones -->
            <div class="flex justify-end space-x-3 mt-6">
                <button @click="$router.back()"
                    class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    Cancelar
                </button>

                <!-- Botón de cerrar lectura -->
                <button v-if="canClose" @click="handleClose" :disabled="isSaving"
                    class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-green-300">
                    {{ isSaving ? 'Cerrando...' : 'Cerrar Lectura' }}
                </button>

                <button @click="handleSubmit" :disabled="!canSubmit || isSaving"
                    class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
                    {{ isSaving ? 'Guardando...' : submitButtonText }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { readingService } from '../services/readingService';

const router = useRouter();
const props = defineProps({
    mainReading: {
        type: Object,
        required: true
    },
    isFirstReading: Boolean,
    readingId: String,
    units: {
        type: Array,
        required: true
    },
    previousReadings: {
        type: Object,
        default: () => ({})
    }
});

const emit = defineEmits(['submit']);

const readings = ref({});
const errors = ref({});
const isSaving = ref(false);
const error = ref('');

const sortedUnits = computed(() => {
    return [...props.units].sort((a, b) => a.name.localeCompare(b.name));
});

const submitButtonText = computed(() => {
    if (props.mainReading?.status === 'open') {
        return 'Guardar';
    }
    return props.isFirstReading ? 'Guardar Lectura Base' : 'Actualizar Lecturas';
});

const canSubmit = computed(() => {
    return sortedUnits.value.every(unit => {
        const reading = readings.value[unit.id];
        return reading && reading > 0 && !errors.value[unit.id];
    });
});

const formatReading = (value) => {
    return value ? Number(value).toFixed(3) : '0.000';
};

const getPlaceholder = (unitId) => {
    if (props.isFirstReading) return 'Ingrese lectura inicial';
    const prevReading = props.previousReadings[unitId];
    return prevReading ? `>${formatReading(prevReading)}` : '0.000';
};

const canClose = computed(() => {
    console.log('Evaluando canClose:', {
        isFirstReading: props.isFirstReading,
        readingId: props.readingId,
        status: props.mainReading?.status,
        hasReadings: Object.keys(readings.value).length,
        mainReading: props.mainReading
    });

    // Solo mostrar el botón de cerrar si:
    // 1. No es lectura inicial
    if (props.isFirstReading) {
        console.log('Es lectura inicial');
        return false;
    }
    // 2. Existe ID de lectura
    if (!props.readingId) {
        console.log('No hay readingId');
        return false;
    }
    // 3. La lectura está en estado 'open'
    if (props.mainReading?.status !== 'open') {
        console.log('Estado no es open:', props.mainReading?.status);
        return false;
    }

    // 4. Todas las unidades tienen lectura válida
    const allUnitsHaveValidReadings = props.units.every(unit => {
        const reading = Number(readings.value[unit.id]);
        const previousReading = Number(props.previousReadings[unit.id]) || 0;
        const isValid = reading && reading > previousReading && !errors.value[unit.id];
        console.log(`Unidad ${unit.id}:`, { reading, previousReading, isValid });
        return isValid;
    });

    console.log('Todas las unidades tienen lecturas válidas:', allUnitsHaveValidReadings);
    return allUnitsHaveValidReadings;
});

const handleClose = async () => {
    if (!canClose.value) return;

    try {
        isSaving.value = true;

        // Asegurar que todas las lecturas son números válidos
        const validatedReadings = {};
        for (const [unitId, reading] of Object.entries(readings.value)) {
            const numReading = Number(reading);
            if (isNaN(numReading)) {
                throw new Error(`Lectura inválida para la unidad ${unitId}`);
            }
            validatedReadings[unitId] = {
                reading: numReading
            };
        }

        await readingService.closeReading(props.readingId);
        router.push('/meter-readings');
    } catch (err) {
        error.value = err.message;
    } finally {
        isSaving.value = false;
    }
};

const validateReading = (unitId) => {
    const reading = Number(readings.value[unitId]);
    const previousReading = props.previousReadings[unitId] || 0;

    errors.value[unitId] = '';

    if (!reading || reading <= 0) {
        errors.value[unitId] = 'La lectura debe ser mayor a 0';
        return false;
    }

    if (!props.isFirstReading && reading <= previousReading) {
        errors.value[unitId] = `La lectura debe ser mayor a ${formatReading(previousReading)}`;
        return false;
    }

    return true;
};

const handleSubmit = async () => {
    if (!canSubmit.value) return;

    try {
        isSaving.value = true;
        emit('submit', readings.value);
    } catch (err) {
        error.value = err.message;
    } finally {
        isSaving.value = false;
    }
};

onMounted(() => {
    if (props.mainReading?.unitReadings) {
        // Extraer solo los valores de lectura del objeto unitReadings
        const formattedReadings = {};
        Object.entries(props.mainReading.unitReadings).forEach(([unitId, data]) => {
            formattedReadings[unitId] = data.reading || data;
        });
        readings.value = formattedReadings;

        console.log('Lecturas cargadas:', readings.value); // Para debug
    }
});
</script>