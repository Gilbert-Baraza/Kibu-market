import { useEffect, useRef, useState } from "react";
import SmartImage from "./SmartImage";
import {
  hasValidationErrors,
  validatePrice,
  validateRequiredText,
} from "../utils/validation";

const MAX_IMAGES = 3;

function MyListingsScreen({
  products,
  currentUser,
  onBack,
  onCreateListing,
  onViewListing,
  onDeleteListing,
  onChangeListingStatus,
  onUpdateListing,
  pendingActionId = null,
}) {
  const ownedListings = products.filter(
    (product) => product.seller?.id === currentUser?.id,
  );
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    price: "",
    description: "",
    listingState: "active",
    images: [],
  });
  const [editErrors, setEditErrors] = useState({});
  const [editImageFiles, setEditImageFiles] = useState([]);
  const [editImagePreviews, setEditImagePreviews] = useState([]);
  const editImagePreviewsRef = useRef([]);

  const revokePreviewUrls = (previews) => {
    previews.forEach((preview) => {
      if (String(preview).startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    });
  };

  useEffect(() => {
    editImagePreviewsRef.current = editImagePreviews;
  }, [editImagePreviews]);

  useEffect(() => () => revokePreviewUrls(editImagePreviewsRef.current), []);

  const getProductImages = (product) => {
    const gallery = Array.isArray(product.gallery) && product.gallery.length > 0
      ? product.gallery
      : product.image
        ? [product.image]
        : [];

    return gallery.slice(0, MAX_IMAGES);
  };

  const resetEditState = () => {
    setEditingId(null);
    setEditForm({
      title: "",
      price: "",
      description: "",
      listingState: "active",
      images: [],
    });
    setEditErrors({});
    setEditImageFiles([]);
    setEditImagePreviews([]);
  };

  const startEditing = (product) => {
    revokePreviewUrls(editImagePreviews);
    const productImages = getProductImages(product);

    setEditingId(product.id);
    setEditForm({
      title: product.title,
      price: String(product.price),
      description: product.description,
      listingState: product.listingState ?? "active",
      images: productImages,
    });
    setEditErrors({});
    setEditImageFiles([]);
    setEditImagePreviews(productImages);
  };

  const cancelEditing = () => {
    revokePreviewUrls(editImagePreviews);
    resetEditState();
  };

  const validateEditForm = (values) => ({
    title: validateRequiredText(values.title, "Title", 3),
    price: validatePrice(values.price),
    description: validateRequiredText(values.description, "Description", 20),
    images: values.images?.length ? "" : "Keep at least 1 primary image.",
  });

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));
    setEditErrors((current) => ({
      ...current,
      [name]: validateEditForm({
        ...editForm,
        [name]: value,
      })[name],
    }));
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files ?? []).slice(0, MAX_IMAGES);
    if (files.length === 0) {
      return;
    }

    revokePreviewUrls(editImagePreviews);
    const previews = files.map((file) => URL.createObjectURL(file));

    setEditImageFiles(files);
    setEditImagePreviews(previews);
    setEditForm((current) => ({
      ...current,
      images: previews,
    }));
    setEditErrors((current) => ({
      ...current,
      images: "",
    }));
    event.target.value = "";
  };

  const handleRemoveImage = (indexToRemove) => {
    const removedPreview = editImagePreviews[indexToRemove];
    if (String(removedPreview).startsWith("blob:")) {
      URL.revokeObjectURL(removedPreview);
    }

    const nextFiles = editImageFiles.filter((_, index) => index !== indexToRemove);
    const nextPreviews = editImagePreviews.filter((_, index) => index !== indexToRemove);

    setEditImageFiles(nextFiles);
    setEditImagePreviews(nextPreviews);
    setEditForm((current) => ({
      ...current,
      images: nextPreviews,
    }));
    setEditErrors((current) => ({
      ...current,
      images: nextPreviews.length ? "" : "Keep at least 1 primary image.",
    }));
  };

  const handleMakePrimary = (indexToPromote) => {
    if (indexToPromote <= 0 || indexToPromote >= editImagePreviews.length) {
      return;
    }

    const nextFiles = [...editImageFiles];
    const nextPreviews = [...editImagePreviews];
    const [primaryPreview] = nextPreviews.splice(indexToPromote, 1);
    nextPreviews.unshift(primaryPreview);

    if (nextFiles.length === nextPreviews.length) {
      const [primaryFile] = nextFiles.splice(indexToPromote, 1);
      nextFiles.unshift(primaryFile);
    }

    setEditImageFiles(nextFiles);
    setEditImagePreviews(nextPreviews);
    setEditForm((current) => ({
      ...current,
      images: nextPreviews,
    }));
  };

  const handleSaveEdit = async (productId) => {
    const nextErrors = validateEditForm({
      ...editForm,
      images: editImagePreviews,
    });

    setEditErrors(nextErrors);

    if (hasValidationErrors(nextErrors)) {
      return;
    }

    const result = await onUpdateListing(
      productId,
      {
        title: editForm.title.trim(),
        price: Number(editForm.price),
        description: editForm.description.trim(),
        listingState: editForm.listingState,
        images: editImagePreviews,
      },
      editImageFiles,
    );
    if (result?.ok) {
      cancelEditing();
    }
  };

  const getListingStatusLabel = (listingState) => {
    switch (listingState) {
      case "draft":
        return "Draft";
      case "paused":
        return "Paused";
      case "sold":
        return "Sold";
      default:
        return "Active";
    }
  };

  const isPending = (productId, action) => pendingActionId === `${productId}:${action}`;

  return (
    <section className="my-listings-screen">
      <div className="messages-header">
        <div>
          <span className="section-label">Seller dashboard</span>
          <h2>My listings</h2>
        </div>
        <div className="my-listings-actions">
          <button type="button" className="secondary-btn" onClick={onBack}>
            Back to marketplace
          </button>
          <button type="button" className="primary-btn" onClick={onCreateListing}>
            Add new listing
          </button>
        </div>
      </div>

      {ownedListings.length === 0 ? (
        <div className="empty-state">
          <span className="section-label">No listings yet</span>
          <h3>You have not posted anything yet.</h3>
          <p>Create your first listing and it will appear here for quick management.</p>
        </div>
      ) : (
        <div className="my-listings-grid">
          {ownedListings.map((product) => (
            <article key={product.id} className="my-listing-card">
              <SmartImage
                src={
                  editingId === product.id
                    ? editImagePreviews[0]
                    : (product.imageVariants?.card ?? product.image)
                }
                alt={product.title}
                className="my-listing-image"
              />
              <div className="my-listing-body">
                <div className="my-listing-topline">
                  <span className="product-category">{product.category}</span>
                  {editingId === product.id ? (
                    <select
                      name="listingState"
                      value={editForm.listingState}
                      onChange={handleEditChange}
                      className="listing-status-select"
                    >
                      <option value="draft">Draft</option>
                      <option value="paused">Paused</option>
                      <option value="active">Active</option>
                      <option value="sold">Sold</option>
                    </select>
                  ) : (
                    <span
                      className={`listing-status ${product.listingState ?? "active"}`}
                    >
                      {getListingStatusLabel(product.listingState)}
                    </span>
                  )}
                </div>

                {editingId === product.id ? (
                  <div className="my-listing-edit-form">
                    <label className={editErrors.title ? "form-field has-error" : "form-field"}>
                      <span>Title</span>
                      <input
                        name="title"
                        value={editForm.title}
                        onChange={handleEditChange}
                        aria-invalid={Boolean(editErrors.title)}
                      />
                      {editErrors.title ? (
                        <small className="form-field-error">{editErrors.title}</small>
                      ) : null}
                    </label>

                    <label className={editErrors.price ? "form-field has-error" : "form-field"}>
                      <span>Price</span>
                      <input
                        type="number"
                        min="1"
                        name="price"
                        value={editForm.price}
                        onChange={handleEditChange}
                        aria-invalid={Boolean(editErrors.price)}
                      />
                      {editErrors.price ? (
                        <small className="form-field-error">{editErrors.price}</small>
                      ) : null}
                    </label>

                    <label className={editErrors.images ? "form-field has-error" : "form-field"}>
                      <span>Update images</span>
                      <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
                      <small>Choose up to 3 replacement images. The first image is primary.</small>
                      {editErrors.images ? (
                        <small className="form-field-error">{editErrors.images}</small>
                      ) : null}
                    </label>

                    {editImagePreviews.length > 0 ? (
                      <div className="image-upload-preview">
                        {editImagePreviews.map((preview, index) => (
                          <div key={preview + index} className="image-upload-preview-item">
                            <SmartImage src={preview} alt={`${product.title} edit preview ${index + 1}`} />
                            <div className="image-upload-preview-actions">
                              <strong>{index === 0 ? "Primary image" : `Image ${index + 1}`}</strong>
                              <div>
                                {index > 0 ? (
                                  <button type="button" className="secondary-btn" onClick={() => handleMakePrimary(index)}>
                                    Make primary
                                  </button>
                                ) : null}
                                <button type="button" className="secondary-btn" onClick={() => handleRemoveImage(index)}>
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <label className={editErrors.description ? "form-field has-error" : "form-field"}>
                      <span>Description</span>
                      <textarea
                        name="description"
                        rows="4"
                        value={editForm.description}
                        onChange={handleEditChange}
                        aria-invalid={Boolean(editErrors.description)}
                      />
                      {editErrors.description ? (
                        <small className="form-field-error">{editErrors.description}</small>
                      ) : null}
                    </label>
                  </div>
                ) : (
                  <>
                    <h3>{product.title}</h3>
                    <p className="product-price">KES {product.price.toLocaleString()}</p>
                  </>
                )}
                <p className="product-location">{product.location}</p>
                <p className="product-description">
                  {editingId === product.id ? editForm.description : product.description}
                </p>

                <div className="my-listing-controls">
                  {editingId === product.id ? (
                    <>
                      <button
                        type="button"
                        className="primary-btn"
                        onClick={() => handleSaveEdit(product.id)}
                        disabled={isPending(product.id, "update")}
                      >
                        {isPending(product.id, "update") ? "Saving..." : "Save changes"}
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => onViewListing(product)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => startEditing(product)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => onChangeListingStatus(product.id, "draft")}
                        disabled={isPending(product.id, "status")}
                      >
                        Draft
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => onChangeListingStatus(product.id, "paused")}
                        disabled={isPending(product.id, "status")}
                      >
                        Pause
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => onChangeListingStatus(product.id, "active")}
                        disabled={isPending(product.id, "status")}
                      >
                        Activate
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => onChangeListingStatus(product.id, "sold")}
                        disabled={isPending(product.id, "status")}
                      >
                        Mark sold
                      </button>
                      <button
                        type="button"
                        className="danger-btn"
                        onClick={() => onDeleteListing(product.id)}
                        disabled={isPending(product.id, "delete")}
                      >
                        {isPending(product.id, "delete") ? "Deleting..." : "Delete"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default MyListingsScreen;
