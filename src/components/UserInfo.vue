<template>
  <div class="useinfo">
    欢迎您:<font style='color:green'>{{sqUserName}}</font>&nbsp;&nbsp;{{currentTime}}<hr/>
  </div>
</template>

<script>
import moment from "moment";
export default {
  name: 'UserInfo',
  props: {
  },
  data() {
    return {
      sqUserName: '高朋',
      currentTime : moment().format('YYYY-MM-DD h:mm:ss a')
    }
  }
}
</script>

<style scoped>


</style>
