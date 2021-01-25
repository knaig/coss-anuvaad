import time

from anuvaad_auditor.loghandler import log_exception, log_error, log_info
from anuvaad_auditor.errorhandler import post_error
from configs.translatorconfig import nmt_translate_url
from configs.translatorconfig import update_content_url
from utilities.translatorutils import TranslatorUtils
from tmx.tmxservice import TMXService
from tmx.tmxrepo import TMXRepository
from configs.translatorconfig import tmx_enabled
from configs.translatorconfig import tmx_global_enabled



utils = TranslatorUtils()
tmxservice = TMXService()
tmx_repo = TMXRepository()


class BlockTranslationService:

    def __init__(self):
        pass

    # Method to accept block list and return translations for SYNC flow.
    def block_translate(self, block_translate_input):
        block_translate_input["taskID"] = utils.generate_task_id()
        block_translate_input["taskStartTime"] = eval(str(time.time()).replace('.', '')[0:13])
        block_translate_input["state"] = "TRANSLATED"
        log_info("Block Translation started....", block_translate_input)
        output = block_translate_input
        is_successful, fail_msg, record_id, op_blocks = False, None, block_translate_input["input"]["recordID"], None
        try:
            nmt_in_txt = self.get_sentences_for_translation(block_translate_input)
            if not nmt_in_txt:
                fail_msg = "ERROR: there are no modified sentences for re-translation"
                log_error(fail_msg, block_translate_input, None)
            else:
                log_info("API call to NMT...", block_translate_input)
                nmt_response = utils.call_api(nmt_translate_url, "POST", nmt_in_txt, None, block_translate_input["metadata"]["userID"])
                log_info("Response received from NMT!", block_translate_input)
                if nmt_response:
                    ch_input = self.get_translations_ip_ch(nmt_response, block_translate_input)
                    if ch_input:
                        log_info("API call to CH...", block_translate_input)
                        ch_response = utils.call_api(update_content_url, "POST", ch_input, None, block_translate_input["metadata"]["userID"])
                        log_info("Response received from CH!", block_translate_input)
                        if ch_response:
                            if ch_response["http"]["status"] == 200:
                                op_blocks = ch_response["data"]["blocks"]
                                is_successful = True
                            else:
                                fail_msg = "Error while updating blocks to CH: " + ch_response["why"]
                                log_error(fail_msg, block_translate_input, None)
                    else:
                        fail_msg = "Error while translating from NMT: " + str(nmt_response["status"]["why"])
                        log_error(fail_msg, block_translate_input, None)
                else:
                    fail_msg = "Error while translating - empty/null res from NMT"
                    log_error(fail_msg, block_translate_input, None)
        except Exception as e:
            fail_msg = "Exception while translating: " + str(e)
            log_exception(fail_msg, block_translate_input, None)
        if not is_successful:
            output["status"] = "FAILED"
            output["output"] = None
            output["taskEndTime"] = eval(str(time.time()).replace('.', '')[0:13])
            output["error"] = post_error("TRANSLATION_FAILED", fail_msg, None)
        else:
            output["input"] = None
            output["status"] = "SUCCESS"
            output["taskEndTime"] = eval(str(time.time()).replace('.', '')[0:13])
            output["output"] = {"textBlocks": op_blocks}
        log_info("Block Translation Completed!", block_translate_input)
        return output

    # Method to fetch blocks from input and add it to list for translation
    def get_sentences_for_translation(self, block_translate_input):
        sent_for_nmt, tmx_count = [], 0
        tmx_present = self.is_tmx_present(block_translate_input)
        record_id, model_id = block_translate_input["input"]["recordID"], block_translate_input["input"]["model"]["model_id"]
        modified_sentences, tmx_blocks_cache = [], {}
        if 'modifiedSentences' in block_translate_input["input"].keys():
            modified_sentences = block_translate_input["input"]["modifiedSentences"]
        log_info("TMX Blocks Cache Size (Start): " + str(len(tmx_blocks_cache.keys())), block_translate_input)
        for block in block_translate_input["input"]["textBlocks"]:
            if 'tokenized_sentences' in block.keys():
                for sentence in block["tokenized_sentences"]:
                    if 'save' not in sentence.keys():
                        sentence["save"] = False
                    if modified_sentences:
                        add_to_nmt = (sentence["save"] is False) and (sentence["s_id"] in modified_sentences)
                    else:
                        add_to_nmt = sentence["save"] is False
                    if add_to_nmt:
                        tmx_phrases = []
                        if tmx_present:
                            tmx_phrases = self.fetch_tmx(sentence["src"], tmx_present, tmx_blocks_cache, block_translate_input)
                        tmx_count += len(tmx_phrases)
                        n_id = str(record_id) + "|" + str(block["block_identifier"]) + "|" + str(sentence["s_id"])
                        sent_nmt_in = {"s_id": sentence["s_id"], "src": sentence["src"], "id": model_id,
                                           "n_id": n_id, "tmx_phrases": tmx_phrases}
                        sent_for_nmt.append(sent_nmt_in)
        log_info("NMT: " + str(len(sent_for_nmt)) + " | TMX: " + str(tmx_count), block_translate_input)
        log_info("TMX Blocks Cache Size (End): " + str(len(tmx_blocks_cache.keys())), block_translate_input)
        return sent_for_nmt

    # Checks if org level or user level TMX is applicable to the file under translation.
    def is_tmx_present(self, block_translate_input):
        if tmx_enabled:
            if 'context' not in block_translate_input["input"].keys():
                return False
            user_id = block_translate_input["metadata"]["userID"]
            org_id = block_translate_input["metadata"]["orgID"]
            locale = block_translate_input["input"]["model"]["source_language_code"] + "|" + block_translate_input["input"]["model"]["target_language_code"]
            tmx_entries = tmx_repo.search_tmx_db(user_id, org_id, locale)
            if tmx_entries:
                if tmx_entries == "USER":
                    log_info("Only USER level TMX available for this user!", block_translate_input)
                elif tmx_entries == "ORG":
                    log_info("Only ORG level TMX available for this user!", block_translate_input)
                else:
                    log_info("USER and ORG level TMX available for this user!", block_translate_input)
                return tmx_entries
            else:
                log_info("No USER or ORG TMX entries available for this user!", block_translate_input)
                return tmx_global_enabled
        return False

    # Fetches tmx phrases
    def fetch_tmx(self, sentence, tmx_level, tmx_blocks_cache, block_translate_input):
        context = block_translate_input["input"]["context"]
        user_id = block_translate_input["metadata"]["userID"]
        org_id = block_translate_input["metadata"]["orgID"]
        locale = block_translate_input["input"]["model"]["source_language_code"] + "|" + \
                 block_translate_input["input"]["model"]["target_language_code"]
        if tmx_level not in ["USER", "ORG", "BOTH"]:
            tmx_level = None
        phrases, res_dict = tmxservice.get_tmx_phrases(user_id, org_id, context, locale, sentence, tmx_level,
                                                       tmx_blocks_cache, block_translate_input)
        return phrases

    # Parses the nmt response and builds input for ch
    def get_translations_ip_ch(self, nmt_response, block_translate_input):
        if 'response_body' in nmt_response.keys():
            if nmt_response['response_body']:
                for translation in nmt_response["response_body"]:
                    if translation["tmx_phrases"]:
                        log_info("Modifying tgt with TMX for src: " + translation["src"], block_translate_input)
                        log_info("SRC: " + translation["src"] + " | TGT: " + translation["tgt"] +
                                 " | TMX Count: " + str(len(translation["tmx_phrases"])), block_translate_input)
                        translation["tgt"] = tmxservice.replace_nmt_tgt_with_user_tgt(translation["tmx_phrases"],
                                                                                      translation["tgt"], block_translate_input)
                    b_index, s_index = None, None
                    block_id, sentence_id = str(translation["n_id"]).split("|")[2], str(translation["n_id"]).split("|")[3]
                    blocks = block_translate_input["input"]["textBlocks"]
                    for j, block in enumerate(blocks):
                        if str(block["block_identifier"]) == str(block_id):
                            b_index = j
                            break
                    block = blocks[b_index]
                    for k, sentence in enumerate(block["tokenized_sentences"]):
                        if str(sentence["s_id"]) == str(sentence_id):
                            s_index = k
                            break
                    if b_index is not None and s_index is not None:
                        block_translate_input["input"]["textBlocks"][b_index]["tokenized_sentences"][s_index] = translation
        log_info("Input for CH update generated!", block_translate_input)
        return {"blocks": block_translate_input["input"]["textBlocks"], "workflowCode": block_translate_input["workflowCode"]}
