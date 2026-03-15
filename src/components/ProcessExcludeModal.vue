<template> 
  <div class=\"modal-overlay\" @click.self=\"$emit('close')\">  
    <div class=\"exclude-modal\">  
      <div class=\"modal-header\">  
<script setup lang=\"ts\">  
import { ref, computed, onMounted } from 'vue';  
import { invoke } from '@tauri-apps/api/core';  
import { useActivityStore } from '../stores/activity';  
const store = useActivityStore();  
const emit = defineEmits(['close']);  
const currentActivity = ref(null);  
const recentApps = ref([]);  
const appIcons = ref({});  
onMounted(() = console.log('Modal loaded'); });  
</script>  
<style scoped>  
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:1000}  
.exclude-modal{background:var(--bg-primary);border:1px solid var(--border-color);border-radius:16px;width:90%;max-width:650px}  
.modal-header{padding:20px 24px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between}  
.close-btn{background:transparent;border:none;font-size:28px;cursor:pointer}  
.modal-body{padding:24px}  
</style> 
