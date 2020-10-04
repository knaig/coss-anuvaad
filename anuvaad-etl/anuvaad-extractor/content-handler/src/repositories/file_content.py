import config
from models import BlockModel
import datetime

class FileContentRepositories:

    @staticmethod
    def update_block_info(block, record_id, page_no, data_type, user_id):
        new_block               = {}
        new_block['created_on'] = datetime.datetime.utcnow()
        new_block['record_id']  = record_id
        new_block['page_no']    = page_no
        new_block['data_type']  = data_type
        new_block['job_id']     = record_id.split('|')[0]
        new_block['created_by'] = user_id
        new_block['data']       = block

        '''
            storing a Step-0/baseline translation
        '''
        if 'tokenized_sentences' in list(block.keys()):
            for elem in block['tokenized_sentences']:
                elem['s0_tgt']    = elem['tgt']
                elem['s0_src']    = elem['tgt']
                del elem['input_subwords']
                del elem['output_subwords']
                del elem['pred_score']
                del elem['tagged_src']
                del elem['tagged_tgt'] 

        new_block['block_identifier']   = block['block_identifier']
        return new_block

    @staticmethod
    def store(user_id, file_locale, record_id, pages):
        blocks = []
        for page in pages:
            if 'images' in list(page.keys()):
                for image in page['images']:
                    blocks.append(FileContentRepositories.update_block_info(image, record_id, page['page_no'], 'images', user_id))

            if  'lines' in list(page.keys()):
                for line in page['lines']:
                    blocks.append(FileContentRepositories.update_block_info(line, record_id, page['page_no'], 'lines', user_id))

            if 'text_blocks' in list(page.keys()):
                for text in page['text_blocks']:
                    blocks.append(FileContentRepositories.update_block_info(text, record_id, page['page_no'], 'text_blocks', user_id))

        BlockModel.store_bulk_blocks(blocks)
        return True
        
    @staticmethod
    def get(user_id, record_id, start_page=1, end_page=5):
        total_page_count    = BlockModel.get_document_total_page_count(user_id, record_id)

        if start_page == 0 and end_page == 0:
            start_page  = 1
            end_page    = total_page_count
        
        if start_page == 0:
            start_page  = 1
        if end_page == 0:
            end_page   = 5
        if start_page > end_page:
            return False

        data            = {}
        data['pages']   = []
        for i in range(start_page, end_page+1):
            page_blocks = BlockModel.get_blocks_by_page(user_id, record_id, i)

            page    = {}
            for block in page_blocks:
                page[block['_id']] = block['data']

            if len(block['data']) > 0 :
                page['page_height']     = block['data'][0]['page_info']['page_height']
                page['page_no']         = block['data'][0]['page_info']['page_no']
                page['page_width']      = block['data'][0]['page_info']['page_width']

            data['pages'].append(page)

        data['start_page']  = start_page
        data['end_page']    = end_page
        data['total']       = total_page_count
        return data
