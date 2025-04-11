<template>
    <div class="max-w-2xl mx-auto p-6">
        <!-- Mostrar mensaje si no es superadmin -->
        <div v-if="!userStore.isSuperAdmin" class="text-center py-8">
            <h2 class="text-xl font-semibold text-gray-900">Acceso Restringido</h2>
            <p class="mt-2 text-gray-600">Solo los super administradores pueden crear nuevos condominios.</p>
        </div>

        <div v-else>
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-gray-900">Crear Condominio</h1>
                <p class="mt-1 text-sm text-gray-600">Ingrese los datos del nuevo condominio</p>
            </div>

            <div v-if="error" class="mb-4 p-4 bg-red-50 border border-red-400 text-red-700 rounded">
                {{ error }}
            </div>

            <form @submit.prevent="createCondo" class="space-y-6">
                <!-- Información básica -->
                <div class="bg-white shadow rounded-lg p-6">
                    <h2 class="text-lg font-medium text-gray-900 mb-4">Información Básica</h2>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">
                                Nombre del Condominio *
                            </label>
                            <input type="text" v-model="formData.name" required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Ej: Residencial Los Pinos" />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700">
                                Número de Unidades *
                            </label>
                            <input type="number" v-model="formData.numberOfUnits" required min="1"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Ej: 20" />
                        </div>
                    </div>
                </div>

                <!-- Dirección y Localización -->
                <div class="bg-white shadow rounded-lg p-6">
                    <h2 class="text-lg font-medium text-gray-900 mb-4">Dirección y Localización</h2>
                    <AddressInput v-model="formData.address" />
                </div>

                <!-- Configuración -->
                <div class="bg-white shadow rounded-lg p-6">
                    <h2 class="text-lg font-medium text-gray-900 mb-4">Configuración</h2>
                    <div>
                        <label class="flex items-center">
                            <input type="checkbox" v-model="formData.isActive"
                                class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                            <span class="ml-2 text-sm text-gray-600">Condominio Activo</span>
                        </label>
                    </div>
                </div>

                <!-- Botones de acción -->
                <div class="flex justify-end space-x-3">
                    <button type="button" @click="router.push('/condos')"
                        class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        Cancelar
                    </button>
                    <button type="submit" :disabled="isSubmitting"
                        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
                        {{ isSubmitting ? 'Guardando...' : 'Crear Condominio' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useUserStore } from '../store/user';
import AddressInput from '@/components/AddressInput.vue';

const router = useRouter();
const userStore = useUserStore();
const error = ref('');
const isSubmitting = ref(false);

const formData = ref({
    name: '',
    numberOfUnits: null,
    isActive: true,
    address: {
        country: '',
        state: '',
        city: '',
        street: '',
        postalCode: '',
        timezone: '',
        currency: '',
        language: ''
    }
});

// Validación de permisos al montar el componente
onMounted(() => {
    if (!userStore.isSuperAdmin) {
        router.push('/');
    }
});

const createCondo = async () => {
    if (!userStore.isSuperAdmin) {
        error.value = 'No tiene permisos para crear condominios';
        return;
    }

    // Validaciones básicas
    if (!formData.value.name.trim()) {
        error.value = 'El nombre del condominio es requerido';
        return;
    }

    if (!formData.value.numberOfUnits || formData.value.numberOfUnits < 1) {
        error.value = 'El número de unidades debe ser mayor a 0';
        return;
    }

    if (!formData.value.address.country || !formData.value.address.city || !formData.value.address.street) {
        error.value = 'La dirección es requerida';
        return;
    }

    try {
        isSubmitting.value = true;
        error.value = '';

        const condoData = {
            name: formData.value.name.trim(),
            numberOfUnits: parseInt(formData.value.numberOfUnits),
            isActive: formData.value.isActive,
            address: formData.value.address,
            adminId: userStore.currentUser?.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await addDoc(collection(db, 'condos'), condoData);
        router.push('/condos');
    } catch (err) {
        console.error("Error creando el condominio:", err);
        error.value = 'Ocurrió un error al crear el condominio. Por favor intente nuevamente.';
    } finally {
        isSubmitting.value = false;
    }
};
</script>