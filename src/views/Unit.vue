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
                    <button @click="toggleEdit"
                        class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        {{ isEditing ? 'Cancelar' : 'Editar' }}
                    </button>
                </div>
            </div>

            <!-- Formulario de edición -->
            <form v-if="isEditing" @submit.prevent="updateUnit" class="bg-white shadow rounded-lg p-6 space-y-6">
                <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <!-- Información de la unidad -->
                    <div class="space-y-6">
                        <h3 class="text-lg font-medium text-gray-900">Información de la Unidad</h3>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">
                                Nombre de la unidad *
                            </label>
                            <input type="text" v-model="editForm.name" required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label class="flex items-center">
                                <input type="checkbox" v-model="editForm.isActive"
                                    class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                                <span class="ml-2 text-sm text-gray-600">Unidad Activa</span>
                            </label>
                        </div>
                    </div>

                    <!-- Información del arrendatario -->
                    <div class="space-y-6">
                        <h3 class="text-lg font-medium text-gray-900">Información del Arrendatario</h3>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">
                                Nombre del arrendatario *
                            </label>
                            <input type="text" v-model="editForm.tenant.name" required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">
                                Email del arrendatario *
                            </label>
                            <input type="email" v-model="editForm.tenant.email" required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">
                                Teléfono del arrendatario *
                            </label>
                            <input type="tel" v-model="editForm.tenant.phone" required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" @click="toggleEdit"
                        class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        Cancelar
                    </button>
                    <button type="submit" :disabled="isSubmitting"
                        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
                        {{ isSubmitting ? 'Guardando...' : 'Guardar Cambios' }}
                    </button>
                </div>
            </form>

            <!-- Vista de detalles -->
            <div v-else class="bg-white shadow rounded-lg divide-y divide-gray-200">
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
                                <span :class="`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${unit.isActive
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
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
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const route = useRoute();
const router = useRouter();
const unitId = route.params.id;

const unit = ref(null);
const condoName = ref('');
const loading = ref(true);
const error = ref(null);
const isEditing = ref(false);
const isSubmitting = ref(false);

const editForm = reactive({
    name: '',
    isActive: true,
    tenant: {
        name: '',
        email: '',
        phone: ''
    }
});

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

        // Inicializar formulario de edición
        editForm.name = unit.value.name;
        editForm.isActive = unit.value.isActive;
        editForm.tenant = { ...unit.value.tenant };

    } catch (err) {
        console.error('Error fetching unit:', err);
        error.value = err.message;
    } finally {
        loading.value = false;
    }
};

const toggleEdit = () => {
    if (isEditing.value) {
        // Restaurar valores originales al cancelar
        editForm.name = unit.value.name;
        editForm.isActive = unit.value.isActive;
        editForm.tenant = { ...unit.value.tenant };
    }
    isEditing.value = !isEditing.value;
};

const updateUnit = async () => {
    try {
        isSubmitting.value = true;
        error.value = null;

        // Validaciones básicas
        if (!editForm.name.trim()) {
            throw new Error('El nombre de la unidad es requerido');
        }
        if (!editForm.tenant.name.trim()) {
            throw new Error('El nombre del arrendatario es requerido');
        }
        if (!editForm.tenant.email.trim()) {
            throw new Error('El email del arrendatario es requerido');
        }
        if (!editForm.tenant.phone.trim()) {
            throw new Error('El teléfono del arrendatario es requerido');
        }

        const updateData = {
            name: editForm.name.trim(),
            isActive: editForm.isActive,
            tenant: {
                name: editForm.tenant.name.trim(),
                email: editForm.tenant.email.trim(),
                phone: editForm.tenant.phone.trim()
            },
            updatedAt: serverTimestamp()
        };

        await updateDoc(doc(db, 'units', unitId), updateData);

        // Actualizar datos locales
        unit.value = { ...unit.value, ...updateData };
        isEditing.value = false;

    } catch (err) {
        console.error('Error updating unit:', err);
        error.value = err.message;
    } finally {
        isSubmitting.value = false;
    }
};

onMounted(fetchUnit);
</script>