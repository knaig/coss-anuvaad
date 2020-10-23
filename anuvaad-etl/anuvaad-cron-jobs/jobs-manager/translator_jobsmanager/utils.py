import json

import pymongo
import requests
from anuvaad_auditor import log_error, log_exception, log_info, post_error
from kafka import KafkaProducer

from .configs import mongo_server_host
from .configs import mongo_translator_db
from .configs import mongo_translator_collection
from .configs import kafka_bootstrap_server_host


class TranslatorCronUtils:

    def __init__(self):
        pass

    # Initialises and fetches mongo client
    def instantiate(self, collection):
        client = pymongo.MongoClient(mongo_server_host)
        db = client[mongo_translator_db]
        col = db[collection]
        return col

    # Method to instantiate producer
    # Any other method that needs a producer will get it from her
    def kf_instantiate(self):
        producer = KafkaProducer(bootstrap_servers=list(str(kafka_bootstrap_server_host).split(",")),
                                 api_version=(1, 0, 0),
                                 value_serializer=lambda x: json.dumps(x).encode('utf-8'))
        return producer

    # Searches the object into mongo collection
    def find_all(self):
        col = self.instantiate(mongo_translator_collection)
        res = col.find({})
        result = []
        for record in res:
            result.append(record)
        return result

    # Deletes the object in the mongo collection by job id
    def delete(self, job_id):
        col = self.instantiate(mongo_translator_collection)
        col.remove({"jobID": job_id})

    # Util method to make an API call and fetch the result
    def call_api(self, uri, method, api_input, params, user_id):
        try:
            response = None
            if method == "POST":
                api_headers = {'userid': user_id, 'ad-userid': user_id, 'Content-Type': 'application/json'}
                response = requests.post(url=uri, json=api_input, headers=api_headers)
            elif method == "GET":
                api_headers = {'userid': user_id}
                response = requests.get(url=uri, params=params, headers=api_headers)
            if response is not None:
                if response.text is not None:
                    return json.loads(response.text)
                else:
                    log_error("API response was None! URI: " + str(uri), api_input, None)
                    return None
            else:
                log_error("API call failed! URI: " + str(uri), api_input, None)
                return None
        except Exception as e:
            log_exception("Exception while making the api call: " + str(e), api_input, e)
            return None

    # Method to push records to a topic in the kafka queue
    def produce(self, object_in, topic, prefix):
        producer = self.kf_instantiate()
        try:
            if object_in:
                producer.send(topic, value=object_in)
                log_info(prefix + " -- Pushing to topic: " + topic, object_in)
            producer.flush()
        except Exception as e:
            log_exception("Exception in translator while producing: " + str(e), object_in, e)
            post_error("TRANSLATOR_PRODUCER_EXC", "Exception in translator while producing: " + str(e), None)
