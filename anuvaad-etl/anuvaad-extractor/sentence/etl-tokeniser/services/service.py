from repositories.eng_sentence_tokeniser import AnuvaadEngTokenizer
from repositories.hin_sentence_tokeniser import AnuvaadHindiTokenizer
from repositories.kannada_sentence_tokeniser import AnuvaadKannadaTokenizer
from repositories.tamil_sentence_tokeniser import AnuvaadTamilTokenizer
from repositories.malayalam_sentence_tokeniser import AnuvaadMalayalamTokenizer
from repositories.telugu_senetence_tokeniser import AnuvaadTeluguTokenizer
from repositories.general_tokeniser import AnuvaadTokenizer
from errors.errors_exception import ServiceError
from utilities.utils import FileOperation
from anuvaad_auditor.loghandler import log_info
from anuvaad_auditor.loghandler import log_error
from anuvaad_auditor.loghandler import log_exception
import re
import json
import requests
import config
import uuid

file_ops = FileOperation()

class Tokenisation(object):
    def __init__(self, DOWNLOAD_FOLDER, input_json_data):
        self.DOWNLOAD_FOLDER = DOWNLOAD_FOLDER
        self.input_json_data = input_json_data 

    # tokenising text in respective language 
    def tokenisation_core(self, paragraph_data, text_locale):
        tokenised_text = []
        for paragraph in paragraph_data:
            if paragraph is not None:
                try:
                    paragraph = self.remove_extra_spaces(paragraph)
                    if text_locale == 'en':
                        tokenised_sentence_data = AnuvaadEngTokenizer().tokenize(paragraph)
                        tokenised_text.extend(tokenised_sentence_data)
                    elif text_locale == 'hi' or text_locale == 'mr':
                        tokenised_sentence_data = AnuvaadHindiTokenizer().tokenize(paragraph)
                        tokenised_text.extend(tokenised_sentence_data)
                    elif text_locale == 'kn':
                        tokenised_sentence_data = AnuvaadKannadaTokenizer().tokenize(paragraph)
                        tokenised_text.extend(tokenised_sentence_data)
                    elif text_locale == 'ta':
                        tokenised_sentence_data = AnuvaadTamilTokenizer().tokenize(paragraph)
                        tokenised_text.extend(tokenised_sentence_data)
                    elif text_locale == 'ml':
                        tokenised_sentence_data = AnuvaadMalayalamTokenizer().tokenize(paragraph)
                        tokenised_text.extend(tokenised_sentence_data)
                    elif text_locale == 'te':
                        tokenised_sentence_data = AnuvaadTeluguTokenizer().tokenize(paragraph)
                        tokenised_text.extend(tokenised_sentence_data)
                except:
                    log_exception("Received error in this text :  %s"%(paragraph), self.input_json_data, None)
                    raise ServiceError(400, "Tokenisation failed. Something went wrong during tokenisation.")
        return tokenised_text
    
    # after successful tokenisation writting tokenised sentences into a text file
    def writing_tokenised_sentence_in_file(self, tokenised_data, output_path):
        log_info("writing_tokenised_sentence_in_file : File write for tokenised sentence started", self.input_json_data)
        write_file = open(output_path, 'w', encoding='utf-16')
        for item in tokenised_data:
            write_file.write("%s\n"%item)
        log_info("writing_tokenised_sentence_in_file : File write for tokenised sentence completed", self.input_json_data)

    # calling core tokenisation service function to convert paragragh into tokenised sentences for their respective language for txt files
    def tokenisation_response(self, input_file_data, in_locale, index):
        try:
            log_info("txt file tokenisation started.", self.input_json_data)
            output_filepath , output_filename = file_ops.output_path(index, self.DOWNLOAD_FOLDER, '.txt')
            tokenised_data = self.tokenisation_core(input_file_data, in_locale)
            self.writing_tokenised_sentence_in_file(tokenised_data, output_filepath)
            return output_filename 
        except:
            log_exception("tokenisation_response : Error occured during output file creation", self.input_json_data, None)
            raise ServiceError(400, "Tokenisation failed. Something went wrong during output file creation.")

    # tokenising each block text of pagewise data of document with their respective languages.
    def adding_tokenised_text_blockmerger(self, input_json_data_pagewise, in_locale, page_id):
        try:
            log_info("text block tokenisation started for page : %s"%(page_id+1), self.input_json_data)
            blocks = input_json_data_pagewise['text_blocks']
            if blocks is not None:
                for block_id, item in enumerate(blocks):
                    text_data = item['text']
                    tokenised_text = self.tokenisation_core([text_data], in_locale)
                    item['tokenized_sentences'] = [self.making_object_for_tokenised_text(text) for i, text in enumerate(tokenised_text)]
            return input_json_data_pagewise
        except:
            log_error("Keys in block merger response changed or tokenisation went wrong.", self.input_json_data, None) 
            raise ServiceError(400, "Tokenisation failed. Keys in block merger response changed or tokenisation went wrong.")

    # unit element of tokenised sentences output for block level text 
    def making_object_for_tokenised_text(self, text):
        object_text = {
            "src" : text,
            "s_id" : str(uuid.uuid4())
        }
        return object_text
    
    # precleaning before tokenisation
    def remove_extra_spaces(self,text):
        text = text.strip()
        text = text.replace("\\", '')
        text = re.sub('\u200d|\u200c|\n|\r\n', '', text)
        text = re.sub('[\s]{1,}', ' ', text)
        return text

    # merging incomplete sentence of last block to next text block
    def getting_incomplete_text_merging_blocks(self, input_data_file):
        try:
            log_info("incomplete sentence identification and merging across pages started", self.input_json_data)
            for page_idx, page_data in enumerate(input_data_file):
                page_data_blocks = page_data['text_blocks']
                if page_idx+1 < len(input_data_file):
                    last_text_block_idx = self.get_last_text_block_with_text(page_data_blocks)
                    first_text_block_next_page = self.get_first_text_block_with_text(input_data_file[page_idx+1])
                    if not page_data_blocks[last_text_block_idx]['text'].strip().endswith(('.',':','!','?','”',')')) \
                    and input_data_file[page_idx+1]['text_blocks'][first_text_block_next_page]['text'] != None \
                    and input_data_file[page_idx+1]['text_blocks'][first_text_block_next_page]['children'] != None:
                        last_tokenised_sentence_idx = len(page_data_blocks[last_text_block_idx]['tokenized_sentences']) - 1
                        last_sen = page_data_blocks[last_text_block_idx]['tokenized_sentences'][last_tokenised_sentence_idx]['src']
                        first_sen = input_data_file[page_idx+1]['text_blocks'][first_text_block_next_page]['tokenized_sentences'][0]['src']
                        if len(last_sen) < len(first_sen):
                            input_data_file[page_idx+1]['text_blocks'][first_text_block_next_page]['tokenized_sentences'][0]['src'] = \
                                page_data_blocks[last_text_block_idx]['tokenized_sentences'][last_tokenised_sentence_idx]['src'] + ' ' + \
                                    input_data_file[page_idx+1]['text_blocks'][first_text_block_next_page]['tokenized_sentences'][0]['src']
                            del page_data_blocks[last_text_block_idx]['tokenized_sentences'][last_tokenised_sentence_idx]
                        else:
                            page_data_blocks[last_text_block_idx]['tokenized_sentences'][last_tokenised_sentence_idx]['src'] = \
                                page_data_blocks[last_text_block_idx]['tokenized_sentences'][last_tokenised_sentence_idx]['src'] + ' ' + \
                                    input_data_file[page_idx+1]['text_blocks'][first_text_block_next_page]['tokenized_sentences'][0]['src']
                            del input_data_file[page_idx+1]['text_blocks'][first_text_block_next_page]['tokenized_sentences'][0]
            return input_data_file
        except:
            log_error("Merging across pages failed.", self.input_json_data, None) 
            raise ServiceError(400, "Merging across pages failed.")

    # getting last text block of a page other than footer, header, table  
    def get_last_text_block_with_text(self, page_data):
        for block_idx, block in enumerate(page_data):
            if block['attrib'] not in ["FOOTER", "", "TABLE"]:
                last_text_block_idx = block_idx
        return last_text_block_idx

    # getting first text block of a page other than footer, header, table 
    def get_first_text_block_with_text(self, page_data):
        for block_idx, block in enumerate(page_data['text_blocks']):
            if block['attrib'] not in ["FOOTER", "", "TABLE"]:
                return block_idx