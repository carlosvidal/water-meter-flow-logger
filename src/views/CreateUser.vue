<template>
    <div class="max-w-2xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Crear Usuario</h1>
            <p class="mt-1 text-sm text-gray-600">
                Registrar un nuevo usuario en el sistema
            </p>
        </div>

        <!-- Error message -->
        <div v-if="error" class="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {{ error }}
        </div>

        <!-- Success message -->
        <div v-if="successMessage" class="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {{ successMessage }}
        </div>

        <!-- Form -->
        <form @submit.prevent="createUser" class="bg-white shadow-md rounded-lg p-6 space-y-6">
            <div class="space-y-4">
                <!-- Nombre -->
                <div>
                    <label class="block text-sm font-medium text-gray-700">
                        Nombre *
                    </label>
                    <input type="text" v-model="form.name" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Nombre completo" />
                </div>

                <!-- Email -->
                <div>
                    <label class="block text-sm font-medium text-gray-700">
                        Email *
                    </label>
                    <input type="email" v-model="form.email" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="ejemplo@correo.com" />
                </div>

                <!-- Teléfono -->
                <div>
                    <label class="block text-sm font-medium text-gray-700">
                        Teléfono *
                    </label>
                    <vue-tel-input v-model="form.phone" @validate="validatePhone" class="mt-1 dark-mode-phone"
                        required />
                    <p v-if="!isPhoneValid && form.phone" class="mt-1 text-sm text-red-600">
                        Por favor ingrese un número válido
                    </p>
                </div>

                <!-- Rol -->
                <div>
                    <label class="block text-sm font-medium text-gray-700">
                        Rol del Usuario *
                    </label>
                    <select v-model="form.baseRole" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="" disabled>Seleccione un rol</option>
                        <option v-for="role in availableRoles" :key="role.value" :value="role.value">
                            {{ role.label }}
                        </option>
                    </select>
                </div>

                <!-- Estado -->
                <div class="flex items-center space-x-2">
                    <label class="text-sm font-medium text-gray-700">Estado de la cuenta:</label>
                    <label class="inline-flex items-center">
                        <input type="checkbox" v-model="form.isActive"
                            class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                        <span class="ml-2 text-sm text-gray-900">Activo</span>
                    </label>
                </div>
            </div>

            <!-- Botones -->
            <div class="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" @click="router.back()"
                    class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    Cancelar
                </button>
                <button type="submit" :disabled="!canSubmit || isSubmitting"
                    class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">
                    {{ isSubmitting ? 'Creando...' : 'Crear Usuario' }}
                </button>
            </div>
        </form>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';
import { db, auth } from '../firebase';
import { collection, setDoc, doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const router = useRouter();
const userStore = useUserStore();

const form = ref({
    name: '',
    email: '',
    phone: '',
    baseRole: '',
    isActive: true
});

const error = ref('');
const successMessage = ref('');
const isSubmitting = ref(false);
const isPhoneValid = ref(false);

// Roles disponibles según el rol del usuario actual
const availableRoles = computed(() => {
    if (userStore.isSuperAdmin) {
        return [
            { value: 'superadmin', label: 'Super Admin' },
            { value: 'admin', label: 'Administrador' },
            { value: 'editor', label: 'Editor' },
            { value: 'analyst', label: 'Analista' },
            { value: 'tenant', label: 'Inquilino' }
        ];
    } else if (userStore.isAdmin) {
        return [
            { value: 'editor', label: 'Editor' },
            { value: 'analyst', label: 'Analista' },
            { value: 'tenant', label: 'Inquilino' }
        ];
    }
    return [];
});

const canSubmit = computed(() => {
    return form.value.name.trim() &&
        form.value.email.trim() &&
        form.value.phone &&
        form.value.baseRole &&
        isPhoneValid.value;
});

const validatePhone = ({ isValid }) => {
    isPhoneValid.value = isValid;
};

const createUser = async () => {
    if (!canSubmit.value) return;

    try {
        isSubmitting.value = true;
        error.value = '';
        successMessage.value = '';

        // Generar contraseña aleatoria
        const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

        // Crear usuario en Authentication
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            form.value.email,
            password
        );

        // Crear documento en Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            name: form.value.name.trim(),
            email: form.value.email.trim(),
            phone: form.value.phone,
            baseRole: form.value.baseRole,
            isActive: form.value.isActive,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        successMessage.value = `Usuario creado exitosamente. Contraseña temporal: ${password}`;

        // Limpiar formulario
        form.value = {
            name: '',
            email: '',
            phone: '',
            baseRole: '',
            isActive: true
        };

        // Redirigir después de 3 segundos
        setTimeout(() => {
            router.push('/users');
        }, 3000);

    } catch (err) {
        console.error("Error creando usuario:", err);
        error.value = err.message;
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<style>
/* Estilos para el componente de teléfono */
.vue-tel-input {
    @apply border-gray-300 rounded-md shadow-sm;
}

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