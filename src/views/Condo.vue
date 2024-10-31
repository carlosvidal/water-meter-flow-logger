<!-- Condo.vue -->
<template>
    <div class="container mx-auto p-6">
        <div v-if="condo" class="space-y-6">
            <!-- Header -->
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-bold">{{ condo.name }}</h1>
                    <p class="text-gray-600">
                        Unidades: {{ units.length }} / {{ condo.numberOfUnits }}
                    </p>
                </div>
                <div class="flex items-center space-x-4">
                    <label class="flex items-center space-x-2">
                        <span>Activo:</span>
                        <input type="checkbox" v-model="isActive"
                            class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                    </label>
                    <button @click="updateCondo" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        Actualizar
                    </button>
                </div>
            </div>

            <!-- Lista de unidades -->
            <!-- Lista de unidades -->
            <div class="bg-white shadow rounded-lg overflow-hidden">
                <div class="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <h2 class="text-lg font-medium">Unidades</h2>
                    <span class="text-sm text-gray-500">Total: {{ units.length }} / {{ condo.numberOfUnits }}</span>
                </div>
                <div class="border-t border-gray-200">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Unidad
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Arrendatario
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Teléfono
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr v-for="unit in units" :key="unit.id" class="hover:bg-gray-50">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <router-link :to="`/unit/${unit.id}`"
                                            class="text-blue-600 hover:text-blue-800 font-medium">
                                            {{ unit.name }}
                                        </router-link>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        {{ unit.tenant.name }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <a :href="`mailto:${unit.tenant.email}`"
                                            class="text-gray-600 hover:text-gray-800">
                                            {{ unit.tenant.email }}
                                        </a>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <a :href="`tel:${unit.tenant.phone}`" class="text-gray-600 hover:text-gray-800">
                                            {{ unit.tenant.phone }}
                                        </a>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span :class="`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${unit.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`">
                                            {{ unit.isActive ? 'Activo' : 'Inactivo' }}
                                        </span>
                                    </td>
                                </tr>
                                <tr v-if="units.length === 0">
                                    <td colspan="5" class="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                                        No hay unidades registradas
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Botón FAB -->
            <button v-if="canAddUnits" @click="goToCreateUnit"
                class="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <span class="text-2xl">+</span>
            </button>
        </div>
        <div v-else class="text-center py-8">
            <p>Cargando...</p>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

const route = useRoute();
const router = useRouter();
const condoId = route.params.id;
const condo = ref(null);
const units = ref([]);
const isActive = ref(false);

// Computed property para controlar si se pueden añadir más unidades
const canAddUnits = computed(() => {
    return condo.value && units.value.length < condo.value.numberOfUnits;
});

const fetchCondo = async () => {
    try {
        const docRef = doc(db, 'condos', condoId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            condo.value = { id: docSnap.id, ...docSnap.data() };
            isActive.value = condo.value.isActive;
            await fetchUnits();
        } else {
            console.log("No se encontró el condominio.");
        }
    } catch (error) {
        console.error("Error fetching condo:", error);
    }
};

const fetchUnits = async () => {
    try {
        const unitsQuery = query(
            collection(db, 'units'),
            where('condoId', '==', condoId)
        );
        const querySnapshot = await getDocs(unitsQuery);
        units.value = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching units:", error);
    }
};

const updateCondo = async () => {
    try {
        const docRef = doc(db, 'condos', condoId);
        await updateDoc(docRef, {
            isActive: isActive.value,
            updatedAt: new Date()
        });
        alert("Condominio actualizado");
    } catch (error) {
        console.error("Error updating condo:", error);
        alert("Error al actualizar el condominio");
    }
};

const goToCreateUnit = () => {
    router.push({
        path: '/create-unit',
        query: { condoId: condoId }
    });
};

onMounted(() => {
    fetchCondo();
});
</script>