import axios from 'axios';

// 🚀 DİKKAT: Telefonunun bilgisayarına bağlanabilmesi için kendi Wi-Fi IP adresini (eski çalışan adresini) girdik.
// İleride sunucuya yüklediğimizde buraya sadece "https://vestify-api.com/api/v1" yazacağız ve tüm sistem tek tıkla değişecek.
const BASE_URL = 'http:///10.87.14.78:8080/api/v1'; 

export const apiClient = axios.create({
  baseURL: BASE_URL,
  // DİKKAT: Content-Type kısmını sildik! Axios, veri gönderirken (POST) bunu otomatik ayarlayacak, 
  // GET isteklerinde ise gereksiz yere Java'nın kafasını karıştırmayacak.
});