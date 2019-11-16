
import moment from "moment";
import { request } from "./request";

const fs = require('fs');

export function checkTingpan() {
	const $w = moment().weekday();
	const $hm = "" + moment().hour() + moment().minute();
	if (($w == 6 && $hm > "0530") || $w == 0 || ($w == 1 && $hm < "0555")) {
		return true;
	} else if ($hm > "0530" && $hm < "0555") {
		return true;
	} else {
		return false;
	}
}

// 获取金价
export function getGoldUsdPrice() {
	request({
		url: 'http://localhost:9090/getGoldUsdPrice',
		params: {
			exchName: 'WGJS',
			symbol: 'XAU',
			st: '0.7231593003962189'
		}
	})
	// const $goldApi = "http://api.q.fx678.com/getQuote.php?exchName=WGJS&symbol=XAU&st=0.7231593003962189";
	// request({
	// 	url: $goldApi
	// })
	return 1285;
}

// 获取人名币汇率
export function getRmbHuiLv() {
	// $rmbApi = "http://api.q.fx678.com/getQuote.php?exchName=WH&st=0.8940290887840092";
	// $jsonData = curl_httpd($rmbApi);
	// $data = json_decode($jsonData,true);
	// $huilvData = array();
	// foreach($data['i'] as $key=>$vo){
	// 		$huilvData[$vo] = $data['c'][$key];
	// }
	// $rmbHuiLv  = empty($huilvData['USDCNY'])?0:$huilvData['USDCNY'];
	// $rmbHuilv2 = empty($huilvData['USDCNH'])?0:$huilvData['USDCNH'];
	// return array($rmbHuiLv,$rmbHuilv2);
	return [7,8];
}

// 千分位格式化数据
export function transToCCBPrice(goldUsdPrice,rmbHuilv,code="01"){
	return String((goldUsdPrice*rmbHuilv/31.1034768+0.4).toFixed(2)).replace(/\B(?=(\d{3})+$)/g,',')
}

// 千分位格式化数据
export function transToPtPrice(goldUsdPrice, rmbHuilv){
	return String((goldUsdPrice*rmbHuilv/31.1034768+1.1).toFixed(2)).replace(/\B(?=(\d{3})+$)/g,',')
}

// 
export function getCacheCCBPrice($goldUsdPrice,$goldRMBPrice,$ccbPrice,$rmbHuiLv,$diffPrice){ 
	return 111;  
}

// 读取文件
export function file_get_contents(filename) {
	return request({
		url: 'http://localhost:9090/getDataLogs',
		params: {
			filename: filename
		}
	});
}


export function getPriceRange(arr){
	let result = {
		minPrice: arr[0]['goldprice'],
		maxPrice: arr[0]['goldprice']
	}
	for (let i = 0; i < arr.length; i++) {
		if(arr[i]['goldprice'] > result.maxPrice) 
			result.maxPrice = arr[i]['goldprice'];
		if(arr[i]['goldprice'] < result.minPrice) 
			result.minPrice = arr[i]['goldprice'];
	}
	return result;
}

export function showMonthRange($start, $end){
	// $end = date('Ym', strtotime($end)); // 转换为月
	// $range = [];
	// $i = 0;
	// do {
	// 	$month = date('Y-m-01', strtotime($start . ' + ' . $i . ' month'));
	// 	//echo $i . ':' . $month . '<br>';
	// 	$range[] = $month;
	// 	$i++;
	// } while ($month < $end && $month< date('Y-m-01'));

	// return $range;
	return '';
}