<template>
    <div>
        <h1>Condominio</h1>
        <div v-if="condo">
            <p><strong>Nombre:</strong> {{ condo.name }}</p>
            <p><strong>Activo:</strong>
                <input type="checkbox" v-model="isActive" />
            </p>
            <button @click="updateCondo">Actualizar condominio</button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const route = useRoute();
const condoId = route.params.id;
const condo = ref(null);
const isActive = ref(false);

const fetchCondo = async () => {
    const docRef = doc(db, 'condos', condoId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        condo.value = docSnap.data();
        isActive.value = condo.value.isActive;
    } else {
        console.log("No se encontró el usuario.");
    }
};

const updateCondo = async () => {
    const docRef = doc(db, 'condos', condoId);
    await updateDoc(docRef, {
        isActive: isActive.value
    });
    alert("Condominio actualizado");
};

onMounted(() => {
    fetchCondo();
});
</script>