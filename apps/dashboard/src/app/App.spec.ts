import { describe, it, expect } from 'vitest';
import router from '../router';
import i18n from '../plugins/i18n';
import { mount } from '@vue/test-utils';
import App from './App.vue';

describe('App', () => {
  it('renders properly', async () => {
    const wrapper = mount(App, { global: { plugins: [router, i18n] } });
    await router.isReady();
    expect(wrapper.text()).toContain('Standup Dashboard');
    expect(wrapper.text()).toContain('Standup Mission Brief');
  });
});
