<template>
  <section id="base_container" class="w-full flex flex-col items-center h-full bg-base-100 justify-center gap-8">
    <div id="wrapper">
        <div id="timer_control_div" v-if="isEditing" class="join shadow-xl border-2 border-accent rounded-box overflow-hidden">
            <input 
                ref="timerInputRef"
                v-model.number="inputSeconds" 
                type="number" 
                class="input input-ghost join-item w-24 text-4xl font-mono text-center focus:outline-none h-20" 
                @keyup.enter="confirmTimer"
                @blur="onBlur"
            />
            <button 
                @mousedown.prevent="confirmTimer" 
                class="btn btn-accent h-20 join-item"
            >
                START
            </button>
        </div>
        <div 
            v-else 
            @click="enterEditMode" 
            class="cursor-pointer hover:scale-105 transition-transform relative"
            title="CLICK TO SET TIMER"
        >
            <span class="countdown font-mono text-8xl text-primary bg-transparent p-6 rounded-box">
            <span class="text-neutral-content" :style="{ '--value': timeLeft }"></span>
            </span>
        </div>

    </div>

    <Transition name="fade">
      <article v-if="loaded && status" class="flex justify-center">
        <button 
          @click="toggle_lights" 
          class="btn btn-lg shadow-xl" 
          :class="status.lamp === 'on' ? 'btn-warning' : 'btn-primary'"
        >
          {{ status.lamp === 'on' ? 'Turn Off' : 'Turn On' }}
        </button>   
      </article>
    </Transition>

    <button class="btn" :class="lock_status ? 'btn-alert':''" @click="toggle_lock">
      {{ lock_status ? 'Unlock Manual Control':'Lock Manual Control' }}
    </button>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import axios from 'axios'

const timeLeft = ref(60)
const inputSeconds = ref(10)
const isEditing = ref(false)
const timerInputRef = ref(null)

const status = ref(null)
const loaded = ref(false)

let timerInterval = null
let statusInterval = null


const stopLocalCountdown = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const runLocalCountdown = () => {
  stopLocalCountdown()
  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      stopLocalCountdown()
      load_status()
    }
  }, 1000)
}


const enterEditMode = async () => {
  isEditing.value = true
  await nextTick()
  timerInputRef.value?.focus()
  timerInputRef.value?.select()
}

const onBlur = () => {
  isEditing.value = false
}

const confirmTimer = () => {
  if (inputSeconds.value > 0) {
    isEditing.value = false
    set_timer_turn_off_lights()
  } else {
    isEditing.value = false
  }
}


const set_timer_turn_off_lights = async () => {
  try {
    await axios.post(`${import.meta.env.VITE_API_PATH}/lamp/timer`, {
      plain: inputSeconds.value
    })

    timeLeft.value = inputSeconds.value
    runLocalCountdown()
  } catch (err) {
    console.error(err)
  }
}

const load_status = async () => {
  try {
    const r = await axios.get(`${import.meta.env.VITE_API_PATH}/lamp/status`)
    status.value = r.data

    if (status.value.timerActive) {
      if (!timerInterval) {
        timeLeft.value = status.value.remainingSeconds
        runLocalCountdown()
      }
    } else {
      stopLocalCountdown()
      timeLeft.value = 60
    }
  } catch (err) {}
}

const toggle_lights = async () => {
  const action = status.value?.lamp === 'on' ? 'off' : 'on'
  await axios.get(`${import.meta.env.VITE_API_PATH}/lamp/${action}`)
  load_status()
}

const lock_status = ref(false)

const toggle_lock = async () => {
  const action = lock_status.value ? 'unlock' : 'lock'
  await axios.get(`${import.meta.env.VITE_API_PATH}/${action}`)
  load_lock_status()
}

const load_lock_status = async () => {
  let r = await axios.get(`${import.meta.env.VITE_API_PATH}/lockstatus`)
  lock_status.value = r.data.lock
}

onMounted(load_lock_status)

onMounted(() => {
  loaded.value = true
  load_status()
  statusInterval = setInterval(load_status, 1000)
})

onUnmounted(() => {
  stopLocalCountdown()
  if (statusInterval) clearInterval(statusInterval)
})
</script>


<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.v-enter-active,
.v-leave-active {
  transition: opacity 1.2s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>