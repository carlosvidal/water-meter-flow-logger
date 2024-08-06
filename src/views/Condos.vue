<template>
    <div>
        <h1>Comdominios</h1>
        <button @click="goToCreatecondo">Crear condominio</button>
        <table>
            <thead>
                <tr>
                    <th>Nombre</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="condo in condos" :key="condo.id">
                    <td><router-link :to="`/condo/${condo.id}`">{{ condo.name }}</router-link></td>
                </tr>
            </tbody>
        </table>
        <div id="floating-button">
            <span>+</span>
        </div>
    </div>

</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const router = useRouter();
const condos = ref([]);

const fetchcondos = async () => {
    const querySnapshot = await getDocs(collection(db, 'condos'));
    condos.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

const goToCreatecondo = () => {
    router.push('/create-condo');
};

onMounted(() => {
    fetchcondos();
});
</script>

<style>
#floating-button {
    width: 55px;
    height: 55px;
    border-radius: 50%;
    background: #db4437;
    position: fixed;
    bottom: 30px;
    right: 30px;
    cursor: pointer;
    box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    color: white;
    line-height: 1rem;

    span {
        display: flex;
        align-items: baseline;
    }
}
</style>