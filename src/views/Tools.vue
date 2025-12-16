<template>
  <div class="page">
    <div class="page-container">
      <div class="page-header">
        <h2>{{ $t('nav.tools', 'Tools') }}</h2>
      </div>

      <div class="tools-grid">
        <div class="card">
          <ShutdownTimer />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ShutdownTimer from '../components/ShutdownTimer.vue';
</script>

<style scoped>
.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}
</style>
