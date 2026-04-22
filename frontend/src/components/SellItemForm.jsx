import { useEffect, useRef, useState } from "react";
import SmartImage from "./SmartImage";
import {
  hasValidationErrors,
  validatePrice,
  validateRequiredText,
} from "../utils/validation";

const MAX_IMAGES = 3;

const initialFormState = {
  title: "",
  price: "",
  category: "Electronics",
  listingState: "active",
  location: "",
  description: "",
  tags: "",
};

function SellItemForm({ onAddItem, onBack, currentUser, isSubmitting = false }) {
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const imagePreviewsRef = useRef([]);

  const revokePreviewUrls = (previews) => {
    previews.forEach((preview) => {
      if (String(preview).startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    });
  };

  const validateForm = (values) => ({
    title: validateRequiredText(values.title, "Item title", 3),
    price: validatePrice(values.price),
    location: validateRequiredText(values.location, "Pickup location", 3),
    description: validateRequiredText(values.description, "Description", 20),
    images: values.imageFiles?.length ? "" : "Add at least 1 primary image.",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: validateForm({
        ...formData,
        [name]: value,
        imageFiles,
      })[name],
    }));
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: validateForm({
        ...formData,
        [name]: value,
        imageFiles,
      })[name],
    }));
  };

  useEffect(() => {
    imagePreviewsRef.current = imagePreviews;
  }, [imagePreviews]);

  useEffect(() => () => revokePreviewUrls(imagePreviewsRef.current), []);

  const handleImageChange = (event) => {
    const nextFiles = Array.from(event.target.files ?? []).slice(0, MAX_IMAGES);

    revokePreviewUrls(imagePreviews);
    setImageFiles(nextFiles);
    setImagePreviews(nextFiles.map((file) => URL.createObjectURL(file)));
    setErrors((currentErrors) => ({
      ...currentErrors,
      images: nextFiles.length ? "" : "Add at least 1 primary image.",
    }));
    event.target.value = "";
  };

  const handleRemoveImage = (indexToRemove) => {
    const nextFiles = imageFiles.filter((_, index) => index !== indexToRemove);
    const nextPreviews = imagePreviews.filter((_, index) => index !== indexToRemove);
    const removedPreview = imagePreviews[indexToRemove];

    if (String(removedPreview).startsWith("blob:")) {
      URL.revokeObjectURL(removedPreview);
    }

    setImageFiles(nextFiles);
    setImagePreviews(nextPreviews);
    setErrors((currentErrors) => ({
      ...currentErrors,
      images: nextFiles.length ? "" : "Add at least 1 primary image.",
    }));
  };

  const handleMakePrimary = (indexToPromote) => {
    if (indexToPromote <= 0 || indexToPromote >= imageFiles.length) {
      return;
    }

    const nextFiles = [...imageFiles];
    const nextPreviews = [...imagePreviews];
    const [primaryFile] = nextFiles.splice(indexToPromote, 1);
    const [primaryPreview] = nextPreviews.splice(indexToPromote, 1);
    nextFiles.unshift(primaryFile);
    nextPreviews.unshift(primaryPreview);
    setImageFiles(nextFiles);
    setImagePreviews(nextPreviews);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateForm({
      ...formData,
      imageFiles,
    });

    setErrors(nextErrors);

    if (hasValidationErrors(nextErrors)) {
      return;
    }

    const newItem = {
      title: formData.title.trim(),
      price: Number(formData.price),
      category: formData.category,
      listingState: formData.listingState,
      location: formData.location.trim(),
      description: formData.description.trim(),
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
      seller: {
        id: currentUser.id,
        name: currentUser.name,
        status: "just posted",
        phone: currentUser.phone,
      },
    };

    const result = await onAddItem(newItem, imageFiles);
    if (!result?.ok) {
      return;
    }

    revokePreviewUrls(imagePreviews);
    setFormData(initialFormState);
    setErrors({});
    setImageFiles([]);
    setImagePreviews([]);
  };

  return (
    <section className="sell-section" id="sell-form">
      <div className="section-heading sell-heading">
        <div>
          <span className="section-label">Sell on Kibu</span>
          <h2>Post an item in a minute</h2>
        </div>
        <p>
          Add between 1 and 3 photos, keep the best one first as the primary image,
          and your listing appears instantly for nearby students to discover.
        </p>
      </div>

      <div className="sell-page-actions">
        <button type="button" className="secondary-btn" onClick={onBack}>
          Back to marketplace
        </button>
      </div>

      <form className="sell-form" onSubmit={handleSubmit}>
        <label className={errors.title ? "form-field form-field-wide has-error" : "form-field form-field-wide"}>
          <span>Item title</span>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="HP EliteBook, study chair, sneakers..."
            aria-invalid={Boolean(errors.title)}
          />
          {errors.title ? <small className="form-field-error">{errors.title}</small> : null}
        </label>

        <label className={errors.price ? "form-field has-error" : "form-field"}>
          <span>Price (KES)</span>
          <input
            type="number"
            min="1"
            name="price"
            value={formData.price}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="2500"
            aria-invalid={Boolean(errors.price)}
          />
          {errors.price ? <small className="form-field-error">{errors.price}</small> : null}
        </label>

        <label className="form-field">
          <span>Category</span>
          <select name="category" value={formData.category} onChange={handleChange}>
            <option>Electronics</option>
            <option>Books & Calculators</option>
            <option>Clothes & Shoes</option>
            <option>Beds & Bedding</option>
            <option>Furniture</option>
            <option>Accessories</option>
          </select>
        </label>

        <label className="form-field">
          <span>Listing status</span>
          <select name="listingState" value={formData.listingState} onChange={handleChange}>
            <option value="draft">Draft</option>
            <option value="paused">Paused</option>
            <option value="active">Active</option>
            <option value="sold">Sold</option>
          </select>
        </label>

        <label className={errors.location ? "form-field has-error" : "form-field"}>
          <span>Pickup location</span>
          <input
            name="location"
            value={formData.location}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Hostel B, main gate, admin block..."
            aria-invalid={Boolean(errors.location)}
          />
          {errors.location ? <small className="form-field-error">{errors.location}</small> : null}
        </label>

        <div className="form-field">
          <span>Seller account</span>
          <div className="form-readonly">
            <strong>{currentUser.name}</strong>
            <small>{currentUser.email}</small>
          </div>
        </div>

        <label className={errors.images ? "form-field form-field-wide has-error" : "form-field form-field-wide"}>
          <span>Upload images</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />
          <small>Choose 1 to 3 images. The first image is the primary cover photo.</small>
          {errors.images ? <small className="form-field-error">{errors.images}</small> : null}
        </label>

        {imagePreviews.length > 0 ? (
          <div className="image-upload-preview">
            {imagePreviews.map((preview, index) => (
              <div key={preview + '-' + index} className="image-upload-preview-item">
                <SmartImage src={preview} alt={`Listing preview ${index + 1}`} />
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

        <label className={errors.description ? "form-field form-field-wide has-error" : "form-field form-field-wide"}>
          <span>Description</span>
          <textarea
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Condition, what is included, and why someone should grab it."
            aria-invalid={Boolean(errors.description)}
          />
          {errors.description ? (
            <small className="form-field-error">{errors.description}</small>
          ) : null}
        </label>

        <label className="form-field form-field-wide">
          <span>Tags</span>
          <input
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="laptop, coding, hostel"
          />
        </label>

        <div className="sell-form-footer">
          <div className="sell-note">
            <strong>Tip</strong>
            <span>Clear photos and honest descriptions usually get faster replies.</span>
          </div>
          <button type="submit" className="primary-btn" disabled={isSubmitting}>
            {isSubmitting ? "Publishing..." : "Publish listing"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default SellItemForm;
