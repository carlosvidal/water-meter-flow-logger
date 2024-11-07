<!-- src/views/ReadingManager.vue -->
<template>
    <div>
        <!-- Paso 1: Formulario principal -->
        <ReadingForm v-if="currentStep === 1" :reading-id="readingId" :is-edit="!!readingId" :main-reading="mainReading"
            @submit="handleMainReadingSubmit" />

        <!-- Paso 2: Lecturas individuales -->
        <UnitReadingsForm v-else-if="currentStep === 2" :main-reading="mainReading" :is-first-reading="isFirstReading"
            :reading-id="readingId" :units="units" :previous-readings="previousReadings"
            @submit="handleUnitReadingsSubmit" />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ReadingForm from '../components/ReadingForm.vue';
import UnitReadingsForm from '../components/UnitReadingsForm.vue';
import { readingService } from '../services/readingService';

const route = useRoute();
const router = useRouter();
const readingId = route.params.id;

const currentStep = ref(1);
const mainReading = ref(null);
const isFirstReading = ref(false);
const units = ref([]);
const previousReadings = ref({});
const unitReadings = ref({}); // Añadido como ref

const handleMainReadingSubmit = async (data) => {
    try {
        mainReading.value = {
            ...data,
            unitReadings: mainReading.value?.unitReadings,
            status: mainReading.value?.status || 'open' // Asegurar que siempre hay un status
        };
        isFirstReading.value = data.isFirstReading;

        // Cargar datos necesarios para el segundo paso
        units.value = await readingService.getCondoUnits(data.condoId);
        if (!isFirstReading.value) {
            previousReadings.value = await readingService.getPreviousReadings(data.condoId);
        }

        currentStep.value = 2;
    } catch (error) {
        console.error('Error:', error);
    }
};

const handleUnitReadingsSubmit = async (unitReadings) => {
    try {
        if (isFirstReading.value) {
            await readingService.createFirstReading(
                mainReading.value.condoId,
                mainReading.value.date,
                unitReadings
            );
        } else {
            const readingData = {
                ...mainReading.value,
                unitReadings,
                status: 'open'
            };

            if (readingId) {
                await readingService.updateMainReading(readingId, readingData);
            } else {
                await readingService.createMainReading(readingData);
            }
        }

        router.push('/meter-readings');
    } catch (error) {
        console.error('Error saving readings:', error);
        // Manejar el error apropiadamente
    }
};

onMounted(async () => {
    if (readingId) {
        try {
            const reading = await readingService.getReading(readingId);
            console.log('Lectura cargada:', reading);

            mainReading.value = {
                condoId: reading.condoId,
                date: reading.date,
                reading: reading.reading,
                cost: reading.cost,
                status: reading.status || 'open', // Asegurar que siempre hay un status
                unitReadings: reading.unitReadings || {}
            };

            isFirstReading.value = reading.isFirstReading || false;

            // Si hay lecturas existentes, cargar los datos necesarios
            if (mainReading.value.condoId) {
                units.value = await readingService.getCondoUnits(mainReading.value.condoId);
                if (!isFirstReading.value) {
                    previousReadings.value = await readingService.getPreviousReadings(mainReading.value.condoId);
                }
            }
        } catch (error) {
            console.error('Error loading reading:', error);
        }
    }
});
</script>