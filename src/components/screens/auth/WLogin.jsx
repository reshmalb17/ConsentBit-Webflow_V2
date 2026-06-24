import React from "react";
import { WLogo } from "../../kit/WLogo.jsx";
import { WPage } from "../../kit/WPage.jsx";
import { WTopBar } from "../../kit/WTopBar.jsx";
import { Field } from "../../primitives/Field.jsx";

function WLogin() {
  return (
    <WPage scroll={false} style={{ display: "flex", flexDirection: "column" }}>
      <WTopBar minimal />
      <div className="w-auth-center" style={{ padding: "30px" }}>
        <div style={{ width: "100%", maxWidth: 320, textAlign: "center" }}>
          <div style={{ marginBottom: 24, display: "flex", justifyContent: "center" }}><WLogo size="lg" /></div>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 22 }}>Log In</div>
          <div style={{ textAlign: "left" }}>
            <Field label="Email ID" help={false}>
              <input className="input" placeholder="you@company.com" />
            </Field>
            <button className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }}>Send Magic Link</button>
            <div style={{ color: "var(--text-faint)", fontSize: 11, marginTop: 12, textAlign: "center" }}>Please check your inbox</div>
          </div>
        </div>
      </div>
    </WPage>);

}

export { WLogin };
