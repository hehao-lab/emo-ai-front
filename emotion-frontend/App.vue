<script>
export default {
  onLaunch() {},
  onShow() {},
  onHide() {},
}
</script>

<style>
@import './uni.scss';

page {
  min-height: 100%;
  background: linear-gradient(180deg, #f2ecf8 0%, #e9ebf9 34%, #dcebfa 100%);
  color: #30313b;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

view,
text {
  box-sizing: border-box;
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
</style>
