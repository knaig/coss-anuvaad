import React from "react";
import { withRouter } from "react-router-dom";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import APITransport from "../../../../flux/actions/apitransport/apitransport";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Fab";
import { translate } from "../../../../assets/localisation";
import history from "../../../../web.history";
import ClearContent from "../../../../flux/actions/apis/clearcontent";
import FileContent from "../../../../flux/actions/apis/fetchcontent";
import Spinner from "../../../components/web/common/Spinner";
import Paper from "@material-ui/core/Paper";
import Toolbar from "@material-ui/core/Toolbar";
import InfiniteScroll from "react-infinite-scroll-component";
import CircularProgress from "@material-ui/core/CircularProgress";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import Typography from "@material-ui/core/Typography";
import Snackbar from "../../../components/web/common/Snackbar";
import WorkFlow from "../../../../flux/actions/apis/fileupload";
import TextButton from '@material-ui/core/Button';
import LanguageCodes from "../../../components/web/common/Languages.json"
import DownloadIcon from "@material-ui/icons/ArrowDownward";

import PDFRenderer from './PDFRenderer';
import DocumentRenderer from './PageCard';
import SentenceCard from './SentenceCard';
import PageCard from "./PageCard";
const { v4 }        = require('uuid');

const PAGE_OPS = require("../../../../utils/page.operations");
const BLOCK_OPS = require("../../../../utils/block.operations");
const TELEMETRY = require('../../../../utils/TelemetryManager')

class DocumentEditor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isModeSentences: true,
            currentPageIndex: 1
        }
    }

    /**
     * life cycle methods
     */
    componentDidMount() {
      TELEMETRY.pageLoadCompleted('document-editor')
      let recordId  = this.props.match.params.jobid;
      let jobId     = recordId ? recordId.split("|")[0] : ""
  
      let langCodes = LanguageCodes
      let sourceLang = ''
      if (langCodes && Array.isArray(langCodes) && langCodes.length > 0) {
        langCodes.map(lang => {
          if (lang.language_code === this.props.match.params.locale) {
            sourceLang = lang.language_name
          }
          return true
        })
      }
      TELEMETRY.startTranslatorFlow(sourceLang, this.props.match.params.targetlang, this.props.match.params.inputfileid, jobId)
      this.setState({ showLoader: true });
      this.makeAPICallFetchContent();
    }

    /**
     * API methods
     */
    makeAPICallFetchContent =  () => {
      let start_page    = this.props.document_contents.pages.length + 1;
      let end_page      = start_page + 1;
      console.log(`fetching document content, start_page: ${start_page}, end_page: ${end_page}`);

      const apiObj      = new FileContent(this.props.match.params.jobid, start_page, end_page);
      this.props.APITransport(apiObj);
    }

    /**
     * workhorse functions
     */
    handleSourceChange = (evt, blockValue) => {
    }
    saveUpdatedSentence(sentenceObj, pageNo) {
    }
    workFlowApi(workflow, blockDetails, update, type) {
    }


    handleViewModeToggle = () => {
        this.setState({
          isModeSentences: !this.state.isModeSentences
        })
    }

    handleOnClose = () => {
      let recordId  = this.props.match.params.jobid;
      let jobId     = recordId ? recordId.split("|")[0] : ""
      TELEMETRY.endTranslatorFlow(jobId)
  
      history.push(`${process.env.PUBLIC_URL}/view-document`);
    }

    /**
     * all render functions starts here
     */

    /**
     * render the toolbar
     */
    renderToolBar = () => {
        return (
            <Grid container
                spacing={2}
                style={{ marginTop: "-10px", padding: "10px 5px 0px ", width: "100%", position: "fixed", zIndex: 1000, background: "#F5F9FA" }}>
            
                <Grid item xs={12} sm={6} lg={2} xl={2} className="GridFileDetails">
                    <Button
                    // variant="outlined"
                    onClick={event => {
                        this.handleOnClose();
                    }}
                    style={{ textTransform: "capitalize", width: "100%", minWidth: "150px", borderRadius: "30px", color: "#233466" }}
                    >
                    <ChevronLeftIcon fontSize="small" />
                    {translate("common.page.title.document")}
                    </Button>
                </Grid>

                <Grid item xs={12} sm={5} lg={7} xl={7} className="GridFileDetails">
                    <Button
                        color="primary"
                        // variant="outlined"
                        className="GridFileDetails"
                        style={{
                            textTransform: "capitalize",
                            justifyContent: "center",
                            height: "100%",
                            width: "100%",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            pointerEvents: "none",
                            borderRadius: "30px"
                        }}
                        >
                        <div style={{ fontSize: "15px", fontWeight: "bold" }}>
                            {!this.state.apiCall ? (this.state.isModeSentences ? "Sentences" : "PDF") : "Saving....."}
                        </div>
                    </Button>
                </Grid>

                <Grid item xs={12} sm={6} lg={1} xl={1}>
                    <Button
                        onClick={() => this.handleTargetDownload()}
                        style={{
                        color: "#233466",
                        textTransform: "capitalize",
                        width: "100%",
                        minWidth: "110px",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        borderRadius: "30px"
                        }}
                    >
                        <DownloadIcon fontSize="large" style={{ color: "#233466", fontSize: "x-large" }} />&nbsp;Download
                    </Button>
                </Grid>

                <Grid item xs={12} sm={6} lg={2} xl={2}>
                    <Button
                        // variant="contained"
                        // color="primary"
                        style={{
                        color: "#233466",
                        textTransform: "capitalize",
                        width: "100%",
                        minWidth: "110px",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        borderRadius: "30px"
                        }}
                        disabled={this.state.apiCall ? true : false}
                        onClick={() => this.handleViewModeToggle()}
                    >
                        {this.state.isModeSentences ? "See PDF" : "See sentences"}
                        <ChevronRightIcon fontSize="large" />
                    </Button>
                </Grid>

            </Grid>
        )
    }

    /**
     * renders PDF document
     */
    renderPDFDocument = () => {
      return (
        <Grid item xs={12} sm={6} lg={6} xl={6}>
          <Paper>
            <PDFRenderer parent='document-editor' filename={this.props.match.params.inputfileid} pageNo={this.state.currentPageIndex} />
          </Paper>
        </Grid>
      )
    }


    /**
     * render Document pages
     */
    renderDocumentPages = () => {
      let pages = PAGE_OPS.get_pages_children_information(this.props.document_contents.pages);
      if (pages.length < 1) {
        return(
            <div></div>
        )
      }
      return(
        <Grid item xs={12} sm={6} lg={6} xl={6}>
          <InfiniteScroll height={1200}
            next={this.makeAPICallFetchContent}
            hasMore={(this.props.document_contents.count > this.props.document_contents.pages.length) ? true : false }
            dataLength={pages.length}
            loader={<div style={{ textAlign: "center" }}> <CircularProgress size={20} style={{zIndex: 1000}}/></div>}
            endMessage={ <div style={{ textAlign: "center" }}><b>You have seen it all</b></div> }
          >
            {pages.map(page => <PageCard key={v4()} page={page} />)}
          </InfiniteScroll>
        </Grid>
      )
    }

    /***
     * render sentences
     */
    renderSentences = () => {
      let pages = PAGE_OPS.get_pages_children_information(this.props.document_contents.pages);
      if (pages.length < 1) {
        return(
            <div></div>
        )
      }
      return (
          <Grid item xs={12} sm={6} lg={6} xl={6}>
            <InfiniteScroll height={1200}
                next={this.makeAPICallFetchContent}
                hasMore={(this.props.document_contents.count > this.props.document_contents.pages.length) ? true : false }
                dataLength={pages.length}
                loader={<div style={{ textAlign: "center" }}> <CircularProgress size={20} style={{zIndex: 1000}}/></div>}
                endMessage={ <div style={{ textAlign: "center" }}><b>You have seen it all</b></div> }
            >
              {pages.map(page => page['translated_texts'].map(sentence => <SentenceCard key={v4()} sentence={sentence}/>) )}
            </InfiniteScroll>
          </Grid>
        
      )
    }


    /**
     * render functions ends here
     */

    render() {
        return (
        <div>
            {this.renderToolBar()}
            <Grid container spacing={2} style={{ padding: "142px 24px 0px 24px" }}>
                {this.renderDocumentPages()}
                {this.state.isModeSentences ? this.renderSentences() : this.renderPDFDocument()}
            </Grid>
        </div>
        )
    }
}

const mapStateToProps = state => ({
    fetchPdfSentence: state.fetchPdfSentence,
    fileUpload: state.fileUpload,
    documentDetails: state.documentDetails,
    fetchContent: state.fetchContent,
    workflowStatus: state.workflowStatus,
    documentconverter: state.documentconverter,
    saveContent: state.saveContent,
    document_contents: state.document_contents
});
  
const mapDispatchToProps = dispatch =>
bindActionCreators(
    {
    APITransport,
    ClearContent: ClearContent
    },
    dispatch
);
  
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(DocumentEditor));
  