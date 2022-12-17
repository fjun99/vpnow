<script setup lang="ts">
// import { showcases } from '../../showcases'
import  showcases  from '/showcases/showcases.json'
</script>

<template>
  <div class="container mx-auto px-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mx-auto">
      <ShowCaseInfo v-for="(info,idx) of showcases" :key="idx" :info="info" />
    </div>
  </div>
</template>
