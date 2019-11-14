<template>
  <div class="useinfo">
    欢迎您:<font style='color:green'>{{sqUserName}}</font>&nbsp;&nbsp;{{currentTime}}<hr/>
    test
  </div>
</template>

<script>
import moment from "moment";
import { checkTingpan, getGoldUsdPrice } from "@/common/js/func";

export default {
  name: 'UserInfo',
  props: {
  },
  data() {
    return {
      sqUserName: '高朋',
      currentTime : moment().format('YYYY-MM-DD h:mm:ss a')
    }
  },
  mounted() {
    const vconsole = window.console.log;
    vconsole(checkTingpan());
    vconsole(getGoldUsdPrice())
  }
}
</script>

<style scoped>


</style>
