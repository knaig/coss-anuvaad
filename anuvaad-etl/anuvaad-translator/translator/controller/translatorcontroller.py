#!/bin/python
import time

from flask import Flask, jsonify, request
from service.translatorservice import TranslatorService
from service.blocktranslationservice import BlockTranslationService
from service.texttranslationservice import TextTranslationService
from validator.translatorvalidator import TranslatorValidator
from tmx.tmxservice import TMXService
from configs.translatorconfig import context_path
from configs.translatorconfig import tool_translator
from anuvaad_auditor.loghandler import log_exception, log_error

translatorapp = Flask(__name__)


# REST endpoint to initiate the workflow.
@translatorapp.route(context_path + '/v1/doc/workflow/translate', methods=["POST"])
def doc_translate_workflow():
    service = TranslatorService()
    validator = TranslatorValidator()
    data = request.get_json()
    error = validator.validate_wf(data, False)
    if error is not None:
        return error, 400
    response = service.start_file_translation(data)
    return jsonify(response), 200


# REST endpoint to initiate the workflow.
@translatorapp.route(context_path + '/v1/block/workflow/translate', methods=["POST"])
def block_translate():
    service = BlockTranslationService()
    validator = TranslatorValidator()
    data = request.get_json()
    error = validator.validate_block_translate(data)
    if error is not None:
        log_error("Error in Block Translate: " + str(error), data, None)
        log_error("Input: " + str(data), data, None)
        data["state"], data["status"], data["error"] = "TRANSLATED", "FAILED", error
        return data, 400
    response = service.block_translate(data)
    return jsonify(response), 200


# REST endpoint to initiate the workflow.
@translatorapp.route(context_path + '/v1/text/translate', methods=["POST"])
def text_translate():
    service = TextTranslationService()
    validator = TranslatorValidator()
    try:
        data = request.get_json()
        error = validator.validate_text_translate(data)
        if error is not None:
            data["status"], data["error"] = "FAILED", error
            return jsonify(data), 400
        data = add_headers(data, request)
        response = service.text_translate(data)
        return jsonify(response), 200
    except Exception as e:
        log_exception("Something went wrong: " + str(e), None, e)
        return {"status": "FAILED", "message": "Something went wrong"}, 400


@translatorapp.route(context_path + '/v1/tmx/bulk/create/xls-upload', methods=["POST"])
def tmx_create_bulk():
    service = TMXService()
    data = request.get_json()
    data["userID"] = request.headers["x-user-id"]
    return service.push_csv_to_tmx_store(data)


@translatorapp.route(context_path + '/v1/tmx/create', methods=["POST"])
def tmx_create():
    service = TMXService()
    data = request.get_json()
    data["userID"] = request.headers["x-user-id"]
    return service.push_to_tmx_store(data)


# Fetches required headers from the request and adds it to the body.
def add_headers(data, api_request):
    headers = {
        "userID": api_request.headers["x-user-id"],
        "requestID": api_request.headers["x-request-id"],
        "sessionID": api_request.headers["x-session-id"],
        "receivedAt": eval(str(time.time()).replace('.', '')),
        "module": tool_translator
    }
    data["metadata"] = headers
    return data


# Health endpoint
@translatorapp.route('/health', methods=["GET"])
def health():
    response = {"code": "200", "status": "ACTIVE"}
    return jsonify(response)