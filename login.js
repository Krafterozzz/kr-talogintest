const BaseKreta = {
    kreta: (iss) => `https://${iss}.e-kreta.hu`,
    kretaIdp: 'https://idp.e-kreta.hu',
    kretaAdmin: 'https://eugyintezes.e-kreta.hu',
    kretaFiles: 'https://files.e-kreta.hu',
};

const KretaApiEndpoints = {
    token: '/connect/token',
    revoke: '/connect/revocation',
    nonce: '/nonce',
    notes: '/ellenorzo/V3/Sajat/Feljegyzesek',
    events: '/ellenorzo/V3/Sajat/FaliujsagElemek',
    student: '/ellenorzo/V3/Sajat/TanuloAdatlap',
    grades: '/ellenorzo/V3/Sajat/Ertekelesek',
    absences: '/ellenorzo/V3/Sajat/Mulasztasok',
    groups: '/ellenorzo/V3/Sajat/OsztalyCsoportok',
    groupAverages: '/ellenorzo/V3/Sajat/Ertekelesek/Atlagok/OsztalyAtlagok',
    averages: '/ellenorzo/V3/idk',
    timetable: '/ellenorzo/V3/Sajat/OrarendElemek',
    exams: '/ellenorzo/V3/Sajat/BejelentettSzamonkeresek',
    homework: '/ellenorzo/V3/Sajat/HaziFeladatok',
    capabilities: '/ellenorzo/V3/Sajat/Intezmenyek',
    downloadHomeworkAttachments: (uid, type) => `/ellenorzo/V3/Sajat/Csatolmany/${uid}`,
    subjects: '/ellenorzo/V3/Sajat/Ertekelesek/Atlagok/TantargyiAtlagok',
};

const KretaAPI = {
    login: `${BaseKreta.kretaIdp}${KretaApiEndpoints.token}`,
    logout: `${BaseKreta.kretaIdp}${KretaApiEndpoints.revoke}`,
    nonce: `${BaseKreta.kretaIdp}${KretaApiEndpoints.nonce}`,
    clientId: 'kreta-ellenorzo-student-mobile-ios',
    
    notes: (iss) => `${BaseKreta.kreta(iss)}${KretaApiEndpoints.notes}`,
    events: (iss) => `${BaseKreta.kreta(iss)}${KretaApiEndpoints.events}`,
    student: (iss) => `${BaseKreta.kreta(iss)}${KretaApiEndpoints.student}`,
    grades: (iss) => `${BaseKreta.kreta(iss)}${KretaApiEndpoints.grades}`,
    absences: (iss) => `${BaseKreta.kreta(iss)}${KretaApiEndpoints.absences}`,
    groups: (iss) => `${BaseKreta.kreta(iss)}${KretaApiEndpoints.groups}`,
    groupAverages: (iss, uid) => `${BaseKreta.kreta(iss)}${KretaApiEndpoints.groupAverages}?oktatasiNevelesiFeladatUid=${uid}`,
    averages: (iss, uid) => `${BaseKreta.kreta(iss)}${KretaApiEndpoints.averages}?oktatasiNevelesiFeladatUid=${uid}`,
    timetable: (iss, start, end) => 
        `${BaseKreta.kreta(iss)}${KretaApiEndpoints.timetable}` +
        (start && end ? `?datumTol=${start.toISOString()}&datumIg=${end.toISOString()}` : ''),
    exams: (iss) => `${BaseKreta.kreta(iss)}${KretaApiEndpoints.exams}`,
    homework: (iss, start, id) => 
        `${BaseKreta.kreta(iss)}${KretaApiEndpoints.homework}` + 
        (id ? `/${id}` : '') + 
        (!id && start ? `?datumTol=${start.toISOString().split('T')[0]}` : ''),
    capabilities: (iss) => `${BaseKreta.kreta(iss)}${KretaApiEndpoints.capabilities}`,
    downloadHomeworkAttachments: (iss, uid, type) => 
        `${BaseKreta.kreta(iss)}${KretaApiEndpoints.downloadHomeworkAttachments(uid, type)}`,
    subjects: (iss, uid) => 
        `${BaseKreta.kreta(iss)}${KretaApiEndpoints.subjects}?oktatasiNevelesiFeladatUid=${uid}`,
};

// Usage Example
const schoolId = 'exampleSchool';
const notesUrl = KretaAPI.notes(schoolId);
console.log('Notes API URL:', notesUrl);



// Kréta login URL

const loginUrl = 'https://idp.e-kreta.hu/connect/authorize?prompt=login&nonce=wylCrqT4oN6PPgQn2yQB0euKei9nJeZ6_ffJ-VpSKZU&response_type=code&code_challenge_method=S256&scope=openid%20email%20offline_access%20kreta-ellenorzo-webapi.public%20kreta-eugyintezes-webapi.public%20kreta-fileservice-webapi.public%20kreta-mobile-global-webapi.public%20kreta-dkt-webapi.public%20kreta-ier-webapi.public&code_challenge=HByZRRnPGb-Ko_wTI7ibIba1HQ6lor0ws4bcgReuYSQ&redirect_uri=https://mobil.e-kreta.hu/ellenorzo-student/prod/oauthredirect&client_id=kreta-ellenorzo-student-mobile-ios&state=refilc_student_mobile';

// Token kérés URL
const tokenUrl = 'https://idp.e-kreta.hu/connect/token';

// Login gomb
const loginBtn = document.getElementById('loginBtn');

// Popup ablak referencia
let loginWindow = null;

// Event listener a login gombhoz
loginBtn.addEventListener('click', () => {
    // Új ablak megnyitása a login URL-lel
    loginWindow = window.open(loginUrl, 'KretaLogin', 'width=600,height=700');
});

// Event listener az üzenetekhez
window.addEventListener('message', handleLoginMessage);

// Login üzenet kezelése
function handleLoginMessage(event) {
    if (event.origin !== 'https://mobil.e-kreta.hu') return;

    const url = new URL(event.data);
    const code = url.searchParams.get('code');

    if (code) {
        getTokens(code);
        if (loginWindow) loginWindow.close();
    }
}

// Tokenek beszerzése
async function getTokens(code) {
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'AuthorizationPolicy-nonce': await generateSecureNonce('username', 'schoolcode'),
        'AuthorizationPolicy-key': 'v3',
        'AuthorizationPolicy-version': 'v1'  // Javítva v3-ról v1-re
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
            // Itt kezelheted a tokeneket, pl. eltárolhatod őket
        } else {
            console.error('Token request failed');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Biztonságos nonce generálása
async function generateSecureNonce(username, schoolCode) {
    const rawNonce = `${username.toLowerCase()}${schoolCode.toLowerCase()}${generateRandomNonce()}`;
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
