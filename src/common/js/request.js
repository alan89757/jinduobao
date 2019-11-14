
import Axios from "axios";



export function request(params) {
  Axios.get(params.url).then((data)=> {
    window.console.log(data)
  })
}