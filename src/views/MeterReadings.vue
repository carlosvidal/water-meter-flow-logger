<template>
    <div>
        <h1>Lecturas de Medidores</h1>
        <button @click="goToCreateReading">Registrar Lectura</button>
        <ul>
            <li v-for="reading in readings" :key="reading.id">
                {{ reading.unit }} - {{ reading.date }} - {{ reading.value }} m³
            </li>
        </ul>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const router = useRouter();
const readings = ref([]);

const fetchReadings = async () => {
    const querySnapshot = await getDocs(collection(db, 'meter-readings'));
    readings.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

const goToCreateReading = () => {
    router.push('/create-reading');
};

onMounted(() => {
    fetchReadings();
});
</script>