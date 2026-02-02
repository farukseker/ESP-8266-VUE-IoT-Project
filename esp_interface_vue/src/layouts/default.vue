<template>
    <section class="w-full flex">
        <article class="w-full h-screen">
            <RouterView />
        </article>
    </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { ref } from 'vue'

const themeStore = useThemeStore()
onMounted(() => {
  themeStore.sync_theme()
})
</script>


<style scoped>
section{
  width: 100%;
  display: flex;
}
article {
  width: 100%;
  height: 100vh;
}
</style>
