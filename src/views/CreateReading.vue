<!-- src/views/CreateMainReading.vue -->
<template>
    <div class="max-w-2xl mx-auto p-6">
        <h1 class="text-2xl font-bold mb-6">Crear Lectura de Medidor Principal</h1>

        <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {{ error }}
        </div>

        <form @submit.prevent="saveMainReading" class="space-y-6 bg-white shadow rounded-lg p-6">
            <!-- Selector de Condominio -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                    Condominio *
                </label>
                <select v-model="formData.condoId" required
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option value="">Seleccione un condominio</option>
                    <option v-for="condo in condos" :key="condo.id" :value="condo.id">
                        {{ condo.name }}
                    </option>
                </select>
            </div>

            <!-- Fecha de Lectura -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Lectura *
                </label>
                <input type="date" v-model="formData.date" required
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </div>

            <!-- Lectura -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                    Lectura (m³) *
                </label>
                <input type="number" v-model="formData.reading" required min="0" step="0.001"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="0.000" />
            </div>

            <!-- Costo Total -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                    Costo Total *
                </label>
                <input type="number" v-model="formData.cost" required min="0" step="0.01"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="0.00" />
            </div>

            <!-- Botones -->
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" @click="$router.back()"
                    class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    Cancelar
                </button>
                <button type="submit" :disabled="isSaving"
                    class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
                    {{ isSaving ? 'Guardando...' : 'Continuar con Lecturas Individuales' }}
                </button>
            </div>
        </form>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const router = useRouter();
const condos = ref([]);
const error = ref('');
const isSaving = ref(false);

const formData = ref({
    condoId: '',
    date: new Date().toISOString().slice(0, 10),
    reading: null,
    cost: null
});

// Cargar condominios
const loadCondos = async () => {
    const snapshot = await getDocs(collection(db, 'condos'));
    condos.value = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(condo => condo.isActive);
};

// Guardar lectura principal
const saveMainReading = async () => {
    try {
        isSaving.value = true;
        error.value = '';

        // Crear documento de lectura
        const readingDoc = {
            ...formData.value,
            reading: Number(formData.value.reading),
            cost: Number(formData.value.cost),
            status: 'open',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        // Guardar en Firestore
        const docRef = await addDoc(collection(db, 'meter-readings'), readingDoc);

        // Redirigir a la página de lecturas individuales
        router.push(`/readings/${docRef.id}/units`);

    } catch (err) {
        error.value = err.message;
        console.error('Error al guardar:', err);
    } finally {
        isSaving.value = false;
    }
};

onMounted(loadCondos);
</script>