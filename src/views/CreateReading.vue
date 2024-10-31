<!-- src/views/CreateReading.vue -->
<template>
    <div>
        <h1>Registrar Lectura</h1>
        <div v-if="loading" class="text-center py-4">
            <p>Cargando...</p>
        </div>
        <div v-else-if="!userStore.isAuthenticated" class="text-center py-4">
            <p>Por favor inicie sesión para continuar</p>
            <button @click="goToLogin" class="bg-blue-500 text-white p-2 rounded mt-2">
                Ir a Login
            </button>
        </div>
        <form v-else @submit.prevent="createReading" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Condominio</label>
                <select v-model="selectedCondoId" @change="handleCondoChange" required
                    class="w-full p-2 border rounded">
                    <option value="">Seleccionar Condominio</option>
                    <option v-for="condo in condos" :key="condo.id" :value="condo.id">
                        {{ condo.name }}
                    </option>
                </select>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700">Unidad</label>
                <select v-model="selectedUnitId" required class="w-full p-2 border rounded"
                    :disabled="!selectedCondoId">
                    <option value="">Seleccionar Unidad</option>
                    <option v-for="unit in units" :key="unit.id" :value="unit.id">
                        {{ unit.name }} - {{ unit.tenant?.name || 'Sin inquilino' }}
                    </option>
                </select>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700">Fecha de Lectura</label>
                <input type="date" v-model="readingDate" required class="w-full p-2 border rounded" />
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700">Lectura del Medidor</label>
                <input type="number" v-model.number="meterValue" placeholder="Lectura actual en m³" required step="0.01"
                    class="w-full p-2 border rounded" />
            </div>

            <div v-if="isLastReadingOfMonth">
                <label class="block text-sm font-medium text-gray-700">Total Factura de Agua</label>
                <input type="number" v-model.number="totalBill" placeholder="Monto total de la factura" required
                    step="0.01" class="w-full p-2 border rounded" />
            </div>

            <button type="submit"
                class="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                :disabled="isSubmitting">
                {{ isSubmitting ? 'Guardando...' : 'Registrar Lectura' }}
            </button>
        </form>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { waterService } from '../services/waterService';
import { useUserStore } from '../store/user';
import { getAuth } from 'firebase/auth';

const router = useRouter();
const userStore = useUserStore();
const auth = getAuth();

// Estados
const condos = ref([]);
const units = ref([]);
const selectedCondoId = ref('');
const selectedUnitId = ref('');
const readingDate = ref('');
const meterValue = ref(null);
const totalBill = ref(null);
const loading = ref(true);
const isSubmitting = ref(false);
const userLoaded = ref(false);

// Computed properties
const selectedCondo = computed(() =>
    condos.value.find(condo => condo.id === selectedCondoId.value)
);

const selectedUnit = computed(() =>
    units.value.find(unit => unit.id === selectedUnitId.value)
);

// Cargar datos del usuario y sus condominios
const loadUserData = async () => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            console.log('Esperando autenticación...');
            return;
        }

        console.log('Cargando datos para usuario:', userId);

        // Obtener documento del usuario de Firestore
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
            console.error('Documento de usuario no encontrado');
            return;
        }

        const userData = userDoc.data();
        console.log('Datos de usuario:', userData);

        // Si el usuario es superadmin o admin, cargar todos los condominios
        if (userData.userType === 'superadmin' || userData.userType === 'admin') {
            console.log('Cargando todos los condominios para admin/superadmin');
            const condosSnapshot = await getDocs(collection(db, 'condos'));
            condos.value = condosSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        // Si es un usuario normal, cargar solo sus condominios asignados
        else if (userData.condoIds?.length > 0) {
            console.log('Cargando condominios específicos:', userData.condoIds);
            const condoPromises = userData.condoIds.map(condoId =>
                getDoc(doc(db, 'condos', condoId))
            );
            const condoDocs = await Promise.all(condoPromises);
            condos.value = condoDocs
                .filter(doc => doc.exists())
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
        }

        console.log('Condominios cargados:', condos.value);
    } catch (error) {
        console.error('Error cargando datos del usuario:', error);
    } finally {
        loading.value = false;
    }
};

// Cargar unidades cuando se selecciona un condominio
const handleCondoChange = async () => {
    selectedUnitId.value = ''; // Reset unit selection
    units.value = []; // Clear units array

    if (!selectedCondoId.value) return;

    try {
        loading.value = true;
        const unitsRef = collection(db, 'units');
        const q = query(
            unitsRef,
            where('condoId', '==', selectedCondoId.value)
        );
        const snapshot = await getDocs(q);
        units.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error cargando unidades:', error);
    } finally {
        loading.value = false;
    }
};

// Verificar si es la última lectura del mes
const isLastReadingOfMonth = computed(() => {
    if (!selectedCondoId.value || !units.value.length) return false;
    return true; // Por ahora siempre true, implementar lógica real después
});

// Función para ir a la página de login
const goToLogin = () => {
    router.push('/login');
};

const createReading = async () => {
    if (!selectedUnit.value || !selectedCondo.value) {
        alert('Por favor seleccione un condominio y una unidad');
        return;
    }

    try {
        isSubmitting.value = true;

        // Validar que la fecha no sea futura
        if (new Date(readingDate.value) > new Date()) {
            alert('La fecha de lectura no puede ser futura');
            return;
        }

        // Calcular el consumo
        const consumption = await waterService.calculateConsumption(
            selectedUnitId.value,
            meterValue.value,
            readingDate.value
        );

        if (consumption < 0) {
            alert('La lectura actual no puede ser menor que la anterior');
            return;
        }

        // Crear la lectura
        const readingData = {
            unitId: selectedUnitId.value,
            condoId: selectedCondoId.value,
            value: meterValue.value,
            readingDate: readingDate.value,
            consumption,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Si es la última lectura, calcular costos
        if (isLastReadingOfMonth.value && totalBill.value) {
            const costs = await waterService.calculateCosts(
                selectedCondoId.value,
                readingDate.value,
                totalBill.value
            );

            Object.assign(readingData, {
                waterRate: costs.waterRate,
                individualCost: costs.individualCosts.find(
                    cost => cost.readingId === readingData.id
                )?.individualCost || 0,
                commonAreaCost: costs.commonAreaCost,
                totalCost: readingData.individualCost + readingData.commonAreaCost
            });
        }

        await addDoc(collection(db, 'meter-readings'), readingData);
        router.push('/meter-readings');
    } catch (error) {
        console.error('Error registrando la lectura:', error);
        alert('Error al registrar la lectura: ' + error.message);
    } finally {
        isSubmitting.value = false;
    }
};

// Setup de autenticación
onMounted(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log('Usuario autenticado:', user.uid);
            await loadUserData();
        } else {
            console.log('No hay usuario autenticado');
            loading.value = false;
        }
        userLoaded.value = true;
    });

    // Limpiar el observer cuando el componente se desmonte
    onUnmounted(() => unsubscribe());
});

// Observar cambios en el usuario del store
watch(
    () => userStore.currentUser,
    async (newUser) => {
        if (newUser && userLoaded.value) {
            console.log('Usuario cambiado en el store:', newUser);
            await loadUserData();
        }
    }
);
</script>