from utilities import AppContext
from db import get_db
from anuvaad_auditor.loghandler import log_info, log_exception

class BlockModel(object):
    def __init__(self):
        collections = get_db()[DB_SCHEMA_NAME]
        try:
            collections.create_index([("record_id", pymongo.TEXT)], unique=True)
            collections.create_index([("block_identifier", pymongo.TEXT)], unique=False)
        except pymongo.errors.DuplicateKeyError as e:
            log_info("duplicate key, ignoring", AppContext.getContext())
        except Exception as e:
            log_exception("db connection exception ",  AppContext.getContext(), e)

    @staticmethod
    def update_block(user_id, block_identifier, block):
        try:
            collections = get_db()['file_content']
            results     = collections.update({'$and': [{'created_by': user_id}, { 'block_identifier': block_identifier }]},
            { '$set': block }, upsert=True)

            if 'writeError' in list(results.keys()):
                return False
            return True

        except Exception as e:
            log_exception("db connection exception ",  AppContext.getContext(), e)
            return False

    @staticmethod
    def store_bulk_blocks(blocks):
        try:
            collections = get_db()['file_content']
            results     = collections.insert_many(blocks)
            if len(blocks) == len(results.inserted_ids):
                return True
        except Exception as e:
            log_exception("db connection exception ",  AppContext.getContext(), e)
            return False

    @staticmethod
    def get_all_blocks(user_id, record_id):
        try:
            collections = get_db()['file_content']
            docs        = collections.find({
                'record_id': record_id,
                'created_by': user_id
            })
            return docs
        except Exception as e:
            log_exception("db connection exception ",  AppContext.getContext(), e)
            return False
        

    @staticmethod
    def get_blocks_by_page(user_id, record_id, page_number):
        try:
            collections = get_db()['file_content']
            results        = collections.aggregate([
                                { '$match' : { 'page_no': page_number, 'record_id': record_id, 'created_by': user_id } },
                                { '$group': { '_id': '$data_type', 'data': { '$push': "$data" } } }
                                ])
            return results
        except Exception as e:
            log_exception("db connection exception ",  AppContext.getContext(), e)
            return False

    @staticmethod
    def get_document_total_page_count(user_id, record_id):
        try:
            collections = get_db()['file_content']
            results     = collections.aggregate([
                { '$match' : { 'record_id': record_id, 'created_by': user_id } },
                {
                    '$group':
                        {
                            '_id': '$record_id',
                            'page_count': { '$max': "$page_no" }
                        }
                }
            ])

            count = 0
            for result in results:
                count = result['page_count']
                break

            return count
        except Exception as e:
            log_exception("db connection exception ",  AppContext.getContext(), e)
            return 0