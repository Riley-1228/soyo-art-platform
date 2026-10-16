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

type Artist = {
  id: string;
  name: string;
  location: string;
  discipline: string;
  image: string;
  statement: string;
  bio: string;
  artworkIds: string[];
  exhibitionIds: string[];
};

type ArtistApiResponse = {
  ok?: boolean;
  artists?: Artist[];
  artist?: Artist;
  deletedId?: string;
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

type ArtistFormState = {
  id: string;
  name: string;
  location: string;
  discipline: string;
  image: string;
  statement: string;
  bio: string;
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
  ArtistFormState = {
    id: "",
    name: "",
    location: "",
    discipline: "",
    image: "",
    statement: "",
    bio: "",
  };

function artistToForm(
  artist: Artist
): ArtistFormState {
  return {
    id:
      artist.id,
    name:
      artist.name,
    location:
      artist.location,
    discipline:
      artist.discipline,
    image:
      artist.image,
    statement:
      artist.statement,
    bio:
      artist.bio,
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

export default function AdminArtistsManager() {
  const router =
    useRouter();

  const [
    artists,
    setArtists,
  ] = useState<Artist[]>([]);

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
  ] = useState<ArtistFormState>(
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

  const selectedArtist =
    useMemo(
      () =>
        artists.find(
          (artist) =>
            artist.id ===
            selectedId
        ) || null,
      [
        artists,
        selectedId,
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

  const loadArtists =
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

          const response =
            await fetch(
              `${API_BASE_URL}/api/admin/artists`,
              {
                credentials:
                  "include",
                cache:
                  "no-store",
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
              | ArtistApiResponse
              | null;

          if (
            !response.ok ||
            !result?.ok ||
            !Array.isArray(
              result.artists
            )
          ) {
            throw new Error(
              result?.error ||
                "Could not load artists."
            );
          }

          setArtists(
            result.artists
          );
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load the artist workspace."
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
        void loadArtists();
      }, 0);

    return () => {
      window.clearTimeout(
        timerId
      );
    };
  }, [loadArtists]);

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
    artist: Artist
  ) {
    clearLocalPreview();
    setMode("edit");
    setSelectedId(
      artist.id
    );
    setForm(
      artistToForm(
        artist
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
    Key extends keyof ArtistFormState
  >(
    key: Key,
    value: ArtistFormState[Key]
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]:
          value,
      })
    );
  }

  function handleImageChange(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target
        .files?.[0] || null;

    event.target.value = "";

    if (!file) {
      return;
    }

    if (
      !ALLOWED_IMAGE_TYPES.has(
        file.type
      )
    ) {
      setError(
        "Choose a JPG, PNG, WEBP or AVIF image."
      );
      return;
    }

    if (
      file.size >
      MAX_IMAGE_BYTES
    ) {
      setError(
        "Image must be 10 MB or smaller."
      );
      return;
    }

    clearLocalPreview();

    const objectUrl =
      URL.createObjectURL(
        file
      );

    setImageFile(file);
    setPreviewUrl(
      objectUrl
    );
    setError("");
    setNotice("");
  }

  async function uploadImage(
    file: File
  ) {
    setUploading(true);

    try {
      const body =
        new FormData();

      body.append(
        "image",
        file
      );

      const response =
        await fetch(
          `${API_BASE_URL}/api/admin/artists/upload-image`,
          {
            method:
              "POST",
            credentials:
              "include",
            body,
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
            "The artist image could not be uploaded."
        );
      }

      return result.url;
    } finally {
      setUploading(false);
    }
  }

  async function cleanupUploadedImage(
    url: string
  ) {
    try {
      await fetch(
        `${API_BASE_URL}/api/admin/artists/upload-image`,
        {
          method:
            "DELETE",
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
      // Cleanup is best-effort.
    }
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      saving ||
      uploading ||
      mode === "idle"
    ) {
      return;
    }

    if (
      !imageFile &&
      !form.image
    ) {
      setError(
        "Choose an artist image before saving."
      );
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    let uploadedImageUrl =
      "";

    try {
      const imageUrl =
        imageFile
          ? await uploadImage(
              imageFile
            )
          : form.image;

      if (imageFile) {
        uploadedImageUrl =
          imageUrl;
      }

      const payload = {
        ...(mode === "create"
          ? {
              id:
                form.id,
            }
          : {}),
        name:
          form.name,
        location:
          form.location,
        discipline:
          form.discipline,
        image:
          imageUrl,
        statement:
          form.statement,
        bio:
          form.bio,
      };

      const url =
        mode === "create"
          ? `${API_BASE_URL}/api/admin/artists`
          : `${API_BASE_URL}/api/admin/artists/${encodeURIComponent(
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
          | ArtistApiResponse
          | null;

      if (
        !response.ok ||
        !result?.ok
      ) {
        throw new Error(
          result?.error ||
            "The artist could not be saved."
        );
      }

      clearLocalPreview();

      setNotice(
        mode === "create"
          ? "Artist created."
          : "Artist updated."
      );

      const savedId =
        result.artist?.id ||
        selectedId ||
        form.id;

      await loadArtists();

      if (
        result.artist
      ) {
        setMode("edit");
        setSelectedId(
          savedId
        );
        setForm(
          artistToForm(
            result.artist
          )
        );
      }
    } catch (saveError) {
      if (
        uploadedImageUrl
      ) {
        await cleanupUploadedImage(
          uploadedImageUrl
        );
      }

      setError(
        saveError instanceof Error
          ? saveError.message
          : "The artist could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !selectedArtist ||
      deleting
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${selectedArtist.name}"?\n\nArtists linked to artworks cannot be deleted.`
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
          `${API_BASE_URL}/api/admin/artists/${encodeURIComponent(
            selectedArtist.id
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
          | ArtistApiResponse
          | null;

      if (
        !response.ok ||
        !result?.ok
      ) {
        throw new Error(
          result?.error ||
            "The artist could not be deleted."
        );
      }

      closeEditor();
      await loadArtists();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "The artist could not be deleted."
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="soyo-admin-dashboard-loading">
        Loading artists…
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
            href="/artists"
            target="_blank"
          >
            View public artists ↗
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
            CONTENT MANAGEMENT · ARTISTS
          </p>
          <h1>
            Artists
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
            Add artist
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
              {artists.length} artists
            </span>
            <span>
              Select a profile to edit
            </span>
          </div>

          <div className="soyo-admin-works-list">
            {artists.length === 0 ? (
              <div className="soyo-admin-works-empty">
                No artists yet.
              </div>
            ) : (
              artists.map(
                (
                  artist,
                  index
                ) => (
                  <button
                    type="button"
                    className={`soyo-admin-artist-row${
                      artist.id ===
                      selectedId
                        ? " is-active"
                        : ""
                    }`}
                    key={
                      artist.id
                    }
                    onClick={() =>
                      startEdit(
                        artist
                      )
                    }
                  >
                    <span className="soyo-admin-work-index">
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <span className="soyo-admin-artist-thumb">
                      {artist.image ? (
                        <Image
                          src={
                            artist.image
                          }
                          alt=""
                          fill
                          sizes="58px"
                        />
                      ) : null}
                    </span>

                    <span className="soyo-admin-work-main">
                      <strong>
                        {
                          artist.name
                        }
                      </strong>
                      <small>
                        {artist.location ||
                          "Location not set"}
                        {artist.discipline
                          ? ` · ${artist.discipline}`
                          : ""}
                      </small>
                    </span>

                    <span className="soyo-admin-artist-count">
                      {artist.artworkIds.length}
                      {" "}
                      {artist.artworkIds.length === 1
                        ? "work"
                        : "works"}
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
                ARTIST PROFILE
              </span>
              <h2>
                Select an artist
                <br />
                to manage.
              </h2>
              <p>
                Manage the artist image,
                biography, location and
                discipline here.
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
                      ? "NEW ARTIST"
                      : "EDIT ARTIST"}
                  </span>
                  <h2>
                    {mode ===
                    "create"
                      ? "Add artist"
                      : form.name ||
                        "Unnamed artist"}
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
                <label className="soyo-admin-field soyo-admin-field-wide">
                  <span>
                    Artist ID *
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
                        event
                          .target
                          .value
                      )
                    }
                    disabled={
                      mode ===
                      "edit"
                    }
                    required
                    placeholder="artist-name"
                  />
                  {mode ===
                  "create" ? (
                    <small>
                      Lowercase letters,
                      numbers and hyphens.
                    </small>
                  ) : null}
                </label>

                <label className="soyo-admin-field soyo-admin-field-wide">
                  <span>
                    Name *
                  </span>
                  <input
                    type="text"
                    value={
                      form.name
                    }
                    onChange={(
                      event
                    ) =>
                      setField(
                        "name",
                        event
                          .target
                          .value
                      )
                    }
                    required
                  />
                </label>

                <label className="soyo-admin-field">
                  <span>
                    Location
                  </span>
                  <input
                    type="text"
                    value={
                      form.location
                    }
                    onChange={(
                      event
                    ) =>
                      setField(
                        "location",
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="Hangzhou, China"
                  />
                </label>

                <label className="soyo-admin-field">
                  <span>
                    Discipline
                  </span>
                  <input
                    type="text"
                    value={
                      form.discipline
                    }
                    onChange={(
                      event
                    ) =>
                      setField(
                        "discipline",
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="Painting"
                  />
                </label>

                <div className="soyo-admin-field soyo-admin-field-wide">
                  <span>
                    Artist image *
                  </span>

                  <div className="soyo-admin-image-uploader soyo-admin-artist-image-uploader">
                    <div className="soyo-admin-image-preview">
                      {visibleImage ? (
                        <Image
                          src={
                            visibleImage
                          }
                          alt={
                            form.name ||
                            "Artist preview"
                          }
                          fill
                          sizes="(max-width: 760px) 100vw, 320px"
                          unoptimized={
                            visibleImage.startsWith(
                              "blob:"
                            )
                          }
                        />
                      ) : (
                        <div className="soyo-admin-image-placeholder">
                          NO IMAGE
                        </div>
                      )}
                    </div>

                    <div className="soyo-admin-image-upload-copy">
                      <strong>
                        {imageFile
                          ? imageFile.name
                          : form.image
                            ? "Current artist image"
                            : "Choose an artist image"}
                      </strong>

                      <p>
                        JPG, PNG, WEBP or AVIF.
                        Maximum 10 MB.
                      </p>

                      {imageFile ? (
                        <small>
                          {formatFileSize(
                            imageFile.size
                          )}
                          {" · "}
                          This image will upload when you save.
                        </small>
                      ) : null}

                      <div className="soyo-admin-image-upload-actions">
                        <label className="soyo-admin-secondary-button soyo-admin-image-choose-button">
                          {form.image
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

                <label className="soyo-admin-field soyo-admin-field-wide">
                  <span>
                    Statement
                  </span>
                  <textarea
                    rows={4}
                    value={
                      form.statement
                    }
                    onChange={(
                      event
                    ) =>
                      setField(
                        "statement",
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="A concise introduction to the artist's practice."
                  />
                </label>

                <label className="soyo-admin-field soyo-admin-field-wide">
                  <span>
                    Biography
                  </span>
                  <textarea
                    rows={8}
                    value={
                      form.bio
                    }
                    onChange={(
                      event
                    ) =>
                      setField(
                        "bio",
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="Artist biography, background and practice."
                  />
                </label>
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
                      : "Delete artist"}
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
                      href={`/artists/${selectedId}`}
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
                      deleting ||
                      uploading
                    }
                  >
                    {uploading
                      ? "Uploading image…"
                      : saving
                        ? "Saving…"
                        : mode ===
                            "create"
                          ? "Create artist"
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
