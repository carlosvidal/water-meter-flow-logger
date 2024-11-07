<!-- src/components/ReadingCloseButton.vue -->
<template>
    <div>
        <button v-if="reading?.status === 'open'" @click="confirmClose" :disabled="isProcessing" :class="[
            'px-4 py-2 rounded-md',
            isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
        ]">
            {{ isProcessing ? 'Procesando...' : 'Cerrar Lectura' }}
        </button>

        <!-- Modal de confirmación -->
        <div v-if="showConfirmation" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div class="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                <h3 class="text-lg font-medium mb-4">Confirmar Cierre de Lectura</h3>
                <p class="text-gray-600 mb-6">
                    Esta acción calculará los consumos y costos finales. ¿Está seguro de continuar?
                </p>
                <div class="flex justify-end space-x-3">
                    <button @click="showConfirmation = false" class="px-4 py-2 border rounded-md hover:bg-gray-50">
                        Cancelar
                    </button>
                    <button @click="closeReading"
                        class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { readingService } from '../services/readingService';
import { useRouter } from 'vue-router';

const props = defineProps({
    reading: {
        type: Object,
        required: true
    }
});

const router = useRouter();
const showConfirmation = ref(false);
const isProcessing = ref(false);

const confirmClose = () => {
    showConfirmation.value = true;
};

const closeReading = async () => {
    try {
        isProcessing.value = true;
        await readingService.closeReading(props.reading.id);
        router.push('/meter-readings');
    } catch (error) {
        console.error('Error closing reading:', error);
        // Aquí podrías mostrar un mensaje de error
    } finally {
        isProcessing.value = false;
        showConfirmation.value = false;
    }
};
</script>