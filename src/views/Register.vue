<template>
    <div>
        <h1>Registro</h1>
        <form @submit.prevent="register">
            <input type="text" v-model="name" placeholder="Nombre" required />
            <input type="email" v-model="email" placeholder="Email" required />
            <input type="password" v-model="password" placeholder="Password" required />
            <input type="tel" v-model="phone" placeholder="Teléfono" required />
            <button type="submit">Registrarse</button>
        </form>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const router = useRouter();
const name = ref('');
const email = ref('');
const password = ref('');
const phone = ref('');

const register = async () => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            name: name.value,
            email: email.value,
            phone: phone.value,
            baseRole: "editor", // Cambiado de userType a baseRole
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        router.push('/');
    } catch (error) {
        console.error("Error en el registro:", error);
    }
};
</script>