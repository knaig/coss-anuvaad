from flask import Blueprint
from flask_restful import Api
import config

from resources import InteractiveTranslateResource, InteractiveMultiTranslateResource, OpenNMTTranslateResource,NMTTranslateResource,InteractiveMultiTranslateResourceNew

TRANSLATE_BLUEPRINT = Blueprint("translate", __name__)

Api(TRANSLATE_BLUEPRINT).add_resource(
    InteractiveTranslateResource, "/interactive-translation"
)

Api(TRANSLATE_BLUEPRINT).add_resource(
    InteractiveMultiTranslateResource, "/v1/interactive-translation"
)

Api(TRANSLATE_BLUEPRINT).add_resource(
    OpenNMTTranslateResource, "/translate-anuvaad"
)

Api(TRANSLATE_BLUEPRINT).add_resource(
    NMTTranslateResource, config.MODULE_NAME + "/v3/translate-anuvaad"
)

Api(TRANSLATE_BLUEPRINT).add_resource(
    InteractiveMultiTranslateResourceNew, config.MODULE_NAME + "/v2/interactive-translation"
)