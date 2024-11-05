<template>
    <div class="container mx-auto p-6">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">Usuarios del Sistema</h1>
                <p class="mt-1 text-sm text-gray-600">
                    Administración de usuarios y roles
                </p>
            </div>
            <button v-if="userStore.isSuperAdmin || userStore.isAdmin" @click="goToCreateUser"
                class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Crear Usuario
            </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
            <p class="text-gray-600">Cargando usuarios...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {{ error }}
        </div>

        <!-- Users Table -->
        <div v-else class="bg-white shadow overflow-hidden sm:rounded-lg">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th scope="col"
                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nombre
                        </th>
                        <th scope="col"
                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                        </th>
                        <th scope="col"
                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Teléfono
                        </th>
                        <th scope="col"
                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rol
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
                    <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-500">
                                <a :href="'mailto:' + user.email" class="hover:text-blue-600">
                                    {{ user.email }}
                                </a>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-500">
                                <a :href="'tel:' + user.phone" class="hover:text-blue-600">
                                    {{ user.phone }}
                                </a>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span
                                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {{ formatRole(user.baseRole) }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span :class="[
                                'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                                user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            ]">
                                {{ user.isActive ? 'Activo' : 'Inactivo' }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <router-link :to="`/profile/${user.id}`" class="text-blue-600 hover:text-blue-900 mr-4">
                                Ver perfil
                            </router-link>
                            <button v-if="canManageUser(user)" @click="toggleUserStatus(user)"
                                class="text-gray-600 hover:text-gray-900">
                                {{ user.isActive ? 'Desactivar' : 'Activar' }}
                            </button>
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
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';

const router = useRouter();
const userStore = useUserStore();

const users = ref([]);
const loading = ref(true);
const error = ref(null);

// Computed property para filtrar usuarios según permisos
const filteredUsers = computed(() => {
    if (userStore.isSuperAdmin) {
        return users.value;
    } else if (userStore.isAdmin) {
        return users.value.filter(user =>
            user.baseRole !== 'superadmin' &&
            user.baseRole !== 'admin'
        );
    } else {
        return users.value.filter(user =>
            user.id === userStore.currentUser?.uid
        );
    }
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

const canManageUser = (user) => {
    if (userStore.isSuperAdmin) return true;
    if (userStore.isAdmin && user.baseRole !== 'superadmin' && user.baseRole !== 'admin') return true;
    return false;
};

const toggleUserStatus = async (user) => {
    try {
        if (!canManageUser(user)) {
            throw new Error('No tienes permisos para modificar este usuario');
        }

        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, {
            isActive: !user.isActive
        });
        user.isActive = !user.isActive;
    } catch (err) {
        console.error('Error actualizando estado del usuario:', err);
        error.value = 'Error al actualizar el estado del usuario';
    }
};

const fetchUsers = async () => {
    try {
        loading.value = true;
        error.value = null;

        let q;
        if (userStore.isSuperAdmin) {
            q = collection(db, 'users');
        } else if (userStore.isAdmin) {
            q = query(
                collection(db, 'users'),
                where('baseRole', 'not-in', ['superadmin', 'admin'])
            );
        } else {
            q = query(
                collection(db, 'users'),
                where('__name__', '==', userStore.currentUser?.uid)
            );
        }

        const querySnapshot = await getDocs(q);
        users.value = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (err) {
        console.error('Error cargando usuarios:', err);
        error.value = 'Error al cargar la lista de usuarios';
    } finally {
        loading.value = false;
    }
};

const goToCreateUser = () => {
    router.push('/create-user');
};

onMounted(() => {
    fetchUsers();
});
</script>