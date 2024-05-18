<template>
    <div>
        <h1>Registrar Lectura</h1>
        <form @submit.prevent="createReading">
            <input type="text" v-model="unit" placeholder="Unidad" required />
            <input type="date" v-model="date" placeholder="Fecha" required />
            <input type="number" v-model="value" placeholder="Valor" required />
            <button type="submit">Registrar Lectura</button>
        </form>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const router = useRouter();
const unit = ref('');
const date = ref('');
const value = ref('');

const createReading = async () => {
    try {
        await addDoc(collection(db, 'meter-readings'), {
            unit: unit.value,
            date: date.value,
            value: value.value
        });
        router.push('/meter-readings');
    } catch (error) {
        console.error("Error registrando la lectura:", error);
    }
};
</script>