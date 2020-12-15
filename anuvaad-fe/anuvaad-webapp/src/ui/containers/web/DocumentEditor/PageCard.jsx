import React from "react";
import { Paper, Divider } from "@material-ui/core";
import TextField from '@material-ui/core/TextField';
import { Textfit } from "react-textfit";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import { highlightSentence, clearHighlighBlock, cancelMergeSentence } from '../../../../flux/actions/users/translator_actions';

import SENTENCE_ACTION from './SentenceActions'

const PAGE_OPS = require("../../../../utils/page.operations");
const TELEMETRY = require('../../../../utils/TelemetryManager')

const styles = {
    textField: {
        width       : "100%", 
        // background: "white",
        background  : 'rgb(211,211,211)',
        borderRadius: 10,
        border      : 0,
        color       : 'green',
    }
}

class PageCard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value   : '',
            text:''
        };
        this.handleTextChange   = this.handleTextChange.bind(this);
        this.action             = null
    }

    // shouldComponentUpdate(prevProps, nextState) {
    //     if (prevProps.page) {
    //         if (prevProps.sentence_highlight && (prevProps.page.page_no === prevProps.sentence_highlight.page_no)) {
    //             return true
    //         }
    //         if( prevProps.page.page_no === prevProps.block_page){
    //             return true
    //         }
    //         return false
    //     }
    //     return true;
    // }

    componentDidUpdate(prevProps) {
        if (prevProps.block_highlight !== this.props.block_highlight && this.props.block_highlight.block_identifier) {
            this.handleSourceScroll(this.props.block_highlight.block_identifier)
        }
    }

    /**
     * render Sentences
     */
    renderText = (text, block) => {
        let style           = {
            position        : "absolute",
            top             : ((text.block_id === (this.props.sentence_highlight && this.props.sentence_highlight.block_id) && this.action) ? text.text_top - block.text_top - 20 : text.text_top - block.text_top) + 'px',
            left            : text.text_left - block.text_left + 'px',
            width           : text.text_width + 'px',
            height          : text.text_height + 'px',
            lineHeight      : text.avg_line_height + 'px',
            // textAlignLast   : "justify",
            zIndex          : (text.block_id === (this.props.sentence_highlight && this.props.sentence_highlight.block_id) && this.action) ? 100000 : 2
        };
        return (
            
            <div style={style} key={text.block_id} ref={text.block_identifier}>
                {((text.block_id == (this.props.sentence_highlight && this.props.sentence_highlight.block_id)) && this.action) ?
                    this.renderTextField(text)
                    :
                    this.renderTextFit(text)
                }
            </div>
        )
    }

    renderTextFit = (text) => {
        if (this.props.block_highlight) {
            let sentence = this.props.block_highlight.src;
            if (this.props.block_highlight.block_identifier === text.block_identifier) {
                /*Left and right has the same length */
                if (sentence !== undefined) {
                    if (sentence.replace(/\s/g, '').includes(text.text.replace(/\s/g, '')) && text.text.replace(/\s/g, '').length === sentence.replace(/\s/g, '').length) {
                        return <Textfit mode="single" style={{ width: parseInt(text.text_width), color: text.font_color }} min={1} max={text.font_size ? parseInt(text.font_size) : 16}>
                            {this.renderTextSpan(text, true)}
                        </Textfit>
                    }
                    /**
                     * Left is greater than right
                     */
                    else if (text.text.replace(/\s/g, '').length > sentence.replace(/\s/g, '').length && text.text.replace(/\s/g, '').includes(sentence.replace(/\s/g, ''))) {
                        if (text.text.replace(/\s/g, '').indexOf(sentence.replace(/\s/g, '')) === 0) {
                            let coloredText = JSON.parse(JSON.stringify(text));
                            let nonColoredText = JSON.parse(JSON.stringify(text));
                            coloredText.text = sentence;
                            nonColoredText.text = text.text.substr(sentence.length - 1);
                            return <Textfit mode="single" style={{ width: parseInt(text.text_width), color: text.font_color }} min={1} max={text.font_size ? parseInt(text.font_size) : 16}>
                                {this.renderTextSpan(coloredText, true)}
                                {this.renderTextSpan(nonColoredText, false)}
                            </Textfit>

                        } else if (text.text.replace(/\s/g, '').indexOf(sentence.replace(/\s/g, '')) > 0) {
                            let firstHalfText = JSON.parse(JSON.stringify(text));
                            let secondHalfText = JSON.parse(JSON.stringify(text));
                            let coloredText = JSON.parse(JSON.stringify(text));
                            coloredText.text = sentence;
                            firstHalfText.text = text.text.substr(0, text.text.indexOf(sentence));
                            secondHalfText.text = text.text.substr(text.text.indexOf(sentence) + sentence.length);
                            return <Textfit mode="single" style={{ width: parseInt(text.text_width), color: text.font_color }} min={1} max={text.font_size ? parseInt(text.font_size) : 16}>
                                {this.renderTextSpan(firstHalfText, false)}
                                {this.renderTextSpan(coloredText, true)}
                                {this.renderTextSpan(secondHalfText, false)}
                            </Textfit>

                        }
                    }
                }
                /**
                 * When a portion of sentence is present in the text
                 */

                if (text.text.includes(sentence.split(' ')[0])) {
                    let tempText = text.text.substr(text.text.indexOf(sentence.trim().split(' ')[0]));
                    if (sentence.replace(/\s/g, '').includes(tempText.replace(/\s/g, ''))) {
                        let coloredText = JSON.parse(JSON.stringify(text));
                        let nonColoredText = JSON.parse(JSON.stringify(text));
                        coloredText.text = tempText;
                        if (text.text.replace(/\s/g, '').indexOf(sentence.split(' ')[0].replace(/\s/g, '')) === 0) {
                            nonColoredText.text = text.text.substr(tempText.length);
                            return (
                                <Textfit mode="single" style={{ width: parseInt(text.text_width), color: text.font_color }} min={1} max={text.font_size ? parseInt(text.font_size) : 16}>
                                    {this.renderTextSpan(coloredText, true)}
                                    {this.renderTextSpan(nonColoredText)}
                                </Textfit>
                            )
                        } else {
                            nonColoredText.text = text.text.substr(0, text.text.indexOf(tempText));
                            return (
                                <Textfit mode="single" style={{ width: parseInt(text.text_width), color: text.font_color }} min={1} max={text.font_size ? parseInt(text.font_size) : 16}>
                                    {this.renderTextSpan(nonColoredText)}
                                    {this.renderTextSpan(coloredText, true)}
                                </Textfit>
                            )
                        }
                    }
                }
                /**
                 * When right is greater than left
                 */

                if (sentence.replace(/\s/g, '').includes(text.text.replace(/\s/g, '')) && text.text.replace(/\s/g, '').length < sentence.replace(/\s/g, '').length) {
                    return <Textfit mode="single" style={{ width: parseInt(text.text_width), color: text.font_color }} min={1} max={text.font_size ? parseInt(text.font_size) : 16}>
                        {this.renderTextSpan(text, true)}
                    </Textfit>

                }

                /**
                 * When a portion of text is present in sentence
                 */
                if (sentence.replace(/\s/g, '').includes(text.text.split(' ')[0].replace(/\s/g, ''))) {
                    let tempText = sentence.substr(sentence.indexOf(text.text.split(' ')[0]));
                    if (text.text.replace(/\s/g, '').includes(tempText.replace(/\s/g, ''))) {
                        let coloredText = JSON.parse(JSON.stringify(text));
                        let nonColoredText = JSON.parse(JSON.stringify(text));
                        coloredText.text = tempText;
                        if (text.text.replace(/\s/g, '').indexOf(tempText.replace(/\s/g, '')) === 0) {
                            nonColoredText.text = text.text.substr(tempText.length);
                            return (
                                <Textfit mode="single" style={{ width: parseInt(text.text_width), color: text.font_color }} min={1} max={text.font_size ? parseInt(text.font_size) : 16}>
                                    {this.renderTextSpan(coloredText, true)}
                                    {this.renderTextSpan(nonColoredText)}
                                </Textfit>
                            )
                        }
                    }
                }
            }
        }
        /**
         * Initial rendering or when block_identifier is not matching
         */
        return (
            <Textfit mode="single" style={{ width: parseInt(text.text_width), color: text.font_color }} min={1} max={text.font_size ? parseInt(text.font_size) : 16} >
                { this.renderTextSpan(text)}
            </Textfit >
        )
    }
    /**
     * render Sentences span
     */
    renderTextSpan = (text, flag = false) => {
        return (
            <span
                style={{
                    zIndex: 1,
                    fontFamily: text.font_family,
                    fontWeight: (text.font_family && text.font_family.includes("Bold") || text.attrib && text.attrib.toLowerCase().includes("bold")) && 'bold',
                    backgroundColor: flag ? 'orange' : ''
                }}
                id={text.block_id}
                onDoubleClick={() => { this.handleSelectedSentenceId(text) }}
            >
                {text.text}
            </span>
        )
    }

    /**
     * sentence change
     */
    handleTextChange(event) {
        this.action = 'user_typed'
        this.setState({ text: event.target.value });
    }

    /**
     * render sentence edit
     */
    renderTextField = (text) => {
        return (
            <TextField
                style           =   {styles.textField} 
                type            =   "text" 
                className       =   "form-control"
                // defaultValue    =   {text.text}
                value           =   {this.state.text}
                variant         =   "outlined"
                id              =   "mui-theme-provider-outlined-input"
                onChange        =   {this.handleTextChange}
                onBlur          =   {() => { this.handleClickAway(text) }}
                autoFocus       =   {true}
                fullWidth
                multiline
            />
        )
    }


    /**
     * render sentence edit
     */
    handleSelectedSentenceId = (text) => {
        
        this.setState({text: text.text })
        this.props.clearHighlighBlock()
        this.props.cancelMergeSentence()
        this.props.highlightSentence(text)
        this.action = "click"
    }
    /**
     * click away listner
     */
    handleClickAway = (blockData) => {
        if(this.state.text && (this.action === 'user_typed')) {
            TELEMETRY.sentenceChanged(blockData.text, this.state.text, blockData.block_id,"validation")
            let data = PAGE_OPS.get_updated_page_blocks(this.props.document_contents, blockData, this.state.text)
            this.props.onAction(SENTENCE_ACTION.SENTENCE_SOURCE_EDITED, blockData.page_no, [data], "") 
        }
        this.setState({text:null})
        this.action = null;
    }

    handleSourceScroll(id) {
        this.refs[id] && this.refs[id].scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }


    renderBlock = (block) => {
        
        return (
            <div style={{
                position    : "absolute", top: block.text_top + 'px',
                left        : block.text_left + 'px',
                width       : block.text_width + 'px',
                height      : block.text_height + 'px',
                zIndex      : 2,
                border      : this.props.block_highlight && this.props.block_highlight.block_identifier == block.block_identifier ? "2px solid #1C9AB7" : ''
            }}
                id          =   {block.block_identifier}
                key         =   {block.block_identifier}>
                {block['texts'].map(text => this.renderText(text, block))}
            </div>
        )
    }

    renderImage = (image) => {
        let style = {
            position    : "relative",
            top         : image.text_top + 'px',
            left        : image.text_left + 'px',
            width       : image.text_width + 'px',
            height      : image.text_height + 'px',
            overflow    : "hidden",
            zIndex      : 1
        }

        return (
            <div style={style} key={image.block_identifier}>
                
                <img width={image.text_width + "px"} height={image.text_height + "px"} src={`data:image/png;base64,${image.base64}`} alt=""></img>
                
            </div>
        )
    }

    renderPage = (page) => {
        if (page['blocks'] || (page['blocks'] && page['images'])) {
            return (
                <div>
                    <Paper elevation={2} style ={{position:'relative', width:page.page_width + 'px', height:page.page_height +"px"}}>
                        {page['blocks'].map(block => this.renderBlock(block))}
                        {page['images'].map((images) => this.renderImage(images))}
                    </Paper>
                    <Divider />
                </div>
            )
        }
        return (
            <div></div>
        )
    }

    render() {
        return (
            <div style = {{ overflow:"auto"}}>
                {this.renderPage(this.props.page)}
            </div>
        )
    }

}

const mapStateToProps = state => ({
    document_contents   : state.document_contents,
    block_highlight     : state.block_highlight.block,
    block_page          : state.block_highlight.page_no,
    sentence_highlight  : state.sentence_highlight.sentence
});

const mapDispatchToProps = dispatch => bindActionCreators(
    {
        highlightSentence,
        clearHighlighBlock,
        cancelMergeSentence
    },
    dispatch
);

export default connect(mapStateToProps, mapDispatchToProps)(PageCard);
