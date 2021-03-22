from configs.wfmconfig import tool_ocrdd15googlevision
from configs.wfmconfig import tool_blocksegmenter


class OCRDD15GV:

    def __init__(self):
        pass

    # Returns a json of the format accepted by OCR-GV
    def get_oddgv_input_wf(self, wf_input):
        files = wf_input["input"]["files"]
        inputs = []
        for file in files:
            obj = {
                "file": {
                    "identifier": file["path"],
                    "name": file["path"],
                    "type": file["type"]
                },
                "config": file["config"]
            }
            inputs.append(obj)
        tool_input = {
            "files": inputs
        }
        ogv_input = {
            "jobID": wf_input["jobID"],
            "workflowCode": wf_input["workflowCode"],
            "stepOrder": 0,
            "tool": tool_ocrdd15googlevision,
            "input": tool_input,
            "metadata": wf_input["metadata"]
        }
        ogv_input["metadata"]["module"] = tool_ocrdd15googlevision
        return ogv_input

    # Returns a json of the format accepted by OCR-GV based on a predecessor.
    def get_oddgv_input(self, task_output, predecessor):
        files = []
        if predecessor == tool_blocksegmenter:
            output = task_output["output"]
            for op_file in output:
                obj = {
                    "file": {
                        "identifier": op_file["outputFile"],
                        "name": op_file["outputFile"],
                        "type": op_file["outputType"]
                    }
                }
                files.append(obj)
        else:
            return None
        tool_input = {
            "files": files
        }
        ocrddgv_input = {
            "jobID": task_output["jobID"],
            "workflowCode": task_output["workflowCode"],
            "stepOrder": task_output["stepOrder"],
            "tool": tool_ocrdd15googlevision,
            "input": tool_input,
            "metadata": task_output["metadata"]
        }
        ocrddgv_input["metadata"]["module"] = tool_ocrdd15googlevision
        return ocrddgv_input
