"""
 * @author ['aroop']
 * @email ['aroop.ghosh@tarento.com']
 * @create date 2020-08-18 12:40:01
 * @modify date 2020-08-18 12:40:01
 * @desc [description]
 """
 
from mongoengine import *

class FileContent(DynamicDocument):
    record_id = StringField()
    created_on = DateTimeField()
    page_no = IntField()
