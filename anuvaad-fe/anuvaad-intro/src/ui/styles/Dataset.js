import { makeStyles } from "@mui/styles";
import AnuvaadbackgroundImage from "../../img/Slide.png";

const DatasetStyle = makeStyles({
  Anuvaanlogo: {
    width: "90%",
    margin: "0px 0px 0px 0px",
    filter: "grayscale(100%)",
    "&:hover": {
      filter: "grayscale(0%)",
    },
  },
  section: {
    backgroundImage: `url(${AnuvaadbackgroundImage})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundPosition: "center",
    padding: "0 5%",
    display: "flex",
    alignItems: "center",
    marginTop: 50
  },
  headerbtn: {
    color: "#51504f",
    textTransform: "capitalize",
    fontSize: "16px",
    fontFamily: "roboto,sans-serif",
  },

  Anuvaadtitle: {
    fontWeight: "500",
    fontSize: "62px",
    lineHeight: 1.17,
    color: "#3a3a3a",
    textAlign: "left",
    margin: "0 35px 25px 45px",
  },
  footerGridMain: {
    backgroundColor: "#51504f",
    padding: "20px",
    color: "white",
    display: "grid",
    textAlign: "end",
  },
  footerGridMains: {
    backgroundColor: "#51504f",
    // padding: "5px",
    color: "white",
    display: "flex",
    textAlign: "start",
  },
  footerGrid: {
    backgroundColor: "#636365",
    padding: "3px 45px 3px 3px",
    color: "white",
    // display: "flex",
    // justifyContent: "center",
    "@media (max-width:1200px)": {
      padding: "3px 3px 3px 3px",
    },
  },
  footerGridlast: {
    backgroundColor: "#636365",
    padding: "3px 0px 3px 60px",
    color: "white",
    "@media (max-width:1200px)": {
      padding: "3px 3px 3px 3px",
    },
  },
  integrationPaper: {
    padding: "2px 4px",
    display: "block",
    alignItems: "center",
    width: "250px",
    border: "1px solid gray",
  },
  featuresimg: {
    width: "150px",
    margin: "20px 50px 12px 0px",
    float: "left",
  },
  titles: {
    fontSize: "55px",
    lineHeight: 1.17,
    color: "#51504f",
    marginBottom: "50px",
  },
  featuresTitle: {
    display: "flex",
    fontWeight: 500,
    lineHeight: "1.17px",
    color: "#51504f",
    letterSpacing: "1px",
    "@media (max-width:990px)": {
      lineHeight: "19px",
      fontSize: "20px",
    },
  },
  PrinciplesContent: {
    fontSize: "16px",
    color: "#707070",
    lineHeight: "25px",
  },
  featuresContent: {
    textAlign: "left",
    fontSize: "16px",
    color: "#707070",
    lineHeight: "25px",
    textAlign: "justify",
  },
  principlesTitle: {
    // fontWeight: 500,
    letterSpacing: "1px",
    fontSize: "35px",
    lineHeight: 1.17,
    color: "#51504f",
    justifyContent: "center",
    "@media (max-width:550px)": {
      fontSize: "28px",
    },
  },
  homeLink: {
    color: "#000",
    textDecoration: "underline",
    "&:hover": {
      color: "#000",
      textDecoration: "underline",
    },
  },

  description: {
    fontSize: "1.25rem",
    lineHeight: "2rem",
    margin: "0 35px 25px 0",
    textAlign: "justify",
  },
  Principlesimg: {
    width: "100px",
    margin: "20px 0px 12px 0px",
  },
  footerimg: {
    width: "40px",
    margin: "20px 0px 12px 35px",
    borderRadius: "15%",
    maxHeight: "40px",
  },
  buttons: {
    textTransform: "capitalize",
    padding: "10px",
    backgroundColor: "rgb(44, 39, 153)",
    borderRadius: "5px",
    display: "flex",
    marginLeft: "42px",
  },
  thanks: {
    "&:hover": {
      textDecoration: "underline",
      cursor: "pointer",
    },
    userImg: {
      maxHeight: "300px",
      maxWidth: "200px",
      borderRadius: "50%",
      marginTop: "5px",
    },
  },
  useCaseCard: {
    width: window.innerWidth * 0.8,
    minHeight: 500,
    border: "1px solid #CCD1D1",
  },
  useCaseContent: {
    textAlign: "left",
    fontSize: "16px",
    color: "#707070",
    lineHeight: "25px",
    marginTop: "40px",
    textAlign: "justify",
  },
  highlightedMenu: {
    color: "#51504f",
    textTransform: "capitalize",
    fontSize: "16px",
    fontFamily: "roboto,sans-serif",
    marginLeft: "20px",
    backgroundColor: "#E0E0E0",
    "&:hover": {
      backgroundColor: "#E0E0E0",
    },
  },

  headerMenu: {
    color: "#51504f",
    textTransform: "capitalize",
    fontSize: "16px",
    fontFamily: "roboto,sans-serif",
    marginLeft: "20px",
    "&:hover": {
      backgroundColor: "#E0E0E0",
    },
  },
  Usecaseimg: {
    width: "150px",
    margin: "20px 50px 20px 0px",
    float: "left",
    fontSize: "90px",
    color: "#2E86C1",
  },
  usecaseTitle: {
    display: "flex",
    fontWeight: 800,
    lineHeight: "1.17px",
    color: "#51504f",
    letterSpacing: "1px",
    fontSize: "24px",
    "@media (max-width:990px)": {
      lineHeight: "19px",
      fontSize: "20px",
    },
  },
  usecaseSubTitle: {
    display: "flex",
    fontWeight: 800,
    lineHeight: "1.17px",
    color: "#51504f",
    letterSpacing: "1px",
    fontSize: "20px",

  },
  UseCaseContent: {
    textAlign: "left",
    fontSize: "16px",
    color: "#707070",
    lineHeight: "25px",
    textAlign: "justify",
  },
});

export default DatasetStyle;
