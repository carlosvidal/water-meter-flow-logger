<template>
    <div>
        <h1>Unidades</h1>
        <button @click="goToCreateUnit">Crear Unidad</button>
        <ul>
            <li v-for="unit in units" :key="unit.id">
                {{ unit.name }} - {{ unit.tenant.name }} - {{ unit.tenant.email }} - {{ unit.tenant.phone }}
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
const units = ref([]);

const fetchUnits = async () => {
    const querySnapshot = await getDocs(collection(db, 'units'));
    units.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

const goToCreateUnit = () => {
    router.push('/create-unit');
};

onMounted(() => {
    fetchUnits();
});
</script>