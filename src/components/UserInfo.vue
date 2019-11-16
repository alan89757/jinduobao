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
    <p>昨日波动:{{priceRange2['minPrice']}}-{{priceRange2['maxPrice']}} 均{{jujia2}}</p>
    <p>今日波动:{{priceRange['minPrice']}}-{{priceRange['maxPrice']}} 均{{jujia}}</p>
    <p>
      AU99当前金价:{{goldRMBPrice}}
    </p>
    <p>
      金价增速:
      <b v-if="ccbchajia > 0" style="color:red">{{ccbchajia}}</b>
      <b v-else-if="ccbchajia < 0" style="color:green">{{ccbchajia}}</b>
      <b v-else>{{ccbchajia}}</b>
    </p>
    <p>
      <b style="color:red">中期目标：{{transToCCBPriceMedium}}元/克</b>
    </p>
    <p>
      <b style="color:red">长期目标：{{transToCCBPriceLong}}元/克</b>
    </p>
    <p v-show="isTingpan">
      <h2 style='color:green'>已停盘</h2>
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
  name: "UserInfo",
  props: {},
  data() {
    return {
      sqUserName: "Alan",
      currentTime: moment().format("YYYY-MM-DD h:mm:ss a"),
      goldUsdPrice: "",
      rmbHuiLv2: "",
      goldRMBPrice: "",
      goldRMBPrice2: "",
      rmbHuiLv: "",
      yesterdayWave: "",
      todayWave: "",
      goldSpeedUp: "",
      ccbchajia: "",
      transToCCBPriceMedium: 288,
      transToCCBPriceLong: 400,
      logContent: "",
      logContent2: "",
      priceRange: "",
      priceRange2: "",
      jujia: "",
      jujia2: "",
      isTingpan: ""
    };
  },
  methods: {},
  created() {
    // 获取日志
    // let filename = './data/logs/' + moment().format('YYYYMMDD');
    let filename = "20191116.json";
    file_get_contents(filename).then(response => {
      this.logContent = response.data || "";
      this.priceRange = getPriceRange(this.logContent);
      this.jujia = (
        (this.priceRange["minPrice"] + this.priceRange["maxPrice"]) /
        2
      ).toFixed(2);

      // console.log('priceRange ' + JSON.stringify(this.priceRange))
    });

    // let filename2 = './data/logs/' + moment().subtract(1, 'days').format('YYYYMMDD');
    let filename2 = "20191115.json";
    file_get_contents(filename2).then(response => {
      this.logContent2 = response.data || "";
      this.priceRange2 = getPriceRange(this.logContent2);
      this.jujia2 = (
        (this.priceRange2["minPrice"] + this.priceRange2["maxPrice"]) /
        2
      ).toFixed(2);
      this.yesterdayDuration =
        this.priceRange2["minPrice"] +
        "-" +
        this.priceRange2["maxPrice"] +
        " 均:" +
        this.junjia2;
    });
  },
  mounted() {
    const isTingpan = checkTingpan(); // 停盘时间
    this.goldUsdPrice = getGoldUsdPrice(); // 金价
    let rmbHuiL = getRmbHuiLv();
    this.rmbHuiLv = rmbHuiL[0];
    this.rmbHuiLv2 = rmbHuiL[1];
    this.goldRMBPrice = transToCCBPrice(this.goldUsdPrice, this.rmbHuiLv);
    this.goldRMBPrice2 = transToPtPrice(this.goldUsdPrice, this.rmbHuiLv2);
    let ccbPrice = this.goldRMBPrice;
    let diffPrice = (ccbPrice - this.goldRMBPrice).toFixed(2);
    let ccbCachePrice = getCacheCCBPrice(
      this.goldUsdPrice,
      this.goldRMBPrice,
      ccbPrice,
      this.rmbHuiLv,
      diffPrice
    );
    this.ccbchajia = (ccbPrice - ccbCachePrice).toFixed(2);
    // console.log(moment().subtract(1, 'days').format('YYYYMMDD'))
    // let priceRange = getPriceRange(this.logContent);
    // let junjia = sprintf("%.2f",(priceRange["minPrice"]+priceRange["maxPrice"])/2);
    // let logContent2= file_get_contents('./data/logs/' + moment().subtract(1, 'days').format('YYYYMMDD'));
    // let priceRange2 = getPriceRange(logContent2);
    // let junjia2 = sprintf("%.2f",(priceRange2["minPrice"]+priceRange2["maxPrice"])/2);

    // this.transToCCBPriceMedium = transToCCBPrice(1370, this.rmbHuiLv2); // 中期目标
  }
};
</script>

<style scoped>
</style>
