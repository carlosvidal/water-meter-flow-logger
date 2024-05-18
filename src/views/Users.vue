<template>
    <div>
        <h1>Usuarios</h1>
        <button @click="goToCreateUser">Crear usuario</button>
        <ul>
            <li v-for="user in users" :key="user.id">
                <router-link :to="`/profile/${user.id}`">{{ user.name }}</router-link> - {{ user.email }}
            </li>
        </ul>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const router = useRouter();
const users = ref([]);

const fetchUsers = async () => {
    const querySnapshot = await getDocs(collection(db, 'users'));
    users.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

const goToCreateUser = () => {
    router.push('/create-user');
};

onMounted(() => {
    fetchUsers();
});
</script>