<!-- CreateUnit.vue -->
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
                    <label class="block text-sm font-medium text-gray-700">
                        Nombre de la unidad *
                    </label>
                    <input type="text" v-model="name" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Ej: Apartamento 101" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">
                        Nombre del arrendatario *
                    </label>
                    <input type="text" v-model="tenantName" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">
                        Email del arrendatario *
                    </label>
                    <input type="email" v-model="tenantEmail" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>


                <div>
                    <label class="block text-sm font-medium text-gray-700">
                        Teléfono del arrendatario *
                    </label>
                    Copy
                    <VueTelInput v-model="phone.number" v-model:country="phone.country" class="tel-input-custom"
                        :enabledCountryCode="true" :validCharactersOnly="true" mode="international"
                        :onlyCountries="allowedCountries" :preferredCountries="['PE']" defaultCountry="PE" required
                        @input="onPhoneInput" @country-changed="onCountryChanged" :inputOptions="{
                            placeholder: phone.country?.iso2 === 'PE' ? '999999999' : 'Ingrese número de teléfono',
                            maxlength: 15,
                            required: true
                        }" :translations="{
                            search: 'Buscar país',
                            countryLabel: 'País',
                            phonePlaceholder: 'Número de teléfono'
                        }" />
                    <div class="mt-1 text-sm">
                        <p v-if="!phone.isValid && phone.number && getPhoneErrorMessage" class="text-red-600">
                            {{ getPhoneErrorMessage }}
                        </p>
                        <p v-else-if="phone.isValid" class="text-green-600">
                            Número válido: {{ phone.fullNumber }}
                        </p>
                    </div>
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
// 1. Imports
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { VueTelInput } from 'vue-tel-input';

// 2. Router setup
const router = useRouter();
const route = useRoute();
const condoId = route.query.condoId;

// 3. Basic refs
const name = ref('');
const tenantName = ref('');
const tenantEmail = ref('');
const error = ref('');
const currentUnits = ref(0);
const totalUnits = ref(0);

// 4. Phone ref con estructura más simple
const phone = ref({
    number: '',
    country: {
        iso2: 'PE',
        dialCode: '51',
        name: 'Peru (Perú)'
    },
    isValid: false,
    fullNumber: '',
    phoneNumber: null
});

// 5. Constants and rules
const countryRules = {
    'PE': {
        minLength: 9,
        maxLength: 9,
        pattern: /^9\d{8}$/
    },
    'AR': { minLength: 10, maxLength: 10 },
    'CL': { minLength: 9, maxLength: 9 },
    'CO': { minLength: 10, maxLength: 10 },
    'MX': { minLength: 10, maxLength: 10 },
    default: { minLength: 8, maxLength: 15 }
};

const allowedCountries = [
    'PE', 'AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV',
    'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PR', 'UY', 'VE'
];

// Agregar después de los watchers y antes del onMounted
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

// 6. Phone validation function
const validatePhone = (validation) => {
    console.log('Validate phone called with:', validation);

    // Si no hay parámetros, usar los valores actuales
    if (!validation) {
        validation = {
            isValid: false,
            phoneNumber: phone.value.number,
            formatted: phone.value.fullNumber,
            country: phone.value.country
        };
    }

    onPhoneInput(validation.formatted || validation.phoneNumber, validation);
};

// 7. Computed properties
const availableUnits = computed(() => totalUnits.value - currentUnits.value);
const canCreateUnit = computed(() => availableUnits.value > 0);

const createUnit = async () => {
    try {
        if (!canCreateUnit.value) {
            throw new Error('No se pueden crear más unidades en este condominio');
        }

        // Validación adicional del teléfono
        if (!phone.value.isValid) {
            console.log('Phone validation failed:', phone.value);
            throw new Error('El número de teléfono no es válido');
        }

        // Crear el objeto de datos
        const unitData = {
            condoId,
            name: name.value.trim(),
            tenant: {
                name: tenantName.value.trim(),
                email: tenantEmail.value.trim(),
                phone: phone.value.phoneNumber, // Número limpio sin código de país
                phoneFormatted: phone.value.fullNumber, // Número con formato internacional
                phoneCountry: phone.value.country.iso2
            },
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        console.log('Creating unit with data:', unitData);

        await addDoc(collection(db, 'units'), unitData);
        router.push(`/condo/${condoId}`);
    } catch (error) {
        console.error("Error creando la unidad:", error);
        error.value = error.message;
    }
};



const canSubmit = computed(() => {
    const validations = {
        hasName: Boolean(name.value.trim()),
        hasTenantName: Boolean(tenantName.value.trim()),
        hasEmail: Boolean(tenantEmail.value.trim()),
        phoneIsValid: Boolean(phone.value.isValid),
        canCreateUnit: Boolean(canCreateUnit.value)
    };

    const isValid = Object.values(validations).every(v => v === true);

    console.log('Submit validation:', {
        values: {
            name: name.value.trim(),
            tenantName: tenantName.value.trim(),
            tenantEmail: tenantEmail.value.trim(),
            phone: {
                number: phone.value.number,
                isValid: phone.value.isValid,
                cleanNumber: phone.value.phoneNumber
            }
        },
        validations,
        isValid
    });

    return isValid;
});

const onPhoneInput = (formattedNumber, validation = {}) => {
    console.log('Phone input:', { formattedNumber, validation });

    // Asegurar que tenemos los datos necesarios
    const inputNumber = validation.phoneNumber || formattedNumber || '';
    const inputCountry = validation.country || phone.value.country;

    // Limpiar el número
    let cleanNumber = inputNumber.replace(/\D/g, '');

    // Quitar el código de país si existe
    if (inputCountry.dialCode && cleanNumber.startsWith(inputCountry.dialCode)) {
        cleanNumber = cleanNumber.substring(inputCountry.dialCode.length);
    }

    // Validar el número
    const countryCode = inputCountry.iso2;
    let isValidNumber = false;

    if (cleanNumber) {
        if (countryCode === 'PE') {
            isValidNumber = cleanNumber.startsWith('9') && cleanNumber.length === 9;
        } else {
            const rules = countryRules[countryCode] || countryRules.default;
            isValidNumber = cleanNumber.length >= rules.minLength &&
                cleanNumber.length <= rules.maxLength;
        }
    }

    // Actualizar el estado
    phone.value = {
        country: inputCountry,
        number: formattedNumber,
        isValid: isValidNumber,
        fullNumber: formattedNumber,
        phoneNumber: cleanNumber
    };

    console.log('Updated phone state:', {
        formattedNumber,
        cleanNumber,
        isValid: isValidNumber,
        country: inputCountry
    });
};
const onCountryChanged = (newCountry) => {
    console.log('Country changed:', newCountry);

    // Asegurar que tenemos un objeto país válido
    if (!newCountry || !newCountry.iso2) {
        console.warn('Invalid country data:', newCountry);
        return;
    }

    phone.value.country = newCountry;

    // Re-validar con los datos actuales
    validatePhone({
        isValid: false,
        phoneNumber: phone.value.number,
        formatted: phone.value.fullNumber,
        country: newCountry
    });
};

// 8. Watchers (DESPUÉS de todas las definiciones)
watch(() => phone.value, (newVal, oldVal) => {
    console.log('Phone state changed:', {
        old: oldVal,
        new: newVal,
        diff: {
            numberChanged: newVal.number !== oldVal.number,
            countryChanged: newVal.country !== oldVal.country,
            validityChanged: newVal.isValid !== oldVal.isValid
        }
    });
}, { deep: true });

watch(() => phone.value.country, (newCountry, oldCountry) => {
    console.log('Country changed:', {
        from: oldCountry,
        to: newCountry,
        rules: countryRules[newCountry?.iso2 || 'PE'] || countryRules.default
    });
});

onMounted(async () => {
    if (!condoId) {
        error.value = 'No se especificó el condominio';
        router.push('/condos');
        return;
    }
    await checkCondoCapacity();
});
</script>

<style scoped>
.tel-input-custom {
    @apply mt-1 block w-full relative;
}

:deep(.vue-tel-input) {
    @apply border-gray-300 rounded-md shadow-sm;
}

:deep(.vue-tel-input:focus-within) {
    @apply border-blue-500 ring-1 ring-blue-500;
}

:deep(.vti__dropdown) {
    @apply border-gray-300 rounded-l-md min-w-[90px];
}

:deep(.vti__input) {
    @apply border-gray-300 rounded-r-md shadow-sm focus:border-blue-500 focus:ring-blue-500;
    height: 38px !important;
    margin-left: 0 !important;
    width: 100% !important;
}

:deep(.vti__dropdown-list) {
    @apply absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm;
}

:deep(.vti__dropdown-item) {
    @apply px-4 py-2 text-gray-900 hover:bg-blue-50 cursor-pointer;
}

:deep(.vti__dropdown-item.highlighted) {
    @apply bg-blue-50;
}

:deep(.vti__dropdown-item.selected) {
    @apply bg-blue-100;
}

:deep(.vti__flag) {
    @apply mr-2;
}
</style>