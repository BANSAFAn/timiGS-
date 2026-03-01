<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTeamsStore } from '../stores/teams';

const emit = defineEmits(['close', 'select']);
const store = useTeamsStore();

const loading = ref(true);
const sources = ref<Array<{id: string, name: string, thumbnail: string}>>([]);
const selectedSourceId = ref<string>('');

onMounted(async () => {
    loading.value = true;
    await store.fetchDesktopSources();
    sources.value = store.desktopSources;
    loading.value = false;
});

function selectSource(sourceId: string) {
    selectedSourceId.value = sourceId;
}

function confirmSelection() {
    if (selectedSourceId.value) {
        emit('select', selectedSourceId.value);
    }
}
</script>

<template>
    <div class="screen-picker-overlay" @click.self="$emit('close')">
        <div class="screen-picker-modal glass-panel">
            <div class="modal-header">
                <h3>Share Screen via TimiGS</h3>
                <button class="btn-close" @click="$emit('close')">✕</button>
            </div>
            
            <div class="modal-body">
                <div v-if="loading" class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading windows...</p>
                </div>
                
                <div v-else-if="sources.length === 0" class="empty-state">
                    <p>No shareable windows found.</p>
                </div>
                
                <div v-else class="sources-grid">
                    <div 
                        v-for="source in sources" 
                        :key="source.id"
                        class="source-item"
                        :class="{ selected: selectedSourceId === source.id }"
                        @click="selectSource(source.id)"
                    >
                        <div class="thumbnail-wrapper">
                            <img :src="source.thumbnail" alt="Preview"/>
                        </div>
                        <div class="source-info">
                            <span class="source-name" :title="source.name">{{ source.name }}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-footer">
                <button class="btn-cancel" @click="$emit('close')">Cancel</button>
                <button 
                    class="btn-confirm" 
                    :disabled="!selectedSourceId"
                    @click="confirmSelection"
                >
                    Share
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.screen-picker-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.screen-picker-modal {
    width: 800px;
    max-width: 90vw;
    height: 600px;
    max-height: 80vh;
    background: rgba(20, 20, 25, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    backdrop-filter: blur(20px);
}

.modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h3 {
    margin: 0;
    color: white;
    font-weight: 600;
}

.btn-close {
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.5);
    font-size: 1.2rem;
    cursor: pointer;
    transition: color 0.2s;
}

.btn-close:hover {
    color: white;
}

.modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
}

.loading-state, .empty-state {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.6);
}

.sources-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
}

.source-item {
    cursor: pointer;
    border-radius: 12px;
    padding: 10px;
    background: rgba(255,255,255,0.03);
    border: 2px solid transparent;
    transition: all 0.2s;
}

.source-item:hover {
    background: rgba(255,255,255,0.08);
    transform: translateY(-2px);
}

.source-item.selected {
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.1);
}

.thumbnail-wrapper {
    width: 100%;
    aspect-ratio: 16/9;
    background: #000;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 10px;
}

.thumbnail-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.source-name {
    display: block;
    color: rgba(255,255,255,0.9);
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
}

.modal-footer {
    padding: 20px 24px;
    border-top: 1px solid rgba(255,255,255,0.1);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.btn-cancel {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    padding: 10px 20px;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-cancel:hover {
    background: rgba(255,255,255,0.1);
}

.btn-confirm {
    background: #6366f1;
    border: none;
    color: white;
    padding: 10px 24px;
    border-radius: 50px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
}

.btn-confirm:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-confirm:not(:disabled):hover {
    background: #4f46e5;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}
</style>
