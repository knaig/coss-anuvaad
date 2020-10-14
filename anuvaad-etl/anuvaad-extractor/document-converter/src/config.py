import os
import time

DEBUG = False
API_URL_PREFIX = "/api/v0"
HOST = '0.0.0.0'
PORT = 5001

ENABLE_CORS = False

#folders and file path
download_folder = 'upload'

# internal url
CONTENT_HANDLER_ENDPOINT    = os.environ.get('CONTENT_HANDLER_SERVER_URL', 'http://gateway_anuvaad-content-handler:5001/)
FILE_CONVERTER_ENDPOINT     = os.environ.get('FILE_CONVERTER_SERVER_URL', 'http://gateway_anuvaad-file-converter:5001/')
