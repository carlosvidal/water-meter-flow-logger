<template>
    <div>
        <h1>Crear Unidad</h1>
        <form @submit.prevent="createUnit">
            <input type="text" v-model="name" placeholder="Nombre de la unidad" required />
            <input type="text" v-model="tenantName" placeholder="Nombre del arrendatario" required />
            <input type="email" v-model="tenantEmail" placeholder="Email del arrendatario" required />
            <input type="tel" v-model="tenantPhone" placeholder="Teléfono del arrendatario" required />
            <button type="submit">Crear Unidad</button>
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

const createUnit = async () => {
    try {
        await addDoc(collection(db, 'units'), {
            name: name.value,
            tenant: {
                name: tenantName.value,
                email: tenantEmail.value,
                phone: tenantPhone.value
            }
        });
        router.push('/units');
    } catch (error) {
        console.error("Error creando la unidad:", error);
    }
};
</script>