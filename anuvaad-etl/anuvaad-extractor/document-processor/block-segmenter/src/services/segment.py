import config
from anuvaad_auditor.loghandler import log_error
import src.utilities.app_context as app_context
from src.utilities.region_operations import get_ngram, are_hlines,merge_children,MapKeys,sort_regions
from src.services.left_right_on_block import left_right_margin
#from src.services.region_unifier import Region_Unifier
import copy

#region_unifier = Region_Unifier()


##Line inside line caese (eg kan_1_1)  dont use abosolute for horizontal merging

def horzontal_merging(children):
    bi_gram = get_ngram(children, 2)
    lines = [bi_gram[0][0]]
    print(lines,'linesssssssssssssss')
    for pair in bi_gram:
        connected = are_hlines(pair[0], pair[1])
        if connected:
            reg1 = copy.deepcopy(lines[-1])
            reg2 = pair[1]
            lines[-1]= update_coord(reg1,reg2)
        else:
            lines.append(pair[1])
    merged_lines =[]
    #for siblings in lines:
    # merged_lines.append(merge_children(siblings))
    return lines








def update_children(reg1,reg2):
    if reg1['children']!=None and len(reg1['children']) > 0 :
        if reg2['children']!=None and len(reg2['children']) > 0 :
            agg_children =  reg1['children'] + reg2['children']
            agg_children.sort(key=lambda x: x['boundingBox']['vertices'][0]['y'])

            children = sort_regions(agg_children , [])
            if len(children) > 1 :
                return children #horzontal_merging(children)
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


def update_coord(reg1,reg2):
    #try:
    box1 = MapKeys(reg1)
    box2 = MapKeys(reg2)

    reg1['children'] = update_children(reg1, reg2)


    reg1["boundingBox"]["vertices"][0]['x']= min(box1.get_left(),box2.get_left())
    reg1["boundingBox"]["vertices"][0]['y']= min(box1.get_top(),box2.get_top())
    reg1["boundingBox"]["vertices"][1]['x']= max(box1.get_right(),box2.get_right())
    reg1["boundingBox"]["vertices"][1]['y']= min(box1.get_top(),box2.get_top())
    reg1["boundingBox"]["vertices"][2]['x']= max(box1.get_right(),box2.get_right())
    reg1["boundingBox"]["vertices"][2]['y']= max(box1.get_bottom(),box2.get_bottom())
    reg1["boundingBox"]["vertices"][3]['x']= min(box1.get_left(),box2.get_left())
    reg1["boundingBox"]["vertices"][3]['y']= max(box1.get_bottom(),box2.get_bottom())
    #reg1['class'] = 'TEXT'
    # except:
    #     pass

    return reg1





def break_block(v_block):
    #try:
    block_configs = config.BLOCK_CONFIGS
    if  v_block['children'] != None and  len(v_block['children'] ) < 2 :
        return v_block['children']
    else:
        return break_paragraph(v_block, block_configs)
    #except Exception as e :
    #    log_error('Error in breaking blocks' + str(e), app_context.application_context, e)
    #    return None




def break_paragraph(v_block,block_configs):
    map_v_block = MapKeys(v_block)

    bi_gram = get_ngram(v_block['children'], 2)
    blocks = [[bi_gram[0][0]]]
    for pair in bi_gram:
        connected = left_right_condition(MapKeys(pair[0]),MapKeys(pair[1]) ,map_v_block.get_right(),map_v_block.get_left(),block_configs)
        if connected:
            blocks[-1].append(pair[1])
        else:
            blocks.append([pair[1]])

    p_blocks = []
    for siblings in blocks:
        p_blocks.append(merge_children(siblings))

    return p_blocks


#
#
# def group_by_visual_break(v_block):
#     chunk_data = [None]
#     chunk_data = chunk_data * len(block_df)
#     visual_index = 0
#
#     if v_block['children'] != None :
#         for line in v_block['children']:
#         if chunk_data[visual_index] == None:
#             chunk_data[visual_index] = []
#             chunk_data[visual_index].append(block_df['data'][index])
#         else:
#             chunk_data[visual_index].append(block_df['data'][index])
#         visual_index += row['visual_break']
#
#     text_chunks = [text for text in text_chunks if text != '']
#     chunk_data = [data for data in chunk_data if data != None]
#
    return text_chunks, chunk_data




def left_right_condition(current_line, next_line, para_right, para_left, block_configs):
    right_margin_threshold = block_configs["right_margin_threshold"];
    left_margin_threshold = block_configs["left_margin_threshold"]
    right_break_threshold = block_configs["right_break_threshold"];
    left_break_threshold = block_configs["left_break_threshold"]
    header_left_threshold = block_configs["header_left_threshold"];
    header_right_threshold = block_configs["header_right_threshold"]
    space_multiply_factor = block_configs["space_multiply_factor"]

    #flag = False



    #current_line = MapKeys(children_list[line_index -1])
    #next_line     = MapKeys(children_list[line_index])
    left1 = current_line.get_left()
    right1 = current_line.get_right()
    h1 = current_line.get_bottom()
    h2 = next_line.get_top()
    left2 = next_line.get_left()
    right2 = next_line.get_right()
    right_margin = right_margin_threshold * current_line.get_width()
    left_margin = left_margin_threshold * current_line.get_width()
    v_spacing = abs(h2 - h1)

    space_factor = max(current_line.get_height(), next_line.get_height())

    ## CONDITION BASED ON LENGTH RATIO OF TWO CONSECUTIVE LINES W.R.T BLOCK
    if length_ratio(para_right, para_left, left2, right2, left1, right1):
        return False

    ### CONDITION BASED ON VERTICAL SPACING OF TWO CONSECUTIVE LINES
    if v_spacing > space_factor * space_multiply_factor or left2 > right1 or left1 > right2:
        return False
        ### CONDITION BASED ON POSITION OF LINE IN BLOCK (MOSTLY FOR HEADER TYPE CONDITION)
    if (left1 * (header_left_threshold - 0.08) > para_left and right1 < para_right * header_right_threshold):
        return False
    if (left2 * (
            header_left_threshold - 0.20) > para_left and left1 != left2 and right2 < para_right * header_right_threshold) or (
            left2 * (
            header_left_threshold - .20) > left1 and left1 != left2 and right2 < right1 * header_right_threshold):
        return False
        # CURRENT LINE BREAK WHEN NEXT LINE IS NOT IN MARGIN WITH FIRST LINE
    if (left1 == left2 and right1 < right2 - right2 * right_break_threshold) or (
            left1 - left_break_threshold * current_line.get_left() > left2 and right1 <= right2 - right_break_threshold * current_line.get_right()):
        return False

        ### IF LINES ARE IN LEFT AND RIGHT MARGIN MEANS THAY ARE CONNECTED WITH EACH OTHERS
    elif (left1 == left2 and right1 == right2) or (left1 == left2 and right2 >= right1 - right_margin):
        if v_spacing > space_factor *space_multiply_factor:
            return False
        else:
            return True
    elif (left1 + left_margin >= left2 and left2 > left1 and right1 == right2) or (
            left1 + left_margin >= left2 and left2 > left1 and right2 >= right1 - right_margin):
        if v_spacing > space_factor * space_multiply_factor:
            return False
        else:
            return True
    elif (left1 - left_margin <= left2 and left2 < left1 and right1 == right2) or (
            left1 - left_margin <= left2 and left2 < left1 and right2 >= right1 - right_margin):
        if v_spacing > space_factor * space_multiply_factor:
            return  False
        else:
            return True

    elif (abs(right2 - right1) <  space_factor ):
        if v_spacing > space_factor * space_multiply_factor:
            return  False
        else:
            return True
    else:
        if v_spacing > space_factor * space_multiply_factor:
            return False
        else:
          return True

    #return flag



def length_ratio(para_right, para_left, left2, right2, left1, right1):
    try:
        para_length = para_right - para_left;
        prev_line_length = right1 - left1;
        current_line_length = right2 - left2
        prev_line_ratio = para_length / prev_line_length
        next_line_ratio = para_length / current_line_length

        if prev_line_ratio > 2.5 and next_line_ratio > 2.5:
            return True
        else:
            return False
    except:
        pass
