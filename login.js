// Kréta login URL
const loginUrl = 'https://idp.e-kreta.hu/connect/authorize?prompt=login&nonce=wylCrqT4oN6PPgQn2yQB0euKei9nJeZ6_ffJ-VpSKZU&response_type=code&code_challenge_method=S256&scope=openid%20email%20offline_access%20kreta-ellenorzo-webapi.public%20kreta-eugyintezes-webapi.public%20kreta-fileservice-webapi.public%20kreta-mobile-global-webapi.public%20kreta-dkt-webapi.public%20kreta-ier-webapi.public&code_challenge=HByZRRnPGb-Ko_wTI7ibIba1HQ6lor0ws4bcgReuYSQ&redirect_uri=https://mobil.e-kreta.hu/ellenorzo-student/prod/oauthredirect&client_id=kreta-ellenorzo-student-mobile-ios&state=refilc_student_mobile';

// Token kérés URL
const tokenUrl = 'https://idp.e-kreta.hu/connect/token';

// Login gomb
const loginBtn = document.getElementById('loginBtn');

// Státusz div a visszajelzéshez
const statusDiv = document.createElement('div');
statusDiv.id = 'loginStatus';
document.body.appendChild(statusDiv);

// Popup ablak referencia
let loginWindow = null;

// Időzítő a bejelentkezés ellenőrzéséhez
let loginTimer = null;

// Intervallum a popup ellenőrzéséhez
let checkPopupInterval = null;

// Event listener a login gombhoz
loginBtn.addEventListener('click', startLoginProcess);

function startLoginProcess() {
    // Új ablak megnyitása a login URL-lel
    loginWindow = window.open(loginUrl, 'KretaLogin', 'width=600,height=700');
    
    // Státusz frissítése
    updateStatus('Bejelentkezés folyamatban...', 'pending');
    
    // Időzítő indítása a bejelentkezés ellenőrzéséhez
    loginTimer = setTimeout(() => {
        updateStatus('Sikertelen bejelentkezés. Kérjük, próbálja újra.', 'error');
        if (loginWindow) loginWindow.close();
        clearInterval(checkPopupInterval);
    }, 120000); // 2 perc várakozás

    // Intervallum beállítása a popup ellenőrzéséhez
    checkPopupInterval = setInterval(checkPopupStatus, 1000); // 1 másodpercenként ellenőrizzük
}

function checkPopupStatus() {
    if (loginWindow && loginWindow.closed) {
        clearTimeout(loginTimer);
        clearInterval(checkPopupInterval);
        if (!localStorage.getItem('accessToken')) {
            updateStatus('Bejelentkezés megszakítva. Kérjük, próbálja újra.', 'error');
        }
    }
}

// Event listener az üzenetekhez
window.addEventListener('message', handleLoginMessage);

// Login üzenet kezelése
function handleLoginMessage(event) {
    // Ellenőrizzük, hogy az üzenet a várt formátumú-e
    if (event.data && typeof event.data === 'string' && event.data.startsWith('https://')) {
        const url = new URL(event.data);
        const code = url.searchParams.get('code');

        if (code) {
            getTokens(code);
            if (loginWindow) loginWindow.close();
            clearTimeout(loginTimer);
            clearInterval(checkPopupInterval);
        }
    }
}

// Tokenek beszerzése
async function getTokens(code) {
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'AuthorizationPolicy-nonce': await generateSecureNonce(),
        'AuthorizationPolicy-key': 'v3',
        'AuthorizationPolicy-version': 'v1'
    };
    const body = new URLSearchParams({
        'grant_type': 'authorization_code',
        'code': code,
        'client_id': 'kreta-ellenorzo-student-mobile-ios',
        'redirect_uri': 'https://mobil.e-kreta.hu/ellenorzo-student/prod/oauthredirect'
    });

    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: headers,
            body: body
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Access Token:', data.access_token);
            console.log('Refresh Token:', data.refresh_token);
            
            // Token tárolása Local Storage-ben
            localStorage.setItem('accessToken', data.access_token);
            localStorage.setItem('refreshToken', data.refresh_token);
            
            // Sikeres bejelentkezés jelzése
            updateStatus('Sikeres bejelentkezés!', 'success');
        } else {
            const errorData = await response.json();
            console.error('Token request failed', errorData);
            updateStatus('Hiba történt a bejelentkezés során.', 'error');
        }
        
    } catch (error) {
        console.error('Error:', error);
        updateStatus('Hiba történt a bejelentkezés során.', 'error');
    }
}

// Státusz frissítése
function updateStatus(message, status) {
    statusDiv.textContent = message;
    statusDiv.className = status;
}

// Biztonságos nonce generálása
async function generateSecureNonce() {
    const rawNonce = generateRandomNonce();
    const encoder = new TextEncoder();
    const data = encoder.encode(rawNonce);
    const hashBuffer = await crypto.subtle.digest('SHA-512', data);
    const key = '5Kmpmgd5fJ';
    const keyData = encoder.encode(key);
    const combinedBuffer = new Uint8Array(hashBuffer.byteLength + keyData.byteLength);
    combinedBuffer.set(new Uint8Array(hashBuffer), 0);
    combinedBuffer.set(keyData, hashBuffer.byteLength);
    
    return btoa(String.fromCharCode.apply(null, combinedBuffer));
}

// Véletlenszerű nonce generálása
function generateRandomNonce() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// CSS a státusz div-hez
const style = document.createElement('style');
style.textContent = `
    #loginStatus {
        padding: 10px;
        margin-top: 10px;
        border-radius: 5px;
        font-weight: bold;
    }
    #loginStatus.pending {
        background-color: #FFF3CD;
        color: #856404;
    }
    #loginStatus.success {
        background-color: #D4EDDA;
        color: #155724;
    }
    #loginStatus.error {
        background-color: #F8D7DA;
        color: #721C24;
    }
`;
document.head.appendChild(style);
