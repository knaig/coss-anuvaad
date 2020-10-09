import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import Styles from "../../../styles/web/BlockStyles";
import Paper from "@material-ui/core/Paper";
import ChevronLeftIcon from "@material-ui/icons/DoubleArrow";
import Merge from "@material-ui/icons/CallMerge";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import Grid from "@material-ui/core/Grid";
import Save from "@material-ui/icons/CheckCircleOutline";
import Split from "@material-ui/icons/CallSplit";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import Checkbox from '@material-ui/core/Checkbox';
import ValidationIcon from '@material-ui/icons/SettingsEthernet';
class Block extends Component {
  constructor() {
    super();
    this.state = {};
  }


  

  render() {
    const { classes, sentence, selectedBlock } = this.props;
    return (
      <Paper
        variant="outlined"
        style={{ margin: "10px", minHeight: "90px", padding: "1%",border: selectedBlock &&sentence && sentence.s_id===selectedBlock.s_id ?  "2px solid #1C9AB7" : "2px solid #D6D6D6", }}
        onClick={() => this.props.handleSentenceClick(this.props.sentence)}
      >
        <Grid container spacing={2}>
          <Grid item xs={8} sm={9} lg={11} xl={11}>
            <div style={{ display: "flex", flexDirection: "row" }}>
          <Tooltip title="Go to validation mode">
                
                  <ValidationIcon style={{color:"#1C9AB7", cursor:"pointer"}} />
                
              </Tooltip>
              
              <div style= {{width:'100%', paddingLeft:"10px"}}>
            <div style = {{minHeight:'45px', padding:"5px"}}onClick={() => this.props.handleSentenceClick(sentence)}>
              {sentence.src}
            </div>
            <hr style={{ border: "1px dashed #00000014" }} />

            {/* <div>{sentence.tgt}</div> */}
            </div>
            </div>
          </Grid>
          <Grid
            item
            xs={4}
            sm={3}
            lg={1}
            xl={1}
            
          >

{this.props.buttonStatus === "merge" ? 
<Checkbox
            size="small"
            color="primary"
          /> :
          
          <div style={{ display: "flex", flexDirection: "column" }}>
            {this.props.buttonStatus !== "split" &&
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                paddingLeft: "4%",
              }}
            >

              <Tooltip title="Go to validation mode">
                <IconButton aria-label="validation mode">
                  <ArrowBackIcon fontSize="medium" className={classes.Icons} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Save">
                <IconButton aria-label="save">
                  <Save fontSize="medium" />
                </IconButton>
              </Tooltip>
 
            </div>}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                paddingLeft: "4%",
              }}
            >
              <Tooltip title="Spit sentence">
                <IconButton aria-label="Split">
                  <Split fontSize={this.props.buttonStatus !== "split"? "medium":"large"} onClick={event => {
                            this.props.handleClick("split");
                          }}/>
                </IconButton>
              </Tooltip>
              {this.props.buttonStatus !== "split" &&
              <Tooltip title="Merge Sentence">
                <IconButton aria-label="merge">
                  <Merge fontSize="medium" onClick={event => {
                            this.props.handleClick("merge");
                          }}/>
                </IconButton>
              </Tooltip>}
            </div>
            </div>
  }
          </Grid>
        </Grid>
      </Paper>
    );
  }
}

export default withStyles(Styles)(Block);
