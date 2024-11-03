<template>
    <div class="max-w-2xl mx-auto p-6">
        <h1 class="text-2xl font-bold mb-6">Perfil de Usuario</h1>

        <div v-if="user" class="bg-white shadow-md rounded-lg p-6 space-y-6">
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
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Usuario</label>
                    <select v-model="userType"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="analyst">Analista</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Super Admin</option>
                    </select>
                </div>

                <div class="flex items-center space-x-2">
                    <label class="text-sm font-medium text-gray-700">Estado de la cuenta:</label>
                    <label class="inline-flex items-center">
                        <input type="checkbox" v-model="isActive"
                            class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                        <span class="ml-2 text-sm text-gray-900">Activo</span>
                    </label>
                </div>
            </div>

            <!-- Botón de actualizar -->
            <div class="flex justify-end">
                <button @click="updateUser"
                    class="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Actualizar Perfil
                </button>
            </div>
        </div>

        <!-- Loading state o mensaje de error -->
        <div v-else class="text-center py-8">
            <p class="text-gray-500">Cargando información del usuario...</p>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const route = useRoute();
const userId = route.params.id;
const user = ref(null);
const userType = ref('');
const isActive = ref(false);

const fetchUser = async () => {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        user.value = docSnap.data();
        userType.value = user.value.userType;
        isActive.value = user.value.isActive;
    } else {
        console.log("No se encontró el usuario.");
    }
};

const updateUser = async () => {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
        userType: userType.value,
        isActive: isActive.value
    });
    alert("Perfil actualizado");
};

onMounted(() => {
    fetchUser();
});
</script>