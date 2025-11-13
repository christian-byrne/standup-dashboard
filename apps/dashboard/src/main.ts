import './styles.css';
import router from './router';
import { createApp } from 'vue';
import App from './app/App.vue';
import i18n from './plugins/i18n';

document.body.classList.add('noise-overlay');

const app = createApp(App);
app.use(router);
app.use(i18n);
app.mount('#root');
