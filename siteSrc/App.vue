<template>
  <navbar/>
  <router-view></router-view>
  <footerbar></footerbar>
</template>

<script>
import navbar from './components/nav.vue'
import footerbar from './components/footer.vue'

export default {
  name: 'App',
  components: {
    navbar,
    footerbar
  }
}
</script>

<style>
@font-face {
  font-family: "Material Icons";
  font-style: normal;
  font-weight: 400;
  src: url(/webfonts/materialicons/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2)
    format("woff2");
}

.material-icons {
  font-family: "Material Icons";
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-feature-settings: "liga";
  -webkit-font-smoothing: antialiased;
}

.blur {
  filter: blur(1.3rem);
}

.no-overflow {
  overflow: hidden;
}

.underline {
  text-decoration-line: underline;
}
</style>
