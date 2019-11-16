
import Axios from "axios";


export function request(param) {
  return Axios.get(param.url, {
    params: {
      ...param.params
    }
  });
}

