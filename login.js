
import { KRETAEncoder } from './encoder.js';
import { RequestsHandler } from './requests_handler.js';
import { IdpApiV1 } from './idp_api.js';
import { HEADERS, proxies } from './config.js';
//import { Session } from './kreta_api.js';


document.querySelector('#loginBtn').addEventListener('click', function() {

    loginUrl = "https://idp.e-kreta.hu/Account/Login?ReturnUrl=%2Fconnect%2Fauthorize%2Fcallback%3Fprompt%3Dlogin%26nonce%3DwylCrqT4oN6PPgQn2yQB0euKei9nJeZ6_ffJ-VpSKZU%26response_type%3Dcode%26code_challenge_method%3DS256%26scope%3Dopenid%2520email%2520offline_access%2520kreta-ellenorzo-webapi.public%2520kreta-eugyintezes-webapi.public%2520kreta-fileservice-webapi.public%2520kreta-mobile-global-webapi.public%2520kreta-dkt-webapi.public%2520kreta-ier-webapi.public%26code_challenge%3DHByZRRnPGb-Ko_wTI7ibIba1HQ6lor0ws4bcgReuYSQ%26redirect_uri%3Dhttps%253A%252F%252Fmobil.e-kreta.hu%252Fellenorzo-student%252Fprod%252Foauthredirect%26client_id%3Dkreta-ellenorzo-student-mobile-ios%26state%3Drefilc_student_mobile%26suppressed_prompt%3Dlogin";
    
    const popupWidth = 800;
    const popupHeight = 600;
    const left = (window.screen.width / 2) - (popupWidth / 2);
    const top = (window.screen.height / 2) - (popupHeight / 2);
    
    window.open(loginUrl, "LoginWindow", `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`);
});


class IdpApiV1 {
    static async extendToken(refresh_token, klik) {
        const refresh_token_data = {
            refresh_token: refresh_token,
            institute_code: klik,
            grant_type: "refresh_token",
            client_id: "kreta-ellenorzo-mobile-android",
            refresh_user_data: false,
        };
        const refreshTokenHeaders = { ...HEADERS };
        refreshTokenHeaders["X-AuthorizationPolicy-Key"] = KRETAEncoder.encodeRefreshToken(refresh_token);
        refreshTokenHeaders["X-AuthorizationPolicy-Version"] = "v3";
        const response = await RequestsHandler.post(
            "https://idp.e-kreta.hu/connect/token",
            refreshTokenHeaders,
            refresh_token_data,
            proxies
        );
        return response.json();
    }

    static async getNonce() {
        const response = await RequestsHandler.get("https://idp.e-kreta.hu/nonce", HEADERS);
        return response.text();
    }

    static async login(UserName, Password, klik) {
        const loginUrl = "https://idp.e-kreta.hu/Account/Login?ReturnUrl=%2Fconnect%2Fauthorize%2Fcallback%3Fprompt%3Dlogin%26nonce%3DwylCrqT4oN6PPgQn2yQB0euKei9nJeZ6_ffJ-VpSKZU%26response_type%3Dcode%26code_challenge_method%3DS256%26scope%3Dopenid%2520email%2520offline_access%2520kreta-ellenorzo-webapi.public%2520kreta-eugyintezes-webapi.public%2520kreta-fileservice-webapi.public%2520kreta-mobile-global-webapi.public%2520kreta-dkt-webapi.public%2520kreta-ier-webapi.public%26code_challenge%3DHByZRRnPGb-Ko_wTI7ibIba1HQ6lor0ws4bcgReuYSQ%26redirect_uri%3Dhttps%253A%252F%252Fmobil.e-kreta.hu%252Fellenorzo-student%252Fprod%252Foauthredirect%26client_id%3Dkreta-ellenorzo-student-mobile-ios%26state%3Drefilc_student_mobile%26suppressed_prompt%3Dlogin";
        const response = await fetch(loginUrl);
        const html = await response.text();
        const __RequestVerificationToken = html.split('<input name="__RequestVerificationToken" type="hidden" value="')[1].split('" /></form>')[0];
        const payload = `ReturnUrl=%2Fconnect%2Fauthorize%2Fcallback%3Fprompt%3Dlogin%26nonce%3DwylCrqT4oN6PPgQn2yQB0euKei9nJeZ6_ffJ-VpSKZU%26response_type%3Dcode%26code_challenge_method%3DS256%26scope%3Dopenid%2520email%2520offline_access%2520kreta-ellenorzo-webapi.public%2520kreta-eugyintezes-webapi.public%2520kreta-fileservice-webapi.public%2520kreta-mobile-global-webapi.public%2520kreta-dkt-webapi.public%2520kreta-ier-webapi.public%26code_challenge%3DHByZRRnPGb-Ko_wTI7ibIba1HQ6lor0ws4bcgReuYSQ%26redirect_uri%3Dhttps%253A%252F%252Fmobil.e-kreta.hu%252Fellenorzo-student%252Fprod%252Foauthredirect%26client_id%3Dkreta-ellenorzo-student-mobile-ios%26state%3Drefilc_student_mobile%26suppressed_prompt%3Dlogin&IsTemporaryLogin=False&UserName=${UserName}&Password=${Password}&InstituteCode=${klik}&loginType=InstituteLogin&__RequestVerificationToken=${__RequestVerificationToken}`;
        const loginResponse = await fetch("https://idp.e-kreta.hu/account/login", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: payload,
            redirect: 'manual',
        });
        const location = loginResponse.headers.get('location');
        const code = location.split('code=')[1].split('&')[0];
        const tokenData = {
            code: code,
            code_verifier: "DSpuqj_HhDX4wzQIbtn8lr8NLE5wEi1iVLMtMK0jY6c",
            redirect_uri: "https://mobil.e-kreta.hu/ellenorzo-student/prod/oauthredirect",
            client_id: "kreta-ellenorzo-student-mobile-ios",
            grant_type: "authorization_code"
        };
        const tokenResponse = await fetch("https://idp.e-kreta.hu/connect/token", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(tokenData),
        });
        return tokenResponse.json();
    }

    static async revokeRefreshToken(refresh_token) {
        const revokeRefreshTokenData = {
            token: refresh_token,
            client_id: "kreta-ellenorzo-mobile-android",
            token_type: "refresh token",
        };
        const response = await RequestsHandler.post(
            "https://idp.e-kreta.hu/connect/revocation",
            HEADERS,
            revokeRefreshTokenData,
            proxies
        );
        return response.text();
    }
}

export { IdpApiV1 };
