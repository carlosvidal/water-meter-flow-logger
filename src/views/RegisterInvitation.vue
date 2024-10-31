<!-- src/views/RegisterInvitation.vue -->
<template>
    <div class="max-w-md mx-auto p-6">
        <div v-if="loading" class="text-center py-8">
            <p class="text-gray-600">Verificando invitación...</p>
        </div>

        <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {{ error }}
        </div>

        <div v-else>
            <h1 class="text-2xl font-bold mb-6">Completar Registro</h1>

            <div class="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-6">
                <p>Has sido invitado como {{ invitationData?.role }}</p>
                <p class="text-sm">{{ invitationData?.email }}</p>
            </div>

            <form @submit.prevent="registerUser" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Nombre completo</label>
                    <input type="text" v-model="form.name" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">Teléfono</label>
                    <input type="tel" v-model="form.phone" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">Contraseña</label>
                    <input type="password" v-model="form.password" required minlength="8"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">Confirmar contraseña</label>
                    <input type="password" v-model="form.confirmPassword" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>

                <button type="submit" :disabled="isSubmitting"
                    class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">
                    {{ isSubmitting ? 'Registrando...' : 'Completar registro' }}
                </button>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { invitationService } from '../services/invitationService';
import { useUserStore } from '../store/user';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const loading = ref(true);
const error = ref(null);
const invitationData = ref(null);
const isSubmitting = ref(false);

const form = ref({
    name: '',
    phone: '',
    password: '',
    confirmPassword: ''
});

// Verificar el token de invitación al cargar
onMounted(async () => {
    try {
        const token = route.query.token;
        if (!token) {
            throw new Error('Token de invitación no proporcionado');
        }

        const result = await invitationService.verifyInvitation(token);
        if (result.valid) {
            invitationData.value = result.data;
        } else {
            throw new Error('Invitación inválida');
        }
    } catch (err) {
        error.value = err.message;
    } finally {
        loading.value = false;
    }
});

// Registrar al usuario
const registerUser = async () => {
    try {
        if (form.value.password !== form.value.confirmPassword) {
            throw new Error('Las contraseñas no coinciden');
        }

        isSubmitting.value = true;

        // Crear usuario en Authentication
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            invitationData.value.email,
            form.value.password
        );

        // Crear documento del usuario
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: invitationData.value.email,
            name: form.value.name,
            phone: form.value.phone,
            baseRole: invitationData.value.role,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Si es un tenant, actualizar la unidad
        if (invitationData.value.unitId) {
            await updateDoc(doc(db, 'units', invitationData.value.unitId), {
                tenantUserId: userCredential.user.uid,
                updatedAt: new Date()
            });
        }

        // Actualizar estado de la invitación
        await updateDoc(doc(db, 'invitations', route.query.token), {
            status: 'completed',
            completedAt: new Date()
        });

        // Actualizar store y redirigir
        await userStore.setUser(userCredential.user);
        router.push('/');

    } catch (err) {
        console.error('Error registering user:', err);
        error.value = err.message;
    } finally {
        isSubmitting.value = false;
    }
};
</script>