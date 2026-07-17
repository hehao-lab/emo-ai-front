<script>
export default {
  onLaunch() {},
  onShow() {},
  onHide() {},
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Noto+Sans+SC:wght@400;500;700&display=swap');
@import './uni.scss';

:root,
page {
  --primary: #0a7cff;
  --primary-hover: #2f8cff;
  --primary-active: #0068df;
  --primary-bg: #e8f2ff;
  --text: #111111;
  --text-body: #2d3035;
  --text-secondary: #8f949c;
  --text-muted: #6f7680;
  --text-disabled: #c3c7ce;
  --bg: #f5f6f8;
  --bg-content: #ffffff;
  --bg-disabled: #eef0f3;
  --bg-soft: #fafafa;
  --border: #e5e7eb;
  --border-hover: #d5d9df;
  --border-strong: #c4c9d1;
  --success: #18a058;
  --warning: #f0a020;
  --error: #ff2d38;
  --focus-yellow: #0a7cff;
  --focus-yellow-d: #0068df;
  --shadow-btn: #cfd5dd;
  --shadow-input: #e3e6eb;
  --shadow-soft: 0 18rpx 42rpx rgba(17, 24, 39, 0.06);
  --surface-dots:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(250, 251, 252, 0.96));
  --surface-warm-dots:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 248, 251, 0.98));
  --panel-bg: var(--surface-dots), var(--bg-content);
  --panel-bg-warm: var(--surface-warm-dots), #ffffff;
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
}

page {
  min-height: 100%;
  background:
    linear-gradient(180deg, #ffffff 0%, #f6f7f9 46%, #eef1f5 100%);
  color: var(--text-body);
  font-family: 'Nunito', 'Noto Sans SC', -apple-system, 'PingFang SC', sans-serif;
  font-weight: 500;
  letter-spacing: 0.01em;
}

view,
text {
  box-sizing: border-box;
}

text,
input,
textarea,
button {
  font-family: inherit;
}

button {
  margin: 0;
  padding: 0;
  line-height: 1;
  background: transparent;
}

button::after {
  border: 0;
}

input,
textarea {
  color: var(--text-body);
}
</style>
