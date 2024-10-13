
import { AUTH_HEADER, URL } from './config.js';
import { RequestsHandler } from './requests_handler.js';
import jwt from 'jsonwebtoken';
import { IdpApiV1 } from './idp_api.js';
class Session {
    constructor(access_token, refresh_token, auto_revoke) {
        this.access_token = access_token;
        this.refresh_token = refresh_token;
        this.headers = { ...AUTH_HEADER };
        this.headers["Authorization"] = this.headers["Authorization"].replace('{}', this.access_token);
        this.auto_revoke = auto_revoke;
    }

    async close() {
        try {
            await IdpApiV1.revokeRefreshToken(this.refresh_token);
            this.refresh_token = null;
            this.access_token = null;
            this.headers = { ...AUTH_HEADER };
        } catch (error) {
            console.error("Error closing session:", error);
        }
    }

    static async login(userName, password, klik, auto_revoke = true, bypass_format = false) {
        let _userName, _password, _klik;

        if (!bypass_format) {
            try {
                _userName = userName.toString().replace(/\D/g, '');
                _password = userName.toString().replace(/\D/g, '').match(/.{1,2}/g).join('-');
                _klik = `klik${klik.toString().replace(/\D/g, '')}`;
            } catch (error) {
                console.warn("Invalid format: please consider enabling bypass_format. (sometimes the format is not followed)");
                _userName = userName;
                _password = password;
                _klik = klik;
            }
        } else {
            _userName = userName;
            _password = password;
            _klik = klik;
        }

        const login_info = await IdpApiV1.login(_userName, _password, _klik);
        return new Session(login_info.access_token, login_info.refresh_token, auto_revoke);
    }

    getKlik() {
        return jwt.decode(this.access_token, { complete: false })["kreta:institute_code"];
    }

    getUrl() {
        return URL.replace('{klik}', this.getKlik());
    }

    async refresh() {
        const klik = this.getKlik();
        const r = await IdpApiV1.extendToken(this.refresh_token, klik);
        this.access_token = r.access_token;
        this.refresh_token = r.refresh_token;
        this.headers = { ...AUTH_HEADER };
        this.headers["Authorization"] = this.headers["Authorization"].replace('{}', this.access_token);
    }

    async deleteBankAccountNumber() {
        try {
            return await RequestsHandler.delete(`${this.getUrl()}/sajat/Bankszamla`, this.headers);
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.delete(`${this.getUrl()}/sajat/Bankszamla`, this.headers);
        }
    }

    async deleteReservation(uid) {
        try {
            return await RequestsHandler.delete(`${this.getUrl()}/sajat/Fogadoorak/Idopontok/Jelentkezesek/${uid}`, this.headers);
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.delete(`${this.getUrl()}/sajat/Fogadoorak/Idopontok/Jelentkezesek/${uid}`, this.headers);
        }
    }

    async downloadAttachment(uid) {
        try {
            return await RequestsHandler.get(`${this.getUrl()}/sajat/Csatolmany/${uid}`, this.headers);
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.get(`${this.getUrl()}/sajat/Csatolmany/${uid}`, this.headers);
        }
    }

    async getAnnouncedTestsByUids(Uids = null) {
        try {
            return await RequestsHandler.get(`${this.getUrl()}/sajat/BejelentettSzamonkeresek`, this.headers, { Uids });
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.get(`${this.getUrl()}/sajat/BejelentettSzamonkeresek`, this.headers, { Uids });
        }
    }

    async getAnnouncedTestsByDate(datumTol = null, datumIg = null) {
        try {
            return await RequestsHandler.get(`${this.getUrl()}/sajat/BejelentettSzamonkeresek`, this.headers, { datumTol, datumIg });
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.get(`${this.getUrl()}/sajat/BejelentettSzamonkeresek`, this.headers, { datumTol, datumIg });
        }
    }

    async getClassAverage(oktatasiNevelesiFeladatUid, tantargyUid = null) {
        try {
            return await RequestsHandler.get(`${this.getUrl()}/sajat/Ertekelesek/Atlagok/OsztalyAtlagok`, this.headers, { oktatasiNevelesiFeladatUid, tantargyUid });
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.get(`${this.getUrl()}/sajat/Ertekelesek/Atlagok/OsztalyAtlagok`, this.headers, { oktatasiNevelesiFeladatUid, tantargyUid });
        }
    }

    async getClassMaster(Uids) {
        try {
            return await RequestsHandler.get(`${this.getUrl()}/felhasznalok/Alkalmazottak/Tanarok/Osztalyfonokok`, this.headers, { Uids });
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.get(`${this.getUrl()}/felhasznalok/Alkalmazottak/Tanarok/Osztalyfonokok`, this.headers, { Uids });
        }
    }

    async getConsultingHour(uid) {
        try {
            return await RequestsHandler.get(`${this.getUrl()}/sajat/Fogadoorak/${uid}`, this.headers);
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.get(`${this.getUrl()}/sajat/Fogadoorak/${uid}`, this.headers);
        }
    }

    async getConsultingHours(datumTol = null, datumIg = null) {
        try {
            return await RequestsHandler.get(`${this.getUrl()}/sajat/Fogadoorak`, this.headers, { datumTol, datumIg });
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.get(`${this.getUrl()}/sajat/Fogadoorak`, this.headers, { datumTol, datumIg });
        }
    }

    async getDeviceGivenState() {
        try {
            const response = await RequestsHandler.get(`${this.getUrl()}/TargyiEszkoz/IsEszkozKiosztva`, this.headers);
            return response === 'true';
        } catch (error) {
            await this.refresh();
            const response = await RequestsHandler.get(`${this.getUrl()}/TargyiEszkoz/IsEszkozKiosztva`, this.headers);
            return response === 'true';
        }
    }

    async getEvaluations() {
        try {
            return await RequestsHandler.get(`${this.getUrl()}/sajat/Ertekelesek`, this.headers);
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.get(`${this.getUrl()}/sajat/Ertekelesek`, this.headers);
        }
    }

    async getGroups() {
        try {
            return await RequestsHandler.get(`${this.getUrl()}/sajat/OsztalyCsoportok`, this.headers);
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.get(`${this.getUrl()}/sajat/OsztalyCsoportok`, this.headers);
        }
    }

    async getGuardian4T() {
        try {
            return await RequestsHandler.get(`${this.getUrl()}/sajat/GondviseloAdatlap`, this.headers);
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.get(`${this.getUrl()}/sajat/GondviseloAdatlap`, this.headers);
        }
    }

    async getHomework(id) {
        try {
            return await RequestsHandler.get(`${this.getUrl()}/sajat/HaziFeladatok/${id}`, this.headers);
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.get(`${this.getUrl()}/sajat/HaziFeladatok/${id}`, this.headers);
        }
    }

    async getHomeworks(datumTol = null, datumIg = null) {
        try {
            return await RequestsHandler.get(`${this.getUrl()}/sajat/HaziFeladatok`, this.headers, { datumTol, datumIg });
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.get(`${this.getUrl()}/sajat/HaziFeladatok`, this.headers, { datumTol, datumIg });
        }
    }

    async getLEPEvents() {
        try {
            return await RequestsHandler.get(`${this.getUrl()}/Lep/Eloadasok`, this.headers);
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.get(`${this.getUrl()}/Lep/Eloadasok`, this.headers);
        }
    }

    async getLesson(orarendElemUid = null) {
        try {
            return await RequestsHandler.get(`${this.getUrl()}/sajat/OrarendElem`, this.headers, { orarendElemUid });
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.get(`${this.getUrl()}/sajat/OrarendElem`, this.headers, { orarendElemUid });
        }
    }

    async getLessons(datumTol = null, datumIg = null) {
        try {
            return await RequestsHandler.get(`${this.getUrl()}/sajat/OrarendElemek`, this.headers, { datumTol, datumIg });
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.get(`${this.getUrl()}/sajat/OrarendElemek`, this.headers, { datumTol, datumIg });
        }
    }

    async getNotes(datumTol = null, datumIg = null) {
        try {
            return await RequestsHandler.get(`${this.getUrl()}/sajat/Feljegyzesek`, this.headers, { datumTol, datumIg });
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.get(`${this.getUrl()}/sajat/Feljegyzesek`, this.headers, { datumTol, datumIg });
        }
    }

    async getNoticeBoardItems() {
        try {
            return await RequestsHandler.get(`${this.getUrl()}/sajat/FaliujsagElemek`, this.headers);
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.get(`${this.getUrl()}/sajat/FaliujsagElemek`, this.headers);
        }
    }

    async getOmissions(datumTol = null, datumIg = null) {
        try {
            return await RequestsHandler.get(`${this.getUrl()}/sajat/Mulasztasok`, this.headers, { datumTol, datumIg });
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.get(`${this.getUrl()}/sajat/Mulasztasok`, this.headers, { datumTol, datumIg });
        }
    }

    async getRegistrationState() {
        try {
            return await RequestsHandler.get(`${this.getUrl()}/TargyiEszkoz/IsRegisztralt`, this.headers);
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.get(`${this.getUrl()}/TargyiEszkoz/IsRegisztralt`, this.headers);
        }
    }

    async getSchoolYearCalendar() {
        try {
            return await RequestsHandler.get(`${this.getUrl()}/sajat/Intezmenyek/TanevRendjeElemek`, this.headers);
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.get(`${this.getUrl()}/sajat/Intezmenyek/TanevRendjeElemek`, this.headers);
        }
    }

    async getStudent() {
        try {
            return await RequestsHandler.get(`${this.getUrl()}/sajat/TanuloAdatlap`, this.headers);
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.get(`${this.getUrl()}/sajat/TanuloAdatlap`, this.headers);
        }
    }

    async getSubjectAverage(oktatasiNevelesiFeladatUid) {
        try {
            return await RequestsHandler.get(`${this.getUrl()}/sajat/Ertekelesek/Atlagok/TantargyiAtlagok`, this.headers, { oktatasiNevelesiFeladatUid });
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.get(`${this.getUrl()}/sajat/Ertekelesek/Atlagok/TantargyiAtlagok`, this.headers, { oktatasiNevelesiFeladatUid });
        }
    }

    async getTimeTableWeeks() {
        try {
            return await RequestsHandler.get(`${this.getUrl()}/sajat/Intezmenyek/Hetirendek/Orarendi`, this.headers);
        } catch (error) {
            await this.refresh();
            return await RequestsHandler.get(`${this.getUrl()}/sajat/Intezmenyek/Hetirendek/Orarendi`, this.headers);
        }
    }
}