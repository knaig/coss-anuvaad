import React from "react";
import Popover from "@material-ui/core/Popover";
import Button from "@material-ui/core/Button";

class MenuClass extends React.Component {
  findWord(word) {
    let splitWord = word.split(" ");
    let resultArray = [];
    let result = word;
    if (splitWord.length > 3) {
      resultArray = [...splitWord.slice(0, 3), " ... "];
      result = resultArray.join(" ");
    }
    return result;
  }
  render() {
    const { positionX,positionY, splitValue } = this.props;
    return (
      <Popover
        id="menu-appbar"
        open={this.props.isopenMenuItems}
        anchorReference="anchorPosition"
        anchorPosition={{ top: positionY, left: positionX }}
        onClose={() => this.props.handleClose()}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <div>
          <Button
            style={{
              textTransform: "none",
              width: "100%",
              justifyContent: "left",
            }}
            onClick={() => this.props.handleOperation("Dictionary")}
          >
            {" "}
            lookup dictionary{" "}
            <span style={{ fontWeight: "bold", paddingLeft: "5px" }}>
              {this.findWord(this.props.splitValue)}
            </span>
          </Button>

          {!this.props.targetDict && (
            <div>
              <Button
                style={{ width: "100%", justifyContent: "left" }}
                onClick={() => this.props.handleOperation("Split sentence")}
              >
                Split sentence
              </Button>

              <Button
                style={{
                  textTransform: "none",
                  width: "100%",
                  justifyContent: "left",
                }}
                onClick={() => this.props.handleOperation('Copy')}
              >
                {" "}
                Copy
              </Button>

              <br />

              <br />
            </div>
          )}
        </div>
        
      </Popover>
    );
  }
}

export default MenuClass;
