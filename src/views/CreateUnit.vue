<!-- src/views/CreateUnit.vue -->
<template>
    <div class="max-w-2xl mx-auto p-6">
        <div v-if="error" class="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {{ error }}
        </div>

        <div class="mb-8">
            <h1 class="text-2xl font-bold">Crear Unidad</h1>
            <p class="text-gray-600">
                Unidades disponibles: {{ availableUnits }}
            </p>
        </div>

        <form @submit.prevent="createUnit" class="space-y-6">
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Nombre de la unidad *
                    </label>
                    <input type="text" v-model="name" required class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 
                               dark:bg-gray-700 dark:text-white
                               shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Ej: Apartamento 101" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Nombre del arrendatario *
                    </label>
                    <input type="text" v-model="tenantName" required class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 
                               dark:bg-gray-700 dark:text-white
                               shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Email del arrendatario *
                    </label>
                    <input type="email" v-model="tenantEmail" required class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 
                               dark:bg-gray-700 dark:text-white
                               shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Teléfono del arrendatario *
                    </label>
                    <vue-tel-input v-model="phoneNumber" @validate="handlePhoneValidation"
                        class="mt-1 dark-mode-phone"></vue-tel-input>
                </div>
            </div>

            <div class="flex justify-end space-x-3">
                <button type="button" @click="$router.back()"
                    class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    Cancelar
                </button>
                <button type="submit" :disabled="!canSubmit" :class="[
                    'px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white',
                    canSubmit
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-300 cursor-not-allowed'
                ]">
                    Crear Unidad
                </button>
            </div>
        </form>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc, updateDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';


// Router setup
const router = useRouter();
const route = useRoute();
const condoId = route.query.condoId;

// Basic refs
const name = ref('');
const tenantName = ref('');
const tenantEmail = ref('');
const phoneNumber = ref('');
const isPhoneValid = ref(false);
const error = ref('');
const currentUnits = ref(0);
const totalUnits = ref(0);

// Computed properties
const availableUnits = computed(() => totalUnits.value - currentUnits.value);
const canCreateUnit = computed(() => availableUnits.value > 0);

const canSubmit = computed(() => {
    return name.value.trim() &&
        tenantName.value.trim() &&
        tenantEmail.value.trim() &&
        phoneNumber.value &&
        isPhoneValid.value &&
        canCreateUnit.value;
});

// Methods
const checkCondoCapacity = async () => {
    try {
        const condoDoc = await getDoc(doc(db, 'condos', condoId));
        if (!condoDoc.exists()) {
            throw new Error('Condominio no encontrado');
        }
        totalUnits.value = condoDoc.data().numberOfUnits;

        const unitsQuery = query(
            collection(db, 'units'),
            where('condoId', '==', condoId)
        );
        const unitsSnapshot = await getDocs(unitsQuery);
        currentUnits.value = unitsSnapshot.size;

        if (currentUnits.value >= totalUnits.value) {
            error.value = 'Este condominio ya alcanzó su límite de unidades';
            router.push(`/condo/${condoId}`);
        }
    } catch (err) {
        console.error("Error verificando capacidad:", err);
        error.value = err.message;
        router.push('/condos');
    }
};

const handlePhoneValidation = (isValid) => {
    isPhoneValid.value = isValid;
};

const createUnit = async () => {
    try {
        if (!canCreateUnit.value) {
            throw new Error('No se pueden crear más unidades en este condominio');
        }

        if (!canSubmit.value) {
            throw new Error('Por favor complete todos los campos correctamente');
        }

        // Crear la unidad en la colección units
        const unitData = {
            condoId,
            name: name.value.trim(),
            tenant: {
                name: tenantName.value.trim(),
                email: tenantEmail.value.trim(),
                phone: phoneNumber.value
            },
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const unitRef = await addDoc(collection(db, 'units'), unitData);

        // Actualizar el documento del condominio con la nueva referencia
        const condoRef = doc(db, 'condos', condoId);
        await updateDoc(condoRef, {
            [`units.${unitRef.id}`]: {
                createdAt: serverTimestamp()
            },
            updatedAt: serverTimestamp()
        });

        router.push(`/condo/${condoId}`);
    } catch (err) {
        console.error("Error creando la unidad:", err);
        error.value = err.message;
    }
};

// Lifecycle hooks
onMounted(async () => {
    if (!condoId) {
        error.value = 'No se especificó el condominio';
        router.push('/condos');
        return;
    }
    await checkCondoCapacity();
});
</script>

<style>
/* Estilos base */
.vue-tel-input {
    @apply border-gray-300 rounded-md shadow-sm;
}

/* Dark mode para el componente de teléfono */
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

/* Estilos para el fondo en dark mode */
.dark body {
    @apply bg-gray-900;
}

.dark .max-w-2xl {
    @apply bg-gray-800 text-white;
}
</style>