from configs.wfmconfig import tool_blockmerger
from configs.wfmconfig import tool_tokeniser
from configs.wfmconfig import tool_translator


class Translator:
    def __init__(self):
        pass

    # Returns a json of the format accepted by Translator for SYNC and ASYNC
    def get_translator_input_wf(self, wf_input, sync):
        if not sync:
            tool_input = {
                "files": wf_input["input"]["files"]
            }
        else:
            tool_input = {
                "textBlocks": wf_input["input"]["textBlocks"]
            }
        trans_input = {
            "jobID": wf_input["jobID"],
            "workflowCode": wf_input["workflowCode"],
            "stepOrder": 0,
            "tool": tool_translator,
            "input": tool_input,
            "metadata": wf_input["metadata"]
        }
        trans_input["metadata"]["module"] = tool_translator
        return trans_input

    # Returns a json of the format accepted by Translator based on the predecessor.
    def get_translator_input(self, task_output, predecessor):
        if predecessor == tool_tokeniser:
            files = []
            op_files = task_output["output"]
            for file in op_files:
                file = {
                    "path": file["outputFile"],
                    "locale": file["outputLocale"],
                    "type": file["outputType"]
                }
                files.append(file)
        else:
            return None
        tool_input = {
            "files": files
        }
        trans_input = {
            "jobID": task_output["jobID"],
            "workflowCode": task_output["workflowCode"],
            "stepOrder": task_output["stepOrder"],
            "tool": tool_translator,
            "input": tool_input,
            "metadata": task_output["metadata"]
        }
        trans_input["metadata"]["module"] = tool_translator
        return trans_input
