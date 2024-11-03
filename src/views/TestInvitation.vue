<!-- src/views/TestInvitation.vue -->
<template>
    <div class="max-w-md mx-auto p-6">
        <h2 class="text-2xl font-bold mb-6">Enviar Invitación de Prueba</h2>

        <!-- Mensajes de estado -->
        <div v-if="status.message"
            :class="`p-4 mb-4 rounded ${status.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`">
            {{ status.message }}
        </div>

        <!-- Mostrar si no hay condominios -->
        <div v-if="condos.length === 0" class="p-4 bg-yellow-100 text-yellow-700 rounded mb-4">
            No hay condominios disponibles.
        </div>

        <div v-if="status.message"
            :class="`p-4 mb-4 rounded ${status.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`">
            {{ status.message }}
        </div>

        <form @submit.prevent="sendInvitation" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" v-model="form.email" required
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700">Rol</label>
                <select v-model="form.role" required
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option value="editor">Editor</option>
                    <option value="tenant">Ocupante</option>
                </select>
            </div>

            <div v-if="condos.length > 0">
                <label class="block text-sm font-medium text-gray-700">Condominio</label>
                <select v-model="form.condoId" required
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option v-for="condo in condos" :key="condo.id" :value="condo.id">
                        {{ condo.name }}
                    </option>
                </select>
            </div>

            <div v-if="form.role === 'tenant' && units.length > 0">
                <label class="block text-sm font-medium text-gray-700">Unidad</label>
                <select v-model="form.unitId" required
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option v-for="unit in units" :key="unit.id" :value="unit.id">
                        {{ unit.name }}
                    </option>
                </select>
            </div>

            <button type="submit" :disabled="isSubmitting"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">
                {{ isSubmitting ? 'Enviando...' : 'Enviar Invitación' }}
            </button>
        </form>

        <!-- Lista de invitaciones pendientes -->
        <div class="mt-8">
            <h3 class="text-lg font-medium mb-4">Invitaciones Pendientes</h3>
            <div class="space-y-2">
                <div v-for="invitation in pendingInvitations" :key="invitation.id"
                    class="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                    <div>
                        <p class="font-medium">{{ invitation.email }}</p>
                        <p class="text-sm text-gray-600">Rol: {{ invitation.role }}</p>
                        <p class="text-sm text-gray-600">
                            Expira: {{ new Date(invitation.expiresAt.seconds * 1000).toLocaleDateString() }}
                        </p>
                    </div>
                    <button @click="cancelInvitation(invitation.id)" class="text-red-600 hover:text-red-800">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'; // Agregamos watch
import { invitationService } from '../services/invitationService';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const isSubmitting = ref(false);
const condos = ref([]);
const units = ref([]);
const pendingInvitations = ref([]);
const status = reactive({
    message: '',
    error: false
});

const form = reactive({
    email: '',
    role: 'editor',
    condoId: '',
    unitId: ''
});

// Cargar condominios
const loadCondos = async () => {
    try {
        console.log('Cargando condominios...');
        const querySnapshot = await getDocs(collection(db, 'condos'));
        console.log('Condominios encontrados:', querySnapshot.docs.length);
        condos.value = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log('Condominios cargados:', condos.value);
    } catch (error) {
        console.error('Error loading condos:', error);
        status.message = `Error cargando condominios: ${error.message}`;
        status.error = true;
    }
};

// Cargar unidades cuando se selecciona un condominio
const loadUnits = async () => {
    if (!form.condoId) return;

    try {
        const q = query(
            collection(db, 'units'),
            where('condoId', '==', form.condoId)
        );
        const querySnapshot = await getDocs(q);
        units.value = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error loading units:', error);
    }
};

// Cargar invitaciones pendientes
const loadPendingInvitations = async () => {
    try {
        const invitations = await invitationService.getPendingInvitations(form.condoId);
        pendingInvitations.value = invitations;
    } catch (error) {
        console.error('Error loading pending invitations:', error);
    }
};

// Enviar invitación
const sendInvitation = async () => {
    try {
        isSubmitting.value = true;
        status.message = '';
        status.error = false;

        await invitationService.sendInvitation(
            form.email,
            form.role,
            form.condoId,
            form.role === 'tenant' ? form.unitId : null
        );

        status.message = 'Invitación enviada correctamente';
        form.email = '';
        await loadPendingInvitations();
    } catch (error) {
        console.error('Error sending invitation:', error);
        status.message = error.message;
        status.error = true;
    } finally {
        isSubmitting.value = false;
    }
};

// Cancelar invitación
const cancelInvitation = async (invitationId) => {
    try {
        await invitationService.cancelInvitation(invitationId);
        status.message = 'Invitación cancelada';
        await loadPendingInvitations();
    } catch (error) {
        console.error('Error cancelling invitation:', error);
        status.message = error.message;
        status.error = true;
    }
};

onMounted(async () => {
    console.log('Componente montado');
    try {
        await loadCondos();
        await loadPendingInvitations();
    } catch (error) {
        console.error('Error en montaje:', error);
        status.message = `Error en inicialización: ${error.message}`;
        status.error = true;
    }
});

// Observar cambios en el condominio seleccionado
watch(() => form.condoId, async () => {
    if (form.role === 'tenant') {
        await loadUnits();
    }
    await loadPendingInvitations();
});
</script>