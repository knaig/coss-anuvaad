#!/bin/python
import json

import redis
from anuvaad_auditor.loghandler import log_exception
from configs.translatorconfig import redis_server_host
from configs.translatorconfig import redis_server_port

import pymongo
from configs.translatorconfig import mongo_server_host
from configs.translatorconfig import mongo_translator_db
from configs.translatorconfig import mongo_tmx_collection

redis_client = None
mongo_client = None


class TMXRepository:

    def __init__(self):
        pass

    # Initialises and fetches redis client
    def redis_instantiate(self):
        redis_client = redis.Redis(host=redis_server_host, port=redis_server_port, db=3)
        return redis_client

    def get_redis_instance(self):
        if not redis_client:
            return self.redis_instantiate()
        else:
            return redis_client

    # Initialises and fetches mongo client
    def instantiate(self, collection):
        client = pymongo.MongoClient(mongo_server_host)
        db = client[mongo_translator_db]
        mongo_client = db[collection]
        return mongo_client

    def get_mongo_instance(self):
        if not mongo_client:
            return self.instantiate(mongo_tmx_collection)
        else:
            return mongo_client

    def upsert(self, key, value):
        try:
            client = self.get_redis_instance()
            client.set(key, json.dumps(value))
            return 1
        except Exception as e:
            log_exception("Exception in REPO: upsert | Cause: " + str(e), None, e)
            return None

    def search(self, key_list):
        try:
            client = self.get_redis_instance()
            result = []
            for key in key_list:
                val = client.get(key)
                if val:
                    result.append(json.loads(val))
            return result
        except Exception as e:
            log_exception("Exception in REPO: search | Cause: " + str(e), None, e)
            return None

    def get_all_records(self, key_list):
        try:
            client = self.get_redis_instance()
            result = []
            if not key_list:
                key_list = client.keys('*')
            for key in key_list:
                val = client.get(key)
                if val:
                    result.append(json.loads(val))
            return result
        except Exception as e:
            log_exception("Exception in REPO: search | Cause: " + str(e), None, e)
            return None

    # Inserts the object into mongo collection
    def tmx_create(self, object_in):
        col = self.get_mongo_instance()
        col.insert_one(object_in)
        del object_in["_id"]

    # Searches tmx entries from mongo collection
    def search_tmx_db(self, user_id, org_id, locale):
        col = self.get_mongo_instance()
        res_user = col.find({"locale": locale, "userID": user_id}, {'_id': False})
        res_org = col.find({"locale": locale, "orgID": org_id}, {'_id': False})
        user, org = 0, 0
        for record in res_user:
            user += 1
        for record in res_org:
            org += 1
        if user > 0 and org > 0:
            return "BOTH"
        else:
            if user > 0:
                return "USER"
            elif org > 0:
                return "ORG"
        return None
