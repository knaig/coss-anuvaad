from flask_restful import Resource
from flask import request
from models import CustomResponse, Status
from utilities import MODULE_CONTEXT
from anuvaad_auditor.loghandler import log_info, log_exception
import os
import subprocess
import GPUtil

class HealthResource(Resource):
    def get(self):
        try:
            gpu_stat = {}
            log_info("NMT Health api called",MODULE_CONTEXT)
            Gpus = GPUtil.getGPUs()
            GPUtil.showUtilization()
            # pipe = subprocess.Popen(["gpustat", "--json"], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
            # res = pipe.stdout.read()
            # res = res.decode('utf-8')
            usage_0 = Gpus[0]
            usage_percent = usage_0.memoryUsed/usage_0.memoryTotal
            gpu_stat['memoryUsed'] = usage_0.memoryUsed
            gpu_stat['memoryTotal'] = usage_0.memoryTotal
            log_info("GPU usage %:{}".format(usage_percent*100),MODULE_CONTEXT)
            # pipe = os.system('gpustat --json')
            out = CustomResponse(Status.SUCCESS.value,gpu_stat)
            return out.jsonify_res()      
        except Exception as e:
            log_exception("*********************GPU out of memory usage*************************",MODULE_CONTEXT,e)  
            out = CustomResponse(Status.SEVER_MODEL_ERR.value,[])
            return out.jsonify_res()  
        
        