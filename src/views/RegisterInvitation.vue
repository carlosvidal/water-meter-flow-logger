<!-- src/views/RegisterInvitation.vue -->
<template>
    <section class="max-w-md mx-auto p-6">
        <h1 class="text-2xl font-bold mb-6">Registro</h1>

        <form @submit.prevent="register" class="space-y-4 bg-white shadow-md rounded-lg p-6">
            <div>
                <label class="block text-sm font-medium text-gray-700">Nombre</label>
                <input type="text" v-model="name" required
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Ingrese su nombre" />
            </div>

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

            <div>
                <label class="block text-sm font-medium text-gray-700">Teléfono</label>
                <input type="tel" v-model="phone" required
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="+1234567890" />
            </div>

            <button type="submit"
                class="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Registrarse
            </button>
        </form>
    </section>
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