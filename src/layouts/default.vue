<template>
  <view class="layout-container">
    <slot />
  </view>
</template>

<style scoped>
.layout-container {
  max-width: 768px;
  margin: 0 auto;
}
@media (min-width: 768px) {
  .layout-container {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
