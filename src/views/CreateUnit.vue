<!-- CreateUnit.vue -->
<template>
    <div class="max-w-2xl mx-auto p-6">
        <div v-if="error" class="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {{ error }}
        </div>

        <div class="mb-8">
            <h1 class="text-2xl font-bold">Crear Unidad</h1>
            <p class="text-gray-600">
                Unidades disponibles: {{ availableUnits }}
            </p>
        </div>

        <form @submit.prevent="createUnit" class="space-y-6">
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">
                        Nombre de la unidad *
                    </label>
                    <input type="text" v-model="name" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Ej: Apartamento 101" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">
                        Nombre del arrendatario *
                    </label>
                    <input type="text" v-model="tenantName" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">
                        Email del arrendatario *
                    </label>
                    <input type="email" v-model="tenantEmail" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">
                        Teléfono del arrendatario *
                    </label>
                    <input type="tel" v-model="tenantPhone" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
            </div>

            <div class="flex justify-end space-x-3">
                <button type="button" @click="$router.back()"
                    class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    Cancelar
                </button>
                <button type="submit" :disabled="!canCreateUnit"
                    class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300">
                    Crear Unidad
                </button>
            </div>
        </form>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

const router = useRouter();
const route = useRoute();
const condoId = route.query.condoId;

const name = ref('');
const tenantName = ref('');
const tenantEmail = ref('');
const tenantPhone = ref('');
const error = ref('');
const currentUnits = ref(0);
const totalUnits = ref(0);

const availableUnits = computed(() => totalUnits.value - currentUnits.value);
const canCreateUnit = computed(() => availableUnits.value > 0);

const checkCondoCapacity = async () => {
    try {
        // Obtener información del condominio
        const condoDoc = await getDoc(doc(db, 'condos', condoId));
        if (!condoDoc.exists()) {
            throw new Error('Condominio no encontrado');
        }
        totalUnits.value = condoDoc.data().numberOfUnits;

        // Contar unidades actuales
        const unitsQuery = query(
            collection(db, 'units'),
            where('condoId', '==', condoId)
        );
        const unitsSnapshot = await getDocs(unitsQuery);
        currentUnits.value = unitsSnapshot.size;

        if (currentUnits.value >= totalUnits.value) {
            error.value = 'Este condominio ya alcanzó su límite de unidades';
            router.push(`/condo/${condoId}`);
        }
    } catch (err) {
        console.error("Error verificando capacidad:", err);
        error.value = err.message;
        router.push('/condos');
    }
};

const createUnit = async () => {
    try {
        if (!canCreateUnit.value) {
            throw new Error('No se pueden crear más unidades en este condominio');
        }

        const unitData = {
            condoId,
            name: name.value.trim(),
            tenant: {
                name: tenantName.value.trim(),
                email: tenantEmail.value.trim(),
                phone: tenantPhone.value.trim()
            },
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await addDoc(collection(db, 'units'), unitData);
        router.push(`/condo/${condoId}`);
    } catch (error) {
        console.error("Error creando la unidad:", error);
        error.value = error.message;
    }
};

// Verificar capacidad al montar el componente
onMounted(async () => {
    if (!condoId) {
        error.value = 'No se especificó el condominio';
        router.push('/condos');
        return;
    }
    await checkCondoCapacity();
});
</script>