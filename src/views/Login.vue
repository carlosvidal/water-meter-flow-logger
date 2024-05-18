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
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useUserStore } from '../store/user';

const router = useRouter();
const userStore = useUserStore();
const email = ref('');
const password = ref('');

const login = async () => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
        const userId = userCredential.user.uid;
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            userStore.setUser(userCredential.user);
            userStore.setUserType(userData.userType);
            router.push('/');
        }
    } catch (error) {
        console.error("Error iniciando sesión:", error);
    }
};
</script>