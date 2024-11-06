<!-- src/components/PieChart.vue -->
<template>
    <div class="flex flex-col items-center w-full">
        <div class="relative w-[300px] h-[300px]">
            <svg viewBox="0 0 100 100" class="w-full h-full">
                <!-- Sectores del pie -->
                <g transform="translate(50,50)">
                    <path v-for="(slice, index) in slices" :key="index" :d="slice.path"
                        :fill="colors[index % colors.length]"
                        class="transition-opacity duration-200 hover:opacity-80 cursor-pointer"
                        @mouseenter="activeSlice = slice" @mouseleave="activeSlice = null" />
                </g>
            </svg>

            <!-- Tooltip -->
            <div v-if="activeSlice" class="absolute bg-white shadow-lg rounded-lg p-2 text-sm z-10"
                :style="{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }">
                <div class="font-medium">{{ activeSlice.name }}</div>
                <div>{{ formatNumber(activeSlice.value) }} m³</div>
                <div>{{ formatPercent(activeSlice.percentage) }}%</div>
            </div>
        </div>

        <!-- Leyenda -->
        <div class="grid grid-cols-2 gap-4 mt-4 w-full max-w-lg">
            <div v-for="(slice, index) in slices" :key="index" class="flex items-center space-x-2">
                <div :style="{ backgroundColor: colors[index % colors.length] }"
                    class="w-4 h-4 rounded-sm flex-shrink-0" />
                <div class="text-sm">
                    <span class="font-medium">{{ slice.name }}</span>
                    <span class="text-gray-600">
                        ({{ formatPercent(slice.percentage) }}%)
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
    data: {
        type: Array,
        required: true,
        // Espera array de { name: string, value: number }
    }
});

const colors = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#06B6D4', // cyan-500
];

const activeSlice = ref(null);

// Calcula el total y los porcentajes
const total = computed(() => props.data.reduce((sum, item) => sum + item.value, 0));

// Genera los sectores del pie
const slices = computed(() => {
    let startAngle = 0;
    return props.data.map(item => {
        const percentage = (item.value / total.value) * 100;
        const angle = (percentage / 100) * 2 * Math.PI;

        // Calcular puntos del arco
        const x1 = Math.cos(startAngle) * 50;
        const y1 = Math.sin(startAngle) * 50;
        const x2 = Math.cos(startAngle + angle) * 50;
        const y2 = Math.sin(startAngle + angle) * 50;

        // Crear path del sector
        const largeArcFlag = angle > Math.PI ? 1 : 0;
        const path = `M 0 0
                   L ${x1} ${y1}
                   A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2}
                   Z`;

        const slice = {
            ...item,
            percentage,
            path,
            startAngle,
            endAngle: startAngle + angle
        };

        startAngle += angle;
        return slice;
    });
});

const formatNumber = (value) => {
    return value.toFixed(3);
};

const formatPercent = (value) => {
    return value.toFixed(1);
};
</script>

<style scoped>
circle {
    transition: opacity 0.2s;
}
</style>