import { useEffect, useState } from "react";
import {
  hasValidationErrors,
  validatePrice,
  validateRequiredText,
} from "../utils/validation";

function MyListingsScreen({
  products,
  currentUser,
  onBack,
  onCreateListing,
  onViewListing,
  onDeleteListing,
  onChangeListingStatus,
  onUpdateListing,
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
    image: "",
  });
  const [editErrors, setEditErrors] = useState({});

  useEffect(() => {
    if (!editingId) {
      return;
    }

    const activeProduct = ownedListings.find((product) => product.id === editingId);
    if (!activeProduct) {
      setEditingId(null);
    }
  }, [editingId, ownedListings]);

  const startEditing = (product) => {
    setEditingId(product.id);
    setEditForm({
      title: product.title,
      price: String(product.price),
      description: product.description,
      listingState: product.listingState ?? "active",
      image: product.image,
    });
    setEditErrors({});
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({
      title: "",
      price: "",
      description: "",
      listingState: "active",
      image: "",
    });
    setEditErrors({});
  };

  const validateEditForm = (values) => ({
    title: validateRequiredText(values.title, "Title", 3),
    price: validatePrice(values.price),
    description: validateRequiredText(values.description, "Description", 20),
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
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setEditForm((current) => ({
        ...current,
        image: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = (productId) => {
    const nextErrors = validateEditForm(editForm);

    setEditErrors(nextErrors);

    if (hasValidationErrors(nextErrors)) {
      return;
    }

    onUpdateListing(productId, {
      title: editForm.title.trim(),
      price: Number(editForm.price),
      description: editForm.description.trim(),
      listingState: editForm.listingState,
      image: editForm.image,
    });
    cancelEditing();
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
              <img
                src={editingId === product.id ? editForm.image : product.image}
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

                    <label className="form-field">
                      <span>Update image</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} />
                    </label>

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
                      >
                        Save changes
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
                      >
                        Draft
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => onChangeListingStatus(product.id, "paused")}
                      >
                        Pause
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => onChangeListingStatus(product.id, "active")}
                      >
                        Activate
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => onChangeListingStatus(product.id, "sold")}
                      >
                        Mark sold
                      </button>
                      <button
                        type="button"
                        className="danger-btn"
                        onClick={() => onDeleteListing(product.id)}
                      >
                        Delete
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
