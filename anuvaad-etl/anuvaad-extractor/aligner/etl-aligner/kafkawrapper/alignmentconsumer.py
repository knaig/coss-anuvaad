import json
import logging

from kafka import KafkaConsumer, TopicPartition
from service.alignmentservice import AlignmentService
from logging.config import dictConfig
from utilities.alignmentutils import AlignmentUtils
from configs.alignerconfig import kafka_bootstrap_server_host
from configs.alignerconfig import align_job_consumer_grp
from configs.alignerconfig import align_job_topic
from anuvaad_auditor.loghandler import log_info
from anuvaad_auditor.loghandler import log_exception


log = logging.getLogger('file')

class Consumer:

    def __init__(self):
        pass

    # Method to instantiate the kafka consumer
    def instantiate(self, topics):
        consumer = KafkaConsumer(*topics,
                                 bootstrap_servers=[kafka_bootstrap_server_host],
                                 api_version=(1, 0, 0),
                                 group_id=align_job_consumer_grp,
                                 auto_offset_reset='latest',
                                 enable_auto_commit=True,
                                 max_poll_records=1,
                                 value_deserializer=lambda x: self.handle_json(x))
        return consumer

    # Method to read and process the requests from the kafka queue
    def consume(self):
        topics = [align_job_topic]
        consumer = self.instantiate(topics)
        service = AlignmentService()
        util = AlignmentUtils()
        log_info("Align Consumer running.......", None)
        while True:
            for msg in consumer:
                try:
                    data = msg.value
                    if data:
                        log_info("Align-Cons | Received on Topic: " + msg.topic + " | Partition: " + msg.partition, data)
                        service.process(data, False)
                    break
                except Exception as e:
                    log_exception("Exception while consuming: " + str(e), None, e)
                    util.error_handler("ALIGNER_CONSUMER_ERROR", "Exception while consuming: " + str(e), None, False)
                    break

    # Method that provides a deserialiser for the kafka record.
    def handle_json(self, x):
        try:
            return json.loads(x.decode('utf-8'))
        except Exception as e:
            log_exception("Exception while deserialising: ", None, e)
            return {}

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
