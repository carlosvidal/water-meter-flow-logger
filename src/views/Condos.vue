<!-- Condos.vue -->
<template>
    <div class="container mx-auto p-6">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold">Condominios</h1>
            <button v-if="userStore.isSuperAdmin" @click="goToCreatecondo"
                class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Crear condominio
            </button>
        </div>

        <div class="overflow-x-auto">
            <table class="min-w-full bg-white shadow-sm rounded-lg">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nombre</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unidades</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    <tr v-for="condo in condos" :key="condo.id" class="hover:bg-gray-50">
                        <td class="px-6 py-4">
                            <router-link :to="`/condo/${condo.id}`" class="text-blue-600 hover:text-blue-800">
                                {{ condo.name }}
                            </router-link>
                        </td>
                        <td class="px-6 py-4">
                            {{ condo.currentUnits || 0 }} / {{ condo.numberOfUnits }}
                        </td>
                        <td class="px-6 py-4">
                            <span :class="`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${condo.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`">
                                {{ condo.isActive ? 'Activo' : 'Inactivo' }}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';
import { db } from '../firebase';
import { collection, getDocs, query, collectionGroup, where } from 'firebase/firestore';

const router = useRouter();
const userStore = useUserStore();
const condos = ref([]);

const fetchcondos = async () => {
    try {
        // Obtener condominios
        const condosSnapshot = await getDocs(collection(db, 'condos'));
        const condosData = condosSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            currentUnits: 0 // Inicializar contador de unidades
        }));

        // Obtener conteo de unidades para cada condominio
        const unitsQuery = query(collection(db, 'units'));
        const unitsSnapshot = await getDocs(unitsQuery);

        unitsSnapshot.forEach(unitDoc => {
            const unit = unitDoc.data();
            const condo = condosData.find(c => c.id === unit.condoId);
            if (condo) {
                condo.currentUnits = (condo.currentUnits || 0) + 1;
            }
        });

        condos.value = condosData;
    } catch (error) {
        console.error("Error fetching condos:", error);
    }
};

const goToCreatecondo = () => {
    router.push('/create-condo');
};

onMounted(() => {
    fetchcondos();
});
</script>