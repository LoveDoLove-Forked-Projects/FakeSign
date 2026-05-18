---
layout: home
hero:
  name: FakeSign
  text: 
  tagline: Redirecting...
---

<script setup>
import { onMounted } from 'vue'
onMounted(() => {
  const lang = navigator.language || 'en'
  if (lang.startsWith('zh')) {
    window.location.replace('/zh/')
  } else {
    window.location.replace('/en/')
  }
})
</script>
