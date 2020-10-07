from flask_restful import fields, marshal_with, reqparse, Resource
from repositories import SentenceRepositories, FileContentRepositories
from models import CustomResponse, Status
import ast
from utilities import MODULE_CONTEXT
from anuvaad_auditor.loghandler import log_info, log_exception

class FileContentSaveResource(Resource):
    def post(self):
        parser = reqparse.RequestParser(bundle_errors=True)
        parser.add_argument('file_locale', location='json', type=str, help='file_locale cannot be empty', required=True)
        parser.add_argument('record_id', location='json', type=str, help='record_id cannot be empty', required=True)
        parser.add_argument('pages', location='json', type=str, help='pages cannot be empty', required=True)
        parser.add_argument('userid', location='headers', type=str, help='userid cannot be empty', required=True)
        parser.add_argument('src_lang', location='json', type=str, help='please provide source language', required=True)
        parser.add_argument('tgt_lang', location='json', type=str, help='please provide translated language', required=True)
        args    = parser.parse_args()

        log_info("FileContentSaveResource record_id {} for user {}".format(args['record_id'], args['userid']), MODULE_CONTEXT)
        log_info('{}'.format(str(args['pages'])), MODULE_CONTEXT)
        
        try:
            pages = ast.literal_eval(args['pages'])
            if FileContentRepositories.store(args['userid'], args['file_locale'], args['record_id'], pages, args['src_lang'], args['tgt_lang']) == False:
                res = CustomResponse(Status.ERR_GLOBAL_MISSING_PARAMETERS.value, None)
                return res.getresjson(), 400

            log_info("FileContentSaveResource record_id {} for user {} saved".format(args['record_id'], args['userid']), MODULE_CONTEXT)
            res = CustomResponse(Status.SUCCESS.value, None)
            return res.getres()
        except Exception as e:
            log_exception("FileContentSaveResource ",  MODULE_CONTEXT, e)
            res = CustomResponse(Status.ERR_GLOBAL_MISSING_PARAMETERS.value, None)
            return res.getresjson(), 400


class FileContentGetResource(Resource):
    def get(self):

        parser = reqparse.RequestParser()
        parser.add_argument('start_page', type=int, location='args', help='start_page can be 0, set start_page & end_page as 0 to get entire document', required=True)
        parser.add_argument('end_page',  type=int, location='args', help='end_page can be 0, set start_page & end_page as 0 to get entire document', required=True)
        parser.add_argument('ad-userid', location='headers', type=str, help='userid cannot be empty', required=True)
        parser.add_argument('job_id', type=str, location='args', help='Job Id is required', required=False)
        parser.add_argument('record_id', type=str, location='args', help='record_id is required', required=True)

        args    = parser.parse_args()
        log_info("FileContentGetResource record_id {} for user {}".format(args['record_id'], args['ad-userid']), MODULE_CONTEXT)
        try:
            result  = FileContentRepositories.get(args['ad-userid'], args['record_id'], args['start_page'], args['end_page'])
            if result == False:
                res = CustomResponse(Status.ERR_GLOBAL_MISSING_PARAMETERS.value, None)
                return res.getresjson(), 400
            log_info("FileContentGetResource record_id {} for user {} has {} pages".format(args['record_id'], args['ad-userid'], result['total']), MODULE_CONTEXT)
            res = CustomResponse(Status.SUCCESS.value, result['pages'], result['total'])
            return res.getres()
        except Exception as e:
            log_exception("FileContentGetResource ",  MODULE_CONTEXT, e)
            res = CustomResponse(Status.ERR_GLOBAL_MISSING_PARAMETERS.value, None)
            return res.getresjson(), 400
        
        
class FileContentUpdateResource(Resource):
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('blocks', location='json', type=str, help='blocks cannot be empty', required=True)
        parser.add_argument('ad-userid', location='headers', type=str, help='userid cannot be empty', required=True)
        args    = parser.parse_args()
        log_info("FileContentUpdateResource for user {}".format(args['ad-userid']), MODULE_CONTEXT)

        try:
            blocks  = ast.literal_eval(args['blocks'])
            result  = FileContentRepositories.update(args['ad-userid'], None, blocks)

            if result == False:
                res = CustomResponse(Status.ERR_GLOBAL_MISSING_PARAMETERS.value, None)
                return res.getresjson(), 400

            log_info("FileContentUpdateResource for user {} updated".format(args['ad-userid']), MODULE_CONTEXT)
            res = CustomResponse(Status.SUCCESS.value, result, None)
            return res.getres()            
        except Exception as e:
            log_exception("FileContentGetResource ",  MODULE_CONTEXT, e)
            res = CustomResponse(Status.ERR_GLOBAL_MISSING_PARAMETERS.value, None)
            return res.getresjson(), 400
        
