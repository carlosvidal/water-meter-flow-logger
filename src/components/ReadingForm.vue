<!-- src/components/ReadingForm.vue -->
<template>
    <div class="max-w-2xl mx-auto p-6">
        <h1 class="text-2xl font-bold mb-6">{{ isEdit ? 'Editar Lectura' : 'Nueva Lectura' }}</h1>

        <form @submit.prevent="handleSubmit" class="space-y-6 bg-white shadow rounded-lg p-6">
            <!-- Selector de Condominio -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Condominio *</label>
                <select v-model="form.condoId" required @change="handleCondoChange"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option value="">Seleccione un condominio</option>
                    <option v-for="condo in condos" :key="condo.id" :value="condo.id">{{ condo.name }}</option>
                </select>
            </div>

            <!-- Fecha de Lectura -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Lectura *</label>
                <input type="date" v-model="form.date" required
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </div>

            <!-- Campos adicionales si no es primera lectura -->
            <template v-if="!isFirstReading">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Lectura Principal (m³) *</label>
                    <input type="number" v-model="form.reading" required min="0" step="0.001"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="0.000" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Costo Total *</label>
                    <input type="number" v-model="form.cost" required min="0" step="0.01"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="0.00" />
                </div>
            </template>

            <!-- Mensaje para primera lectura -->
            <div v-else class="bg-blue-50 p-4 rounded-md text-sm text-blue-700">
                Esta será la lectura base del condominio. Solo necesita registrar la fecha y las lecturas iniciales de
                cada unidad.
            </div>

            <!-- Botones -->
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" @click="$router.back()"
                    class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    Cancelar
                </button>
                <button type="submit" :disabled="isSaving"
                    class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
                    {{ isSaving ? 'Guardando...' : 'Continuar' }}
                </button>
            </div>
        </form>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'; // Añadimos computed
import { useRouter } from 'vue-router'; // Añadimos useRouter ya que lo usamos en handleClose
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { readingService } from '../services/readingService';

const router = useRouter();
const props = defineProps({
    readingId: String,
    isEdit: Boolean,
    mainReading: Object
});

const emit = defineEmits(['submit']);

const condos = ref([]);
const isFirstReading = ref(false);
const isSaving = ref(false);
const error = ref('');

const form = ref({
    condoId: props.mainReading?.condoId || '',
    date: props.mainReading?.date || new Date().toISOString().slice(0, 10),
    reading: props.mainReading?.reading || null,
    cost: props.mainReading?.cost || null
});

// Computed property para habilitar/deshabilitar el botón de cerrar
const canClose = computed(() => {
    return props.readingId &&
        form.value.reading &&
        form.value.cost &&
        props.mainReading?.unitReadings &&
        Object.keys(props.mainReading.unitReadings || {}).length > 0;
});

const loadCondos = async () => {
    const snapshot = await getDocs(collection(db, 'condos'));
    condos.value = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(condo => condo.isActive);
};

const handleCondoChange = async () => {
    if (!form.value.condoId) return;
    isFirstReading.value = await readingService.isFirstReading(form.value.condoId);
};

const handleSubmit = async () => {
    try {
        isSaving.value = true;
        emit('submit', {
            ...form.value,
            isFirstReading: isFirstReading.value
        });
    } catch (err) {
        error.value = err.message;
    } finally {
        isSaving.value = false;
    }
};

const handleClose = async () => {
    if (!canClose.value) return;

    try {
        isSaving.value = true;
        await readingService.closeReading(props.readingId);
        router.push('/meter-readings');
    } catch (err) {
        error.value = err.message;
    } finally {
        isSaving.value = false;
    }
};

onMounted(async () => {
    console.log('MainReading recibido:', props.mainReading); // Para debug

    await loadCondos();

    if (props.mainReading) {
        // Aseguramos que los valores numéricos sean números
        form.value = {
            condoId: props.mainReading.condoId,
            date: props.mainReading.date,
            reading: Number(props.mainReading.reading) || null,
            cost: Number(props.mainReading.cost) || null
        };

        console.log('Formulario inicializado:', form.value); // Para debug
        await handleCondoChange();
    }
});

watch(() => props.mainReading, (newValue) => {
    if (newValue) {
        form.value = {
            condoId: newValue.condoId,
            date: newValue.date,
            reading: Number(newValue.reading) || null,
            cost: Number(newValue.cost) || null
        };
    }
}, { immediate: true });
</script>