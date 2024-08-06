<template>
    <div>
        <h1>Unidades</h1>
        <button @click="goToCreateUnit">Crear Unidad</button>
        <table>
            <thead>
                <tr>
                    <th>Unidad</th>
                    <th>Arrendatario</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="unit in units" :key="unit.id">
                    <td>{{ unit.name }}</td>
                    <td>{{ unit.tenant.name }}</td>
                    <td>{{ unit.tenant.email }}</td>
                    <td>{{ unit.tenant.phone }}</td>
                </tr>
            </tbody>
        </table>
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