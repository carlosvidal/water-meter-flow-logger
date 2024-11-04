<!-- src/views/Unit.vue -->
<template>
    <div class="container mx-auto p-6">
        <div v-if="loading" class="text-center py-8">
            <p class="text-gray-600">Cargando...</p>
        </div>

        <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {{ error }}
        </div>

        <div v-else-if="unit" class="space-y-6">
            <!-- Header -->
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">
                        {{ unit.name }}
                        <span class="ml-2 text-sm text-gray-500">
                            (Condominio: {{ condoName }})
                        </span>
                    </h1>
                </div>
                <div class="flex items-center space-x-3">
                    <router-link :to="`/unit/${unitId}/edit`"
                        class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        Editar
                    </router-link>
                </div>
            </div>

            <!-- Vista de detalles -->
            <div class="bg-white shadow rounded-lg divide-y divide-gray-200">
                <!-- Información de la unidad -->
                <div class="px-6 py-5">
                    <h3 class="text-lg font-medium text-gray-900">Información de la Unidad</h3>
                    <dl class="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Nombre</dt>
                            <dd class="mt-1 text-sm text-gray-900">{{ unit.name }}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Estado</dt>
                            <dd class="mt-1">
                                <span :class="`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${unit.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`">
                                    {{ unit.isActive ? 'Activo' : 'Inactivo' }}
                                </span>
                            </dd>
                        </div>
                    </dl>
                </div>

                <!-- Información del arrendatario -->
                <div class="px-6 py-5">
                    <h3 class="text-lg font-medium text-gray-900">Información del Arrendatario</h3>
                    <dl class="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Nombre</dt>
                            <dd class="mt-1 text-sm text-gray-900">{{ unit.tenant.name }}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Email</dt>
                            <dd class="mt-1 text-sm text-gray-900">
                                <a :href="`mailto:${unit.tenant.email}`" class="text-blue-600 hover:text-blue-800">
                                    {{ unit.tenant.email }}
                                </a>
                            </dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Teléfono</dt>
                            <dd class="mt-1 text-sm text-gray-900">
                                <a :href="`tel:${unit.tenant.phone}`" class="text-blue-600 hover:text-blue-800">
                                    {{ unit.tenant.phone }}
                                </a>
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>

        <div v-else class="text-center py-8">
            <p class="text-gray-600">No se encontró la unidad solicitada</p>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const route = useRoute();
const unitId = route.params.id;

const unit = ref(null);
const condoName = ref('');
const loading = ref(true);
const error = ref(null);

const fetchUnit = async () => {
    try {
        loading.value = true;
        error.value = null;

        const unitDoc = await getDoc(doc(db, 'units', unitId));
        if (!unitDoc.exists()) {
            throw new Error('Unidad no encontrada');
        }

        unit.value = { id: unitDoc.id, ...unitDoc.data() };

        // Obtener nombre del condominio
        const condoDoc = await getDoc(doc(db, 'condos', unit.value.condoId));
        if (condoDoc.exists()) {
            condoName.value = condoDoc.data().name;
        }

    } catch (err) {
        console.error('Error fetching unit:', err);
        error.value = err.message;
    } finally {
        loading.value = false;
    }
};

onMounted(fetchUnit);
</script>