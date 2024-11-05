<template>
    <div class="max-w-2xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Perfil de Usuario</h1>
            <p class="mt-1 text-sm text-gray-600">
                Gestión de información y permisos del usuario
            </p>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="text-center py-8">
            <p class="text-gray-600">Cargando información del usuario...</p>
        </div>

        <!-- Error message -->
        <div v-else-if="error" class="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {{ error }}
        </div>

        <!-- User profile form -->
        <div v-else-if="user" class="bg-white shadow-md rounded-lg p-6 space-y-6">
            <!-- Información del usuario -->
            <div class="grid grid-cols-1 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Nombre</label>
                    <p class="mt-1 text-sm text-gray-900">{{ user.name }}</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">Email</label>
                    <p class="mt-1 text-sm text-gray-900">{{ user.email }}</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">Teléfono</label>
                    <p class="mt-1 text-sm text-gray-900">{{ user.phone }}</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Rol del Usuario</label>
                    <select v-if="canEditRole" v-model="baseRole"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option v-for="role in availableRoles" :key="role.value" :value="role.value">
                            {{ role.label }}
                        </option>
                    </select>
                    <p v-else class="mt-1 text-sm text-gray-900">
                        {{ formatRole(user.baseRole) }}
                    </p>
                </div>

                <div v-if="canEditStatus" class="flex items-center space-x-2">
                    <label class="text-sm font-medium text-gray-700">Estado de la cuenta:</label>
                    <label class="inline-flex items-center">
                        <input type="checkbox" v-model="isActive"
                            class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                        <span class="ml-2 text-sm text-gray-900">Activo</span>
                    </label>
                </div>
            </div>

            <!-- Botones de acción -->
            <div v-if="canEdit" class="flex justify-end space-x-3">
                <button @click="router.back()"
                    class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    Cancelar
                </button>
                <button @click="updateUser" :disabled="updating"
                    class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">
                    {{ updating ? 'Actualizando...' : 'Actualizar Perfil' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '../store/user';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const userId = route.params.id;
const user = ref(null);
const baseRole = ref('');
const isActive = ref(false);
const loading = ref(true);
const updating = ref(false);
const error = ref(null);

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

// Permisos
const canEdit = computed(() => {
    return userStore.isSuperAdmin ||
        userStore.isAdmin ||
        userStore.currentUser?.uid === userId;
});

const canEditRole = computed(() => {
    return (userStore.isSuperAdmin || userStore.isAdmin) &&
        userStore.currentUser?.uid !== userId;
});

const canEditStatus = computed(() => {
    return (userStore.isSuperAdmin || userStore.isAdmin) &&
        userStore.currentUser?.uid !== userId;
});

const formatRole = (role) => {
    const roles = {
        'superadmin': 'Super Admin',
        'admin': 'Administrador',
        'editor': 'Editor',
        'analyst': 'Analista',
        'tenant': 'Inquilino'
    };
    return roles[role] || role;
};

const fetchUser = async () => {
    try {
        loading.value = true;
        error.value = null;

        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            user.value = { id: docSnap.id, ...docSnap.data() };
            baseRole.value = user.value.baseRole;
            isActive.value = user.value.isActive;
        } else {
            error.value = "Usuario no encontrado";
        }
    } catch (err) {
        console.error("Error cargando usuario:", err);
        error.value = "Error al cargar la información del usuario";
    } finally {
        loading.value = false;
    }
};

const updateUser = async () => {
    try {
        if (!canEdit.value) {
            throw new Error('No tienes permisos para editar este perfil');
        }

        updating.value = true;
        error.value = null;

        const updateData = {};

        // Solo incluir campos que el usuario puede editar
        if (canEditRole.value) {
            updateData.baseRole = baseRole.value;
        }
        if (canEditStatus.value) {
            updateData.isActive = isActive.value;
        }

        const docRef = doc(db, 'users', userId);
        await updateDoc(docRef, updateData);

        // Si el usuario está editando su propio perfil, actualizar el store
        if (userId === userStore.currentUser?.uid) {
            await userStore.refreshUser();
        }

        router.back();
    } catch (err) {
        console.error("Error actualizando usuario:", err);
        error.value = "Error al actualizar el perfil";
    } finally {
        updating.value = false;
    }
};

onMounted(() => {
    fetchUser();
});
</script>