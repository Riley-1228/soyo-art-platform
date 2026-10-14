"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

type PurchaseInquiryProps = {
  artworkId: string;
  artworkTitle: string;
  artist: string;
  price: string;
};

export default function PurchaseInquiry({
  artworkId,
  artworkTitle,
  artist,
  price,
}: PurchaseInquiryProps) {
  const [open, setOpen] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [
    submitError,
    setSubmitError,
  ] = useState("");

  useEffect(() => {
    if (!open) return;

    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        "";

      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [open]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    const form =
      event.currentTarget;

    const formData =
      new FormData(form);

    const payload = {
      artworkId,

      name: String(
        formData.get("name") ?? ""
      ),

      email: String(
        formData.get("email") ?? ""
      ),

      phone: String(
        formData.get("phone") ?? ""
      ),

      country: String(
        formData.get("country") ?? ""
      ),

      message: String(
        formData.get("message") ?? ""
      ),

      privacyConsent:
        formData.get(
          "privacyConsent"
        ) === "on",
    };

    try {
      const response =
        await fetch(
          "/api/inquiries",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(payload),
          }
        );

      const result =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "The inquiry could not be sent."
        );
      }

      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "The inquiry could not be sent."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const closePanel = () => {
    setOpen(false);

    window.setTimeout(() => {
      setSubmitted(false);
      setSubmitError("");
      setSubmitting(false);
    }, 300);
  };

  return (
    <>
      <button
        type="button"
        className="artwork-inquiry-button"
        onClick={() => {
          setSubmitError("");
          setOpen(true);
        }}
      >
        <span>
          Inquire to Collect
        </span>

        <span aria-hidden="true">
          →
        </span>
      </button>

      {open ? (
        <div
          className="purchase-inquiry-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closePanel();
            }
          }}
        >
          <aside
            className="purchase-inquiry-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="purchase-inquiry-title"
          >
            <button
              type="button"
              className="purchase-inquiry-close"
              onClick={closePanel}
              aria-label="Close inquiry"
            >
              ×
            </button>

            {!submitted ? (
              <>
                <div className="purchase-inquiry-header">
                  <span className="section-kicker">
                    Collect with SOYO
                  </span>

                  <h2 id="purchase-inquiry-title">
                    Inquire to
                    <br />
                    Collect
                  </h2>

                  <p>
                    작품 구매 및 판매 가능 여부를
                    SOYO가 확인한 후 안내드립니다.
                  </p>
                </div>

                <div className="purchase-inquiry-work">
                  <div>
                    <span>
                      Artwork
                    </span>

                    <strong>
                      {artworkTitle}
                    </strong>

                    <small>
                      {artist}
                    </small>
                  </div>

                  <p>
                    {price}
                  </p>
                </div>

                <form
                  className="purchase-inquiry-form"
                  onSubmit={handleSubmit}
                >
                  <div className="purchase-form-field">
                    <label htmlFor="inquiry-name">
                      Name *
                    </label>

                    <input
                      id="inquiry-name"
                      name="name"
                      type="text"
                      required
                      maxLength={80}
                      autoComplete="name"
                    />
                  </div>

                  <div className="purchase-form-field">
                    <label htmlFor="inquiry-email">
                      Email *
                    </label>

                    <input
                      id="inquiry-email"
                      name="email"
                      type="email"
                      required
                      maxLength={120}
                      autoComplete="email"
                    />
                  </div>

                  <div className="purchase-form-two-column">
                    <div className="purchase-form-field">
                      <label htmlFor="inquiry-phone">
                        Phone / Kakao
                      </label>

                      <input
                        id="inquiry-phone"
                        name="phone"
                        type="text"
                        maxLength={50}
                        autoComplete="tel"
                      />
                    </div>

                    <div className="purchase-form-field">
                      <label htmlFor="inquiry-country">
                        Country
                      </label>

                      <input
                        id="inquiry-country"
                        name="country"
                        type="text"
                        maxLength={60}
                        autoComplete="country-name"
                      />
                    </div>
                  </div>

                  <div className="purchase-form-field">
                    <label htmlFor="inquiry-message">
                      Message
                    </label>

                    <textarea
                      id="inquiry-message"
                      name="message"
                      rows={5}
                      maxLength={1500}
                      placeholder="Tell us anything you would like to know about this work."
                    />
                  </div>

                  <label className="purchase-form-consent">
                    <input
                      type="checkbox"
                      name="privacyConsent"
                      required
                    />

                    <span>
                      I agree to the collection
                      and use of my information
                      for this purchase inquiry.
                    </span>
                  </label>

                  {submitError ? (
                    <p
                      className="purchase-form-error"
                      role="alert"
                    >
                      {submitError}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    className="purchase-inquiry-submit"
                    disabled={submitting}
                  >
                    <span>
                      {submitting
                        ? "Sending..."
                        : "Send Inquiry"}
                    </span>

                    <span aria-hidden="true">
                      →
                    </span>
                  </button>

                  <p className="purchase-form-note">
                    SOYO will only use the
                    submitted information to
                    respond to this inquiry.
                  </p>
                </form>
              </>
            ) : (
              <div className="purchase-inquiry-success">
                <span>
                  SOYO · ART &amp; OBJECT
                </span>

                <h2>
                  Thank you for
                  <br />
                  your interest.
                </h2>

                <p>
                  Your inquiry has been sent to
                  SOYO. We will review the
                  artwork availability and your
                  request before responding.
                </p>

                <button
                  type="button"
                  onClick={closePanel}
                >
                  Close
                </button>
              </div>
            )}
          </aside>
        </div>
      ) : null}
    </>
  );
}