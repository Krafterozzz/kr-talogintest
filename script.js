import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import { KRETAEncoder, RequestsHandler } from './utils';
import { HEADERS, proxies } from './config';

const app = express();
app.use(bodyParser.json());

app.get('/get_nonce', async (req, res) => {
    try {
        const response = await RequestsHandler.get("https://idp.e-kreta.hu/nonce", { headers: HEADERS });
        res.send(response.data);
    } catch (error) {
        res.status(500).send('Error fetching nonce');
    }
});

app.post('/login', async (req, res) => {
    const { username, password, klik, nonce } = req.body;

    const login_data = {
        userName: username,
        password: password,
        institute_code: klik,
        grant_type: "password",
        client_id: "kreta-ellenorzo-mobile-android",
    };

    const loginHeaders = {
        ...HEADERS,
        "X-AuthorizationPolicy-Nonce": nonce,
        "X-AuthorizationPolicy-Key": KRETAEncoder.createLoginKey(username, klik, nonce),
        "X-AuthorizationPolicy-Version": "v2",
    };

    try {
        const response = await RequestsHandler.post(
            "https://idp.e-kreta.hu/connect/token",
            { headers: loginHeaders, data: login_data, proxies: proxies }
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).send('Error during login');
    }
});

app.post('/timetable', async (req, res) => {
    let access_token = req.headers.authorization.split(' ')[1];
    const { institute_id, refresh_token } = req.body;

    const [first_day, last_day] = mondayfriday();

    const headers = {
        "Authorization": `Bearer ${access_token}`,
        "User-Agent": "hu.ekreta.tanulo/1.0.5/Android/0/0"
    };

    try {
        let response = await RequestsHandler.get(
            `https://${institute_id}.e-kreta.hu/ellenorzo/V3/Sajat/OrarendElemek?datumTol=${first_day}Z&datumIg=${last_day}Z`,
            { headers: headers }
        );

        if (response.status === 401 && refresh_token) {
            const encoder = new KRETAEncoder();
            const idp_api = new IdpApiV1(encoder);
            const nonce = await idp_api.getNonce();
            const new_token_response = await idp_api.extendToken(refresh_token, institute_id, nonce);

            access_token = new_token_response.access_token;
            headers.Authorization = `Bearer ${access_token}`;
            response = await RequestsHandler.get(
                `https://${institute_id}.e-kreta.hu/ellenorzo/V3/Sajat/OrarendElemek?datumTol=${first_day}Z&datumIg=${last_day}Z`,
                { headers: headers }
            );
        }

        res.json(response.data);
    } catch (error) {
        res.status(500).send('Error fetching timetable');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
