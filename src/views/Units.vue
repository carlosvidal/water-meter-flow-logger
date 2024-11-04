<template>
    <div class="container mx-auto p-6">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold">Unidades</h1>
            <button @click="goToCreateUnit"
                class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Crear unidad
            </button>
        </div>

        <!-- Filtro por condominio -->
        <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Filtrar por condominio</label>
            <select v-model="selectedCondoId"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <option value="">Todos los condominios</option>
                <option v-for="condo in condos" :key="condo.id" :value="condo.id">
                    {{ condo.name }}
                </option>
            </select>
        </div>

        <div class="bg-white shadow-sm rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Unidad
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Condominio
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Arrendatario
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Teléfono
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-for="unit in filteredUnits" :key="unit.id" class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <router-link :to="`/unit/${unit.id}`"
                                    class="text-blue-600 hover:text-blue-800 font-medium">
                                    {{ unit.name }}
                                </router-link>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {{ getCondoName(unit.condoId) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                {{ unit.tenant.name }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <a :href="`mailto:${unit.tenant.email}`" class="text-gray-600 hover:text-gray-800">
                                    {{ unit.tenant.email }}
                                </a>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <a :href="`tel:${unit.tenant.phone}`" class="text-gray-600 hover:text-gray-800">
                                    {{ unit.tenant.phone }}
                                </a>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span :class="`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${unit.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`">
                                    {{ unit.isActive ? 'Activo' : 'Inactivo' }}
                                </span>
                            </td>
                        </tr>
                        <tr v-if="filteredUnits.length === 0">
                            <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                                No se encontraron unidades
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const router = useRouter();
const units = ref([]);
const condos = ref([]);
const selectedCondoId = ref('');

// Computed property para filtrar unidades
const filteredUnits = computed(() => {
    if (!selectedCondoId.value) return units.value;
    return units.value.filter(unit => unit.condoId === selectedCondoId.value);
});

const fetchCondos = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'condos'));
        condos.value = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error loading condos:', error);
    }
};

const fetchUnits = async () => {
    try {
        const unitsSnapshot = await getDocs(collection(db, 'units'));
        units.value = unitsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).sort((a, b) => a.name.localeCompare(b.name)); // Ordenar por nombre
    } catch (error) {
        console.error('Error loading units:', error);
    }
};

const getCondoName = (condoId) => {
    const condo = condos.value.find(c => c.id === condoId);
    return condo ? condo.name : 'No asignado';
};

const goToCreateUnit = () => {
    if (selectedCondoId.value) {
        router.push({
            path: '/create-unit',
            query: { condoId: selectedCondoId.value }
        });
    } else {
        router.push('/create-unit');
    }
};

onMounted(async () => {
    await Promise.all([fetchCondos(), fetchUnits()]);
});
</script>