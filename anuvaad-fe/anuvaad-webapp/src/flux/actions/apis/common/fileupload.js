import API from "../api";
import C from "../../constants";
import ENDPOINTS from "../../../../configs/apiendpoints";

export default class RunExperiment extends API {


  constructor(workflow, file, fileName, source, target, path, model, source_language, sentence_ids, timeout = 2000) {

    super("POST", timeout, false);
    this.type = C.WORKFLOW;
    this.file = file;
    this.fileName = fileName;
    this.endpoint = workflow === "WF_A_FCBMTKTR" || "WF_A_FCWDLDBSOTES" ? `${super.apiEndPointAuto()}${ENDPOINTS.workflowAsync}` : `${super.apiEndPointAuto()}${ENDPOINTS.workflowSync}`
    this.source = source;
    this.target = target;
    this.path = path;
    this.model = model;
    this.workflow = workflow;
    this.sentence_ids = sentence_ids;
    this.source_language = source_language;

  }

  toString() {
    return `${super.toString()} , type: ${this.type}`;
  }

  processResponse(res) {
    super.processResponse(res);

    if (res) {
      this.sentences = res;

    }
  }

  apiEndPoint() {
    return this.endpoint;
  }

  getBody() {
    if (this.workflow === "WF_A_FCBMTKTR") {
      return {

        "workflowCode": this.workflow,
        "jobName": this.fileName,
        "files": [
          {
            "path": this.file,
            "type": this.path,
            "locale": this.source,
            "model": this.model,
            "context": "JUDICIARY",
            "modifiedSentences": this.sentence_ids
          }
        ]

      };
    }
    else if (this.workflow === "WF_S_TKTR" || this.workflow === "WF_S_TR") {
      return {
        "workflowCode": this.workflow,
        "recordID": this.fileName,
        "locale": this.source, // Only when tokenisation and/or translation is needed
        "model": this.model, //Only when Translation is needed
        "textBlocks": this.file,
        "context": "JUDICIARY",
        "modifiedSentences": this.sentence_ids

      }
      //List of text 
    } else if (this.workflow === "WF_A_FCWDLDBSOTES") {
      return {
        "workflowCode": this.workflow,
        "jobName": this.fileName,
        "files": [
          {
            "path": this.file,
            "type": this.path,
            "locale": this.source,
            "config": {
              "OCR": {
                "option": "HIGH_ACCURACY",
                "language": this.source,
                "source_language_name": this.source_language
              }
            }
          }
        ]
      }
    }

  }

  getHeaders() {
    this.headers = {
      headers: {
        'auth-token': `${decodeURI(localStorage.getItem("token"))}`,
        "Content-Type": "application/json"
      }
    };
    return this.headers;
  }

  getPayload() {
    return this.sentences;
  }
}