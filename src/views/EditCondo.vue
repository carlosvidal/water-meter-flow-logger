<template>
    <div class="max-w-2xl mx-auto p-6">
        <!-- Mostrar mensaje si no es superadmin -->
        <div v-if="!userStore.isSuperAdmin" class="text-center py-8">
            <h2 class="text-xl font-semibold text-gray-900">Acceso Restringido</h2>
            <p class="mt-2 text-gray-600">Solo los super administradores pueden editar condominios.</p>
        </div>

        <div v-else>
            <!-- Loading state -->
            <div v-if="loading" class="text-center py-8">
                <p class="text-gray-600">Cargando información del condominio...</p>
            </div>

            <!-- Error state -->
            <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {{ error }}
            </div>

            <!-- Edit form -->
            <div v-else class="space-y-6">
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">Editar Condominio</h1>
                        <p class="mt-1 text-sm text-gray-600">Actualice la información del condominio</p>
                    </div>
                    <div class="flex items-center space-x-3">
                        <router-link :to="`/condo/${condoId}`"
                            class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            Cancelar
                        </router-link>
                    </div>
                </div>

                <form @submit.prevent="updateCondo" class="space-y-6">
                    <!-- Información básica -->
                    <div class="bg-white shadow rounded-lg p-6">
                        <h2 class="text-lg font-medium text-gray-900 mb-4">Información Básica</h2>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">
                                    Nombre del Condominio *
                                </label>
                                <input type="text" v-model="condo.name" required
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="Ej: Residencial Los Pinos" />
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700">
                                    Número de Unidades *
                                </label>
                                <input type="number" v-model="condo.numberOfUnits" required min="1"
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="Ej: 20" />
                                <p class="mt-1 text-sm text-gray-500">
                                    Unidades actuales: {{ currentUnits }} de {{ condo.numberOfUnits }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Dirección y Localización -->
                    <div class="bg-white shadow rounded-lg p-6">
                        <h2 class="text-lg font-medium text-gray-900 mb-4">Dirección y Localización</h2>
                        <AddressInput v-model="condo.address" />
                    </div>

                    <!-- Configuración -->
                    <div class="bg-white shadow rounded-lg p-6">
                        <h2 class="text-lg font-medium text-gray-900 mb-4">Configuración</h2>
                        <div>
                            <label class="flex items-center">
                                <input type="checkbox" v-model="condo.isActive"
                                    class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                                <span class="ml-2 text-sm text-gray-600">Condominio Activo</span>
                            </label>
                        </div>
                    </div>

                    <!-- Información adicional -->
                    <div class="bg-white shadow rounded-lg p-6">
                        <h2 class="text-lg font-medium text-gray-900 mb-4">Información Adicional</h2>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-sm text-gray-600">Creado:</p>
                                <p class="font-medium">{{ formatDate(condo.createdAt) }}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">Última actualización:</p>
                                <p class="font-medium">{{ formatDate(condo.updatedAt) }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Botones de acción -->
                    <div class="flex justify-end space-x-3 pt-6">
                        <button type="button" @click="router.push(`/condo/${condoId}`)"
                            class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="submit" :disabled="isSubmitting"
                            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
                            {{ isSubmitting ? 'Guardando...' : 'Guardar Cambios' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '../store/user';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import AddressInput from '../components/AddressInput.vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const condoId = route.params.id;

const loading = ref(true);
const error = ref('');
const isSubmitting = ref(false);
const currentUnits = ref(0);

const condo = ref(null);

// Cargar datos del condominio
const loadCondo = async () => {
    try {
        loading.value = true;
        error.value = null;

        const docRef = doc(db, 'condos', condoId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // Asignamos primero el ID y luego los datos
            condo.value = {
                id: docSnap.id,
                ...docSnap.data()
            };
            console.log('Condo loaded:', condo.value);

            // Cargar unidades después
            const unitsQuery = query(
                collection(db, 'units'),
                where('condoId', '==', condoId)
            );
            const unitsSnapshot = await getDocs(unitsQuery);
            currentUnits.value = unitsSnapshot.size;
        } else {
            throw new Error('Condominio no encontrado');
        }
    } catch (err) {
        console.error('Error loading condo:', err);
        error.value = err.message;
    } finally {
        loading.value = false;
    }
};
// Actualizar condominio
const updateCondo = async () => {
    try {
        if (!condo.value?.name.trim()) {
            throw new Error('El nombre del condominio es requerido');
        }

        isSubmitting.value = true;

        const updateData = {
            name: condo.value.name.trim(),
            numberOfUnits: parseInt(condo.value.numberOfUnits),
            isActive: condo.value.isActive,
            address: condo.value.address,
            updatedAt: serverTimestamp()
        };

        await updateDoc(doc(db, 'condos', condoId), updateData);
        router.push(`/condo/${condoId}`);

    } catch (err) {
        console.error('Error actualizando condominio:', err);
        error.value = err.message;
    } finally {
        isSubmitting.value = false;
    }
};

// Formatear fecha
const formatDate = (date) => {
    if (!date || !(date instanceof Date)) return 'N/A';
    return new Date(date).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Cargar datos al montar el componente
onMounted(async () => {
    if (!userStore.isSuperAdmin) {
        router.push('/');
        return;
    }
    try {
        await loadCondo();
    } catch (err) {
        console.error('Error en mounted:', err);
        error.value = err.message;
    }
});
</script>