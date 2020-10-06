#!/bin/python
import binascii
import codecs
import json
import logging
import os
import time

import requests
import numpy as np
import csv
from configs.alignerconfig import file_upload_url
from anuvaad_auditor.errorhandler import post_error
from anuvaad_auditor.errorhandler import post_error_wf
from anuvaad_auditor.loghandler import log_info
from anuvaad_auditor.loghandler import log_error

log = logging.getLogger('file')
two_files = True
no_of_words = 200
file_encoding = 'utf-16'


class AlignmentUtils:

    def __init__(self):
        pass

    # Utility to parse input files.
    def parse_input_file(self, path_eng, path_indic):
        source = []
        target_corp = []
        if two_files:
            with codecs.open(path_eng, 'r', file_encoding) as txt_file:
                for row in txt_file:
                    if len(row.rstrip()) != 0:
                        source.append(row.rstrip())
            with codecs.open(path_indic, 'r', file_encoding) as txt_file:
                for row in txt_file:
                    if len(row.rstrip()) != 0:
                        target_corp.append(row.rstrip())

        else:
            with codecs.open(path_eng, 'r', file_encoding) as csv_file:
                csv_reader = csv.reader((l.replace('\0', '') for l in csv_file))
                for row in csv_reader:
                    if len(row) != 0:
                        source.append(row[0])
                        target_corp.append(row[1])
        return source, target_corp

    # Utility to write the output to a file
    def write_output(self, list, path):
        with codecs.open(path, 'w', file_encoding) as txt_file:
            for row in list:
                txt_file.write(row + "\r\n")

    # Utility to calculate cosine distances between 2 vectors
    def cscalc(self, vector_one, vector_two):
        vector_one = np.squeeze(vector_one)
        vector_two = np.squeeze(vector_two)
        dot = np.dot(vector_one, vector_two)
        norma = np.linalg.norm(vector_one)
        normb = np.linalg.norm(vector_two)
        cos = dot / (norma * normb)
        return cos

    # Post processor to be called after input parsing is sucessfull
    # If the process is to be run only for sentences of a particular length in the input
    def post_process_input(self, word_count, source):
        source[:] = [line for line in source if (len(line.split()) < word_count)]

    # File to binary converter
    def convert_file_to_binary(self, file_path):
        x = ""
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(32), b''):
                x += str(binascii.hexlify(chunk)).replace("b", "").replace("'", "")
        b = bin(int(x, 16)).replace('b', '')
        return b

    # Utility to upload files to anuvaad's upload service
    def upload_file_binary(self, file, object_in):
        data = open(file, 'rb')
        response = requests.post(url=file_upload_url, data=data,
                                 headers={'Content-Type': 'application/x-www-form-urlencoded'})
        if response is not None:
            data = json.loads(response.text)
            for key, value in data.items():
                if key == "data":
                    return value["filepath"]
        else:
            log_error("Upload Failed!", object_in, None)

    # Utility to decide (min,max) cs thresholds based on length of setences.
    def get_cs_on_sen_cat(self, sentence):
        sen_len = len(sentence.split())
        if 0 < sen_len <= 10:
            # SMALL
            return 0.7, 0.75
        elif 10 < sen_len <= 20:
            # MEDIUM
            return 0.75, 0.8
        else:
            # LARGE
            return 0.75, 0.8

    # Utility to generate a unique random task ID
    def generate_task_id(self):
        return "ALIGN-" + str(time.time()).replace('.', '')[0:13]

    # Utility to generate a unique random job ID
    def generate_job_id(self):
        return "ALIGN-" + str(time.time()).replace('.', '')[0:13]

    # Builds the error and passes it to error_manager
    def error_handler(self, code, message, object_in, iswf):
        if iswf:
            object_in["state"] = "SENTENCES-ALIGNED"
            object_in["status"] = "FAILED"
            post_error_wf(code, message, object_in, None)
        else:
            error = post_error(code, message, None)
            return error
