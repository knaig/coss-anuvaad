import React from "react";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withStyles } from "@material-ui/core/styles";
import MUIDataTable from "mui-datatables";
import NewCorpusStyle from "../../../styles/web/Newcorpus";
import APITransport from "../../../../flux/actions/apitransport/apitransport";
import { translate } from "../../../../assets/localisation";
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import Spinner from "../../../components/web/common/Spinner";
import { clearJobEntry } from '../../../../flux/actions/users/async_job_management';
import ToolBar from "../AdminPanel/OrganizationHeader"
import FetchOrganizationList from "../../../../flux/actions/apis/organization/organization-list";
import ActivateDeactivateUser from "../../../../flux/actions/apis/user/activate_exisiting_user";
import Switch from '@material-ui/core/Switch';
import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
import ResetPassword from "./ResetPasswordModal";
import Modal from '@material-ui/core/Modal';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import SetPasswordApi from "../../../../flux/actions/apis/user/setpassword";
import AssessmentOutlinedIcon from '@material-ui/icons/AssessmentOutlined';
import history from "../../../../web.history";
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import AddOrg from "../../../../flux/actions/apis/organization/addOrganization";


const TELEMETRY = require('../../../../utils/TelemetryManager')

class OrganisationList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      
      
      offset: 0,
      limit: 10,
      currentPageIndex: 0,
      
      showLoader:false,
      status: false,
    };

  }

  deleteOrg = (orgId) => {
    return (
      <Tooltip title="Deactivate" placement="right">
        <IconButton style={{ color: '#233466', padding: '5px' }} component="a" onClick={() => this.handleDeleteOrg(orgId)} >
          <DeleteForeverIcon />
        </IconButton>
      </Tooltip>
    );
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

  async handleDeleteOrg(orgId) {
    
    // TELEMETRY.addOrganization(this.state.name, this.state.description)
      let apiObj = new AddOrg(orgId, "", false)
    this.informUserProgress("Deactivating organization");
    const apiReq = fetch(apiObj.apiEndPoint(), {
      method: 'post',
      body: JSON.stringify(apiObj.getBody()),
      headers: apiObj.getHeaders().headers
    }).then(async response => {
      const rsp_data = await response.json();
      if (!response.ok) {
        TELEMETRY.log("delete-organization", JSON.stringify(rsp_data))
        if(Number(response.status)===401){
          this.handleRedirect()
        }
        else{
          this.informUserStatus(rsp_data.message ? "rsp_data.message": rsp_data.why ? rsp_data.why : "failed", false)
        }
        
        return Promise.reject('');
      } else {
        this.setState({name:'', description:'' })
        if(rsp_data.http.status== 200){
            this.informUserStatus( rsp_data.why ? rsp_data.why : orgId + "Deactivated", true)
            this.processFetchBulkOrganizationAPI()
            
        }
        else{
            this.informUserStatus(rsp_data.why ? rsp_data.why : "Deactivation Failed.", false)
        }
        
        

      }
    }).catch((error) => {
      this.informUserStatus("Organization add failed", false)
    });
};

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


  processFetchBulkOrganizationAPI = (offset, limit) => {
    const token = localStorage.getItem("token");
    const userObj = new FetchOrganizationList(offset, limit, token)
    this.props.APITransport(userObj)
  }
  /**
   * life cycle methods
   */
  componentDidMount() {
    // TELEMETRY.pageLoadCompleted('');
    this.setState({ showLoader: true })
    this.processFetchBulkOrganizationAPI(this.state.offset, this.state.limit)
  }

  componentDidUpdate(prevProps) {
    
    if (prevProps.organizationList !== this.props.organizationList) {
      debugger
      this.setState({ showLoader: false, status: false })
    }
  }

  getMuiTheme = () => createMuiTheme({
    overrides: {
      MUIDataTableBodyCell: {
        root: {
          padding: '3px 10px 3px',
        },
      },
      MUIDataTableHeadCell: {
        fixedHeader: {
          paddingLeft: '1.2%'
        }
      }
    }
  })


  render() {
    const columns = [
      
      {
        name: "code",
        label: "Organization Name",
        options: {
          filter: false,
          sort: false
        }
      },
      {
        name: "description",
        label: 'Description',
        options: {
          filter: false,
          sort: true,
        }
      },
      {
        name: "active",
        label: 'Status',
        options: {
          filter: false,
          sort: false,
          display: "exclude"

        }
      },
      {
        name: "reset-password",
        label: "Deactivate",
        options: {
          filter: true,
          sort: true,
          empty: true,
          customBodyRender: (value, tableMeta, updateValue) => {
            if (tableMeta.rowData) {
              return (
                this.deleteOrg(tableMeta.rowData[0]) //userId, userName, roleCodes, isactive
              );
            }
          }
        }
      },
    ];


    const options = {
      textLabels: {
        body: {
          noMatch: this.props.count > 0 && this.props.count > this.props.userinfo.data.length ? "Loading...." : translate("gradeReport.page.muiNoTitle.sorryRecordNotFound")
        },
        toolbar: {
          search: translate("graderReport.page.muiTable.search"),
          viewColumns: translate("graderReport.page.muiTable.viewColumns")
        },
        pagination: {
          rowsPerPage: translate("graderReport.page.muiTable.rowsPerPages")
        },
        options: { sortDirection: 'desc' }
      },
      
      count: this.props.count,
      rowsPerPageOptions: [10,20,50],
      filterType: "checkbox",
      download: false,
      print: false,
      fixedHeader: true,
      filter: false,
      selectableRows: "none",
      page: this.state.currentPageIndex
    };

    return (
      <div style={{ maxHeight: window.innerHeight, height: window.innerHeight, overflow: "auto" }}>

        <div style={{ margin: '0% 3% 3% 3%', paddingTop: "7%" }}>
          <ToolBar/>
          {
            (!this.state.showLoader || this.props.count) &&
            <MuiThemeProvider theme={this.getMuiTheme()}>
              <MUIDataTable title={translate("common.page.title.orgList")}
                columns={columns} options={options} data={this.props.organizationList} />
            </MuiThemeProvider>
          }
          {(this.state.showLoader) && <Spinner />}
          {this.state.apiInProgress ? this.renderProgressInformation() : <div />}
        {this.state.showStatus ? this.renderStatusInformation() : <div />}
        </div>
      </div >
    );
  }
}

const mapStateToProps = state => ({
  user: state.login,
  userinfo: state.userinfo,
  organizationList: state.organizationList.data,
  job_details: state.job_details,
  activateuser: state.activateuser,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      clearJobEntry,
      APITransport,
      CreateCorpus: APITransport
    },
    dispatch
  );

export default withRouter(withStyles(NewCorpusStyle)(connect(mapStateToProps, mapDispatchToProps)(OrganisationList)));
