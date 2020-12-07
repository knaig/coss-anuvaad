import React from "react";
import MenuItem from "@material-ui/core/MenuItem";
import Menu from "@material-ui/core/Menu";
import { translate } from '../../../../../src/assets/localisation';
import DownIcon from '@material-ui/icons/ArrowDropDown';
import DocumentConverterAPI from "../../../../flux/actions/apis/documentconverter";
import { withRouter } from "react-router-dom";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import APITransport from "../../../../flux/actions/apitransport/apitransport";
import Snackbar from '@material-ui/core/Snackbar';
import Button from '@material-ui/core/Button';
import { showPdf } from '../../../../flux/actions/apis/showpdf';
import { withStyles } from '@material-ui/core/styles';
import Toolbar from "@material-ui/core/Toolbar";
import AppBar from "@material-ui/core/AppBar";
import Typography from "@material-ui/core/Typography";
import MenuIcon from '@material-ui/icons/Menu';
import BackIcon from '@material-ui/icons/ArrowBack';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import { showSidebar } from '../../../../flux/actions/apis/showSidebar';
import DownloadFile from "../../../../flux/actions/apis/download/download_zip_file";
import GlobalStyles from "../../../styles/web/styles";
import Theme from "../../../theme/web/theme-anuvaad";
import classNames from "classnames";
import history from "../../../../web.history";
import Alert from '@material-ui/lab/Alert';

const StyledMenu = withStyles({
    paper: {
        border: '1px solid #d3d4d5',
    },
})((props) => (
    <Menu
        elevation={0}
        getContentAnchorEl={null}
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
        }}
        {...props}
    />
));

class InteractiveDocHeader extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            anchorEl: null,
            showStatus: false,
            message: null,
            timeOut: 3000,
            variant: "info",
            dialogMessage: null
        };
    }

    handleMenu = event => {
        this.setState({ anchorEl: event.currentTarget });
    };

    handleClose = () => {
        this.setState({ anchorEl: null });
    };

    renderProgressInformation = () => {
        return (
            <Snackbar
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                open={this.state.showStatus}
                message={this.state.message}
            >
                <Alert elevation={6} variant="filled" severity="info">{this.state.message}</Alert>
            </Snackbar>
        )
    }

    renderStatusInformation = () => {
        return (
            <div>
                <Snackbar
                    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                    open={true}
                    autoHideDuration={3000}
                    variant={this.state.variant}
                    message={this.state.dialogMessage}
                    onClose={() => this.setState({ dialogMessage: null })}

                >
                    <Alert elevation={6} variant="filled" severity="error">{this.state.dialogMessage}</Alert>
                </Snackbar>
            </div>
        )
    }

    fetchFile(fileType) {
        this.setState({ anchorEl: null, showStatus: true, message: translate("common.page.label.download") });

        let apiObj = new DocumentConverterAPI(fileType, this.props.match.params.jobid, JSON.parse(localStorage.getItem('userProfile')) ? JSON.parse(localStorage.getItem('userProfile')).userID : '')

        const apiReq = fetch(apiObj.apiEndPoint(), {
            method: 'post',
            body: JSON.stringify(apiObj.getBody()),
            headers: apiObj.getHeaders().headers
        }).then(async response => {
            const rsp_data = await response.json();
            if (!response.ok) {
                this.setState({ showStatus: false, message: null, dialogMessage: "Unable to download file" })
                return Promise.reject('');
            } else {
                let fileName = rsp_data && rsp_data[this.state.fileType] ? rsp_data[this.state.fileType] : ""

                if (fileName) {
                    let obj = new DownloadFile(fileName)

                    const apiReq1 = fetch(obj.apiEndPoint(), {
                        method: 'get', dialogMessage: "Unable to download file", headers: obj.getHeaders().headers
                    }).then(async response => {
                        if (!response.ok) {
                            this.setState({ dialogMessage: "Unable to download file", showStatus: false, message: null })
                            console.log('api failed')
                        } else {
                            const buffer = new Uint8Array(await response.arrayBuffer());
                            let res = Buffer.from(buffer).toString('base64')
                            this.downloadFile(res, fileName)
                        }

                    }).catch((error) => {
                        this.setState({ dialogMessage: "Unable to download file" })
                        console.log('api failed because of server or network', error)
                    });

                } else {
                    this.setState({ dialogMessage: "Unable to download file", showStatus: false, message: null })
                }
            }
        }).catch((error) => {
            this.setState({ showStatus: false, message: null, dialogMessage: "Unable to download file" })
            console.log('api failed because of server or network', error)
        });
    }

    downloadFile = (res, fileName) => {
        fetch("data:image/jpeg;base64," + res)
            .then(res => res.blob())
            .then(blob => {
                let a = document.createElement('a');
                let url = URL.createObjectURL(blob);
                a.href = url;
                a.download = fileName;
                this.setState({ showStatus: false, message: null })
                a.click();

            }).catch((error) => {
                this.setState({ dialogMessage: "Unable to download file" })
                console.log("Unable to download file")
            });
    }

    openPDF = event => {
        this.props.showPdf(true)
    };

    renderOptions() {
        const { anchorEl } = this.state;
        const openEl = Boolean(anchorEl);

        return (
            <div style={{ display: "flex", flexDirection: "row" }}>
                <Button variant="outlined" onClick={this.openPDF.bind(this)}>{this.props.show_pdf ? "Show Sentences" : " Show PDF"}</Button>
                <Button variant="outlined" style={{ marginLeft: "10px" }} onClick={this.handleMenu.bind(this)}>
                    Download
                    <DownIcon />
                </Button>

                <StyledMenu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    open={openEl}
                    onClose={this.handleClose.bind(this)}
                >
                    <MenuItem
                        style={{ borderTop: "1px solid #D6D6D6" }}
                        onClick={() => {
                            this.fetchFile("docx"); this.setState({ fileType: "translated_document" })
                        }}
                    >
                        As DOCX
                        </MenuItem>
                    <MenuItem
                        style={{ borderTop: "1px solid #D6D6D6" }}
                        onClick={() => {
                            this.fetchFile("txt"); this.setState({ fileType: "translated_txt_file" })
                        }}
                    >
                        As TXT
                    </MenuItem>
                    <MenuItem
                        style={{ borderTop: "1px solid #D6D6D6" }}
                        onClick={() => {
                            this.fetchFile("xlsx"); this.setState({ fileType: "xlsx_file" })
                        }}
                    >
                        As XLSX
                    </MenuItem>
                </StyledMenu>
            </div>
        );
    }

    render() {
        const { classes, open_sidebar } = this.props;
        return (

            <AppBar position="fixed" color="secondary" className={classNames(classes.appBar, open_sidebar && classes.appBarShift)} style={{ height: '50px', marginBottom: "13px" }}>

                <Toolbar disableGutters={!this.props.open_sidebar} style={{ minHeight: "50px" }}>

                    {
                        open_sidebar ?
                            <IconButton onClick={() => this.props.showSidebar()} className={classes.menuButton} color="inherit" aria-label="Menu" style={{ margin: "0px 5px" }}>
                                <CloseIcon />
                            </IconButton> :
                            <div style={{ display: "flex", flexDirection: "row" }}>
                                <IconButton
                                    onClick={() => {
                                        history.push(`${process.env.PUBLIC_URL}/view-document`);
                                    }}
                                    className={classes.menuButton} color="inherit" aria-label="Menu" style={{ margin: "0px 5px" }}
                                >
                                    <BackIcon />
                                </IconButton>
                                <div style={{ borderLeft: "1px solid #D6D6D6", height: "40px", marginRight: "1px", marginTop: "5px" }}></div>

                                <IconButton onClick={() => this.props.showSidebar(!open_sidebar)} className={classes.menuButton} color="inherit" aria-label="Menu" style={{ margin: "0px 5px" }}>
                                    <MenuIcon />
                                </IconButton>
                            </div>
                    }

                    <div style={{ borderLeft: "1px solid #D6D6D6", height: "40px", marginRight: "10px" }}></div>

                    <Typography variant="h5" color="inherit" className={classes.flex}>
                        {this.props.match.params.filename}
                    </Typography>
                    <div style={{ position: 'absolute', right: '30px' }}>
                        {this.renderOptions()}
                    </div>
                    {this.state.showStatus && this.renderProgressInformation()}
                    {this.state.dialogMessage && this.renderStatusInformation()}

                </Toolbar>
            </AppBar>
        )
    }
}

const mapStateToProps = state => ({
    show_pdf: state.show_pdf.open,
    open_sidebar: state.open_sidebar.open
});

const mapDispatchToProps = dispatch => bindActionCreators(
    {
        APITransport,
        showPdf,
        showSidebar
    },
    dispatch
);

export default withRouter(connect(
    mapStateToProps,
    mapDispatchToProps
)(withStyles(GlobalStyles(Theme), { withTheme: true })(InteractiveDocHeader)));
