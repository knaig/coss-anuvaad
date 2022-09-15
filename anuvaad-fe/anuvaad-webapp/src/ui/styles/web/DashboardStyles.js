
const DashboardStyles = theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    textAlign: 'center',
    alignItems: 'center'
  },
  margin: {
    margin: theme.spacing(1),
    width: '100%'
  },
  withoutLabel: {
    marginTop: theme.spacing(3)
  },
  typographyHeader: {
    paddingBottom: "12px", 
    paddingTop: "2%",
    fontfamily: `"Roboto", sans-serif ,sans-serif`,
    fontSize: "1.35rem",
    fontWeight: "700"

  },
  paper: {
    width: "40%",
    marginTop: "3%",
    marginBottom: "2%",
    padding: '3%'
  },
  grid1: {
    marginLeft: "6.5%"
  },
  grid2: {
    marginLeft: "6.3%"
  },
  divChip:
  {
    // marginLeft: "8%",
    paddingTop: "3%"
  },
  divTextField: {
    marginLeft: "3.2%"
  },

  typography: {
    marginLeft: "4.5%",
    paddingTop: "9.5%", fontfamily: '"Source Sans Pro", sans-serif',

  },
  select: {
    width: '92%',
    fullWidth: true,
    display: "flex",
    wrap: "nowrap",
    height: '40px',
    magin: 'dense',
    float: 'right'
  },

  grid: {
    marginTop: "3%"
  },
  textfield: {
    width: "96%"

  },
  button1: {
    width: "98%", borderRadius: "20px 20px 20px 20px", height: '46px'
  },

  button2: {
    width: "44%", marginTop: '5%', marginLeft: '5.6%'
  },
  dropZoneArea: {
    minHeight: '385px',
    height: "304px"

  },
  label: {
    textAlign: 'left', marginTop: 'auto', marginBottom: 'auto'
  },
  rowData: {
    display: 'flex', flexDirection: 'row', marginTop: '3%'
  },
  dataChip: {
    display: 'flex', flexDirection: 'row', marginLeft: '0px', flexWrap: 'wrap'
  },

  progress: {
    position: 'relative',
    top: '40%',
    color: '#2C2799'
  },
  progressDiv: {
    position: 'fixed',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    opacity: 0.7
  },
  transliterateTextArea: {
    padding: "1%", 
    height: '100px', 
    fontFamily: '"Source Sans Pro", "Arial", sans-serif', 
    fontSize: "21px", 
    width: '97.8%', 
    borderRadius: '4px'
  }

});


export default DashboardStyles;