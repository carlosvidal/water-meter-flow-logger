<template>
    <div>
        <h1>Perfil de Usuario</h1>
        <div v-if="user">
            <p><strong>Nombre:</strong> {{ user.name }}</p>
            <p><strong>Email:</strong> {{ user.email }}</p>
            <p><strong>Teléfono:</strong> {{ user.phone }}</p>
            <p><strong>Tipo de Usuario:</strong>
                <select v-model="userType">
                    <option value="analyst">Analista</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                </select>
            </p>
            <p><strong>Activo:</strong>
                <input type="checkbox" v-model="isActive" />
            </p>
            <button @click="updateUser">Actualizar Perfil</button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const route = useRoute();
const userId = route.params.id;
const user = ref(null);
const userType = ref('');
const isActive = ref(false);

const fetchUser = async () => {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        user.value = docSnap.data();
        userType.value = user.value.userType;
        isActive.value = user.value.isActive;
    } else {
        console.log("No se encontró el usuario.");
    }
};

const updateUser = async () => {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
        userType: userType.value,
        isActive: isActive.value
    });
    alert("Perfil actualizado");
};

onMounted(() => {
    fetchUser();
});
</script>