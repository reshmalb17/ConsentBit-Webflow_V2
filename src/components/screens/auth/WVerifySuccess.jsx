import React from "react";
import { WVerifyResult } from "../../kit/WVerifyResult.jsx";

function WVerifySuccess() {return <WVerifyResult mode="success" previewUrl="https://acme.com" />;}

// Gallery-only variant: a staging (*.webflow.io) verification, to show the
// "Staging" label + note in the result modal.
function WVerifySuccessStaging() {return <WVerifyResult mode="success" previewUrl="https://acme.webflow.io" />;}

export { WVerifySuccess, WVerifySuccessStaging };
