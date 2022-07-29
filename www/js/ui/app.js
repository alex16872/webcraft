import {API_Client} from './api.js';
import {} from './clipboard.js';
import {Helpers} from '../helpers.js';

export class UIApp {

    constructor() {
        this.api = Game.local_server?.getAPIClient() || new API_Client();
        // Session
        this._loadSession();
        // Hooks
        this.onLogin = (e) => {};
        this.onLogout = (e) => {};
        this.onError = (e) => {};
    }

    // Minecraft compatibility seed
    GenerateSeed(value) {
        let isInt = !isNaN(value) && 
                   parseInt(Number(value)) == value && 
                   !isNaN(parseInt(value, 10));
        if(isInt) {
            return value + '';
        }
        value += '';
        if(value == '' || value == '0') {
            value = Helpers.getRandomInt(1000000, 4000000000);
        }
        var hash = 0, i, chr;
        for (i = 0; i < value.length; i++) {
            chr   = value.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash + '';
    }

    _loadSession() {
        // Session
        let session = localStorage.getItem('session');
        if(session) {
            this.session = JSON.parse(session);
        } else {
            this.session = null;
        }
    }

    logout(result) {
        this.session = null;
        localStorage.removeItem('session');
        this.onLogout(result);
    }

    showError(message) {
        this.onError(message);
    }

    isLogged() {
        return !!this.getSession();
    }

    // Registration...
    async Registration(form, callback, callback_error, callback_progress, callback_final) {
        let result = [];
        await this.api.call(this, '/api/User/Registration', form, (resp) => {
            result = resp;
            if(callback) {
                callback(result);
            }
        }, callback_error, callback_progress, callback_final);
        return result;
    }

    // Login...
    async Login(form, callback, callback_error, callback_progress, callback_final) {
        let that = this;
        let result = [];
        await this.api.call(this, '/api/User/Login', form, (resp) => {
            result = resp;
            localStorage.setItem('session', JSON.stringify(result));
            that._loadSession();
            if(callback) {
                callback(result);
            }
        }, callback_error, callback_progress, callback_final);
        return result;
    }

    // JoinWorld...
    async JoinWorld(form, callback, callback_error, callback_progress, callback_final) {
        let result = [];
        await this.api.call(this, '/api/Game/JoinWorld', form, (resp) => {
            result = resp;
            if(callback) {
                callback(result);
            }
        }, callback_error, callback_progress, callback_final);
        return result;
    }

    // MyWorlds...
    async MyWorlds(form, callback, callback_error, callback_progress, callback_final) {
        let result = [];
        await this.api.call(this, '/api/Game/MyWorlds', form, (resp) => {
            result = resp;
            if(callback) {
                callback(result);
            }
        }, callback_error, callback_progress, callback_final);
        return result;
    }

    // GameOnline...
    async GameOnline(form, callback, callback_error, callback_progress, callback_final) {
        let result = [];
        await this.api.call(this, '/api/Game/Online', form, (resp) => {
            result = resp;
            if(callback) {
                callback(result);
            }
        }, callback_error, callback_progress, callback_final);
        return result;
    }

    // CreateWorld...
    async CreateWorld(form, callback, callback_error, callback_progress, callback_final) {
        let result = null;
        await this.api.call(this, '/api/Game/CreateWorld', form, (resp) => {
            result = resp;
            if(callback) {
                callback(result);
            }
        }, callback_error, callback_progress, callback_final);
        return result;
    }

    //
    getSession() {
        return this.session;
    }

}