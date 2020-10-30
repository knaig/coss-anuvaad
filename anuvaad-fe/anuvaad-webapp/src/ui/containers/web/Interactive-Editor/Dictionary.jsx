import React, { Component } from "react";
import Paper from "@material-ui/core/Paper";
import { withStyles } from "@material-ui/core/styles";
import Styles from "../../../styles/web/MachineTranslationStyle";
import Typography from "@material-ui/core/Typography";
import CircularProgress from "@material-ui/core/CircularProgress";

class Dictionary extends React.Component {
  // constructor(props) {
  //     super(props);
  //   }

  render() {
    const { classes, offsetHeight } = this.props;
    return (
      <Paper 
      // className={classes.dictionary}
        style={{
          border: "1px solid #1C9AB7",
          minHeight: "90%",
          overflow: "auto", 
          maxHeight: (offsetHeight - 25) + "px"
        }}>
        <div>
          <Typography variant="h5" gutterBottom className={classes.header}>
            Dictionary
          </Typography>
        </div>

        <div>
          <hr style={{ border: "1px solid #00000014" }} />
          {!this.props.loading && this.props.parallel_words && this.props.parallel_words.length > 0 && this.props.parallel_words &&
            <div className={classes.sourcediv}>
              {this.props.selectedText}
            </div>
          }
          <div className={classes.div}>
            {!this.props.loading ? (
              this.props.parallel_words &&
              this.props.parallel_words.map((words) => <div><hr style={{ border: "1px solid #00000014" }} /><div className={classes.targetdiv}>{words}</div></div>)

            ) : (
                <p style={{ textAlign: "center" }}>
                  <CircularProgress
                    size={20}
                    style={{
                      zIndex: 1000,
                    }}
                  />
                </p>
              )}
          </div>
        </div>
      </Paper>
    );
  }
}

export default withStyles(Styles)(Dictionary);
