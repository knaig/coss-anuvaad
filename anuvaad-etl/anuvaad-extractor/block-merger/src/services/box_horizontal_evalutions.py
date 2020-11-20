import pandas as pd


def are_hlines(df, configs, idx1, idx2, debug=False):
    space = abs(df.iloc[idx1]['text_top'] - df.iloc[idx2]['text_top'])

    sepration = abs(df.iloc[idx1]['text_left'] + df.iloc[idx1]['text_width'] - df.iloc[idx2]['text_left'])
    avg_height = ( df.iloc[idx1]['text_height'] +  df.iloc[idx2]['text_height'] ) *0.5

    if debug:
        print('are_hlines:: idx1: %d, idx2: %d, space: %d' % (idx1, idx2, space))

    diff_threshold = df.iloc[idx1]['text_height'] *0.50

    return ((space <= diff_threshold ) or(sepration <= 3 *avg_height)) and  (sepration < 6 * avg_height) and (space <= diff_threshold *2.5 ) #configs['SUPERSCRIPT_HEIGHT_DIFFERENCE']


def are_hlines_superscript(df, configs, idx1, idx2, debug=False):

    top_differenc = df.iloc[idx1]['text_top'] - df.iloc[idx2]['text_top']

    if (df.iloc[idx1]['text_top'] > df.iloc[idx2]['text_top']):
        if  (top_differenc <= configs['SUPERSCRIPT_HEIGHT_DIFFERENCE']) &  ( top_differenc >  configs['SUPERSCRIPT_HEIGHT_DIFFERENCE'] /2) :
            return True, idx1, idx2

    if (df.iloc[idx2]['text_top'] > df.iloc[idx1]['text_top']):
        if (top_differenc <= configs['SUPERSCRIPT_HEIGHT_DIFFERENCE']) &  ( top_differenc >  configs['SUPERSCRIPT_HEIGHT_DIFFERENCE'] /2):
            return True, idx2, idx1

    return False, idx1, idx2
