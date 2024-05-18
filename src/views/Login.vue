<template>
    <div>
        <h1>Login</h1>
        <form @submit.prevent="login">
            <input type="email" v-model="email" placeholder="Email" />
            <input type="password" v-model="password" placeholder="Password" />
            <button type="submit">Login</button>
        </form>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const router = useRouter();
const email = ref('');
const password = ref('');

const login = async () => {
    try {
        await signInWithEmailAndPassword(auth, email.value, password.value);
        router.push('/');
    } catch (error) {
        console.error("Error en login:", error);
    }
};
</script>