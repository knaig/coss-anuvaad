from configs.wfmconfig import tool_ocrdd10googlevision, tool_fileconverter, tool_blocksegmenter

class OCRDD10GV:

    def __init__(self):
        pass

    # Returns a json of the format accepted by OCR-GV
    def get_odd10gv_input_wf(self, wf_input):
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
            "inputs": inputs
        }
        ogv_input = {
            "jobID": wf_input["jobID"],
            "workflowCode": wf_input["workflowCode"],
            "stepOrder": 0,
            "tool": tool_ocrdd10googlevision,
            "input": tool_input,
            "metadata": wf_input["metadata"]
        }
        ogv_input["metadata"]["module"] = tool_ocrdd10googlevision
        return ogv_input

    # Returns a json of the format accepted by OCR-GV based on a predecessor.
    def get_odd10gv_input(self, task_output, predecessor):
        files = []
        if predecessor in [tool_blocksegmenter, tool_fileconverter]:
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
            "inputs": files
        }
        ocrddgv_input = {
            "jobID": task_output["jobID"],
            "workflowCode": task_output["workflowCode"],
            "stepOrder": task_output["stepOrder"],
            "tool": tool_ocrdd10googlevision,
            "input": tool_input,
            "metadata": task_output["metadata"]
        }
        ocrddgv_input["metadata"]["module"] = tool_ocrdd10googlevision
        return ocrddgv_input
