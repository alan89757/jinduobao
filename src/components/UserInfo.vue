<template>
  <div class="useinfo">
    欢迎您:
    <font style="color:green">{{sqUserName}}</font>
    &nbsp;&nbsp;{{currentTime}}
    <hr />
    <p>外USD金价:{{goldUsdPrice}}</p>
    <p>外RMB汇率:{{rmbHuiLv2}}</p>
    <p>外AU99计算:{{goldRMBPrice2}}</p>
    <p>内RMB汇率:{{rmbHuiLv}}</p>
    <p>昨日波动:{{yesterdayWave}}</p>
    <p>今日波动:{{todayWave}}</p>
    <p>金价增速:
      <b v-if="ccbchajia > 0" style='color:red'>{{ccbchajia}}</b>
      <b v-else-if="ccbchajia < 0" style='color:green'>{{ccbchajia}}</b>
      <b v-else>{{ccbchajia}}</b>
    </p>
    <p>
      <b style="color:red">中期目标：{{transToCCBPriceMedium}}元/克</b>
    </p>
    <p>
      <b style="color:red">长期目标：{{transToCCBPriceLong}}元/克</b>
    </p>
  </div>
</template>

<script>
import moment from "moment";
import { 
  checkTingpan,
  getGoldUsdPrice,
  getRmbHuiLv,
  transToCCBPrice,
  transToPtPrice,
  getCacheCCBPrice,
  file_get_contents,
  getPriceRange
} from "@/common/js/func";

export default {
  name: 'UserInfo',
  props: {
  },
  data() {
    return {
      sqUserName: 'Alan',
      currentTime : moment().format('YYYY-MM-DD h:mm:ss a'),
      goldUsdPrice: '111',
      rmbHuiLv2: '222',
      goldRMBPrice2: '333',
      rmbHuiLv: '444',
      yesterdayWave: '555',
      todayWave: '666',
      goldSpeedUp: '777',
      ccbchajia: '888',
      transToCCBPriceMedium: 288,
      transToCCBPriceLong: 400,
      logContent: ''
    }
  },
  methods: {
   
  },
  created() {
    // 获取日志
    // let filename = './data/logs/' + moment().format('YYYYMMDD');
    let filename = '20191114';
    file_get_contents(filename).then((response)=> {
      this.logContent = response.data || '';
      console.log(this.logContent)
    })
  },
  mounted() {
    const isTingpan = checkTingpan();  // 停盘时间
    this.goldUsdPrice = getGoldUsdPrice();  // 金价
    let [rmbHuiLv,rmbHuiLv2]= getRmbHuiLv();
    let goldRMBPrice = transToCCBPrice(this.goldUsdPrice,rmbHuiLv);;
    let goldRMBPrice2 = transToPtPrice(this.goldUsdPrice,rmbHuiLv2);
    let ccbPrice = goldRMBPrice;
		let diffPrice = (ccbPrice-goldRMBPrice).toFixed(2)
		let ccbCachePrice = getCacheCCBPrice(this.goldUsdPrice,goldRMBPrice,ccbPrice,rmbHuiLv,diffPrice);
    this.ccbchajia = (ccbPrice-ccbCachePrice).toFixed(2);
    // console.log(moment().subtract(1, 'days').format('YYYYMMDD'))
		// let priceRange = getPriceRange(logContent);
		// let junjia = sprintf("%.2f",(priceRange["minPrice"]+priceRange["maxPrice"])/2);
		// let logContent2= file_get_contents('./data/logs/' + moment().subtract(1, 'days').format('YYYYMMDD'));
		// let priceRange2 = getPriceRange(logContent2);
		// let junjia2 = sprintf("%.2f",(priceRange2["minPrice"]+priceRange2["maxPrice"])/2);
    // this.yesterdayDuration = priceRange2["minPrice"] + "-" + priceRange2["maxPrice"] + " 均:" + junjia2;
    // this.transToCCBPriceMedium = transToCCBPrice(1370, this.rmbHuiLv2); // 中期目标
  }
}
</script>

<style scoped>
</style>
