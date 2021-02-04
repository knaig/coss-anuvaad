import React from 'react';
import ToolBar from "./ViewDocDigitizationHeader";
import MUIDataTable from "mui-datatables";
import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";
import { translate } from "../../../../assets/localisation";
import DeleteIcon from "@material-ui/icons/Delete";
import LibraryBooksIcon from "@material-ui/icons/LibraryBooks";
import CloudDownloadIcon from "@material-ui/icons/CloudDownload";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import InfoIcon from "@material-ui/icons/Info";
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import { clearJobEntry } from "../../../../flux/actions/users/async_job_management";
import APITransport from "../../../../flux/actions/apitransport/apitransport";
import FetchDigitizedDocument from "../../../../flux/actions/apis/view_digitized_document/fetch_digitized_document";
import Spinner from "../../../components/web/common/Spinner";
import Snackbar from "../../../components/web/common/Snackbar";
import DownloadFile from "../../../../flux/actions/apis/download/download_file";
import history from "../../../../web.history";
import Dialog from "../../../components/web/common/SimpleDialog";
import MarkInactive from "../../../../flux/actions/apis/view_document/markinactive";



const TELEMETRY = require("../../../../utils/TelemetryManager");

class ViewDocumentDigitization extends React.Component {
    constructor() {
        super();
        this.state = {
            showInfo: false,
            offset: 0,
            limit: 10,
            currentPageIndex: 0,
            maxPageNum: 0,
            dialogMessage: null,
            timeOut: 3000,
            variant: "info",
            showLoader: false
        }
    }

    makeAPICallJobsBulkSearch(
        offset,
        limit,
        jobIds = [""],
        searchForNewJob = false,
        searchNextPage = false,
        updateExisting = false,
        userID = [],
    ) {
        const { APITransport } = this.props;
        const apiObj = new FetchDigitizedDocument(
            offset,
            limit,
            jobIds,
            searchForNewJob,
            searchNextPage,
            updateExisting,
            userID
        );
        APITransport(apiObj);
    }

    getJobIdDetail = (jobId) => {
        return this.getJobsSortedByTimestamp().filter(
            (job) => job.jobID === jobId
        )[0];
    };

    getJobsSortedByTimestamp = () => {
        let jobs = this.props.digitizeddocument.documents.sort((a, b) => {
            if (a.created_on < b.created_on) {
                return 1;
            }
            return -1;
        });
        return jobs;
    };

    getJobsAsPerPageAndLimit = (page, limit) => {
        return this.getJobsSortedByTimestamp().slice(
            page * limit,
            page * limit + limit
        );
    };

    getRecordIds = () => {
        let recordids = [];
        this.getJobsAsPerPageAndLimit(
            this.state.currentPageIndex,
            this.state.limit
        ).map((job) => job.recordId && recordids.push(job.recordId));
        return recordids;
    };

    // makeAPICallDocumentsTranslationProgress(jobIds) {
    //     var recordIds = this.getRecordIds();
    //     if (recordIds.length > 0) {
    //         const { APITransport } = this.props;
    //         const apiObj = new JobStatus(recordIds);
    //         APITransport(apiObj);
    //         this.setState({ showProgress: true, searchToken: false });
    //     }
    // }


    checkInprogressJobStatus = () => {
        let inprogressJobIds = this.props.digitizeddocument.documents
            .filter((job) => job.status === "INPROGRESS")
            .map((job) => job.jobID);
        if (inprogressJobIds.length > 0) {
            this.makeAPICallJobsBulkSearch(
                this.state.offset,
                this.state.limit,
                inprogressJobIds,
                false,
                false,
                true
            );
        }
    };

    componentDidMount() {
        this.timerId = setInterval(this.checkInprogressJobStatus.bind(this), 10000);
        TELEMETRY.pageLoadStarted("document-digitization");

        if (this.props.digitizeddocument.documents.length < 1) {
            this.makeAPICallJobsBulkSearch(
                this.state.offset,
                this.state.limit,
                false,
                false
            );
            this.setState({ showLoader: true });
        } else if (this.props.async_job_status.job) {
            /**
             * a job got started, fetch it status
             */
            this.makeAPICallJobsBulkSearch(
                this.state.offset,
                this.state.limit,
                [this.props.async_job_status.job.jobID],
                true,
                false
            );
        }
        // this.makeAPICallDocumentsTranslationProgress();
    }

    componentWillUnmount() {
        clearInterval(this.timerId);
        TELEMETRY.pageLoadCompleted("document-digitization");
    }

    componentDidUpdate(prevProps) {
        if (this.props.digitizeddocument.changedJob && this.props.digitizeddocument.changedJob.hasOwnProperty("jobID") && prevProps.digitizeddocument.changedJob !== this.props.digitizeddocument.changedJob) {
            TELEMETRY.endWorkflow(this.props.digitizeddocument.changedJob.source_language_code, "", this.props.digitizeddocument.changedJob.filename, this.props.digitizeddocument.changedJob.jobID, this.props.digitizeddocument.changedJob.status)
        }

        if (
            prevProps.digitizeddocument.documents.length !==
            this.props.digitizeddocument.documents.length
        ) {
            /**
             * update job progress status only progress_updated is false
             */
            // if (!this.props.digitizeddocument.progress_updated) {
            //     this.makeAPICallDocumentsTranslationProgress();
            //     this.setState({ showLoader: false });
            // }

            if (this.props.digitizeddocument.document_deleted) {
                this.setState({
                    dialogMessage: "Deleted successfully ",
                    variant: "success",
                    timeOut: 3000,
                });
            }
            this.props.clearJobEntry();
        } else if (
            prevProps.digitizeddocument.documents.length === 0 &&
            this.props.digitizeddocument.documents.length === 0 &&
            !this.props.apistatus.progress &&
            this.state.showLoader
        ) {
            this.setState({ showLoader: false });
        }
    }

    getMuiTheme = () =>
        createMuiTheme({
            overrides: {
                MUIDataTableBodyCell: {
                    root: {
                        padding: "3px 10px 3px",
                        overflow: "auto"
                    },
                },
            },
        });

    /**
     * handlers to process user clicks
     */

    makeAPICallJobDelete(jobId) {
        const { APITransport } = this.props;
        const apiObj = new MarkInactive(jobId);

        APITransport(apiObj);
        this.setState({
            showProgress: true,
            searchToken: false,
            dialogMessage: " Selected document is deleting, please wait...!",
            timeOut: null,
        });
    }

    processJobTimelinesClick(jobId, recordId) {
        let taskDetails = this.getJobIdDetail(jobId);
        this.setState({ showInfo: true, message: taskDetails, dialogType: "info", dialogTitle: "File Process Information" });
    }

    handleDialogClose() {
        this.setState({ showInfo: false, dialogType: null, dialogTitle: null, message: null });
    }

    handleDialogSubmit = (jobId) => {
        this.setState({ showInfo: false, dialogType: null, dialogTitle: null, value: null, message: null });
        this.makeAPICallJobDelete(jobId);
    }

    processDeleteJobClick = (fileName, jobId, recordId) => {
        this.setState({ showInfo: true, message: "Do you want to delete a file " + fileName + " ?", dialogTitle: "Delete " + fileName, value: jobId })
    };

    processViewDocumentClick = (jobId, filename, status) => {
        let job = this.getJobIdDetail(jobId);
        if (status === "COMPLETED") {
            history.push(
                `${process.env.PUBLIC_URL}/interactive-digitization/${jobId}/${filename}/${job.converted_filename}`,
                this.state
            );
        } else if (status === "INPROGRESS") {
            this.setState({
                dialogMessage: "Please wait process is Inprogress!",
                timeOut: 3000,
                variant: "info",
            });
            this.handleMessageClear();
        } else {
            this.setState({
                dialogMessage: "Document conversion failed!",
                timeOut: 3000,
                variant: "info",
            });
            this.handleMessageClear();
        }
    };

    handleMessageClear = () => {
        setTimeout(() => {
            this.setState({ dialogMessage: "" });
        }, 3000);
    };

    processTableClickedNextOrPrevious = (page, sortOrder) => {
        if (this.state.maxPageNum < page) {
            /**
             * user wanted to load next set of records
             */
            this.makeAPICallJobsBulkSearch(
                this.state.offset + this.state.limit,
                this.state.limit,
                false,
                false,
                true
            );
            this.setState({
                maxPageNum: page,
                offset: this.state.offset + this.state.limit,
            });
        }
        this.setState({
            currentPageIndex: page
        })
    };

    snackBarMessage = () => {
        return (
            <div>
                <Snackbar
                    anchorOrigin={{ vertical: "top", horizontal: "right" }}
                    open={!this.state.timeOut}
                    autoHideDuration={this.state.timeOut}
                    variant={this.state.variant}
                    message={this.state.dialogMessage}
                />
            </div>
        );
    };

    processDownloadInputFileClick = (jobId, recordId) => {
        this.setState({
            dialogMessage: "Downloading file...",
            timeOut: null,
            variant: "info",
        });
        let job = this.getJobIdDetail(jobId);
        let user_profile = JSON.parse(localStorage.getItem("userProfile"));

        let obj = new DownloadFile(job.converted_filename, user_profile.userID);

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
                        .then((res) => res.blob())
                        .then((blob) => {
                            let a = document.createElement("a");
                            let url = URL.createObjectURL(blob);
                            a.href = url;
                            a.download = job.converted_filename;
                            this.setState({ dialogMessage: null });
                            a.click();
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
    };


    getDateTimeDifference(endTime, startTime) {
        let edate = new Date(endTime);
        let sdate = new Date(startTime);
        let sec = Math.trunc(Math.abs(edate.getTime() - sdate.getTime()) / 1000);
        var date = new Date(0);
        date.setSeconds(sec); // specify value for SECONDS here
        return date.toISOString().substr(11, 8);
    }

    getDateTimeFromTimestamp = (t) => {
        let date = new Date(t);
        return (
            ("0" + date.getDate()).slice(-2) +
            "/" +
            ("0" + (date.getMonth() + 1)).slice(-2) +
            "/" +
            date.getFullYear() +
            " " +
            ("0" + date.getHours()).slice(-2) +
            ":" +
            ("0" + date.getMinutes()).slice(-2)
        );
    };

    render() {
        const columns = [
            {
                name: "filename",
                label: "Filename",
                options: {
                    filter: false,
                    sort: false,
                },
            },
            {
                name: "jobID",
                label: "JobID",
                options: {
                    display: "excluded",
                },
            },
            {
                name: "recordId",
                label: "RecordId",
                options: {
                    display: "excluded",
                },
            },
            {
                name: "source_language_code",
                label: translate("common.page.label.source"),
                options: {
                    filter: false,
                    sort: false,
                },
            },
            {
                name: "target_language_code",
                label: translate("common.page.label.target"),
                options: {
                    filter: false,
                    sort: false,
                    display: "excluded",
                },
            },
            {
                name: "status",
                label: translate("common.page.table.status"),
                options: {
                    filter: true,
                    sort: false,
                    empty: true,
                },
            },
            {
                name: "progress",
                label: "Sentence Progress",
                options: {
                    filter: true,
                    sort: false,
                    empty: true,
                    display: "excluded",
                },
            },
            {
                name: "word_count",
                label: "Word Count",
                options: {
                    filter: true,
                    sort: false,
                    empty: true,
                    display: "excluded",
                },
            },
            {
                name: "spent_time",
                label: "Time Spent",
                options: {
                    sort: false,
                    display: "excluded",
                }
            },
            {
                name: "endTime",
                label: "End Time",
                options: {
                    display: "excluded",
                },
            },
            {
                name: "output_file",
                label: "Output File",
                options: {
                    display: "excluded",
                },
            },
            {
                name: "Time Taken",
                label: "Job Time",
                options: {
                    filter: true,
                    sort: true,
                    customBodyRender: (value, tableMeta, updateValue) => {
                        if (tableMeta.rowData) {
                            return (
                                <div>
                                    {tableMeta.rowData[5] === "COMPLETED" &&
                                        this.getDateTimeDifference(
                                            tableMeta.rowData[9],
                                            tableMeta.rowData[12]
                                        )}
                                </div>
                            );
                        }
                    },
                },
            },
            {
                name: "created_on",
                label: translate("common.page.label.timeStamp"),
                options: {
                    filter: true,
                    sort: true,
                    customBodyRender: (value, tableMeta, updateValue) => {
                        if (tableMeta.rowData) {
                            return (
                                <div>
                                    {this.getDateTimeFromTimestamp(tableMeta.rowData[12])}
                                </div>
                            );
                        }
                    },
                },
            },
            {
                name: "Action",
                label: translate("common.page.label.action"),
                options: {
                    filter: true,
                    sort: false,
                    empty: true,
                    customBodyRender: (value, tableMeta, updateValue) => {
                        if (tableMeta.rowData) {
                            console.log(tableMeta.rowData)
                            // console.log(tableMeta.rowData[1], tableMeta.rowData[2], tableMeta.rowData[3])
                            return (
                                <div>
                                    <Tooltip title="Info" placement="left">
                                        <IconButton
                                            style={{ color: "#233466", padding: "5px" }}
                                            component="a"
                                            onClick={() =>
                                                this.processJobTimelinesClick(
                                                    tableMeta.rowData[1],
                                                    tableMeta.rowData[2]
                                                )
                                            }
                                        >
                                            <InfoIcon />
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip title="View document" placement="left">
                                        <IconButton
                                            style={{ color: "#233466", padding: "5px" }}
                                            component="a"
                                            onClick={() =>
                                                this.processViewDocumentClick(
                                                    tableMeta.rowData[1],
                                                    tableMeta.rowData[10],
                                                    tableMeta.rowData[5]
                                                )
                                            }
                                        >
                                            <LibraryBooksIcon />
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Delete job" placement="left">
                                        <IconButton
                                            style={{ color: "#233466", padding: "5px" }}
                                            component="a"
                                            onClick={() =>
                                                this.processDeleteJobClick(
                                                    tableMeta.rowData[0],
                                                    tableMeta.rowData[1],
                                                    tableMeta.rowData[2]
                                                )
                                            }
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Download input file" placement="left">
                                        <IconButton
                                            style={{ color: "#233466", padding: "5px" }}
                                            component="a"
                                            onClick={() =>
                                                this.processDownloadInputFileClick(
                                                    tableMeta.rowData[1],
                                                    tableMeta.rowData[2]
                                                )
                                            }
                                        >
                                            <CloudDownloadIcon />
                                        </IconButton>
                                    </Tooltip>
                                </div>
                            );
                        }
                    },
                },
            },
        ];

        const options = {
            textLabels: {
                body: {
                    noMatch: translate("gradeReport.page.muiNoTitle.sorryRecordNotFound"),
                },
                toolbar: {
                    search: translate("graderReport.page.muiTable.search"),
                    viewColumns: translate("graderReport.page.muiTable.viewColumns"),
                },
                pagination: {
                    rowsPerPage: translate("graderReport.page.muiTable.rowsPerPages"),
                },
                options: { sortDirection: "desc" },
            },
            onChangeRowsPerPage: (limit) => {
                let diffValue = limit - this.state.limit;
                if (diffValue > 0) {
                    this.makeAPICallJobsBulkSearch(this.state.offset + diffValue, limit - this.state.limit, false, false, true)
                }

                this.setState({ limit })

            },
            rowsPerPageOptions: [10],

            onTableChange: (action, tableState) => {
                switch (action) {
                    case "changePage":
                        this.processTableClickedNextOrPrevious(
                            tableState.page,
                            tableState.sortOrder
                        );
                        break;
                    default:
                }
            },
            count: 0,
            filterType: "checkbox",
            download: true,
            print: false,
            fixedHeader: true,
            filter: false,
            selectableRows: "none",
            sortOrder: {
                name: "timestamp",
                direction: "desc",
            },
            page: this.state.currentPageIndex,
        };
        return (
            <div style={{ maxHeight: window.innerHeight, height: window.innerHeight, overflow: "auto" }}>
                <div style={{ margin: "0% 3% 3% 3%", paddingTop: "7%" }}>
                    <ToolBar />
                    {!this.state.showLoader && (
                        <MuiThemeProvider theme={this.getMuiTheme()}>
                            <MUIDataTable
                                title={translate("common.page.title.document")}
                                data={this.getJobsSortedByTimestamp()}
                                columns={columns}
                                options={options}
                            />
                        </MuiThemeProvider>
                    )}
                </div>
                {this.state.showInfo && (
                    <Dialog
                        message={this.state.message}
                        type={this.state.dialogType}
                        handleClose={this.handleDialogClose.bind(this)}
                        open
                        title={this.state.dialogTitle}
                        handleSubmit={this.handleDialogSubmit.bind(this)}
                        value={this.state.value}
                    />
                )}
                {(this.state.showLoader || this.state.loaderDelete) && <Spinner />}
                {this.state.dialogMessage && this.snackBarMessage()}
            </div>
        )
    }
}
const mapDispatchToProps = (dispatch) =>
    bindActionCreators(
        {
            clearJobEntry,
            APITransport,
            CreateCorpus: APITransport,
        },
        dispatch
    );

const mapStateToProps = (state) => ({
    user: state.login,
    apistatus: state.apistatus,
    digitizeddocument: state.digitizeddocument,
    async_job_status: state.async_job_status,
    open_sidebar: state.open_sidebar
});

export default connect(mapStateToProps, mapDispatchToProps)(ViewDocumentDigitization);