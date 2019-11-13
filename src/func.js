<?php
date_default_timezone_set('Asia/Chongqing');
//模拟登录 
function jdb_login_post($url, $cookie, $post) { 
    $curl = curl_init();//初始化curl模块 
    curl_setopt($curl, CURLOPT_URL, $url);//登录提交的地址
	//对认证证书来源的检查，0表示阻止对证书的合法性的检查。  
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);  
    //从证书中检查SSL加密算法是否存在  
    curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, false);   
    curl_setopt($curl, CURLOPT_HEADER, 0);//是否显示头信息 
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);//是否自动显示返回的信息 
    curl_setopt($curl, CURLOPT_COOKIEJAR, $cookie); //设置Cookie信息保存在指定的文件中 
    curl_setopt($curl, CURLOPT_POST, 1);//post方式提交 
    curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($post));//要提交的信息 
    $data = curl_exec($curl);//执行cURL 
    curl_close($curl);//关闭cURL资源，并且释放系统资源 
	return $data;
} 
//登录成功后获取数据 
function jdb_get_content($url, $cookie) {
    $curl = curl_init(); 
    curl_setopt($curl, CURLOPT_URL, $url); 
	//对认证证书来源的检查，0表示阻止对证书的合法性的检查。  
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);  
    //从证书中检查SSL加密算法是否存在  
    curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, false);   
    curl_setopt($curl, CURLOPT_HEADER, 0); 
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1); 
    curl_setopt($curl, CURLOPT_COOKIEFILE, $cookie); //读取cookie 
    $rs = curl_exec($curl); //执行cURL抓取页面内容 
    curl_close($curl); 
    return $rs; 
} 

function jdbLogin(){
	$cookie_dir = './data/cookie';
	if(!is_dir($cookie_dir)){
	    mkdir($cookie_dir,0777,true);
	}
	if(empty($_SESSION['jdbUserId']) || empty($_SESSION['jdbPassword'])){
	   echo '登录参数异常';
	   return ;
	}
	$cookie = $cookie_dir.'/cookie_'.$_SESSION['jdbUserId'];
	$_SESSION['jdbCookie'] = $cookie;	  
	$login_url = "https://old.maihuangjin.com/user/login";	
	$post['user.username']= $_SESSION['jdbUserId'];
	$post['user.password']= $_SESSION['jdbPassword'];
	$res = jdb_login_post($login_url,$cookie,$post);
	$res = (array)json_decode($res);
	if(!empty($res['url'])){
	   $res['status'] = 1;
	}else{
	   $res['status'] = 0;
	}
	
	return $res;
}
function get_user_account(){
    $cookie = $_SESSION['jdbCookie'];
	$data = array('totalMoney'=>-1);
    $url='https://old.maihuangjin.com/user/showAccountDetail';
	$content = jdb_get_content($url,$cookie);
	if(!$content){
	   jdbLogin();
	   $content = jdb_get_content($url,$cookie);	   
	}
    if($content){
	   @preg_match('/<p>账户资产净值(.*?)<p class="a-a-m-p">(.*?)<\/p>/is',$content,$array);
	   if(isset($array[2]) && is_numeric(str_replace(',','',$array[2]))){
	      $data['totalMoney'] = str_replace(',','',$array[2]);
	   }
	}
	return $data;
}

function write_trades_log_page($page,$page_size = 300){
    $cookie = $_SESSION['jdbCookie'];
	$log_file = "./data/trades/buy-". $_SESSION['jdbUserId'].'-'.$page;
	//$sold_url = "https://old.maihuangjin.com/gold-record/tradeRecord?recordType=GOLD&beginTime={$begin_time}&endTime={$end_time}&tradeType=203_401&page.size={$page_size}";
	$url = "https://old.maihuangjin.com/gold-record/tradeRecord?recordType=GOLD&tradeType=203_401&page.current={$page}&page.size={$page_size}";
	$content = jdb_get_content($url,$cookie);
	if(!$content){
	   jdbLogin();
	   $content = jdb_get_content($url,$cookie);	   
	}
	$datalist = array();
	preg_match("/id=\"aside-footer-table\">(.*?)<\/table>/is",$content,$arr);
	if(!empty($arr[1])){
	   preg_match_all("/<tr>(.*?)<\/tr>/is",$arr[1],$arr2);
	   if(!empty($arr2[1])){
		  foreach($arr2[1] as $key=>$vo){
			 if($key==0){
				continue;
			 }
			 preg_match_all("/<td>(.*?)<\/td>/is",$vo,$arr3);
			 if(!empty($arr3[1])){
				$data = array();
				$data['sn'] = $arr3[1][0];
				$data['create_time'] = $arr3[1][1];
				$data['sold_weight'] = str_replace(',','',$arr3[1][2])/1000;
				$data['sold_amount'] = str_replace(',','',$arr3[1][3])/1;
				$data['sold_price'] =  $arr3[1][4]/1;
				$data['buy_price'] =  $arr3[1][5]/1;				
				$data['sold_fee'] =  str_replace(',','',$arr3[1][6])/1;
				$data['money'] =  ($data['sold_price']-$data['buy_price'])*$data['sold_weight']-$data['sold_fee'];  
				$datalist[] = $data;
			 }		  
		  }		
		  if(!empty($datalist)){
		      $tradeList = serialize($datalist);
			  @file_put_contents($log_file,$tradeList);
		  } 

	   }
	}	
	return $datalist;
}
function write_trades_log_all($page_total,$page_size){
   $datalist = array();
   for($page=1;$page<=$page_total;$page++){
       write_trades_log_page($page,$page_size);
       $log_file = "./data/trades/buy-". $_SESSION['jdbUserId'].'-'.$page;
	   if(file_exists($log_file)){
          $tradeData = file_get_contents($log_file);
	      $tradeData= @unserialize($tradeData);
	      if(!empty($tradeData) && is_array($tradeData)){
        	  $datalist = !empty($datalist)?array_merge($datalist,$tradeData):$tradeData;
		  }
	   }else{
	      break;
	   }
   }   
   if(!empty($datalist)){
	   $log_file = "./data/trades/buyall-". $_SESSION['jdbUserId'];
	   file_put_contents($log_file,@serialize($datalist));
   }
   return $datalist;
}
function calc_sold_money($begin_time,$end_time){
  $log_file = "./data/trades/buyall-". $_SESSION['jdbUserId'];
  $datalist = @file_get_contents($log_file);
  $datalist = @unserialize($datalist);
  $money = 0;
  if(is_array($datalist)){
	  foreach($datalist as $data){
		 if($data['create_time']>=$begin_time && $data['create_time']<$end_time){
			  $money += $data['money']; 
		 } 
	  }
  }
  return sprintf("%.2f",$money);
}
function get_weekdate_begin(){
   $w = date("w");
   if($w==0){
      $date = date("Y-m-d",strtotime("-7 day"));
   }else if($w==1){
      $date = date("Y-m-d");
   }else {
      $d = $w-1;
      $date = date("Y-m-d",strtotime("-{$d} day"));
   }
   return $date;
}
function get_yejitongji_html(){   
    if(date("Hi")>='0140' && date("Hi")<='0201'){
	    return '.......';
	}
	$jdbUserName = empty($_SESSION['jdbUserName'])?$_SESSION['jdbUserId']:$_SESSION['jdbUserName'];
    $shtml = "<font color='green'>{$jdbUserName}</font>的业绩统计：<hr/>";
	$m = date("m");
	$y = date("Y");
	if(write_trades_log_all(60,200)){
	
	}else if(write_trades_log_all(2,100)){	
	
	}else if(write_trades_log_all(2,50)){
	
	}else if(write_trades_log_all(3,20)){
	
	}else {
	    write_trades_log_all(2,10);
	}
	$accountData = get_user_account();
	$tj_m = 36;
	$money_total = 0;
    $biginDate = date("Y-m-01",strtotime("-{$tj_m} months"));
	$endDate = date("Y-m-01");
	$rangeList = showMonthRange($biginDate,$endDate);
	foreach($rangeList as $i=>$date){	
        $date1 = $date;
		$date2 = !empty($rangeList[$i+1])?$rangeList[$i+1]:date("Y-m-d");
		$money = calc_sold_money($date1,$date2);
		$money_total += $money;
		$time = strtotime($date);
		$txtTime = date("Y",$time)."年".date("m",$time)."月份";
		$shtml.= $txtTime."盈利：".$money."元<br/>";
	}	
	$shtml.= '最近'.$tj_m.'个月总盈利:'.$money_total."元<br/>";
	$week_begin = get_weekdate_begin();
	$week_end = date("Y-m-d",strtotime("+1 day"));
	$week_money = calc_sold_money($week_begin,$week_end);
    $shtml.= '本周盈利:'.$week_money."元<br/>";	
	$shtml.= '总资金:'.$accountData['totalMoney']."元<br/>";
	$shtml.= "<h3 style='color:green;'>统计时间：".date("Y-m-d H:i:s")."</h3>";
	//$content = ob_jdb_get_contents();	
	//ob_clean();
	return $shtml;
}

/////////////


function checkTingpan(){
    $w = date("w");
	$hm = date('Hm');
	if(($w==6 && $hm>"0530") || $w==0 || ($w==1 && $hm<"0555")){
	    return true;
	}else if($hm>"0530" && $hm<"0555"){
	    return true;
	}else 
    return false;
}
function get_client_ip(){
	if (getenv("HTTP_CLIENT_IP") && strcasecmp(getenv("HTTP_CLIENT_IP"), "unknown")){
	    $ip = getenv("HTTP_CLIENT_IP");
	}else if (getenv("HTTP_X_FORWARDED_FOR") && strcasecmp(getenv("HTTP_X_FORWARDED_FOR"), "unknown")){
	    $ip = getenv("HTTP_X_FORWARDED_FOR");
	}else if (getenv("REMOTE_ADDR") && strcasecmp(getenv("REMOTE_ADDR"), "unknown")){
		$ip = getenv("REMOTE_ADDR");
	}else if (isset($_SERVER['REMOTE_ADDR']) && $_SERVER['REMOTE_ADDR'] && strcasecmp($_SERVER['REMOTE_ADDR'], "unknown")){
		$ip = $_SERVER['REMOTE_ADDR'];
	}else{
		$ip = "unknown";	
	}
	return $ip;
}
function curl_httpd($url,$user_agent='',$refer=''){
	$ci = curl_init();
	$user_agent = ($user_agent==''||$user_agent=='baidu')?"Baiduspider+(+http://www.baidu.com/search/spider.htm)":$user_agent;
	$refer=$refer==''?"http://www.baidu.com":$refer;
	$ip ='113.128.18.'.rand(1,255);  
	$ips=array('X-FORWARDED-FOR:'.$ip, 'CLIENT-IP:'.$ip);
    curl_setopt($ci, CURLOPT_HTTPHEADER,$ips);
	curl_setopt($ci, CURLOPT_URL, $url);
	curl_setopt($ci, CURLOPT_HEADER, false);
	curl_setopt($ci, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ci, CURLOPT_REFERER,$refer);
	curl_setopt($ci, CURLOPT_USERAGENT, $user_agent);
	curl_setopt($ci, CURLOPT_SSL_VERIFYPEER, false); 
	$data=curl_exec($ci);
	curl_close($ci);	
	return $data;
}
//echo curl_httpd("http://api.q.fx678.com/histories.php?symbol=XAU&limit=1&resolution=5&codeType=5c00&st=0.6907079662196338");
//echo curl_httpd("http://api.q.fx678.com/getQuote.php?exchName=WGJS&symbol=XAU&st=0.722035625949502");
function getGoldUsdPrice(){
	$goldApi = "http://api.q.fx678.com/getQuote.php?exchName=WGJS&symbol=XAU&st=0.7231593003962189";
	$jsonData = curl_httpd($goldApi);
	$data = json_decode($jsonData,true);	
	return empty($data['c'][0])?0:$data['c'][0]; 
}
function getPtUsdPrice(){
	$goldApi = "http://api.q.fx678.com/getQuote.php?exchName=WGJS&symbol=XAP&st=0.7231593003962189";
	//$goldApi = "http://api.q.fx678.com/getQuote.php?exchName=WGJS&st=0.7231593003962189";
	$jsonData = curl_httpd($goldApi);
	$data = json_decode($jsonData,true);
	return empty($data['c'][0])?0:$data['c'][0]; 	
}
function getRmbHuiLv(){
    //$rmbHuiLv = @file_get_contents("rmbHuiLv.txt");
	//$time = date("H");
	//if(empty($rmbHuiLv)){
	    $rmbApi = "http://api.q.fx678.com/getQuote.php?exchName=WH&st=0.8940290887840092";
		$jsonData = curl_httpd($rmbApi);
		$data = json_decode($jsonData,true);
		$huilvData = array();
		foreach($data['i'] as $key=>$vo){
		    $huilvData[$vo] = $data['c'][$key];
		}
		$rmbHuiLv  = empty($huilvData['USDCNY'])?0:$huilvData['USDCNY'];
		$rmbHuilv2 = empty($huilvData['USDCNH'])?0:$huilvData['USDCNH'];
		//file_put_contents("rmbHuiLv.txt",$rmbHuilv);
	//}
	return array($rmbHuiLv,$rmbHuilv2);	
}
function getMJBPrice(){
   $url = "https://www.maijinbei.com/getPrice.do";
   $jsonData = curl_httpd($url);
   $data = json_decode($jsonData,true);
   if($data['resultCode']==200){
      return $data['content'];
   }
   return 0;
}
function getJDBPrice($goldRMBPrice){ 
     global $goldUsdPrice,$rmbHuiLv,$sqUserName;
	 $jdbPrice = @file_get_contents("./data/logs/jinjia");
	 if(!empty($jdbPrice)){	
	    $lastTime = @filemtime("./data/logs/jinjia");		 	
		if(abs($goldRMBPrice-$jdbPrice)<0.12 && abs(time()-$lastTime)<30){
			return $jdbPrice;
		}
	}
	$api = "https://old.maihuangjin.com/mobile/";
	$data = curl_httpd($api);
	if(isset($data[100])){	
	
	    if(preg_match("/<em>(.*?)<\/em>元\/克/is",$data,$arr) && !empty($arr[1])){
		     $logFile = './data/logs/'.date("Ymd");
			 if(!is_dir('./data/logs')) mkdir('./data/logs');
			 $arr[1] = trim($arr[1]);
			 $flag = false;
			 $date = date("H:i:s");
			 $hi = date('H:i');
			// if(($hi>='19:00' && $hi<='24:00') || ($hi<='02:00' && $hi>='00:00')){
			     //$ip = get_client_ip();
			     //$date .= '/'.$sqUserName;
			 //}
			 $goldUsdPrice = sprintf("%.2f",$goldUsdPrice);
		     if(!file_exists($logFile)){
			     file_put_contents_ext($logFile,'{'.$arr[1].','.$goldRMBPrice.','.$rmbHuiLv.','.$goldUsdPrice.','.$date.'}'."\r");
				 $flag = true;
			 }else if(!empty($jdbPrice) && !empty($arr[1]) && $jdbPrice!=$arr[1]){		     
			     file_put_contents_ext($logFile,'{'.$arr[1].','.$goldRMBPrice.','.$rmbHuiLv.','.$goldUsdPrice.','.$date.'}'."\r");
				 $flag = true;
			 }else if(!file_exists("./data/logs/jinjia")){
			     $flag = true;
			 }
			 $jdbPrice = $arr[1];
			 if($flag == true){
				 @file_put_contents("./data/logs/jinjia",$jdbPrice);
			 }
		}
	}  
	return $jdbPrice;  
}
function file_put_contents_ext($file,$content){
   $time = @filemtime($file);
   if(time()-$time<=2){
	  return;
   }
   $str='';
   if(file_exists($file)){
       $content .= file_get_contents($file);
   }
   file_put_contents($file,$content);
}
function tree_logs($directory,$data) 
{ 
	$mydir = dir($directory); 
	while($file = $mydir->read())
	{ 
		if((is_dir("$directory/$file")) AND ($file!=".") AND ($file!="..")) 
		{
			tree("$directory/$file",$data); 
		}else if(($file!=".") AND ($file!="..")){
		   $data[]= $file;		  
		} 
	} 
	$mydir->close(); 
	return $data;
} 

function getBuyRecord($goodsId=49,$page=1,$pagesize=1000){
   //$pagesize = $pagesize>10000?10000:$pagesize;
   $listApi = "https://old.maihuangjin.com/gold-record/buyRecord?page.current={$page}&page.size={$pagesize}"; 
   if($goodsId>0){
      $listApi .= "&goodsId={$goodsId}"; 
   }
   //echo $listApi;
   $jsonData = curl_httpd($listApi);
   return json_decode($jsonData,true);
}
function getUserName($code){
   $user_list['153****2063']= '<b style="color:blue">李平</b>';
   $user_list['159****7534'] = '<b style="color:#9932CC">高朋</b>';
   $user_list['159****4246'] = '<b style="color:red">马文柱</b>';
   $user_list['182****0365'] = '<b style="color:green">小强</b>';//伍英俊
   $user_list['133****8921'] = '<b style="color:blue">大强</b>';//老罗   
   $user_list['130****8745'] = '<b style="color:blue">梁荣军2</b>';
   $user_list['176****6307'] = '<b style="color:blue">梁荣军</b>';
   $user_list['136****6711'] = '<b style="color:green">徐文海</b>';
   $user_list['176****5083'] = '<b style="color:blue">王锦</b>';
   $user_list['185****3051'] = '<b style="color:red">南丽</b>';
   $user_list['136****4285'] = '<b style="color:#FF00FF">刘姣</b>';
   $user_list['138****4679'] = '<b style="color:#9932CC">潭碧玉</b>';
   $user_list['158****1221'] = '<b style="color:#D2691E">梁全升</b>';
   $user_list['185****9326'] = '<b style="color:#D2691E">刘林燕</b>';
   $user_list['136****8071'] = '<b style="color:#D2691E">汪文刚</b>';
   $user_list['137****7144'] = '<b style="color:red">肖承勇</b>';
   if(!in_array($_COOKIE['sqUserName'],array('高朋','徐文海','李平','梁荣军'))){
      //$user_list = array();
   }
   if(isset($user_list[$code])){
      return $user_list[$code];
   }else{
      return $code;
   }
}

function transToCCBPrice($goldUsdPrice,$rmbHuilv,$code="01"){
   return number_format($goldUsdPrice*$rmbHuilv/31.1034768+0.4,2);
}
function transToPtPrice($goldUsdPrice,$rmbHuilv){
   return number_format($goldUsdPrice*$rmbHuilv/31.1034768+1.1,2);
}
function xmlToArray($xml){  
	//禁止引用外部xml实体  
	libxml_disable_entity_loader(true);  
	$xmlstring = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);  
	$val = json_decode(json_encode($xmlstring),true);  
	return $val;  
} 
function getCCBPriceList(){
	$goldApi = 'http://gold1.ccb.com/cn/home/news/zhgjs_new.xml';
	$xmlData = curl_httpd($goldApi);
	$xmlData = xmlToArray($xmlData);
	$productList = array();
	if(!empty($xmlData['ReferencePriceSettlement'])){
		foreach($xmlData['ReferencePriceSettlement'] as $vo){
			$productList[$vo['PM_Txn_Vrty_Cd']] = array(
			  'code'=>$vo['PM_Txn_Vrty_Cd'],
			  'buy_price'=>$vo['Cst_Buy_Prc'],
			  'sell_price'=>$vo['Cst_Sell_Prc'],
			);
		}
	}
	return $productList;
}
function getCCBPrice($priceList,$code="01"){
	$price = 0;
	if(isset($priceList[$code])){
		$price = $priceList[$code]['buy_price'];
	}
	return $price;
}
function getCacheCCBPrice($goldUsdPrice,$goldRMBPrice,$ccbPrice,$rmbHuiLv,$diffPrice){ 
	$jinjiaFile = './data/logs/jinjia';
	$logFile = './data/logs/'.date("Ymd");
	$cacheCCBPrice = @file_get_contents($jinjiaFile);
	if(!empty($cacheCCBPrice)){	
		//$lastTime = @filemtime($jinjiaFile);		 	
		if(abs($ccbPrice-$cacheCCBPrice)<0.10 && file_exists($logFile)){
			return $cacheCCBPrice;
		}
	}

	if($rmbHuiLv<=0 || $ccbPrice<=10 ||$goldUsdPrice<=0){
	    return $cacheCCBPrice; 
	}
	$cacheCCBPrice = $ccbPrice;
	$diffPrice = $diffPrice>0?'+'.$diffPrice:$diffPrice;
	if(!is_dir('./data/logs')) mkdir('./data/logs');
	$flag = false;
	$date = date("H:i:s");	
	$goldUsdPrice = sprintf("%.2f",$goldUsdPrice);
	file_put_contents_ext($logFile,'{'.$ccbPrice.','.$goldRMBPrice.','.$rmbHuiLv.','.$goldUsdPrice.','.$date.'}'."\r\n");
	@file_put_contents($jinjiaFile,$cacheCCBPrice);
	return $cacheCCBPrice;  
}
function getCachePtPrice($goldUsdPrice,$goldRMBPrice,$ccbPrice,$rmbHuiLv,$diffPrice){ 
	$jinjiaFile = './data/logs/jinjia';
	$logFile = './data/logs/'.date("Ymd");
	$cacheCCBPrice = @file_get_contents($jinjiaFile);
	if(!empty($cacheCCBPrice)){	
		//$lastTime = @filemtime($jinjiaFile);		 	
		if(abs($ccbPrice-$cacheCCBPrice)<0.30 && file_exists($logFile)){
			return $cacheCCBPrice;
		}
	}

	if($rmbHuiLv<=0 || $ccbPrice<=10 ||$goldUsdPrice<=0){
	    return $cacheCCBPrice; 
	}
	$cacheCCBPrice = $ccbPrice;
	$diffPrice = $diffPrice>0?'+'.$diffPrice:$diffPrice;
	if(!is_dir('./data/logs')) mkdir('./data/logs');
	$flag = false;
	$date = date("H:i:s");	
	$goldUsdPrice = sprintf("%.2f",$goldUsdPrice);
	file_put_contents_ext($logFile,'{'.$ccbPrice.','.$goldRMBPrice.','.$rmbHuiLv.','.$goldUsdPrice.','.$date.'}'."\r\n");
	@file_put_contents($jinjiaFile,$cacheCCBPrice);
	return $cacheCCBPrice;  
}
function getPriceRange($str){
	$result = array("minPrice"=>0,"maxPrice"=>0);
	if(preg_match_all("/\{(.*?)\,/is",$str,$arr)){
	   $result['minPrice'] = min($arr[1]);
	   $result['maxPrice'] = max($arr[1]);
	}
	return $result;
}
function showMonthRange($start, $end){
	 $end = date('Ym', strtotime($end)); // 转换为月
	 $range = [];
	 $i = 0;
	 do {
		 $month = date('Y-m-01', strtotime($start . ' + ' . $i . ' month'));
		 //echo $i . ':' . $month . '<br>';
		 $range[] = $month;
		 $i++;
	 } while ($month < $end && $month< date('Y-m-01'));

	 return $range;
}
?>