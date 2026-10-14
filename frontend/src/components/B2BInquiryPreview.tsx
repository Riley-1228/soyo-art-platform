"use client";

import { FormEvent, useState } from "react";

export default function B2BInquiryPreview() {
  const [prepared, setPrepared] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const summary = [
      "SOYO B2B INQUIRY PREVIEW",
      "",
      `Project type: ${String(formData.get("projectType") ?? "")}`,
      `Name: ${String(formData.get("name") ?? "")}`,
      `Company / Studio: ${String(formData.get("company") ?? "")}`,
      `Email: ${String(formData.get("email") ?? "")}`,
      "",
      "Project brief:",
      String(formData.get("message") ?? ""),
    ].join("\n");

    let didCopy = false;

    try {
      await navigator.clipboard.writeText(summary);
      didCopy = true;
    } catch {
      didCopy = false;
    }

    setCopied(didCopy);
    setPrepared(true);
  };

  if (prepared) {
    return (
      <div className="b2b-preview-success" role="status">
        <span className="section-kicker">Preview Complete</span>
        <h3>Your inquiry flow is ready for testing.</h3>
        <p>
          This Alpha form does not send data yet. The delivery step will be
          connected when the backend inquiry workflow is added.
        </p>
        <p className="b2b-preview-copy-status">
          {copied
            ? "A copy of the test inquiry was copied to your clipboard."
            : "Clipboard access was unavailable, but the form flow completed normally."}
        </p>
        <button
          type="button"
          className="outline-button"
          onClick={() => {
            setPrepared(false);
            setCopied(false);
          }}
        >
          Prepare another inquiry <span aria-hidden="true">-&gt;</span>
        </button>
      </div>
    );
  }

  return (
    <form className="b2b-preview-form" onSubmit={handleSubmit}>
      <div className="b2b-preview-form-topline">
        <span>Alpha test form</span>
        <span>No message is sent yet</span>
      </div>

      <label className="b2b-preview-field">
        <span>Project Type *</span>
        <select name="projectType" defaultValue="Space curation" required>
          <option>Space curation</option>
          <option>Brand collaboration</option>
          <option>Commission</option>
          <option>Corporate collection</option>
          <option>Other</option>
        </select>
      </label>

      <div className="b2b-preview-two-column">
        <label className="b2b-preview-field">
          <span>Name *</span>
          <input name="name" type="text" autoComplete="name" required />
        </label>

        <label className="b2b-preview-field">
          <span>Company / Studio</span>
          <input name="company" type="text" autoComplete="organization" />
        </label>
      </div>

      <label className="b2b-preview-field">
        <span>Email *</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>

      <label className="b2b-preview-field">
        <span>Project Brief *</span>
        <textarea
          name="message"
          rows={5}
          required
          placeholder="Tell us about the space, collaboration, timing, or works you are considering."
        />
      </label>

      <button type="submit" className="primary-button b2b-preview-submit">
        Prepare inquiry <span aria-hidden="true">-&gt;</span>
      </button>

      <p className="b2b-preview-note">
        Preview mode: this step only tests the B2B inquiry experience. No data
        is stored or emailed in this phase.
      </p>
    </form>
  );
}
