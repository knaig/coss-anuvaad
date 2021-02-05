import os

kafka_bootstrap_server_host = os.environ.get('KAFKA_BOOTSTRAP_SERVER_HOST', 'localhost:9092')
mongo_server_host = os.environ.get('MONGO_CLUSTER_URL', 'mongodb://localhost:27017,localhost:27018/?replicaSet=foo')
mongo_translator_db = os.environ.get('MONGO_TRANSLATOR_DB', 'anuvaad-etl-translator-db')
mongo_translator_collection = os.environ.get('MONGO_TRANSLATOR_CONTENT_COL', 'anuvaad-etl-translator-content-collection')
mongo_trans_batch_collection = os.environ.get('MONGO_TRANSLATOR_BATCH_COL', 'anuvaad-etl-translator-batch-collection')
mongo_trans_pages_collection = os.environ.get('MONGO_TRANSLATOR_PAGES_COL', 'anuvaad-etl-translator-pages-collection')

anu_translator_output_topic = os.environ.get('KAFKA_ANUVAAD_DP_TRANSLATOR_OUTPUT_TOPIC', 'anuvaad-dp-tools-translator-output-v3')
save_content_url = str(os.environ.get('CONTENT_HANDLER_HOST', 'http://gateway_anuvaad-content-handler:5001')) \
                   + str(os.environ.get('SAVE_CONTENT_ENDPOINT', '/anuvaad/content-handler/v0/save-content'))

jm_cron_interval_sec = os.environ.get('TRANSLATOR_JM_INTERVAL_SEC', 5)
jc_job_delete_interval_sec = os.environ.get('TRANSLATOR_JC_CRON_DEL_INTERVAL_SEC', 864000) # 10 days
jc_cron_interval_sec = os.environ.get('TRANSLATOR_JC_INTERVAL_SEC', 86400) # 1 day
module_name = "JOBS-MANAGER"
