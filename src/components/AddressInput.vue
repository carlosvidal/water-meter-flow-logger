<!-- AddressInput.vue -->
<template>
    <div class="space-y-4">
        <!-- País -->
        <div>
            <label class="block text-sm font-medium text-gray-700">
                País *
            </label>
            <select v-model="localAddress.country" required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <option value="" disabled>Seleccione un país</option>
                <option v-for="country in sortedCountries" :key="country.code" :value="country.code">
                    {{ country.name }}
                </option>
            </select>
        </div>

        <!-- Estado/Región -->
        <div>
            <label class="block text-sm font-medium text-gray-700">
                Estado/Región *
            </label>
            <input type="text" v-model="localAddress.state" required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                :placeholder="localAddress.country === 'PE' ? 'Ej: Lima' : 'Estado o región'" />
        </div>

        <!-- Ciudad -->
        <div>
            <label class="block text-sm font-medium text-gray-700">
                Ciudad *
            </label>
            <input type="text" v-model="localAddress.city" required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                :placeholder="localAddress.country === 'PE' ? 'Ej: Miraflores' : 'Ciudad'" />
        </div>

        <!-- Dirección -->
        <div>
            <label class="block text-sm font-medium text-gray-700">
                Dirección *
            </label>
            <input type="text" v-model="localAddress.street" required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Calle, número, urbanización, etc." />
        </div>

        <!-- Código Postal -->
        <div>
            <label class="block text-sm font-medium text-gray-700">
                Código Postal
                <span class="text-xs text-gray-500 font-normal">
                    {{ localAddress.country === 'PE' ? '(opcional)' : '' }}
                </span>
            </label>
            <input type="text" v-model="localAddress.postalCode" :required="localAddress.country !== 'PE'"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                :placeholder="localAddress.country === 'PE' ? 'Opcional' : 'Código postal'" />
        </div>

        <!-- Zona Horaria -->
        <div v-if="localAddress.country">
            <label class="block text-sm font-medium text-gray-700">
                Zona Horaria *
            </label>
            <select v-model="localAddress.timezone" required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <option value="" disabled>Seleccione zona horaria</option>
                <option v-for="tz in timezones[localAddress.country]" :key="tz.id" :value="tz.id">
                    {{ tz.name }}
                </option>
            </select>
        </div>

        <!-- Moneda -->
        <div>
            <label class="block text-sm font-medium text-gray-700">
                Moneda *
            </label>
            <select v-model="localAddress.currency" required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <option value="" disabled>Seleccione moneda</option>
                <option v-for="currency in availableCurrencies" :key="currency.code" :value="currency.code">
                    {{ currency.name }}
                </option>
            </select>
        </div>

        <!-- Idioma -->
        <div>
            <label class="block text-sm font-medium text-gray-700">
                Idioma *
            </label>
            <select v-model="localAddress.language" required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <option value="" disabled>Seleccione idioma</option>
                <option v-for="lang in availableLanguages" :key="lang.code" :value="lang.code">
                    {{ lang.name }}
                </option>
            </select>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue';

const props = defineProps({
    modelValue: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['update:modelValue']);

// Lista de países
const countries = [
    // Perú primero (país por defecto)
    {
        code: 'PE',
        name: 'Perú',
        currency: 'PEN',
        currencyName: 'Soles',
        timezone: 'America/Lima',
        language: 'es-PE',
        languageName: 'Español (Perú)'
    },
    // Norteamérica
    {
        code: 'US',
        name: 'Estados Unidos',
        currency: 'USD',
        currencyName: 'Dólares americanos',
        timezone: 'America/New_York',
        language: 'en-US',
        languageName: 'English (US)'
    },
    {
        code: 'CA',
        name: 'Canadá',
        currency: 'CAD',
        currencyName: 'Dólares canadienses',
        timezone: 'America/Toronto',
        language: 'en-CA',
        languageName: 'English (Canada)'
    },
    // Resto de países...
    {
        code: 'MX',
        name: 'México',
        currency: 'MXN',
        currencyName: 'Pesos mexicanos',
        timezone: 'America/Mexico_City',
        language: 'es-MX',
        languageName: 'Español (México)'
    },
    // Sudamérica
    {
        code: 'AR',
        name: 'Argentina',
        currency: 'ARS',
        timezone: 'America/Buenos_Aires',
        language: 'es-AR'
    },
    {
        code: 'BO',
        name: 'Bolivia',
        currency: 'BOB',
        timezone: 'America/La_Paz',
        language: 'es-BO'
    },
    {
        code: 'CL',
        name: 'Chile',
        currency: 'CLP',
        timezone: 'America/Santiago',
        language: 'es-CL'
    },
    {
        code: 'CO',
        name: 'Colombia',
        currency: 'COP',
        timezone: 'America/Bogota',
        language: 'es-CO'
    },
    {
        code: 'EC',
        name: 'Ecuador',
        currency: 'USD',
        timezone: 'America/Guayaquil',
        language: 'es-EC'
    },
    {
        code: 'PY',
        name: 'Paraguay',
        currency: 'PYG',
        timezone: 'America/Asuncion',
        language: 'es-PY'
    },
    {
        code: 'UY',
        name: 'Uruguay',
        currency: 'UYU',
        timezone: 'America/Montevideo',
        language: 'es-UY'
    },
    {
        code: 'VE',
        name: 'Venezuela',
        currency: 'VES',
        timezone: 'America/Caracas',
        language: 'es-VE'
    },
    // Centroamérica y Caribe
    {
        code: 'CR',
        name: 'Costa Rica',
        currency: 'CRC',
        timezone: 'America/Costa_Rica',
        language: 'es-CR'
    },
    {
        code: 'CU',
        name: 'Cuba',
        currency: 'CUP',
        timezone: 'America/Havana',
        language: 'es-CU'
    },
    {
        code: 'DO',
        name: 'República Dominicana',
        currency: 'DOP',
        timezone: 'America/Santo_Domingo',
        language: 'es-DO'
    },
    {
        code: 'SV',
        name: 'El Salvador',
        currency: 'USD',
        timezone: 'America/El_Salvador',
        language: 'es-SV'
    },
    {
        code: 'GT',
        name: 'Guatemala',
        currency: 'GTQ',
        timezone: 'America/Guatemala',
        language: 'es-GT'
    },
    {
        code: 'HN',
        name: 'Honduras',
        currency: 'HNL',
        timezone: 'America/Tegucigalpa',
        language: 'es-HN'
    },
];

// Zonas horarias por país (igual que antes)
const timezones = {
    'US': [
        { id: 'America/New_York', name: 'Este (Nueva York)' },
        { id: 'America/Chicago', name: 'Centro (Chicago)' },
        { id: 'America/Denver', name: 'Montaña (Denver)' },
        { id: 'America/Los_Angeles', name: 'Pacífico (Los Ángeles)' },
        { id: 'America/Anchorage', name: 'Alaska (Anchorage)' },
        { id: 'Pacific/Honolulu', name: 'Hawái (Honolulu)' }
    ],
    'CA': [
        { id: 'America/Toronto', name: 'Este (Toronto)' },
        { id: 'America/Winnipeg', name: 'Centro (Winnipeg)' },
        { id: 'America/Edmonton', name: 'Montaña (Edmonton)' },
        { id: 'America/Vancouver', name: 'Pacífico (Vancouver)' }
    ],
    'MX': [
        { id: 'America/Mexico_City', name: 'Ciudad de México' },
        { id: 'America/Tijuana', name: 'Tijuana' },
        { id: 'America/Cancun', name: 'Cancún' }
    ],
    // Para el resto de países, usamos una zona horaria única
    'PE': [{ id: 'America/Lima', name: 'Lima (GMT-5)' }],
    'AR': [{ id: 'America/Buenos_Aires', name: 'Buenos Aires (GMT-3)' }],
    'BO': [{ id: 'America/La_Paz', name: 'La Paz (GMT-4)' }],
    'CL': [{ id: 'America/Santiago', name: 'Santiago (GMT-4)' }],
    'CO': [{ id: 'America/Bogota', name: 'Bogotá (GMT-5)' }],
    'EC': [{ id: 'America/Guayaquil', name: 'Guayaquil (GMT-5)' }],
    'PY': [{ id: 'America/Asuncion', name: 'Asunción (GMT-4)' }],
    'UY': [{ id: 'America/Montevideo', name: 'Montevideo (GMT-3)' }],
    'VE': [{ id: 'America/Caracas', name: 'Caracas (GMT-4)' }],
    'CR': [{ id: 'America/Costa_Rica', name: 'San José (GMT-6)' }],
    'CU': [{ id: 'America/Havana', name: 'La Habana (GMT-5)' }],
    'DO': [{ id: 'America/Santo_Domingo', name: 'Santo Domingo (GMT-4)' }],
    'SV': [{ id: 'America/El_Salvador', name: 'San Salvador (GMT-6)' }],
    'GT': [{ id: 'America/Guatemala', name: 'Guatemala (GMT-6)' }],
    'HN': [{ id: 'America/Tegucigalpa', name: 'Tegucigalpa (GMT-6)' }],
    'NI': [{ id: 'America/Managua', name: 'Managua (GMT-6)' }],
    'PA': [{ id: 'America/Panama', name: 'Panamá (GMT-5)' }],
    'PR': [{ id: 'America/Puerto_Rico', name: 'San Juan (GMT-4)' }]
};

// Lista completa de monedas disponibles
const currencies = [
    // Sudamérica
    { code: 'PEN', name: 'Soles peruanos (PEN)', symbol: 'S/' },
    { code: 'ARS', name: 'Pesos argentinos (ARS)', symbol: '$' },
    { code: 'BOB', name: 'Bolivianos (BOB)', symbol: 'Bs.' },
    { code: 'BRL', name: 'Reales brasileños (BRL)', symbol: 'R$' },
    { code: 'CLP', name: 'Pesos chilenos (CLP)', symbol: '$' },
    { code: 'COP', name: 'Pesos colombianos (COP)', symbol: '$' },
    { code: 'PYG', name: 'Guaraníes paraguayos (PYG)', symbol: '₲' },
    { code: 'UYU', name: 'Pesos uruguayos (UYU)', symbol: '$' },
    { code: 'VES', name: 'Bolívares venezolanos (VES)', symbol: 'Bs.' },

    // Centroamérica y Caribe
    { code: 'CRC', name: 'Colones costarricenses (CRC)', symbol: '₡' },
    { code: 'CUP', name: 'Pesos cubanos (CUP)', symbol: '$' },
    { code: 'DOP', name: 'Pesos dominicanos (DOP)', symbol: 'RD$' },
    { code: 'GTQ', name: 'Quetzales guatemaltecos (GTQ)', symbol: 'Q' },
    { code: 'HNL', name: 'Lempiras hondureñas (HNL)', symbol: 'L' },
    { code: 'MXN', name: 'Pesos mexicanos (MXN)', symbol: '$' },
    { code: 'NIO', name: 'Córdobas nicaragüenses (NIO)', symbol: 'C$' },
    { code: 'PAB', name: 'Balboas panameños (PAB)', symbol: 'B/.' },

    // Norteamérica
    { code: 'USD', name: 'Dólares americanos (USD)', symbol: '$' },
    { code: 'CAD', name: 'Dólares canadienses (CAD)', symbol: 'C$' },

    // Europa
    { code: 'EUR', name: 'Euros (EUR)', symbol: '€' },
    { code: 'GBP', name: 'Libras esterlinas (GBP)', symbol: '£' }
];

// Lista completa de idiomas disponibles
const languages = [
    // Español por países
    { code: 'es-PE', name: 'Español (Perú)' },
    { code: 'es-AR', name: 'Español (Argentina)' },
    { code: 'es-BO', name: 'Español (Bolivia)' },
    { code: 'es-CL', name: 'Español (Chile)' },
    { code: 'es-CO', name: 'Español (Colombia)' },
    { code: 'es-CR', name: 'Español (Costa Rica)' },
    { code: 'es-CU', name: 'Español (Cuba)' },
    { code: 'es-DO', name: 'Español (República Dominicana)' },
    { code: 'es-EC', name: 'Español (Ecuador)' },
    { code: 'es-SV', name: 'Español (El Salvador)' },
    { code: 'es-GT', name: 'Español (Guatemala)' },
    { code: 'es-HN', name: 'Español (Honduras)' },
    { code: 'es-MX', name: 'Español (México)' },
    { code: 'es-NI', name: 'Español (Nicaragua)' },
    { code: 'es-PA', name: 'Español (Panamá)' },
    { code: 'es-PY', name: 'Español (Paraguay)' },
    { code: 'es-PR', name: 'Español (Puerto Rico)' },
    { code: 'es-UY', name: 'Español (Uruguay)' },
    { code: 'es-VE', name: 'Español (Venezuela)' },

    // Inglés
    { code: 'en-US', name: 'English (United States)' },
    { code: 'en-CA', name: 'English (Canada)' },
    { code: 'en-GB', name: 'English (United Kingdom)' },

    // Portugués
    { code: 'pt-BR', name: 'Português (Brasil)' },

    // Francés
    { code: 'fr-CA', name: 'Français (Canada)' },
    { code: 'fr-FR', name: 'Français (France)' }
];

// Estado local
const localAddress = ref({
    country: '',
    state: '',
    city: '',
    street: '',
    postalCode: '',
    timezone: '',
    currency: '',
    language: ''
});

const availableLanguages = computed(() => {
    if (!localAddress.value.country) return languages;

    // Obtener el idioma predeterminado del país seleccionado
    const countryData = countries.find(c => c.code === localAddress.value.country);
    const defaultLanguage = countryData?.language;

    // Poner el idioma del país primero en la lista
    return [
        ...languages.filter(l => l.code === defaultLanguage),
        ...languages.filter(l => l.code !== defaultLanguage)
    ];
});

// Watch para actualizar valores cuando cambia el país
watch(() => localAddress.value.country, (newCountry) => {
    if (newCountry) {
        const country = countries.find(c => c.code === newCountry);
        if (country) {
            // Actualizar valores predeterminados pero permitir mantener los personalizados
            localAddress.value = {
                ...localAddress.value,
                timezone: country.timezone,
                currency: country.currency,
                language: country.language
            };
        }
    }
}, { immediate: true });

// Computed properties para monedas y lenguajes disponibles
const availableCurrencies = computed(() => {
    if (!localAddress.value.country) return currencies;

    // Obtener la moneda predeterminada del país seleccionado
    const countryData = countries.find(c => c.code === localAddress.value.country);
    const defaultCurrency = countryData?.currency;

    // Poner la moneda del país primero en la lista
    return [
        ...currencies.filter(c => c.code === defaultCurrency),
        ...currencies.filter(c => c.code !== defaultCurrency)
    ];
});

// Inicializar con los valores del prop
watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        localAddress.value = { ...newValue };
    }
}, { immediate: true, deep: true });

// Emitir cambios cuando cambia el estado local
watch(localAddress, (newValue) => {
    emit('update:modelValue', { ...newValue });
}, { deep: true });

// Actualizar valores predeterminados al cambiar el país
watch(() => localAddress.value.country, (newCountry) => {
    if (newCountry) {
        const country = countries.find(c => c.code === newCountry);
        if (country) {
            localAddress.value.timezone = country.timezone;
            localAddress.value.currency = country.currency;
            localAddress.value.language = country.language;
        }
    }
});

// Computed properties
const sortedCountries = computed(() => {
    const peru = countries.find(c => c.code === 'PE');
    const otherCountries = countries
        .filter(c => c.code !== 'PE')
        .sort((a, b) => a.name.localeCompare(b.name));
    return [peru, ...otherCountries];
});

// Métodos auxiliares
const getCurrencyName = (currencyCode) => {
    const country = countries.find(c => c.currency === currencyCode);
    return country?.currencyName || currencyCode;
};

const getLanguageName = (languageCode) => {
    const country = countries.find(c => c.language === languageCode);
    return country?.languageName || languageCode;
};

// Establecer valores por defecto al montar
onMounted(() => {
    if (!localAddress.value.country) {
        const defaultCountry = countries.find(c => c.code === 'PE');
        if (defaultCountry) {
            localAddress.value = {
                ...localAddress.value,
                country: defaultCountry.code,
                timezone: defaultCountry.timezone,
                currency: defaultCountry.currency,
                language: defaultCountry.language
            };
        }
    }
});
</script>