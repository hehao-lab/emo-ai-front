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
  --primary: #19c8b9;
  --primary-hover: #3dd4c6;
  --primary-active: #11a89b;
  --primary-bg: #e6f9f6;
  --text: #794f27;
  --text-body: #725d42;
  --text-secondary: #9f927d;
  --text-muted: #8a7b66;
  --text-disabled: #c4b89e;
  --bg: #f8f8f0;
  --bg-content: rgb(247, 243, 223);
  --bg-disabled: #f0ece2;
  --bg-soft: #fffaf0;
  --border: #c4b89e;
  --border-hover: #a89878;
  --border-strong: #9f927d;
  --success: #6fba2c;
  --warning: #f5c31c;
  --error: #e05a5a;
  --focus-yellow: #ffcc00;
  --focus-yellow-d: #e0b800;
  --shadow-btn: #bdaea0;
  --shadow-input: #d4c9b4;
  --shadow-soft: 0 14rpx 32rpx rgba(121, 79, 39, 0.08);
  --surface-dots:
    radial-gradient(circle, rgba(25, 200, 185, 0.12) 1.5px, transparent 1.5px) 0 0 / 28rpx 28rpx,
    radial-gradient(circle, rgba(255, 255, 255, 0.24) 1px, transparent 1px) 7rpx 7rpx / 14rpx 14rpx;
  --surface-warm-dots:
    radial-gradient(circle, rgba(248, 166, 178, 0.18) 1.5px, transparent 1.5px) 0 0 / 28rpx 28rpx,
    radial-gradient(circle, rgba(255, 255, 255, 0.22) 1px, transparent 1px) 7rpx 7rpx / 14rpx 14rpx;
  --panel-bg: var(--surface-dots), var(--bg-content);
  --panel-bg-warm: var(--surface-warm-dots), #fde4e8;
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
}

page {
  min-height: 100%;
  background:
    radial-gradient(circle at 14% 8%, rgba(130, 213, 187, 0.34) 0, rgba(130, 213, 187, 0) 24%),
    radial-gradient(circle at 84% 10%, rgba(248, 166, 178, 0.24) 0, rgba(248, 166, 178, 0) 22%),
    linear-gradient(180deg, #f8f8f0 0%, #f8f3df 62%, #f2ead6 100%);
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
