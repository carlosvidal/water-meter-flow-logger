<!-- src/views/UnitEdit.vue -->
<template>
    <div class="container mx-auto p-6">
        <div v-if="loading" class="text-center py-8">
            <p class="text-gray-600">Cargando...</p>
        </div>

        <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {{ error }}
        </div>

        <div v-else class="space-y-6">
            <!-- Header -->
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-bold text-gray-900">
                    Editar Unidad
                    <span class="ml-2 text-sm text-gray-500">
                        (Condominio: {{ condoName }})
                    </span>
                </h1>
            </div>

            <!-- Formulario de edición -->
            <form @submit.prevent="updateUnit" class="bg-white shadow rounded-lg p-6 space-y-6">
                <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <!-- Información de la unidad -->
                    <div class="space-y-6">
                        <h3 class="text-lg font-medium text-gray-900">Información de la Unidad</h3>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">
                                Nombre de la unidad *
                            </label>
                            <input type="text" v-model="form.name" required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Ej: Apartamento 101" />
                        </div>
                        <div>
                            <label class="flex items-center">
                                <input type="checkbox" v-model="form.isActive"
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
                            <input type="text" v-model="form.tenant.name" required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">
                                Email del arrendatario *
                            </label>
                            <input type="email" v-model="form.tenant.email" required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">
                                Teléfono del arrendatario *
                            </label>
                            <vue-tel-input v-model="form.tenant.phone" @validate="handlePhoneValidation"
                                class="mt-1 dark-mode-phone"></vue-tel-input>
                            <p v-if="!isPhoneValid && form.tenant.phone" class="mt-1 text-sm text-red-600">
                                Por favor ingrese un número válido
                            </p>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 pt-4 border-t">
                    <router-link :to="`/unit/${unitId}`"
                        class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        Cancelar
                    </router-link>
                    <button type="submit" :disabled="!canSubmit || isSubmitting"
                        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
                        {{ isSubmitting ? 'Guardando...' : 'Guardar Cambios' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const route = useRoute();
const router = useRouter();
const unitId = route.params.id;

const loading = ref(true);
const error = ref(null);
const isSubmitting = ref(false);
const isPhoneValid = ref(false);
const condoName = ref('');

const form = reactive({
    name: '',
    isActive: true,
    tenant: {
        name: '',
        email: '',
        phone: ''
    }
});

// Computed property para validar el formulario
const canSubmit = computed(() => {
    return form.name.trim() &&
        form.tenant.name.trim() &&
        form.tenant.email.trim() &&
        form.tenant.phone &&
        isPhoneValid.value;
});

const handlePhoneValidation = ({ isValid }) => {
    isPhoneValid.value = isValid;
};

const fetchUnit = async () => {
    try {
        loading.value = true;
        error.value = null;

        const unitDoc = await getDoc(doc(db, 'units', unitId));
        if (!unitDoc.exists()) {
            throw new Error('Unidad no encontrada');
        }

        const unitData = unitDoc.data();

        // Obtener nombre del condominio
        const condoDoc = await getDoc(doc(db, 'condos', unitData.condoId));
        if (condoDoc.exists()) {
            condoName.value = condoDoc.data().name;
        }

        // Inicializar formulario
        form.name = unitData.name;
        form.isActive = unitData.isActive;
        form.tenant = { ...unitData.tenant };

        // Validar el teléfono inicial
        handlePhoneValidation({ isValid: true });

    } catch (err) {
        console.error('Error fetching unit:', err);
        error.value = err.message;
    } finally {
        loading.value = false;
    }
};

const updateUnit = async () => {
    try {
        if (!canSubmit.value) {
            throw new Error('Por favor complete todos los campos correctamente');
        }

        isSubmitting.value = true;
        error.value = null;

        const updateData = {
            name: form.name.trim(),
            isActive: form.isActive,
            tenant: {
                name: form.tenant.name.trim(),
                email: form.tenant.email.trim(),
                phone: form.tenant.phone
            },
            updatedAt: serverTimestamp()
        };

        await updateDoc(doc(db, 'units', unitId), updateData);
        router.push(`/unit/${unitId}`);

    } catch (err) {
        console.error('Error updating unit:', err);
        error.value = err.message;
    } finally {
        isSubmitting.value = false;
    }
};

onMounted(fetchUnit);
</script>

<style scoped>
/* Estilos base */
.vue-tel-input {
    @apply border-gray-300 rounded-md shadow-sm;
}

/* Dark mode para el componente de teléfono */
.dark .dark-mode-phone {
    @apply bg-gray-700;
}

.dark .vue-tel-input {
    @apply border-gray-600 bg-gray-700;
}

.dark .vue-tel-input input {
    @apply text-white bg-gray-700 !important;
}

.dark .vti__dropdown {
    @apply bg-gray-700 border-gray-600;
}

.dark .vti__dropdown-list {
    @apply bg-gray-800 text-white border-gray-600;
}

.dark .vti__dropdown-item {
    @apply text-white;
}

.dark .vti__dropdown-item:hover {
    @apply bg-gray-600;
}

.dark .vti__dropdown-item.highlighted {
    @apply bg-gray-600;
}

.dark .vti__dropdown-item.selected {
    @apply bg-gray-500;
}
</style>