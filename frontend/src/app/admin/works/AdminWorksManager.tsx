"use client";

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

type ArtworkStatus =
  | "available"
  | "reserved"
  | "sold";

type Artwork = {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  location: string;
  year: string;
  material: string;
  dimensions: string;
  category: string;
  edition: string;
  priceAmount: number | null;
  currency: string;
  price: string;
  status: ArtworkStatus;
  image: string;
  description: string;
  exhibitionIds: string[];
};

type Artist = {
  id: string;
  name: string;
};

type ArtworkApiResponse = {
  ok?: boolean;
  artworks?: Artwork[];
  artwork?: Artwork;
  deletedId?: string;
  error?: string;
};

type ArtistListResponse = {
  ok?: boolean;
  artists?: Artist[];
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

type ArtworkFormState = {
  id: string;
  title: string;
  artistId: string;
  location: string;
  year: string;
  material: string;
  dimensions: string;
  category: string;
  edition: string;
  priceAmount: string;
  currency: string;
  status: ArtworkStatus;
  image: string;
  description: string;
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

const emptyForm: ArtworkFormState = {
  id: "",
  title: "",
  artistId: "",
  location: "",
  year: "",
  material: "",
  dimensions: "",
  category: "",
  edition: "",
  priceAmount: "",
  currency: "KRW",
  status: "available",
  image: "",
  description: "",
};

function artworkToForm(
  artwork: Artwork
): ArtworkFormState {
  return {
    id:
      artwork.id,
    title:
      artwork.title,
    artistId:
      artwork.artistId,
    location:
      artwork.location,
    year:
      artwork.year,
    material:
      artwork.material,
    dimensions:
      artwork.dimensions,
    category:
      artwork.category,
    edition:
      artwork.edition,
    priceAmount:
      artwork.priceAmount === null
        ? ""
        : String(
            artwork.priceAmount
          ),
    currency:
      artwork.currency || "KRW",
    status:
      artwork.status,
    image:
      artwork.image,
    description:
      artwork.description,
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

export default function AdminWorksManager() {
  const router =
    useRouter();

  const [
    artworks,
    setArtworks,
  ] = useState<Artwork[]>([]);

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
  ] = useState<string | null>(
    null
  );

  const [
    form,
    setForm,
  ] =
    useState<ArtworkFormState>(
      emptyForm
    );

  const [
    imageFile,
    setImageFile,
  ] = useState<File | null>(
    null
  );

  const [
    localPreviewUrl,
    setLocalPreviewUrl,
  ] = useState("");

  useEffect(() => {
    return () => {
      if (
        localPreviewUrl.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          localPreviewUrl
        );
      }
    };
  }, [localPreviewUrl]);

  const selectedArtwork =
    useMemo(
      () =>
        artworks.find(
          (artwork) =>
            artwork.id ===
            selectedId
        ) || null,
      [
        artworks,
        selectedId,
      ]
    );

  const previewUrl =
    localPreviewUrl ||
    form.image;

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
            artworkResponse,
            artistResponse,
          ] =
            await Promise.all([
              fetch(
                `${API_BASE_URL}/api/admin/artworks`,
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
            ]);

          if (
            artworkResponse.status ===
            401
          ) {
            router.replace(
              "/admin/login"
            );
            return;
          }

          const artworkResult =
            (await artworkResponse
              .json()
              .catch(
                () => null
              )) as
              | ArtworkApiResponse
              | null;

          const artistResult =
            (await artistResponse
              .json()
              .catch(
                () => null
              )) as
              | ArtistListResponse
              | null;

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

          setArtworks(
            artworkResult.artworks
          );

          setArtists(
            artistResult.artists.map(
              (artist) => ({
                id:
                  artist.id,
                name:
                  artist.name,
              })
            )
          );
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load the admin workspace."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        router,
      ]
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

  function clearPendingImage() {
    setImageFile(null);
    setLocalPreviewUrl("");
  }

  function startCreate() {
    clearPendingImage();
    setMode("create");
    setSelectedId(null);
    setForm({
      ...emptyForm,
      artistId:
        artists[0]?.id || "",
    });
    setError("");
    setNotice("");
  }

  function startEdit(
    artwork: Artwork
  ) {
    clearPendingImage();
    setMode("edit");
    setSelectedId(
      artwork.id
    );
    setForm(
      artworkToForm(
        artwork
      )
    );
    setError("");
    setNotice("");
  }

  function closeEditor() {
    clearPendingImage();
    setMode("idle");
    setSelectedId(null);
    setForm(
      emptyForm
    );
    setError("");
    setNotice("");
  }

  function setField<
    Key extends keyof ArtworkFormState
  >(
    key: Key,
    value: ArtworkFormState[Key]
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]:
          value,
      })
    );
  }

  function handleImageSelection(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    event.target.value =
      "";

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
        "Please choose a JPG, PNG, WEBP or AVIF image."
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

    setImageFile(file);
    setLocalPreviewUrl(
      URL.createObjectURL(
        file
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

    setUploading(true);

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/api/admin/artworks/upload-image`,
          {
            method:
              "POST",
            credentials:
              "include",
            body:
              data,
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
            "The image could not be uploaded."
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
        `${API_BASE_URL}/api/admin/artworks/upload-image`,
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
      // Cleanup is best-effort only.
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

    if (
      !imageFile &&
      !form.image
    ) {
      setError(
        "Please choose an artwork image."
      );
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    let newlyUploadedUrl =
      "";

    try {
      const image =
        imageFile
          ? await uploadImage(
              imageFile
            )
          : form.image;

      if (imageFile) {
        newlyUploadedUrl =
          image;
      }

      const payload = {
        ...(mode === "create"
          ? {
              id:
                form.id,
            }
          : {}),
        title:
          form.title,
        artistId:
          form.artistId,
        location:
          form.location,
        year:
          form.year,
        material:
          form.material,
        dimensions:
          form.dimensions,
        category:
          form.category,
        edition:
          form.edition,
        priceAmount:
          form.priceAmount === ""
            ? null
            : Number(
                form.priceAmount
              ),
        currency:
          form.currency,
        status:
          form.status,
        image,
        description:
          form.description,
      };

      const url =
        mode === "create"
          ? `${API_BASE_URL}/api/admin/artworks`
          : `${API_BASE_URL}/api/admin/artworks/${encodeURIComponent(
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
        if (
          newlyUploadedUrl
        ) {
          await cleanupUploadedImage(
            newlyUploadedUrl
          );
        }

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
          | ArtworkApiResponse
          | null;

      if (
        !response.ok ||
        !result?.ok
      ) {
        if (
          newlyUploadedUrl
        ) {
          await cleanupUploadedImage(
            newlyUploadedUrl
          );
        }

        throw new Error(
          result?.error ||
            "The artwork could not be saved."
        );
      }

      setNotice(
        mode === "create"
          ? "Artwork created."
          : "Artwork updated."
      );

      const savedId =
        result.artwork?.id ||
        selectedId ||
        form.id;

      clearPendingImage();

      await loadData();

      if (
        result.artwork
      ) {
        setMode("edit");
        setSelectedId(
          savedId
        );
        setForm(
          artworkToForm(
            result.artwork
          )
        );
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The artwork could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !selectedArtwork ||
      deleting
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${selectedArtwork.title}"?\n\nThis removes the artwork record from SOYO.`
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
          `${API_BASE_URL}/api/admin/artworks/${encodeURIComponent(
            selectedArtwork.id
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
          | ArtworkApiResponse
          | null;

      if (
        !response.ok ||
        !result?.ok
      ) {
        throw new Error(
          result?.error ||
            "The artwork could not be deleted."
        );
      }

      closeEditor();
      await loadData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "The artwork could not be deleted."
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="soyo-admin-dashboard-loading">
        Loading works…
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

      <section className="soyo-admin-works-heading">
        <div>
          <p>
            CONTENT MANAGEMENT · WORKS
          </p>
          <h1>
            Works
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
            Add artwork
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
              {artworks.length} works
            </span>
            <span>
              Select a record to edit
            </span>
          </div>

          <div className="soyo-admin-works-list">
            {artworks.length === 0 ? (
              <div className="soyo-admin-works-empty">
                No artworks yet.
              </div>
            ) : (
              artworks.map(
                (
                  artwork,
                  index
                ) => (
                  <button
                    type="button"
                    className={`soyo-admin-work-row${
                      artwork.id ===
                      selectedId
                        ? " is-active"
                        : ""
                    }`}
                    key={
                      artwork.id
                    }
                    onClick={() =>
                      startEdit(
                        artwork
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

                    <span className="soyo-admin-work-main">
                      <strong>
                        {
                          artwork.title
                        }
                      </strong>
                      <small>
                        {
                          artwork.artist
                        }
                      </small>
                    </span>

                    <span className="soyo-admin-work-price">
                      {
                        artwork.price
                      }
                    </span>

                    <span
                      className={`soyo-admin-status-pill is-${artwork.status}`}
                    >
                      {
                        artwork.status
                      }
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
                WORK RECORD
              </span>
              <h2>
                Select a work
                <br />
                to manage.
              </h2>
              <p>
                Edit artwork images,
                pricing, availability and
                metadata here.
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
                      ? "NEW WORK"
                      : "EDIT WORK"}
                  </span>
                  <h2>
                    {mode ===
                    "create"
                      ? "Add artwork"
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
                <div className="soyo-admin-field soyo-admin-field-wide">
                  <span>
                    Artwork image *
                  </span>

                  <div className="soyo-admin-image-uploader">
                    <div className="soyo-admin-image-preview">
                      {previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            previewUrl
                          }
                          alt={
                            form.title ||
                            "Artwork preview"
                          }
                        />
                      ) : (
                        <div className="soyo-admin-image-placeholder">
                          <span>
                            NO IMAGE
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="soyo-admin-image-upload-copy">
                      <strong>
                        {imageFile
                          ? imageFile.name
                          : form.image
                            ? "Current artwork image"
                            : "Choose an artwork image"}
                      </strong>

                      <p>
                        JPG, PNG, WEBP or AVIF · Maximum 10 MB
                      </p>

                      {imageFile ? (
                        <small>
                          {formatFileSize(
                            imageFile.size
                          )} selected. It will upload when you save the artwork.
                        </small>
                      ) : form.image ? (
                        <small>
                          Choose a new file only if you want to replace the current image.
                        </small>
                      ) : (
                        <small>
                          The selected file will be stored in SOYO media storage.
                        </small>
                      )}

                      <div className="soyo-admin-image-upload-actions">
                        <label
                          className="soyo-admin-secondary-button soyo-admin-image-choose-button"
                          htmlFor="soyo-artwork-image-file"
                        >
                          {imageFile || form.image
                            ? "Replace image"
                            : "Choose image"}
                        </label>

                        {imageFile ? (
                          <button
                            type="button"
                            className="soyo-admin-text-button"
                            onClick={
                              clearPendingImage
                            }
                          >
                            Undo selection
                          </button>
                        ) : null}
                      </div>

                      <input
                        id="soyo-artwork-image-file"
                        className="soyo-admin-image-file-input"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        onChange={
                          handleImageSelection
                        }
                      />
                    </div>
                  </div>
                </div>

                <label className="soyo-admin-field soyo-admin-field-wide">
                  <span>
                    Artwork ID *
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
                    placeholder="example-work"
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
                        event
                          .target
                          .value
                      )
                    }
                    required
                  />
                </label>

                <label className="soyo-admin-field soyo-admin-field-wide">
                  <span>
                    Artist *
                  </span>
                  <select
                    value={
                      form.artistId
                    }
                    onChange={(
                      event
                    ) =>
                      setField(
                        "artistId",
                        event
                          .target
                          .value
                      )
                    }
                    required
                  >
                    <option value="">
                      Select artist
                    </option>
                    {artists.map(
                      (artist) => (
                        <option
                          value={
                            artist.id
                          }
                          key={
                            artist.id
                          }
                        >
                          {
                            artist.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label className="soyo-admin-field">
                  <span>
                    Status
                  </span>
                  <select
                    value={
                      form.status
                    }
                    onChange={(
                      event
                    ) =>
                      setField(
                        "status",
                        event
                          .target
                          .value as ArtworkStatus
                      )
                    }
                  >
                    <option value="available">
                      Available
                    </option>
                    <option value="reserved">
                      Reserved
                    </option>
                    <option value="sold">
                      Sold
                    </option>
                  </select>
                </label>

                <label className="soyo-admin-field">
                  <span>
                    Price
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={
                      form.priceAmount
                    }
                    onChange={(
                      event
                    ) =>
                      setField(
                        "priceAmount",
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="1200000"
                  />
                </label>

                <label className="soyo-admin-field">
                  <span>
                    Currency
                  </span>
                  <input
                    type="text"
                    maxLength={3}
                    value={
                      form.currency
                    }
                    onChange={(
                      event
                    ) =>
                      setField(
                        "currency",
                        event
                          .target
                          .value
                          .toUpperCase()
                      )
                    }
                    required
                  />
                </label>

                <label className="soyo-admin-field">
                  <span>
                    Year
                  </span>
                  <input
                    type="text"
                    value={
                      form.year
                    }
                    onChange={(
                      event
                    ) =>
                      setField(
                        "year",
                        event
                          .target
                          .value
                      )
                    }
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
                  />
                </label>

                <label className="soyo-admin-field soyo-admin-field-wide">
                  <span>
                    Material
                  </span>
                  <input
                    type="text"
                    value={
                      form.material
                    }
                    onChange={(
                      event
                    ) =>
                      setField(
                        "material",
                        event
                          .target
                          .value
                      )
                    }
                  />
                </label>

                <label className="soyo-admin-field">
                  <span>
                    Dimensions
                  </span>
                  <input
                    type="text"
                    value={
                      form.dimensions
                    }
                    onChange={(
                      event
                    ) =>
                      setField(
                        "dimensions",
                        event
                          .target
                          .value
                      )
                    }
                  />
                </label>

                <label className="soyo-admin-field">
                  <span>
                    Category
                  </span>
                  <input
                    type="text"
                    value={
                      form.category
                    }
                    onChange={(
                      event
                    ) =>
                      setField(
                        "category",
                        event
                          .target
                          .value
                      )
                    }
                  />
                </label>

                <label className="soyo-admin-field">
                  <span>
                    Edition
                  </span>
                  <input
                    type="text"
                    value={
                      form.edition
                    }
                    onChange={(
                      event
                    ) =>
                      setField(
                        "edition",
                        event
                          .target
                          .value
                      )
                    }
                  />
                </label>

                <label className="soyo-admin-field soyo-admin-field-wide">
                  <span>
                    Description
                  </span>
                  <textarea
                    rows={6}
                    value={
                      form.description
                    }
                    onChange={(
                      event
                    ) =>
                      setField(
                        "description",
                        event
                          .target
                          .value
                      )
                    }
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
                      : "Delete work"}
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
                      href={`/works/${selectedId}`}
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
                          ? "Create artwork"
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
