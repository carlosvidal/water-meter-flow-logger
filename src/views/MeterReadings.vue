<!-- src/views/MeterReadings.vue -->
<template>
    <div class="container mx-auto p-6">
        <!-- Componente de debug -->
        <AuthDebug />

        <!-- Error de permisos -->
        <div v-if="!canManageReadings"
            class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            No tienes los permisos necesarios para gestionar lecturas.
            Tu rol actual es: {{ userStore.userData?.baseRole || 'No definido' }}
        </div>

        <!-- Header con título y botón -->
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold">Lecturas de Medidores</h1>
            <button v-if="canManageReadings" @click="goToCreateReading"
                class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                Registrar Lectura
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

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
            <p class="text-gray-600">Cargando lecturas...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {{ error }}
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredReadings.length === 0" class="text-center py-8">
            <p class="text-gray-600">No hay lecturas registradas</p>
        </div>

        <!-- Readings Table -->
        <div v-else class="bg-white shadow overflow-hidden rounded-lg">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th scope="col"
                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                        </th>
                        <th scope="col"
                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Condominio
                        </th>
                        <th scope="col"
                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Lectura
                        </th>
                        <th scope="col"
                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Costo
                        </th>
                        <th scope="col"
                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                        </th>
                        <th scope="col"
                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                        </th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="reading in filteredReadings" :key="reading.id" class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {{ formatDate(reading.date) }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {{ condos.find(c => c.id === reading.condoId)?.name || 'Cargando...' }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {{ reading.reading ? `${reading.reading} m³` : '-' }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {{ reading.cost ? formatCurrency(reading.cost) : '-' }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span
                                :class="`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                                ${reading.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`">
                                {{ reading.status === 'open' ? 'Abierta' : 'Cerrada' }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <router-link v-if="reading.status === 'open'" :to="`/reading/${reading.id}/edit`"
                                class="text-blue-600 hover:text-blue-900">
                                Continuar
                            </router-link>
                            <router-link v-else :to="`/reading/${reading.id}`"
                                class="text-gray-600 hover:text-gray-900">
                                Ver detalles
                            </router-link>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';
import AuthDebug from '../components/AuthDebug.vue';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const readings = ref([]);
const condos = ref([]);
const selectedCondoId = ref('');
const loading = ref(false);
const error = ref(null);

const router = useRouter();
const userStore = useUserStore();

// Computed property para verificar permisos
const canManageReadings = computed(() => {
    const role = userStore.userData?.baseRole;
    return role === 'superadmin' || role === 'admin' || role === 'editor';
});

// Computed property para filtrar lecturas por condominio
const filteredReadings = computed(() => {
    if (!selectedCondoId.value) return readings.value;
    return readings.value.filter(reading => reading.condoId === selectedCondoId.value);
});

// Formatear fecha
const formatDate = (dateStr) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('es-ES', options);
};

// Formatear moneda
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(amount);
};

// Cargar condominios
const fetchCondos = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'condos'));
        condos.value = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (err) {
        console.error('Error loading condos:', err);
        error.value = 'Error al cargar los condominios';
    }
};

// Cargar lecturas
const fetchReadings = async () => {
    try {
        loading.value = true;
        error.value = null;

        const q = query(
            collection(db, 'meter-readings'),
            orderBy('date', 'desc')
        );
        const querySnapshot = await getDocs(q);
        readings.value = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Cargar información de condominios
        await fetchCondos();
    } catch (err) {
        console.error('Error fetching readings:', err);
        error.value = 'Error al cargar las lecturas';
    } finally {
        loading.value = false;
    }
};

const goToCreateReading = () => {
    if (!canManageReadings.value) {
        error.value = 'No tienes permisos para crear lecturas';
        return;
    }
    router.push('/create-reading');
};

onMounted(() => {
    fetchReadings();
});
</script>