import CryptoJS from 'crypto-js';

class KRETAEncoder {
    static KeyProd = CryptoJS.enc.Utf8.parse("baSsxOwlU1jM");

    static encodeRefreshToken(refreshToken) {
        return this.encodeKey(refreshToken);
    }
    
    static createLoginKey(userName, klik, nonce) {
        const loginKeyPayload = klik.toUpperCase() + nonce + userName.toUpperCase();
        return this.encodeKey(loginKeyPayload);
    }

    static encodeKey(payload) {
        const hmac = CryptoJS.HmacSHA512(payload, this.KeyProd);
        return CryptoJS.enc.Base64.stringify(hmac);
    }
}

export { KRETAEncoder };