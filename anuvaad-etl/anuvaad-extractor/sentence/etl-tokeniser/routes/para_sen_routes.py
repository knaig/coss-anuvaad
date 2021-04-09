from flask import Blueprint
from flask_restful import Api
from resources.para_sen import SenTokenisePostWF
from resources.para_sen import SentenceTokenise
from resources.para_sen import BlockTokenize

# end-point for independent service
TOK_BLUEPRINT = Blueprint("sentence_extraction", __name__)
api = Api(TOK_BLUEPRINT)
api.add_resource(SentenceTokenise, "/tokenisation")

# end-point for workflow service
TOK_BLUEPRINT_wf = Blueprint("paragraph_sentence_extraction_wf", __name__)
api_wf = Api(TOK_BLUEPRINT_wf)
api_wf.add_resource(SenTokenisePostWF, "/tokenisation-wf")

# end-point for independent blocks tokenisation
TOK_BLOCK_BLUEPRINT_wf = Blueprint("block_text_sentence_extraction_wf", __name__)
api_wf = Api(TOK_BLOCK_BLUEPRINT_wf)
api_wf.add_resource(BlockTokenize, "/blocks-tokenisation-wf")