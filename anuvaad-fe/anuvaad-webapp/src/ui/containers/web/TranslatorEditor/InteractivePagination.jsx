import React from "react";
import { withRouter } from "react-router-dom";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import Toolbar from "@material-ui/core/Toolbar";
import AppBar from "@material-ui/core/AppBar";
import Button from "@material-ui/core/Button";
import Typography from '@material-ui/core/Typography';
import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";
import Pagination from "@material-ui/lab/Pagination";
import { currentPageUpdate } from "../../../../flux/actions/apis/pagiantion_update";
import SENTENCE_ACTION from "./SentenceActions";

const PAGE_OPS = require("../../../../utils/page.operations");

const theme = createMuiTheme();
class InteractivePagination extends React.Component {
  constructor(props) {
    super(props);
    this.state = { offset: 1 };
  }
  handleClick = (offset, value) => {
    this.props.currentPageUpdate(value);
    // this.props.onAction(value)
    this.setState({ offset: value });
  };

  sentenceCount = () => {
    let sentenceCount = PAGE_OPS.get_sentence_count(
      this.props.data,
      this.state.offset
    );
    return sentenceCount;
  };

  sentenceProgress =() =>{
    let sentenceProgressCount = PAGE_OPS.get_total_sentence_count(this.props.job_details, this.props.match.params.inputfileid)
    console.log(sentenceProgressCount,"rrrr")
    return sentenceProgressCount;
  }

    /**
   * Merge mode user action handlers
   */
  processMergeButtonClicked =() =>{
    
      this.props.onAction(SENTENCE_ACTION.START_MODE_MERGE, this.state.offset);
   
  }

 


  processMergeNowButtonClicked =() => {
    if (this.props.onAction) {
      this.props.onAction(
        SENTENCE_ACTION.SENTENCE_MERGED,
        this.state.offset
      );
    }
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



  processMergeCancelButtonClicked =()=> {
    this.props.onAction(SENTENCE_ACTION.END_MODE_MERGE, this.state.offset);
  }

  render() {
      console.log(this.props.job_details, this.props.match.params.inputfileid)
    return (
      <AppBar position={"relative"} style={{ marginTop: "60px",
      bottom: "0" }} color="secondary">
        <Toolbar
          disableGutters={!this.props.open_sidebar}
          style={{ minHeight: "60px" }}
        >
            {this.props.document_editor_mode.mode === "EDITOR_MODE_MERGE" ?
            <div style={{ position: 'absolute', right: '30px' }}>
                {this.renderMergeModeButtons()}
            </div>
            :
            <>
                      <Pagination
            count={this.props.count}
            page={this.stateoffset}
            onChange={this.handleClick}
            color="primary"
            size={"large"}
            style ={{marginLeft:"3%"}}
          />
          {this.sentenceCount() && <div style = {{ position: 'absolute', marginLeft:"50%"}}>
          <Typography variant="h6" component="h2">
                Sentences
            </Typography>
            
              <div style={{textAlign:'center'}}>{this.sentenceCount()}</div></div>}
              {this.sentenceProgress() &&<div style = {{ position: 'absolute', marginLeft:"60%"}}>
             <Typography variant="h6" component="h2">
                Total Sentences
            </Typography>
            
              <div style={{textAlign:'center'}}>{this.sentenceProgress()}</div></div>}
          <div style={{ position: 'absolute', right: '30px' }}>
              
          {this.renderNormaModeButtons()}          
            </div>
            </>
            }


          {/* {this.wordCount()} */}
        </Toolbar>
      </AppBar>
    );
  }
}

const mapStateToProps = (state) => ({
  document_editor_mode: state.document_editor_mode,
  job_details: state.job_details
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      currentPageUpdate,
    },
    dispatch
  );

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(InteractivePagination)
);
