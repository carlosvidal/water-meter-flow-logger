<!-- src/views/Login.vue -->
<template>
    <section class="max-w-md mx-auto p-6">
        <h1 class="text-2xl font-bold mb-6">Iniciar Sesión</h1>

        <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {{ error }}
        </div>

        <form @submit.prevent="login" class="space-y-4 bg-white shadow-md rounded-lg p-6">
            <div>
                <label class="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" v-model="email" required
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="ejemplo@correo.com" />
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700">Contraseña</label>
                <input type="password" v-model="password" required
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="********" />
            </div>

            <button type="submit" :disabled="loading"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">
                <span v-if="loading" class="inline-flex items-center">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg"
                        fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                        </circle>
                        <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                        </path>
                    </svg>
                    Iniciando sesión...
                </span>
                <span v-else>Iniciar Sesión</span>
            </button>
        </form>
    </section>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useUserStore } from '../store/user';

const router = useRouter();
const userStore = useUserStore();

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const login = async () => {
    try {
        loading.value = true;
        error.value = '';

        // Autenticar con Firebase
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email.value,
            password.value
        );

        // Obtener datos adicionales del usuario desde Firestore
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

        if (!userDoc.exists()) {
            throw new Error('No se encontró el documento del usuario');
        }

        // Actualizar el store con el usuario y sus datos
        await userStore.setUser(userCredential.user);

        // Redirigir al usuario
        router.push('/');
    } catch (error) {
        console.error('Error iniciando sesión:', error);
        error.value = traducirError(error.code) || 'Error al iniciar sesión';
    } finally {
        loading.value = false;
    }
};

// Función para traducir códigos de error de Firebase
const traducirError = (code) => {
    const errores = {
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-email': 'Email inválido',
        'auth/user-disabled': 'Usuario deshabilitado',
        'auth/email-already-in-use': 'El email ya está en uso',
        'auth/operation-not-allowed': 'Operación no permitida',
        'auth/weak-password': 'La contraseña es muy débil'
    };
    return errores[code] || 'Error desconocido';
};
</script>