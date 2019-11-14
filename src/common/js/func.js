
import moment from "moment";
import { request } from "./request";

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

export function getGoldUsdPrice() {
	const $goldApi = "http://api.q.fx678.com/getQuote.php?exchName=WGJS&symbol=XAU&st=0.7231593003962189";
	request({
		url: $goldApi
	})
}