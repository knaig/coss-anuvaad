from anuvaad_auditor.loghandler import log_info
from anuvaad_auditor.loghandler import log_exception
from anuvaad_auditor.loghandler import log_debug
from collections import namedtuple
from src.utilities.region_operations import collate_regions, get_polygon,sort_regions
from src.services.segment import horzontal_merging
import src.utilities.app_context as app_context
import copy
Rectangle = namedtuple('Rectangle', 'xmin ymin xmax ymax')

class MapKeys:
    def __init__(self):
        self.left    =  None
        self.right   =  None
        self.top     =  None
        self.bottom  =  None

    def get_left(self,box):
        left = int(box['boundingBox']['vertices'][0]['x'])
        return left

    def get_right(self,box):
        right = int(box['boundingBox']['vertices'][1]['x'])
        return right

    def get_top(self,box):
        top = int(box['boundingBox']['vertices'][0]['y'])
        return top

    def get_bottom(self,box):
        bottom = int(box['boundingBox']['vertices'][3]['y'])
        return bottom
    def get_height(self,box):
        height = int(abs(self.get_top(box) - self.get_bottom(box)))
        return height
    def get_width(self,box):
        width =  int(abs(self.get_left(box) - self.get_right(box)))
        return width

keys = MapKeys()

class Page_Config:
    
    def avg_region_info(self,page):
        try:
            total_region = 0;  avg_hor_dist = 0 
            for idx, region in enumerate(page):
                if idx+1<len(page):
                    for idx2, region2 in enumerate(page[idx+1:]):
                        if keys.get_right(region)<keys.get_left(region2):
                            hor_dis = abs(keys.get_right(region) - keys.get_left(region2))
                            avg_hor_dist = avg_hor_dist + hor_dis
                            total_region = total_region +1 
                        if keys.get_right(region2)<keys.get_left(region):
                            hor_dis = abs(keys.get_right(region2) - keys.get_left(region))
                            avg_hor_dist = avg_hor_dist + hor_dis
                            total_region = total_region +1 

            avg_hor_dist =  avg_hor_dist / total_region
        except:
            pass
        return avg_hor_dist

    def avg_line_info(self,page):
        try:
            avg_height   = 0;   total_line = 0
            avg_ver_dist = 0;   avg_width  = 0
            ver_dist_mes_count = 0
            for region in page:
                if region['children'] !=None:
                    total_line = total_line+len(region['children'])
                    for idx, line in enumerate(region['children']):
                        height = keys.get_height(line)
                        avg_height = avg_height + height
                        avg_width = avg_width+ keys.get_width(line)
                        current_line_top = keys.get_top(line)
                        if idx<len(region['children'])-1:
                            next_line_top = keys.get_top(region['children'][idx+1])
                            max_height = max( keys.get_height(region['children'][idx+1]) ,keys.get_height(region['children'][idx]))
                            ver_dis = abs(next_line_top-current_line_top)
                            if ver_dis > max_height * 0.5 :
                                avg_ver_dist = avg_ver_dist + ver_dis
                                ver_dist_mes_count +=1


            avg_height   =  avg_height / total_line
            avg_width    =  avg_width / total_line
            if ver_dist_mes_count > 0 :
                avg_ver_dist = avg_ver_dist / ver_dist_mes_count
            else:
                avg_ver_dist = avg_height

        except:
            pass

        return avg_height, avg_ver_dist, avg_width

    def avg_word_sep(self, page):
        try:
            avg_height = 0;
            total_words = 0
            avg_spacing = 0;
            avg_width = 0
            for line in page:
                if line['children'] != None:
                    total_words = total_words + len(line['children'])
                    for idx, word in enumerate(line['children']):

                        if idx < len(line['children']) - 1:

                            #print(len(line['children']))
                            next_line_left = keys.get_left(line['children'][idx + 1])
                            current_line_right = keys.get_right(line['children'][idx])
                            spacing = abs(next_line_left - current_line_right)
                            avg_spacing = avg_spacing + spacing

            avg_spacing = avg_spacing / (total_words - len(page))
        except:
            pass
        return avg_spacing


class Region_Unifier:
    def check_horizon_region(self,box1,box2):
        if keys.get_right(box1)<keys.get_left(box2):
            return True
        if keys.get_right(box2)<keys.get_left(box1):
            return True
        else:
            return False

    def get_text_tabel_region(self,regions):
        text_region = []
        tabel_region = []
        n_text_table_regions = []
        for region in regions:
            if region['class']=='TEXT':
                text_region.append(region)
            if region['class']=='TABLE':
                tabel_region.append(region)
            else :
                n_text_table_regions.append(region)
        return text_region,n_text_table_regions,tabel_region
    


        
    def merge_condition(self,reg1,reg2,avg_height, avg_ver_dist, avg_width,avg_word_sepc):
         
        box1_top = keys.get_top(reg1); box1_bottom = keys.get_bottom(reg1)
        box1_left = keys.get_left(reg1); box1_right = keys.get_right(reg1)
        box2_top = keys.get_top(reg2); box2_bottom = keys.get_bottom(reg2)
        box2_left = keys.get_left(reg2); box2_right = keys.get_right(reg2)
        box1_lines = reg1["children"];  box2_lines = reg2["children"]
        hor_diff_thresh = avg_word_sepc*2 ; line_width_diff = avg_width*0.1
        #print(hor_diff_thresh,'')


        #issue in order
        if box1_left > box2_left :
            sepration = abs(box1_left -box2_right)
        else :
            sepration = abs(box2_left -box1_right)


        if box1_lines!= None and len(box1_lines)>0 and box2_lines!=None and len(box2_lines)>0:
            box1_last_line = box1_lines[-1]; box2_first_line = box2_lines[0]

            #Mergin lines which are detected as regions
            # if (keys.get_height(reg1)<= avg_height*2 and keys.get_height(reg2)<= avg_height+2)  \
            #         and sepration < hor_diff_thresh\
            #         and abs(box2_top-box1_bottom)< 3 * avg_ver_dist:
            #     return True
            # ########### conditions based on merging two horizon regions which are lines and horizontal spaing is less than threshold
            if self.check_horizon_region(reg1,reg2) \
                    and  (keys.get_height(reg1)<= avg_height*2 and keys.get_height(reg2)<= avg_height*2)  :
                if (0<(keys.get_left(reg2)-keys.get_right(reg1))<hor_diff_thresh \
                    and abs(box2_top-box1_bottom)<avg_ver_dist) \
                        or (0<(keys.get_left(reg1)-keys.get_right(reg2))<hor_diff_thresh \
                            and abs(box2_top-box1_bottom)<avg_ver_dist):
                    return True
                else:
                    return False
            ############

            #based on box separation :
            # if abs(keys.get_width(reg1)-keys.get_width(reg2))<line_width_diff\
            #         and abs(box2_top-box1_bottom)<avg_ver_dist *2 \
            #         and  keys.get_right(box2_first_line)-keys.get_right(box1_last_line)< line_width_diff \
            #         and  keys.get_left(box2_first_line)-keys.get_left(box1_last_line)< line_width_diff :
            #     return True

            #IF a running paragraph is broken (1) :
            if len(box1_lines) > 1 :
                box_1_second_last_line = box1_lines[-2]
                if (keys.get_left(box2_first_line)-keys.get_left(box1_last_line)< hor_diff_thresh)\
                        and (keys.get_right(box_1_second_last_line)-keys.get_right(box1_last_line)< hor_diff_thresh)\
                        and abs(box2_top-box1_bottom)<avg_ver_dist *2 :
                    return True

            # IF a running paragraph is broken  (2)
            if keys.get_right(box2_first_line)-keys.get_right(box1_last_line) > hor_diff_thresh*0.5 :
                return  False

            # based on box separation :
            if  abs(box2_top-box1_bottom)<avg_ver_dist *2 \
                    and  keys.get_right(box2_first_line)-keys.get_right(box1_last_line)< hor_diff_thresh \
                    and  keys.get_left(box2_first_line)-keys.get_left(box1_last_line)< hor_diff_thresh :
                return True

            # if abs(box2_top-box1_bottom)<avg_ver_dist and abs(box1_left-box2_left)<50 and abs(box1_right-box2_right)<50:
            #     return True
            # if (abs(box1_bottom-box2_top)<avg_ver_dist*0.5 \
            #     and abs(box1_left-box2_left)<line_width_diff) \
            #         or (abs(box1_bottom-box2_top)<avg_ver_dist*0.5\
            #             and abs(box1_right-box2_right)<line_width_diff):
            #     return True
            # else:
            #     return False
        else:
            return False

    def check_region_unification(self,reg1,reg2,avg_height, avg_ver_dist, avg_width,avg_word_sepc):
        box1_top = keys.get_top(reg1)
        box2_top = keys.get_top(reg2)
        if box1_top < box2_top:
            return  self.merge_condition(reg1,reg2,avg_height, avg_ver_dist, avg_width,avg_word_sepc)
        if box1_top > box2_top:
            return  self.merge_condition(reg2,reg1,avg_height, avg_ver_dist, avg_width,avg_word_sepc)



    def update_children(self,reg1,reg2):
        page_config                         = Page_Config()

        if reg1['children']!=None and len(reg1['children']) > 0 :
            if reg2['children']!=None and len(reg2['children']) > 0 :
                agg_children =  reg1['children'] + reg2['children']
                agg_children.sort(key=lambda x: x['boundingBox']['vertices'][0]['y'])

                children = sort_regions(agg_children , [])
                if len(children) > 1 :
                    avg__region_height, avg__region_ver_dist, avg__region_width = page_config.avg_line_info([{'children': children}])
                    avrage_region_ver_ratio = avg__region_ver_dist / max(1,avg__region_height)
                    return horzontal_merging(children, avrage_region_ver_ratio)
                    #v_list[idx] =v_block
                else:
                    return children
            else :
                return reg1['children']
        else :
            if reg2['children']!=None and len(reg2['children']) > 0 :
                return reg2['children']
            else :
                return []


    def update_coord(self,reg1,reg2):
        #try:
        box1_top = keys.get_top(reg1); box1_bottom = keys.get_bottom(reg1)
        box1_left = keys.get_left(reg1); box1_right = keys.get_right(reg1)
        box2_top = keys.get_top(reg2); box2_bottom = keys.get_bottom(reg2)
        box2_left = keys.get_left(reg2); box2_right = keys.get_right(reg2)

        reg1['children'] = self.update_children(reg1, reg2)


        reg1["boundingBox"]["vertices"][0]['x']= min(box1_left,box2_left)
        reg1["boundingBox"]["vertices"][0]['y']= min(box1_top,box2_top)
        reg1["boundingBox"]["vertices"][1]['x']= max(box1_right,box2_right)
        reg1["boundingBox"]["vertices"][1]['y']= min(box1_top,box2_top)
        reg1["boundingBox"]["vertices"][2]['x']= max(box1_right,box2_right)
        reg1["boundingBox"]["vertices"][2]['y']= max(box1_bottom,box2_bottom)
        reg1["boundingBox"]["vertices"][3]['x']= min(box1_left,box2_left)
        reg1["boundingBox"]["vertices"][3]['y']= max(box1_bottom,box2_bottom)
        #reg1['class'] = 'TEXT'
        # except:
        #     pass

        return reg1


    def is_connected(self,region1, region2,avg_height, avg_ver_dist, avg_width,avg_word_sepc):
        
        region_poly = get_polygon(region2['boundingBox'])
        base_poly = get_polygon(region1['boundingBox'])
        area = base_poly.intersection(region_poly).area
        check = self.check_region_unification(region1,region2,avg_height, avg_ver_dist, avg_width,avg_word_sepc)
        return  area>0 or check


    def merge_remove_overlap(self,text_regions,avg_height, avg_ver_dist, avg_width,avg_word_sepc):
        region_updated = []
        flag =False
        while len(text_regions)>0:
            check = False
            region_temp= text_regions[1:]
            for idx2,region2 in enumerate(region_temp):
                if self.is_connected(text_regions[0], region2, avg_height, avg_ver_dist, avg_width,avg_word_sepc):
                    region1 = self.update_coord(text_regions[0],region2)
                    text_regions[0] = copy.deepcopy(region1)
                    check =True ;  flag = True
                    del text_regions[idx2+1]
                    break    
            if check == False:
                region_updated.append(copy.deepcopy(text_regions[0]))
                del text_regions[0]
        return region_updated, flag

    #middle box merging kan_1_0
    # secnod ponint (2.) mergingkam_1_1
    # horizontal block merging kan_1_7
    # b1_last_line b2_fisrst line right comparish kan_1_9
    #kan_1_12
    #kan_1_16  line merrgin issue    , merging above 7.1
    #kan_1_20  (check after h_mergng is fixed)
    #kna_1_21
    #kan_1_22  (check whti lef/ right diff ) horizontal_diff threahold
    #kan_1_29 horzontal region mersing if regions are very colse (a seprate condition)
    #kan_1_30
    #yolo_1_1
    #20695_1_0 (reportable)
    #20695_1_2 (merging of list with numbering)
    #20695_1_3  sorting issue
    # segmeter kan_1_1
    # background removal  (sasta fix)
    # basckground removal integration with prima
    #segmenter kan_1_23
    #36066_2008_3_1502_15489_Judgement_01-Aug-2019_ORI     page [1,6]  last line of paragraph


    def region_unifier(self,page_words, page_lines,page_regions):
        try:
            
            text_region,n_text_table_regions,tabel_region = self.get_text_tabel_region(page_regions)
            line_list    = collate_regions(page_lines,page_words)
            v_list       = collate_regions(text_region,line_list,grand_children=True)
            t_list       = collate_regions(tabel_region,page_words,grand_children=True,region_flag = False)
            # line_list    = collate_regions(page_lines,page_words)
            # v_list       = collate_regions(page_regions,line_list,grand_children=True)
            page_config                         = Page_Config()
            # text_regions, n_text_regions = self.get_text_region(v_list)
            avg_height, avg_ver_dist, avg_width = page_config.avg_line_info(v_list)

            self.avg_ver_ratio =   avg_ver_dist /avg_height





            for idx,v_block in enumerate(v_list):
                if   v_block['children'] != None and  len(v_block['children']) > 1 :
                    #print(idx, 'region index')
                    #print('merging horrrrrrrrrrrrrrrrrrrr' , len(v_block['children']))
                    avg__region_height, avg__region_ver_dist, avg__region_width = page_config.avg_line_info([v_block])

                    avrage_region_ver_ratio= avg__region_ver_dist / max(1,avg__region_height)

                    v_block['children'] = horzontal_merging(v_block['children'],avrage_region_ver_ratio)
                    v_list[idx] =v_block



            for idx,t_block in enumerate(t_list):
                if   t_block['children'] != None and  len(t_block['children']) > 1 :
                    #print(idx, 'region index')
                    #print('merging horrrrrrrrrrrrrrrrrrrr' , len(v_block['children']))
                    avg__region_height, avg__region_ver_dist, avg__region_width = page_config.avg_line_info([t_block])
                    avrage_region_ver_ratio= avg__region_ver_dist / max(1,avg__region_height)
                    t_block['children'] = horzontal_merging(t_block['children'],avrage_region_ver_ratio)
                    t_list[idx] =t_block



            ################### page configs for region unifier
            #avg_hor_dist      = page_config.avg_region_info(text_regions)
            avg_word_sepc     = page_config.avg_word_sep(line_list)


            # print("av height : ",avg_height)
            # print("avg_ver_dist : ",avg_ver_dist)
            # print("av avg_width : ",avg_width)
            # print("avg_hor_dist", avg_hor_dist)
            # print('avg word spacing', avg_word_sepc)
            # print("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
            ########################
            n_text_table_regions.extend(t_list)
            flag =True
            while flag==True:
                v_list, flag = self.merge_remove_overlap(v_list,avg_height, avg_ver_dist, avg_width,avg_word_sepc)
        except Exception as e:
            log_exception("Error occured during block unifier",  app_context.application_context, e)
            return None  ,None

        return v_list, n_text_table_regions
