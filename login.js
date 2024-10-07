
const loginUrl = 'https://idp.e-kreta.hu/connect/authorize?prompt=login&response_type=code&code_challenge_method=S256&scope=openid%20email%20offline_access%20kreta-ellenorzo-webapi.public%20kreta-eugyintezes-webapi.public%20kreta-fileservice-webapi.public%20kreta-mobile-global-webapi.public%20kreta-dkt-webapi.public%20kreta-ier-webapi.public&redirect_uri=https://mobil.e-kreta.hu/ellenorzo-student/prod/oauthredirect&client_id=kreta-ellenorzo-student-mobile-ios';


const tokenUrl = 'https://idp.e-kreta.hu/connect/token';

const loginBtn = document.getElementById('loginBtn');

const statusDiv = document.createElement('div');
statusDiv.id = 'loginStatus';
document.body.appendChild(statusDiv);

let loginWindow = null;


let loginTimer = null;


let checkPopupInterval = null;


loginBtn.addEventListener('click', startLoginProcess);

async function startLoginProcess() {
    const nonce = await generateSecureNonce();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    const fullLoginUrl = `${loginUrl}&nonce=${nonce}&code_challenge=${codeChallenge}&state=refilc_student_mobile`;
    
  
    loginWindow = window.open(fullLoginUrl, 'KretaLogin', 'width=600,height=700');
    
  
    updateStatus('Bejelentkezés folyamatban...', 'pending');
    
    
    loginTimer = setTimeout(() => {
        updateStatus('Sikertelen bejelentkezés. Kérjük, próbálja újra.', 'error');
        if (loginWindow) loginWindow.close();
        clearInterval(checkPopupInterval);
    }, 120000); // 2 perc várakozás

   
    checkPopupInterval = setInterval(checkPopupStatus, 1000); // 1 másodpercenként ellenőrzi


    localStorage.setItem('codeVerifier', codeVerifier);
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


window.addEventListener('message', handleLoginMessage);


function handleLoginMessage(event) {
 
    if (event.data && typeof event.data === 'string' && event.data.startsWith('https://')) {
        const url = new URL(event.data);
        const code = url.searchParams.get('code');

        if (code) {
            getTokens(code);
            if (loginWindow) loginWindow.close();
            clearTimeout(loginTimer);
            clearInterval(checkPopupInterval);
        }
    } else {
        console.log("A KURVA ISTEN BASSZA MEG") // looool nem jelzi a konzolba (miert?)
    }
}

// Tokenek beszerzése
async function getTokens(code) {
    const codeVerifier = localStorage.getItem('codeVerifier');
    if (!codeVerifier) {
        console.error('Code verifier not found');
        updateStatus('Hiba történt a bejelentkezés során.', 'error');
        return;
    }

    const username = '72865338806'; // A KRÉTA felhasználónév
    const instituteCode = 'mszc-kando'; // Iskolánk kódja
    const nonce = await generateSecureNonce();
    const hmacKey = 'baSsxOwlU1jM'; // HMAC kulcs

  
    const hmacSignature = await generateHMAC(instituteCode, nonce, username, hmacKey);
    
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', 'kreta-ellenorzo-student-mobile-ios');
    params.append('code', code);
    params.append('code_verifier', codeVerifier); 
    params.append('redirect_uri', 'https://mobil.e-kreta.hu/ellenorzo-student/prod/oauthredirect'); // Redirect URI
    params.append('nonce', nonce); 
    params.append('hmac', hmacSignature); 

    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Authorizationpolicy-Key': '// Mit kene ide irni ', 
                'X-Authorizationpolicy-Version': 'v3', 
                'X-Authorizationpolicy-Nonce': nonce
            },
            body: params
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Access Token:', data.access_token);
            console.log('Refresh Token:', data.refresh_token);
            
       
            localStorage.setItem('accessToken', data.access_token);
            localStorage.setItem('refreshToken', data.refresh_token);
          
            localStorage.removeItem('codeVerifier');
            
          
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


async function generateHMAC(instituteCode, nonce, username, key) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const message = `${instituteCode}${nonce}${username}`; // Az aláírandó üzenet
    const messageData = encoder.encode(message);

  
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    
  
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
}


function updateStatus(message, status) {
    statusDiv.textContent = message;
    statusDiv.className = status;
}


async function generateSecureNonce() {
    const rawNonce = generateRandomString(32);
    const encoder = new TextEncoder();
    const data = encoder.encode(rawNonce);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}


function generateCodeVerifier() {
    return generateRandomString(128);
}


async function generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, new Uint8Array(hashBuffer)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}


function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let text = '';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}


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


// megfogom magam ölni 
