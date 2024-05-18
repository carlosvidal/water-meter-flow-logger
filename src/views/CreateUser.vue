<template>
    <div>
        <h1>Crear Usuario</h1>
        <form @submit.prevent="createUser">
            <input type="text" v-model="name" placeholder="Nombre" required />
            <input type="email" v-model="email" placeholder="Email" required />
            <input type="tel" v-model="phone" placeholder="Teléfono" required />
            <select v-model="userType" required>
                <option value="analyst">Analista</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
                <option value="super-admin">Super Admin</option>
            </select>
            <label>
                Activo:
                <input type="checkbox" v-model="isActive" />
            </label>
            <button type="submit">Crear Usuario</button>
        </form>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { db, auth } from '../firebase';
import { collection, setDoc, doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const router = useRouter();
const name = ref('');
const email = ref('');
const phone = ref('');
const userType = ref('editor');
const isActive = ref(true);

const createUser = async () => {
    try {
        // Crear usuario en Firebase Authentication
        const password = Math.random().toString(36).slice(-8); // Generar contraseña aleatoria
        const userCredential = await createUserWithEmailAndPassword(auth, email.value, password);
        const userId = userCredential.user.uid;

        // Crear documento en Firestore con el UID del usuario
        await setDoc(doc(db, 'users', userId), {
            name: name.value,
            email: email.value,
            phone: phone.value,
            userType: userType.value,
            isActive: isActive.value
        });

        alert(`Usuario creado con éxito. Contraseña: ${password}`);
        // Mantener la sesión del usuario original y no cambiar la navegación
    } catch (error) {
        console.error("Error creando el usuario:", error);
    }
};
</script>