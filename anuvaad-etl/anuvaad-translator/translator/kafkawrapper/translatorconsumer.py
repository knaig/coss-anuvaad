import json
import logging
import threading

from kafka import KafkaConsumer, TopicPartition
from service.translatorservice import TranslatorService
from validator.translatorvalidator import TranslatorValidator
from anuvaad_auditor.errorhandler import post_error
from anuvaad_auditor.errorhandler import post_error_wf
from anuvaad_auditor.loghandler import log_info
from anuvaad_auditor.loghandler import log_exception

from configs.translatorconfig import anu_translator_input_topic
from configs.translatorconfig import anu_translator_consumer_grp
from configs.translatorconfig import kafka_bootstrap_server_host
from configs.translatorconfig import translator_cons_no_of_partitions

log = logging.getLogger('file')


# Method to instantiate the kafka consumer
def instantiate(topics):
    consumer = KafkaConsumer(*topics,
                             bootstrap_servers=[kafka_bootstrap_server_host],
                             api_version=(1, 0, 0),
                             group_id=anu_translator_consumer_grp,
                             auto_offset_reset='latest',
                             enable_auto_commit=True,
                             value_deserializer=lambda x: handle_json(x))
    return consumer


# For all the topics, returns a list of TopicPartition Objects
def get_topic_paritions(topics):
    topic_paritions = []
    for topic in topics:
        for partition in range(0, translator_cons_no_of_partitions):
            tp = TopicPartition(topic, partition)
            topic_paritions.append(tp)
    return topic_paritions


# Method to read and process the requests from the kafka queue
def consume():
    try:
        topics = [anu_translator_input_topic]
        consumer = instantiate(topics)
        service = TranslatorService()
        validator = TranslatorValidator()
        thread = threading.current_thread().name
        log_info(str(thread) + " Running..........", None)
        while True:
            for msg in consumer:
                try:
                    data = msg.value
                    if data:
                        log_info(str(thread) + " | Received on Topic: " + msg.topic + " | Partition: " + msg.partition, data)
                        error = validator.validate_wf(data, False)
                        if error is not None:
                            return post_error_wf(error["code"], error["message"], data, None)
                        service.start_file_translation(data)
                except Exception as e:
                    log_exception("Exception in translator while consuming: " + str(e), None, e)
                    post_error("TRANSLATOR_CONSUMER_ERROR", "Exception in translator while consuming: " + str(e), None)
    except Exception as e:
        log_exception("Exception while starting the translator consumer: " + str(e), None, e)
        post_error("TRANSLATOR_CONSUMER_EXC", "Exception while starting translator consumer: " + str(e), None)


# Method that provides a deserialiser for the kafka record.
def handle_json(x):
    try:
        return json.loads(x.decode('utf-8'))
    except Exception as e:
        log_exception("Exception while deserialising: ", None, e)
        return {}
