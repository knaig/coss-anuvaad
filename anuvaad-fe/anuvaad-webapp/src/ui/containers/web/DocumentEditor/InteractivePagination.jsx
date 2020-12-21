import React from "react";
import { withRouter } from "react-router-dom";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import Toolbar from "@material-ui/core/Toolbar";
import AppBar from "@material-ui/core/AppBar";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import Pagination from "@material-ui/lab/Pagination";
import TextField from '@material-ui/core/TextField'
import SENTENCE_ACTION from "./SentenceActions";

import { currentPageUpdate } from "../../../../flux/actions/apis/document_translate/pagiantion_update";
import { clearHighlighBlock } from '../../../../flux/actions/users/translator_actions';

const PAGE_OPS = require("../../../../utils/page.operations");

class InteractivePagination extends React.Component {
  constructor(props) {
    super(props);
    this.state = { offset: 1, gotoValue: 1 };
  }
  handleClick = (offset, value) => {
    this.props.currentPageUpdate(value);
    this.setState({ offset: value, gotoValue: value });
  };

  componentDidMount() {
    this.props.currentPageUpdate(1);
  }

  sentenceCount = () => {
    let sentenceCount = PAGE_OPS.get_sentence_count(
      this.props.data,
      this.state.offset
    );
    return sentenceCount;
  };

  sentenceProgress = () => {
    let sentenceProgressCount = PAGE_OPS.get_total_sentence_count(
      this.props.job_details,
      this.props.match.params.inputfileid
    );
    return sentenceProgressCount;
  };

  /**
   * Merge mode user action handlers
   */
  processMergeButtonClicked = () => {
    this.props.clearHighlighBlock();
    this.props.onAction(SENTENCE_ACTION.START_MODE_MERGE, this.state.offset);
  };

  processMergeNowButtonClicked = () => {
    if (this.props.onAction) {
      this.props.onAction(SENTENCE_ACTION.SENTENCE_MERGED, this.state.offset);
    }
  };

  handlePageClick = () => {
    this.handleClick("", parseInt(this.state.gotoValue))
    this.setState({ offset: parseInt(this.state.gotoValue) })
  }

  renderNormaModeButtons = () => {
    return (
      <div>
        <Button
          onClick={this.processMergeButtonClicked}
          variant="outlined"
          color="primary"
        >
          MERGE
        </Button>
      </div>
    );
  };


  renderMergeModeButtons = () => {
    return (
      <div>
        <Button
          style={{ marginRight: "10px" }}
          onClick={this.processMergeNowButtonClicked}
          variant="outlined"
          color="primary"
        >
          MERGE NOW
        </Button>
        <Button
          onClick={this.processMergeCancelButtonClicked}
          variant="outlined"
          color="primary"
        >
          CANCEL MERGE
        </Button>
      </div>
    );
  };

  processMergeCancelButtonClicked = () => {
    this.props.onAction(SENTENCE_ACTION.END_MODE_MERGE, this.state.offset);
  };

  handleTextValueChange = (event) => {
    this.setState({ gotoValue: event.target.value })
  }

  footer = () => {
    return (
      <AppBar
        position={"fixed"}
        style={{
          top: 'auto',
          bottom: 0,
          // marginTop: "13px"
        }}
        color="secondary"
      >
        <Toolbar
          disableGutters={!this.props.open_sidebar}
          style={{ height: "65px" }}
        >
          {this.props.document_editor_mode.mode === "EDITOR_MODE_MERGE" ? (
            <div style={{ position: "absolute", right: "30px" }}>
              {this.renderMergeModeButtons()}
            </div>
          ) : (
              <>
                {this.props.processZoom()}
                <Pagination
                  count={this.props.count}
                  page={this.state.offset}
                  onChange={this.handleClick}
                  color="primary"
                  size={"large"}
                  style={{ marginLeft: "-8.5%" }}
                />
                <TextField
                  type="number"
                  style={{ width: "40px" }}
                  InputProps={{

                    inputProps: {
                      style: { textAlign: "center" },
                      max: this.props.count, min: 1
                    }
                  }}
                  onChange={(event) => { this.handleTextValueChange(event) }}
                  value={this.state.gotoValue}
                />
                <Button
                  onClick={this.handlePageClick}
                  style={{ marginLeft: '6px' }}
                  variant="outlined"
                  color="primary"
                  disabled={this.state.offset === Number(this.state.gotoValue) && true}
                >
                  GO
        </Button>
                {!this.props.show_pdf &&
                  <div style = {{ display: "flex",marginLeft:'5%', 
                    flexWrap: "nowrap"}}>
                    {this.sentenceCount()>0 && (
                      <div >
                        <Typography variant="subtitle1" component="h3" style={{paddingRight:'15px'}}>
                          Page Sentences
                  </Typography>

                        <div style={{ textAlign: "center" }}>
                          {this.sentenceCount()}
                        </div>
                      </div>
                    )}

                    {this.props.job_status && this.props.job_status.word_status && <div>
                      <Typography variant="subtitle1" component="h3" style={{paddingRight:'15px'}}>
                        Total Word Count
                  </Typography>

                      <div style={{ textAlign: "center" }}>
                        {this.props.job_status.word_status && this.props.job_status.word_status}
                      </div>
                    </div>}

                    {this.props.job_status&& this.props.job_status.status && <div>
                      <Typography variant="subtitle1" component="h3">
                        Total Sentences
                  </Typography>

                      <div style={{ textAlign: "center" }}>
                        {this.props.job_status.status && this.props.job_status.status}
                      </div>
                    </div>}

                    <div style={{ position: "absolute", right: "30px" }}>
                      {this.renderNormaModeButtons()}
                    </div>
                  </div>}
              </>
            )}

          {/* {this.wordCount()} */}
        </Toolbar>
      </AppBar>
    )
  }

  render() {

    return (
      this.footer()
    );
  }
}

const mapStateToProps = (state) => ({
  document_editor_mode: state.document_editor_mode,
  job_details: state.job_details,
  show_pdf: state.show_pdf.open,
  job_status: state.job_status
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      currentPageUpdate,
      clearHighlighBlock
    },
    dispatch
  );

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(InteractivePagination)
);
