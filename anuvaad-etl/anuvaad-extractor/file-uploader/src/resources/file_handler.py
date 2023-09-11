from logging.config import dictConfig

from flask_restful import fields, marshal_with, reqparse, Resource
from flask import request
from anuvaad_auditor.loghandler import log_error
from anuvaad_auditor.loghandler import log_info
from anuvaad_auditor.loghandler import log_exception
from models.response import CustomResponse
from models.status import Status
import werkzeug
from flask import send_file
import os
import config
import logging
import uuid
# import services.service import private_user
from datetime import datetime
from models.user_files import UserFiles
from services.service import page_restrictions_pdf,file_upload_s3,file_autoupload_s3
# from services.service import upload_doc
# from services.service import reduce_page
# from services.service import is_file_empty

ALLOWED_FILE_TYPES = config.ALLOWED_FILE_TYPES
ALLOWED_FILE_EXTENSIONS = config.ALLOWED_FILE_EXTENSIONS
parser = reqparse.RequestParser(bundle_errors=True)
log = logging.getLogger('file')


class FileUploader(Resource):

    def post(self):
        try:
            log_info("Uploading file...",None)
            if "record_id" in request.form and "job_id" in request.form and "src_file" in request.form :
                job_id = request.form['job_id']
                src_file = request.form.get('src_file')
                record_id = request.form.get('record_id')
                userid = request.form.get('user_id')
                return file_autoupload_s3(job_id,src_file,record_id,userid)
                
            elif "job_id" in request.form and "src_file" in request.form:
                parse = reqparse.RequestParser()
                parse.add_argument('file', type=werkzeug.datastructures.FileStorage, location='files',
                                help='File is required', required=True)
                args = parse.parse_args()
                f = args['file']
                mime_type = f.mimetype
                log_info("Filename: " + str(f.filename), None)
                log_info("File MIME Type: " + str(mime_type), None)
                # if "job_id" in request.form and "src_file" in request.form:
                job_id = request.form.get('job_id')
                src_file = request.form.get('src_file')
                # args = parse.parse_args()
                # f = args['file']
                return file_upload_s3(f,src_file,job_id)
            else:
                parse = reqparse.RequestParser()
                parse.add_argument('file', type=werkzeug.datastructures.FileStorage, location='files',
                                help='File is required', required=True)
                args = parse.parse_args()
                f = args['file']
                mime_type = f.mimetype
                log_info("Filename: " + str(f.filename), None)
                log_info("File MIME Type: " + str(mime_type), None)
                file_real_name, file_extension = os.path.splitext(f.filename)
            # print(file_extension)
                fileallowed = False
                filename = str(uuid.uuid4()) + file_extension
                # filename =  filenames + file_extension
                log_info(f"TEST-1: filename ={filename}",None)
                filepath = os.path.join(config.download_folder, filename)
            # print(filepath)

                log_info(f"ALLOWED_FILE_EXTENSIONS = {ALLOWED_FILE_EXTENSIONS}",None)
                log_info(f"test 31: fileextension = {file_extension}", None)
                for allowed_file_extension in ALLOWED_FILE_EXTENSIONS:
                    if file_extension.endswith(allowed_file_extension):
                        log_info(f"Test 2: file_extension = {allowed_file_extension}", None)

                        # print(allowed_file_extension)
                        fileallowed = True
                        break
                if fileallowed is False:
                    if mime_type in ALLOWED_FILE_TYPES:
                        fileallowed = True


                if fileallowed:
                    f.save(filepath)
                    file_size = os.stat(filepath).st_size
                    # log.info(f"Test-1: filesize = {file_size}")
                    file_size_in_MB = file_size / (1024 * 1024)
                    # log.info(f"TEST-1: size ={file_size_in_MB}")
                    if file_size_in_MB > eval(str(config.MAX_UPLOAD_SIZE)):
                        os.remove(filepath)
                        res = CustomResponse(Status.ERROR_FILE_SIZE.value, None)
                        return res.getresjson(), 400
                    # if is_file_empty(f, filepath) or file_size <= 0:
                    if file_size <= 0:
                        os.remove(filepath)
                        res = CustomResponse(Status.FILE_BLANK_ERROR.value, None)
                        return res.getresjson(), 400

                    #print(file_extension)
                    # log_info(f"Test 4: file_extension = {allowed_file_extension}", None)
                    # if allowed_file_extension == 'docx':
                    #     page = upload_doc(filename)  #,timeout=60
                    #     print("test8:", filepath)
                    #     remove_pdf_ext = filepath.split('.')[0]
                    #     filepath = remove_pdf_ext + '.pdf'
                    #     if filepath.endswith('.pdf'):
                    #         os.remove(filepath)
                    #     filepath = remove_pdf_ext+file_extension
                    #     print('test11:', filepath)

                    #     if page > config.page_limit:
                    #         os.remove(filepath)
                    #         res = CustomResponse(Status.ERROR_FILE_PAGE_BREAK.value, None)
                    #         return res.getresjson(), 413
                        # print(page)
                    
                    log_info(f"Test 3: file_extension = {allowed_file_extension}", None)
                    if allowed_file_extension == 'pdf' :
                        page = page_restrictions_pdf(filename)
                        if page > config.page_limit:
                            os.remove(filepath)
                            res = CustomResponse(Status.ERROR_FILE_PAGE_BREAK.value, None)
                            return res.getresjson(), 413            
                        # files_pager = reduce_page(filename, filepath, file_extension)


                    userfile = UserFiles(created_by=request.headers.get('x-user-id'),
                                        filename=filename, file_real_name=file_real_name + file_extension, 
                                        created_on=datetime.now())
                    userfile.save()
                    log_info("SUCCESS: File Uploaded -- " + str(f.filename), None)
                    res = CustomResponse(Status.SUCCESS.value, filename)
                    return res.getres()
                else:
                    log_error("ERROR: Unsupported File -- " + str(f.filename), None)
                    res = CustomResponse(Status.ERROR_UNSUPPORTED_FILE.value, None)
                    return res.getresjson(), 400
        except Exception as e:
            log_exception("Exception while uploading the file: ", None, e)
            res = CustomResponse(Status.FAILURE.value, None)
            return res.getresjson(), 500


class FileDownloader(Resource):

    def get(self):
        parse = reqparse.RequestParser()
        parse.add_argument('filename', type=str, location='args', help='Filename is required', required=True)
        parse.add_argument('userid', type=str, location='args', help='UserId is required', required=True)
        args = parse.parse_args()
        filename = args['filename']
        userid = args['userid']
        filepath = os.path.join(config.download_folder, filename)
        userfiles = UserFiles.objects(filename=filename, created_by=userid)
        if userfiles is not None and len(userfiles) > 0:
            if (os.path.exists(filepath)):
                result = send_file(filepath, as_attachment=True)
                result.headers["x-suggested-filename"] = filename
                return result
            else:
                res = CustomResponse(Status.ERROR_UNSUPPORTED_FILE.value, None)
                return res.getresjson(), 400
        else:
            res = CustomResponse(Status.ERROR_NOTFOUND_FILE.value, None)
            return res.getresjson(), 400


class FileServe(Resource):

    def get(self):
        parse = reqparse.RequestParser()
        parse.add_argument('filename', type=str, location='args', help='Filename is required', required=True)
        args = parse.parse_args()
        filename = args['filename']
        filepath = os.path.join(config.download_folder, filename)
        if (os.path.exists(filepath)):
            result = send_file(filepath, as_attachment=True)
            result.headers["x-suggested-filename"] = filename
            return result
        else:
            res = CustomResponse(Status.ERROR_NOTFOUND_FILE.value, None)
            return res.getresjson(), 400


# Log config
dictConfig({
    'version': 1,
    'formatters': {'default': {
        'format': '[%(asctime)s] {%(filename)s:%(lineno)d} %(threadName)s %(levelname)s in %(module)s: %(message)s',
    }},
    'handlers': {
        'info': {
            'class': 'logging.FileHandler',
            'level': 'DEBUG',
            'formatter': 'default',
            'filename': 'info.log'
        },
        'console': {
            'class': 'logging.StreamHandler',
            'level': 'DEBUG',
            'formatter': 'default',
            'stream': 'ext://sys.stdout',
        }
    },
    'loggers': {
        'file': {
            'level': 'DEBUG',
            'handlers': ['info', 'console'],
            'propagate': ''
        }
    },
    'root': {
        'level': 'DEBUG',
        'handlers': ['info', 'console']
    }
})
