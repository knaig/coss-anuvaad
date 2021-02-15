import React from "react";
import { Paper, Divider } from "@material-ui/core";
import TextField from '@material-ui/core/TextField';
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import sentenceHighlight from '../../../../utils/SentenceHighlight'
import DownloadJSON from '../../../../flux/actions/apis/download/download_json';
import DownloadFile from '../../../../flux/actions/apis/download/download_zip_file';

import { highlightSentence, clearHighlighBlock, cancelMergeSentence } from '../../../../flux/actions/users/translator_actions';

import SENTENCE_ACTION from '../DocumentEditor/SentenceActions'

const PAGE_OPS = require("../../../../utils/page.operations");
const TELEMETRY = require('../../../../utils/TelemetryManager')

const styles = {
    textField: {
        width: "100%",
        // background: "white",
        background: 'rgb(211,211,211)',
        borderRadius: 10,
        border: 0,
        color: 'green',
    }
}


class OcrPageCard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: '',
            text: '',
            url: '',
        };
        this.handleTextChange = this.handleTextChange.bind(this);
        this.action = null
    }

    componentDidUpdate(prevProps) {
        if (prevProps.block_highlight !== this.props.block_highlight && this.props.block_highlight.block_identifier) {
            this.handleSourceScroll(this.props.block_highlight.block_identifier)
        }
    }

    /**
     * render Sentences
     */
    renderText = (text, region) => {
        return (
            <div style={{
                position: "absolute",
                zIndex: 2,
                textAlign: 'left',
                width: text.boundingBox.vertices[2].x - text.boundingBox.vertices[0].x + 'px',
                height: text.boundingBox.vertices[2].y - text.boundingBox.vertices[0].y + 'px',
                top: text.boundingBox.vertices[0].y - region.boundingBox.vertices[0].y + 'px',
                left: text.boundingBox.vertices[0].x - region.boundingBox.vertices[0].x + 'px',
            }}
            >
                {
                    text.children.map(child => this.renderTextSpan(child, region))
                }
            </div>
        )
    }
    /**
     * render Sentences span
     */
    renderTextSpan = (text, region, flag = false) => {
        // console.log
        return (
            <span
                style={{
                    zIndex: 1,
                    fontFamily: region.font !== undefined && region.font.family,
                    backgroundColor: flag ? 'orange' : '',
                    color: 'black',
                    fontSize: region.font !== undefined && region.avg_size + 'px'
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
                style={styles.textField}
                type="text"
                className="form-control"
                // defaultValue    =   {text.text}
                value={this.state.text}
                variant="outlined"
                id="mui-theme-provider-outlined-input"
                onChange={this.handleTextChange}
                onBlur={() => { this.handleClickAway(text) }}
                autoFocus={true}
                fullWidth
                multiline
            />
        )
    }


    /**
     * render sentence edit
     */
    handleSelectedSentenceId = (text) => {
        this.setState({ text: text.text })
        this.props.clearHighlighBlock()
        this.props.cancelMergeSentence()
        this.props.highlightSentence(text)
        this.action = "click"
    }
    /**
     * click away listner
     */
    handleClickAway = (blockData) => {
        if (this.state.text && (this.action === 'user_typed')) {
            TELEMETRY.sentenceChanged(blockData.text, this.state.text, blockData.block_id, "validation", '')
            let data = PAGE_OPS.get_updated_page_blocks(this.props.document_contents, blockData, this.state.text)
            this.props.onAction(SENTENCE_ACTION.SENTENCE_SOURCE_EDITED, blockData.page_no, [data], "")
        }
        this.setState({ text: null })
        this.action = null;
    }

    handleSourceScroll(id) {
        this.refs[id] && this.refs[id].scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }


    renderChild = (line) => {
        let width = (line.boundingBox.vertices[1].x - line.boundingBox.vertices[0].x) + 'px'
        let height = (line.boundingBox.vertices[2].y - line.boundingBox.vertices[0].y) + 'px'
        let top = (line.boundingBox.vertices[0].y) + 'px'
        let left = (line.boundingBox.vertices[0].x) + 'px'
        return (
            <div style={{
                position: "absolute",
                height: height,
                width: width,
                top: top,
                left: left,
                zIndex: 2,
            }}
                id={line.identifier}
                key={line.identifier}
            >

                {line['children'] &&
                    line['children'].map(child => this.renderText(child, line))
                }
            </div>
        );
    }

    getBGImage = (image) => {
        console.log('inside getBGImage', image)
        let obj = new DownloadFile(image);
        const apiReq1 = fetch(obj.apiEndPoint(), {
            method: "get",
            headers: obj.getHeaders().headers,
        })
            .then(async (response) => {
                if (!response.ok) {
                    this.setState({
                        dialogMessage: "Failed to download file...",
                        timeOut: 3000,
                        variant: "info",
                    });
                    console.log("api failed");
                } else {
                    const buffer = new Uint8Array(await response.arrayBuffer());
                    let res = Buffer.from(buffer).toString("base64");
                    fetch("data:image/jpeg;base64," + res)
                        .then(res => res.blob())
                        .then(blob => {
                            let url = URL.createObjectURL(blob);
                            this.setState({ url })
                        });
                }
            })
            .catch((error) => {
                this.setState({
                    dialogMessage: "Failed to download file...",
                    timeOut: 3000,
                    variant: "info",
                });
                console.log("api failed because of server or network", error);
            });
    }

    renderImage = (image, region) => {
        if (this.props.showImage) {
            let width = region.boundingBox.vertices[1].x - region.boundingBox.vertices[0].x + 'px'
            let height = region.boundingBox.vertices[2].y - region.boundingBox.vertices[0].y + 'px'
            let img = image.replace('upload/', '')

            let style = {
                position: "relative",
                width: width,
                height: height + 'px',
                overflow: "hidden",
                zIndex: 1
            }
            this.getBGImage(img)
            return (
                <div style={style} key={region.identifier}>
                    <img width={width} height={height} src={this.state.url} alt=""></img>
                </div>
            )
        }
        else {
            return <div></div>
        }
    }

    renderPage = (page, image) => {
        if (page) {
            let width = page['vertices'] && page.vertices[1].x - page.vertices[0].x + 'px'
            let height = page['vertices'] && page.vertices[2].y - page.vertices[0].y + 'px'
            return (
                <div>
                    <Paper elevation={2} style={{ textAlign: 'center', position: 'relative', width: width, height: height }}>
                        {page['regions'].map(region => this.renderChild(region, page))}
                        {page['regions'].map(region => {
                            if (region.class === 'BGIMAGE') {
                                return this.renderImage(region.data, region)
                            }
                        })
                        }
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
            // <span style={{ zoom: `${this.props.zoomPercent}%` }}>{this.renderPage(this.props.page, this.props.image)}</span>
            <span style={{ zoom: `${40}%` }}>{this.renderPage(this.props.page, this.props.image)}</span>
        )
    }

}

const mapStateToProps = state => ({
    document_contents: state.document_contents,
    block_highlight: state.block_highlight.block,
    block_page: state.block_highlight.page_no,
    sentence_highlight: state.sentence_highlight.sentence
});

const mapDispatchToProps = dispatch => bindActionCreators(
    {
        highlightSentence,
        clearHighlighBlock,
        cancelMergeSentence
    },
    dispatch
);

export default connect(mapStateToProps, mapDispatchToProps)(OcrPageCard);
