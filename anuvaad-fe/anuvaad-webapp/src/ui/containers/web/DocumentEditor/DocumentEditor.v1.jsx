import React from "react";
import { withRouter } from "react-router-dom";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import InfiniteScroll from "react-infinite-scroll-component";
import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';

import { translate } from "../../../../assets/localisation";
import history from "../../../../web.history";
import Spinner from "../../../components/web/common/Spinner";
// import LanguageCodes from "../../../components/web/common/Languages.json"
import PDFRenderer from './PDFRenderer';
import SentenceCard from './SentenceCard';
import PageCard from "./PageCard";
import InteractivePagination from './InteractivePagination';
import SENTENCE_ACTION from './SentenceActions'
import InteractiveDocToolBar from "./InteractiveDocHeader"
import TranslatedDocument from "./TranslatedDocument";

import WorkFlowAPI from "../../../../flux/actions/apis/common/fileupload";
import APITransport from "../../../../flux/actions/apitransport/apitransport";
import ClearContent from "../../../../flux/actions/apis/document_translate/clearcontent";
import FileContent from "../../../../flux/actions/apis/document_translate/fetchcontent";
import FetchContentUpdate from "../../../../flux/actions/apis/document_translate/v1_fetch_content_update";
import SaveSentenceAPI from '../../../../flux/actions/apis/document_translate/savecontent';
import JobStatus from "../../../../flux/actions/apis/view_document/v1_jobprogress";
import FetchModel from "../../../../flux/actions/apis/common/fetchmodel";
import { showPdf, clearShowPdf } from '../../../../flux/actions/apis/document_translate/showpdf';
import { contentUpdateStarted, clearFetchContent } from '../../../../flux/actions/users/translator_actions';
import { update_sentences, update_blocks } from '../../../../flux/actions/apis/document_translate/update_page_content';
import { editorModeClear, editorModeNormal, editorModeMerge } from '../../../../flux/actions/editor/document_editor_mode';
import { clearHighlighBlock } from '../../../../flux/actions/users/translator_actions';
import { Button } from "@material-ui/core";
// import html2canvas from "html2canvas"
// import { jsPDF } from "jspdf";
import ReactToPrint, { PrintContextConsumer } from 'react-to-print';

import Loader from "../../../components/web/common/CircularLoader";
const PAGE_OPS = require("../../../../utils/page.operations");
const BLOCK_OPS = require("../../../../utils/block.operations");
const TELEMETRY = require('../../../../utils/TelemetryManager')
var jp = require('jsonpath')

class DocumentEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isModeSentences: true,
      currentPageIndex: 1,
      apiInProgress: false,
      snackBarMessage: '',
      apiFetchStatus: false,
      docView: false,
      zoomPercent: 100,
      zoomInDisabled: false,
      zoomOutDisabled: false,

      preview: false,
      totalPageCount: 0,
      paginationIndex: 3,
      getNextPages: false,

      loaderValue: 0,
      totalLoaderValue: 0,
      currentIndex: 0,
      download: false,

      fetchNext: true.valueOf,
    }
    this.forMergeSentences = []
  }

  /**
   * life cycle methods
   */
  componentDidMount() {
    TELEMETRY.pageLoadCompleted('document-editor')
    let recordId = this.props.match.params.jobid;
    let jobId = recordId ? recordId.split("|")[0] : ""

    localStorage.setItem("recordId", recordId);
    localStorage.setItem("inputFile", this.props.match.params.inputfileid)
    this.setState({ showLoader: true });
    this.makeAPICallFetchContent(1);
    this.makeAPICallDocumentsTranslationProgress();

    if (!this.props.fetch_models || !this.props.fetch_models.length > 0) {
      const apiModel = new FetchModel();
      this.props.APITransport(apiModel);
    } else {
      let model = this.fetchModel(parseInt(this.props.match.params.modelId))
      if (model && model.hasOwnProperty('source_language_name') && model.hasOwnProperty('target_language_name')) {
        TELEMETRY.startTranslatorFlow(model.source_language_name, model.target_language_name, this.props.match.params.inputfileid, jobId)
      }
    }

    window.addEventListener('popstate', this.handleOnClose);
    // window.addEventListener('beforeunload',this.handleOnClose);

  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.sentence_highlight !== this.props.sentence_highlight) {
      this.handleSourceScroll(this.props.sentence_highlight.sentence_id)
    }

    if (prevProps.active_page_number !== this.props.active_page_number) {
      this.makeAPICallFetchContent(this.props.active_page_number);
    }

    if (prevProps.document_contents !== this.props.document_contents) {
      this.setState({ apiFetchStatus: false })
      if (this.state.totalPageCount == 0) {
        this.setState({ totalPageCount: this.props.document_contents.count })
      }

      if (this.state.preview) {
        let val = this.state.currentIndex / this.state.totalLoaderValue * 100
        this.setState({ loaderValue: val, currentIndex: this.state.currentIndex + 1 })
        if (this.state.totalPageCount > this.state.paginationIndex && this.state.getNextPages) {
          this.fetchPages(this.state.paginationIndex, this.state.currentIndex + 1)
        } else {
          this.setState({ download: true, loaderValue: 0, paginationIndex: 3, currentIndex: 0, totalLoaderValue: 0 })
          // this.setState({ download: true, paginationIndex: 3, currentIndex: 0, totalLoaderValue: 0 })
          // setTimeout(() => {
          //   this.htmlToPDF()
          // }, 2)
        }
      }
    }

    if (prevState.preview !== this.state.preview && this.state.preview === true) {
      if (this.state.totalPageCount > 2) {
        this.fetchPages(this.state.paginationIndex, 1)
      } else {
        this.setState({ download: true })

        // this.setState({ download: true, paginationIndex: 3, currentIndex: 0, totalLoaderValue: 0 })
        // setTimeout(() => {
        //   this.htmlToPDF()
        // }, 2)
      }
    }

    if (prevProps.document_editor_mode !== this.props.document_editor_mode && this.props.document_editor_mode.mode === 'EDITOR_MODE_MERGE') {
      let nextPage = this.props.document_editor_mode.page_nos.slice(-1)[0];
      this.makeAPICallFetchContent(nextPage, true);
    }

    if (prevProps.fetch_models !== this.props.fetch_models) {
      let jobId = this.props.match.params.jobid ? this.props.match.params.jobid.split("|")[0] : ""
      let model = this.fetchModel(parseInt(this.props.match.params.modelId))
      if (model && model.hasOwnProperty('source_language_name') && model.hasOwnProperty('target_language_name')) {
        TELEMETRY.startTranslatorFlow(model.source_language_name, model.target_language_name, this.props.match.params.inputfileid, jobId)
      }
    }

  }

  fetchPages(page_no, index) {
    let endIndex = page_no + (this.state.pagesPerCall - 1)
    let remainingPages = (this.state.totalPageCount - 1) - endIndex
    if (remainingPages > 0) {
      this.setState({ getNextPages: true })
    }
    this.setState({ paginationIndex: this.state.paginationIndex + this.state.pagesPerCall, currentIndex: index })

    const apiObj = new FileContent(this.props.match.params.jobid, page_no, endIndex);
    this.props.APITransport(apiObj);
  }

  componentWillUnmount() {
    localStorage.setItem("recordId", "");
    localStorage.setItem("inputFile", "");

    let recordId = this.props.match.params.jobid;
    let jobId = recordId ? recordId.split("|")[0] : ""
    TELEMETRY.endTranslatorFlow(jobId)
    this.props.clearFetchContent()
    this.props.clearHighlighBlock()
    this.props.clearShowPdf()
  }

  handleSourceScroll(id) {
    this.refs[id] && this.refs[id].scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  /**
   * API methods
   */

  makeAPICallFetchContent = (page_no, apiStatus) => {
    let startStatus = PAGE_OPS.page_status(this.props.document_contents.pages, page_no);
    let endStatus = PAGE_OPS.page_status(this.props.document_contents.pages, page_no + 1);
    if (startStatus && endStatus) {
      const apiObj = new FileContent(this.props.match.params.jobid, page_no, page_no + 1);
      this.props.APITransport(apiObj);
      !apiStatus && this.setState({ apiFetchStatus: true })
    }
    else if (startStatus) {
      const apiObj = new FileContent(this.props.match.params.jobid, page_no, page_no);
      this.props.APITransport(apiObj);
      !apiStatus && this.setState({ apiFetchStatus: true })
    }
    else if (endStatus) {
      const apiObj = new FileContent(this.props.match.params.jobid, page_no + 1, page_no + 1);
      this.props.APITransport(apiObj);
    }

  }

  makeAPICallDocumentsTranslationProgress() {
    const { APITransport } = this.props;
    const apiObj = new JobStatus([this.props.match.params.jobid]);
    APITransport(apiObj);

  }

  handleRedirect = () => {
    this.informUserStatus(translate('common.page.label.TOKEN_EXPIRED'), false)
    setTimeout(() => { history.push(`${process.env.PUBLIC_URL}/`); }, 3000)
  }

  makeAPICallFetchContentPerPage = (start_page) => {


    const apiObj = new FetchContentUpdate(this.props.match.params.jobid, start_page, start_page);
    this.props.APITransport(apiObj);
  }

  async makeAPICallMergeSentence(sentences, pageNumber) {

    let sentence_ids = sentences.map(sentence => sentence.s_id)
    let updated_blocks = BLOCK_OPS.do_sentences_merging_v1(this.props.document_contents.pages, sentence_ids);

    /**
     * telemetry information.
     */
    let initial_sentences = sentences.map(sentence => sentence.src);
    let final_sentence = updated_blocks['blocks'][0].tokenized_sentences[0].src;
    TELEMETRY.mergeSentencesEvent(initial_sentences, final_sentence)
    let model = this.fetchModel(parseInt(this.props.match.params.modelId))
    this.informUserProgress(translate('common.page.label.SENTENCE_MERGED'))
    let apiObj = new WorkFlowAPI("WF_S_TR", updated_blocks.blocks, this.props.match.params.jobid, model.source_language_code,
      '', '', model, sentence_ids)
    const apiReq = fetch(apiObj.apiEndPoint(), {
      method: 'post',
      body: JSON.stringify(apiObj.getBody()),
      headers: apiObj.getHeaders().headers
    }).then(async response => {
      const rsp_data = await response.json();
      if (!response.ok) {
        TELEMETRY.log("merge", JSON.stringify(rsp_data))
        if (Number(response.status) === 401) {
          this.handleRedirect()
        }
        else {
          this.informUserStatus(translate('common.page.label.SENTENCE_MERGED_FAILED'), false)
        }
        return Promise.reject('');
      } else {
        this.props.contentUpdateStarted();
        this.props.update_blocks(pageNumber, rsp_data.output.textBlocks);
        this.processEndMergeMode(pageNumber)
        this.informUserStatus(translate('common.page.label.SENTENCE_MERGED_SUCCESS'), true)
        this.makeAPICallDocumentsTranslationProgress();
      }
    }).catch((error) => {
      this.informUserStatus(translate('common.page.label.SENTENCE_MERGED_FAILED'), false)
      this.processEndMergeMode(pageNumber)
    });
  }

  async makeAPICallSaveSentence(sentence, pageNumber) {
    this.informUserProgress(translate('common.page.label.SENTENCE_SAVED'))

    let apiObj = new SaveSentenceAPI(sentence)
    const apiReq = fetch(apiObj.apiEndPoint(), {
      method: 'post',
      body: JSON.stringify(apiObj.getBody()),
      headers: apiObj.getHeaders().headers
    }).then(async response => {
      const rsp_data = await response.json();
      if (!response.ok) {
        TELEMETRY.log("save-translation", JSON.stringify(rsp_data))
        if (Number(response.status) === 401) {
          this.handleRedirect()
        }
        else {
          this.informUserStatus(translate('common.page.label.SENTENCE_SAVED_FAILED'), false)
        }

        return Promise.reject('');
      } else {
        this.props.contentUpdateStarted()
        this.props.update_sentences(pageNumber, rsp_data.data);
        this.informUserStatus(translate('common.page.label.SENTENCE_SAVED_SUCCESS'), true)
        this.makeAPICallDocumentsTranslationProgress();
      }
    }).catch((error) => {
      this.informUserStatus(translate('common.page.label.SENTENCE_SAVED_FAILED'), false)
    });
  }

  async makeAPICallSplitSentence(sentence, pageNumber, startIndex, endIndex) {

    let updated_blocks = BLOCK_OPS.do_sentence_splitting_v1(this.props.document_contents.pages, sentence.block_identifier, sentence, startIndex, endIndex);
    TELEMETRY.splitSentencesEvent(sentence.src, updated_blocks.splitted_sentences)
    let model = this.fetchModel(parseInt(this.props.match.params.modelId))
    this.informUserProgress(translate('common.page.label.SENTENCE_SPLITTED'))
    let apiObj = new WorkFlowAPI("WF_S_TR", updated_blocks.blocks, this.props.match.params.jobid, model.source_language_code,
      '', '', model, updated_blocks.selected_sentence_ids)
    const apiReq = fetch(apiObj.apiEndPoint(), {
      method: 'post',
      body: JSON.stringify(apiObj.getBody()),
      headers: apiObj.getHeaders().headers
    }).then(async response => {
      const rsp_data = await response.json();
      if (!response.ok) {
        TELEMETRY.log("split", JSON.stringify(rsp_data))
        if (Number(response.status) === 401) {
          this.handleRedirect()
        }
        else {
          this.informUserStatus(translate('common.page.label.SENTENCE_SPLITTED_FAILED'), false)
        }

        return Promise.reject('');
      } else {
        this.props.contentUpdateStarted();
        this.props.update_blocks(pageNumber, rsp_data.output.textBlocks);
        this.informUserStatus(translate('common.page.label.SENTENCE_SPLITTED_SUCCESS'), true)
        this.makeAPICallDocumentsTranslationProgress();
      }
    }).catch((error) => {
      this.informUserStatus(translate('common.page.label.SENTENCE_SPLITTED_FAILED'), false)
    });
  }

  async makeAPICallSourceSaveSentence(sentence, pageNumber) {
    this.informUserProgress(translate('common.page.label.SOURCE_SENTENCE_SAVED'))
    let model = this.fetchModel(parseInt(this.props.match.params.modelId))

    let apiObj = new WorkFlowAPI("WF_S_TKTR", sentence, this.props.match.params.jobid, model.source_language_code,
      '', '', model)
    const apiReq = fetch(apiObj.apiEndPoint(), {
      method: 'post',
      body: JSON.stringify(apiObj.getBody()),
      headers: apiObj.getHeaders().headers
    }).then(async response => {
      const rsp_data = await response.json();
      if (!response.ok) {
        TELEMETRY.log("save-sentence", JSON.stringify(rsp_data))
        if (Number(response.status) === 401) {
          this.handleRedirect()
        }
        else {
          this.informUserStatus(translate('common.page.label.SOURCE_SENTENCE_SAVED_FAILED'), false)
        }

        return Promise.reject('');
      } else {
        this.props.contentUpdateStarted()
        this.props.update_blocks(pageNumber, rsp_data.output.textBlocks);
        this.informUserStatus(translate('common.page.label.SOURCE_SENTENCE_SAVED_SUCCESS'), true)
      }
    }).catch((error) => {
      this.informUserStatus(translate('common.page.label.SOURCE_SENTENCE_SAVED_FAILED'), false)
    });
  }

  fetchModel(modelId) {
    let model = ""

    let docs = this.props.fetch_models
    if (docs && docs.length > 0) {
      let condition = `$[?(@.model_id == '${modelId}')]`;
      model = jp.query(docs, condition)
    }

    return model.length > 0 ? model[0] : null
  }

  /**
   * workhorse functions
   */
  processStartMergeMode(pageNumber) {
    if (pageNumber === 1) {
      this.props.editorModeMerge([], [pageNumber, pageNumber + 1])
    } else {
      this.props.editorModeMerge([], [pageNumber - 1, pageNumber, pageNumber + 1])
    }
  }

  processEndMergeMode(pageNumber) {
    if (pageNumber === 1) {
      this.props.editorModeNormal([], [pageNumber, pageNumber + 1])
    } else {
      this.props.editorModeNormal([], [pageNumber - 1, pageNumber, pageNumber + 1])
    }
    /**
     * hack :- clear off the eligible page to avoid further checking and then re-render
     *        in SentenceCard
     */
    setTimeout(() => { this.props.editorModeClear() }, 50)
  }

  processSentenceAction = (action, pageNumber, sentences, startIndex, endIndex) => {

    switch (action) {
      case SENTENCE_ACTION.SENTENCE_SAVED: {
        this.makeAPICallSaveSentence(sentences[0], pageNumber)
        return;
      }

      case SENTENCE_ACTION.SENTENCE_SPLITTED: {
        if (startIndex === endIndex) {
          this.informUserStatus(translate('common.page.label.SENTENCE_SPLITTED_INVALID_INPUT'), false)
          return;
        }
        this.makeAPICallSplitSentence(sentences[0], pageNumber, startIndex, endIndex);

        return;
      }

      case SENTENCE_ACTION.SENTENCE_MERGED: {
        if (this.forMergeSentences.length < 2) {
          this.informUserStatus(translate('common.page.label.SENTENCE_MERGED_INVALID_INPUT'), false)
          this.processEndMergeMode(pageNumber)
          return;
        }
        this.makeAPICallMergeSentence(this.forMergeSentences, pageNumber);
        this.forMergeSentences = []
        return;
      }

      case SENTENCE_ACTION.SENTENCE_SOURCE_EDITED: {
        this.makeAPICallSourceSaveSentence(sentences, pageNumber)
        return;
      }

      case SENTENCE_ACTION.START_MODE_MERGE: {
        this.forMergeSentences = []
        this.processStartMergeMode(pageNumber)

        return;
      }

      case SENTENCE_ACTION.END_MODE_MERGE: {
        this.processEndMergeMode(pageNumber)
        this.forMergeSentences = []
        return;
      }
      case SENTENCE_ACTION.ADD_SENTENCE_FOR_MERGE: {
        this.forMergeSentences = [...this.forMergeSentences, ...sentences]
        return;
      }
      case SENTENCE_ACTION.REMOVE_SENTENCE_FOR_MERGE: {
        this.forMergeSentences = this.forMergeSentences.filter(sent => sent.s_id !== sentences[0].s_id)
        return;
      }
      default:
        return;
    }
  }

  /**
   * progress information for user from API
   */
  informUserProgress = (message) => {
    this.setState({
      apiInProgress: true,
      showStatus: false,
      snackBarMessage: message
    })
  }
  informUserStatus = (message, isSuccess) => {
    this.setState({
      apiInProgress: false,
      showStatus: true,
      snackBarMessage: message,
      snackBarVariant: isSuccess ? "success" : "error"
    })
  }

  renderProgressInformation = () => {
    return (
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={this.state.apiInProgress}
        message={this.state.snackBarMessage}
      >
        <Alert elevation={6} variant="filled" severity="info">{this.state.snackBarMessage}</Alert>
      </Snackbar>
    )
  }

  renderStatusInformation = () => {
    return (
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={this.state.showStatus}
        onClose={(e, r) => {
          this.setState({ showStatus: false })
        }}
      >
        <Alert elevation={6} variant="filled" severity={this.state.snackBarVariant}>{this.state.snackBarMessage}</Alert>
      </Snackbar>
    )
  }

  handleViewModeToggle = () => {
    this.setState({
      isModeSentences: !this.state.isModeSentences
    })
  }

  handleOnClose = (e) => {
    e.preventDefault()
    let recordId = this.props.match.params.jobid;
    let jobId = recordId ? recordId.split("|")[0] : ""
    TELEMETRY.endTranslatorFlow(jobId)
    this.props.ClearContent()
    history.push(`${process.env.PUBLIC_URL}/view-document`);
  }

  /**
   * all render functions starts here
   */


  /**
   * renders PDF document
   */
  renderPDFDocument = () => {
    if (!this.state.apiFetchStatus) {
      return (
        <Grid item xs={12} sm={6} lg={6} xl={6} style={{ marginLeft: "5px" }}>
          <Paper>
            <PDFRenderer parent='document-editor' filename={this.props.match.params.inputfileid} pageNo={this.props.active_page_number} />
          </Paper>
        </Grid>
      )
    }

  }

  htmlToPDF(width, height) {

    let totalPages = this.state.totalPageCount
    // const pdf = new jsPDF()
    // // const pdf = new jsPDF("p", "pt", [width, height])

    // for (let i = 1; i <= totalPages; i++) {
    //   let pageIndex = i - 1
    //   const input = document.getElementById('divToPrint' + pageIndex);
    //   html2canvas(input)
    //     .then((canvas) => {
    //       const imgData = canvas.toDataURL('image/png');

    //       pdf.addImage(imgData, 'JPEG', 0, 0);
    //       pdf.addPage()

    //       if (totalPages === i) {
    //         pdf.deletePage(totalPages + 1)
    //         var filename = this.props.match.params.filename;
    //         filename = filename.substr(0, filename.lastIndexOf("."));
    //         pdf.save(filename + ".pdf")
    //         this.setState({ preview: false, loaderValue: 0, paginationIndex: 3, currentIndex: 0, totalLoaderValue: 0, download: false })
    //       }

    //     })

    // }
  }

  closePreview = () => {
    this.setState({ 
      preview: false, loaderValue: 0, paginationIndex: 3, currentIndex: 0, totalLoaderValue: 0, download: false, pagesPerCall: 0
    })
  }

  renderTranslatedDocument = () => {
    let pages = PAGE_OPS.get_pages_tokenisation_information(this.props.document_contents.pages);

    if (pages.length < 1) {
      return (
        <div></div>
      )
    }

    let style = "@page { size: " + pages[0].page_width + "px " + pages[0].page_height + "px; margin:0pt; width: 100%; height:100%; } "
    return (
      // <div>
      <Grid item xs={12} sm={12} lg={12} xl={12}
      // style={{ display: "flex", flexDirection: "column" }}
      >
        <div style={{textAlign: "end"}}>
          <ReactToPrint
            trigger={() => <Button color="primary" variant="contained"
            disabled={!this.state.download}
            >Print PDF</Button>}
            content={() => this.componentRef}
            // pageStyle="@page { size: 702px 702px  } "
            pageStyle={style}

          />
          <Button color="primary" variant="contained" style={{ marginLeft: "20px" }} onClick={() => this.closePreview()}>Close</Button>
        </div>
        <div style={{
          maxHeight: window.innerHeight - 141,
          overflowY: "auto",
          display: "flex", flexDirection: "row-reverse", justifyContent: "center"
        }}

        >
            {/* <ReactToPrint
              trigger={() => <Button color="primary" variant="contained"
              // disabled={!this.state.download}
              >Print PDF</Button>}
              content={() => this.componentRef}
              // pageStyle="@page { size: 702px 702px  } "
              pageStyle={style}

            /> */}
          <div ref={el => (this.componentRef = el)} id="test">
            {pages.map((page, index) => <TranslatedDocument totalPageCount={this.state.totalPageCount} download={this.state.download} htmlToPDF={this.htmlToPDF.bind(this)} index={index} zoomPercent={this.state.zoomPercent} key={index} page={page} onAction={this.processSentenceAction} />)}
          </div>
        </div>
      </Grid >
    )
  }

  handleDocumentView = () => {
    this.setState({ docView: !this.state.docView })
  }

  showPreview = () => {
    let pagesPerCall = this.state.totalPageCount < 30 ? 5 : (this.state.totalPageCount / 10)

    let totalLoaderValue = (this.state.totalPageCount < pagesPerCall) ? 1 : (this.state.totalPageCount / pagesPerCall)
    this.setState({ preview: !this.state.preview, pagesPerCall, totalLoaderValue })
    // this.htmlToPDF()
  }
  /**
   * util to get selected page
   */
  getPages = () => {
    let pages;
    if (this.props.document_editor_mode.mode === 'EDITOR_MODE_MERGE') {
      pages = PAGE_OPS.get_pages_children_information(this.props.document_contents.pages, this.props.active_page_number, this.props.document_editor_mode.page_nos.slice(-1)[0]);
    }
    else {
      pages = PAGE_OPS.get_pages_children_information(this.props.document_contents.pages, this.props.active_page_number);
    }
    return pages;
  }

  /**
   * render Document pages
   */
  renderDocumentPages = () => {
    let pages = this.getPages();

    if (pages.length < 1) {
      return (
        <div></div>
      )
    }
    return (
      <Grid item xs={12} sm={6} lg={6} xl={6} style={{ marginRight: "5px" }}>

        <InfiniteScroll height={window.innerHeight - 141} style={{
          maxHeight: window.innerHeight - 141,
          overflowY: "auto",
        }}
          dataLength={pages.length}
        >
          {pages.map((page, index) => <PageCard zoomPercent={this.state.zoomPercent} key={index} page={page} onAction={this.processSentenceAction} />)}
        </InfiniteScroll>
      </Grid>
    )
  }
  processZoomIn = () => {
    if (this.state.zoomPercent < 140) {
      if (this.state.zoomPercent + 10 === 140) {
        this.setState({ zoomPercent: this.state.zoomPercent + 10, zoomInDisabled: !this.state.zoomInDisabled })
      }
      else {
        this.setState({ zoomPercent: this.state.zoomPercent + 10, zoomOutDisabled: false })
      }
    } else {
      this.setState({ zoomInDisabled: !this.state.zoomInDisabled })
    }
  }

  processZoomOut = () => {
    if (this.state.zoomPercent > 60) {
      if (this.state.zoomPercent - 10 === 60) {
        this.setState({ zoomPercent: this.state.zoomPercent - 10, zoomOutDisabled: !this.state.zoomOutDisabled })
      }
      else {
        this.setState({ zoomPercent: this.state.zoomPercent - 10, zoomInDisabled: false })
      }
    } else {
      this.setState({ zoomOutDisabled: !this.state.zoomOutDisabled })
    }
  }

  /***
   * render sentences
   */
  renderSentences = () => {

    let pages = this.getPages()
    if (pages.length < 1) {
      return (
        <div></div>
      )
    }
    let recordId = this.props.match.params.jobid;
    let jobId = recordId ? recordId.split("|")[0] : ""
    return (
      <Grid item xs={12} sm={12} lg={12} xl={12} style={{ marginLeft: "5px" }}>

        <InfiniteScroll height={window.innerHeight - 141} style={{
          maxHeight: window.innerHeight - 141,
          overflowY: "auto",
        }}
          hasMore={(this.props.document_contents.count > this.props.document_contents.pages.length) ? true : false}
          dataLength={pages.length}
        >
          {pages.map(page => page['translated_texts'].map((sentence, index) => <div key={sentence.s_id} ref={sentence.s_id}><SentenceCard key={sentence.s_id}
            pageNumber={page.page_no}
            model={this.fetchModel(parseInt(this.props.match.params.modelId))}
            jobId={jobId}
            sentence={sentence}
            onAction={this.processSentenceAction} />
          </div>))}
        </InfiniteScroll>
      </Grid>

    )
  }


  /**
   * render functions ends here
   */
  processZoom = () => {
    return (
      <div style={{ marginLeft: '1%', marginRight: "2%" }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={this.processZoomIn}
          disabled={this.state.zoomInDisabled} >
          +
          </Button>
        <input
          style={{
            backgroundColor: 'white',
            border: 'none',
            borderBottom: '1px solid black',
            margin: '2%',
            textAlign: 'center',
            width: '15%',
            height: '40%',
            fontSize: '17px'
          }} value={`${this.state.zoomPercent}%`}
          disabled />
        <Button
          variant="outlined"
          color="primary"
          onClick={this.processZoomOut}
          disabled={this.state.zoomOutDisabled}
        >
          -
          </Button>
      </div >);
  }
  render() {
    return (
      <div style={{ height: window.innerHeight }}>
        <div style={{ height: "50px", marginBottom: "13px" }}> <InteractiveDocToolBar docView={this.state.docView} onAction={this.handleDocumentView} onShowPreview={this.showPreview} /></div>

        { !this.state.preview ?
          <div style={{ height: window.innerHeight - 141, maxHeight: window.innerHeight - 141, overflow: "hidden", padding: "0px 24px 0px 24px", display: "flex", flexDirection: "row" }}>
            {!this.state.docView && this.renderDocumentPages()}
            {!this.props.show_pdf ? this.renderSentences() : this.renderPDFDocument()}
            {this.state.preview && this.renderTranslatedDocument()}
          </div>
          :
          <div style={{ height: window.innerHeight - 141, maxHeight: window.innerHeight - 141, overflow: "hidden", padding: "0px 24px 0px 24px", display: "flex", flexDirection: "row" }}>
            {this.renderTranslatedDocument()}
          </div>
        }
        <div style={{ height: "65px", marginTop: "13px", bottom: "0px", position: "absolute", width: "100%" }}>
          <InteractivePagination count={this.props.document_contents.count}
            data={this.props.document_contents.pages}
            zoomPercent={this.state.zoomPercent}
            processZoom={this.processZoom}
            zoomInDisabled={this.state.zoomInDisabled}
            zoomOutDisabled={this.state.zoomOutDisabled}
            onAction={this.processSentenceAction} />
        </div>
        {this.state.apiInProgress ? this.renderProgressInformation() : <div />}
        {this.state.showStatus ? this.renderStatusInformation() : <div />}
        {this.state.apiFetchStatus && <Spinner />}
        { !this.state.download && this.state.preview && <Loader value={this.state.loaderValue}></Loader>}
      </div>
    )
  }
}

const mapStateToProps = state => ({
  saveContent: state.saveContent,
  document_contents: state.document_contents,
  sentence_action_operation: state.sentence_action_operation,
  show_pdf: state.show_pdf.open,
  sentence_highlight: state.sentence_highlight.sentence,
  active_page_number: state.active_page_number.page_number,
  document_editor_mode: state.document_editor_mode,
  fetchDocument: state.fetchDocument,
  fetch_models: state.fetch_models.models
});

const mapDispatchToProps = dispatch => bindActionCreators(
  {
    contentUpdateStarted,
    APITransport,
    update_sentences,
    update_blocks,
    ClearContent,
    clearFetchContent,
    clearHighlighBlock,
    editorModeNormal, editorModeMerge, editorModeClear,
    showPdf,
    clearShowPdf
  },
  dispatch
);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(DocumentEditor));
