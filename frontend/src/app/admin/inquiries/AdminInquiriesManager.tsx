"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

type InquiryStatus =
  | "new"
  | "read"
  | "replied"
  | "closed";

type Inquiry = {
  id: string;
  artworkId: string | null;
  artworkTitle: string;
  artistName: string;
  priceSnapshot: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  message: string;
  status: InquiryStatus;
  internalNote: string;
  privacyConsent: boolean;
  privacyConsentedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type InquiryResponse = {
  ok?: boolean;
  inquiries?: Inquiry[];
  inquiry?: Inquiry;
  error?: string;
};

type AdminAuthResponse = {
  authenticated?: boolean;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/$/, "");

const statusLabels: Record<InquiryStatus, string> = {
  new: "New",
  read: "Read",
  replied: "Replied",
  closed: "Closed",
};

function formatDate(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Seoul",
    }
  ).format(date);
}

export default function AdminInquiriesManager() {
  const router =
    useRouter();

  const [inquiries, setInquiries] =
    useState<Inquiry[]>([]);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [filter, setFilter] =
    useState<"all" | InquiryStatus>("all");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const [
    draftStatusOverride,
    setDraftStatusOverride,
  ] = useState<InquiryStatus | null>(null);

  const [
    internalNoteOverride,
    setInternalNoteOverride,
  ] = useState<string | null>(null);

  const selectedInquiry =
    useMemo(
      () =>
        inquiries.find(
          (item) =>
            item.id === selectedId
        ) || null,
      [inquiries, selectedId]
    );

  const draftStatus =
    draftStatusOverride ??
    selectedInquiry?.status ??
    "new";

  const internalNote =
    internalNoteOverride ??
    selectedInquiry?.internalNote ??
    "";

  const counts =
    useMemo(() => {
      const result = {
        all: inquiries.length,
        new: 0,
        read: 0,
        replied: 0,
        closed: 0,
      };

      for (const inquiry of inquiries) {
        result[inquiry.status] += 1;
      }

      return result;
    }, [inquiries]);

  const visibleInquiries =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return inquiries.filter(
        (inquiry) => {
          if (
            filter !== "all" &&
            inquiry.status !== filter
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          return [
            inquiry.name,
            inquiry.email,
            inquiry.artworkTitle,
            inquiry.artistName,
            inquiry.country,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);
        }
      );
    }, [filter, inquiries, search]);

  const loadData =
    useCallback(
      async () => {
        try {
          const authResponse =
            await fetch(
              `${API_BASE_URL}/api/admin/auth/me`,
              {
                credentials: "include",
                cache: "no-store",
              }
            );

          const authResult =
            (await authResponse
              .json()
              .catch(() => null)) as
              | AdminAuthResponse
              | null;

          if (
            authResponse.status === 401 ||
            !authResponse.ok ||
            !authResult?.authenticated
          ) {
            router.replace(
              "/admin/login"
            );
            return;
          }

          const response =
            await fetch(
              `${API_BASE_URL}/api/admin/inquiries`,
              {
                credentials: "include",
                cache: "no-store",
              }
            );

          if (
            response.status === 401
          ) {
            router.replace(
              "/admin/login"
            );
            return;
          }

          const result =
            (await response
              .json()
              .catch(() => null)) as
              | InquiryResponse
              | null;

          if (
            !response.ok ||
            !result?.ok ||
            !Array.isArray(
              result.inquiries
            )
          ) {
            throw new Error(
              result?.error ||
                "Could not load inquiries."
            );
          }

          setInquiries(
            result.inquiries
          );

          setSelectedId(
            (current) => {
              if (
                current &&
                result.inquiries?.some(
                  (item) =>
                    item.id === current
                )
              ) {
                return current;
              }

              return (
                result.inquiries?.[0]?.id ||
                null
              );
            }
          );
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load inquiries."
          );
        } finally {
          setLoading(false);
        }
      },
      [router]
    );

  useEffect(() => {
    const timerId =
      window.setTimeout(() => {
        void loadData();
      }, 0);

    return () => {
      window.clearTimeout(
        timerId
      );
    };
  }, [loadData]);

  async function updateInquiry(
    inquiryId: string,
    status: InquiryStatus,
    note: string,
    showNotice = true
  ) {
    const response =
      await fetch(
        `${API_BASE_URL}/api/admin/inquiries/${encodeURIComponent(
          inquiryId
        )}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            status,
            internalNote: note,
          }),
        }
      );

    if (
      response.status === 401
    ) {
      router.replace(
        "/admin/login"
      );
      return null;
    }

    const result =
      (await response
        .json()
        .catch(() => null)) as
        | InquiryResponse
        | null;

    if (
      !response.ok ||
      !result?.ok ||
      !result.inquiry
    ) {
      throw new Error(
        result?.error ||
          "The inquiry could not be updated."
      );
    }

    setInquiries(
      (current) =>
        current.map(
          (item) =>
            item.id === inquiryId
              ? result.inquiry as Inquiry
              : item
        )
    );

    if (showNotice) {
      setNotice(
        "Inquiry updated."
      );
    }

    return result.inquiry;
  }

  async function selectInquiry(
    inquiry: Inquiry
  ) {
    setSelectedId(
      inquiry.id
    );
    setDraftStatusOverride(null);
    setInternalNoteOverride(null);
    setError("");
    setNotice("");

    if (
      inquiry.status !== "new"
    ) {
      return;
    }

    try {
      await updateInquiry(
        inquiry.id,
        "read",
        inquiry.internalNote,
        false
      );
    } catch (readError) {
      setError(
        readError instanceof Error
          ? readError.message
          : "Could not mark the inquiry as read."
      );
    }
  }

  async function handleSave() {
    if (
      !selectedInquiry ||
      saving
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await updateInquiry(
        selectedInquiry.id,
        draftStatus,
        internalNote,
        true
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The inquiry could not be updated."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="soyo-admin-dashboard-loading">
        Loading inquiries…
      </main>
    );
  }

  return (
    <main className="soyo-admin-inquiries-page">
      <header className="soyo-admin-dashboard-header">
        <div className="soyo-admin-dashboard-brand">
          <Link
            href="/admin"
            className="soyo-admin-brand-home-link"
          >
            <span>SOYO</span>
            <small>
              逍遙 · ADMIN
            </small>
          </Link>
        </div>

        <div className="soyo-admin-dashboard-actions">
          <Link
            className="soyo-admin-dashboard-public-link"
            href="/works"
            target="_blank"
          >
            View public works ↗
          </Link>

          <Link
            className="soyo-admin-dashboard-logout"
            href="/admin"
          >
            Control Room
          </Link>
        </div>
      </header>

      <section className="soyo-admin-inquiries-heading">
        <div>
          <p>
            COLLECTOR RELATIONS · INQUIRIES
          </p>
          <h1>
            Inquiries
          </h1>
        </div>

        <div className="soyo-admin-inquiries-total">
          <span>
            OPEN QUEUE
          </span>
          <strong>
            {counts.new + counts.read}
          </strong>
          <small>
            new + read
          </small>
        </div>
      </section>

      {error ? (
        <div
          className="soyo-admin-work-message soyo-admin-work-message-error"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {notice ? (
        <div
          className="soyo-admin-work-message soyo-admin-work-message-success"
          role="status"
        >
          {notice}
        </div>
      ) : null}

      <section className="soyo-admin-inquiry-toolbar">
        <div className="soyo-admin-inquiry-filters">
          {(
            [
              "all",
              "new",
              "read",
              "replied",
              "closed",
            ] as const
          ).map(
            (value) => (
              <button
                type="button"
                key={value}
                className={
                  filter === value
                    ? "is-active"
                    : ""
                }
                onClick={() =>
                  setFilter(value)
                }
              >
                {value === "all"
                  ? "All"
                  : statusLabels[value]}
                <span>
                  {counts[value]}
                </span>
              </button>
            )
          )}
        </div>

        <label className="soyo-admin-inquiry-search">
          <span>
            Search
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Name, email or artwork"
          />
        </label>
      </section>

      <section className="soyo-admin-inquiries-layout">
        <div className="soyo-admin-inquiry-list-panel">
          <div className="soyo-admin-inquiry-list-head">
            <span>
              {visibleInquiries.length} inquiries
            </span>
            <span>
              New inquiries become Read when opened
            </span>
          </div>

          <div className="soyo-admin-inquiry-list">
            {visibleInquiries.length === 0 ? (
              <div className="soyo-admin-inquiry-empty">
                No inquiries match this view.
              </div>
            ) : (
              visibleInquiries.map(
                (inquiry) => (
                  <button
                    type="button"
                    key={inquiry.id}
                    className={`soyo-admin-inquiry-row${
                      selectedId === inquiry.id
                        ? " is-active"
                        : ""
                    }${
                      inquiry.status === "new"
                        ? " is-new"
                        : ""
                    }`}
                    onClick={() =>
                      void selectInquiry(
                        inquiry
                      )
                    }
                  >
                    <span className="soyo-admin-inquiry-id">
                      #{inquiry.id}
                    </span>

                    <span className="soyo-admin-inquiry-main">
                      <strong>
                        {inquiry.name}
                      </strong>
                      <small>
                        {inquiry.artworkTitle}
                      </small>
                      <em>
                        {inquiry.email}
                      </em>
                    </span>

                    <span className="soyo-admin-inquiry-date">
                      {formatDate(
                        inquiry.createdAt
                      )}
                    </span>

                    <span
                      className={`soyo-admin-inquiry-status is-${inquiry.status}`}
                    >
                      {statusLabels[
                        inquiry.status
                      ]}
                    </span>
                  </button>
                )
              )
            )}
          </div>
        </div>

        <aside className="soyo-admin-inquiry-detail-panel">
          {!selectedInquiry ? (
            <div className="soyo-admin-inquiry-detail-empty">
              <span>
                COLLECTOR INQUIRY
              </span>
              <h2>
                Select an inquiry
                <br />
                to review.
              </h2>
            </div>
          ) : (
            <div className="soyo-admin-inquiry-detail">
              <div className="soyo-admin-inquiry-detail-head">
                <div>
                  <span>
                    INQUIRY #{selectedInquiry.id}
                  </span>
                  <h2>
                    {selectedInquiry.name}
                  </h2>
                  <p>
                    Submitted {formatDate(
                      selectedInquiry.createdAt
                    )}
                  </p>
                </div>

                <span
                  className={`soyo-admin-inquiry-status is-${selectedInquiry.status}`}
                >
                  {statusLabels[
                    selectedInquiry.status
                  ]}
                </span>
              </div>

              <section className="soyo-admin-inquiry-section">
                <span className="soyo-admin-inquiry-section-label">
                  ARTWORK
                </span>

                <div className="soyo-admin-inquiry-artwork-card">
                  <div>
                    <strong>
                      {selectedInquiry.artworkTitle}
                    </strong>
                    <small>
                      {selectedInquiry.artistName || "—"}
                    </small>
                  </div>

                  <div>
                    <span>
                      {selectedInquiry.priceSnapshot || "Price on request"}
                    </span>

                    {selectedInquiry.artworkId ? (
                      <Link
                        href={`/works/${selectedInquiry.artworkId}`}
                        target="_blank"
                      >
                        View work ↗
                      </Link>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="soyo-admin-inquiry-section">
                <span className="soyo-admin-inquiry-section-label">
                  COLLECTOR
                </span>

                <dl className="soyo-admin-inquiry-contact-grid">
                  <div>
                    <dt>Email</dt>
                    <dd>
                      <a
                        href={`mailto:${selectedInquiry.email}`}
                      >
                        {selectedInquiry.email}
                      </a>
                    </dd>
                  </div>

                  <div>
                    <dt>Phone / Kakao</dt>
                    <dd>
                      {selectedInquiry.phone || "—"}
                    </dd>
                  </div>

                  <div>
                    <dt>Country</dt>
                    <dd>
                      {selectedInquiry.country || "—"}
                    </dd>
                  </div>

                  <div>
                    <dt>Privacy consent</dt>
                    <dd>
                      {selectedInquiry.privacyConsent
                        ? `Yes · ${formatDate(
                            selectedInquiry.privacyConsentedAt
                          )}`
                        : "No"}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="soyo-admin-inquiry-section">
                <span className="soyo-admin-inquiry-section-label">
                  MESSAGE
                </span>

                <div className="soyo-admin-inquiry-message">
                  {selectedInquiry.message ||
                    "No message was provided."}
                </div>
              </section>

              <section className="soyo-admin-inquiry-section">
                <span className="soyo-admin-inquiry-section-label">
                  FOLLOW-UP
                </span>

                <div className="soyo-admin-inquiry-followup-grid">
                  <label className="soyo-admin-field">
                    <span>
                      Status
                    </span>
                    <select
                      value={draftStatus}
                      onChange={(event) =>
                        setDraftStatusOverride(
                          event.target.value as InquiryStatus
                        )
                      }
                    >
                      <option value="new">
                        New
                      </option>
                      <option value="read">
                        Read
                      </option>
                      <option value="replied">
                        Replied
                      </option>
                      <option value="closed">
                        Closed
                      </option>
                    </select>
                  </label>

                  <a
                    className="soyo-admin-primary-button soyo-admin-inquiry-reply"
                    href={`mailto:${selectedInquiry.email}?subject=${encodeURIComponent(
                      `Re: SOYO Purchase Inquiry - ${selectedInquiry.artworkTitle}`
                    )}`}
                  >
                    <span>
                      Reply by email
                    </span>
                    <span aria-hidden="true">
                      ↗
                    </span>
                  </a>
                </div>

                <label className="soyo-admin-field soyo-admin-inquiry-note-field">
                  <span>
                    Internal note
                  </span>
                  <textarea
                    rows={7}
                    maxLength={5000}
                    value={internalNote}
                    onChange={(event) =>
                      setInternalNoteOverride(
                        event.target.value
                      )
                    }
                    placeholder="Private notes for SOYO administrators only."
                  />
                </label>

                <div className="soyo-admin-inquiry-save-row">
                  <small>
                    Last updated {formatDate(
                      selectedInquiry.updatedAt
                    )}
                  </small>

                  <button
                    type="button"
                    className="soyo-admin-primary-button"
                    onClick={() =>
                      void handleSave()
                    }
                    disabled={saving}
                  >
                    <span>
                      {saving
                        ? "Saving…"
                        : "Save inquiry"}
                    </span>
                    <span aria-hidden="true">
                      →
                    </span>
                  </button>
                </div>
              </section>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
