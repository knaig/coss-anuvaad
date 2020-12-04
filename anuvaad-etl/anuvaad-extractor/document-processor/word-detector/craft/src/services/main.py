from src.services.extract_images import extract_images
from src.utilities.craft_pytorch.detect import detect_text
from src.utilities.model_response import FileOutput, Page
from src.utilities.request_parse import get_files, get_languages
import config
from anuvaad_auditor.loghandler import log_info
from anuvaad_auditor.loghandler import log_exception
from anuvaad_auditor.loghandler import log_debug



def get_text(app_context,base_dir) :

    images   = extract_images(app_context,base_dir)
    languages = get_languages(app_context)
    words,lines = detect_text(images,languages)

    return  words,lines,images


def get_response(app_context, words, lines, images):

    output = []
    files = get_files(app_context.application_context)

    for file_index, file in enumerate(files):
        file_prperties = FileOutput(file)
        try :
            for page_index, page in enumerate(images[file_index]):
                page_words, page_lines = words[file_index][page_index], lines[file_index][page_index]
                page_properties = Page(page_words, page_lines, page)
                file_prperties.set_page(page_properties.get_page())
                file_prperties.set_page_info(page)
            file_prperties.set_staus(True)
        except Exception as e:
            file_prperties.set_staus(False)
            log_exception("Error occured during response generation" + str(e), app_context.application_context, e)
        
        output.append(file_prperties.get_file())

    app_context.application_context['outputs'] = output

    return app_context.application_context


def TextDetection(app_context,base_dir=config.BASE_DIR):

    log_debug('Block merger starting processing {}'.format(app_context.application_context), app_context.application_context)

    try:

        words,lines,images = get_text(app_context,base_dir)
        response           = get_response(app_context,words,lines,images)

        return {
                'code': 200,
                'message': 'request completed',
                'rsp': response
                }

    except Exception as e:
        log_exception("Error occured during word detection conversion" + str(e),  app_context.application_context, e)

        return {
            'code': 400,
            'message': 'Error occured during pdf to blocks conversion',
            'rsp': None
            }
