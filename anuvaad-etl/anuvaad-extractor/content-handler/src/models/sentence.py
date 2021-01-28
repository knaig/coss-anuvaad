from utilities import AppContext
from db import get_db
from anuvaad_auditor.loghandler import log_info, log_exception
import sacrebleu
from nltk.translate.bleu_score import corpus_bleu

DB_SCHEMA_NAME  = 'file_content'

class SentenceModel(object):

    def get_block_by_s_id(self, user_id, s_id):
        try:
            collections = get_db()[DB_SCHEMA_NAME]
            docs         = collections.find({'$and': [{'created_by': user_id}, { 'data.tokenized_sentences': {'$elemMatch': {'s_id': {'$eq': s_id}}}}]})
            for doc in docs:
                return doc
            return None
        except Exception as e:
            log_exception("db connection exception ",  AppContext.getContext(), e)
            return None
        
    def get_sentence_by_s_id(self, user_id, s_id):
        try:
            collections = get_db()[DB_SCHEMA_NAME]
            docs        = collections.aggregate([
                    { '$match': {'data.tokenized_sentences.s_id' : s_id } },
                    { '$project': {
                        'tokenized_sentences': {
                            '$filter': {
                                'input': '$data.tokenized_sentences',
                                'as': 'ts',
                                'cond': { '$eq': ['$$ts.s_id', s_id] }
                                }
                            }
                        }
                    }
                ])
            
            for doc in docs:
                sentence = doc['tokenized_sentences'][0]
                if 's0_tgt' not in list(sentence.keys()):
                    sentence['s0_tgt'] = sentence['tgt']
                if 's0_src' not in list(sentence.keys()):
                    sentence['s0_src'] = sentence['src']
                return sentence

            return None
        except Exception as e:
            log_exception("db connection exception ",  AppContext.getContext(), e)
            return None

    def update_sentence_by_s_id(self, user_id, sentence):
        SENTENCE_KEYS   = ['n_id', 'pred_score', 's_id', 'src', 'tgt']
        try:
            collections     = get_db()[DB_SCHEMA_NAME]

            results         = collections.update({'$and': [{'created_by': user_id}, { 'data.tokenized_sentences': {'$elemMatch': {'s_id': {'$eq': sentence['s_id']}}}}]},
                                                {
                                                    '$set':
                                                    {
                                                        "data.tokenized_sentences.$.n_id" : sentence['n_id'],
                                                        "data.tokenized_sentences.$.src"  : sentence['src'],
                                                        "data.tokenized_sentences.$.tgt"  : sentence['tgt'],
                                                        "data.tokenized_sentences.$.save" : sentence['save'],
                                                        "data.tokenized_sentences.$.bleu_score" : sentence['bleu_score'],
                                                        "data.tokenized_sentences.$.time_spent_ms" : sentence['time_spent_ms']
                                                    }
                                                }, upsert=False)

            if 'writeError' in list(results.keys()):
                return False
            return True        
        except Exception as e:
            log_exception("db connection exception ",  AppContext.getContext(), e)
            return False

    def get_total_tokenized_sentences_count(self, record_id):
        try:
            collections = get_db()[DB_SCHEMA_NAME]
            docs        = collections.aggregate([
                                { '$match': {'$and': [{"record_id": record_id}, {'data_type':'text_blocks'} ]} },
                                { '$project': { '_id': 0, 'count': { '$size':"$data.tokenized_sentences" } } },
                                { '$group': { '_id' : {'count': '$count'}, 'total_count': { '$sum': '$count' } } }
                        ])
            for doc in docs:
                count = doc['total_count']
                return count
            return None
        except Exception as e:
            log_exception("db connection exception ",  AppContext.getContext(), e)
            return False

    def get_completed_tokenized_sentences_count(self, record_id):
        try:
            collections = get_db()[DB_SCHEMA_NAME]
            docs        = collections.aggregate([
                                { '$match': {'$and': [{"record_id": record_id}, {'data_type':'text_blocks'}, { 'data.tokenized_sentences': {'$elemMatch': {'save': {'$eq': True}}}}]} },
                                { '$project': { '_id': 0, 'count': { '$size':"$data.tokenized_sentences" } } },
                                { '$group': { '_id': 0, 'total_count': { '$sum': 1 } } }
                        ])
            for doc in docs:
                count = doc['total_count']
                return count
            return None
        except Exception as e:
            log_exception("db connection exception ",  AppContext.getContext(), e)
            return False

    def get_tokenized_sentences_count_status(self, record_id,bleu_return):
        try:
            collections = get_db()[DB_SCHEMA_NAME]
            
            avg_bleu_score = 0
            if bleu_return:
                target_docs=  collections.aggregate([
                                { '$match': {'$and': [{"record_id": record_id}, {'data_type':'text_blocks'}]} },
                                { '$unwind': "$data.tokenized_sentences" },
                                {'$match':{"data.tokenized_sentences.save":True}},
                                { "$project": {"tgt_nmt":"$data.tokenized_sentences.s0_tgt","tgt_user":"$data.tokenized_sentences.tgt","_id":0}}])
            
                tgt_nmt=[]
                tgt_user=[]
                for doc in target_docs:
                    tgt_nmt.append(doc["tgt_nmt"])
                    tgt_user.append(doc["tgt_user"])
                
                if tgt_nmt and tgt_user:
                    preds=tgt_nmt
                    refs=[tgt_user]
                    sacre_bleu = sacrebleu.corpus_bleu(preds,refs).score
                    log_info("\n*************************\nBleu score calculation", AppContext.getContext())
                    log_info("\n**Machine translated sentences:{}\n **User translated sentences:{}".format(preds, refs), AppContext.getContext())
                    log_info("\nSACRE_BLEU value** :{}".format(sacre_bleu), AppContext.getContext())
                    log_info("\n*****************************", AppContext.getContext())
                    avg_bleu_score      = round((sacre_bleu/100),3)
               
            
             
            docs   = collections.aggregate([
                                { '$match': {'$and': [{"record_id": record_id}, {'data_type':'text_blocks'}]} },
                                { '$unwind': "$data.tokenized_sentences" },
                                { "$addFields": { 
                                 "data.tokenized_sentences.words": { "$split": [ "$data.tokenized_sentences.src", " " ] }}},
                                 {"$addFields": { "sent_wrd_count": { "$size":"$data.tokenized_sentences.words" }}},
                                 { "$group": {
                                    "_id": "$data.tokenized_sentences.save",
                                    "doc_sent_count": { "$sum": 1 },
                                     "doc_wrd_count" : { "$sum": "$sent_wrd_count" },
                                     "total_time_spent":{"$sum": "$data.tokenized_sentences.time_spent_ms"} 
                                     }}
                                ])

  
                                    #  "total_bleu_score":{"$sum": "$data.tokenized_sentences.bleu_score"},          

            empty_sent_count     = 0
            saved_sent_count     = 0
            unsaved_sent_count   = 0


            empty_wrd_count      = 0
            saved_wrd_count      = 0
            unsaved_wrd_count    = 0

            
            total_saved_bleu_score     = 0

            total_time_spent_ms = 0

            for doc in docs:
                if doc['_id'] == None:
                    empty_sent_count = doc['doc_sent_count']
                    empty_wrd_count  = doc['doc_wrd_count']
                if doc['_id'] == True:
                    saved_sent_count = doc['doc_sent_count']
                    saved_wrd_count  = doc['doc_wrd_count']
                    total_time_spent_ms = doc["total_time_spent"]
                if doc['_id'] == False:
                    unsaved_sent_count = doc['doc_sent_count']
                    unsaved_wrd_count  = doc['doc_wrd_count']

            

            return {
                'total_sentences': empty_sent_count + saved_sent_count + unsaved_sent_count,
                'completed_sentences': saved_sent_count,
                'total_words': empty_wrd_count + saved_wrd_count + unsaved_wrd_count,
                'completed_words': saved_wrd_count,
                'avg_bleu_score' : avg_bleu_score,
                'total_time_spent_ms': total_time_spent_ms
            }
                
        except Exception as e:
            log_exception("db connection exception ",  AppContext.getContext(), e)

            return {
                'total_sentences': 0,
                'completed_sentences': 0,
                'total_words': 0,
                'completed_words': 0,
                'avg_bleu_score' : 0,
                'total_time_spent_ms': 0
            }
