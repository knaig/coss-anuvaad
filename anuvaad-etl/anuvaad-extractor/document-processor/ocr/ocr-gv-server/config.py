#import logging
import os
import time
DEBUG = False
API_URL_PREFIX = "/anuvaad-etl/document-processor/gv-document-digitization"
HOST = '0.0.0.0'
PORT = 5001
BASE_DIR      = 'upload'
#BASE_DIR      = '/home/naresh/anuvaad/anuvaad-etl/anuvaad-extractor/document-processor/ocr/ocr-gv-server/'
download_folder = 'upload'


ENABLE_CORS = False

# kafka

# ENABLE_CORS = False

# # kafka dev

input_topic_default = 'anuvaad-dp-tools-ocr-google-vision-input-v15'
input_topic_identifier = 'KAFKA_ANUVAAD_DP_TOOLS_OCR_GOOGLE_VISION_INPUT_V15'
input_topic = os.environ.get(input_topic_identifier, input_topic_default)

output_topic_default = 'anuvaad-dp-tools-ocr-google-vision-output-v15'
output_topic_identifier = 'KAFKA_ANUVAAD_DP_TOOLS_OCR_GOOGLE_VISION_OUTPUT_V15'
output_topic = os.environ.get(output_topic_identifier, output_topic_default)

kf_local_server     = 'localhost:9092'
kafka_ip_host       = 'KAFKA_BOOTSTRAP_SERVER_HOST'
bootstrap_server    = os.environ.get(kafka_ip_host, kf_local_server)

TASK_STAT           = 'GOOGLE-VISION-OCR-15'

CONSUMER_GROUP_default       = 'anuvaad-etl-gvocr-15-consumer-group'
CONSUMER_GROUP_identifier    = 'ANUVAAD_ETL_GVOCR_CONSUMER_GROUP_V15'
CONSUMER_GROUP               = os.environ.get(CONSUMER_GROUP_identifier,CONSUMER_GROUP_default)


# # kafka stage

# input_topic_default = 'anuvaad-dp-tools-ocr-google-vision-input-v15-stage'
# input_topic_identifier = 'KAFKA_ANUVAAD_DP_TOOLS_OCR_GOOGLE_VISION_INPUT_V15_STAGE'
# input_topic = os.environ.get(input_topic_identifier, input_topic_default)

# output_topic_default = 'anuvaad-dp-tools-ocr-google-vision-output-v15-stage'
# output_topic_identifier = 'KAFKA_ANUVAAD_DP_TOOLS_OCR_GOOGLE_VISION_OUTPUT_V15_STAGE'
# output_topic = os.environ.get(output_topic_identifier, output_topic_default)

# kf_local_server     = 'localhost:9092'
# kafka_ip_host       = 'KAFKA_BOOTSTRAP_SERVER_HOST'
# bootstrap_server    = os.environ.get(kafka_ip_host, kf_local_server)

# TASK_STAT           = 'GOOGLE-VISION-OCR-15'

# CONSUMER_GROUP_default       = 'anuvaad-etl-gvocr-15-consumer-group-stage'
# CONSUMER_GROUP_identifier    = 'ANUVAAD_ETL_GVOCR_CONSUMER_GROUP_V15_STAGE'
# CONSUMER_GROUP               = os.environ.get(CONSUMER_GROUP_identifier,CONSUMER_GROUP_default)






download_folder = 'upload'
#
#
# logging.basicConfig(
#     filename=os.getenv("SERVICE_LOG", "server.log"),
#     level=logging.DEBUG,
#     format="%(levelname)s: %(asctime)s \
#         pid:%(process)s module:%(module)s %(message)s",
#     datefmt="%d/%m/%y %H:%M:%S",
# )

#SAVE_URL = "https://auth.anuvaad.org/anuvaad/ocr-content-handler/v0/ocr/save-document"
SAVE_VAR = "OCR_CH_URL"
SAVE_DEFAULT = "http://gateway_anuvaad-ocr-content-handler:5001//anuvaad/ocr-content-handler/v0/ocr/save-document"

SAVE_URL = os.environ.get(SAVE_VAR,SAVE_DEFAULT)
#print(SAVE_URL)
#SAVE_URL = "http://172.30.0.232:5009//anuvaad/ocr-content-handler/v0/ocr/save-document"
SAVE_NO_PAGE = 1

#redis config
REDIS_SERVER_PREFIX     = os.environ.get('REDIS_PREFIX', 'redis')
REDIS_SERVER_HOST       = os.environ.get('REDIS_URL', 'localhost')
REDIS_SERVER_PORT       = os.environ.get('REDIS_PORT', 6379)
REDIS_OCRGV_DB            = os.environ.get('REDIS_OCR_DB',7)


FONTS = False
IS_DYNAMIC =True
WATERMARK_REMOVE = True
EXRACTION_RESOLUTION  =  300