<!-- src/components/PhoneInput.vue -->
<template>
    <div class="phone-input-wrapper">
        <VueTelInput v-model="phone" class="tel-input-custom" mode="international" :only-countries="allowedCountries"
            :preferred-countries="['PE']" default-country="PE" @validate="onValidate" />
        <div v-if="!isValid && phone" class="text-red-500 text-sm mt-1">
            Por favor ingrese un número válido
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { VueTelInput } from 'vue-tel-input';

const props = defineProps({
    modelValue: String
});

const emit = defineEmits(['update:modelValue', 'validate']);

const phone = ref(props.modelValue || '');
const isValid = ref(false);

const allowedCountries = [
    'PE', 'AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC',
    'SV', 'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PR', 'UY', 'VE'
];

const onValidate = ({ isValid: valid, number }) => {
    isValid.value = valid;
    if (valid) {
        emit('update:modelValue', number);
    } else {
        emit('update:modelValue', '');
    }
    emit('validate', valid);
};

watch(() => props.modelValue, (newValue) => {
    if (newValue !== phone.value) {
        phone.value = newValue;
    }
});
</script>

<style>
.tel-input-custom {
    @apply mt-1 block w-full relative;
}

.vue-tel-input {
    @apply border-gray-300 rounded-md shadow-sm;
}

.vue-tel-input:focus-within {
    @apply border-blue-500 ring-1 ring-blue-500;
}

.vti__input {
    @apply border-gray-300 rounded-r-md shadow-sm focus:border-blue-500 focus:ring-blue-500;
    height: 38px !important;
    margin-left: 0 !important;
    width: 100% !important;
}

.vti__dropdown {
    @apply border-gray-300 rounded-l-md min-w-[90px];
}

.vti__dropdown-list {
    @apply absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm;
}
</style>