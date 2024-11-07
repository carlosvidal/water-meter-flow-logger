<!-- src/views/CreateUnitReadings.vue -->
<template>
    <div class="max-w-4xl mx-auto p-6">
        <div v-if="loading" class="text-center py-8">
            <p class="text-gray-600">Cargando...</p>
        </div>

        <template v-else>
            <div class="mb-6">
                <h1 class="text-2xl font-bold">Lecturas Individuales</h1>
                <p class="text-gray-600">Lectura principal: {{ mainReading?.reading }} m³</p>
            </div>

            <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {{ error }}
            </div>

            <div class="bg-white shadow rounded-lg p-6">
                <div v-if="units.length === 0" class="text-center py-4">
                    <p class="text-gray-600">No hay unidades registradas en este condominio</p>
                </div>

                <div v-else class="space-y-4">
                    <div v-for="unit in sortedUnits" :key="unit.id"
                        class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md">
                        <div class="md:col-span-2">
                            <span class="font-medium">{{ unit.name }}</span>
                            <p class="text-sm text-gray-500">{{ unit.tenant?.name }}</p>
                            <p v-if="previousReadings[unit.id]" class="text-xs text-gray-500">
                                Lectura anterior: {{ formatReading(previousReadings[unit.id]) }} m³
                            </p>
                        </div>
                        <div>
                            <input type="number" v-model="unitReadings[unit.id]" @input="validateReading(unit.id)"
                                class="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                :class="{ 'border-red-500': readingErrors[unit.id] }" step="0.001" min="0" :placeholder="previousReadings[unit.id] ?
                                    `>${formatReading(previousReadings[unit.id])}` : '0.000'" />
                            <p v-if="readingErrors[unit.id]" class="text-red-500 text-xs mt-1">
                                {{ readingErrors[unit.id] }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Botones -->
                <div class="flex justify-end space-x-3 mt-6">
                    <button @click="$router.back()"
                        class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        Cancelar
                    </button>
                    <button @click="saveReadings" :disabled="!canSave || isSaving"
                        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
                        {{ isSaving ? 'Guardando...' : 'Guardar Lecturas' }}
                    </button>
                </div>
            </div>
        </template>
    </div>
</template>