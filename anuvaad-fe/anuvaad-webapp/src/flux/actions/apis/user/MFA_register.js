/**
 * ActivateUser API
 */
import API from "../api";
import C from "../../constants";
import ENDPOINTS from "../../../../configs/apiendpoints";

export default class RegisterMFA extends API {
    constructor(userName = "", sessionId = "", mfaType = "", timeout = 2000) {
        super("POST", timeout, false);
        this.type = C.MFA_REGISTER;
        this.userName = userName;
        this.sessionId = sessionId;
        this.mfaType = mfaType;
        this.endpoint = `${super.apiEndPointAuto()}${ENDPOINTS.mfa_register}`;
    }

    toString() {
        return `${super.toString()} , type: ${this.type}`;
    }

    processResponse(res) {
        super.processResponse(res);
        if (res) {
            this.response = res;
        }
    }

    apiEndPoint() {
        return this.endpoint;
    }

    getBody() {
        return {
            userName: this.userName,
            session_id: this.sessionId,
            mfaType: this.mfaType
        };
    }

    getHeaders() {
        this.headers = {
            headers: {
                "Content-Type": "application/json"
            }
        };
        return this.headers;
    }

    getPayload() {
        return this.response;
    }
}
