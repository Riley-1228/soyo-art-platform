"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

type Exhibition = {
  id: string;
  number: string;
  title: string;
  description: string;
  image: string;
  note: string;
  period: string;
  curatorialNote: string;
  artistIds: string[];
  artworkIds: string[];
};

type Artist = {
  id: string;
  name: string;
  location: string;
  discipline: string;
};

type Artwork = {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  image: string;
  status:
    | "available"
    | "reserved"
    | "sold";
};

type ExhibitionApiResponse = {
  ok?: boolean;
  exhibitions?: Exhibition[];
  exhibition?: Exhibition;
  deletedId?: string;
  error?: string;
};

type ArtistListResponse = {
  ok?: boolean;
  artists?: Artist[];
  error?: string;
};

type ArtworkListResponse = {
  ok?: boolean;
  artworks?: Artwork[];
  error?: string;
};

type AdminAuthResponse = {
  authenticated?: boolean;
};

type ImageUploadResponse = {
  ok?: boolean;
  url?: string;
  pathname?: string;
  contentType?: string;
  error?: string;
};

type ExhibitionFormState = {
  id: string;
  number: string;
  title: string;
  description: string;
  image: string;
  note: string;
  period: string;
  curatorialNote: string;
  artistIds: string[];
  artworkIds: string[];
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/$/, "");

const MAX_IMAGE_BYTES =
  10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
  ]);

const emptyForm:
  ExhibitionFormState = {
    id: "",
    number: "",
    title: "",
    description: "",
    image: "",
    note: "",
    period: "",
    curatorialNote: "",
    artistIds: [],
    artworkIds: [],
  };

function exhibitionToForm(
  exhibition: Exhibition
): ExhibitionFormState {
  return {
    id:
      exhibition.id,
    number:
      exhibition.number,
    title:
      exhibition.title,
    description:
      exhibition.description,
    image:
      exhibition.image,
    note:
      exhibition.note,
    period:
      exhibition.period,
    curatorialNote:
      exhibition.curatorialNote,
    artistIds:
      [...exhibition.artistIds],
    artworkIds:
      [...exhibition.artworkIds],
  };
}

function formatFileSize(
  bytes: number
) {
  if (
    bytes < 1024 * 1024
  ) {
    return `${Math.max(
      1,
      Math.round(
        bytes / 1024
      )
    )} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function moveItem(
  values: string[],
  id: string,
  direction: -1 | 1
) {
  const currentIndex =
    values.indexOf(id);

  if (currentIndex < 0) {
    return values;
  }

  const nextIndex =
    currentIndex + direction;

  if (
    nextIndex < 0 ||
    nextIndex >= values.length
  ) {
    return values;
  }

  const next =
    [...values];

  [
    next[currentIndex],
    next[nextIndex],
  ] = [
    next[nextIndex],
    next[currentIndex],
  ];

  return next;
}

export default function AdminExhibitionsManager() {
  const router =
    useRouter();

  const [
    exhibitions,
    setExhibitions,
  ] = useState<Exhibition[]>([]);

  const [
    artists,
    setArtists,
  ] = useState<Artist[]>([]);

  const [
    artworks,
    setArtworks,
  ] = useState<Artwork[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    notice,
    setNotice,
  ] = useState("");

  const [
    mode,
    setMode,
  ] = useState<
    "idle" | "create" | "edit"
  >("idle");

  const [
    selectedId,
    setSelectedId,
  ] = useState<
    string | null
  >(null);

  const [
    form,
    setForm,
  ] = useState<ExhibitionFormState>(
    emptyForm
  );

  const [
    imageFile,
    setImageFile,
  ] = useState<File | null>(
    null
  );

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState("");

  const selectedExhibition =
    useMemo(
      () =>
        exhibitions.find(
          (exhibition) =>
            exhibition.id ===
            selectedId
        ) || null,
      [
        exhibitions,
        selectedId,
      ]
    );

  const artistById =
    useMemo(
      () =>
        new Map(
          artists.map(
            (artist) => [
              artist.id,
              artist,
            ]
          )
        ),
      [artists]
    );

  const artworkById =
    useMemo(
      () =>
        new Map(
          artworks.map(
            (artwork) => [
              artwork.id,
              artwork,
            ]
          )
        ),
      [artworks]
    );

  const requiredArtistIds =
    useMemo(
      () =>
        new Set(
          form.artworkIds
            .map(
              (artworkId) =>
                artworkById.get(
                  artworkId
                )?.artistId
            )
            .filter(
              (artistId): artistId is string =>
                Boolean(artistId)
            )
        ),
      [
        artworkById,
        form.artworkIds,
      ]
    );

  const visibleImage =
    previewUrl || form.image;

  const clearLocalPreview =
    useCallback(
      () => {
        setPreviewUrl(
          (current) => {
            if (
              current.startsWith(
                "blob:"
              )
            ) {
              URL.revokeObjectURL(
                current
              );
            }

            return "";
          }
        );

        setImageFile(null);
      },
      []
    );

  useEffect(() => {
    return () => {
      if (
        previewUrl.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          previewUrl
        );
      }
    };
  }, [previewUrl]);

  const loadData =
    useCallback(
      async () => {
        try {
          const authResponse =
            await fetch(
              `${API_BASE_URL}/api/admin/auth/me`,
              {
                credentials:
                  "include",
                cache:
                  "no-store",
              }
            );

          if (
            authResponse.status ===
            401
          ) {
            router.replace(
              "/admin/login"
            );
            return;
          }

          const authResult =
            (await authResponse
              .json()
              .catch(
                () => null
              )) as
              | AdminAuthResponse
              | null;

          if (
            !authResponse.ok ||
            !authResult
              ?.authenticated
          ) {
            router.replace(
              "/admin/login"
            );
            return;
          }

          const [
            exhibitionResponse,
            artistResponse,
            artworkResponse,
          ] =
            await Promise.all([
              fetch(
                `${API_BASE_URL}/api/admin/exhibitions`,
                {
                  credentials:
                    "include",
                  cache:
                    "no-store",
                }
              ),
              fetch(
                `${API_BASE_URL}/api/artists`,
                {
                  cache:
                    "no-store",
                }
              ),
              fetch(
                `${API_BASE_URL}/api/artworks`,
                {
                  cache:
                    "no-store",
                }
              ),
            ]);

          if (
            exhibitionResponse.status ===
            401
          ) {
            router.replace(
              "/admin/login"
            );
            return;
          }

          const exhibitionResult =
            (await exhibitionResponse
              .json()
              .catch(
                () => null
              )) as
              | ExhibitionApiResponse
              | null;

          const artistResult =
            (await artistResponse
              .json()
              .catch(
                () => null
              )) as
              | ArtistListResponse
              | null;

          const artworkResult =
            (await artworkResponse
              .json()
              .catch(
                () => null
              )) as
              | ArtworkListResponse
              | null;

          if (
            !exhibitionResponse.ok ||
            !exhibitionResult?.ok ||
            !Array.isArray(
              exhibitionResult.exhibitions
            )
          ) {
            throw new Error(
              exhibitionResult?.error ||
                "Could not load exhibitions."
            );
          }

          if (
            !artistResponse.ok ||
            !artistResult?.ok ||
            !Array.isArray(
              artistResult.artists
            )
          ) {
            throw new Error(
              artistResult?.error ||
                "Could not load artists."
            );
          }

          if (
            !artworkResponse.ok ||
            !artworkResult?.ok ||
            !Array.isArray(
              artworkResult.artworks
            )
          ) {
            throw new Error(
              artworkResult?.error ||
                "Could not load artworks."
            );
          }

          setExhibitions(
            exhibitionResult.exhibitions
          );
          setArtists(
            artistResult.artists
          );
          setArtworks(
            artworkResult.artworks
          );
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load the exhibition workspace."
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

  function startCreate() {
    clearLocalPreview();
    setMode("create");
    setSelectedId(null);
    setForm(
      emptyForm
    );
    setError("");
    setNotice("");
  }

  function startEdit(
    exhibition: Exhibition
  ) {
    clearLocalPreview();
    setMode("edit");
    setSelectedId(
      exhibition.id
    );
    setForm(
      exhibitionToForm(
        exhibition
      )
    );
    setError("");
    setNotice("");
  }

  function closeEditor() {
    clearLocalPreview();
    setMode("idle");
    setSelectedId(null);
    setForm(
      emptyForm
    );
    setError("");
    setNotice("");
  }

  function setField<
    Key extends keyof ExhibitionFormState
  >(
    key: Key,
    value: ExhibitionFormState[Key]
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      })
    );
  }

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setNotice("");

    if (
      !ALLOWED_IMAGE_TYPES.has(
        file.type
      )
    ) {
      setError(
        "Choose a JPG, PNG, WEBP or AVIF image."
      );
      event.target.value = "";
      return;
    }

    if (
      file.size >
      MAX_IMAGE_BYTES
    ) {
      setError(
        "Image must be 10 MB or smaller."
      );
      event.target.value = "";
      return;
    }

    clearLocalPreview();

    setImageFile(file);
    setPreviewUrl(
      URL.createObjectURL(
        file
      )
    );

    event.target.value = "";
  }

  function toggleArtist(
    artistId: string
  ) {
    const selected =
      form.artistIds.includes(
        artistId
      );

    if (
      selected &&
      requiredArtistIds.has(
        artistId
      )
    ) {
      setError(
        "This artist is required by a selected artwork. Remove that artwork first."
      );
      return;
    }

    setError("");
    setNotice("");

    setField(
      "artistIds",
      selected
        ? form.artistIds.filter(
            (id) =>
              id !== artistId
          )
        : [
            ...form.artistIds,
            artistId,
          ]
    );
  }

  function toggleArtwork(
    artworkId: string
  ) {
    const selected =
      form.artworkIds.includes(
        artworkId
      );

    setError("");
    setNotice("");

    if (selected) {
      setField(
        "artworkIds",
        form.artworkIds.filter(
          (id) =>
            id !== artworkId
        )
      );
      return;
    }

    const artwork =
      artworkById.get(
        artworkId
      );

    const nextArtistIds =
      artwork &&
      !form.artistIds.includes(
        artwork.artistId
      )
        ? [
            ...form.artistIds,
            artwork.artistId,
          ]
        : form.artistIds;

    setForm(
      (current) => ({
        ...current,
        artistIds:
          nextArtistIds,
        artworkIds: [
          ...current.artworkIds,
          artworkId,
        ],
      })
    );
  }

  function moveArtist(
    artistId: string,
    direction: -1 | 1
  ) {
    setField(
      "artistIds",
      moveItem(
        form.artistIds,
        artistId,
        direction
      )
    );
  }

  function moveArtwork(
    artworkId: string,
    direction: -1 | 1
  ) {
    setField(
      "artworkIds",
      moveItem(
        form.artworkIds,
        artworkId,
        direction
      )
    );
  }

  async function uploadImage(
    file: File
  ) {
    const data =
      new FormData();

    data.append(
      "image",
      file
    );

    const response =
      await fetch(
        `${API_BASE_URL}/api/admin/exhibitions/upload-image`,
        {
          method: "POST",
          credentials:
            "include",
          body: data,
        }
      );

    if (
      response.status ===
      401
    ) {
      router.replace(
        "/admin/login"
      );
      throw new Error(
        "Admin session expired."
      );
    }

    const result =
      (await response
        .json()
        .catch(
          () => null
        )) as
        | ImageUploadResponse
        | null;

    if (
      !response.ok ||
      !result?.ok ||
      !result.url
    ) {
      throw new Error(
        result?.error ||
          "The exhibition image could not be uploaded."
      );
    }

    return result.url;
  }

  async function cleanupUploadedImage(
    url: string
  ) {
    try {
      await fetch(
        `${API_BASE_URL}/api/admin/exhibitions/upload-image`,
        {
          method: "DELETE",
          credentials:
            "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify({
              url,
            }),
        }
      );
    } catch {
      // Best-effort cleanup only.
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      saving ||
      uploading ||
      mode === "idle"
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    let uploadedUrl:
      | string
      | null = null;

    try {
      let image =
        form.image;

      if (imageFile) {
        setUploading(true);
        uploadedUrl =
          await uploadImage(
            imageFile
          );
        image =
          uploadedUrl;
      }

      if (!image) {
        throw new Error(
          "Choose an exhibition image."
        );
      }

      const payload = {
        ...(mode === "create"
          ? {
              id:
                form.id,
            }
          : {}),
        number:
          form.number,
        title:
          form.title,
        description:
          form.description,
        image,
        note:
          form.note,
        period:
          form.period,
        curatorialNote:
          form.curatorialNote,
        artistIds:
          form.artistIds,
        artworkIds:
          form.artworkIds,
      };

      const url =
        mode === "create"
          ? `${API_BASE_URL}/api/admin/exhibitions`
          : `${API_BASE_URL}/api/admin/exhibitions/${encodeURIComponent(
              selectedId || ""
            )}`;

      const response =
        await fetch(
          url,
          {
            method:
              mode === "create"
                ? "POST"
                : "PATCH",
            credentials:
              "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify(
                payload
              ),
          }
        );

      if (
        response.status ===
        401
      ) {
        router.replace(
          "/admin/login"
        );
        return;
      }

      const result =
        (await response
          .json()
          .catch(
            () => null
          )) as
          | ExhibitionApiResponse
          | null;

      if (
        !response.ok ||
        !result?.ok ||
        !result.exhibition
      ) {
        throw new Error(
          result?.error ||
            "The exhibition could not be saved."
        );
      }

      uploadedUrl = null;
      clearLocalPreview();

      setNotice(
        mode === "create"
          ? "Exhibition created."
          : "Exhibition updated."
      );

      await loadData();

      setMode("edit");
      setSelectedId(
        result.exhibition.id
      );
      setForm(
        exhibitionToForm(
          result.exhibition
        )
      );
    } catch (saveError) {
      if (uploadedUrl) {
        await cleanupUploadedImage(
          uploadedUrl
        );
      }

      setError(
        saveError instanceof Error
          ? saveError.message
          : "The exhibition could not be saved."
      );
    } finally {
      setUploading(false);
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !selectedExhibition ||
      deleting
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${selectedExhibition.title}"?\n\nThis removes the exhibition and its artist/artwork links from SOYO.`
      );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");
    setNotice("");

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/api/admin/exhibitions/${encodeURIComponent(
            selectedExhibition.id
          )}`,
          {
            method:
              "DELETE",
            credentials:
              "include",
          }
        );

      if (
        response.status ===
        401
      ) {
        router.replace(
          "/admin/login"
        );
        return;
      }

      const result =
        (await response
          .json()
          .catch(
            () => null
          )) as
          | ExhibitionApiResponse
          | null;

      if (
        !response.ok ||
        !result?.ok
      ) {
        throw new Error(
          result?.error ||
            "The exhibition could not be deleted."
        );
      }

      closeEditor();
      await loadData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "The exhibition could not be deleted."
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="soyo-admin-dashboard-loading">
        Loading exhibitions…
      </main>
    );
  }

  return (
    <main className="soyo-admin-works-page">
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
            href="/exhibitions"
            target="_blank"
          >
            View public exhibitions ↗
          </Link>

          <Link
            className="soyo-admin-dashboard-logout"
            href="/admin"
          >
            Control Room
          </Link>
        </div>
      </header>

      <section className="soyo-admin-works-heading">
        <div>
          <p>
            CONTENT MANAGEMENT · EXHIBITIONS
          </p>
          <h1>
            Exhibitions
          </h1>
        </div>

        <button
          type="button"
          className="soyo-admin-primary-button"
          onClick={
            startCreate
          }
        >
          <span>
            Add exhibition
          </span>
          <span aria-hidden="true">
            +
          </span>
        </button>
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

      <section className="soyo-admin-works-layout">
        <div className="soyo-admin-works-list-panel">
          <div className="soyo-admin-works-list-head">
            <span>
              {exhibitions.length} exhibitions
            </span>
            <span>
              Select a room to edit
            </span>
          </div>

          <div className="soyo-admin-works-list">
            {exhibitions.length === 0 ? (
              <div className="soyo-admin-works-empty">
                No exhibitions yet.
              </div>
            ) : (
              exhibitions.map(
                (exhibition) => (
                  <button
                    type="button"
                    className={`soyo-admin-exhibition-row${
                      exhibition.id ===
                      selectedId
                        ? " is-active"
                        : ""
                    }`}
                    key={
                      exhibition.id
                    }
                    onClick={() =>
                      startEdit(
                        exhibition
                      )
                    }
                  >
                    <span className="soyo-admin-exhibition-room-number">
                      {
                        exhibition.number
                      }
                    </span>

                    <span className="soyo-admin-exhibition-thumb">
                      {exhibition.image ? (
                        <Image
                          src={
                            exhibition.image
                          }
                          alt=""
                          fill
                          sizes="66px"
                        />
                      ) : null}
                    </span>

                    <span className="soyo-admin-work-main">
                      <strong>
                        {
                          exhibition.title
                        }
                      </strong>
                      <small>
                        {
                          exhibition.period ||
                          "Period not set"
                        }
                      </small>
                    </span>

                    <span className="soyo-admin-exhibition-counts">
                      {exhibition.artistIds.length} artists · {exhibition.artworkIds.length} works
                    </span>
                  </button>
                )
              )
            )}
          </div>
        </div>

        <aside className="soyo-admin-work-editor">
          {mode === "idle" ? (
            <div className="soyo-admin-work-editor-empty">
              <span>
                CURATED ROOM
              </span>
              <h2>
                Select an
                <br />
                exhibition.
              </h2>
              <p>
                Manage the room image,
                curatorial text,
                participating artists and
                artwork order here.
              </p>
            </div>
          ) : (
            <form
              className="soyo-admin-work-form"
              onSubmit={
                handleSubmit
              }
            >
              <div className="soyo-admin-work-editor-head">
                <div>
                  <span>
                    {mode ===
                    "create"
                      ? "NEW EXHIBITION"
                      : "EDIT EXHIBITION"}
                  </span>
                  <h2>
                    {mode ===
                    "create"
                      ? "Add exhibition"
                      : form.title ||
                        "Untitled"}
                  </h2>
                </div>

                <button
                  type="button"
                  className="soyo-admin-text-button"
                  onClick={
                    closeEditor
                  }
                >
                  Close
                </button>
              </div>

              <div className="soyo-admin-work-form-grid">
                <label className="soyo-admin-field">
                  <span>
                    Exhibition ID *
                  </span>
                  <input
                    type="text"
                    value={
                      form.id
                    }
                    onChange={(
                      event
                    ) =>
                      setField(
                        "id",
                        event.target.value
                      )
                    }
                    disabled={
                      mode ===
                      "edit"
                    }
                    required
                    placeholder="new-voices"
                  />
                  {mode ===
                  "create" ? (
                    <small>
                      Lowercase letters,
                      numbers and hyphens.
                    </small>
                  ) : null}
                </label>

                <label className="soyo-admin-field">
                  <span>
                    Room number *
                  </span>
                  <input
                    type="text"
                    value={
                      form.number
                    }
                    onChange={(
                      event
                    ) =>
                      setField(
                        "number",
                        event.target.value
                      )
                    }
                    required
                    placeholder="01"
                  />
                </label>

                <label className="soyo-admin-field soyo-admin-field-wide">
                  <span>
                    Title *
                  </span>
                  <input
                    type="text"
                    value={
                      form.title
                    }
                    onChange={(
                      event
                    ) =>
                      setField(
                        "title",
                        event.target.value
                      )
                    }
                    required
                  />
                </label>

                <label className="soyo-admin-field soyo-admin-field-wide">
                  <span>
                    Short description
                  </span>
                  <textarea
                    rows={3}
                    value={
                      form.description
                    }
                    onChange={(
                      event
                    ) =>
                      setField(
                        "description",
                        event.target.value
                      )
                    }
                  />
                </label>

                <label className="soyo-admin-field">
                  <span>
                    Note
                  </span>
                  <input
                    type="text"
                    value={
                      form.note
                    }
                    onChange={(
                      event
                    ) =>
                      setField(
                        "note",
                        event.target.value
                      )
                    }
                    placeholder="Painting · New generation"
                  />
                </label>

                <label className="soyo-admin-field">
                  <span>
                    Period
                  </span>
                  <input
                    type="text"
                    value={
                      form.period
                    }
                    onChange={(
                      event
                    ) =>
                      setField(
                        "period",
                        event.target.value
                      )
                    }
                    placeholder="October — November 2026"
                  />
                </label>

                <label className="soyo-admin-field soyo-admin-field-wide">
                  <span>
                    Curatorial note
                  </span>
                  <textarea
                    rows={7}
                    value={
                      form.curatorialNote
                    }
                    onChange={(
                      event
                    ) =>
                      setField(
                        "curatorialNote",
                        event.target.value
                      )
                    }
                  />
                </label>

                <div className="soyo-admin-field soyo-admin-field-wide">
                  <span>
                    Exhibition image *
                  </span>

                  <div className="soyo-admin-image-uploader soyo-admin-exhibition-image-uploader">
                    <div className="soyo-admin-image-preview">
                      {visibleImage ? (
                        <Image
                          src={
                            visibleImage
                          }
                          alt={
                            form.title ||
                            "Exhibition preview"
                          }
                          fill
                          sizes="(max-width: 760px) 100vw, 360px"
                        />
                      ) : (
                        <span className="soyo-admin-image-placeholder">
                          NO IMAGE
                        </span>
                      )}
                    </div>

                    <div className="soyo-admin-image-upload-copy">
                      <strong>
                        {imageFile
                          ? imageFile.name
                          : form.image
                            ? "Current exhibition image"
                            : "Choose an exhibition image"}
                      </strong>

                      <p>
                        JPG, PNG, WEBP or AVIF · Maximum 10 MB
                      </p>

                      {imageFile ? (
                        <small>
                          {formatFileSize(
                            imageFile.size
                          )} · uploads when you save
                        </small>
                      ) : null}

                      <div className="soyo-admin-image-upload-actions">
                        <label className="soyo-admin-secondary-button soyo-admin-image-choose-button">
                          {form.image ||
                          imageFile
                            ? "Replace image"
                            : "Choose image"}
                          <input
                            className="soyo-admin-image-file-input"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            onChange={
                              handleImageChange
                            }
                          />
                        </label>

                        {imageFile ? (
                          <button
                            type="button"
                            className="soyo-admin-text-button"
                            onClick={
                              clearLocalPreview
                            }
                          >
                            Cancel selection
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="soyo-admin-field soyo-admin-field-wide">
                  <span>
                    Participating artists
                  </span>

                  <div className="soyo-admin-relation-grid">
                    <div className="soyo-admin-relation-choices">
                      {artists.length === 0 ? (
                        <p className="soyo-admin-relation-empty">
                          No artists available.
                        </p>
                      ) : (
                        artists.map(
                          (artist) => {
                            const checked =
                              form.artistIds.includes(
                                artist.id
                              );

                            const required =
                              requiredArtistIds.has(
                                artist.id
                              );

                            return (
                              <label
                                className="soyo-admin-relation-choice"
                                key={artist.id}
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    checked
                                  }
                                  onChange={() =>
                                    toggleArtist(
                                      artist.id
                                    )
                                  }
                                  disabled={
                                    checked &&
                                    required
                                  }
                                />

                                <span>
                                  <strong>
                                    {
                                      artist.name
                                    }
                                  </strong>
                                  <small>
                                    {artist.location}
                                    {artist.discipline
                                      ? ` · ${artist.discipline}`
                                      : ""}
                                  </small>
                                </span>

                                {required ? (
                                  <em>
                                    linked work
                                  </em>
                                ) : null}
                              </label>
                            );
                          }
                        )
                      )}
                    </div>

                    <div className="soyo-admin-relation-order">
                      <div className="soyo-admin-relation-order-head">
                        <span>
                          DISPLAY ORDER
                        </span>
                        <small>
                          {form.artistIds.length} selected
                        </small>
                      </div>

                      {form.artistIds.length === 0 ? (
                        <p className="soyo-admin-relation-empty">
                          No artists selected.
                        </p>
                      ) : (
                        form.artistIds.map(
                          (
                            artistId,
                            index
                          ) => {
                            const artist =
                              artistById.get(
                                artistId
                              );

                            return (
                              <div
                                className="soyo-admin-relation-order-row"
                                key={artistId}
                              >
                                <span>
                                  {String(
                                    index + 1
                                  ).padStart(
                                    2,
                                    "0"
                                  )}
                                </span>
                                <strong>
                                  {artist?.name ||
                                    artistId}
                                </strong>
                                <div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      moveArtist(
                                        artistId,
                                        -1
                                      )
                                    }
                                    disabled={
                                      index === 0
                                    }
                                    aria-label={`Move ${artist?.name || artistId} up`}
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      moveArtist(
                                        artistId,
                                        1
                                      )
                                    }
                                    disabled={
                                      index ===
                                      form.artistIds.length - 1
                                    }
                                    aria-label={`Move ${artist?.name || artistId} down`}
                                  >
                                    ↓
                                  </button>
                                </div>
                              </div>
                            );
                          }
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="soyo-admin-field soyo-admin-field-wide">
                  <span>
                    Exhibition works
                  </span>

                  <div className="soyo-admin-relation-grid">
                    <div className="soyo-admin-relation-choices">
                      {artworks.length === 0 ? (
                        <p className="soyo-admin-relation-empty">
                          No artworks available.
                        </p>
                      ) : (
                        artworks.map(
                          (artwork) => {
                            const checked =
                              form.artworkIds.includes(
                                artwork.id
                              );

                            return (
                              <label
                                className="soyo-admin-relation-choice soyo-admin-relation-choice-work"
                                key={artwork.id}
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    checked
                                  }
                                  onChange={() =>
                                    toggleArtwork(
                                      artwork.id
                                    )
                                  }
                                />

                                <span>
                                  <strong>
                                    {
                                      artwork.title
                                    }
                                  </strong>
                                  <small>
                                    {artwork.artist}
                                    {" · "}
                                    {artwork.status}
                                  </small>
                                </span>
                              </label>
                            );
                          }
                        )
                      )}
                    </div>

                    <div className="soyo-admin-relation-order">
                      <div className="soyo-admin-relation-order-head">
                        <span>
                          DISPLAY ORDER
                        </span>
                        <small>
                          {form.artworkIds.length} selected
                        </small>
                      </div>

                      {form.artworkIds.length === 0 ? (
                        <p className="soyo-admin-relation-empty">
                          No works selected.
                        </p>
                      ) : (
                        form.artworkIds.map(
                          (
                            artworkId,
                            index
                          ) => {
                            const artwork =
                              artworkById.get(
                                artworkId
                              );

                            return (
                              <div
                                className="soyo-admin-relation-order-row"
                                key={artworkId}
                              >
                                <span>
                                  {String(
                                    index + 1
                                  ).padStart(
                                    2,
                                    "0"
                                  )}
                                </span>
                                <strong>
                                  {artwork?.title ||
                                    artworkId}
                                </strong>
                                <div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      moveArtwork(
                                        artworkId,
                                        -1
                                      )
                                    }
                                    disabled={
                                      index === 0
                                    }
                                    aria-label={`Move ${artwork?.title || artworkId} up`}
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      moveArtwork(
                                        artworkId,
                                        1
                                      )
                                    }
                                    disabled={
                                      index ===
                                      form.artworkIds.length - 1
                                    }
                                    aria-label={`Move ${artwork?.title || artworkId} down`}
                                  >
                                    ↓
                                  </button>
                                </div>
                              </div>
                            );
                          }
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="soyo-admin-work-form-actions">
                {mode ===
                "edit" ? (
                  <button
                    type="button"
                    className="soyo-admin-danger-button"
                    onClick={
                      handleDelete
                    }
                    disabled={
                      deleting ||
                      saving ||
                      uploading
                    }
                  >
                    {deleting
                      ? "Deleting…"
                      : "Delete exhibition"}
                  </button>
                ) : (
                  <span />
                )}

                <div>
                  {mode ===
                    "edit" &&
                  selectedId ? (
                    <Link
                      className="soyo-admin-secondary-button"
                      href={`/exhibitions/${selectedId}`}
                      target="_blank"
                    >
                      View public ↗
                    </Link>
                  ) : null}

                  <button
                    type="submit"
                    className="soyo-admin-primary-button"
                    disabled={
                      saving ||
                      uploading ||
                      deleting
                    }
                  >
                    {uploading
                      ? "Uploading image…"
                      : saving
                        ? "Saving…"
                        : mode ===
                            "create"
                          ? "Create exhibition"
                          : "Save changes"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </aside>
      </section>
    </main>
  );
}
