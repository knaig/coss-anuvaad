from .translate import InteractiveTranslateResource, InteractiveMultiTranslateResource, OpenNMTTranslateResource, \
                       InteractiveMultiTranslateResourceNew,NMTTranslateResource, TranslateResourceV4, InteractiveMultiTranslateResourceV3,\
                       NMTTranslateResourceULCA
from .model_convert import ModelConvertResource
from .labse_aligner import LabseAlignerResource
from .fetch_models import FetchModelsResource, CreateModelResource,FetchSingleModelResource,UpdateModelsResource,DeleteModelResource,\
                          FetchModelsResource_v2,FetchSingleModelIDResource
from .performance import BatchNMTPerformanceResource
from .health import HealthResource