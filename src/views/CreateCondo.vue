<template>
    <div>
        <h1>Crear condominio</h1>
        <form @submit.prevent="createcondo">
            <input type="text" v-model="name" placeholder="Nombre del condominio" required />
            <button type="submit">Crear condominio</button>
        </form>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const router = useRouter();
const name = ref('');
const tenantName = ref('');
const tenantEmail = ref('');
const tenantPhone = ref('');

const createcondo = async () => {
    try {
        await addDoc(collection(db, 'condos'), {
            name: name.value,
            tenant: {
                name: tenantName.value
            }
        });
        router.push('/condos');
    } catch (error) {
        console.error("Error creando la unidad:", error);
    }
};
</script>