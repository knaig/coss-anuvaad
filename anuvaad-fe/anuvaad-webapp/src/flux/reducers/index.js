import login from './umc/login';
import automl from './dashboard/automl';
// import nmt from './nmt';
import nmtsp from './user/nmtsp';
import apistatus from './apistatus/apistatus';
// import translations from './translations';
// import translation_sentences from './translation_sentences';
import sentences from './sentences/sentences';
import userProfile from './user/userprofile';
// import translation from './translation';
import userRoles from './user/userroles';
import updatePasswordstatus from './user/updatepassword';
import uploadTokenValue from './user/uploadtoken';
import intractiveTrans from './document_translate/intractive_translate';
import signup from './user/signup';
import forgotpassword from './user/forgotpassword';
import setpassword from './user/setpassword';
import activate from './user/activate';
import workflowStatus from "./common/fileupload";
import documentUplaod from "./document_upload/documentUpload";
import fetchDocument from "./view_document/fetch_document";
import job_details from './jobs/v1_fetch_job_details';
import document_contents from './document_translate/v1_fetch_content';
// import fetch_languages from './v1_fetchlanguages';
import fetch_models from './common/v1_fetch_model';
import active_page_number from './document_translate/v1_pageUpdates';

import fetchContent from "./document_translate/fetchcontent";
import documentconverter from "./document_translate/documentconverter";
import wordDictionary from "./document_translate/word_dictionary";
import saveContent from "./document_translate/savecontent";

import block_highlight from './document_translate/blockReducer'
import sentence_highlight from './sentences/sentenceReducer'
import sentence_action_operation from './sentences/sentenceActionReducer'
import async_job_status from './jobs/async_job_management'
import document_editor_mode from './editor/document_editor_mode';

import show_pdf from './document_translate/showPdfReducer'
import open_sidebar from './common/showsidebar'
import job_status from './view_document/v1.job_progress';

import userinfo from './user/userdetails';
import createusers from './user/createusers';
import activateuser from './user/activate_exisiting_user';
import deactivateuser from './user/deactivate_existing_user';

import organizationList from './organization/fetch_organization'

export default {
    login,
    automl,
    // nmt,
    nmtsp,
    apistatus,
    sentences,
    // translations,
    // translation_sentences,
    userProfile,
    updatePasswordstatus,
    // translation,
    userRoles,
    uploadTokenValue,
    intractiveTrans,
    signup,
    forgotpassword,
    setpassword,
    activate,
    workflowStatus,
    documentUplaod,
    fetchDocument,
    fetchContent,
    documentconverter,
    wordDictionary,
    saveContent,
    job_details,
    document_contents,
    // fetch_languages,
    fetch_models,

    block_highlight,
    sentence_highlight,
    sentence_action_operation,

    async_job_status,
    document_editor_mode,

    show_pdf,
    open_sidebar,
    
    active_page_number,
    job_status,
    userinfo,
    createusers,
    activateuser,
    deactivateuser,
    organizationList
};
